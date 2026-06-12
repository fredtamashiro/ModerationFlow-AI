"""initial schema

Revision ID: 202606041710
Revises:
Create Date: 2026-06-04 17:10:00
"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "202606041710"
down_revision: str | None = "202606041650"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        CREATE SCHEMA IF NOT EXISTS auth;
        CREATE SCHEMA IF NOT EXISTS shared;

        CREATE TABLE IF NOT EXISTS auth.users (
            id UUID PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            name TEXT,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'admin',
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS auth.sessions (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS shared.usage_logs (
            id UUID PRIMARY KEY,
            project TEXT NOT NULL,
            event_type TEXT NOT NULL,
            ip_address TEXT,
            user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            document_id UUID,
            metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS shared_usage_logs_project_event_type_idx
        ON shared.usage_logs(project, event_type);

        CREATE INDEX IF NOT EXISTS shared_usage_logs_created_at_idx
        ON shared.usage_logs(created_at);
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DROP INDEX IF EXISTS shared.shared_usage_logs_created_at_idx;
        DROP INDEX IF EXISTS shared.shared_usage_logs_project_event_type_idx;
        DROP TABLE IF EXISTS shared.usage_logs;
        DROP TABLE IF EXISTS auth.sessions;
        DROP TABLE IF EXISTS auth.users;
        DROP SCHEMA IF EXISTS shared;
        DROP SCHEMA IF EXISTS auth;
        """
    )
