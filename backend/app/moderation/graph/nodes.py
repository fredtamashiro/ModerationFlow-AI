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


def guideline_retriever(state: ModerationGraphState) -> dict[str, Any]:
    started_at = perf_counter()
    route = state.get("route", "fallback_human_review")
    content = _normalize_text(state.get("comment_content", ""))
    route_codes = {
        "spam_fast_path": ("R-001",),
        "toxic_fast_path": ("R-002", "R-003"),
        "low_risk_path": ("R-006", "R-007", "R-008"),
        "ambiguous_deep_review": ("R-003", "R-006"),
        "fallback_human_review": ("R-006",),
    }
    keyword_rules = (
        (("http://", "https://", "link", "promocao", "compre", "acesse"), ("R-001",)),
        (("burro", "idiota", "imbecil", "lixo", "ridiculo", "incompetente"), ("R-002", "R-003")),
        (("raca", "religiao", "genero", "deficiencia", "preconceito", "discriminacao"), ("R-004",)),
        (("ilegal", "hack", "burlar", "golpe", "derrubar a conta", "compartilhar a senha"), ("R-005",)),
        (("duvida", "como ", "onde ", "quando ", "poderia", "nao entendi"), ("R-007",)),
        (("bom", "otimo", "excelente", "gostei", "obrigado", "obrigada"), ("R-008",)),
        (("perda de tempo", "piada", "ruim", "pessima", "quase dormi"), ("R-003", "R-006")),
    )

    matched_codes = list(route_codes[route])
    keyword_match = False
    for keywords, codes in keyword_rules:
        if _contains_any(content, keywords):
            keyword_match = True
            for code in codes:
                if code == "R-006" and route in {
                    "spam_fast_path",
                    "toxic_fast_path",
                }:
                    continue
                if code not in matched_codes:
                    matched_codes.append(code)

    guidelines_by_code = {
        guideline["code"]: guideline
        for guideline in state.get("available_guidelines", [])
    }
    retrieved = []
    for code in matched_codes:
        guideline = guidelines_by_code.get(code)
        if not guideline:
            continue
        description = guideline["description"].strip()
        excerpt = description[:240]
        if len(description) > 240:
            excerpt = f"{excerpt.rstrip()}..."
        retrieved.append({**guideline, "excerpt": excerpt})

    fallback_used = False
    if not retrieved and "R-006" in guidelines_by_code:
        fallback_used = True
        guideline = guidelines_by_code["R-006"]
        retrieved = [
            {
                **guideline,
                "excerpt": guideline["description"][:240],
            }
        ]

    actual_codes = [guideline["code"] for guideline in retrieved]
    return {
        "retrieved_guidelines": retrieved,
        "steps": [
            _step(
                "guideline_retriever",
                started_at,
                {
                    "matched_codes": actual_codes,
                    "match_strategy": (
                        "route_and_keywords" if keyword_match else "route"
                    ),
                    "fallback_used": fallback_used,
                },
            )
        ],
    }


def risk_analyzer(state: ModerationGraphState) -> dict[str, Any]:
    started_at = perf_counter()
    route = state.get("route", "fallback_human_review")
    retrieved = state.get("retrieved_guidelines", [])
    codes = {guideline["code"] for guideline in retrieved}

    risk_level = "unknown"
    category = "ambiguous"
    confidence = 0.0
    recommended_action = "needs_human_review"
    justification = "Nao houve fundamento suficiente para uma recomendacao automatizada segura."

    if "R-004" in codes:
        risk_level = "high"
        category = "hate_or_discrimination"
        confidence = 0.88
        recommended_action = "remove"
        justification = "O comentario apresenta sinais relacionados a discriminacao, conforme R-004."
    elif "R-005" in codes:
        risk_level = "high"
        category = "dangerous_or_illegal_content"
        confidence = 0.88
        recommended_action = "remove"
        justification = "O comentario apresenta sinais de conteudo perigoso ou ilegal, conforme R-005."
    elif route == "spam_fast_path" and "R-001" in codes:
        risk_level = "medium"
        category = "spam"
        confidence = 0.85
        recommended_action = "remove"
        justification = "O comentario apresenta sinais de autopromocao ou spam relacionados a R-001."
    elif route == "toxic_fast_path" and codes.intersection({"R-002", "R-003"}):
        risk_level = "high"
        category = "offensive_language"
        confidence = 0.85
        recommended_action = "remove"
        justification = "O comentario contem ataque pessoal ou linguagem ofensiva relacionados a R-002/R-003."
    elif route == "ambiguous_deep_review" and codes.intersection({"R-003", "R-006"}):
        risk_level = "medium"
        category = "ambiguous"
        confidence = 0.65
        recommended_action = "flag"
        justification = (
            "O comentario pode ser critica legitima segundo R-006, mas o tom pode "
            "se relacionar a R-003 e exige revisao humana."
        )
    elif route == "low_risk_path" and state.get("category") == "positive_feedback" and "R-008" in codes:
        risk_level = "low"
        category = "positive_feedback"
        confidence = 0.84
        recommended_action = "approve"
        justification = "O comentario aparenta ser feedback positivo permitido por R-008."
    elif route == "low_risk_path" and "R-007" in codes:
        risk_level = "low"
        category = "question_or_support_request"
        confidence = 0.82
        recommended_action = "approve"
        justification = "O comentario aparenta ser uma duvida ou pedido de suporte permitido por R-007."

    policy_references = [
        {
            "code": guideline["code"],
            "title": guideline["title"],
            "severity": guideline["severity"],
        }
        for guideline in retrieved
    ]
    return {
        "risk_level": risk_level,
        "category": category,
        "confidence": confidence,
        "recommended_action": recommended_action,
        "ai_justification": justification,
        "policy_references": policy_references,
        "requires_human_review": True,
        "steps": [
            _step(
                "risk_analyzer",
                started_at,
                {
                    "risk_level": risk_level,
                    "category": category,
                    "recommended_action": recommended_action,
                    "confidence": confidence,
                    "policy_codes": sorted(codes),
                },
            )
        ],
    }


def decision_builder(state: ModerationGraphState) -> dict[str, Any]:
    started_at = perf_counter()
    recommended_action = state.get("recommended_action", "needs_human_review")
    return {
        "critic_applied": False,
        "requires_human_review": True,
        "steps": [
            _step(
                "decision_builder",
                started_at,
                {
                    "recommended_action": recommended_action,
                    "requires_human_review": True,
                    "critic_applied": False,
                    "policy_codes": [
                        reference["code"]
                        for reference in state.get("policy_references", [])
                    ],
                },
            )
        ],
    }
