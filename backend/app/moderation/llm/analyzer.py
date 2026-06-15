from __future__ import annotations

from typing import Any

from langchain_openai import ChatOpenAI

from app.config import get_settings
from app.moderation.llm.prompt import SYSTEM_PROMPT, build_llm_prompt
from app.moderation.llm.schemas import LLMRiskAnalyzerResponse

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


def analyze_comment_with_llm(comment: str, available_guidelines: list[dict]) -> dict:
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is required for LLM evaluation mode.")

    llm = ChatOpenAI(
        model=settings.openai_chat_model,
        temperature=settings.openai_chat_temperature,
        api_key=settings.openai_api_key,
    ).with_structured_output(LLMRiskAnalyzerResponse)

    response = llm.invoke(
        [
            ("system", SYSTEM_PROMPT),
            ("human", build_llm_prompt(comment, available_guidelines)),
        ]
    )

    return _normalize_and_validate_response(response).model_dump()


def _normalize_and_validate_response(payload: LLMRiskAnalyzerResponse | dict[str, Any]) -> LLMRiskAnalyzerResponse:
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
    if calibration_note:
        justification = f"{justification} [policy calibration: {calibration_note}]"

    normalized_payload = {
        "category": category,
        "risk_level": risk_level,
        "recommended_action": recommended_action,
        "confidence": confidence,
        "policy_references": policy_references,
        "justification": justification,
    }
    return LLMRiskAnalyzerResponse.model_validate(normalized_payload)


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
    for policy in policy_references:
        if allowed_policies and policy not in allowed_policies:
            continue
        if policy not in normalized:
            normalized.append(policy)

    calibration_note: str | None = None
    if primary_policy and primary_policy not in normalized:
        normalized.insert(0, primary_policy)
        calibration_note = f"added {primary_policy} for category {category}"

    if not allowed_policies:
        normalized = policy_references

    return normalized, calibration_note
