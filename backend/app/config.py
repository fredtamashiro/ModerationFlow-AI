from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Centraliza as configuracoes da aplicacao lidas do ambiente."""

    app_env: str = "local"
    app_name: str = "ModerationFlow AI"
    openai_api_key: str
    app_api_key: str | None = None
    openai_chat_model: str = "gpt-5-mini"
    openai_chat_temperature: float = 1
    database_url: str = (
        "postgresql://moderation_flow:moderation_flow@postgres:5432/moderation_flow"
    )
    redis_url: str = "redis://redis:6379/0"
    jwt_secret_key: str = "change-this-secret-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 720
    admin_cookie_name: str = "moderation_flow_admin_token"
    frontend_origins: str = "http://localhost:2000"
    cookie_domain: str | None = None
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    admin_seed_email: str = ""
    admin_seed_password: str = ""
    admin_seed_name: str = ""

    @field_validator("cookie_domain", mode="before")
    @classmethod
    def normalize_cookie_domain(cls, value: str | None) -> str | None:
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
