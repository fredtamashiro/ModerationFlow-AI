import json
from collections.abc import Sequence

from sqlalchemy import text
from sqlalchemy.orm import Session

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

ALLOWED_HUMAN_DECISIONS = {
    "approve",
    "flag",
    "remove",
    "request_edit",
}

ALLOWED_HUMAN_RISK_LEVELS = {
    "low",
    "medium",
    "high",
    "unknown",
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


def list_guidelines_for_analysis() -> list[dict]:
    with SessionLocal() as db:
        rows = db.execute(
            text(
                """
                SELECT
                    id,
                    code,
                    title,
                    description,
                    severity
                FROM moderation.guidelines
                ORDER BY code ASC
                """
            )
        ).fetchall()

    return _serialize_rows(rows)


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
                    metadata,
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


def get_comment_by_id_for_update(db: Session, comment_id: str) -> dict | None:
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
            FOR UPDATE
            """
        ),
        {"comment_id": comment_id},
    ).fetchone()

    return dict(row._mapping) if row else None


def create_human_decision(db: Session, comment_id: str, payload: dict) -> dict:
    row = db.execute(
        text(
            """
            INSERT INTO moderation.moderation_decisions (
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
                metadata
            )
            VALUES (
                gen_random_uuid(),
                CAST(:comment_id AS UUID),
                NULL,
                NULL,
                :human_decision,
                :human_category,
                :human_risk_level,
                :moderator_note,
                :final_content,
                NULL,
                CAST(:metadata AS JSONB)
            )
            RETURNING
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
                metadata,
                decided_at,
                created_at
            """
        ),
        {
            "comment_id": comment_id,
            "human_decision": payload["human_decision"],
            "human_category": payload.get("human_category"),
            "human_risk_level": payload.get("human_risk_level"),
            "moderator_note": payload.get("moderator_note"),
            "final_content": payload.get("final_content"),
            "metadata": json.dumps(payload.get("metadata", {})),
        },
    ).fetchone()

    return dict(row._mapping)


def update_comment_status(db: Session, comment_id: str, status: str) -> None:
    db.execute(
        text(
            """
            UPDATE moderation.comments
            SET
                status = :status,
                updated_at = NOW()
            WHERE id = CAST(:comment_id AS UUID)
            """
        ),
        {
            "comment_id": comment_id,
            "status": status,
        },
    )


def create_feedback_example(
    db: Session,
    comment_text: str,
    payload: dict,
) -> None:
    db.execute(
        text(
            """
            INSERT INTO moderation.feedback_examples (
                id,
                comment_text,
                ai_decision,
                human_decision,
                ai_category,
                human_category,
                ai_confidence,
                moderator_note,
                was_ai_correct,
                metadata
            )
            VALUES (
                gen_random_uuid(),
                :comment_text,
                NULL,
                :human_decision,
                NULL,
                :human_category,
                NULL,
                :moderator_note,
                NULL,
                CAST(:metadata AS JSONB)
            )
            """
        ),
        {
            "comment_text": comment_text,
            "human_decision": payload["human_decision"],
            "human_category": payload.get("human_category"),
            "moderator_note": payload.get("moderator_note"),
            "metadata": json.dumps(payload.get("metadata", {})),
        },
    )


def create_moderation_run(comment_id: str) -> dict:
    with SessionLocal.begin() as db:
        row = db.execute(
            text(
                """
                INSERT INTO moderation.moderation_runs (
                    id,
                    comment_id,
                    status,
                    critic_applied,
                    requires_human_review,
                    policy_references,
                    metadata,
                    started_at
                )
                VALUES (
                    gen_random_uuid(),
                    CAST(:comment_id AS UUID),
                    'started',
                    FALSE,
                    TRUE,
                    '[]'::jsonb,
                    CAST(:metadata AS JSONB),
                    NOW()
                )
                RETURNING id, comment_id, status, started_at, created_at
                """
            ),
            {
                "comment_id": comment_id,
                "metadata": json.dumps({"graph_version": "guideline_risk_v1"}),
            },
        ).fetchone()

        db.execute(
            text(
                """
                UPDATE moderation.comments
                SET status = 'analyzing', updated_at = NOW()
                WHERE id = CAST(:comment_id AS UUID)
                """
            ),
            {"comment_id": comment_id},
        )

    return dict(row._mapping)


def _insert_moderation_step(db: Session, run_id: str, step: dict) -> None:
    db.execute(
        text(
            """
            INSERT INTO moderation.moderation_steps (
                id,
                run_id,
                node_name,
                status,
                duration_ms,
                model,
                input_tokens,
                output_tokens,
                metadata,
                error_message
            )
            VALUES (
                gen_random_uuid(),
                CAST(:run_id AS UUID),
                :node_name,
                :status,
                :duration_ms,
                NULL,
                NULL,
                NULL,
                CAST(:metadata AS JSONB),
                :error_message
            )
            """
        ),
        {
            "run_id": run_id,
            "node_name": step["node_name"],
            "status": step["status"],
            "duration_ms": step.get("duration_ms"),
            "metadata": json.dumps(step.get("metadata", {})),
            "error_message": step.get("error_message"),
        },
    )


def complete_moderation_run(
    run_id: str,
    comment_id: str,
    graph_state: dict,
) -> None:
    with SessionLocal.begin() as db:
        for step in graph_state.get("steps", []):
            _insert_moderation_step(db, run_id, step)

        run_metadata = {
            "graph_version": "guideline_risk_v1",
            "input_guard_reason": graph_state.get("input_guard_reason"),
            "route_reason": graph_state.get("route_reason"),
            "route_confidence": graph_state.get("route_confidence"),
            "confidence_gate_decision": graph_state.get("confidence_gate_decision"),
            "critic_reason": graph_state.get("critic_reason"),
            "critic_summary": graph_state.get("critic_summary"),
        }
        db.execute(
            text(
                """
                UPDATE moderation.moderation_runs
                SET
                    status = 'waiting_human_review',
                    route = :route,
                    risk_level = :risk_level,
                    category = :category,
                    confidence = :confidence,
                    recommended_action = :recommended_action,
                    ai_justification = :ai_justification,
                    critic_applied = :critic_applied,
                    requires_human_review = TRUE,
                    policy_references = CAST(:policy_references AS JSONB),
                    metadata = CAST(:metadata AS JSONB),
                    error_message = NULL,
                    finished_at = NOW(),
                    updated_at = NOW()
                WHERE id = CAST(:run_id AS UUID)
                """
            ),
            {
                "run_id": run_id,
                "route": graph_state["route"],
                "risk_level": graph_state["risk_level"],
                "category": graph_state["category"],
                "confidence": graph_state["confidence"],
                "recommended_action": graph_state["recommended_action"],
                "ai_justification": graph_state["ai_justification"],
                "critic_applied": graph_state.get("critic_applied", False),
                "policy_references": json.dumps(
                    graph_state.get("policy_references", [])
                ),
                "metadata": json.dumps(run_metadata),
            },
        )

        db.execute(
            text(
                """
                UPDATE moderation.comments
                SET status = 'waiting_human_review', updated_at = NOW()
                WHERE id = CAST(:comment_id AS UUID)
                """
            ),
            {"comment_id": comment_id},
        )


def fail_moderation_run(
    run_id: str,
    comment_id: str,
    error_message: str,
) -> None:
    with SessionLocal.begin() as db:
        _insert_moderation_step(
            db,
            run_id,
            {
                "node_name": "graph_execution",
                "status": "failed",
                "duration_ms": 0,
                "metadata": {"fallback": "human_review"},
                "error_message": error_message,
            },
        )
        db.execute(
            text(
                """
                UPDATE moderation.moderation_runs
                SET
                    status = 'failed',
                    requires_human_review = TRUE,
                    error_message = :error_message,
                    finished_at = NOW(),
                    updated_at = NOW()
                WHERE id = CAST(:run_id AS UUID)
                """
            ),
            {"run_id": run_id, "error_message": error_message},
        )
        db.execute(
            text(
                """
                UPDATE moderation.comments
                SET status = 'waiting_human_review', updated_at = NOW()
                WHERE id = CAST(:comment_id AS UUID)
                """
            ),
            {"comment_id": comment_id},
        )


def get_moderation_run_by_id(run_id: str) -> dict | None:
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
                    ai_justification,
                    critic_applied,
                    requires_human_review,
                    policy_references,
                    metadata,
                    error_message,
                    started_at,
                    finished_at,
                    created_at,
                    updated_at
                FROM moderation.moderation_runs
                WHERE id = CAST(:run_id AS UUID)
                """
            ),
            {"run_id": run_id},
        ).fetchone()

    return dict(row._mapping) if row else None
