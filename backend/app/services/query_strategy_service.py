import re
import unicodedata
from typing import Any

STOPWORDS = {
    "a",
    "ao",
    "as",
    "com",
    "como",
    "da",
    "das",
    "de",
    "do",
    "dos",
    "e",
    "em",
    "na",
    "nas",
    "no",
    "nos",
    "o",
    "os",
    "ou",
    "para",
    "por",
    "qual",
    "quais",
    "que",
    "se",
    "sem",
    "sobre",
    "um",
    "uma",
}

VAGUE_PATTERNS = (
    "sobre o que fala",
    "o que fala esse documento",
    "me explique",
    "explique melhor",
    "resuma",
    "quais sao os pontos principais",
    "quais são os pontos principais",
    "como funciona",
    "o que devo saber",
)

SPECIFIC_CONNECTORS = (
    "quando",
    "incluindo",
    "segundo",
    "conforme",
    "periodicidade",
    "prazo",
    "procedimento",
    "requisito",
    "excecao",
    "exceção",
    "condicao",
    "condição",
    "responsabilidade",
    "deve constar",
    "em caso de",
)

SPECIFIC_TERMS = (
    "artigo",
    "secao",
    "seção",
    "item",
    "norma",
    "prazo",
    "data",
    "pagina",
    "página",
    "procedimento",
    "requisito",
    "excecao",
    "exceção",
    "condicao",
    "condição",
    "responsabilidade",
)


def _normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value.strip().lower())
    normalized = "".join(char for char in normalized if not unicodedata.combining(char))
    return re.sub(r"\s+", " ", normalized)


def _tokenize(value: str) -> list[str]:
    return re.findall(r"[a-z0-9]{2,}", _normalize_text(value))


def is_vague_question(question: str) -> bool:
    normalized_question = _normalize_text(question)
    tokens = [token for token in _tokenize(question) if token not in STOPWORDS]

    if any(pattern in normalized_question for pattern in VAGUE_PATTERNS):
        return True

    return len(tokens) <= 3


def looks_specific_question(question: str) -> bool:
    normalized_question = _normalize_text(question)
    tokens = [token for token in _tokenize(question) if token not in STOPWORDS]

    if any(connector in normalized_question for connector in SPECIFIC_CONNECTORS):
        return True

    if any(term in normalized_question for term in SPECIFIC_TERMS):
        return True

    return len(tokens) >= 8


def extract_document_search_terms(document: dict[str, Any]) -> list[str]:
    raw_values: list[str] = []

    for field_name in (
        "document_summary",
        "document_type",
        "theme_name",
    ):
        value = document.get(field_name)
        if isinstance(value, str) and value.strip():
            raw_values.append(value)

    for field_name in ("main_topics", "suggested_questions"):
        value = document.get(field_name)
        if isinstance(value, list):
            raw_values.extend(item for item in value if isinstance(item, str))

    terms: list[str] = []
    seen = set()

    for raw_value in raw_values:
        normalized_value = _normalize_text(raw_value)
        if len(normalized_value) >= 4 and normalized_value not in seen:
            seen.add(normalized_value)
            terms.append(normalized_value)

        for token in _tokenize(raw_value):
            if len(token) < 4 or token in STOPWORDS or token in seen:
                continue
            seen.add(token)
            terms.append(token)

        if len(terms) >= 40:
            break

    return terms[:40]


def count_matching_document_terms(question: str, document_terms: list[str]) -> int:
    normalized_question = _normalize_text(question)
    match_count = 0

    for term in document_terms:
        normalized_term = _normalize_text(term)
        if len(normalized_term) < 4 or normalized_term in STOPWORDS:
            continue

        if normalized_term in normalized_question:
            match_count += 1

    return match_count


def matches_document_terms(question: str, document_terms: list[str]) -> bool:
    return count_matching_document_terms(question, document_terms) > 0


def decide_query_generation_strategy(
    question: str,
    document_terms: list[str] | None = None,
) -> dict[str, Any]:
    matched_document_terms_count = 0

    if is_vague_question(question):
        return {
            "should_generate": True,
            "reason": "vague_question",
            "matched_document_terms_count": 0,
        }

    if document_terms:
        matched_document_terms_count = count_matching_document_terms(
            question,
            document_terms,
        )
        if matched_document_terms_count > 0:
            return {
                "should_generate": False,
                "reason": "matched_document_terms",
                "matched_document_terms_count": matched_document_terms_count,
            }

    if looks_specific_question(question):
        return {
            "should_generate": False,
            "reason": "looks_specific",
            "matched_document_terms_count": matched_document_terms_count,
        }

    if len(_tokenize(question)) <= 4:
        return {
            "should_generate": True,
            "reason": "short_generic_question",
            "matched_document_terms_count": matched_document_terms_count,
        }

    return {
        "should_generate": False,
        "reason": "default_original_only",
        "matched_document_terms_count": matched_document_terms_count,
    }


def should_generate_alternative_queries(
    question: str,
    document_terms: list[str] | None = None,
) -> bool:
    return bool(
        decide_query_generation_strategy(
            question=question,
            document_terms=document_terms,
        )["should_generate"]
    )
