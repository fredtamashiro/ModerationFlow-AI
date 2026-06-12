import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.database.run_migrations import run_migrations
from app.database.seeds.seed_admin import seed_admin


def bootstrap_database() -> None:
    print("Starting database bootstrap...")

    print("Running migrations...")
    run_migrations()

    print("Seeding admin...")
    seed_admin()

    print("Database bootstrap complete.")


if __name__ == "__main__":
    bootstrap_database()
