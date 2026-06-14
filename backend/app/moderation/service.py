import logging

from fastapi import HTTPException

from app.database.database import SessionLocal
from app.moderation import repository
from app.moderation.graph import moderation_graph


logger = logging.getLogger(__name__)


def _validate_limit(limit: int) -> None:
    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Parametro 'limit' deve estar entre 1 e 100.",
        )


def _validate_offset(offset: int) -> None:
    if offset < 0:
        raise HTTPException(
            status_code=400,
            detail="Parametro 'offset' deve ser maior ou igual a 0.",
        )


def _validate_comment_status(status: str | None) -> None:
    if status and status not in repository.ALLOWED_COMMENT_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Parametro 'status' invalido.",
        )


def _validate_guideline_severity(severity: str | None) -> None:
    if severity and severity not in repository.ALLOWED_GUIDELINE_SEVERITIES:
        raise HTTPException(
            status_code=400,
            detail="Parametro 'severity' invalido.",
        )


def list_comments(limit: int, offset: int, status: str | None) -> dict:
    _validate_limit(limit)
    _validate_offset(offset)
    _validate_comment_status(status)

    items = repository.list_comments(limit=limit, offset=offset, status=status)
    total = repository.count_comments(status=status)

    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


def get_comment(comment_id: str) -> dict:
    comment = repository.get_comment_by_id(comment_id)

    if not comment:
        raise HTTPException(status_code=404, detail="Comentario nao encontrado.")

    return comment


def list_guidelines(limit: int, offset: int, severity: str | None) -> dict:
    _validate_limit(limit)
    _validate_offset(offset)
    _validate_guideline_severity(severity)

    items = repository.list_guidelines(
        limit=limit,
        offset=offset,
        severity=severity,
    )
    total = repository.count_guidelines(severity=severity)

    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


def get_guideline(guideline_id: str) -> dict:
    guideline = repository.get_guideline_by_id(guideline_id)

    if not guideline:
        raise HTTPException(status_code=404, detail="Diretriz nao encontrada.")

    return guideline


def get_guideline_by_code(code: str) -> dict:
    guideline = repository.get_guideline_by_code(code)

    if not guideline:
        raise HTTPException(status_code=404, detail="Diretriz nao encontrada.")

    return guideline


def list_runs_for_comment(comment_id: str) -> list[dict]:
    get_comment(comment_id)
    return repository.list_runs_by_comment_id(comment_id)


def list_steps_for_run(run_id: str) -> list[dict]:
    run = repository.get_run_by_id(run_id)

    if not run:
        raise HTTPException(status_code=404, detail="Execucao de moderacao nao encontrada.")

    return repository.list_steps_by_run_id(run_id)


def list_decisions_for_comment(comment_id: str) -> list[dict]:
    get_comment(comment_id)
    return repository.list_decisions_by_comment_id(comment_id)


def _validate_human_decision(decision: str) -> None:
    if decision not in repository.ALLOWED_HUMAN_DECISIONS:
        raise HTTPException(
            status_code=400,
            detail="Campo 'human_decision' invalido.",
        )


def _validate_human_risk_level(risk_level: str | None) -> None:
    if risk_level and risk_level not in repository.ALLOWED_HUMAN_RISK_LEVELS:
        raise HTTPException(
            status_code=400,
            detail="Campo 'human_risk_level' invalido.",
        )


def _get_comment_status_from_human_decision(human_decision: str) -> str:
    decision_to_status = {
        "approve": "approved",
        "flag": "waiting_human_review",
        "remove": "removed",
        "request_edit": "edit_requested",
    }
    return decision_to_status[human_decision]


def create_human_decision(comment_id: str, payload: dict) -> dict:
    _validate_human_decision(payload["human_decision"])
    _validate_human_risk_level(payload.get("human_risk_level"))

    target_status = _get_comment_status_from_human_decision(payload["human_decision"])

    with SessionLocal.begin() as db:
        comment = repository.get_comment_by_id_for_update(db, comment_id)

        if not comment:
            raise HTTPException(status_code=404, detail="Comentario nao encontrado.")

        created_decision = repository.create_human_decision(
            db=db,
            comment_id=comment_id,
            payload=payload,
        )
        repository.update_comment_status(
            db=db,
            comment_id=comment_id,
            status=target_status,
        )
        repository.create_feedback_example(
            db=db,
            comment_text=comment["content"],
            payload=payload,
        )

    return created_decision


def analyze_comment(comment_id: str) -> dict:
    comment = get_comment(comment_id)
    run_id: str | None = None
    safe_error_message = "Falha inesperada durante a analise de moderacao."

    try:
        run = repository.create_moderation_run(comment_id)
        run_id = str(run["id"])
        initial_state = {
            "comment_id": comment_id,
            "comment_content": comment["content"],
            "author_name": comment["author_name"],
            "course_name": comment["course_name"],
            "lesson_name": comment["lesson_name"],
            "run_id": run_id,
            "steps": [],
            "errors": [],
            "metadata": comment.get("metadata", {}),
        }

        final_state = moderation_graph.invoke(initial_state)
        repository.complete_moderation_run(
            run_id=run_id,
            comment_id=comment_id,
            graph_state=final_state,
        )
    except Exception as error:
        logger.exception(
            "Falha ao executar grafo de moderacao para comment_id=%s",
            comment_id,
        )
        if run_id:
            try:
                repository.fail_moderation_run(
                    run_id=run_id,
                    comment_id=comment_id,
                    error_message=safe_error_message,
                )
            except Exception:
                logger.exception(
                    "Falha ao persistir fallback do grafo para run_id=%s",
                    run_id,
                )
        raise HTTPException(status_code=500, detail=safe_error_message) from error

    completed_run = repository.get_moderation_run_by_id(run_id)
    if not completed_run:
        raise HTTPException(status_code=500, detail=safe_error_message)

    return completed_run
