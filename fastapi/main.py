from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import pickle
import json
import re
import random
import numpy as np
from nltk.stem.porter import PorterStemmer
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="MedAI Backend Services", version="0.1.0")

# CORS configurations
origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
origins = [origin.strip() for origin in origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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

# Chatbot resources
chatbot_model = None
chatbot_vocabulary = None
chatbot_classes = None
chatbot_intents = None
stemmer = PorterStemmer()

# CNN X-Ray resources
xray_model = None

@app.on_event("startup")
def load_ml_resources():
    global model, label_encoder, symptom_mapping, chatbot_model, chatbot_vocabulary, chatbot_classes, chatbot_intents, xray_model
    base_dir = os.path.dirname(__file__)
    
    # 1. Symptom Predictor files
    model_path = os.path.join(base_dir, "disease_model.pkl")
    encoder_path = os.path.join(base_dir, "label_encoder.pkl")
    mapping_path = os.path.join(base_dir, "symptom_mapping.json")
    
    if os.path.exists(model_path) and os.path.exists(encoder_path) and os.path.exists(mapping_path):
        with open(model_path, "rb") as f:
            model = pickle.load(f)
        with open(encoder_path, "rb") as f:
            label_encoder = pickle.load(f)
        with open(mapping_path, "r") as f:
            symptom_mapping = json.load(f)
        print("Symptom checker resources loaded.")
    else:
        print("WARNING: Symptom checker model files are missing.")
        
    # 2. Chatbot files
    chatbot_path = os.path.join(base_dir, "chatbot_model.pkl")
    if os.path.exists(chatbot_path):
        with open(chatbot_path, "rb") as f:
            chatbot_data = pickle.load(f)
        chatbot_model = chatbot_data["model"]
        chatbot_vocabulary = chatbot_data["vocabulary"]
        chatbot_classes = chatbot_data["classes"]
        chatbot_intents = chatbot_data["intents"]
        print("Chatbot resources loaded.")
    else:
        print("WARNING: Chatbot model files are missing.")

    # 3. CNN X-Ray files
    xray_path = os.path.join(base_dir, "xray_model.pth")
    if os.path.exists(xray_path):
        try:
            import torch
            import torch.nn as nn
            import torchvision.models as models
            
            # Reconstruct MobileNetV2 architecture with 2 outputs
            xray_model = models.mobilenet_v2(pretrained=False)
            xray_model.classifier[-1] = nn.Linear(1280, 2)
            
            # Load weights (CPU mapped)
            xray_model.load_state_dict(torch.load(xray_path, map_location=torch.device("cpu")))
            xray_model.eval()
            print("CNN X-Ray model loaded successfully.")
        except Exception as e:
            print(f"WARNING: Failed to load CNN X-Ray model: {e}")
    else:
        print("WARNING: xray_model.pth is missing.")

# Preprocessing helpers for chatbot
def clean_tokenize(text):
    return re.findall(r'\w+', text.lower())

def clean_stem(word):
    return stemmer.stem(word.lower())

def get_bag_of_words(tokenized_sentence, words):
    tokenized_sentence = [clean_stem(w) for w in tokenized_sentence]
    bag = np.zeros(len(words), dtype=np.float32)
    for idx, w in enumerate(words):
        if w in tokenized_sentence:
            bag[idx] = 1.0
    return bag

# Input schemas
class PredictionRequest(BaseModel):
    symptoms: list[str]

class ChatRequest(BaseModel):
    message: str

class AnalyzeRequest(BaseModel):
    image_url: str

class IntentItem(BaseModel):
    tag: str
    patterns: list[str]
    responses: list[str]

class IntentsPayload(BaseModel):
    intents: list[IntentItem]

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict", dependencies=[Depends(verify_secret)])
def predict_disease(payload: PredictionRequest):
    if not model or not label_encoder or not symptom_mapping:
        raise HTTPException(status_code=503, detail="Prediction models are not loaded.")

    if not payload.symptoms:
        raise HTTPException(status_code=400, detail="Symptom list cannot be empty.")

    input_vector = [0] * 132
    found_any = False
    for sym in payload.symptoms:
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

    probabilities = model.predict_proba([input_vector])[0]
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

    top_confidence = results[0]["confidence"] if results else 0.0
    recommended_test = None
    if top_confidence < 0.60:
        recommended_test = "Comprehensive Blood Panel & Metabolic Check"

    return {
        "results": results,
        "recommended_test": recommended_test
    }

@app.post("/chat", dependencies=[Depends(verify_secret)])
def chat_response(payload: ChatRequest):
    if not chatbot_model or not chatbot_vocabulary or not chatbot_classes or not chatbot_intents:
        raise HTTPException(status_code=503, detail="Chatbot models are not loaded.")

    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # 1. Tokenize & vectorize input message
    tokens = clean_tokenize(payload.message)
    bag = get_bag_of_words(tokens, chatbot_vocabulary)

    # 2. Predict Probabilities
    probabilities = chatbot_model.predict_proba([bag])[0]
    top_idx = np.argmax(probabilities)
    confidence = float(probabilities[top_idx])
    predicted_tag = chatbot_classes[top_idx]

    # 3. Retrieve Fallback if confidence < 0.75
    if confidence < 0.75:
        fallback_intent = next((intent for intent in chatbot_intents if intent["tag"] == "fallback"), None)
        response_text = random.choice(fallback_intent["responses"]) if fallback_intent else "I am not sure I understand. Could you please rephrase?"
        return {
            "intent": "fallback",
            "response": response_text,
            "confidence": round(confidence, 4)
        }

    # 4. Find matching intent and pick a random response
    matched_intent = next((intent for intent in chatbot_intents if intent["tag"] == predicted_tag), None)
    if not matched_intent:
        matched_intent = next((intent for intent in chatbot_intents if intent["tag"] == "fallback"), None)
        
    response_text = random.choice(matched_intent["responses"]) if matched_intent else "I'm not sure. Try rephrasing."

    return {
        "intent": predicted_tag,
        "response": response_text,
        "confidence": round(confidence, 4)
    }

# ----------------- Day 17: CNN X-Ray /analyze Endpoint -----------------
@app.post("/analyze", dependencies=[Depends(verify_secret)])
def analyze_xray(payload: AnalyzeRequest):
    global xray_model
    if not xray_model:
        raise HTTPException(status_code=503, detail="CNN X-Ray model is not loaded.")

    import urllib.request
    from io import BytesIO
    from PIL import Image
    import torch
    from torchvision import transforms

    image_url = payload.image_url
    try:
        # Check if local upload path
        if image_url.startswith("/uploads/"):
            # Resolve physical path in Next.js public directory
            base_dir = os.path.dirname(__file__)
            local_path = os.path.abspath(os.path.join(
                base_dir, "..", "frontend", "public", "uploads", image_url.split("/uploads/")[-1]
            ))
            if not os.path.exists(local_path):
                raise HTTPException(status_code=404, detail="Local report file not found on disk.")
            img = Image.open(local_path).convert("RGB")
        else:
            # Download via HTTP request
            req = urllib.request.Request(image_url, headers={'User-Agent': 'MedAI Client'})
            with urllib.request.urlopen(req) as response:
                img_data = response.read()
            img = Image.open(BytesIO(img_data)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to load image: {e}")

    # ImageNet Preprocessing Pipeline
    preprocess = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    input_tensor = preprocess(img).unsqueeze(0) # Add batch dimension

    with torch.no_grad():
        outputs = xray_model(input_tensor)
        probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
        top_idx = torch.argmax(probabilities).item()
        confidence = float(probabilities[top_idx])

    labels = ["Normal", "Pneumonia"]
    predicted_label = labels[top_idx]
    
    # Flagged if pneumonia is predicted
    flagged = (predicted_label == "Pneumonia")

    return {
        "label": predicted_label,
        "confidence": round(confidence, 4),
        "flagged": flagged
    }

# ----------------- Day 20: Admin Chatbot & Intent Management Endpoints -----------------
@app.get("/intents", dependencies=[Depends(verify_secret)])
def get_intents_file():
    base_dir = os.path.dirname(__file__)
    intents_path = os.path.join(base_dir, "intents.json")
    if not os.path.exists(intents_path):
        raise HTTPException(status_code=404, detail="intents.json not found on disk.")
    
    with open(intents_path, "r") as f:
        data = json.load(f)
    return data

@app.post("/intents", dependencies=[Depends(verify_secret)])
def save_intents_file(payload: IntentsPayload):
    base_dir = os.path.dirname(__file__)
    intents_path = os.path.join(base_dir, "intents.json")
    
    # Save the updated intents structure
    try:
        # Convert Pydantic payload to dictionary
        data_dict = {"intents": [intent.dict() for intent in payload.intents]}
        with open(intents_path, "w") as f:
            json.dump(data_dict, f, indent=2)
        return {"status": "ok", "message": "intents.json updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save intents: {e}")

@app.post("/retrain", dependencies=[Depends(verify_secret)])
def retrain_chatbot():
    try:
        from train_chatbot import train_chatbot
        print("Starting chatbot retrain pipeline...")
        train_chatbot()
        
        # Reload chatbot resources in-memory
        load_ml_resources()
        return {"status": "ok", "message": "MLP Chatbot retrained and reloaded successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {e}")
