from __future__ import annotations

from app.evaluation.feedback_examples import FeedbackExample, load_feedback_examples


SELECTED_FEW_SHOT_EXAMPLE_IDS = (
    "feedback-003",
    "feedback-004",
    "feedback-006",
    "feedback-008",
    "feedback-010",
    "feedback-011",
    "feedback-012",
    "feedback-014",
    "feedback-019",
)


def load_selected_few_shot_examples() -> list[FeedbackExample]:
    examples_by_id = {
        example.id: example for example in load_feedback_examples()
    }
    selected_examples: list[FeedbackExample] = []

    for example_id in SELECTED_FEW_SHOT_EXAMPLE_IDS:
        example = examples_by_id.get(example_id)
        if example is None:
            raise ValueError(
                f"Few-shot example id nao encontrado no dataset curado: {example_id}"
            )
        selected_examples.append(example)

    return selected_examples
