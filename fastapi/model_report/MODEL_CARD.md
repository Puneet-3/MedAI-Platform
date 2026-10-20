# MedAI experimental X-ray model

- Architecture: MobileNetV2, ImageNet pretrained frozen backbone, trained two-class head.
- Dataset: PneumoniaMNIST-224; licence: CC BY 4.0.
- Evaluated population: Pediatric chest radiographs.
- Source: https://zenodo.org/records/10519652.
- For PneumoniaMNIST: MedMNIST / Jiancheng Yang and collaborators; publisher-derived images and splits were used as documented.
- Labels: NORMAL, PNEUMONIA.
- Preprocessing: EXIF correction, grayscale RGB, centred square crop, 224 x 224 resize, ImageNet normalization.
- Fitting images: 4682; validation images: 524; held-out test images: 624.
- Model selection: lowest validation cross-entropy; test labels are not used to select weights or calibration.
- Calibration temperature: 0.7912, fitted using validation logits.
- Checkpoint SHA-256: `29fcfecca80a4233c3d18c3556691211166451e8eb8eba6fa387c77e688fa54d`.

## Held-out benchmark results

| Measure | Value |
| --- | ---: |
| Accuracy | 0.9071 |
| Balanced accuracy | 0.8786 |
| AUROC | 0.9780 |
| Pneumonia recall | 0.9923 |
| Normal specificity | 0.7650 |
| Pneumonia precision | 0.8756 |
| Pneumonia F1 | 0.9303 |

Confusion matrix (rows = reference, columns = predicted):

| | Predicted NORMAL | Predicted PNEUMONIA |
| --- | ---: | ---: |
| Reference NORMAL | 179 | 55 |
| Reference PNEUMONIA | 3 | 387 |

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
