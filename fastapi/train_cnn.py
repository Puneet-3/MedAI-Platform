"""Train an experimental MobileNetV2 X-ray classifier with held-out evaluation.

Use the verified PneumoniaMNIST-224 NPZ or NORMAL/PNEUMONIA image folders
under train/val/test. Frozen backbone features are cached for CPU training.
Test predictions are evaluated only after model selection and calibration.
"""
import argparse
from copy import deepcopy
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import random
import time

import numpy as np
from PIL import Image
from sklearn.metrics import accuracy_score, balanced_accuracy_score, confusion_matrix
from sklearn.metrics import f1_score, log_loss, precision_score, recall_score, roc_auc_score
import torch
from torch import nn
from torch.utils.data import DataLoader, Dataset, Subset, TensorDataset
import torchvision
from torchvision import datasets, models

from download_xray_dataset import MD5, checksums
from xray_pipeline import CLASS_NAMES, PREPROCESS_VERSION, configure_threads, preprocessing

BASE = Path(__file__).resolve().parent


class NPZImages(Dataset):
    def __init__(self, path, split, transform):
        with np.load(path, allow_pickle=False) as data:
            self.images = data[f"{split}_images"]
            self.targets = data[f"{split}_labels"].reshape(-1).astype(np.int64)
        if len(self.images) != len(self.targets) or set(np.unique(self.targets)) != {0, 1}:
            raise ValueError(f"Invalid {split} images or labels")
        self.transform = transform

    def __len__(self):
        return len(self.targets)

    def __getitem__(self, index):
        return self.transform(Image.fromarray(self.images[index])), int(self.targets[index])

    def fingerprint(self, index):
        return hashlib.sha256(self.images[index].tobytes()).hexdigest()


def metric_summary(labels, probabilities):
    predicted = probabilities.argmax(axis=1)
    tn, fp, fn, tp = confusion_matrix(labels, predicted, labels=[0, 1]).ravel()
    return {
        "samples": int(len(labels)), "accuracy": float(accuracy_score(labels, predicted)),
        "balanced_accuracy": float(balanced_accuracy_score(labels, predicted)),
        "auroc": float(roc_auc_score(labels, probabilities[:, 1])),
        "pneumonia_recall": float(recall_score(labels, predicted, zero_division=0)),
        "normal_specificity": float(tn / (tn + fp)),
        "pneumonia_precision": float(precision_score(labels, predicted, zero_division=0)),
        "pneumonia_f1": float(f1_score(labels, predicted, zero_division=0)),
        "negative_log_likelihood": float(log_loss(labels, probabilities, labels=[0, 1])),
        "brier_score": float(np.mean((probabilities[:, 1] - labels) ** 2)),
        "confusion_matrix": [[int(tn), int(fp)], [int(fn), int(tp)]],
        "class_order": CLASS_NAMES,
    }


def confidence_intervals(labels, probabilities, seed):
    generator = np.random.default_rng(seed)
    normal, pneumonia = np.flatnonzero(labels == 0), np.flatnonzero(labels == 1)
    accuracy, auc = [], []
    for _ in range(1000):
        indices = np.concatenate([generator.choice(normal, len(normal), replace=True), generator.choice(pneumonia, len(pneumonia), replace=True)])
        accuracy.append(float((probabilities[indices].argmax(axis=1) == labels[indices]).mean()))
        auc.append(float(roc_auc_score(labels[indices], probabilities[indices, 1])))
    return {"method": "1,000 stratified bootstrap resamples; percentile interval", "accuracy": np.percentile(accuracy, [2.5, 97.5]).tolist(), "auroc": np.percentile(auc, [2.5, 97.5]).tolist()}


def load_data(path, split):
    if path.is_file():
        return NPZImages(path, split, preprocessing())
    data = datasets.ImageFolder(path / split, transform=preprocessing())
    if data.classes != CLASS_NAMES:
        raise ValueError(f"{split} must contain exactly NORMAL and PNEUMONIA folders")
    return data


def image_fingerprint(data, index):
    if isinstance(data, NPZImages):
        return data.fingerprint(index)
    with Image.open(data.samples[index][0]) as image:
        image = image.convert("L")
        return hashlib.sha256(str(image.size).encode() + image.tobytes()).hexdigest()


def split_indices(path):
    seen, result, exclusions, original_counts = {}, {}, {}, {}
    # Keep the publisher's full test set; exclude its exact copies from fitting.
    for split in ["test", "val", "train"]:
        data = load_data(path, split)
        original_counts[split] = len(data)
        keep = []
        for index in range(len(data)):
            digest = image_fingerprint(data, index)
            label = int(data.targets[index])
            previous = seen.get(digest)
            if previous and previous[1] != label:
                raise ValueError("Identical images have conflicting labels")
            if split != "test" and previous:
                continue
            keep.append(index)
            seen[digest] = (split, label)
        counts = np.bincount(np.asarray(data.targets)[keep], minlength=2)
        if min(counts) < 10:
            raise ValueError(f"{split} needs at least 10 independent images per class")
        result[split] = keep
        exclusions[split] = len(data) - len(keep)
        print(f"{split}: {len(keep)} retained, {exclusions[split]} exact duplicate copies excluded, class counts {counts.tolist()}", flush=True)
        del data
    return result, exclusions, original_counts


def cached_features(network, path, split, indices, fingerprint, batch_size, device, cache_dir):
    cache_key = hashlib.sha256((fingerprint + split + PREPROCESS_VERSION + json.dumps(indices) + models.MobileNet_V2_Weights.DEFAULT.url).encode()).hexdigest()
    target = cache_dir / f"{split}-{cache_key[:20]}.pt"
    if target.exists():
        cached = torch.load(target, map_location="cpu", weights_only=True)
        if cached.get("cache_key") == cache_key and cached["features"].shape == (len(indices), 1280):
            print(f"Reusing {split} feature cache.", flush=True)
            return cached["features"], cached["labels"]
    data = load_data(path, split)
    loader = DataLoader(Subset(data, indices), batch_size=batch_size, shuffle=False, num_workers=0)
    features, labels = [], []
    started = time.monotonic()
    network.eval()
    with torch.no_grad():
        for index, (images, batch_labels) in enumerate(loader):
            encoded = network.features(images.to(device)).mean(dim=(2, 3)).cpu()
            features.append(encoded)
            labels.append(batch_labels)
            if index % 20 == 0 or index + 1 == len(loader):
                print(f"{split} features {index + 1}/{len(loader)} batches ({time.monotonic() - started:.0f}s)", flush=True)
    features, labels = torch.cat(features), torch.cat(labels)
    temporary = target.with_suffix(".tmp")
    torch.save({"cache_key": cache_key, "features": features, "labels": labels}, temporary)
    temporary.replace(target)
    return features, labels


def calibrate(logits, labels):
    # Validation data only; the test set remains untouched during calibration.
    log_temperature = torch.zeros(1, requires_grad=True)
    optimizer = torch.optim.LBFGS([log_temperature], lr=0.1, max_iter=60)
    def closure():
        optimizer.zero_grad()
        temperature = log_temperature.exp().clamp(0.05, 20)
        loss = nn.functional.cross_entropy(logits / temperature, labels)
        loss.backward()
        return loss
    optimizer.step(closure)
    temperature = float(log_temperature.detach().exp().clamp(0.05, 20))
    before = nn.functional.cross_entropy(logits, labels)
    after = nn.functional.cross_entropy(logits / temperature, labels)
    return temperature if after <= before else 1.0


def model_card(report, checkpoint_hash):
    metrics = report["test_metrics"]
    matrix = metrics["confusion_matrix"]
    return f'''# MedAI experimental X-ray model

- Architecture: MobileNetV2, ImageNet pretrained frozen backbone, trained two-class head.
- Dataset: {report['dataset']}; licence: {report['dataset_license']}.
- Evaluated population: {report['population']}.
- Source: {report['dataset_source']}.
- For PneumoniaMNIST: MedMNIST / Jiancheng Yang and collaborators; publisher-derived images and splits were used as documented.
- Labels: NORMAL, PNEUMONIA.
- Preprocessing: EXIF correction, grayscale RGB, centred square crop, 224 x 224 resize, ImageNet normalization.
- Fitting images: {report['training_samples']}; validation images: {report['validation_samples']}; held-out test images: {report['test_samples']}.
- Model selection: lowest validation cross-entropy; test labels are not used to select weights or calibration.
- Calibration temperature: {report['temperature']:.4f}, fitted using validation logits.
- Checkpoint SHA-256: `{checkpoint_hash}`.

## Held-out benchmark results

| Measure | Value |
| --- | ---: |
| Accuracy | {metrics['accuracy']:.4f} |
| Balanced accuracy | {metrics['balanced_accuracy']:.4f} |
| AUROC | {metrics['auroc']:.4f} |
| Pneumonia recall | {metrics['pneumonia_recall']:.4f} |
| Normal specificity | {metrics['normal_specificity']:.4f} |
| Pneumonia precision | {metrics['pneumonia_precision']:.4f} |
| Pneumonia F1 | {metrics['pneumonia_f1']:.4f} |

Confusion matrix (rows = reference, columns = predicted):

| | Predicted NORMAL | Predicted PNEUMONIA |
| --- | ---: | ---: |
| Reference NORMAL | {matrix[0][0]} | {matrix[0][1]} |
| Reference PNEUMONIA | {matrix[1][0]} | {matrix[1][1]} |

## Scope and limitations

This is an educational screening experiment, not a clinically validated diagnostic device.
The training population is pediatric; generalisation to adults, other hospitals, other diseases,
and different imaging protocols has not been established. It can return a label for an
unsupported photograph or non-X-ray input. Model scores are not clinical disease probabilities.
The benchmark does not supply patient identifiers, so patient-level split independence cannot
be audited here. Exact duplicate images were excluded from training/validation against the
held-out test partition; split membership was never reassigned. No test image is used to fit
the classifier or temperature. Review `evaluation.json` for counts, duplicate exclusions,
training history, software versions, and bootstrap intervals. A doctor must review every result.
'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--epochs", type=int, default=60)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--threads", type=int, default=4)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--patience", type=int, default=10)
    args = parser.parse_args()
    if min(args.epochs, args.batch_size, args.threads, args.patience) < 1:
        parser.error("Epochs, batch size, threads, and patience must be positive")
    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)
    configure_threads(args.threads)
    if args.data.is_file():
        md5, fingerprint = checksums(args.data)
        if md5 != MD5:
            raise ValueError("NPZ input must match the official PneumoniaMNIST-224 checksum")
        dataset_name = "PneumoniaMNIST-224"
    else:
        fingerprint = hashlib.sha256("".join(sorted(str(p.relative_to(args.data)) + str(p.stat().st_size) + str(p.stat().st_mtime_ns) for p in args.data.rglob("*") if p.is_file())).encode()).hexdigest()
        dataset_name = "Custom NORMAL/PNEUMONIA image folders"
    indices, exclusions, original_counts = split_indices(args.data)
    cache_dir = BASE / ".model-cache"
    cache_dir.mkdir(exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using {device}; {torch.get_num_threads()} CPU threads.", flush=True)
    weights = models.MobileNet_V2_Weights.DEFAULT
    network = models.mobilenet_v2(weights=weights)
    for parameter in network.parameters():
        parameter.requires_grad = False
    network.classifier[-1] = nn.Linear(1280, 2)
    network.to(device).eval()
    train_x, train_y = cached_features(network, args.data, "train", indices["train"], fingerprint, args.batch_size, device, cache_dir)
    val_x, val_y = cached_features(network, args.data, "val", indices["val"], fingerprint, args.batch_size, device, cache_dir)
    head = network.classifier.cpu()
    class_counts = torch.bincount(train_y, minlength=2)
    criterion = nn.CrossEntropyLoss(weight=len(train_y) / (2 * class_counts.float()))
    optimizer = torch.optim.AdamW(head.parameters(), lr=0.001, weight_decay=0.001)
    loader = DataLoader(TensorDataset(train_x, train_y), batch_size=128, shuffle=True, generator=torch.Generator().manual_seed(args.seed))
    best_loss, best_epoch, best_state = float("inf"), 0, None
    history = []
    for epoch in range(1, args.epochs + 1):
        head.train()
        total_loss = 0.0
        for features, labels in loader:
            optimizer.zero_grad()
            loss = criterion(head(features), labels)
            loss.backward()
            optimizer.step()
            total_loss += float(loss.detach()) * len(labels)
        head.eval()
        with torch.no_grad():
            logits = head(val_x)
            validation_loss = float(nn.functional.cross_entropy(logits, val_y))
            accuracy = float((logits.argmax(dim=1) == val_y).float().mean())
        history.append({"epoch": epoch, "training_loss": total_loss / len(train_y), "validation_loss": validation_loss, "validation_accuracy": accuracy})
        print(f"Epoch {epoch}: training loss {total_loss / len(train_y):.4f}, validation loss {validation_loss:.4f}, accuracy {accuracy:.4f}", flush=True)
        if validation_loss < best_loss - 0.00001:
            best_loss, best_epoch, best_state = validation_loss, epoch, deepcopy(head.state_dict())
        if epoch - best_epoch >= args.patience:
            print(f"Early stopping; selected epoch {best_epoch}.", flush=True)
            break
    head.load_state_dict(best_state)
    head.eval()
    with torch.no_grad():
        val_logits = head(val_x)
    temperature = calibrate(val_logits, val_y)
    with torch.no_grad():
        val_probabilities = torch.softmax(val_logits / temperature, dim=1).numpy()
    validation_metrics = metric_summary(val_y.numpy(), val_probabilities)
    if validation_metrics["auroc"] < 0.8 or validation_metrics["balanced_accuracy"] < 0.7:
        raise ValueError("The trained head failed the predeclared validation quality gate. The installed checkpoint was preserved.")
    # Inspect the test split only after selecting the head and calibration.
    network.to(device).eval()
    test_x, test_y = cached_features(network, args.data, "test", indices["test"], fingerprint, args.batch_size, device, cache_dir)
    head = network.classifier.cpu().eval()
    with torch.no_grad():
        test_probabilities = torch.softmax(head(test_x) / temperature, dim=1).numpy()
    test_metrics = metric_summary(test_y.numpy(), test_probabilities)
    test_metrics["confidence_intervals_95"] = confidence_intervals(test_y.numpy(), test_probabilities, args.seed)
    report = {
        "format_version": 2, "dataset": dataset_name, "dataset_sha256": fingerprint,
        "dataset_license": "CC BY 4.0" if dataset_name == "PneumoniaMNIST-224" else "Not supplied; consult dataset owner",
        "dataset_source": "https://zenodo.org/records/10519652" if dataset_name == "PneumoniaMNIST-224" else "User-supplied image folders",
        "preprocess_version": PREPROCESS_VERSION, "trained_at": datetime.now(timezone.utc).isoformat(),
        "epochs": best_epoch, "epochs_run": len(history), "seed": args.seed,
        "training_samples": len(train_y), "validation_samples": len(val_y), "test_samples": len(test_y),
        "publisher_split_counts": original_counts, "duplicate_exclusions": exclusions,
        "class_counts": {"train": torch.bincount(train_y, minlength=2).tolist(), "val": torch.bincount(val_y, minlength=2).tolist(), "test": torch.bincount(test_y, minlength=2).tolist()},
        "temperature": temperature, "validation_metrics": validation_metrics, "test_metrics": test_metrics,
        "population": "Pediatric chest radiographs" if dataset_name == "PneumoniaMNIST-224" else "See custom dataset provenance",
        "clinical_validation": False, "architecture": "MobileNetV2", "backbone_weights": weights.name,
        "training_method": "Frozen pretrained backbone; class-weighted linear head; validation-only model selection and temperature calibration",
        "software": {"torch": str(torch.__version__), "torchvision": str(torchvision.__version__), "numpy": str(np.__version__)},
        "training_history": history,
    }
    checkpoint = {**report, "trained": True, "class_names": CLASS_NAMES, "model_state_dict": network.cpu().state_dict()}
    target = BASE / "xray_model.pth"
    temporary = target.with_suffix(".tmp")
    torch.save(checkpoint, temporary)
    # Validate the export with the same safe loader used by inference.
    from xray_pipeline import load_checkpoint
    load_checkpoint(temporary)
    if target.exists():
        backup = BASE / ("xray_model.previous-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%f") + ".pth")
        target.replace(backup)
    temporary.replace(target)
    report_dir = BASE / "model_report"
    report_dir.mkdir(exist_ok=True)
    checkpoint_hash = hashlib.sha256(target.read_bytes()).hexdigest()
    report["checkpoint_sha256"] = checkpoint_hash
    (report_dir / "evaluation.json").write_text(json.dumps(report, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    (report_dir / "MODEL_CARD.md").write_text(model_card(report, checkpoint_hash), encoding="utf-8")
    manifest = args.data.parent / "dataset_manifest.json"
    if manifest.exists():
        (report_dir / "dataset_manifest.json").write_bytes(manifest.read_bytes())
    if args.data.is_file():
        demo_dir = BASE / "demo_xrays"
        demo_dir.mkdir(exist_ok=True)
        samples = []
        with np.load(args.data, allow_pickle=False) as data:
            labels = data["test_labels"].reshape(-1)
            images = data["test_images"]
            for label, name in enumerate(CLASS_NAMES):
                index = int(np.flatnonzero(labels == label)[0])
                filename = name.lower() + ".png"
                Image.fromarray(images[index]).save(demo_dir / filename)
                samples.append({"file": filename, "publisher_split": "test", "index": index, "reference_label": name})
        (demo_dir / "samples.json").write_text(json.dumps(samples, indent=2) + "\n", encoding="utf-8")
        (demo_dir / "README.md").write_text("# Public research examples\n\nThese are the first test-split image in each reference class of PneumoniaMNIST-224. They were selected by dataset order, not by model success. The filenames describe benchmark reference labels; the model can disagree.\n\nSource and attribution: MedMNIST, Jiancheng Yang and collaborators, https://zenodo.org/records/10519652 (CC BY 4.0). Exported from the published NPZ as PNG without changing pixel values. These are de-identified pediatric research images for demonstration, not images of your patients. See ../model_report/MODEL_CARD.md for model scope and results.\n", encoding="utf-8")
    print(f"Installed trained checkpoint: {target}", flush=True)
    print(f"Held-out test: accuracy {test_metrics['accuracy']:.4f}, AUROC {test_metrics['auroc']:.4f}, pneumonia recall {test_metrics['pneumonia_recall']:.4f}, normal specificity {test_metrics['normal_specificity']:.4f}", flush=True)
    print("Research benchmark results; this model has not been clinically validated.", flush=True)


if __name__ == "__main__":
    main()
