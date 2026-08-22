# Octwave Image Classification: Project Summary

This document summarizes the end-to-end machine learning pipeline built to classify images into four categories (`Neither`, `Tom`, `Jerry`, `Both`). 

The codebase was architected from the ground up using the **"High-Accuracy Sweet Spot"** strategy. This strategy was specifically chosen to maximize the Macro F1 score on highly imbalanced, noisy data while constraining training time to a reasonable ~4 hour GPU budget.

---

## 1. Project Strategy & Core Features

* **Framework:** PyTorch (with `timm` for backbones and `albumentations` for augmentations).
* **Backbone:** `efficientnetv2_s` (Chosen for its excellent speed-to-accuracy ratio).
* **Validation Strategy:** Scene-Aware 5-Fold Cross Validation.
* **Optimization:** Mixed Precision (AMP) for 2x faster training.

---

## 2. What Was Built (Phase by Phase)

### Phase 0: Configuration & Architecture
* **`src/config.yaml`**: The master control file. It manages hyperparameter configurations, paths, device settings, and toggle flags for every step of the pipeline.
* **`src/utils.py`**: Helper scripts for deterministic random seeds (reproducibility), calculating Macro F1 scores, plotting confusion matrices, and executing Early Stopping.

### Phase 1 & 2: EDA and Data Splitting (`src/eda.py`, `src/data.py`)
* **Problem Solved:** Video frames often contain near-identical sequential images. Standard random splitting causes severe data leakage where the model memorizes a frame in the training set and easily predicts its twin in the validation set.
* **Solution:** Implemented **Perceptual Hashing (pHash)** to detect visually similar images, group them into "Scenes", and use a `StratifiedGroupKFold` so similar images never cross the train/validation boundary.

### Phase 3 & 4: Augmentation (`src/offline_augment.py`, `src/augment.py`)
* **Offline Balancing:** The dataset was heavily imbalanced (e.g., 1,252 "Tom" vs 219 "Both"). Built an offline augmentation script to physically generate mutated copies of the minority classes until the dataset was balanced.
* **Online Augmentations:** Configured `albumentations` to apply RandomResizedCrops, Flips, Color Jittering, and CoarseDropout on the fly. 
* **Batch-Level Augmentations:** Implemented **CutMix** and **MixUp** directly in the training loop to act as strong regularizers against noisy labels.

### Phase 5: Loss Functions (`src/losses.py`)
* **Problem Solved:** "Tom" dominated the dataset, causing standard CrossEntropy to ignore the rare classes.
* **Solution:** Implemented a custom **Focal Loss** combined with inverse-frequency class weighting. This drastically scales up the penalty when the model misclassifies hard, rare examples (like "Both"). Label Smoothing (0.1) was also added to prevent the model from becoming overconfident on mislabeled training data.

### Phase 6 & 7: Model & Training Engine (`src/model.py`, `src/train.py`)
* **Two-Stage Transfer Learning:** The training loop freezes the pre-trained EfficientNet backbone for the first 5 epochs, allowing the custom classification head to warm up. In stage 2, it unfreezes the backbone using a 10x smaller learning rate so it doesn't destroy the pre-trained ImageNet features.
* **Gradient Tracking:** Includes gradient clipping to prevent exploding gradients and tracks per-class F1 scores in real time so dragging classes can be identified.

### Phase 8 & 9: Validation and Inference (`src/crossval.py`, `src/infer.py`)
* **Ensembling:** Orchestrates the training of all 5 independent folds. 
* **Test-Time Augmentation (TTA):** The inference script loads all 5 fold-checkpoints. For every test image, it generates multiple flipped predictions, averages them (TTA), and then averages the results across all 5 models (Ensembling) for the most robust final prediction possible.

### Phase 10: Pseudo-Labeling (`src/pseudo.py`)
* Built as an optional tool. It allows the model to predict on the test set, take the most highly confident predictions (e.g., > 90% confidence), and recycle them back into the training data as "pseudo-labels" for a final retraining pass to squeeze out a tiny extra percentage of accuracy. (Turned `off` by default in config).

---

## 3. How to Run the Pipeline

The entire project can be run via three simple terminal commands from the project root:

1. **Balance the Dataset (Optional but recommended):**
   ```bash
   python -m src.offline_augment
   ```

2. **Train the 5-Fold Ensemble:**
   ```bash
   python -m src.crossval
   ```

3. **Generate Final Submissions:**
   ```bash
   python -m src.infer
   ```

> [!TIP]
> **GPU Highly Recommended** 
> Deep learning models process millions of parameters. While the code is configured to gracefully fallback to `device: "cpu"` so it won't crash on standard laptops, a full training run on a CPU will take days. For optimal use, run `python -m src.crossval` on an NVIDIA GPU (e.g., via Kaggle or Google Colab) to finish training in roughly ~4 hours.
