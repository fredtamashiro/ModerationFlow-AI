import sys
from pathlib import Path

from sqlalchemy import text

PROJECT_ROOT = Path(__file__).resolve().parents[2]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.database.database import SessionLocal


MIGRATIONS_DIR = Path("app/database/migrations")


def ensure_migrations_table(db) -> None:
    schema_exists = db.execute(
        text(
            """
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.schemata
                WHERE schema_name = 'shared'
            ) AS schema_exists
            """
        )
    ).scalar()

    if not schema_exists:
        db.execute(text("CREATE SCHEMA shared"))

    db.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS shared.schema_migrations (
                id SERIAL PRIMARY KEY,
                filename TEXT NOT NULL UNIQUE,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
    )
    db.commit()


def get_applied_migrations(db) -> set[str]:
    rows = db.execute(
        text(
            """
            SELECT filename
            FROM shared.schema_migrations
            """
        )
    ).fetchall()

    return {row.filename for row in rows}


def apply_migration(db, migration_file: Path) -> None:
    sql_content = migration_file.read_text(encoding="utf-8")

    try:
        db.execute(text(sql_content))
        db.execute(
            text(
                """
                INSERT INTO shared.schema_migrations (filename)
                VALUES (:filename)
                """
            ),
            {"filename": migration_file.name},
        )
        db.commit()
        print(f"Applied migration: {migration_file.name}")
    except Exception as error:
        db.rollback()
        print(f"Error applying migration {migration_file.name}: {error}")
        raise


def run_migrations() -> None:
    migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    applied_count = 0
    skipped_count = 0

    with SessionLocal() as db:
        ensure_migrations_table(db)
        applied_migrations = get_applied_migrations(db)

        for migration_file in migration_files:
            if migration_file.name in applied_migrations:
                print(f"Skipping migration: {migration_file.name}")
                skipped_count += 1
                continue

            apply_migration(db, migration_file)
            applied_count += 1
            applied_migrations.add(migration_file.name)

    print(
        "Migration run complete: "
        f"{applied_count} applied, {skipped_count} skipped, "
        f"{len(migration_files)} total."
    )


if __name__ == "__main__":
    run_migrations()
