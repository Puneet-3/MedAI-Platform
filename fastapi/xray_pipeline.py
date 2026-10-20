"""Shared preprocessing and checkpoint validation for the experimental X-ray model."""
import math
import os
from pathlib import Path
from PIL import Image, ImageOps
import torch
from torch import nn
from torchvision import models, transforms

PREPROCESS_VERSION = "medai-xray-grayscale-center-crop-224-v1"
CLASS_NAMES = ["NORMAL", "PNEUMONIA"]


def configure_threads(count=None):
    threads = count if count is not None else int(os.getenv("XRAY_CPU_THREADS", "4"))
    torch.set_num_threads(max(1, min(threads, os.cpu_count() or 1)))


def prepare_image(image):
    image = ImageOps.exif_transpose(image)
    image = ImageOps.grayscale(image).convert("RGB")
    return ImageOps.fit(image, (224, 224), method=Image.Resampling.BILINEAR, centering=(0.5, 0.5))


def preprocessing():
    return transforms.Compose([
        transforms.Lambda(prepare_image), transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])


def load_checkpoint(path: Path):
    configure_threads()
    data = torch.load(path, map_location="cpu", weights_only=True)
    if not isinstance(data, dict) or data.get("trained") is not True or data.get("epochs", 0) < 1:
        raise ValueError("No trained X-ray checkpoint. Run train_cnn.py with labelled data.")
    if data.get("format_version") != 2 or data.get("preprocess_version") != PREPROCESS_VERSION:
        raise ValueError("The X-ray checkpoint uses an unsupported preprocessing format.")
    if data.get("class_names") != CLASS_NAMES:
        raise ValueError("The X-ray checkpoint class labels are incompatible.")
    temperature = float(data.get("temperature", 1.0))
    if not math.isfinite(temperature) or not 0.05 <= temperature <= 20:
        raise ValueError("The X-ray checkpoint has an invalid calibration temperature.")
    network = models.mobilenet_v2(weights=None)
    network.classifier[-1] = nn.Linear(1280, 2)
    network.load_state_dict(data["model_state_dict"])
    network.eval()
    metadata = {key: data[key] for key in [
        "format_version", "dataset", "dataset_sha256", "preprocess_version", "trained_at",
        "epochs", "training_samples", "validation_samples", "test_samples", "temperature",
        "validation_metrics", "test_metrics", "population", "clinical_validation",
    ] if key in data}
    return network, CLASS_NAMES, temperature, metadata
