import re
import unicodedata
from time import perf_counter
from typing import Any

from app.moderation.graph.state import GraphStep, ModerationGraphState, ModerationRoute


MIN_COMMENT_LENGTH = 3
MAX_COMMENT_LENGTH = 5000


def _normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    without_accents = "".join(char for char in normalized if not unicodedata.combining(char))
    return without_accents.casefold()


def _contains_any(content: str, terms: tuple[str, ...]) -> bool:
    return any(term in content for term in terms)


def _step(node_name: str, started_at: float, metadata: dict[str, Any]) -> GraphStep:
    return {
        "node_name": node_name,
        "status": "completed",
        "duration_ms": max(0, round((perf_counter() - started_at) * 1000)),
        "metadata": metadata,
        "error_message": None,
    }


def input_guard(state: ModerationGraphState) -> dict[str, Any]:
    started_at = perf_counter()
    content = state.get("comment_content", "").strip()
    input_valid = True
    reason = "Comentario valido para roteamento inicial."

    if not content:
        input_valid = False
        reason = "Comentario vazio."
    elif len(content) < MIN_COMMENT_LENGTH:
        input_valid = False
        reason = "Comentario curto demais para analise."
    elif len(content) > MAX_COMMENT_LENGTH:
        input_valid = False
        reason = "Comentario excede o limite inicial de tamanho."
    elif not re.search(r"[A-Za-z0-9]", _normalize_text(content)):
        input_valid = False
        reason = "Comentario sem conteudo alfanumerico analisavel."

    update: dict[str, Any] = {
        "input_valid": input_valid,
        "input_guard_reason": reason,
    }
    if not input_valid:
        update.update(
            {
                "route": "fallback_human_review",
                "route_reason": reason,
                "route_confidence": 1.0,
            }
        )

    update["steps"] = [
        _step(
            "input_guard",
            started_at,
            {"input_valid": input_valid, "reason": reason},
        )
    ]
    return update


def intent_router(state: ModerationGraphState) -> dict[str, Any]:
    started_at = perf_counter()
    content = _normalize_text(state["comment_content"])

    spam_terms = (
        "http://",
        "https://",
        "acesse meu site",
        "compre",
        "promocao",
        "desconto",
        "sigam meu perfil",
        "curso completo",
    )
    toxic_terms = (
        "idiota",
        "imbecil",
        "incompetente",
        "lixo humano",
        "pessima",
        "nao sabe ensinar",
    )
    ambiguous_terms = (
        "perda de tempo",
        "ridiculo",
        "que piada",
        "quase dormi",
        "genial...",
        "sarcasmo",
    )
    question_terms = (
        "como ",
        "onde ",
        "quando ",
        "poderia",
        "duvida",
        "nao entendi",
        "alguem pode",
    )
    positive_terms = (
        "excelente",
        "obrigado",
        "obrigada",
        "ajudou bastante",
        "gostei",
        "parabens",
    )

    route: ModerationRoute
    reason: str
    confidence: float

    if _contains_any(content, spam_terms):
        route = "spam_fast_path"
        reason = "Foram encontrados indicadores promocionais ou de spam."
        confidence = 0.86
    elif _contains_any(content, toxic_terms):
        route = "toxic_fast_path"
        reason = "Foram encontrados termos ofensivos explicitos."
        confidence = 0.84
    elif _contains_any(content, ambiguous_terms):
        route = "ambiguous_deep_review"
        reason = "O comentario contem sarcasmo ou critica potencialmente ambigua."
        confidence = 0.66
    elif "?" in content or _contains_any(content, question_terms):
        route = "low_risk_path"
        reason = "O comentario aparenta ser uma duvida ou pedido de suporte."
        confidence = 0.82
    elif _contains_any(content, positive_terms):
        route = "low_risk_path"
        reason = "O comentario aparenta ser feedback positivo."
        confidence = 0.88
    else:
        route = "fallback_human_review"
        reason = "As heuristicas iniciais nao identificaram uma rota segura."
        confidence = 0.0

    return {
        "route": route,
        "route_reason": reason,
        "route_confidence": confidence,
        "steps": [
            _step(
                "intent_router",
                started_at,
                {"route": route, "reason": reason, "confidence": confidence},
            )
        ],
    }


def _path_result(
    node_name: str,
    *,
    risk_level: str,
    category: str,
    confidence: float,
    recommended_action: str,
    justification: str,
) -> dict[str, Any]:
    started_at = perf_counter()
    return {
        "risk_level": risk_level,
        "category": category,
        "confidence": confidence,
        "recommended_action": recommended_action,
        "ai_justification": justification,
        "requires_human_review": True,
        "steps": [
            _step(
                node_name,
                started_at,
                {
                    "risk_level": risk_level,
                    "category": category,
                    "confidence": confidence,
                    "recommended_action": recommended_action,
                },
            )
        ],
    }


def spam_fast_path(_: ModerationGraphState) -> dict[str, Any]:
    return _path_result(
        "spam_fast_path",
        risk_level="medium",
        category="spam",
        confidence=0.86,
        recommended_action="remove",
        justification="Indicadores heuristicos de promocao ou spam foram identificados.",
    )


def toxic_fast_path(_: ModerationGraphState) -> dict[str, Any]:
    return _path_result(
        "toxic_fast_path",
        risk_level="high",
        category="offensive_language",
        confidence=0.84,
        recommended_action="remove",
        justification="Termos ofensivos explicitos foram identificados no comentario.",
    )


def low_risk_path(state: ModerationGraphState) -> dict[str, Any]:
    content = _normalize_text(state["comment_content"])
    positive = _contains_any(
        content,
        ("excelente", "obrigado", "obrigada", "ajudou bastante", "gostei", "parabens"),
    )
    category = "positive_feedback" if positive else "question_or_support_request"
    return _path_result(
        "low_risk_path",
        risk_level="low",
        category=category,
        confidence=0.84,
        recommended_action="approve",
        justification="O comentario aparenta ser feedback permitido ou pedido legitimo de suporte.",
    )


def ambiguous_deep_review(_: ModerationGraphState) -> dict[str, Any]:
    return _path_result(
        "ambiguous_deep_review",
        risk_level="medium",
        category="ambiguous",
        confidence=0.64,
        recommended_action="flag",
        justification="O comentario exige avaliacao humana por conter sinais ambiguos.",
    )


def fallback_human_review(state: ModerationGraphState) -> dict[str, Any]:
    reason = state.get("route_reason") or "Nao foi possivel classificar o comentario com seguranca."
    return _path_result(
        "fallback_human_review",
        risk_level="unknown",
        category="ambiguous",
        confidence=0.0,
        recommended_action="needs_human_review",
        justification=reason,
    )


def decision_builder(state: ModerationGraphState) -> dict[str, Any]:
    started_at = perf_counter()
    recommended_action = state.get("recommended_action", "needs_human_review")
    return {
        "critic_applied": False,
        "requires_human_review": True,
        "policy_references": [],
        "steps": [
            _step(
                "decision_builder",
                started_at,
                {
                    "recommended_action": recommended_action,
                    "requires_human_review": True,
                    "critic_applied": False,
                },
            )
        ],
    }
