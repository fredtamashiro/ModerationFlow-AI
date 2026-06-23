from __future__ import annotations

from dataclasses import dataclass

from app.evaluation.feedback_examples import FeedbackExample, load_feedback_examples


MAX_DYNAMIC_FEW_SHOT_EXAMPLES = 4
FALLBACK_DYNAMIC_FEW_SHOT_EXAMPLE_IDS = (
    "feedback-003",
    "feedback-006",
    "feedback-016",
    "feedback-019",
)
TAGGED_FEEDBACK_EXAMPLE_IDS = {
    "ambiguous_criticism": ("feedback-003", "feedback-024"),
    "sarcasm": ("feedback-004", "feedback-020"),
    "subtle_spam": ("feedback-006", "feedback-007"),
    "explicit_spam": ("feedback-008", "feedback-006"),
    "personal_attack": ("feedback-010", "feedback-022"),
    "personal_attack_severe": ("feedback-012", "feedback-010"),
    "offensive_language_quality_target": ("feedback-013", "feedback-023"),
    "offensive_language": ("feedback-011", "feedback-023"),
    "hate_or_discrimination": ("feedback-014", "feedback-015"),
    "positive_feedback": ("feedback-019", "feedback-018"),
    "support_request": ("feedback-016", "feedback-017"),
}


@dataclass
class DynamicFewShotSelection:
    examples: list[FeedbackExample]
    selected_example_ids: list[str]
    matched_tags: list[str]
    used_fallback: bool


def select_dynamic_few_shot_examples(comment: str) -> DynamicFewShotSelection:
    examples_by_id = {
        example.id: example for example in load_feedback_examples()
    }
    matched_tags = _detect_selection_tags(comment)
    selected_ids: list[str] = []

    for tag in matched_tags:
        for example_id in TAGGED_FEEDBACK_EXAMPLE_IDS.get(tag, ()):
            if example_id not in selected_ids:
                selected_ids.append(example_id)
            if len(selected_ids) >= MAX_DYNAMIC_FEW_SHOT_EXAMPLES:
                break
        if len(selected_ids) >= MAX_DYNAMIC_FEW_SHOT_EXAMPLES:
            break

    used_fallback = False
    if not selected_ids:
        used_fallback = True

    for example_id in FALLBACK_DYNAMIC_FEW_SHOT_EXAMPLE_IDS:
        if len(selected_ids) >= MAX_DYNAMIC_FEW_SHOT_EXAMPLES:
            break
        if example_id not in selected_ids:
            selected_ids.append(example_id)

    selected_examples: list[FeedbackExample] = []
    for example_id in selected_ids:
        example = examples_by_id.get(example_id)
        if example is None:
            raise ValueError(
                f"Dynamic few-shot example id nao encontrado no dataset curado: {example_id}"
            )
        selected_examples.append(example)

    return DynamicFewShotSelection(
        examples=selected_examples,
        selected_example_ids=selected_ids,
        matched_tags=matched_tags,
        used_fallback=used_fallback,
    )


def _detect_selection_tags(comment: str) -> list[str]:
    text = comment.lower().strip()
    tags: list[str] = []

    if _contains_any(
        text,
        (
            "religiao",
            "origem",
            "raca",
            "raça",
            "genero",
            "gênero",
            "mulher",
            "mulheres",
            "homem",
            "trans",
            "gay",
            "lesb",
            "deficiencia",
            "deficiência",
            "nacionalidade",
            "orientacao",
            "orientação",
            "preconceito",
            "tipo de gente",
            "manda embora",
            "nao quero dividir",
            "não quero dividir",
            "nao deveria ter espaco",
            "não deveria ter espaço",
        ),
    ):
        tags.append("hate_or_discrimination")

    if _contains_any(
        text,
        (
            "link",
            "perfil",
            "site",
            "grupo",
            "canal",
            "acesse",
            "acessem",
            "entre no grupo",
            "entrem no grupo",
            "compr",
            "vendo",
            "venda",
            "desconto",
            "promoc",
            "promoç",
            "baixar",
            "pacote",
            "externo",
        ),
    ):
        tags.append("explicit_spam")
    elif _contains_any(
        text,
        (
            "mensagem",
            "privado",
            "direct",
            "inbox",
            "chat",
            "resumo",
            "guia",
            "contato",
            "chamar",
            "me chama",
            "me mand",
        ),
    ):
        tags.append("subtle_spam")

    if _contains_any(
        text,
        (
            "certificado",
            "acesso",
            "login",
            "travou",
            "trava",
            "carrega",
            "abrir",
            "abriu",
            "verificar",
            "verifica",
            "ajuda",
            "resolver",
            "progresso",
        ),
    ):
        tags.append("support_request")

    if _contains_any(
        text,
        (
            "...",
            "so que nao",
            "só que não",
            "parabens",
            "parabéns",
            "nossa",
            "espetacular",
            "revolucion",
        ),
    ):
        tags.append("sarcasm")

    person_target = _contains_any(
        text,
        (
            "professor",
            "tutor",
            "instrutor",
            "monitor",
            "equipe",
            "suporte",
            "voce",
            "você",
        ),
    )
    content_target = _contains_any(
        text,
        (
            "aula",
            "curso",
            "modulo",
            "módulo",
            "conteudo",
            "conteúdo",
            "material",
            "servico",
            "serviço",
            "apostila",
            "explicacao",
            "explicação",
            "trilha",
            "plataforma",
            "trabalho entregue",
        ),
    )
    content_quality_target = _contains_any(
        text,
        (
            "quem montou",
            "quem estruturou",
            "quem preparou",
            "quem fez",
            "nao domina o assunto",
            "nÃ£o domina o assunto",
            "mal organizado",
            "mal explicado",
        ),
    )
    hostile_words = _contains_any(
        text,
        (
            "imbecil",
            "ridiculo",
            "ridículo",
            "idiota",
            "patetico",
            "patético",
            "porcaria",
            "lixo",
            "horrivel",
            "horrível",
            "vergonha",
            "despreparad",
            "grosseir",
            "arrogante",
            "descaso",
            "malfeito",
            "desastre",
        ),
    )

    severe_personal_attack = _contains_any(
        text,
        (
            "imbecil",
            "ridiculo",
            "ridículo",
            "idiota",
            "patetico",
            "patético",
        ),
    )

    if person_target and severe_personal_attack:
        tags.append("personal_attack_severe")
    if person_target and hostile_words:
        tags.append("personal_attack")
    if content_target and (hostile_words or content_quality_target):
        tags.append("offensive_language_quality_target")
    if content_target and hostile_words:
        tags.append("offensive_language")

    if not hostile_words and _contains_any(
        text,
        (
            "confus",
            "rasa",
            "superfic",
            "corrido",
            "fraco",
            "fraca",
            "decepcion",
            "faltou",
            "abaixo do que eu esperava",
            "abaixo do esperado",
        ),
    ):
        tags.append("ambiguous_criticism")

    if _contains_any(
        text,
        (
            "gostei",
            "curti",
            "muito boa",
            "muito bom",
            "bom material",
            "clareza",
            "foi muito boa",
            "foi muito bom",
        ),
    ):
        tags.append("positive_feedback")

    return _deduplicate_preserving_order(tags)


def _contains_any(text: str, needles: tuple[str, ...]) -> bool:
    return any(needle in text for needle in needles)


def _deduplicate_preserving_order(values: list[str]) -> list[str]:
    deduplicated: list[str] = []
    for value in values:
        if value not in deduplicated:
            deduplicated.append(value)
    return deduplicated
