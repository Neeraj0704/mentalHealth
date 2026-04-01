from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import providers

app = FastAPI(title="MindPath API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(providers.router)


@app.get("/health")
def health():
    return {"status": "ok"}
