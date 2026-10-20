"""Download the official PneumoniaMNIST-224 research dataset and verify its checksum."""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path
import time
import urllib.request

URL = "https://zenodo.org/records/10519652/files/pneumoniamnist_224.npz?download=1"
MD5 = "d6a3c71de1b945ea11211b03746c1fe1"
SOURCE = "https://github.com/MedMNIST/MedMNIST/blob/main/medmnist/info.py"
DEFAULT = Path(__file__).resolve().parent / "dataset" / "pneumoniamnist"


def download(target):
    headers = {"User-Agent": "MedAI-Research-Setup/1.0", "Range": "bytes=0-0"}
    with urllib.request.urlopen(urllib.request.Request(URL, headers=headers), timeout=60) as response:
        total = int(response.headers["Content-Range"].split("/")[-1])
    if not 0 < total <= 512 * 1024 * 1024:
        raise ValueError("The dataset has an unexpected download size.")
    parts = target.parent / (target.name + ".parts")
    parts.mkdir(exist_ok=True)
    chunk_size = 4 * 1024 * 1024
    ranges = [(start, min(start + chunk_size, total)) for start in range(0, total, chunk_size)]

    def fetch_part(index):
        start, end = ranges[index]
        part = parts / f"{index:04d}.part"
        position = part.stat().st_size if part.exists() else 0
        if position > end - start:
            raise ValueError("A partial download is larger than its expected range.")
        failures = 0
        while position < end - start:
            offset = start + position
            request = urllib.request.Request(URL, headers={
                "User-Agent": "MedAI-Research-Setup/1.0", "Range": f"bytes={offset}-{end - 1}",
            })
            try:
                with urllib.request.urlopen(request, timeout=60) as response, part.open("ab") as stream:
                    content_range = response.headers.get("Content-Range", "")
                    if response.status != 206 or not content_range.startswith(f"bytes {offset}-") or not content_range.endswith(f"/{total}"):
                        raise ValueError("The server did not honour the requested download range.")
                    before = position
                    while position < end - start:
                        block = response.read(min(1024 * 1024, end - start - position))
                        if not block:
                            break
                        stream.write(block)
                        position += len(block)
                    if position == before:
                        raise OSError("The download made no progress.")
                failures = 0
            except (OSError, urllib.error.URLError):
                failures += 1
                if failures > 5:
                    raise
                time.sleep(min(2 * failures, 10))
        return part

    print(f"Downloading {total / 1024**2:.1f} MB in resumable ranges (3 connections).", flush=True)
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = [executor.submit(fetch_part, index) for index in range(len(ranges))]
        for completed, future in enumerate(as_completed(futures), 1):
            future.result()
            print(f"Verified range {completed}/{len(ranges)} received.", flush=True)
    partial = target.with_suffix(".npz.part")
    with partial.open("wb") as stream:
        for index in range(len(ranges)):
            stream.write((parts / f"{index:04d}.part").read_bytes())
    if checksums(partial)[0] != MD5:
        partial.unlink(missing_ok=True)
        raise ValueError("Publisher checksum verification failed; the dataset was not installed.")
    partial.replace(target)
    for index in range(len(ranges)):
        (parts / f"{index:04d}.part").unlink()
    parts.rmdir()


def checksums(path):
    md5 = hashlib.md5(usedforsecurity=False)
    sha256 = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            md5.update(chunk)
            sha256.update(chunk)
    return md5.hexdigest(), sha256.hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    target = args.output / "pneumoniamnist_224.npz"
    if target.exists():
        if checksums(target)[0] != MD5:
            raise ValueError("The existing dataset has an unexpected checksum; move it aside before downloading again.")
        print("The official dataset is already present and verified.", flush=True)
    else:
        download(target)

    import numpy as np
    expected = {"train": 4708, "val": 524, "test": 624}
    counts = {}
    with np.load(target, allow_pickle=False) as data:
        for split, size in expected.items():
            images = data[f"{split}_images"]
            labels = data[f"{split}_labels"].reshape(-1)
            if images.shape != (size, 224, 224) or labels.shape != (size,) or set(np.unique(labels)) != {0, 1}:
                raise ValueError(f"Unexpected {split} dataset structure")
            counts[split] = {"total": size, "normal": int((labels == 0).sum()), "pneumonia": int((labels == 1).sum())}
    digest, sha256 = checksums(target)
    manifest = {
        "name": "PneumoniaMNIST-224", "source": SOURCE, "download_url": URL,
        "license": "CC BY 4.0", "md5": digest, "sha256": sha256,
        "class_names": ["NORMAL", "PNEUMONIA"], "splits": counts,
        "population": "Pediatric chest radiographs; research and educational use, not clinical validation.",
        "split_policy": "Publisher-provided train, validation, and test partitions are preserved.",
    }
    (args.output / "dataset_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Verified dataset: {target}", flush=True)
    print(json.dumps(counts), flush=True)


if __name__ == "__main__":
    main()
