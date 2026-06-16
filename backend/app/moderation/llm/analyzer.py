from __future__ import annotations

from time import perf_counter
from typing import Any

from langchain_openai import ChatOpenAI

from app.config import get_settings
from app.moderation.llm.prompt import SYSTEM_PROMPT, build_llm_prompt
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
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is required for LLM evaluation mode.")

    prompt = build_llm_prompt(comment, available_guidelines)
    started_at = perf_counter()
    run_context = start_langsmith_run(
        name="llm_risk_analyzer",
        inputs={
            "comment": comment,
            "prompt": prompt,
            "guidelines": available_guidelines,
        },
        metadata=trace_metadata or {},
        tags=["moderation-flow-ai", "llm-experiment"],
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

        normalized = _normalize_and_validate_response(parsed_response).model_dump()
        latency_ms = max(0, round((perf_counter() - started_at) * 1000))
        finalize_langsmith_run(
            run_context,
            outputs={
                "raw_response": raw_response_payload,
                "parsed_response": normalized,
            },
            metadata={
                **(trace_metadata or {}),
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
                **(trace_metadata or {}),
                "schema_valid": False,
                "latency_ms": latency_ms,
            },
            tags=["error"],
        )
        raise


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
