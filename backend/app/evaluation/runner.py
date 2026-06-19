from __future__ import annotations

import json
from statistics import pstdev
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from time import perf_counter
from typing import Any, Callable

from app.config import get_settings
from app.moderation.graph import moderation_graph
from app.moderation.llm import analyze_comment_with_llm
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


@dataclass
class PredictionOutput:
    predicted_action: str | None
    predicted_risk_level: str | None
    predicted_category: str | None
    predicted_policy_rules: list[str]


def _build_error_analysis(results: list[EvaluationResult]) -> dict[str, Any]:
    successful_results = [result for result in results if result.success]

    category_confusions = Counter(
        (result.example.expected_category, result.predicted_category)
        for result in successful_results
        if result.predicted_category != result.example.expected_category
    )
    action_confusions = Counter(
        (result.example.expected_action, result.predicted_action)
        for result in successful_results
        if result.predicted_action != result.example.expected_action
    )
    risk_confusions = Counter(
        (result.example.expected_risk_level, result.predicted_risk_level)
        for result in successful_results
        if result.predicted_risk_level != result.example.expected_risk_level
    )
    policy_confusions = Counter(
        (
            tuple(result.example.expected_policy_rules),
            tuple(result.predicted_policy_rules),
        )
        for result in successful_results
        if result.example.expected_policy_rules != result.predicted_policy_rules
    )

    category_items = _counter_to_named_pairs(
        category_confusions,
        left_key="expected_category",
        right_key="predicted_category",
    )
    action_items = _counter_to_named_pairs(
        action_confusions,
        left_key="expected_action",
        right_key="predicted_action",
    )
    risk_items = _counter_to_named_pairs(
        risk_confusions,
        left_key="expected_risk",
        right_key="predicted_risk",
    )
    policy_items = _counter_to_policy_pairs(policy_confusions)

    return {
        "category_confusions": category_items,
        "action_confusions": action_items,
        "risk_confusions": risk_items,
        "policy_confusions": policy_items,
        "top_summary": {
            "top_category_mismatches": category_items[:3],
            "top_action_mismatches": action_items[:3],
            "top_risk_mismatches": risk_items[:3],
            "top_policy_mismatches": policy_items[:3],
        },
    }


def _counter_to_named_pairs(
    counter: Counter[tuple[str, str | None]],
    *,
    left_key: str,
    right_key: str,
) -> list[dict[str, Any]]:
    return [
        {
            left_key: left,
            right_key: right if right is not None else "None",
            "count": count,
        }
        for (left, right), count in counter.most_common()
    ]


def _counter_to_policy_pairs(
    counter: Counter[tuple[tuple[str, ...], tuple[str, ...]]],
) -> list[dict[str, Any]]:
    return [
        {
            "expected_policy_rules": list(expected),
            "predicted_policy_rules": list(predicted),
            "count": count,
        }
        for (expected, predicted), count in counter.most_common()
    ]


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


def _predict_with_heuristic(
    example: EvaluationExample,
    available_guidelines: list[dict],
    _: dict[str, Any],
) -> PredictionOutput:
    final_state = moderation_graph.invoke(
        build_initial_state(example, available_guidelines)
    )
    predicted_policy_rules = [
        reference["code"]
        for reference in final_state.get("policy_references", [])
        if isinstance(reference, dict) and reference.get("code")
    ]
    return PredictionOutput(
        predicted_action=final_state.get("recommended_action"),
        predicted_risk_level=final_state.get("risk_level"),
        predicted_category=final_state.get("category"),
        predicted_policy_rules=predicted_policy_rules,
    )


def _predict_with_llm(
    example: EvaluationExample,
    available_guidelines: list[dict],
    evaluation_context: dict[str, Any],
) -> PredictionOutput:
    response = analyze_comment_with_llm(
        example.comment,
        available_guidelines,
        trace_metadata={
            **evaluation_context,
            "comment": example.comment,
            "expected_category": example.expected_category,
            "expected_risk_level": example.expected_risk_level,
            "expected_action": example.expected_action,
            "expected_policy_rules": example.expected_policy_rules,
        },
    )
    return PredictionOutput(
        predicted_action=response.get("recommended_action"),
        predicted_risk_level=response.get("risk_level"),
        predicted_category=response.get("category"),
        predicted_policy_rules=[
            str(rule) for rule in response.get("policy_references", [])
        ],
    )


def run_evaluation(
    dataset_path: Path,
    mode: str = "heuristic",
    runs: int = 1,
) -> dict[str, Any]:
    if runs < 1:
        raise ValueError("runs must be >= 1")
    if mode == "llm":
        _ensure_llm_evaluation_available()
    examples = load_dataset(dataset_path)
    available_guidelines = repository.list_guidelines_for_analysis()
    predictor = _resolve_predictor(mode)
    if runs == 1:
        return _run_prediction_pass(
            examples,
            available_guidelines,
            predictor,
            mode=mode,
            dataset_name=dataset_path.stem,
        )

    run_summaries = [
        _run_prediction_pass(
            examples,
            available_guidelines,
            predictor,
            mode=mode,
            dataset_name=dataset_path.stem,
            run_label=f"run_{index}",
        )
        for index in range(1, runs + 1)
    ]
    return summarize_multi_run_results(run_summaries)


def run_compare_evaluation(dataset_path: Path, runs: int = 1) -> dict[str, Any]:
    if runs != 1:
        raise ValueError("runs > 1 is not supported for compare mode.")
    _ensure_llm_evaluation_available()
    heuristic_summary = run_evaluation(dataset_path, mode="heuristic")
    llm_summary = run_evaluation(dataset_path, mode="llm")
    return {
        "heuristic": heuristic_summary,
        "llm": llm_summary,
        "comparison": {
            "action_accuracy_delta": round(
                llm_summary["accuracy_action"] - heuristic_summary["accuracy_action"],
                2,
            ),
            "risk_level_accuracy_delta": round(
                llm_summary["accuracy_risk_level"]
                - heuristic_summary["accuracy_risk_level"],
                2,
            ),
            "category_accuracy_delta": round(
                llm_summary["accuracy_category"]
                - heuristic_summary["accuracy_category"],
                2,
            ),
            "policy_match_rate_delta": round(
                llm_summary["policy_match_rate"]
                - heuristic_summary["policy_match_rate"],
                2,
            ),
        },
    }


def _resolve_predictor(
    mode: str,
) -> Callable[[EvaluationExample, list[dict], dict[str, Any]], PredictionOutput]:
    if mode == "heuristic":
        return _predict_with_heuristic
    if mode == "llm":
        return _predict_with_llm
    raise ValueError(f"Unsupported evaluation mode: {mode}")


def _ensure_llm_evaluation_available() -> None:
    if not get_settings().openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is required for LLM evaluation mode.")


def _run_prediction_pass(
    examples: list[EvaluationExample],
    available_guidelines: list[dict],
    predictor: Callable[[EvaluationExample, list[dict], dict[str, Any]], PredictionOutput],
    *,
    mode: str,
    dataset_name: str,
    run_label: str | None = None,
) -> dict[str, Any]:
    results: list[EvaluationResult] = []

    for example in examples:
        started_at = perf_counter()
        try:
            prediction = predictor(
                example,
                available_guidelines,
                {
                    "dataset": dataset_name,
                    "mode": mode,
                    "example_id": example.id,
                    "run_label": run_label,
                },
            )
            latency_ms = max(0, round((perf_counter() - started_at) * 1000))
            results.append(
                EvaluationResult(
                    example=example,
                    success=True,
                    latency_ms=latency_ms,
                    predicted_action=prediction.predicted_action,
                    predicted_risk_level=prediction.predicted_risk_level,
                    predicted_category=prediction.predicted_category,
                    predicted_policy_rules=prediction.predicted_policy_rules,
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


def summarize_multi_run_results(run_summaries: list[dict[str, Any]]) -> dict[str, Any]:
    if not run_summaries:
        raise ValueError("At least one run summary is required.")

    metric_names = (
        "accuracy_action",
        "accuracy_risk_level",
        "accuracy_category",
        "policy_match_rate",
        "average_latency_ms",
        "failed_runs",
    )
    aggregate: dict[str, Any] = {}
    for metric_name in metric_names:
        values = [float(summary[metric_name]) for summary in run_summaries]
        aggregate[metric_name] = {
            "mean": round(sum(values) / len(values), 2),
            "stddev": round(pstdev(values), 2),
            "min": round(min(values), 2),
            "max": round(max(values), 2),
        }

    return {
        "runs": run_summaries,
        "aggregate": aggregate,
        "error_analysis_last_run": run_summaries[-1].get("error_analysis", {}),
        "error_analysis_last_run_index": len(run_summaries),
    }


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
        "error_analysis": _build_error_analysis(results),
    }


def _percentage(matches: int, total: int) -> float:
    if total == 0:
        return 0.0
    return round((matches / total) * 100, 2)


def format_report(summary: dict[str, Any]) -> str:
    if "runs" in summary and "aggregate" in summary:
        return format_multi_run_report(summary)

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

    error_analysis = summary.get("error_analysis")
    if error_analysis:
        lines.extend(_format_error_analysis(error_analysis))

    return "\n".join(lines)


def format_multi_run_report(summary: dict[str, Any]) -> str:
    lines = [
        "ModerationFlow AI Evaluation",
        "----------------------------",
        f"Runs executed: {len(summary['runs'])}",
        "",
        "Per-run metrics:",
    ]

    for index, run_summary in enumerate(summary["runs"], start=1):
        lines.extend(
            [
                (
                    f"- run {index}: action={run_summary['accuracy_action']:.2f}% "
                    f"risk={run_summary['accuracy_risk_level']:.2f}% "
                    f"category={run_summary['accuracy_category']:.2f}% "
                    f"policy={run_summary['policy_match_rate']:.2f}% "
                    f"latency={run_summary['average_latency_ms']}ms "
                    f"failed={run_summary['failed_runs']}"
                )
            ]
        )

    aggregate = summary["aggregate"]
    lines.extend(
        [
            "",
            "Aggregate metrics:",
            (
                f"- accuracy_action mean={aggregate['accuracy_action']['mean']:.2f}% "
                f"stddev={aggregate['accuracy_action']['stddev']:.2f} "
                f"min={aggregate['accuracy_action']['min']:.2f}% "
                f"max={aggregate['accuracy_action']['max']:.2f}%"
            ),
            (
                f"- accuracy_risk_level mean={aggregate['accuracy_risk_level']['mean']:.2f}% "
                f"stddev={aggregate['accuracy_risk_level']['stddev']:.2f} "
                f"min={aggregate['accuracy_risk_level']['min']:.2f}% "
                f"max={aggregate['accuracy_risk_level']['max']:.2f}%"
            ),
            (
                f"- accuracy_category mean={aggregate['accuracy_category']['mean']:.2f}% "
                f"stddev={aggregate['accuracy_category']['stddev']:.2f} "
                f"min={aggregate['accuracy_category']['min']:.2f}% "
                f"max={aggregate['accuracy_category']['max']:.2f}%"
            ),
            (
                f"- policy_match_rate mean={aggregate['policy_match_rate']['mean']:.2f}% "
                f"stddev={aggregate['policy_match_rate']['stddev']:.2f} "
                f"min={aggregate['policy_match_rate']['min']:.2f}% "
                f"max={aggregate['policy_match_rate']['max']:.2f}%"
            ),
            (
                f"- average_latency_ms mean={aggregate['average_latency_ms']['mean']:.2f} "
                f"stddev={aggregate['average_latency_ms']['stddev']:.2f} "
                f"min={aggregate['average_latency_ms']['min']:.2f} "
                f"max={aggregate['average_latency_ms']['max']:.2f}"
            ),
            (
                f"- failed_runs mean={aggregate['failed_runs']['mean']:.2f} "
                f"stddev={aggregate['failed_runs']['stddev']:.2f} "
                f"min={aggregate['failed_runs']['min']:.2f} "
                f"max={aggregate['failed_runs']['max']:.2f}"
            ),
        ]
    )

    error_analysis = summary.get("error_analysis_last_run")
    if error_analysis:
        lines.extend(
            [
                "",
                (
                    "Error analysis (last run only): "
                    f"run {summary['error_analysis_last_run_index']}"
                ),
            ]
        )
        lines.extend(_format_error_analysis(error_analysis))
    return "\n".join(lines)


def format_compare_report(compare_summary: dict[str, Any]) -> str:
    heuristic_report = format_report(compare_summary["heuristic"])
    llm_report = format_report(compare_summary["llm"])
    comparison = compare_summary["comparison"]
    lines = [
        "Heuristic results",
        "-----------------",
        *heuristic_report.splitlines()[2:],
        "",
        "LLM results",
        "-----------",
        *llm_report.splitlines()[2:],
        "",
        "Comparison",
        "----------",
        f"action_accuracy_delta: {comparison['action_accuracy_delta']:.2f}%",
        (
            "risk_level_accuracy_delta: "
            f"{comparison['risk_level_accuracy_delta']:.2f}%"
        ),
        f"category_accuracy_delta: {comparison['category_accuracy_delta']:.2f}%",
        f"policy_match_rate_delta: {comparison['policy_match_rate_delta']:.2f}%",
    ]
    return "\n".join(lines)


def _format_error_analysis(error_analysis: dict[str, Any]) -> list[str]:
    lines: list[str] = ["", "Error analysis:"]
    lines.extend(
        _format_named_confusions(
            title="Category confusion",
            items=error_analysis.get("category_confusions", []),
            left_key="expected_category",
            right_key="predicted_category",
        )
    )
    lines.extend(
        _format_named_confusions(
            title="Action confusion",
            items=error_analysis.get("action_confusions", []),
            left_key="expected_action",
            right_key="predicted_action",
        )
    )
    lines.extend(
        _format_named_confusions(
            title="Risk confusion",
            items=error_analysis.get("risk_confusions", []),
            left_key="expected_risk",
            right_key="predicted_risk",
        )
    )
    lines.extend(_format_policy_confusions(error_analysis.get("policy_confusions", [])))
    lines.extend(_format_top_summary(error_analysis.get("top_summary", {})))
    return lines


def _format_named_confusions(
    *,
    title: str,
    items: list[dict[str, Any]],
    left_key: str,
    right_key: str,
) -> list[str]:
    lines = [title + ":"]
    if not items:
        lines.append("- none")
        return lines

    for item in items:
        lines.append(
            f"- {item[left_key]} -> {item[right_key]}: {item['count']}"
        )
    return lines


def _format_policy_confusions(items: list[dict[str, Any]]) -> list[str]:
    lines = ["Policy divergences:"]
    if not items:
        lines.append("- none")
        return lines

    for item in items:
        lines.append(
            f"- expected {item['expected_policy_rules']} -> predicted "
            f"{item['predicted_policy_rules']}: {item['count']}"
        )
    return lines


def _format_top_summary(top_summary: dict[str, Any]) -> list[str]:
    lines = ["Pattern summary:"]
    lines.extend(
        _format_top_named_entries(
            title="Top category mismatches",
            items=top_summary.get("top_category_mismatches", []),
            left_key="expected_category",
            right_key="predicted_category",
        )
    )
    lines.extend(
        _format_top_named_entries(
            title="Top action mismatches",
            items=top_summary.get("top_action_mismatches", []),
            left_key="expected_action",
            right_key="predicted_action",
        )
    )
    lines.extend(
        _format_top_named_entries(
            title="Top risk mismatches",
            items=top_summary.get("top_risk_mismatches", []),
            left_key="expected_risk",
            right_key="predicted_risk",
        )
    )
    lines.extend(
        _format_top_policy_entries(
            title="Top policy mismatches",
            items=top_summary.get("top_policy_mismatches", []),
        )
    )
    return lines


def _format_top_named_entries(
    *,
    title: str,
    items: list[dict[str, Any]],
    left_key: str,
    right_key: str,
) -> list[str]:
    if not items:
        return [f"- {title}: none"]
    return [
        f"- {title}: "
        + "; ".join(
            f"{item[left_key]} -> {item[right_key]} ({item['count']})"
            for item in items
        )
    ]


def _format_top_policy_entries(
    *,
    title: str,
    items: list[dict[str, Any]],
) -> list[str]:
    if not items:
        return [f"- {title}: none"]
    return [
        f"- {title}: "
        + "; ".join(
            f"{item['expected_policy_rules']} -> {item['predicted_policy_rules']} "
            f"({item['count']})"
            for item in items
        )
    ]
