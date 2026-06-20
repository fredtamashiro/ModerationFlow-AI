from __future__ import annotations

import json
from collections import Counter
from dataclasses import dataclass
from pathlib import Path


ALLOWED_FEEDBACK_CATEGORIES = {
    "spam",
    "personal_attack",
    "offensive_language",
    "hate_or_discrimination",
    "dangerous_or_illegal_content",
    "legitimate_criticism",
    "question_or_support_request",
    "positive_feedback",
    "ambiguous",
    "other",
}

ALLOWED_FEEDBACK_RISK_LEVELS = {"low", "medium", "high", "unknown"}
ALLOWED_FEEDBACK_ACTIONS = {
    "approve",
    "flag",
    "remove",
    "request_edit",
    "needs_human_review",
}
ALLOWED_POLICY_RULES = {
    "R-001",
    "R-002",
    "R-003",
    "R-004",
    "R-005",
    "R-006",
    "R-007",
    "R-008",
}
ALLOWED_SOURCE_TYPES = {"curated_example"}
CATEGORY_ALLOWED_POLICY_RULES = {
    "spam": {"R-001"},
    "personal_attack": {"R-002", "R-003"},
    "offensive_language": {"R-003"},
    "hate_or_discrimination": {"R-004"},
    "dangerous_or_illegal_content": {"R-005"},
    "legitimate_criticism": {"R-006"},
    "question_or_support_request": {"R-007"},
    "positive_feedback": {"R-008"},
    "ambiguous": {"R-003", "R-006"},
    "other": {"R-006"},
}
CATEGORY_REQUIRED_POLICY_RULES = {
    "spam": {"R-001"},
    "personal_attack": {"R-002"},
    "offensive_language": {"R-003"},
    "hate_or_discrimination": {"R-004"},
    "dangerous_or_illegal_content": {"R-005"},
    "legitimate_criticism": {"R-006"},
    "question_or_support_request": {"R-007"},
    "positive_feedback": {"R-008"},
    "ambiguous": {"R-006"},
    "other": {"R-006"},
}


@dataclass
class FeedbackExample:
    id: str
    comment: str
    human_category: str
    human_risk_level: str
    human_action: str
    human_policy_rules: list[str]
    moderator_note: str
    source_type: str


def load_feedback_examples(dataset_path: Path | None = None) -> list[FeedbackExample]:
    path = dataset_path or _feedback_dataset_path()
    raw_items = _load_json_list(path)
    examples: list[FeedbackExample] = []
    seen_ids: set[str] = set()
    seen_comments: set[str] = set()

    for index, item in enumerate(raw_items, start=1):
        if not isinstance(item, dict):
            raise ValueError(
                f"Item #{index} do dataset de feedback deve ser um objeto JSON."
            )

        missing_fields = [
            field_name
            for field_name in (
                "id",
                "comment",
                "human_category",
                "human_risk_level",
                "human_action",
                "human_policy_rules",
                "moderator_note",
                "source_type",
            )
            if field_name not in item
        ]
        if missing_fields:
            raise ValueError(
                "Item "
                f"#{index} do dataset de feedback esta sem campos obrigatorios: "
                f"{missing_fields}"
            )

        example = FeedbackExample(
            id=str(item["id"]),
            comment=str(item["comment"]),
            human_category=str(item["human_category"]),
            human_risk_level=str(item["human_risk_level"]),
            human_action=str(item["human_action"]),
            human_policy_rules=[str(rule) for rule in item["human_policy_rules"]],
            moderator_note=str(item["moderator_note"]),
            source_type=str(item["source_type"]),
        )
        validate_feedback_example(
            example,
            seen_ids=seen_ids,
            seen_comments=seen_comments,
        )
        seen_ids.add(example.id)
        seen_comments.add(example.comment.strip())
        examples.append(example)

    _validate_no_overlap_with_evaluation_datasets(examples)
    return examples


def validate_feedback_example(
    example: FeedbackExample,
    *,
    seen_ids: set[str],
    seen_comments: set[str],
) -> None:
    if example.id in seen_ids:
        raise ValueError(f"ID duplicado no dataset de feedback: {example.id}")
    if not example.comment.strip():
        raise ValueError(f"Exemplo {example.id} possui comment vazio.")
    if example.comment.strip() in seen_comments:
        raise ValueError(f"Comment duplicado no dataset de feedback: {example.id}")
    if example.human_category not in ALLOWED_FEEDBACK_CATEGORIES:
        raise ValueError(
            f"Exemplo {example.id} possui human_category invalido: "
            f"{example.human_category}"
        )
    if example.human_risk_level not in ALLOWED_FEEDBACK_RISK_LEVELS:
        raise ValueError(
            f"Exemplo {example.id} possui human_risk_level invalido: "
            f"{example.human_risk_level}"
        )
    if example.human_action not in ALLOWED_FEEDBACK_ACTIONS:
        raise ValueError(
            f"Exemplo {example.id} possui human_action invalido: "
            f"{example.human_action}"
        )
    if not example.human_policy_rules:
        raise ValueError(
            f"Exemplo {example.id} deve possuir ao menos uma human_policy_rules."
        )
    invalid_rules = [
        rule for rule in example.human_policy_rules if rule not in ALLOWED_POLICY_RULES
    ]
    if invalid_rules:
        raise ValueError(
            f"Exemplo {example.id} possui human_policy_rules invalidas: {invalid_rules}"
        )
    if len(example.human_policy_rules) != len(set(example.human_policy_rules)):
        raise ValueError(
            f"Exemplo {example.id} possui human_policy_rules duplicadas."
        )

    allowed_rules = CATEGORY_ALLOWED_POLICY_RULES[example.human_category]
    incompatible_rules = [
        rule for rule in example.human_policy_rules if rule not in allowed_rules
    ]
    if incompatible_rules:
        raise ValueError(
            f"Exemplo {example.id} possui policies incompativeis com "
            f"{example.human_category}: {incompatible_rules}"
        )

    required_rules = CATEGORY_REQUIRED_POLICY_RULES[example.human_category]
    if not required_rules.intersection(example.human_policy_rules):
        raise ValueError(
            f"Exemplo {example.id} deve conter ao menos uma policy principal "
            f"de {sorted(required_rules)}."
        )

    if not example.moderator_note.strip():
        raise ValueError(f"Exemplo {example.id} possui moderator_note vazio.")
    if example.source_type not in ALLOWED_SOURCE_TYPES:
        raise ValueError(
            f"Exemplo {example.id} possui source_type invalido: {example.source_type}"
        )


def _validate_no_overlap_with_evaluation_datasets(
    feedback_examples: list[FeedbackExample],
) -> None:
    evaluation_comments: dict[str, tuple[str, str]] = {}

    for dataset_name, dataset_path in _evaluation_dataset_paths().items():
        for item in _load_json_list(dataset_path):
            if not isinstance(item, dict) or "comment" not in item or "id" not in item:
                raise ValueError(
                    f"Dataset de avaliacao invalido para checagem de overlap: "
                    f"{dataset_path}"
                )
            comment = str(item["comment"]).strip()
            evaluation_comments[comment] = (dataset_name, str(item["id"]))

    for example in feedback_examples:
        overlap = evaluation_comments.get(example.comment.strip())
        if overlap is None:
            continue
        dataset_name, dataset_example_id = overlap
        raise ValueError(
            f"Exemplo {example.id} reutiliza literalmente comment do dataset "
            f"{dataset_name} ({dataset_example_id})."
        )


def summarize_feedback_examples(
    examples: list[FeedbackExample],
) -> dict[str, object]:
    category_counts = Counter(example.human_category for example in examples)
    action_counts = Counter(example.human_action for example in examples)
    risk_counts = Counter(example.human_risk_level for example in examples)

    return {
        "total_examples": len(examples),
        "category_counts": dict(sorted(category_counts.items())),
        "action_counts": dict(sorted(action_counts.items())),
        "risk_counts": dict(sorted(risk_counts.items())),
        "evaluation_datasets_checked": sorted(_evaluation_dataset_paths().keys()),
    }


def _feedback_dataset_path() -> Path:
    return Path(__file__).resolve().parent / "datasets" / "moderation_feedback_examples.json"


def _evaluation_dataset_paths() -> dict[str, Path]:
    datasets_dir = Path(__file__).resolve().parent / "datasets"
    return {
        "main": datasets_dir / "moderation_eval.json",
        "holdout": datasets_dir / "moderation_holdout_eval.json",
        "blind": datasets_dir / "moderation_blind_eval.json",
        "safety": datasets_dir / "moderation_safety_regression_eval.json",
    }


def _load_json_list(path: Path) -> list[object]:
    if not path.exists():
        raise FileNotFoundError(f"Arquivo JSON nao encontrado: {path}")

    with path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, list):
        raise ValueError(f"O arquivo {path} deve conter uma lista JSON.")

    return data


def main() -> None:
    examples = load_feedback_examples()
    summary = summarize_feedback_examples(examples)
    print("Human feedback examples validation passed.")
    print(json.dumps(summary, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()
