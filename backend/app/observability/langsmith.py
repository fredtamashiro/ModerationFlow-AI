from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from functools import lru_cache
import os
from typing import Any
from uuid import uuid4

from langsmith import Client

from app.config import get_settings


@dataclass
class LangSmithRunContext:
    client: Client | None
    enabled: bool
    run_id: str | None = None


def is_langsmith_enabled() -> bool:
    settings = get_settings()
    return bool(settings.langsmith_tracing and settings.langsmith_api_key)


@lru_cache
def _get_langsmith_client() -> Client | None:
    if not is_langsmith_enabled():
        return None

    settings = get_settings()
    _sync_langsmith_endpoint_env(settings.langsmith_endpoint)
    client_kwargs: dict[str, Any] = {"api_key": settings.langsmith_api_key}
    endpoint = settings.langsmith_endpoint
    if endpoint is not None:
        client_kwargs["api_url"] = endpoint
    return Client(**client_kwargs)


def start_langsmith_run(
    *,
    name: str,
    inputs: dict[str, Any],
    metadata: dict[str, Any],
    tags: list[str] | None = None,
) -> LangSmithRunContext:
    client = _get_langsmith_client()
    if client is None:
        return LangSmithRunContext(client=None, enabled=False)

    settings = get_settings()
    run_id = str(uuid4())
    client.create_run(
        name=name,
        inputs=inputs,
        run_type="chain",
        project_name=settings.langsmith_project,
        id=run_id,
        start_time=_utc_now(),
        extra={"metadata": metadata},
        tags=tags or [],
    )
    return LangSmithRunContext(client=client, enabled=True, run_id=run_id)


def finalize_langsmith_run(
    context: LangSmithRunContext,
    *,
    outputs: dict[str, Any] | None = None,
    error: str | None = None,
    metadata: dict[str, Any] | None = None,
    tags: list[str] | None = None,
) -> None:
    if not context.enabled or context.client is None or context.run_id is None:
        return

    context.client.update_run(
        context.run_id,
        end_time=_utc_now(),
        outputs=outputs,
        error=error,
        extra={"metadata": metadata or {}},
        tags=tags or [],
    )


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _sync_langsmith_endpoint_env(endpoint: str | None) -> None:
    if endpoint is None:
        os.environ.pop("LANGSMITH_ENDPOINT", None)
        return

    os.environ["LANGSMITH_ENDPOINT"] = endpoint
