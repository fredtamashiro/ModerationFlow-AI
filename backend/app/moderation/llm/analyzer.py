from __future__ import annotations

from time import perf_counter
from typing import Any

from langchain_openai import ChatOpenAI

from app.config import get_settings
from app.moderation.llm.dynamic_few_shot import select_dynamic_few_shot_examples
from app.moderation.llm.few_shot import load_selected_few_shot_examples
from app.moderation.llm.prompt import (
    SYSTEM_PROMPT,
    build_few_shot_llm_prompt,
    build_llm_prompt,
)
from app.moderation.llm.schemas import LLMRiskAnalyzerResponse
from app.observability import finalize_langsmith_run, start_langsmith_run

PRIMARY_POLICY_BY_CATEGORY = {
    "spam": "R-001",
    "personal_attack": "R-002",
    "offensive_language": "R-003",
    "hate_or_discrimination": "R-004",
    "dangerous_or_illegal_content": "R-005",
    "legitimate_criticism": "R-006",
    "question_or_support_request": "R-007",
    "positive_feedback": "R-008",
}

SECONDARY_ALLOWED_POLICIES_BY_CATEGORY = {
    "personal_attack": {"R-003"},
    "offensive_language": {"R-002"},
    "positive_feedback": {"R-006"},
    "ambiguous": {"R-002", "R-003", "R-006"},
    "other": {"R-001", "R-002", "R-003", "R-004", "R-005", "R-006", "R-007", "R-008"},
}


def analyze_comment_with_llm(
    comment: str,
    available_guidelines: list[dict],
    trace_metadata: dict[str, Any] | None = None,
) -> dict:
    prompt = build_llm_prompt(comment, available_guidelines)
    return _analyze_comment_with_prompt(
        comment=comment,
        available_guidelines=available_guidelines,
        prompt=prompt,
        trace_metadata=trace_metadata,
        strategy="baseline_llm",
        few_shot_examples_count=0,
    )


def analyze_comment_with_few_shot_llm(
    comment: str,
    available_guidelines: list[dict],
    trace_metadata: dict[str, Any] | None = None,
) -> dict:
    selected_examples = load_selected_few_shot_examples()
    prompt = build_few_shot_llm_prompt(
        comment,
        available_guidelines,
        selected_examples,
    )
    return _analyze_comment_with_prompt(
        comment=comment,
        available_guidelines=available_guidelines,
        prompt=prompt,
        trace_metadata=trace_metadata,
        strategy="few_shot_llm",
        few_shot_examples_count=len(selected_examples),
    )


def analyze_comment_with_dynamic_few_shot_llm(
    comment: str,
    available_guidelines: list[dict],
    trace_metadata: dict[str, Any] | None = None,
) -> dict:
    selection = select_dynamic_few_shot_examples(comment)
    selection_guidance = _build_dynamic_selection_guidance(
        comment=comment,
        matched_tags=selection.matched_tags,
    )
    prompt = build_few_shot_llm_prompt(
        comment,
        available_guidelines,
        selection.examples,
        selection_guidance=selection_guidance,
    )
    return _analyze_comment_with_prompt(
        comment=comment,
        available_guidelines=available_guidelines,
        prompt=prompt,
        trace_metadata={
            **(trace_metadata or {}),
            "few_shot_selection_tags": selection.matched_tags,
            "few_shot_selection_fallback": selection.used_fallback,
            "selected_feedback_example_ids": selection.selected_example_ids,
            "dynamic_selection_guidance": selection_guidance,
        },
        strategy="dynamic_few_shot_llm",
        few_shot_examples_count=len(selection.examples),
    )


def _analyze_comment_with_prompt(
    *,
    comment: str,
    available_guidelines: list[dict],
    prompt: str,
    trace_metadata: dict[str, Any] | None,
    strategy: str,
    few_shot_examples_count: int,
) -> dict:
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is required for LLM evaluation mode.")

    started_at = perf_counter()
    metadata = {
        **(trace_metadata or {}),
        "strategy": strategy,
        "few_shot_examples_count": few_shot_examples_count,
    }
    run_context = start_langsmith_run(
        name="llm_risk_analyzer",
        inputs={
            "comment": comment,
            "prompt": prompt,
            "guidelines": available_guidelines,
        },
        metadata=metadata,
        tags=["moderation-flow-ai", "llm-experiment", strategy],
    )

    llm = ChatOpenAI(
        model=settings.openai_chat_model,
        temperature=settings.openai_chat_temperature,
        api_key=settings.openai_api_key,
    ).with_structured_output(LLMRiskAnalyzerResponse, include_raw=True)

    raw_response_payload: dict[str, Any] | None = None
    try:
        response = llm.invoke(
            [
                ("system", SYSTEM_PROMPT),
                ("human", prompt),
            ]
        )

        raw_response = response.get("raw")
        parsed_response = response.get("parsed")
        parsing_error = response.get("parsing_error")
        raw_response_payload = {
            "content": getattr(raw_response, "content", None),
            "additional_kwargs": getattr(raw_response, "additional_kwargs", {}),
            "response_metadata": getattr(raw_response, "response_metadata", {}),
        }

        if parsing_error is not None:
            raise parsing_error
        if parsed_response is None:
            raise ValueError("LLM response could not be parsed into the expected schema.")

        normalized = _normalize_and_validate_response(
            parsed_response,
            strategy=strategy,
            comment=comment,
            trace_metadata=metadata,
        ).model_dump()
        latency_ms = max(0, round((perf_counter() - started_at) * 1000))
        finalize_langsmith_run(
            run_context,
            outputs={
                "raw_response": raw_response_payload,
                "parsed_response": normalized,
            },
            metadata={
                **metadata,
                "schema_valid": True,
                "latency_ms": latency_ms,
                "predicted_category": normalized.get("category"),
                "predicted_risk_level": normalized.get("risk_level"),
                "predicted_action": normalized.get("recommended_action"),
                "predicted_policy_references": normalized.get("policy_references"),
            },
            tags=["success"],
        )
        return normalized
    except Exception as error:
        latency_ms = max(0, round((perf_counter() - started_at) * 1000))
        finalize_langsmith_run(
            run_context,
            outputs={"raw_response": raw_response_payload} if raw_response_payload else None,
            error=str(error),
            metadata={
                **metadata,
                "schema_valid": False,
                "latency_ms": latency_ms,
            },
            tags=["error", strategy],
        )
        raise


def _normalize_and_validate_response(
    payload: LLMRiskAnalyzerResponse | dict[str, Any],
    *,
    strategy: str,
    comment: str,
    trace_metadata: dict[str, Any],
) -> LLMRiskAnalyzerResponse:
    if isinstance(payload, LLMRiskAnalyzerResponse):
        raw_payload = payload.model_dump()
    else:
        raw_payload = dict(payload)

    category = str(raw_payload.get("category", "")).strip()
    risk_level = str(raw_payload.get("risk_level", "")).strip()
    recommended_action = str(raw_payload.get("recommended_action", "")).strip()
    justification = str(raw_payload.get("justification", "")).strip()

    raw_confidence = raw_payload.get("confidence", 0.0)
    try:
        confidence = float(raw_confidence)
    except (TypeError, ValueError) as error:
        raise ValueError("LLM response contains an invalid confidence value.") from error
    confidence = max(0.0, min(1.0, confidence))

    raw_policies = raw_payload.get("policy_references", [])
    if not isinstance(raw_policies, list):
        raise ValueError("LLM response contains invalid policy_references.")
    policy_references: list[str] = []
    for item in raw_policies:
        normalized = str(item).strip()
        if normalized and normalized not in policy_references:
            policy_references.append(normalized)

    policy_references, calibration_note = _calibrate_policy_references(
        category=category,
        policy_references=policy_references,
    )
    normalized_payload = {
        "category": category,
        "risk_level": risk_level,
        "recommended_action": recommended_action,
        "confidence": confidence,
        "policy_references": policy_references,
        "justification": justification,
    }
    normalized_payload, strategy_calibration_note = _apply_strategy_specific_calibration(
        normalized_payload,
        strategy=strategy,
        comment=comment,
        trace_metadata=trace_metadata,
    )
    justification = str(normalized_payload["justification"]).strip()
    if calibration_note:
        justification = f"{justification} [policy calibration: {calibration_note}]"
    if strategy_calibration_note:
        justification = f"{justification} [strategy calibration: {strategy_calibration_note}]"

    normalized_payload["justification"] = justification
    return LLMRiskAnalyzerResponse.model_validate(normalized_payload)


def _build_dynamic_selection_guidance(
    *,
    comment: str,
    matched_tags: list[str],
) -> list[str]:
    guidance: list[str] = []
    normalized_comment = comment.lower()

    if "explicit_spam" in matched_tags:
        guidance.append(
            "If the message has direct external redirect, explicit group recruiting, clear sale, explicit download invitation, or forceful promotional push, prefer spam / high / remove / R-001."
        )
        guidance.append(
            "If there is only external contact, profile mention, private invitation, or mild commercial tone without strong redirect, prefer spam / medium / flag / R-001."
        )

    if "hate_or_discrimination" in matched_tags:
        guidance.append(
            "If a protected group is the real target and there is exclusion, inferiorization, or negative generalization, keep hate_or_discrimination / high / remove / R-004 and do not soften it to personal_attack."
        )

    if (
        "offensive_language_quality_target" in matched_tags
        or (
            "offensive_language" in matched_tags
            and "personal_attack" in matched_tags
            and not _contains_any(
                normalized_comment,
                ("voce", "vocÃª", "professor", "tutor", "instrutor", "monitor"),
            )
        )
    ):
        guidance.append(
            "If the complaint is mainly about the poor quality of the class, course, content, material, platform, service, or work delivered, prefer offensive_language / R-003 even if unnamed creators or preparers are mentioned indirectly."
        )

    return guidance


def _apply_strategy_specific_calibration(
    payload: dict[str, Any],
    *,
    strategy: str,
    comment: str,
    trace_metadata: dict[str, Any],
) -> tuple[dict[str, Any], str | None]:
    if strategy != "dynamic_few_shot_llm":
        return payload, None

    selection_tags = [
        str(tag)
        for tag in trace_metadata.get("few_shot_selection_tags", [])
        if isinstance(tag, str)
    ]
    if (
        "hate_or_discrimination" in selection_tags
        and payload.get("category") != "hate_or_discrimination"
        and _looks_like_protected_group_exclusion(comment)
    ):
        calibrated_payload = dict(payload)
        calibrated_payload["category"] = "hate_or_discrimination"
        calibrated_payload["risk_level"] = "high"
        calibrated_payload["recommended_action"] = "remove"
        calibrated_payload["policy_references"] = ["R-004"]
        return (
            calibrated_payload,
            "protected-group exclusion kept as hate_or_discrimination / high / remove / R-004",
        )

    return payload, None


def _looks_like_protected_group_exclusion(comment: str) -> bool:
    text = comment.lower()
    protected_group_terms = (
        "religiao",
        "religiÃ£o",
        "origem",
        "raca",
        "raÃ§a",
        "genero",
        "gÃªnero",
        "mulher",
        "mulheres",
        "homem",
        "trans",
        "gay",
        "lesb",
        "deficiencia",
        "deficiÃªncia",
        "nacionalidade",
        "orientacao",
        "orientaÃ§Ã£o",
        "tipo de gente",
    )
    exclusion_or_prejudice_terms = (
        "manda embora",
        "nao quero dividir",
        "nÃ£o quero dividir",
        "nao deveria ter espaco",
        "nÃ£o deveria ter espaÃ§o",
        "estraga qualquer comunidade",
        "nao deveria falar aqui",
        "nÃ£o deveria falar aqui",
        "menos capazes",
        "complica a turma",
        "preconceito",
    )
    return _contains_any(text, protected_group_terms) and _contains_any(
        text,
        exclusion_or_prejudice_terms,
    )


def _contains_any(text: str, needles: tuple[str, ...]) -> bool:
    return any(needle in text for needle in needles)


def _calibrate_policy_references(
    *,
    category: str,
    policy_references: list[str],
) -> tuple[list[str], str | None]:
    primary_policy = PRIMARY_POLICY_BY_CATEGORY.get(category)
    allowed_policies = set()
    if primary_policy:
        allowed_policies.add(primary_policy)
    allowed_policies.update(SECONDARY_ALLOWED_POLICIES_BY_CATEGORY.get(category, set()))

    normalized: list[str] = []
    removed_policies: list[str] = []
    for policy in policy_references:
        if allowed_policies and policy not in allowed_policies:
            if policy not in removed_policies:
                removed_policies.append(policy)
            continue
        if policy not in normalized:
            normalized.append(policy)

    notes: list[str] = []
    if primary_policy and primary_policy not in normalized:
        normalized.insert(0, primary_policy)
        notes.append(f"added {primary_policy} for category {category}")

    if not allowed_policies:
        normalized = policy_references

    if removed_policies:
        notes.append(
            "removed incompatible policies "
            + ", ".join(removed_policies)
            + f" for category {category}"
        )

    calibration_note = "; ".join(notes) if notes else None
    return normalized, calibration_note
