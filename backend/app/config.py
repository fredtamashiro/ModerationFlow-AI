from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Centraliza as configuracoes da aplicacao lidas do ambiente."""

    app_env: str = "development"
    app_name: str = "ModerationFlow AI"
    app_public_url: str = "http://localhost:3003"
    api_public_url: str = "http://localhost:8000"
    demo_mode: bool = False
    openai_api_key: str | None = None
    app_api_key: str | None = None
    openai_chat_model: str = "gpt-5-mini"
    openai_chat_temperature: float = 1
    langsmith_tracing: bool = False
    langsmith_api_key: str | None = None
    langsmith_project: str = "moderation-flow-ai-dev"
    langsmith_endpoint: str | None = None
    database_url: str = ""
    jwt_secret_key: str = "change-me-local"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 720
    admin_cookie_name: str = "moderation_flow_admin_token"
    frontend_origins: str = "http://localhost:3003"
    cookie_domain: str | None = None
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    admin_seed_email: str = ""
    admin_seed_password: str = ""
    admin_seed_name: str = "Demo Admin"
    admin_demo_email: str | None = None
    admin_demo_password: str | None = None

    @field_validator(
        "admin_demo_email",
        "admin_demo_password",
        "cookie_domain",
        "langsmith_api_key",
        "langsmith_endpoint",
        mode="before",
    )
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None

        normalized = value.strip()
        return normalized or None

    class Config:
        """Configura como o Pydantic carrega variaveis do arquivo .env."""

        env_file = Path(__file__).resolve().parents[1] / ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
