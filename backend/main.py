import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import providers, booking, facilities, auth
from learn.router import router as learn_router
from voice.router import router as voice_router

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="MindPath API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(providers.router)
app.include_router(booking.router)
app.include_router(facilities.router)
app.include_router(auth.router)
app.include_router(learn_router)

# Voice agent — ElevenLabs calls POST /chat/completions at the root
# Mobile app polls GET /voice/state/{session_id}
app.include_router(voice_router)


@app.get("/health")
def health():
    return {"status": "ok"}
