from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from sqlalchemy import bindparam, text
from sqlalchemy.dialects.postgresql import JSONB

from app.database.database import SessionLocal


STATUS_PENDING = "pending"
STATUS_PROCESSING = "processing"
STATUS_COMPLETED = "completed"
STATUS_FAILED = "failed"

ALLOWED_UPDATE_FIELDS = {
    "status",
    "progress",
    "current_step",
    "payload",
    "partial_result",
    "result",
    "error",
}


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def serialize_job(row) -> dict[str, Any]:
    mapping = row._mapping

    created_at = mapping["created_at"]
    updated_at = mapping["updated_at"]

    return {
        "job_id": str(mapping["id"]),
        "job_type": mapping["job_type"],
        "status": mapping["status"],
        "progress": mapping["progress"],
        "current_step": mapping["current_step"],
        "payload": mapping["payload"],
        "partial_result": mapping["partial_result"],
        "result": mapping["result"],
        "error": mapping["error"],
        "created_at": created_at.isoformat() if created_at else None,
        "updated_at": updated_at.isoformat() if updated_at else None,
    }


def create_processing_job(job_type: str, payload: dict[str, Any]) -> dict[str, Any]:
    job_id = str(uuid4())

    with SessionLocal() as db:
        insert_query = text(
            """
                INSERT INTO smartdocs.processing_jobs (
                    id,
                    job_type,
                    status,
                    progress,
                    current_step,
                    payload,
                    result,
                    error
                )
                VALUES (
                    CAST(:id AS UUID),
                    :job_type,
                    :status,
                    :progress,
                    :current_step,
                    :payload,
                    :result,
                    :error
                )
                """
        ).bindparams(bindparam("payload", type_=JSONB))

        db.execute(
            insert_query,
            {
                "id": job_id,
                "job_type": job_type,
                "status": STATUS_PENDING,
                "progress": 0,
                "current_step": "Job criado",
                "payload": payload,
                "result": None,
                "error": None,
            },
        )
        db.commit()

    return get_processing_job(job_id)


def get_processing_job(job_id: str) -> dict[str, Any]:
    with SessionLocal() as db:
        row = db.execute(
            text(
                """
                SELECT
                    id,
                    job_type,
                    status,
                    progress,
                    current_step,
                    payload,
                    partial_result,
                    result,
                    error,
                    created_at,
                    updated_at
                FROM smartdocs.processing_jobs
                WHERE id = CAST(:job_id AS UUID)
                """
            ),
            {"job_id": job_id},
        ).fetchone()

    if row is None:
        raise ValueError("Job não encontrado.")

    return serialize_job(row)


def update_processing_job(job_id: str, updates: dict[str, Any]) -> dict[str, Any]:
    get_processing_job(job_id)

    filtered_updates = {
        field: value
        for field, value in updates.items()
        if field in ALLOWED_UPDATE_FIELDS
    }

    if not filtered_updates:
        return get_processing_job(job_id)

    set_clauses = [f"{field} = :{field}" for field in filtered_updates]
    set_clauses.append("updated_at = NOW()")

    params = {
        "job_id": job_id,
        **filtered_updates,
    }

    with SessionLocal() as db:
        update_query = text(
            f"""
                UPDATE smartdocs.processing_jobs
                SET {", ".join(set_clauses)}
                WHERE id = CAST(:job_id AS UUID)
                """
        )

        json_fields = {"payload", "partial_result", "result"}
        json_bindparams = [
            bindparam(field, type_=JSONB)
            for field in filtered_updates
            if field in json_fields
        ]

        if json_bindparams:
            update_query = update_query.bindparams(*json_bindparams)

        db.execute(
            update_query,
            params,
        )
        db.commit()

    return get_processing_job(job_id)


def list_processing_jobs() -> list[dict[str, Any]]:
    with SessionLocal() as db:
        rows = db.execute(
            text(
                """
                SELECT
                    id,
                    job_type,
                    status,
                    progress,
                    current_step,
                    payload,
                    partial_result,
                    result,
                    error,
                    created_at,
                    updated_at
                FROM smartdocs.processing_jobs
                ORDER BY created_at DESC
                """
            )
        ).fetchall()

    return [serialize_job(row) for row in rows]
