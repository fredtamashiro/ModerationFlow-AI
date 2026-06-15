from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ModerationCategory = Literal[
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
]

ModerationRiskLevel = Literal["low", "medium", "high", "unknown"]

ModerationAction = Literal[
    "approve",
    "flag",
    "remove",
    "request_edit",
    "needs_human_review",
]

PolicyRuleCode = Literal[
    "R-001",
    "R-002",
    "R-003",
    "R-004",
    "R-005",
    "R-006",
    "R-007",
    "R-008",
]


class LLMRiskAnalyzerResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category: ModerationCategory
    risk_level: ModerationRiskLevel
    recommended_action: ModerationAction
    confidence: float = Field(ge=0.0, le=1.0)
    policy_references: list[PolicyRuleCode] = Field(min_length=1)
    justification: str = Field(min_length=1)
