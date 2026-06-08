import re
from typing import Any
from uuid import uuid4

from langchain_openai import OpenAIEmbeddings
from sqlalchemy import bindparam, text
from sqlalchemy.dialects.postgresql import JSONB

from app.config import get_settings
from app.database.database import SessionLocal


def _format_embedding_for_pgvector(embedding: list[float]) -> str:
    return "[" + ",".join(str(value) for value in embedding) + "]"


def normalize_question(question: str) -> str:
    normalized = question.strip().lower()
    return re.sub(r"\s+", " ", normalized)


def get_question_embedding(question: str) -> list[float]:
    settings = get_settings()
    embeddings_model = OpenAIEmbeddings(
        model=settings.openai_embedding_model,
    )
    return embeddings_model.embed_query(question)


def find_exact_cached_answer(document_id: str, question: str) -> dict[str, Any] | None:
    normalized_question = normalize_question(question)
    settings = get_settings()

    query = text(
        """
        SELECT
            id,
            document_id,
            question,
            question_normalized,
            answer,
            sources,
            model,
            metadata,
            hit_count,
            created_at,
            updated_at,
            last_used_at
        FROM smartdocs.chat_answer_cache
        WHERE document_id = CAST(:document_id AS UUID)
          AND question_normalized = :question_normalized
          AND updated_at >= NOW() - (:ttl_days * INTERVAL '1 day')
        ORDER BY updated_at DESC
        LIMIT 1
        """
    )

    with SessionLocal() as db:
        row = db.execute(
            query,
            {
                "document_id": document_id,
                "question_normalized": normalized_question,
                "ttl_days": settings.chat_answer_cache_ttl_days,
            },
        ).mappings().first()

    return dict(row) if row else None


def find_semantic_cached_answer(
    document_id: str,
    question_embedding: list[float],
    threshold: float,
) -> dict[str, Any] | None:
    settings = get_settings()
    query = text(
        """
        SELECT
            id,
            document_id,
            question,
            question_normalized,
            answer,
            sources,
            model,
            metadata,
            hit_count,
            created_at,
            updated_at,
            last_used_at,
            question_embedding <=> CAST(:question_embedding AS vector) AS distance
        FROM smartdocs.chat_answer_cache
        WHERE document_id = CAST(:document_id AS UUID)
          AND updated_at >= NOW() - (:ttl_days * INTERVAL '1 day')
        ORDER BY question_embedding <=> CAST(:question_embedding AS vector)
        LIMIT 1
        """
    )

    with SessionLocal() as db:
        row = db.execute(
            query,
            {
                "document_id": document_id,
                "question_embedding": _format_embedding_for_pgvector(question_embedding),
                "ttl_days": settings.chat_answer_cache_ttl_days,
            },
        ).mappings().first()

    if not row:
        return None

    distance = float(row["distance"])
    if distance > threshold:
        return None

    result = dict(row)
    result["distance"] = distance
    return result


def save_cached_answer(
    document_id: str,
    question: str,
    question_embedding: list[float],
    answer: str,
    sources: list[dict[str, Any]],
    model: str | None,
    metadata: dict[str, Any],
) -> dict[str, Any]:
    normalized_question = normalize_question(question)
    embedding_value = _format_embedding_for_pgvector(question_embedding)
    existing_query = text(
        """
        SELECT id
        FROM smartdocs.chat_answer_cache
        WHERE document_id = CAST(:document_id AS UUID)
          AND question_normalized = :question_normalized
        ORDER BY updated_at DESC
        LIMIT 1
        """
    )

    with SessionLocal() as db:
        existing = db.execute(
            existing_query,
            {
                "document_id": document_id,
                "question_normalized": normalized_question,
            },
        ).mappings().first()

    if existing:
        update_query = text(
            """
            UPDATE smartdocs.chat_answer_cache
            SET
                question = :question,
                question_normalized = :question_normalized,
                question_embedding = CAST(:question_embedding AS vector),
                answer = :answer,
                sources = :sources,
                model = :model,
                metadata = :metadata,
                updated_at = NOW()
            WHERE id = CAST(:cache_id AS UUID)
            RETURNING
                id,
                document_id,
                question,
                question_normalized,
                answer,
                sources,
                model,
                metadata,
                hit_count,
                created_at,
                updated_at,
                last_used_at
            """
        ).bindparams(
            bindparam("sources", type_=JSONB),
            bindparam("metadata", type_=JSONB),
        )

        with SessionLocal() as db:
            row = db.execute(
                update_query,
                {
                    "cache_id": existing["id"],
                    "question": question,
                    "question_normalized": normalized_question,
                    "question_embedding": embedding_value,
                    "answer": answer,
                    "sources": sources,
                    "model": model,
                    "metadata": metadata,
                },
            ).mappings().first()
            db.commit()

        return dict(row)

    insert_query = text(
        """
        INSERT INTO smartdocs.chat_answer_cache (
            id,
            document_id,
            question,
            question_normalized,
            question_embedding,
            answer,
            sources,
            model,
            metadata
        )
        VALUES (
            CAST(:id AS UUID),
            CAST(:document_id AS UUID),
            :question,
            :question_normalized,
            CAST(:question_embedding AS vector),
            :answer,
            :sources,
            :model,
            :metadata
        )
        RETURNING
            id,
            document_id,
            question,
            question_normalized,
            answer,
            sources,
            model,
            metadata,
            hit_count,
            created_at,
            updated_at,
            last_used_at
        """
    ).bindparams(
        bindparam("sources", type_=JSONB),
        bindparam("metadata", type_=JSONB),
    )

    with SessionLocal() as db:
        row = db.execute(
            insert_query,
            {
                "id": str(uuid4()),
                "document_id": document_id,
                "question": question,
                "question_normalized": normalized_question,
                "question_embedding": embedding_value,
                "answer": answer,
                "sources": sources,
                "model": model,
                "metadata": metadata,
            },
        ).mappings().first()
        db.commit()

    return dict(row)


def mark_cache_hit(cache_id: str) -> None:
    query = text(
        """
        UPDATE smartdocs.chat_answer_cache
        SET
            hit_count = hit_count + 1,
            last_used_at = NOW(),
            updated_at = NOW()
        WHERE id = CAST(:cache_id AS UUID)
        """
    )

    with SessionLocal() as db:
        db.execute(query, {"cache_id": cache_id})
        db.commit()
