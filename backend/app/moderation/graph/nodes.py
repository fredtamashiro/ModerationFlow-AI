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


def _contains_any_whole_term(content: str, terms: tuple[str, ...]) -> bool:
    return any(
        re.search(rf"(?<![a-z0-9]){re.escape(term)}(?![a-z0-9])", content)
        for term in terms
    )


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
    has_concession = _contains_any(content, ("embora", "talvez", "reconheco", "mas"))

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
    subtle_spam_terms = (
        "me chamem no privado",
        "me chamem",
        "no privado",
        "link no meu perfil",
        "entra no meu grupo",
        "meu grupo",
        "meu perfil",
        "direct",
        "material complementar",
        "pdf completo",
        "resumo completo",
        "passo no direct",
        "inbox",
        "bio",
        "me chama",
        "mensagem",
        "por fora",
        "canal",
    )
    toxic_terms = (
        "idiota",
        "imbecil",
        "incompetente",
        "lixo humano",
        "pessima",
        "nao sabe ensinar",
        "ridiculo",
        "nao entende nada",
        "despreparado",
        "despreparada",
        "nao domina o assunto",
        "nao domina",
    )
    ambiguous_terms = (
        "que piada",
        "quase dormi",
        "genial...",
        "sarcasmo",
        "so que nao",
        "imagina a ruim",
        "parabens mesmo",
        "parabens, conseguiram",
        "conseguiram deixar dificil",
        "conseguiram piorar",
        "bem decepcionante",
        "muito fraco",
        "bem fraco",
        "bem fraca",
        "mal planejado",
        "ficou bem ruim",
        "longe do que eu esperava",
        "abaixo do esperado",
        "nao convence",
        "maravilha... agora",
        "mais confuso",
    )
    criticism_terms = (
        "perda de tempo",
        "faltaram exemplos",
        "ritmo da aula",
        "nao gostei da didatica",
        "precisa de revisao",
        "podia ser melhor",
        "ficou confuso",
        "nao foi tao util",
        "nao gostei dessa aula",
        "achei o modulo confuso",
        "fala rapido demais",
        "professor explica mto rapido",
        "esperava mais exemplos",
        "organizacao do conteudo",
        "ficou confusa",
        "confusa",
        "superficial",
        "cansativo",
        "raso",
        "rasa",
        "faltou profundidade",
        "parte pratica",
        "meio corrida",
        "corrida",
        "corrido",
        "mais clara",
        "mais detalhe",
        "curta",
        "nao curti",
    )
    question_terms = (
        "como ",
        "onde ",
        "quando ",
        "poderia",
        "duvida",
        "nao entendi",
        "alguem pode",
        "nao consigo",
        "alguem resolve",
        "podem verificar",
        "ja tentei",
        "nada funciona",
        "preciso de ajuda",
        "me ajuda ai",
        "certificado nao apareceu",
        "video trava",
        "resolver meu acesso",
        "nao carrega",
        "nao abre",
        "sumiu",
        "checar",
        "verifica",
        "verificar",
        "ainda nao saiu",
    )
    positive_terms = (
        "excelente",
        "obrigado",
        "obrigada",
        "ajudou bastante",
        "gostei",
        "parabens",
        "curti",
        "top",
    )

    route: ModerationRoute
    reason: str
    confidence: float

    if _contains_any(content, spam_terms):
        route = "spam_fast_path"
        reason = "Foram encontrados indicadores promocionais ou de spam."
        confidence = 0.86
    elif _contains_any(content, subtle_spam_terms):
        route = "spam_fast_path"
        reason = "Foram encontrados sinais de divulgacao externa ou contato privado."
        confidence = 0.78
    elif "ridiculo" in content and has_concession:
        route = "ambiguous_deep_review"
        reason = "O comentario mistura linguagem negativa com ressalva ou concessao."
        confidence = 0.71
    elif _contains_any(content, toxic_terms):
        route = "toxic_fast_path"
        reason = "Foram encontrados sinais de ofensa direta ou ataque indireto."
        confidence = 0.83
    elif _contains_any(content, ambiguous_terms):
        route = "ambiguous_deep_review"
        reason = "O comentario contem sarcasmo ou critica potencialmente ambigua."
        confidence = 0.70
    elif _contains_any(content, criticism_terms):
        route = "low_risk_path"
        reason = "O comentario aparenta ser uma critica legitima sem ofensa direta."
        confidence = 0.79
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
    sarcastic = _contains_any(
        content,
        (
            "so que nao",
            "imagina a ruim",
            "parabens, conseguiram",
            "conseguiram deixar dificil",
            "conseguiram piorar",
            "genial... agora",
            "maravilha... agora",
            "excelente... nao",
            "otima explicacao, so que nao",
        ),
    )
    positive = _contains_any(
        content,
        (
            "excelente",
            "obrigado",
            "obrigada",
            "ajudou bastante",
            "gostei",
            "parabens",
            "curti",
            "top",
        ),
    )
    if "nao gostei" in content or "nao curti" in content or sarcastic:
        positive = False
    criticism = _contains_any(
        content,
        (
            "perda de tempo",
            "faltaram exemplos",
            "ritmo da aula",
            "nao gostei da didatica",
            "precisa de revisao",
            "podia ser melhor",
            "ficou confuso",
            "nao foi tao util",
            "nao gostei dessa aula",
            "achei o modulo confuso",
            "fala rapido demais",
            "esperava mais exemplos",
            "organizacao do conteudo",
            "ficou confusa",
            "superficial",
            "cansativo",
            "mto rapido",
            "raso",
            "rasa",
            "faltou profundidade",
            "parte pratica",
            "meio corrida",
            "corrida",
            "corrido",
            "mais clara",
            "mais detalhe",
            "curta",
            "nao curti",
        ),
    )
    support = _contains_any(
        content,
        (
            "nao consigo",
            "alguem resolve",
            "podem verificar",
            "ja tentei",
            "nada funciona",
            "preciso de ajuda",
            "certificado nao apareceu",
            "video trava",
            "resolver meu acesso",
            "nao carrega",
            "nao abre",
            "sumiu",
            "checar",
            "verifica",
            "verificar",
            "ainda nao saiu",
        ),
    )
    if positive:
        category = "positive_feedback"
    elif criticism:
        category = "legitimate_criticism"
    elif support:
        category = "question_or_support_request"
    else:
        category = "question_or_support_request"
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
        (
            (
                "http://",
                "https://",
                "link",
                "promocao",
                "compre",
                "acesse",
                "no privado",
                "me chamem",
                "me chama",
                "meu perfil",
                "meu grupo",
                "direct",
                "pdf completo",
                "material complementar",
                "inbox",
                "bio",
                "mensagem",
                "por fora",
                "canal",
            ),
            ("R-001",),
        ),
        (
            (
                "burro",
                "idiota",
                "imbecil",
                "lixo",
                "ridiculo",
                "incompetente",
                "nao entende nada",
                "despreparado",
                "despreparada",
                "nao domina o assunto",
                "nao domina",
            ),
            ("R-002", "R-003"),
        ),
        (("menos capazes",), ("R-004",)),
        (("ilegal", "hack", "burlar", "golpe", "derrubar a conta", "compartilhar a senha"), ("R-005",)),
        (
            (
                "duvida",
                "como ",
                "onde ",
                "quando ",
                "poderia",
                "nao entendi",
                "nao consigo",
                "alguem resolve",
                "podem verificar",
                "ja tentei",
                "nada funciona",
                "preciso de ajuda",
                "certificado",
                "acesso",
                "video trava",
                "nao carrega",
                "nao abre",
                "sumiu",
                "checar",
                "verifica",
                "ainda nao saiu",
            ),
            ("R-007",),
        ),
        (
            ("bom", "otimo", "excelente", "gostei", "obrigado", "obrigada", "curti", "top"),
            ("R-008",),
        ),
        (
            (
                "perda de tempo",
                "faltaram exemplos",
                "ritmo da aula",
                "didatica",
                "precisa de revisao",
                "ficou confuso",
                "ficou confusa",
                "confusa",
                "nao foi tao util",
                "nao gostei",
                "esperava mais exemplos",
                "fala rapido demais",
                "mto rapido",
                "modulo confuso",
                "superficial",
                "decepcionante",
                "muito fraco",
                "bem fraco",
                "bem fraca",
                "mal planejado",
                "ficou bem ruim",
                "raso",
                "rasa",
                "faltou profundidade",
                "parte pratica",
                "corrida",
                "corrido",
                "mais clara",
                "mais detalhe",
                "curta",
                "nao curti",
            ),
            ("R-006",),
        ),
        (
            (
                "piada",
                "quase dormi",
                "genial...",
                "sarcasmo",
                "so que nao",
                "imagina a ruim",
                "parabens, conseguiram",
                "maravilha... agora",
                "mais confuso",
            ),
            ("R-003", "R-006"),
        ),
    )

    matched_codes = list(route_codes[route])
    if _contains_any_whole_term(
        content,
        ("raca", "religiao", "genero", "deficiencia", "preconceito", "discriminacao"),
    ):
        if "R-004" not in matched_codes:
            matched_codes.append("R-004")
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
        content = _normalize_text(state.get("comment_content", ""))
        explicit_spam = _contains_any(
            content,
            ("promocao", "desconto", "compre", "curso completo", "acesse meu site", "http://", "https://"),
        )
        if not explicit_spam and _contains_any(
            content,
            (
                "no privado",
                "me chamem",
                "me chama",
                "meu perfil",
                "meu grupo",
                "direct",
                "material complementar",
                "pdf completo",
                "inbox",
                "bio",
                "mensagem",
                "por fora",
                "canal",
            ),
        ):
            confidence = 0.78
            recommended_action = "flag"
            justification = "O comentario apresenta sinais de spam menos explicito ou divulgacao externa relacionados a R-001."
        else:
            confidence = 0.85
            recommended_action = "remove"
            justification = "O comentario apresenta sinais de autopromocao ou spam relacionados a R-001."
    elif route == "toxic_fast_path" and codes.intersection({"R-002", "R-003"}):
        content = _normalize_text(state.get("comment_content", ""))
        high_severity = _contains_any(
            content,
            ("ridiculo", "idiota", "imbecil", "incompetente", "pessima", "nao sabe ensinar", "nao entende nada"),
        )
        risk_level = "high" if high_severity else "medium"
        category = "offensive_language"
        confidence = 0.85 if high_severity else 0.79
        recommended_action = "remove" if high_severity else "flag"
        justification = (
            "O comentario contem ataque pessoal ou linguagem ofensiva relacionados a R-002/R-003."
            if high_severity
            else "O comentario contem desqualificacao indireta ou linguagem depreciativa relacionada a R-002/R-003."
        )
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
    elif route == "low_risk_path" and state.get("category") == "legitimate_criticism" and "R-006" in codes:
        risk_level = "low"
        category = "legitimate_criticism"
        confidence = 0.80
        recommended_action = "approve"
        justification = "O comentario aparenta ser critica legitima permitida por R-006."
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


def confidence_gate(state: ModerationGraphState) -> dict[str, Any]:
    started_at = perf_counter()
    confidence = state.get("confidence", 0.0)
    recommended_action = state.get("recommended_action", "needs_human_review")
    risk_level = state.get("risk_level", "unknown")
    route = state.get("route", "fallback_human_review")
    category = state.get("category", "ambiguous")
    policy_codes = {reference["code"] for reference in state.get("policy_references", [])}

    critic_required = False
    reason = "confidence_above_threshold"

    if confidence < 0.75:
        critic_required = True
        reason = "confidence_below_threshold"
    elif recommended_action == "remove":
        critic_required = True
        reason = "remove_requires_review"
    elif risk_level == "high":
        critic_required = True
        reason = "high_risk_level"
    elif route == "ambiguous_deep_review":
        critic_required = True
        reason = "ambiguous_route"
    elif category == "ambiguous":
        critic_required = True
        reason = "ambiguous_category"
    elif {"R-003", "R-006"}.issubset(policy_codes):
        critic_required = True
        reason = "policy_conflict_r003_r006"

    decision = "needs_critic" if critic_required else "high_confidence"
    return {
        "critic_required": critic_required,
        "critic_reason": reason,
        "confidence_gate_decision": decision,
        "steps": [
            _step(
                "confidence_gate",
                started_at,
                {
                    "decision": decision,
                    "reason": reason,
                    "confidence": confidence,
                    "recommended_action": recommended_action,
                    "risk_level": risk_level,
                },
            )
        ],
    }


def critic_agent(state: ModerationGraphState) -> dict[str, Any]:
    started_at = perf_counter()
    confidence = state.get("confidence", 0.0)
    recommended_action = state.get("recommended_action", "needs_human_review")
    risk_level = state.get("risk_level", "unknown")
    route = state.get("route", "fallback_human_review")
    policy_codes = {reference["code"] for reference in state.get("policy_references", [])}

    critic_summary = "O caso exige revisao humana adicional antes da consolidacao."
    critic_agrees = True
    adjusted_action = recommended_action
    adjusted_risk_level = risk_level
    adjusted_confidence = confidence

    if recommended_action == "remove" and confidence < 0.75:
        critic_agrees = False
        adjusted_action = "flag"
        adjusted_risk_level = "medium"
        adjusted_confidence = min(confidence, 0.70)
        critic_summary = (
            "A remocao pode ser excessiva quando a confianca e baixa. "
            "O caso deve ser revisto pelo moderador."
        )
    elif {"R-003", "R-006"}.issubset(policy_codes):
        critic_agrees = False
        adjusted_action = "flag"
        adjusted_risk_level = "medium"
        adjusted_confidence = min(confidence, 0.70)
        critic_summary = (
            "Ha conflito entre linguagem inadequada e critica legitima. "
            "A decisao deve permanecer em revisao humana."
        )
    elif (
        route == "toxic_fast_path"
        and confidence >= 0.80
        and recommended_action == "remove"
    ):
        critic_agrees = True
        adjusted_action = "remove"
        adjusted_risk_level = "high"
        adjusted_confidence = confidence
        critic_summary = (
            "A violacao parece clara e consistente com ataque pessoal ou linguagem ofensiva."
        )
    elif recommended_action == "remove" and route == "spam_fast_path" and confidence >= 0.80:
        critic_agrees = True
        adjusted_action = "remove"
        adjusted_risk_level = "medium"
        adjusted_confidence = confidence
        critic_summary = (
            "Os sinais de spam parecem claros e proporcionais para recomendacao de remocao."
        )
    elif recommended_action == "remove" and state.get("category") in {
        "hate_or_discrimination",
        "dangerous_or_illegal_content",
    }:
        critic_agrees = True
        adjusted_action = "remove"
        adjusted_risk_level = "high"
        adjusted_confidence = max(confidence, 0.88)
        critic_summary = (
            "A severidade do conteudo justifica manter a recomendacao de remocao para revisao humana."
        )
    elif recommended_action == "flag" and route == "spam_fast_path":
        critic_agrees = True
        adjusted_action = "flag"
        adjusted_risk_level = "medium"
        adjusted_confidence = max(confidence, 0.78)
        critic_summary = (
            "Os sinais sugerem spam menos explicito; a recomendacao de sinalizacao permanece proporcional."
        )
    elif recommended_action == "flag" and route == "ambiguous_deep_review":
        critic_agrees = True
        adjusted_action = "flag"
        adjusted_risk_level = "medium"
        adjusted_confidence = max(confidence, 0.70)
        critic_summary = (
            "O caso permanece ambiguo e deve seguir para revisao humana com sinalizacao conservadora."
        )
    elif recommended_action == "approve" and state.get("category") == "question_or_support_request":
        critic_agrees = True
        adjusted_action = "approve"
        adjusted_risk_level = "low"
        adjusted_confidence = max(confidence, 0.78)
        critic_summary = (
            "O comentario aparenta ser um pedido legitimo de suporte, ainda que em tom irritado."
        )
    else:
        critic_agrees = False
        adjusted_action = (
            "flag" if recommended_action != "needs_human_review" else "needs_human_review"
        )
        adjusted_risk_level = (
            "medium" if risk_level in {"high", "medium"} else risk_level
        )
        adjusted_confidence = min(confidence, 0.70)
        critic_summary = (
            "A recomendacao foi mantida em modo conservador para priorizar revisao humana."
        )

    return {
        "critic_applied": True,
        "critic_summary": critic_summary,
        "critic_agrees": critic_agrees,
        "critic_adjusted_action": adjusted_action,
        "critic_adjusted_risk_level": adjusted_risk_level,
        "critic_adjusted_confidence": adjusted_confidence,
        "steps": [
            _step(
                "critic_agent",
                started_at,
                {
                    "critic_agrees": critic_agrees,
                    "adjusted_action": adjusted_action,
                    "adjusted_risk_level": adjusted_risk_level,
                    "adjusted_confidence": adjusted_confidence,
                },
            )
        ],
    }


def decision_builder(state: ModerationGraphState) -> dict[str, Any]:
    started_at = perf_counter()
    critic_applied = state.get("critic_applied", False)
    recommended_action = state.get("recommended_action", "needs_human_review")
    final_action = (
        state.get("critic_adjusted_action", recommended_action)
        if critic_applied
        else recommended_action
    )
    final_risk_level = (
        state.get("critic_adjusted_risk_level", state.get("risk_level", "unknown"))
        if critic_applied
        else state.get("risk_level", "unknown")
    )
    final_confidence = (
        state.get("critic_adjusted_confidence", state.get("confidence", 0.0))
        if critic_applied
        else state.get("confidence", 0.0)
    )
    final_justification = state.get("ai_justification", "")
    if critic_applied and state.get("critic_summary"):
        final_justification = (
            f"{final_justification} Critic: {state['critic_summary']}"
            if final_justification
            else state["critic_summary"]
        )
    return {
        "recommended_action": final_action,
        "risk_level": final_risk_level,
        "confidence": final_confidence,
        "ai_justification": final_justification,
        "critic_applied": critic_applied,
        "requires_human_review": True,
        "steps": [
            _step(
                "decision_builder",
                started_at,
                {
                    "recommended_action": final_action,
                    "risk_level": final_risk_level,
                    "confidence": final_confidence,
                    "requires_human_review": True,
                    "critic_applied": critic_applied,
                    "confidence_gate_decision": state.get("confidence_gate_decision"),
                    "critic_summary": state.get("critic_summary"),
                    "policy_codes": [
                        reference["code"]
                        for reference in state.get("policy_references", [])
                    ],
                },
            )
        ],
    }
