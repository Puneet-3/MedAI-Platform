from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables
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

@app.get("/health")
def health():
    return {"status": "ok"}
