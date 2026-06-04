from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings

settings = get_settings()


def get_sqlalchemy_database_url() -> str:
    if settings.database_url.startswith("postgresql://"):
        return settings.database_url.replace(
            "postgresql://",
            "postgresql+psycopg://",
            1,
        )

    return settings.database_url


engine = create_engine(
    get_sqlalchemy_database_url(),
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db_session() -> Generator[Session, None, None]:
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> dict:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1 AS status"))
        row = result.fetchone()

    return {
        "connected": row is not None and row.status == 1,
    }
