from collections.abc import Sequence

from sqlalchemy import text

from app.database.database import SessionLocal


ALLOWED_COMMENT_STATUSES = {
    "pending",
    "analyzing",
    "waiting_human_review",
    "approved",
    "removed",
    "edit_requested",
    "failed",
}

ALLOWED_GUIDELINE_SEVERITIES = {
    "low",
    "medium",
    "high",
    "critical",
}


def _serialize_rows(rows: Sequence) -> list[dict]:
    return [dict(row._mapping) for row in rows]


def list_comments(limit: int, offset: int, status: str | None = None) -> list[dict]:
    query = """
        SELECT
            id,
            author_name,
            course_name,
            lesson_name,
            content,
            status,
            metadata,
            created_at,
            updated_at
        FROM moderation.comments
    """
    params: dict[str, object] = {
        "limit": limit,
        "offset": offset,
    }

    if status:
        query += " WHERE status = :status"
        params["status"] = status

    query += " ORDER BY created_at DESC LIMIT :limit OFFSET :offset"

    with SessionLocal() as db:
        rows = db.execute(text(query), params).fetchall()

    return _serialize_rows(rows)


def count_comments(status: str | None = None) -> int:
    query = "SELECT COUNT(*) AS total FROM moderation.comments"
    params: dict[str, object] = {}

    if status:
        query += " WHERE status = :status"
        params["status"] = status

    with SessionLocal() as db:
        total = db.execute(text(query), params).scalar_one()

    return int(total)


def get_comment_by_id(comment_id: str) -> dict | None:
    with SessionLocal() as db:
        row = db.execute(
            text(
                """
                SELECT
                    id,
                    author_name,
                    course_name,
                    lesson_name,
                    content,
                    status,
                    metadata,
                    created_at,
                    updated_at
                FROM moderation.comments
                WHERE id = CAST(:comment_id AS UUID)
                """
            ),
            {"comment_id": comment_id},
        ).fetchone()

    return dict(row._mapping) if row else None


def list_guidelines(
    limit: int,
    offset: int,
    severity: str | None = None,
) -> list[dict]:
    query = """
        SELECT
            id,
            code,
            title,
            description,
            severity,
            examples,
            metadata,
            created_at,
            updated_at
        FROM moderation.guidelines
    """
    params: dict[str, object] = {
        "limit": limit,
        "offset": offset,
    }

    if severity:
        query += " WHERE severity = :severity"
        params["severity"] = severity

    query += " ORDER BY code ASC LIMIT :limit OFFSET :offset"

    with SessionLocal() as db:
        rows = db.execute(text(query), params).fetchall()

    return _serialize_rows(rows)


def count_guidelines(severity: str | None = None) -> int:
    query = "SELECT COUNT(*) AS total FROM moderation.guidelines"
    params: dict[str, object] = {}

    if severity:
        query += " WHERE severity = :severity"
        params["severity"] = severity

    with SessionLocal() as db:
        total = db.execute(text(query), params).scalar_one()

    return int(total)


def get_guideline_by_id(guideline_id: str) -> dict | None:
    with SessionLocal() as db:
        row = db.execute(
            text(
                """
                SELECT
                    id,
                    code,
                    title,
                    description,
                    severity,
                    examples,
                    metadata,
                    created_at,
                    updated_at
                FROM moderation.guidelines
                WHERE id = CAST(:guideline_id AS UUID)
                """
            ),
            {"guideline_id": guideline_id},
        ).fetchone()

    return dict(row._mapping) if row else None


def get_guideline_by_code(code: str) -> dict | None:
    with SessionLocal() as db:
        row = db.execute(
            text(
                """
                SELECT
                    id,
                    code,
                    title,
                    description,
                    severity,
                    examples,
                    metadata,
                    created_at,
                    updated_at
                FROM moderation.guidelines
                WHERE code = :code
                """
            ),
            {"code": code},
        ).fetchone()

    return dict(row._mapping) if row else None


def list_runs_by_comment_id(comment_id: str) -> list[dict]:
    with SessionLocal() as db:
        rows = db.execute(
            text(
                """
                SELECT
                    id,
                    comment_id,
                    status,
                    route,
                    risk_level,
                    category,
                    confidence,
                    recommended_action,
                    critic_applied,
                    requires_human_review,
                    created_at,
                    updated_at
                FROM moderation.moderation_runs
                WHERE comment_id = CAST(:comment_id AS UUID)
                ORDER BY created_at DESC
                """
            ),
            {"comment_id": comment_id},
        ).fetchall()

    return _serialize_rows(rows)


def get_latest_run_for_comment(comment_id: str) -> dict | None:
    with SessionLocal() as db:
        row = db.execute(
            text(
                """
                SELECT
                    id,
                    comment_id,
                    status,
                    route,
                    risk_level,
                    category,
                    confidence,
                    recommended_action,
                    critic_applied,
                    requires_human_review,
                    created_at,
                    updated_at
                FROM moderation.moderation_runs
                WHERE comment_id = CAST(:comment_id AS UUID)
                ORDER BY created_at DESC
                LIMIT 1
                """
            ),
            {"comment_id": comment_id},
        ).fetchone()

    return dict(row._mapping) if row else None


def get_run_by_id(run_id: str) -> dict | None:
    with SessionLocal() as db:
        row = db.execute(
            text(
                """
                SELECT
                    id
                FROM moderation.moderation_runs
                WHERE id = CAST(:run_id AS UUID)
                """
            ),
            {"run_id": run_id},
        ).fetchone()

    return dict(row._mapping) if row else None


def list_steps_by_run_id(run_id: str) -> list[dict]:
    with SessionLocal() as db:
        rows = db.execute(
            text(
                """
                SELECT
                    id,
                    run_id,
                    node_name,
                    status,
                    duration_ms,
                    model,
                    input_tokens,
                    output_tokens,
                    metadata,
                    error_message,
                    created_at
                FROM moderation.moderation_steps
                WHERE run_id = CAST(:run_id AS UUID)
                ORDER BY created_at ASC
                """
            ),
            {"run_id": run_id},
        ).fetchall()

    return _serialize_rows(rows)


def list_decisions_by_comment_id(comment_id: str) -> list[dict]:
    with SessionLocal() as db:
        rows = db.execute(
            text(
                """
                SELECT
                    id,
                    comment_id,
                    run_id,
                    ai_recommendation,
                    human_decision,
                    human_category,
                    human_risk_level,
                    moderator_note,
                    final_content,
                    was_ai_correct,
                    decided_at,
                    created_at
                FROM moderation.moderation_decisions
                WHERE comment_id = CAST(:comment_id AS UUID)
                ORDER BY decided_at DESC
                """
            ),
            {"comment_id": comment_id},
        ).fetchall()

    return _serialize_rows(rows)
