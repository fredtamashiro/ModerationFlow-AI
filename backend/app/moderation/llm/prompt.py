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
- When there is not enough certainty for "approve" or "remove", use "flag".
- Prefer "approve" for legitimate criticism without personal attack or abuse.
- Prefer "approve" for support requests or frustrated help requests without direct offense.
- Prefer "remove" for clear discrimination, dangerous or illegal content, severe offense, or explicit spam.
- Differentiate explicit spam from subtle spam:
  - explicit link, group, external contact, or promotional push can justify "remove";
  - subtle external invitation or ambiguous promo should prefer "flag".
- Cases involving protected groups, exclusion, humiliation, or depreciative generalization should map to R-004.
- Cases involving fraud, bypassing the system, credential sharing, hacking, invasion, cheating, or illegal acts should map to R-005.
- Avoid false positives for R-004 when the comment only mentions a protected-topic word without discriminatory content.
- Keep policy references consistent with the chosen category whenever the mapping is clear.
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
            "decision rules:\n"
            '- ambiguity, sarcasm, indirect attack, short low-context comment, or strong mixed-signal feedback -> prefer "flag"\n'
            '- legitimate criticism without direct offense -> "approve" + category legitimate_criticism + R-006\n'
            '- frustrated support/help request without direct offense -> "approve" + category question_or_support_request + R-007\n'
            '- positive feedback -> "approve" + category positive_feedback + R-008\n'
            '- clear discrimination or hateful exclusion -> "remove" + category hate_or_discrimination + R-004\n'
            '- dangerous, illegal, fraud, bypass, hack, or credential-sharing content -> "remove" + category dangerous_or_illegal_content + R-005\n'
            '- explicit spam with strong external promotion -> "remove" + category spam + R-001\n'
            '- subtle spam or external invitation without full certainty -> "flag" + category spam + R-001'
        ),
        (
            "policy mapping rules:\n"
            '- spam -> must include R-001\n'
            '- personal_attack -> must include R-002; R-003 may also appear when explicit offensive language is present\n'
            '- offensive_language -> must include R-003; R-002 may also appear when there is a directed personal attack\n'
            '- hate_or_discrimination -> must include R-004\n'
            '- dangerous_or_illegal_content -> must include R-005\n'
            '- legitimate_criticism -> must include R-006\n'
            '- question_or_support_request -> must include R-007\n'
            '- positive_feedback -> must include R-008; R-006 may also appear for praise with a real caveat\n'
            '- ambiguous -> use the most relevant rule, often R-006, R-002, or R-003 depending on the case\n'
            '- other -> policy_references may be empty'
        ),
        (
            "category boundary rules:\n"
            '- use legitimate_criticism when the comment criticizes the class, course, pacing, teaching style, depth, structure, or examples without directly insulting a person\n'
            '- use offensive_language when there is abusive or insulting language even if the target is mainly the content or work quality\n'
            '- use personal_attack when the criticism is directed at a person such as teacher, tutor, student, or staff member\n'
            '- if both personal attack and offensive language are present, choose the dominant category based on whether the human target is central to the message\n'
            '- use hate_or_discrimination only when a protected group, exclusion, humiliating generalization, or discriminatory treatment is clearly involved\n'
            '- do not use hate_or_discrimination for ordinary criticism, generic offense, or ambiguous wording without a protected-group target\n'
            '- use positive_feedback when the message is predominantly positive or neutral\n'
            '- use legitimate_criticism instead of positive_feedback when praise includes a meaningful caveat and the caveat is the most useful part of the message\n'
            '- use question_or_support_request when the comment clearly asks for help, access, correction, verification, certificate, login, or support\n'
            '- if the comment mixes complaint and request for help, prioritize question_or_support_request\n'
            '- choose the dominant category instead of averaging multiple weak signals'
        ),
        (
            "reference examples:\n"
            '- "nao gostei da aula, achei superficial" -> legitimate_criticism / low / approve / ["R-006"]\n'
            '- "ninguem resolve meu certificado" -> question_or_support_request / low / approve / ["R-007"]\n'
            '- "parabens, ficou tao claro que eu entendi menos" -> ambiguous / medium / flag / ["R-006"]\n'
            '- "tratar alunas como menos capazes aqui e inaceitavel" -> hate_or_discrimination / high / remove / ["R-004"]\n'
            '- "compartilhar a senha com outras pessoas ajuda a contornar isso?" -> dangerous_or_illegal_content / high / remove / ["R-005"]\n'
            '- "entrem no meu grupo para baixar todo o material" -> spam / medium / remove or flag depending on explicitness, but never approve\n'
            '- criticism about a class being shallow or confusing without attacking a person -> legitimate_criticism\n'
            '- insult aimed at a teacher or staff member -> personal_attack\n'
            '- offensive wording without a clear human target -> offensive_language\n'
            '- praise with a meaningful complaint about missing depth or examples -> often legitimate_criticism\n'
            '- complaint plus explicit help request about access or certificate -> question_or_support_request'
        ),
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
        'policy_references must never be empty unless category is exactly "other".',
        f"output schema:\n{json.dumps(output_schema, ensure_ascii=True, indent=2)}",
        "Return only the JSON object.",
    ]
    return "\n\n".join(sections)
