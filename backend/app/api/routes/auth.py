import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel

from app.api.admin_auth import require_admin_user
from app.config import get_settings
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
)
from app.services.usage_log_service import (
    EVENT_ADMIN_LOGIN,
    EVENT_ADMIN_LOGOUT,
    create_usage_log,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    user: dict[str, Any]


def remove_password_hash(user: dict) -> dict:
    return {
        key: value
        for key, value in user.items()
        if key != "password_hash"
    }


def set_admin_auth_cookie(response: Response, access_token: str) -> None:
    settings = get_settings()

    response.set_cookie(
        key=settings.admin_cookie_name,
        value=access_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.jwt_access_token_expire_minutes * 60,
        domain=settings.cookie_domain,
        path="/",
    )


def clear_admin_auth_cookie(response: Response) -> None:
    settings = get_settings()

    response.delete_cookie(
        key=settings.admin_cookie_name,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain,
        path="/",
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Autenticar administrador",
    description=(
        "Valida email e senha, cria o token de acesso e configura o cookie "
        "HttpOnly usado nas rotas administrativas."
    ),
)
def login(payload: LoginRequest, request: Request, response: Response):
    user = authenticate_user(
        email=payload.email,
        password=payload.password,
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Email ou senha invalidos.",
        )

    access_token = create_access_token({"sub": user["id"]})
    set_admin_auth_cookie(response, access_token)

    try:
        create_usage_log(
            event_type=EVENT_ADMIN_LOGIN,
            ip_address=request.client.host if request.client else None,
            user_id=user["id"],
            metadata={
                "email": user["email"],
                "role": user["role"],
            },
        )
    except Exception:
        logger.exception("Falha ao registrar usage_log de admin login")

    return {
        "user": remove_password_hash(user),
    }


@router.get(
    "/me",
    summary="Consultar administrador autenticado",
    description=(
        "Retorna os dados publicos do administrador associado ao token ou cookie atual."
    ),
)
def get_current_admin_user(
    user: dict = Depends(require_admin_user),
):
    return remove_password_hash(user)


@router.post(
    "/logout",
    summary="Encerrar sessao administrativa",
    description="Remove o cookie de autenticacao e registra o evento de logout.",
)
def logout(
    request: Request,
    response: Response,
    user: dict = Depends(require_admin_user),
):
    try:
        create_usage_log(
            event_type=EVENT_ADMIN_LOGOUT,
            ip_address=request.client.host if request.client else None,
            user_id=user["id"],
            metadata={
                "email": user["email"],
                "role": user["role"],
            },
        )
    except Exception:
        logger.exception("Falha ao registrar usage_log de admin logout")

    clear_admin_auth_cookie(response)
    return {"message": "Sessao encerrada com sucesso."}
