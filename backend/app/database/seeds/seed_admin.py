import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.config import get_settings
from app.services.auth_service import create_admin_user, get_user_by_email


def seed_admin() -> None:
    settings = get_settings()
    email = settings.admin_seed_email.strip()
    password = settings.admin_seed_password.strip()
    name = settings.admin_seed_name.strip() or None

    if not email or not password:
        print(
            "Skipping admin seed: ADMIN_SEED_EMAIL or "
            "ADMIN_SEED_PASSWORD not configured."
        )
        return

    existing_user = get_user_by_email(email)

    if existing_user:
        print(f"Admin already exists: {existing_user['email']}")
        return

    created_user = create_admin_user(
        email=email,
        password=password,
        name=name,
    )
    print(f"Admin created successfully: {created_user['email']}")


if __name__ == "__main__":
    seed_admin()
