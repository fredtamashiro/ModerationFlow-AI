"""create initial schemas and tables

Revision ID: 202606041710
Revises: 202606041650
Create Date: 2026-06-04 17:10:00
"""
from typing import Sequence, Union

from alembic import op

revision: str = "202606041710"
down_revision: Union[str, None] = "202606041650"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS smartdocs;
CREATE SCHEMA IF NOT EXISTS shared;

CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    password_hash TEXT,
    role TEXT NOT NULL DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth.sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS smartdocs.documents (
    id UUID PRIMARY KEY,
    original_filename TEXT NOT NULL,
    stored_filename TEXT NOT NULL,
    file_path TEXT,
    storage_url TEXT,

    collection_name TEXT,
    enriched_collection_name TEXT,
    retrieval_mode TEXT DEFAULT 'enriched',

    theme_id TEXT,
    theme_name TEXT,

    total_pages INTEGER DEFAULT 0,
    total_chars INTEGER DEFAULT 0,
    total_chunks INTEGER DEFAULT 0,

    chunks_file TEXT,
    enriched_chunks_file TEXT,

    document_summary TEXT,
    document_type TEXT,
    main_topics JSONB DEFAULT '[]'::jsonb,
    suggested_questions JSONB DEFAULT '[]'::jsonb,
    summary_limitations JSONB DEFAULT '[]'::jsonb,

    status TEXT DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS smartdocs.themes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    enrichment_rules JSONB DEFAULT '[]'::jsonb,
    query_rules JSONB DEFAULT '[]'::jsonb,
    answer_rules JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS smartdocs.processing_jobs (
    id UUID PRIMARY KEY,
    job_type TEXT NOT NULL,
    status TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    current_step TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    partial_result JSONB,
    result JSONB,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS smartdocs.chunks (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES smartdocs.documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    page INTEGER,
    content TEXT NOT NULL,
    char_count INTEGER,
    chunk_strategy TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(document_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS smartdocs.enriched_chunks (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES smartdocs.documents(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES smartdocs.chunks(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    page INTEGER,
    content TEXT NOT NULL,

    is_valid BOOLEAN DEFAULT TRUE,
    quality_score NUMERIC(4,3),
    title TEXT,
    summary TEXT,
    category TEXT,
    keywords JSONB DEFAULT '[]'::jsonb,
    possible_questions JSONB DEFAULT '[]'::jsonb,
    warnings JSONB DEFAULT '[]'::jsonb,

    embedding_content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(document_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS smartdocs.embeddings (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES smartdocs.documents(id) ON DELETE CASCADE,
    enriched_chunk_id UUID NOT NULL REFERENCES smartdocs.enriched_chunks(id) ON DELETE CASCADE,
    embedding vector(1536),
    model TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shared.usage_logs (
    id UUID PRIMARY KEY,
    project TEXT NOT NULL,
    event_type TEXT NOT NULL,
    ip_address TEXT,
    user_id UUID,
    document_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS smartdocs_chunks_document_id_idx
ON smartdocs.chunks(document_id);

CREATE INDEX IF NOT EXISTS smartdocs_enriched_chunks_document_id_idx
ON smartdocs.enriched_chunks(document_id);

CREATE INDEX IF NOT EXISTS smartdocs_embeddings_document_id_idx
ON smartdocs.embeddings(document_id);

CREATE INDEX IF NOT EXISTS smartdocs_processing_jobs_status_idx
ON smartdocs.processing_jobs(status);

CREATE INDEX IF NOT EXISTS shared_usage_logs_project_event_type_idx
ON shared.usage_logs(project, event_type);

CREATE INDEX IF NOT EXISTS shared_usage_logs_created_at_idx
ON shared.usage_logs(created_at);

CREATE INDEX IF NOT EXISTS smartdocs_embeddings_vector_hnsw_idx
ON smartdocs.embeddings
USING hnsw (embedding vector_cosine_ops);
""")


def downgrade() -> None:
    op.execute("""
DROP INDEX IF EXISTS smartdocs.smartdocs_embeddings_vector_hnsw_idx;
DROP INDEX IF EXISTS shared.shared_usage_logs_created_at_idx;
DROP INDEX IF EXISTS shared.shared_usage_logs_project_event_type_idx;
DROP INDEX IF EXISTS smartdocs.smartdocs_processing_jobs_status_idx;
DROP INDEX IF EXISTS smartdocs.smartdocs_embeddings_document_id_idx;
DROP INDEX IF EXISTS smartdocs.smartdocs_enriched_chunks_document_id_idx;
DROP INDEX IF EXISTS smartdocs.smartdocs_chunks_document_id_idx;

DROP TABLE IF EXISTS shared.usage_logs;
DROP TABLE IF EXISTS smartdocs.embeddings;
DROP TABLE IF EXISTS smartdocs.enriched_chunks;
DROP TABLE IF EXISTS smartdocs.chunks;
DROP TABLE IF EXISTS smartdocs.processing_jobs;
DROP TABLE IF EXISTS smartdocs.themes;
DROP TABLE IF EXISTS smartdocs.documents;
DROP TABLE IF EXISTS auth.sessions;
DROP TABLE IF EXISTS auth.users;

DROP SCHEMA IF EXISTS shared;
DROP SCHEMA IF EXISTS smartdocs;
DROP SCHEMA IF EXISTS auth;
""")
