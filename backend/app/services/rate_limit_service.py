from datetime import datetime, timezone
from typing import Any

import redis

from app.config import get_settings

settings = get_settings()

redis_client = redis.Redis.from_url(
    settings.redis_url,
    decode_responses=True,
)

RATE_LIMIT_EXPIRATION_SECONDS = 48 * 60 * 60


def get_current_day_key() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _increment_daily_counter(key: str) -> int:
    count = redis_client.incr(key)

    if count == 1:
        redis_client.expire(key, RATE_LIMIT_EXPIRATION_SECONDS)

    return count


def check_rate_limit(scope: str, identifier: str, limit: int) -> dict[str, Any]:
    date = get_current_day_key()
    key = f"rate_limit:moderation-flow-ai:{scope}:{date}:{identifier}"
    count = _increment_daily_counter(key)

    return {
        "allowed": count <= limit,
        "count": count,
        "limit": limit,
    }
