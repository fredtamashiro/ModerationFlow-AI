from collections.abc import Callable
from time import perf_counter
from typing import Any

from langchain_openai import OpenAIEmbeddings
from sqlalchemy import text

from app.config import get_settings
from app.database.database import SessionLocal


def _format_embedding_for_pgvector(embedding: list[float]) -> str:
    return "[" + ",".join(str(value) for value in embedding) + "]"


def search_similar_chunks_pgvector(
    document_id: str,
    query: str,
    k: int = 4,
    query_embedding: list[float] | None = None,
    on_timing: Callable[[str, int], None] | None = None,
) -> list[dict[str, Any]]:
    settings = get_settings()
    resolved_query_embedding = query_embedding

    if resolved_query_embedding is None:
        embeddings_model = OpenAIEmbeddings(
            model=settings.openai_embedding_model,
        )

        embedding_started_at = perf_counter()
        resolved_query_embedding = embeddings_model.embed_query(query)
        if on_timing is not None:
            on_timing("embedding_ms", int((perf_counter() - embedding_started_at) * 1000))

    query_embedding_value = _format_embedding_for_pgvector(resolved_query_embedding)

    sql = text(
        """
        SELECT
            ec.chunk_index,
            ec.page,
            ec.content,
            ec.embedding_content,
            ec.title,
            ec.summary,
            ec.category,
            ec.keywords,
            ec.possible_questions,
            ec.warnings,
            ec.quality_score,
            ec.is_valid,
            e.embedding <=> CAST(:query_embedding AS vector) AS score
        FROM smartdocs.embeddings e
        JOIN smartdocs.enriched_chunks ec
            ON ec.id = e.enriched_chunk_id
        WHERE e.document_id = CAST(:document_id AS uuid)
        ORDER BY e.embedding <=> CAST(:query_embedding AS vector)
        LIMIT :k
        """
    )

    retrieval_started_at = perf_counter()
    with SessionLocal() as db:
        rows = db.execute(
            sql,
            {
                "document_id": document_id,
                "query_embedding": query_embedding_value,
                "k": k,
            },
        ).mappings().all()
    if on_timing is not None:
        on_timing("retrieval_ms", int((perf_counter() - retrieval_started_at) * 1000))

    results = []

    for row in rows:
        results.append(
            {
                "page": row["page"],
                "chunk_index": row["chunk_index"],
                "score": float(row["score"]),
                "content": row["content"],
                "embedding_content": row["embedding_content"],
                "metadata": {
                    "title": row["title"],
                    "summary": row["summary"],
                    "category": row["category"],
                    "keywords": row["keywords"] or [],
                    "possible_questions": row["possible_questions"] or [],
                    "warnings": row["warnings"] or [],
                    "quality_score": (
                        float(row["quality_score"])
                        if row["quality_score"] is not None
                        else None
                    ),
                    "is_valid": row["is_valid"],
                },
            }
        )

    return results
