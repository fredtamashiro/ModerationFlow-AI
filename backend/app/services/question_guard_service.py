import re

from app.config import get_settings

BLOCK_MESSAGE = (
    "Sua pergunta contém dados pessoais ou termos inadequados. "
    "Remova essas informações e tente novamente."
)

CPF_RE = re.compile(r"(?<!\d)(\d{3}\.?\d{3}\.?\d{3}-?\d{2})(?!\d)")
EMAIL_RE = re.compile(r"\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b")
PHONE_RE = re.compile(
    r"(?<!\d)(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)(?:9?\d{4})[-\s]?\d{4}(?!\d)"
)

SECRET_PATTERNS = (
    "sk-",
    "api_key",
    "token=",
    "password=",
    "senha=",
)


def _normalize_digits(value: str) -> str:
    return re.sub(r"\D", "", value)


def _contains_valid_cpf(question: str) -> bool:
    for match in CPF_RE.finditer(question):
        digits = _normalize_digits(match.group(1))
        if len(digits) == 11:
            return True
    return False


def _contains_blocked_term(question: str, blocked_terms: list[str]) -> bool:
    normalized_question = question.casefold()

    for term in blocked_terms:
        cleaned_term = term.strip().casefold()
        if cleaned_term and cleaned_term in normalized_question:
            return True

    return False


def validate_question_safety(question: str) -> dict[str, object]:
    settings = get_settings()
    sanitized_question = question.strip()

    if not settings.question_guard_enabled:
        return {
            "allowed": True,
            "reason": None,
            "message": None,
            "sanitized_question": sanitized_question,
        }

    blocked_terms = [
        term.strip()
        for term in settings.question_guard_blocked_terms.split(",")
        if term.strip()
    ]

    if _contains_valid_cpf(sanitized_question):
        return {
            "allowed": False,
            "reason": "cpf_detected",
            "message": BLOCK_MESSAGE,
            "sanitized_question": None,
        }

    if EMAIL_RE.search(sanitized_question):
        return {
            "allowed": False,
            "reason": "email_detected",
            "message": BLOCK_MESSAGE,
            "sanitized_question": None,
        }

    if PHONE_RE.search(sanitized_question):
        return {
            "allowed": False,
            "reason": "phone_detected",
            "message": BLOCK_MESSAGE,
            "sanitized_question": None,
        }

    if _contains_blocked_term(sanitized_question, blocked_terms):
        return {
            "allowed": False,
            "reason": "blocked_term_detected",
            "message": BLOCK_MESSAGE,
            "sanitized_question": None,
        }

    normalized_question = sanitized_question.casefold()
    if any(pattern in normalized_question for pattern in SECRET_PATTERNS):
        return {
            "allowed": False,
            "reason": "secret_detected",
            "message": BLOCK_MESSAGE,
            "sanitized_question": None,
        }

    return {
        "allowed": True,
        "reason": None,
        "message": None,
        "sanitized_question": sanitized_question,
    }
