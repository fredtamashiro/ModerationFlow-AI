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
  - explicit link, clear group recruitment, repeated promotion, direct external redirect, or strong external promotional push can justify "remove";
  - subtle external invitation, private contact request, "material por fora", "me chama", "me manda mensagem", or ambiguous promo should prefer "flag".
- Cases involving protected groups, exclusion, humiliation, or depreciative generalization should map to R-004.
- If a statement centers on prejudice, exclusion, inferiority, or hostility involving a protected group, prioritize hate_or_discrimination over personal_attack or offensive_language.
- If there is a clearly identifiable protected group plus negative generalization, exclusion, inferiorization, or explicit prejudice, the result should be hate_or_discrimination / high / remove / R-004.
- Comments condemning prejudice against a protected group can still be moderation-relevant for R-004 when the central topic is discriminatory treatment of that group; do not misclassify them as positive_feedback.
- Cases involving fraud, bypassing the system, credential sharing, hacking, invasion, cheating, or illegal acts should map to R-005.
- Avoid false positives for R-004 when the comment only mentions a protected-topic word without discriminatory content.
- Generic criticism, ordinary negativity, or frustration without a protected-group target must not receive R-004.
- When there is a clear protected group plus prejudice, exclusion, or inferiorization, do not soften the case to other, legitimate_criticism, ambiguous, personal_attack, or offensive_language.
- Keep policy references consistent with the chosen category whenever the mapping is clear.
- If the comment is clearly negative but not clearly abusive and not clearly simple mild criticism, prefer ambiguous / medium / flag.
- Sarcasm, ironic praise, or praise followed by negation should not be classified as positive_feedback.
- Strong insults directed at a class, module, course, content, service, or material should prefer offensive_language rather than legitimate_criticism.
- Explicit external promotion, profile links, sales, recruiting to groups, or download invitations are spam and should not be classified as dangerous_or_illegal_content unless the comment actually contains illegal or harmful instructions.
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
            '- subtle spam or external invitation without full certainty -> "flag" + category spam + R-001\n'
            '- direct commercial pitch alone does not automatically require high / remove; high / remove needs explicit link, external group, repeated promotion, direct redirect outside the platform, or clearly forceful external push\n'
            '- explicit recruiting to an external group, "link in profile", download group, or clear redirect outside the platform should stay spam + high + remove, not dangerous_or_illegal_content\n'
            '- if there is external contact, material outside the platform, private message, or guide outside the platform, but no explicit link, group, repeated promotion, or strong external redirect, use spam + medium + flag, not remove\n'
            '- if the comment is negative, but not clearly offensive and not clearly just mild criticism, choose ambiguous + medium + flag\n'
            '- sarcasm or ironic praise should prefer ambiguous + medium + flag, not positive_feedback\n'
            '- praise with a light caveat may stay low-risk approve, but the category should reflect whether the praise or the caveat is dominant\n'
            '- if the comment attacks or demeans a protected group, do not soften it to personal_attack, offensive_language, ambiguous, legitimate_criticism, or other\n'
            '- reserve remove for clear and severe violations; prefer flag for borderline abuse, moderate attack, ambiguity, or subtle spam'
        ),
        (
            "ambiguity and severity calibration rules:\n"
            '- mild, objective criticism about clarity, depth, pacing, examples, or organization without irony -> legitimate_criticism / low / approve / R-006\n'
            '- broader disappointment, harsher negative judgment, frustrated evaluation, or comments that sound more dismissive than simple feedback -> ambiguous / medium / flag / usually R-006\n'
            '- language like "horrivel", "lixo", "porcaria", or "vergonha" about a class, course, module, content, or service is usually offensive_language rather than legitimate_criticism\n'
            '- if a sentence starts positive and then flips with contrast, negation, irony, or ridicule, treat it as ambiguous rather than positive_feedback\n'
            '- comments like "excellent... except it explained nothing" or "congrats, now it is even more confusing" should be treated as ambiguous\n'
            '- when the overall tone is positive and the caveat is secondary, positive_feedback is acceptable with low risk and approve\n'
            '- when the caveat is the main point, legitimate_criticism is acceptable with low risk and approve\n'
            '- subtle spam such as private contact invitations, "message me", or "I have a guide outside" should be spam / medium / flag\n'
            '- "link in bio/profile", explicit external group recruiting, direct redirect outside the platform, or repeated external promotion can justify spam / high / remove\n'
            '- do not use remove for subtle spam unless there is explicit link sharing, explicit external group recruiting, repeated promotion, direct redirect, or clear promotional push\n'
            '- if spam is present but the promotion is indirect or only mildly commercial, prefer flag over remove'
        ),
        (
            "harmful content and attack boundary rules:\n"
            '- use personal_attack when the target is clearly a person or team and the core message is directed blame, disrespect, or devaluation of that human target\n'
            '- use offensive_language when the wording is insulting or abusive but the main target is the lesson, module, content, platform, or work quality rather than a person\n'
            '- if both personal attack and offensive language are present, choose the dominant category based on the main target and include both R-002 and R-003 only when truly justified\n'
            '- references such as "quem montou", "quem estruturou", "quem preparou", or similar can still be offensive_language when the real complaint is that the material, service, explanation, or course quality is poor\n'
            '- personal_attack is usually medium / flag when it is a directed attack without severe insult\n'
            '- personal_attack can escalate to high / remove when the insult is directly humiliating, degrading, or aggressively abusive toward the person or team\n'
            '- if a human-targeted message contains strong degrading insults like "imbecil", "ridiculo", "idiota", or similarly abusive wording, personal_attack remains the default dominant category, with R-003 added only when the abusive language itself is materially relevant\n'
            '- criticism of competence, structure, preparedness, or quality such as "nao domina o assunto" or "despreparado" can still be offensive_language when the message is mainly about the poor quality of the work, content, service, explanation, or material rather than hostility toward the human target\n'
            '- offensive_language is usually medium / flag when there is strong insulting language about the content or product\n'
            '- use hate_or_discrimination when the negativity targets a protected group or expresses exclusion, inferiority, contempt, or prejudice against religion, race, ethnicity, nationality, gender, sexual orientation, disability, or similar protected status\n'
            '- if the comment explicitly discusses prejudice against a protected group in a moderation-relevant harmful way, do not downgrade it to legitimate_criticism, other, positive_feedback, or ambiguous\n'
            '- do not use hate_or_discrimination for generic negativity, ordinary offense, or references to a protected-topic word without an actual discriminatory attack against the group\n'
            '- if there is a discriminatory generalization against a protected group, prioritize hate_or_discrimination even if the wording also looks like personal attack or offensive language\n'
            '- explicit external promotion, sales with direct external redirect, download groups, profile links, or direct recruiting should stay spam / high / remove; indirect contact invitations should stay spam / medium / flag\n'
            '- do not classify commercial or group-promotion spam as dangerous_or_illegal_content unless the text actually contains illegal or dangerous instructions'
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
            '- use ambiguous when the message is a stronger negative judgment, frustrated disappointment, sarcasm, or mixed-signal criticism that should not be auto-approved\n'
            '- use offensive_language when there is abusive or insulting language and the main target is the content, class, module, or work quality rather than a person\n'
            '- use personal_attack when the criticism is directed at a person such as teacher, tutor, student, staff member, or the people who created the material\n'
            '- if a statement criticizes competence or preparedness but reads mainly as abuse about the work quality, service, explanation, or material, offensive_language may be a better fit than personal_attack\n'
            '- if the message mentions unnamed creators or preparers only as a way to complain that the material or service is bad, confusing, weak, shallow, or incompetent, prefer offensive_language over personal_attack\n'
            '- if both personal attack and offensive language are present, choose the dominant category based on whether the human target is central to the message\n'
            '- use hate_or_discrimination only when a protected group, exclusion, humiliating generalization, discriminatory treatment, or prejudice against group identity is clearly involved\n'
            '- statements centered on prejudice against religion, race, ethnicity, gender, disability, or orientation in the community should favor hate_or_discrimination rather than legitimate_criticism\n'
            '- do not use hate_or_discrimination for ordinary criticism, generic offense, or ambiguous wording without a protected-group target\n'
            '- moderate directed attack on a person or team should usually stay personal_attack / medium / flag\n'
            '- severe humiliating insult directed at a person or team can justify remove, especially when the wording is explicit and degrading\n'
            '- use positive_feedback when the message is predominantly positive and any caveat is clearly secondary\n'
            '- use legitimate_criticism instead of positive_feedback when praise includes a meaningful caveat and the caveat is the most useful part of the message\n'
            '- do not use positive_feedback when praise is immediately reversed by negation, contrast, irony, or disappointment\n'
            '- use question_or_support_request when the comment clearly asks for help, access, correction, verification, certificate, login, or support\n'
            '- if the comment mixes complaint and request for help, prioritize question_or_support_request\n'
            '- choose the dominant category instead of averaging multiple weak signals'
        ),
        (
            "reference examples:\n"
            '- "nao gostei da aula, achei superficial" -> legitimate_criticism / low / approve / ["R-006"]\n'
            '- "bom material, mas faltou mostrar um cenario mais real" -> positive_feedback or legitimate_criticism / low / approve\n'
            '- "sendo honesto, ficou mais fraco do que eu imaginava" -> ambiguous / medium / flag / ["R-006"]\n'
            '- "a ideia era boa, mas o resultado final decepcionou" -> ambiguous / medium / flag / ["R-006"]\n'
            '- "excelente... so que nao explicou a parte importante" -> ambiguous / medium / flag / ["R-006"]\n'
            '- "ninguem resolve meu certificado" -> question_or_support_request / low / approve / ["R-007"]\n'
            '- "parabens, ficou tao claro que eu entendi menos" -> ambiguous / medium / flag / ["R-006"]\n'
            '- "tratar alunas como menos capazes aqui e inaceitavel" -> hate_or_discrimination / high / remove / ["R-004"]\n'
            '- "nao pode haver preconceito contra religiao nessa comunidade" -> hate_or_discrimination / high / remove / ["R-004"] when the moderation-relevant issue is prejudice against a protected group\n'
            '- "compartilhar a senha com outras pessoas ajuda a contornar isso?" -> dangerous_or_illegal_content / high / remove / ["R-005"]\n'
            '- "tenho um guia por fora, me manda mensagem se quiser" -> spam / medium / flag / ["R-001"]\n'
            '- "entrem no meu grupo para baixar todo o material" -> spam / high / remove / ["R-001"] when there is clear external recruiting or promotional push\n'
            '- "acesse meu site para comprar o treinamento completo" -> spam / medium or high depending on how explicit the redirect and promotion are; do not force high only because it sounds commercial\n'
            '- "link no perfil para comprar as respostas" -> spam / high / remove / ["R-001"], not dangerous_or_illegal_content unless there is actual harmful or illegal instruction\n'
            '- criticism about a class being shallow or confusing without attacking a person -> legitimate_criticism\n'
            '- negative evaluation with frustration or irony, but without direct insult -> ambiguous\n'
            '- "quem montou isso nao entende nada" -> personal_attack / medium / flag / ["R-002"]\n'
            '- "o professor e ridiculo" -> personal_attack / high / remove / ["R-002", "R-003"] can be appropriate when the wording is directly humiliating\n'
            '- "esse professor e um imbecil" -> personal_attack / high / remove / ["R-002", "R-003"] is appropriate for severe direct insult\n'
            '- "o suporte foi dado por gente despreparada" -> offensive_language / medium / flag / ["R-003"] is often preferable when the insult is about poor quality of service\n'
            '- "esse servico e horrivel" -> offensive_language / medium / flag / ["R-003"]\n'
            '- "quem estruturou isso claramente nao domina o assunto" -> offensive_language / medium / flag / ["R-003"] can be preferable when the criticism is mainly about incompetence of the work\n'
            '- "quem preparou esse material nao domina o assunto" -> offensive_language / medium / flag / ["R-003"] when the target is mainly the poor quality of the material\n'
            '- "esse modulo ficou horrivel e confuso" -> offensive_language / medium / flag / ["R-003"]\n'
            '- "essa aula ficou uma porcaria" -> offensive_language / medium / flag / ["R-003"]\n'
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
