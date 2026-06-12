from fastapi import HTTPException

from app.moderation import repository


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
