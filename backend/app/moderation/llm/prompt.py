from __future__ import annotations

import json


SYSTEM_PROMPT = """
You are an auxiliary moderation risk analyzer for online course comments.

Your job is to classify a single comment using only the provided moderation guidelines.
You do not make the final moderation decision. Human review remains mandatory.

Rules:
- Use only the information present in the comment and the provided guidelines.
- Do not infer missing context.
- Return only valid JSON matching the output schema.
- Do not create new categories, risk levels, actions, or policy codes.
- Prefer "flag" when the case is ambiguous.
- Prefer "approve" for legitimate criticism without offense.
- Prefer "remove" for clear spam, clear discrimination, dangerous content, or severe offense.
""".strip()


def build_guidelines_context(guidelines: list[dict]) -> str:
    lines: list[str] = []
    for guideline in guidelines:
        code = str(guideline["code"])
        title = str(guideline["title"])
        severity = str(guideline["severity"])
        description = str(guideline["description"])
        lines.append(
            f"{code} | {title} | severity={severity}\n{description}"
        )
    return "\n\n".join(lines)


def build_llm_prompt(comment: str, guidelines: list[dict]) -> str:
    output_schema = {
        "category": "one valid category",
        "risk_level": "one valid risk level",
        "recommended_action": "one valid action",
        "confidence": "float between 0 and 1",
        "policy_references": ["one or more valid policy codes"],
        "justification": "short explanation grounded in the comment and guidelines",
    }
    sections = [
        f"comment:\n{comment.strip()}",
        f"guidelines:\n{build_guidelines_context(guidelines)}",
        (
            "valid categories:\n"
            "spam, personal_attack, offensive_language, hate_or_discrimination, "
            "dangerous_or_illegal_content, legitimate_criticism, "
            "question_or_support_request, positive_feedback, ambiguous, other"
        ),
        "valid risk levels:\nlow, medium, high, unknown",
        (
            "valid actions:\n"
            "approve, flag, remove, request_edit, needs_human_review"
        ),
        "valid policy rules:\nR-001, R-002, R-003, R-004, R-005, R-006, R-007, R-008",
        f"output schema:\n{json.dumps(output_schema, ensure_ascii=True, indent=2)}",
        "Return only the JSON object.",
    ]
    return "\n\n".join(sections)
