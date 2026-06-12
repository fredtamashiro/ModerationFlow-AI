from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class Comment(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    author_name: str
    course_name: str | None = None
    lesson_name: str | None = None
    content: str
    status: str
    metadata: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class CommentListResponse(BaseModel):
    items: list[Comment]
    total: int
    limit: int
    offset: int


class Guideline(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    title: str
    description: str
    severity: str
    examples: list[Any]
    metadata: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class GuidelineListResponse(BaseModel):
    items: list[Guideline]
    total: int
    limit: int
    offset: int


class ModerationRunSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    comment_id: UUID
    status: str
    route: str | None = None
    risk_level: str | None = None
    category: str | None = None
    confidence: float | None = None
    recommended_action: str | None = None
    critic_applied: bool
    requires_human_review: bool
    created_at: datetime
    updated_at: datetime


class ModerationStep(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    run_id: UUID
    node_name: str
    status: str
    duration_ms: int | None = None
    model: str | None = None
    input_tokens: int | None = None
    output_tokens: int | None = None
    metadata: dict[str, Any]
    error_message: str | None = None
    created_at: datetime


class ModerationDecision(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    comment_id: UUID
    run_id: UUID | None = None
    ai_recommendation: str | None = None
    human_decision: str
    human_category: str | None = None
    human_risk_level: str | None = None
    moderator_note: str | None = None
    final_content: str | None = None
    was_ai_correct: bool | None = None
    decided_at: datetime
    created_at: datetime
