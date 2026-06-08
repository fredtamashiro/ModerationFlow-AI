import sys
from pathlib import Path

from sqlalchemy import text

PROJECT_ROOT = Path(__file__).resolve().parents[2]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.config import get_settings
from app.database.database import SessionLocal
from app.services.auth_service import get_user_by_email, hash_password


def reset_admin_password() -> None:
    settings = get_settings()
    email = settings.admin_seed_email.strip()
    password = settings.admin_seed_password.strip()

    if not email:
        raise SystemExit("ADMIN_SEED_EMAIL is required.")

    if not password:
        raise SystemExit("ADMIN_SEED_PASSWORD is required.")

    existing_user = get_user_by_email(email)

    if not existing_user:
        raise SystemExit("Admin not found. Run bootstrap first.")

    password_hash = hash_password(password)

    with SessionLocal() as db:
        db.execute(
            text(
                """
                UPDATE auth.users
                SET
                    password_hash = :password_hash,
                    updated_at = NOW()
                WHERE email = :email
                """
            ),
            {
                "email": email,
                "password_hash": password_hash,
            },
        )
        db.commit()

    print(f"Admin password updated: {email}")


if __name__ == "__main__":
    reset_admin_password()
