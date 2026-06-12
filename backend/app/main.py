from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.usage_logs import router as usage_logs_router
from app.config import get_settings

settings = get_settings()
origins = [
    origin.strip()
    for origin in settings.frontend_origins.split(",")
    if origin.strip()
]

app = FastAPI(
    title="ModerationFlow AI",
    description=(
        "API base para moderacao assistida por IA com auditoria "
        "e Human-in-the-Loop."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "name": "ModerationFlow AI",
        "status": "ok",
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "ModerationFlow AI API is running",
    }


app.include_router(health_router)
app.include_router(usage_logs_router)
app.include_router(auth_router)
