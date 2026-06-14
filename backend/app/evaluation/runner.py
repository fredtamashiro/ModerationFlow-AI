from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from time import perf_counter
from typing import Any

from app.moderation.graph import moderation_graph
from app.moderation import repository


ALLOWED_EVAL_CATEGORIES = {
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

ALLOWED_EVAL_RISK_LEVELS = {"low", "medium", "high", "unknown"}
ALLOWED_EVAL_ACTIONS = {
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


@dataclass
class EvaluationExample:
    id: str
    comment: str
    expected_category: str
    expected_risk_level: str
    expected_action: str
    expected_policy_rules: list[str]
    notes: str | None = None


@dataclass
class EvaluationResult:
    example: EvaluationExample
    success: bool
    latency_ms: int
    predicted_action: str | None
    predicted_risk_level: str | None
    predicted_category: str | None
    predicted_policy_rules: list[str]
    error_message: str | None = None


def load_dataset(dataset_path: Path) -> list[EvaluationExample]:
    if not dataset_path.exists():
        raise FileNotFoundError(
            f"Dataset de avaliacao nao encontrado: {dataset_path}"
        )

    with dataset_path.open("r", encoding="utf-8") as file:
        raw_items = json.load(file)

    if not isinstance(raw_items, list):
        raise ValueError("O dataset deve ser uma lista JSON.")

    examples: list[EvaluationExample] = []
    seen_ids: set[str] = set()
    for index, item in enumerate(raw_items, start=1):
        if not isinstance(item, dict):
            raise ValueError(f"Item #{index} do dataset deve ser um objeto JSON.")

        missing_fields = [
            field_name
            for field_name in (
                "id",
                "comment",
                "expected_category",
                "expected_risk_level",
                "expected_action",
                "expected_policy_rules",
            )
            if field_name not in item
        ]
        if missing_fields:
            raise ValueError(
                f"Item #{index} do dataset esta sem campos obrigatorios: {missing_fields}"
            )

        example = EvaluationExample(
            id=str(item["id"]),
            comment=str(item["comment"]),
            expected_category=str(item["expected_category"]),
            expected_risk_level=str(item["expected_risk_level"]),
            expected_action=str(item["expected_action"]),
            expected_policy_rules=[str(rule) for rule in item["expected_policy_rules"]],
            notes=str(item["notes"]) if item.get("notes") is not None else None,
        )
        validate_example(example, seen_ids)
        seen_ids.add(example.id)
        examples.append(example)

    return examples


def validate_example(example: EvaluationExample, seen_ids: set[str]) -> None:
    if example.id in seen_ids:
        raise ValueError(f"ID duplicado no dataset: {example.id}")
    if not example.comment.strip():
        raise ValueError(f"Exemplo {example.id} possui comment vazio.")
    if example.expected_category not in ALLOWED_EVAL_CATEGORIES:
        raise ValueError(
            f"Exemplo {example.id} possui expected_category invalido: "
            f"{example.expected_category}"
        )
    if example.expected_risk_level not in ALLOWED_EVAL_RISK_LEVELS:
        raise ValueError(
            f"Exemplo {example.id} possui expected_risk_level invalido: "
            f"{example.expected_risk_level}"
        )
    if example.expected_action not in ALLOWED_EVAL_ACTIONS:
        raise ValueError(
            f"Exemplo {example.id} possui expected_action invalido: "
            f"{example.expected_action}"
        )
    if not example.expected_policy_rules:
        raise ValueError(
            f"Exemplo {example.id} deve possuir ao menos uma expected_policy_rules."
        )
    invalid_rules = [
        rule for rule in example.expected_policy_rules if rule not in ALLOWED_POLICY_RULES
    ]
    if invalid_rules:
        raise ValueError(
            f"Exemplo {example.id} possui expected_policy_rules invalidas: {invalid_rules}"
        )


def build_initial_state(example: EvaluationExample, available_guidelines: list[dict]) -> dict[str, Any]:
    return {
        "comment_id": example.id,
        "comment_content": example.comment,
        "author_name": "Evaluation Runner",
        "course_name": "Evaluation Dataset",
        "lesson_name": "Synthetic Case",
        "run_id": example.id,
        "available_guidelines": [
            {**guideline, "id": str(guideline["id"])} for guideline in available_guidelines
        ],
        "steps": [],
        "errors": [],
        "metadata": {
            "source": "evaluation",
            "notes": example.notes,
        },
    }


def run_evaluation(dataset_path: Path) -> dict[str, Any]:
    examples = load_dataset(dataset_path)
    available_guidelines = repository.list_guidelines_for_analysis()
    results: list[EvaluationResult] = []

    for example in examples:
        started_at = perf_counter()
        try:
            final_state = moderation_graph.invoke(
                build_initial_state(example, available_guidelines)
            )
            latency_ms = max(0, round((perf_counter() - started_at) * 1000))
            predicted_policy_rules = [
                reference["code"]
                for reference in final_state.get("policy_references", [])
                if isinstance(reference, dict) and reference.get("code")
            ]
            results.append(
                EvaluationResult(
                    example=example,
                    success=True,
                    latency_ms=latency_ms,
                    predicted_action=final_state.get("recommended_action"),
                    predicted_risk_level=final_state.get("risk_level"),
                    predicted_category=final_state.get("category"),
                    predicted_policy_rules=predicted_policy_rules,
                )
            )
        except Exception as error:
            latency_ms = max(0, round((perf_counter() - started_at) * 1000))
            results.append(
                EvaluationResult(
                    example=example,
                    success=False,
                    latency_ms=latency_ms,
                    predicted_action=None,
                    predicted_risk_level=None,
                    predicted_category=None,
                    predicted_policy_rules=[],
                    error_message=str(error),
                )
            )

    return summarize_results(results)


def summarize_results(results: list[EvaluationResult]) -> dict[str, Any]:
    total_examples = len(results)
    successful_results = [result for result in results if result.success]
    failed_results = [result for result in results if not result.success]

    action_matches = sum(
        1
        for result in successful_results
        if result.predicted_action == result.example.expected_action
    )
    risk_matches = sum(
        1
        for result in successful_results
        if result.predicted_risk_level == result.example.expected_risk_level
    )
    category_matches = sum(
        1
        for result in successful_results
        if result.predicted_category == result.example.expected_category
    )
    policy_matches = sum(
        1
        for result in successful_results
        if set(result.predicted_policy_rules).intersection(
            result.example.expected_policy_rules
        )
    )

    successful_count = len(successful_results)
    average_latency_ms = (
        round(sum(result.latency_ms for result in successful_results) / successful_count)
        if successful_count
        else 0
    )

    divergences = [
        result
        for result in successful_results
        if (
            result.predicted_action != result.example.expected_action
            or result.predicted_risk_level != result.example.expected_risk_level
            or result.predicted_category != result.example.expected_category
            or not set(result.predicted_policy_rules).intersection(
                result.example.expected_policy_rules
            )
        )
    ]

    return {
        "total_examples": total_examples,
        "successful_runs": successful_count,
        "failed_runs": len(failed_results),
        "accuracy_action": _percentage(action_matches, successful_count),
        "accuracy_risk_level": _percentage(risk_matches, successful_count),
        "accuracy_category": _percentage(category_matches, successful_count),
        "policy_match_rate": _percentage(policy_matches, successful_count),
        "average_latency_ms": average_latency_ms,
        "divergences": divergences[:20],
        "failures": failed_results[:20],
    }


def _percentage(matches: int, total: int) -> float:
    if total == 0:
        return 0.0
    return round((matches / total) * 100, 2)


def format_report(summary: dict[str, Any]) -> str:
    lines = [
        "ModerationFlow AI Evaluation",
        "----------------------------",
        f"Total examples: {summary['total_examples']}",
        f"Successful runs: {summary['successful_runs']}",
        f"Failed runs: {summary['failed_runs']}",
        "",
        f"Accuracy action: {summary['accuracy_action']:.2f}%",
        f"Accuracy risk level: {summary['accuracy_risk_level']:.2f}%",
        f"Accuracy category: {summary['accuracy_category']:.2f}%",
        f"Policy match rate: {summary['policy_match_rate']:.2f}%",
        f"Average latency: {summary['average_latency_ms']}ms",
    ]

    failures: list[EvaluationResult] = summary["failures"]
    if failures:
        lines.extend(["", "Failures:"])
        for failure in failures:
            lines.append(
                f"- {failure.example.id} failed with error: {failure.error_message}"
            )

    divergences: list[EvaluationResult] = summary["divergences"]
    if divergences:
        lines.extend(["", "Divergences:"])
        for result in divergences:
            lines.append(
                f"- {result.example.id} expected action {result.example.expected_action}, "
                f"got {result.predicted_action}"
            )
            lines.append(
                f"  expected risk {result.example.expected_risk_level}, "
                f"got {result.predicted_risk_level}"
            )
            lines.append(
                f"  expected category {result.example.expected_category}, "
                f"got {result.predicted_category}"
            )
            lines.append(
                f"  expected policy rules {result.example.expected_policy_rules}, "
                f"got {result.predicted_policy_rules}"
            )
            lines.append(f"  comment: {result.example.comment}")

    return "\n".join(lines)
