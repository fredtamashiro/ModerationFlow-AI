# Spec: 003 -- Moderation Admin API

## Objective

Create the initial backend API layer for the ModerationFlow AI moderation domain.

This spec adds repository/service/schema/API structures to expose comments and guidelines through protected admin endpoints.

The goal is to make the seeded moderation data accessible to the frontend/admin UI before implementing LangGraph, agents, Human-in-the-Loop, or AI analysis.

## Context

Spec `002-moderation-schema` created the database foundation for moderation:

- `moderation.comments`
- `moderation.guidelines`
- `moderation.moderation_runs`
- `moderation.moderation_steps`
- `moderation.moderation_decisions`
- `moderation.feedback_examples`

The next step is to expose this data through a minimal, well-structured backend layer.

This API will later support the admin moderation dashboard and review screens.

## Scope

This spec includes:

- creating moderation Pydantic schemas;
- creating repository/data access functions;
- creating service layer functions if consistent with the current backend style;
- creating protected admin endpoints for comments and guidelines;
- supporting basic pagination and filtering;
- preserving auth/admin requirements;
- adding safe error handling;
- keeping the implementation read-focused, with only minimal status update if needed.

This spec does not include:

- implementing LangGraph;
- implementing agents;
- implementing AI moderation analysis;
- implementing Human-in-the-Loop decisions;
- implementing RAG over guidelines;
- implementing guideline embeddings;
- implementing frontend screens;
- implementing evaluation scripts;
- implementing production deployment.

## Backend Organization

Follow the existing backend structure.

Suggested structure:

```text
backend/app/moderation/
  __init__.py
  schemas.py
  repository.py
  service.py
  router.py
```

Adjust paths if the existing project has a different convention.

## Pydantic Schemas

Create response schemas for:

### Comment

Fields:

```text
id
author_name
course_name
lesson_name
content
status
metadata
created_at
updated_at
```

### CommentListResponse

Fields:

```text
items
total
limit
offset
```

### Guideline

Fields:

```text
id
code
title
description
severity
examples
metadata
created_at
updated_at
```

### GuidelineListResponse

Fields:

```text
items
total
limit
offset
```

### ModerationRunSummary

Fields:

```text
id
comment_id
status
route
risk_level
category
confidence
recommended_action
critic_applied
requires_human_review
created_at
updated_at
```

### ModerationStep

Fields:

```text
id
run_id
node_name
status
duration_ms
model
input_tokens
output_tokens
metadata
error_message
created_at
```

### ModerationDecision

Fields:

```text
id
comment_id
run_id
ai_recommendation
human_decision
human_category
human_risk_level
moderator_note
final_content
was_ai_correct
decided_at
created_at
```

## Repository Requirements

Create repository functions for:

### Comments

- list comments with pagination;
- filter comments by status;
- get comment by id;
- count comments;
- optionally update comment status if already simple and safe.

### Guidelines

- list guidelines with pagination;
- filter guidelines by severity;
- get guideline by id;
- get guideline by code;
- count guidelines.

### Moderation Runs

- list runs by comment id;
- get latest run for a comment;
- list steps by run id;
- list decisions by comment id.

Do not create complex write operations yet.

## API Endpoints

Create protected admin endpoints.

Suggested prefix:

```text
/admin/moderation
```

Endpoints:

### Comments

```text
GET /admin/moderation/comments
GET /admin/moderation/comments/{comment_id}
```

Query params for list:

```text
status optional
limit default 20, max 100
offset default 0
```

### Guidelines

```text
GET /admin/moderation/guidelines
GET /admin/moderation/guidelines/{guideline_id}
GET /admin/moderation/guidelines/code/{code}
```

Query params for list:

```text
severity optional
limit default 50, max 100
offset default 0
```

### Comment Moderation Details

```text
GET /admin/moderation/comments/{comment_id}/runs
GET /admin/moderation/runs/{run_id}/steps
GET /admin/moderation/comments/{comment_id}/decisions
```

These endpoints can return empty arrays at this stage because LangGraph and HITL are not implemented yet.

## Authentication Requirement

All endpoints under `/admin/moderation/*` must require admin authentication using the existing auth/session mechanism.

Do not create a second authentication system.

Do not expose moderation admin data publicly.

## Error Handling

Return:

- 404 when a comment, guideline or run is not found;
- 400 for invalid query params when applicable;
- 401/403 according to existing auth behavior;
- 500 only for unexpected errors.

Do not leak internal SQL errors to the response body.

## Pagination Rules

For list endpoints:

- `limit` default should be reasonable;
- `limit` must have max value 100;
- `offset` must be >= 0;
- response should include total count.

## Database Access Rules

- Use parameterized queries.
- Do not build SQL with unsafe string concatenation.
- Keep repository functions small and focused.
- Avoid ORM introduction if the current project uses raw SQL.
- Follow existing database utility patterns.

## Architecture Rules

- Keep routes thin.
- Put query logic in repository layer.
- Put orchestration/business rules in service layer if needed.
- Do not implement AI logic here.
- Do not implement graph logic here.
- Do not implement frontend UI here.
- Do not alter existing auth behavior.
- Preserve health checks.

## Acceptance Criteria

- Admin can list moderation comments.
- Admin can filter comments by status.
- Admin can get comment details by id.
- Admin can list guidelines.
- Admin can filter guidelines by severity.
- Admin can get guideline by id.
- Admin can get guideline by code.
- Admin can list moderation runs for a comment.
- Admin can list moderation steps for a run.
- Admin can list decisions for a comment.
- All endpoints require existing admin authentication.
- Backend compiles successfully.
- Existing health checks continue to work.
- No LangGraph implementation is added.
- No frontend screens are added.
- No AI calls are added.

## Validation Commands

Backend:

```bash
cd backend
py -3 -m compileall app
```

If Python is available as `python`:

```bash
cd backend
python -m compileall app
```

Run backend locally or through Docker and validate:

```text
GET /health
GET /health/database
```

If an admin session can be created locally, validate:

```text
GET /admin/moderation/comments
GET /admin/moderation/guidelines
```

Frontend should remain unaffected. If not touched, no frontend build is required.

## Expected Final Summary

After implementation, summarize:

- files created;
- endpoints added;
- repository/service functions added;
- auth protection used;
- validation commands run;
- any assumptions made;
- recommended next spec.
