import os
import json
import pickle
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score

# Paths
base_dir = os.path.dirname(__file__)
dataset_path = os.path.join(base_dir, "dataset", "Training.csv")
model_path = os.path.join(base_dir, "disease_model.pkl")
encoder_path = os.path.join(base_dir, "label_encoder.pkl")
mapping_path = os.path.join(base_dir, "symptom_mapping.json")

def train_model():
    print("Loading dataset...")
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Training dataset not found at {dataset_path}. Please run download_datasets.py first.")
        
    df = pd.read_csv(dataset_path)
    
    # Clean extraneous columns (e.g., Unnamed: 133 is common in this Kaggle CSV)
    unnamed_cols = [col for col in df.columns if 'Unnamed' in col]
    if unnamed_cols:
        df = df.drop(columns=unnamed_cols)
        
    # Features & Label separation
    # The last column is 'prognosis' (the disease name), everything else is symptoms (binary 0/1)
    X = df.drop(columns=["prognosis"])
    y = df["prognosis"]
    
    # 1. Build symptom-to-index mapping dictionary
    # Example: {"itching": 0, "skin_rash": 1, ...}
    symptoms = list(X.columns)
    symptom_mapping = {symptom.strip().lower(): idx for idx, symptom in enumerate(symptoms)}
    
    with open(mapping_path, "w") as f:
        json.dump(symptom_mapping, f, indent=4)
    print(f"Saved symptom mapping dictionary with {len(symptom_mapping)} symptoms to {mapping_path}")
    
    # 2. Encode labels
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    with open(encoder_path, "wb") as f:
        pickle.dump(label_encoder, f)
    print(f"Saved label encoder for {len(label_encoder.classes_)} diseases to {encoder_path}")
    
    # 3. Stratified Train-Test Split (80/20)
    # Stratification ensures equal class representation in train and test splits
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    
    # 4. Train RandomForest Classifier
    print("Training RandomForestClassifier...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # 5. Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\nModel Accuracy: {accuracy * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))
    
    # 6. Save Model
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    print(f"Saved trained Random Forest model to {model_path}")

if __name__ == "__main__":
    train_model()
