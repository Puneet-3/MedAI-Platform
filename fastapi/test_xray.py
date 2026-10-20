"""Check X-ray label ordering, input handling, calibration, and unsafe artifacts."""
from io import BytesIO
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import numpy as np
from PIL import Image
import torch

import main
from train_cnn import calibrate, metric_summary
from xray_pipeline import CLASS_NAMES, PREPROCESS_VERSION, load_checkpoint, prepare_image, preprocessing


def upload_image(size=(224, 224)):
    image = BytesIO()
    Image.new("L", size, 128).save(image, format="PNG")
    image.seek(0)
    return main.UploadFile(file=image, filename="synthetic-test.png")


class XrayTests(unittest.TestCase):
    def test_preprocessing_converts_to_consistent_grayscale_rgb(self):
        image = prepare_image(Image.new("RGB", (320, 180), (200, 80, 20)))
        self.assertEqual(image.size, (224, 224))
        red, green, blue = image.getpixel((100, 100))
        self.assertEqual((red, red, red), (red, green, blue))
        tensor = preprocessing()(image)
        self.assertEqual(tuple(tensor.shape), (3, 224, 224))
        self.assertTrue(bool(torch.isfinite(tensor).all()))

    def test_random_untrained_weights_cannot_be_loaded(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "untrained.pth"
            torch.save({"features": torch.zeros(1)}, path)
            with self.assertRaisesRegex(ValueError, "No trained"):
                load_checkpoint(path)

    def test_label_order_and_temperature_are_validated(self):
        minimal = {"trained": True, "epochs": 1, "format_version": 2,
                   "preprocess_version": PREPROCESS_VERSION, "class_names": CLASS_NAMES,
                   "temperature": float("nan")}
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "invalid.pth"
            torch.save(minimal, path)
            with self.assertRaisesRegex(ValueError, "temperature"):
                load_checkpoint(path)
            minimal.update(temperature=1.0, class_names=list(reversed(CLASS_NAMES)))
            torch.save(minimal, path)
            with self.assertRaisesRegex(ValueError, "class labels"):
                load_checkpoint(path)

    def test_metrics_keep_normal_and_pneumonia_in_the_right_order(self):
        metrics = metric_summary(np.array([0, 0, 1, 1]), np.array([[.9, .1], [.4, .6], [.2, .8], [.7, .3]]))
        self.assertEqual(metrics["confusion_matrix"], [[1, 1], [1, 1]])
        self.assertEqual(metrics["pneumonia_recall"], .5)
        self.assertEqual(metrics["normal_specificity"], .5)
        self.assertEqual(metrics["auroc"], .75)

    def test_temperature_calibration_does_not_worsen_validation_loss(self):
        logits = torch.tensor([[10., -10.], [-10., 10.], [10., -10.], [-10., 10.]])
        labels = torch.tensor([0, 1, 1, 0])
        temperature = calibrate(logits, labels)
        self.assertTrue(.05 <= temperature <= 20)
        before = torch.nn.functional.cross_entropy(logits, labels)
        after = torch.nn.functional.cross_entropy(logits / temperature, labels)
        self.assertLessEqual(float(after), float(before) + 1e-6)

    def test_endpoint_applies_the_checkpoint_calibration(self):
        logits = torch.tensor([[-1., 2.]])
        with patch.object(main, "xray_model", lambda _: logits), \
             patch.object(main, "xray_labels", CLASS_NAMES), \
             patch.object(main, "xray_temperature", 2.0):
            result = main.analyze_xray(upload_image())
        self.assertEqual(result["label"], "Pneumonia")
        self.assertEqual(result["confidence"], round(float(torch.softmax(logits[0] / 2, dim=0)[1]), 4))
        self.assertTrue(result["experimental"])

    def test_unreadable_and_tiny_images_are_rejected(self):
        with patch.object(main, "xray_model", lambda _: None):
            for upload in [upload_image((16, 16)), main.UploadFile(file=BytesIO(b"not an image"), filename="invalid.png")]:
                with self.assertRaises(main.HTTPException) as raised:
                    main.analyze_xray(upload)
                self.assertEqual(raised.exception.status_code, 400)


if __name__ == "__main__":
    unittest.main()
