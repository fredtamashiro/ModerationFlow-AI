from fastapi import APIRouter, Depends

from app.api.admin_auth import require_admin_user
from app.moderation.schemas import (
    Comment,
    CommentListResponse,
    Guideline,
    GuidelineListResponse,
    HumanDecisionCreate,
    ModerationDecision,
    ModerationRun,
    ModerationRunSummary,
    ModerationStep,
)
from app.moderation.service import (
    analyze_comment,
    create_human_decision,
    get_comment,
    get_guideline,
    get_guideline_by_code,
    list_comments,
    list_decisions_for_comment,
    list_guidelines,
    list_runs_for_comment,
    list_steps_for_run,
)

router = APIRouter(
    prefix="/admin/moderation",
    tags=["Moderation Admin"],
    dependencies=[Depends(require_admin_user)],
)


@router.get(
    "/comments",
    response_model=CommentListResponse,
    summary="Listar comentarios de moderacao",
    description=(
        "Lista comentarios com paginacao e filtro opcional por status. "
        "Requer autenticacao de administrador."
    ),
)
def get_comments(
    status: str | None = None,
    limit: int = 20,
    offset: int = 0,
):
    return list_comments(limit=limit, offset=offset, status=status)


@router.get(
    "/comments/{comment_id}",
    response_model=Comment,
    summary="Consultar comentario",
    description="Retorna os dados completos de um comentario pelo UUID.",
)
def get_comment_by_id(comment_id: str):
    return get_comment(comment_id)


@router.get(
    "/guidelines",
    response_model=GuidelineListResponse,
    summary="Listar diretrizes de moderacao",
    description=(
        "Lista diretrizes com paginacao e filtro opcional por nivel de severidade."
    ),
)
def get_guidelines(
    severity: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    return list_guidelines(limit=limit, offset=offset, severity=severity)


@router.get(
    "/guidelines/{guideline_id}",
    response_model=Guideline,
    summary="Consultar diretriz por ID",
    description="Retorna uma diretriz de moderacao pelo UUID.",
)
def get_guideline_by_id(guideline_id: str):
    return get_guideline(guideline_id)


@router.get(
    "/guidelines/code/{code}",
    response_model=Guideline,
    summary="Consultar diretriz por codigo",
    description="Retorna uma diretriz pelo codigo de negocio, como R-001.",
)
def get_guideline_by_code_route(code: str):
    return get_guideline_by_code(code)


@router.get(
    "/comments/{comment_id}/runs",
    response_model=list[ModerationRunSummary],
    summary="Listar execucoes de um comentario",
    description=(
        "Retorna o historico de moderation runs associados ao comentario, "
        "do mais recente para o mais antigo."
    ),
)
def get_comment_runs(comment_id: str):
    return list_runs_for_comment(comment_id)


@router.get(
    "/runs/{run_id}/steps",
    response_model=list[ModerationStep],
    summary="Listar steps de uma execucao",
    description=(
        "Retorna os nodes executados pelo grafo, incluindo status, duracao e metadata."
    ),
)
def get_run_steps(run_id: str):
    return list_steps_for_run(run_id)


@router.get(
    "/comments/{comment_id}/decisions",
    response_model=list[ModerationDecision],
    summary="Listar decisoes humanas",
    description="Retorna o historico de decisoes humanas registradas para o comentario.",
)
def get_comment_decisions(comment_id: str):
    return list_decisions_for_comment(comment_id)


@router.post(
    "/comments/{comment_id}/decisions",
    response_model=ModerationDecision,
    summary="Registrar decisao humana",
    description=(
        "Registra a decisao final do moderador, atualiza o status do comentario "
        "e cria um feedback example na mesma transacao."
    ),
)
def create_comment_decision(comment_id: str, payload: HumanDecisionCreate):
    return create_human_decision(comment_id, payload.model_dump())


@router.post(
    "/comments/{comment_id}/analyze",
    response_model=ModerationRun,
    summary="Executar analise inicial de moderacao",
    description=(
        "Executa o grafo LangGraph heuristico, registra o run e seus steps e "
        "encaminha o comentario para revisao humana obrigatoria. Nao cria uma "
        "decisao final automaticamente."
    ),
)
def analyze_moderation_comment(comment_id: str):
    return analyze_comment(comment_id)
