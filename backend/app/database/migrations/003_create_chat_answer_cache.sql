CREATE TABLE IF NOT EXISTS smartdocs.chat_answer_cache (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES smartdocs.documents(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    question_normalized TEXT NOT NULL,
    question_embedding vector(1536) NOT NULL,
    answer TEXT NOT NULL,
    sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    model TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    hit_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chat_answer_cache_document_id
ON smartdocs.chat_answer_cache (document_id);

CREATE INDEX IF NOT EXISTS idx_chat_answer_cache_document_question
ON smartdocs.chat_answer_cache (document_id, question_normalized);

CREATE INDEX IF NOT EXISTS idx_chat_answer_cache_embedding_hnsw
ON smartdocs.chat_answer_cache
USING hnsw (question_embedding vector_cosine_ops);
