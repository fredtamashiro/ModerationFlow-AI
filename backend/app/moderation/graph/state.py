import operator
from typing import Annotated, Any, Literal, TypedDict


ModerationRoute = Literal[
    "spam_fast_path",
    "toxic_fast_path",
    "low_risk_path",
    "ambiguous_deep_review",
    "fallback_human_review",
]


class GraphStep(TypedDict):
    node_name: str
    status: str
    duration_ms: int
    metadata: dict[str, Any]
    error_message: str | None


class ModerationGraphState(TypedDict, total=False):
    comment_id: str
    comment_content: str
    author_name: str
    course_name: str | None
    lesson_name: str | None
    input_valid: bool
    input_guard_reason: str
    route: ModerationRoute
    route_reason: str
    route_confidence: float
    risk_level: str
    category: str
    confidence: float
    recommended_action: str
    ai_justification: str
    critic_applied: bool
    requires_human_review: bool
    policy_references: list[str]
    run_id: str
    steps: Annotated[list[GraphStep], operator.add]
    errors: Annotated[list[str], operator.add]
    metadata: dict[str, Any]
