from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import pickle
import json
import numpy as np
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="MedAI Backend Services", version="0.1.0")

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load secret token
FASTAPI_SECRET = os.getenv("FASTAPI_SECRET")

# API security dependency
def verify_secret(x_fastapi_secret: str = Header(None)):
    if FASTAPI_SECRET and x_fastapi_secret != FASTAPI_SECRET:
        raise HTTPException(status_code=401, detail="Invalid API Secret key.")

# Load ML Models at startup
model = None
label_encoder = None
symptom_mapping = None

@app.on_event("startup")
def load_ml_resources():
    global model, label_encoder, symptom_mapping
    base_dir = os.path.dirname(__file__)
    
    model_path = os.path.join(base_dir, "disease_model.pkl")
    encoder_path = os.path.join(base_dir, "label_encoder.pkl")
    mapping_path = os.path.join(base_dir, "symptom_mapping.json")
    
    if not (os.path.exists(model_path) and os.path.exists(encoder_path) and os.path.exists(mapping_path)):
        raise RuntimeError("ML model files are missing. Run train.py first.")
        
    with open(model_path, "rb") as f:
        model = pickle.load(f)
    with open(encoder_path, "rb") as f:
        label_encoder = pickle.load(f)
    with open(mapping_path, "r") as f:
        symptom_mapping = json.load(f)
        
    print("Machine learning resources loaded successfully.")

# Input schema
class PredictionRequest(BaseModel):
    symptoms: list[str]

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict", dependencies=[Depends(verify_secret)])
def predict_disease(payload: PredictionRequest):
    if not model or not label_encoder or not symptom_mapping:
        raise HTTPException(status_code=503, detail="Prediction models are not loaded.")

    # Validate inputs
    if not payload.symptoms:
        raise HTTPException(status_code=400, detail="Symptom list cannot be empty.")

    # Initialize binary input vector (132 features)
    # The keys in symptom_mapping.json correspond to the feature column names in Training.csv
    input_vector = [0] * 132
    
    found_any = False
    for sym in payload.symptoms:
        # Standardize symptom formatting (lowercase, strip, replace spaces with underscores)
        clean_sym = sym.strip().lower().replace(" ", "_")
        if clean_sym in symptom_mapping:
            idx = symptom_mapping[clean_sym]
            input_vector[idx] = 1
            found_any = True
            
    if not found_any:
        raise HTTPException(
            status_code=400, 
            detail="None of the provided symptoms match the known symptom dictionary."
        )

    # Run Prediction Probabilities
    # model.predict_proba returns shape (1, num_classes)
    probabilities = model.predict_proba([input_vector])[0]
    
    # Sort and grab top 3 predictions
    top_3_indices = np.argsort(probabilities)[::-1][:3]
    
    results = []
    for idx in top_3_indices:
        confidence = float(probabilities[idx])
        if confidence > 0.0:
            disease_name = label_encoder.classes_[idx]
            results.append({
                "disease": disease_name,
                "confidence": round(confidence, 4)
            })

    # Recommended diagnostic checks if model confidence is low
    top_confidence = results[0]["confidence"] if results else 0.0
    recommended_test = None
    if top_confidence < 0.60:
        recommended_test = "Comprehensive Blood Panel & Metabolic Check"

    return {
        "results": results,
        "recommended_test": recommended_test
    }
