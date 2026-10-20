"""Inference services for MedAI. Missing models remain unavailable, never simulated."""
from contextlib import asynccontextmanager
from io import BytesIO
from pathlib import Path
import hmac
import json
import logging
import os
import pickle
import random
import re
import threading

import numpy as np
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from nltk.stem.porter import PorterStemmer
from pydantic import BaseModel, Field, field_validator

load_dotenv()
logger = logging.getLogger("medai")
BASE = Path(__file__).resolve().parent
model = label_encoder = symptom_mapping = None
chatbot_model = chatbot_vocabulary = chatbot_classes = chatbot_intents = None
xray_model = xray_labels = None
xray_temperature = 1.0
xray_metadata = {}
stemmer = PorterStemmer()
training_lock = threading.Lock()


def load_ml_resources():
    global model, label_encoder, symptom_mapping
    global chatbot_model, chatbot_vocabulary, chatbot_classes, chatbot_intents
    global xray_model, xray_labels, xray_temperature, xray_metadata
    model = label_encoder = symptom_mapping = None
    chatbot_model = chatbot_vocabulary = chatbot_classes = chatbot_intents = None
    xray_model = xray_labels = None
    xray_temperature, xray_metadata = 1.0, {}
    try:
        # Only load locally produced, trusted pickle artifacts.
        with (BASE / "disease_model.pkl").open("rb") as f:
            disease = pickle.load(f)
        with (BASE / "label_encoder.pkl").open("rb") as f:
            encoder = pickle.load(f)
        mapping = json.loads((BASE / "symptom_mapping.json").read_text())
        if not mapping or max(mapping.values()) >= disease.n_features_in_:
            raise ValueError("The symptom mapping doesn't match the trained model")
        model, label_encoder, symptom_mapping = disease, encoder, mapping
    except Exception:
        logger.warning("Symptom prediction unavailable: missing or incompatible artifacts.", exc_info=True)
    try:
        with (BASE / "chatbot_model.pkl").open("rb") as f:
            data = pickle.load(f)
        chatbot_model, chatbot_vocabulary = data["model"], data["vocabulary"]
        chatbot_classes, chatbot_intents = data["classes"], data["intents"]
    except Exception:
        logger.warning("Health assistant unavailable: missing or incompatible artifact.", exc_info=True)
    checkpoint = BASE / "xray_model.pth"
    if checkpoint.exists():
        try:
            from xray_pipeline import load_checkpoint
            xray_model, xray_labels, xray_temperature, xray_metadata = load_checkpoint(checkpoint)
        except Exception as exc:
            logger.warning("X-ray screening unavailable: %s", exc)


@asynccontextmanager
async def lifespan(_app):
    load_ml_resources()
    yield


app = FastAPI(title="MedAI inference service", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[s.strip() for s in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",") if s.strip()],
    allow_credentials=True, allow_methods=["GET", "POST"], allow_headers=["Content-Type", "X-FastAPI-Secret"],
)


def verify_secret(x_fastapi_secret: str | None = Header(None)):
    secret = os.getenv("FASTAPI_SECRET")
    if not secret:
        raise HTTPException(503, "Set FASTAPI_SECRET to enable inference endpoints.")
    if not x_fastapi_secret or not hmac.compare_digest(secret, x_fastapi_secret):
        raise HTTPException(401, "Invalid API credentials.")


class PredictionRequest(BaseModel):
    symptoms: list[str] = Field(min_length=1, max_length=132)

    @field_validator("symptoms")
    @classmethod
    def validate_symptoms(cls, values):
        if any(not value.strip() or len(value) > 100 for value in values):
            raise ValueError("Each symptom must contain between 1 and 100 characters")
        return list(dict.fromkeys(value.strip().lower() for value in values))


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)

    @field_validator("message")
    @classmethod
    def nonempty(cls, value):
        if not value.strip():
            raise ValueError("Please enter a message")
        return value.strip()


class IntentItem(BaseModel):
    tag: str = Field(min_length=1, max_length=100)
    patterns: list[str] = Field(min_length=1, max_length=200)
    responses: list[str] = Field(min_length=1, max_length=100)

    @field_validator("tag")
    @classmethod
    def tag_format(cls, value):
        if not re.fullmatch(r"[a-zA-Z0-9_-]+", value):
            raise ValueError("Use letters, numbers, hyphens, or underscores in tags")
        return value

    @field_validator("patterns", "responses")
    @classmethod
    def content(cls, values):
        if any(not v.strip() or len(v) > 4000 for v in values):
            raise ValueError("Patterns and responses must contain 1 to 4000 characters")
        return [v.strip() for v in values]


class IntentsPayload(BaseModel):
    intents: list[IntentItem] = Field(min_length=1, max_length=500)

    @field_validator("intents")
    @classmethod
    def unique_tags(cls, values):
        tags = [value.tag for value in values]
        if len(set(tags)) != len(tags):
            raise ValueError("Intent tags must be unique")
        return values


@app.get("/")
def root():
    return {"service": "MedAI inference service", "version": app.version, "docs_url": "/docs"}


@app.get("/health")
def health():
    loaded = {"symptom_predictor": model is not None, "chatbot": chatbot_model is not None, "xray_analyzer": xray_model is not None}
    return {"status": "ok" if all(loaded.values()) else "degraded", "version": app.version, "models_loaded": loaded, "xray_model": xray_metadata if xray_model is not None else None}


@app.post("/predict", dependencies=[Depends(verify_secret)])
def predict_disease(payload: PredictionRequest):
    if model is None or label_encoder is None or symptom_mapping is None:
        raise HTTPException(503, "Symptom prediction is unavailable. You can still request a consultation.")
    # Preserve exact dataset spellings, including its historical whitespace anomalies.
    aliases = {re.sub(r"\s+", "_", key.strip()): key for key in symptom_mapping}
    normalized = [re.sub(r"\s+", "_", value) for value in payload.symptoms]
    if any(value not in aliases for value in normalized):
        raise HTTPException(400, "Some symptoms are not recognised. Choose symptoms from the list.")
    vector = np.zeros(model.n_features_in_, dtype=np.float32)
    for value in normalized:
        vector[symptom_mapping[aliases[value]]] = 1
    probabilities = model.predict_proba([vector])[0]
    results = []
    for index in np.argsort(probabilities)[::-1][:3]:
        confidence = float(probabilities[index])
        if confidence > 0:
            encoded_class = int(model.classes_[index])
            disease = str(label_encoder.inverse_transform([encoded_class])[0])
            results.append({"disease": disease, "confidence": round(confidence, 4)})
    # Classifier scores are not calibrated clinical probabilities or a basis for ordering tests.
    follow_up = "Discuss these symptoms with a doctor" if not results or results[0]["confidence"] < 0.60 else None
    return {"results": results, "recommended_test": follow_up}


def fallback(confidence=0.0):
    intent = next((i for i in chatbot_intents if i["tag"] == "fallback"), None)
    response = random.choice(intent["responses"]) if intent else "I don't have a reliable answer for that. Try a different question or discuss it with a doctor."
    return {"intent": "fallback", "response": response, "confidence": round(confidence, 4)}


@app.post("/chat", dependencies=[Depends(verify_secret)])
def chat_response(payload: ChatRequest):
    if chatbot_model is None or not chatbot_vocabulary or not chatbot_classes or not chatbot_intents:
        raise HTTPException(503, "The health assistant is unavailable. Please try again later.")
    tokens = {stemmer.stem(w) for w in re.findall(r"\w+", payload.message.lower())}
    bag = np.array([float(word in tokens) for word in chatbot_vocabulary], dtype=np.float32)
    if not bag.any():
        return fallback()
    probabilities = chatbot_model.predict_proba([bag])[0]
    index = int(np.argmax(probabilities))
    confidence = float(probabilities[index])
    if confidence < 0.75:
        return fallback(confidence)
    tag = chatbot_classes[int(chatbot_model.classes_[index])]
    intent = next((i for i in chatbot_intents if i["tag"] == tag), None)
    if not intent or not intent["responses"]:
        return fallback(confidence)
    return {"intent": tag, "response": random.choice(intent["responses"]), "confidence": round(confidence, 4)}


@app.post("/analyze-upload", dependencies=[Depends(verify_secret)])
def analyze_xray(file: UploadFile = File(...)):
    if xray_model is None:
        raise HTTPException(503, "No trained X-ray model is installed. Your report can still be reviewed by a doctor.")
    import torch
    from PIL import Image, UnidentifiedImageError
    from xray_pipeline import preprocessing
    image_bytes = file.file.read(10 * 1024 * 1024 + 1)
    if not image_bytes or len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(413, "Images must be smaller than 10 MB.")
    try:
        with Image.open(BytesIO(image_bytes)) as image:
            if image.format not in {"JPEG", "PNG"} or min(image.size) < 64 or image.width * image.height > 25_000_000:
                raise ValueError("Unsupported image")
            image = image.convert("RGB")
    except (UnidentifiedImageError, ValueError, OSError, Image.DecompressionBombError):
        raise HTTPException(400, "Choose a readable JPG or PNG chest X-ray, at least 64 pixels on each side.")
    with torch.inference_mode():
        logits = xray_model(preprocessing()(image).unsqueeze(0))[0]
        probabilities = torch.softmax(logits / xray_temperature, dim=0)
    index = int(torch.argmax(probabilities))
    label = xray_labels[index].capitalize()
    return {"label": label, "confidence": round(float(probabilities[index]), 4), "flagged": label == "Pneumonia", "experimental": True, "population": xray_metadata.get("population", "See model card"), "model_version": xray_metadata.get("trained_at")}


@app.get("/intents", dependencies=[Depends(verify_secret)])
def get_intents_file():
    return json.loads((BASE / "intents.json").read_text(encoding="utf-8"))


@app.post("/intents", dependencies=[Depends(verify_secret)])
def save_intents_file(payload: IntentsPayload):
    if os.getenv("VERCEL"):
        raise HTTPException(501, "Assistant settings are read-only on this host. Update the source and redeploy to change them.")
    if not training_lock.acquire(blocking=False):
        raise HTTPException(409, "Training is in progress. Try saving again when it finishes.")
    try:
        temp = BASE / "intents.json.tmp"
        temp.write_text(json.dumps(payload.model_dump(), indent=2), encoding="utf-8")
        temp.replace(BASE / "intents.json")
        return {"status": "ok", "message": "Responses saved. Retrain the assistant to apply them."}
    finally:
        training_lock.release()


@app.post("/retrain", dependencies=[Depends(verify_secret)])
def retrain_chatbot():
    global chatbot_model, chatbot_vocabulary, chatbot_classes, chatbot_intents
    if os.getenv("VERCEL"):
        raise HTTPException(501, "Retraining requires the development environment. Train the model locally and redeploy it.")
    if not training_lock.acquire(blocking=False):
        raise HTTPException(409, "Training is already in progress.")
    try:
        from train_chatbot import train_chatbot
        train_chatbot()
        with (BASE / "chatbot_model.pkl").open("rb") as f:
            data = pickle.load(f)
        chatbot_model, chatbot_vocabulary = data["model"], data["vocabulary"]
        chatbot_classes, chatbot_intents = data["classes"], data["intents"]
        return {"status": "ok", "message": "The assistant has been retrained and is ready to use."}
    except Exception:
        logger.exception("Chatbot retraining failed")
        raise HTTPException(500, "Training failed. The previous model remains in use.")
    finally:
        training_lock.release()
