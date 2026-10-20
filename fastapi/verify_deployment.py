"""Fail a cloud build if the real, installed model artifacts were not uploaded."""
from pathlib import Path
from main import load_ml_resources, health


def main():
    root = Path(__file__).resolve().parent
    required = ["disease_model.pkl", "label_encoder.pkl", "chatbot_model.pkl", "symptom_mapping.json", "intents.json", "xray_model.pth"]
    missing = [name for name in required if not (root / name).is_file()]
    if missing:
        raise SystemExit("Missing installed model files: " + ", ".join(missing) + ". Deploy the fastapi directory with the CLI; these artifacts are intentionally excluded from Git.")
    load_ml_resources()
    if not all(health()["models_loaded"].values()):
        raise SystemExit("One or more model artifacts are incompatible; deployment was stopped.")
    print("All three real models loaded successfully for deployment.")


if __name__ == "__main__":
    main()
