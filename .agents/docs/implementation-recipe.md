# Implementation Recipe -- ModerationFlow AI

## How to Work on This Project With AI Agents

This project follows a lightweight spec-driven development approach.

Before implementing any change:

1. Read `AGENTS.md`.
2. Read `docs/development-runbook.md`.
3. Read `.agents/docs/project-context.md`.
4. Read `.agents/docs/code-standards.md`.
5. Read the active spec in `.agents/specs/`.
6. Implement only what the active spec requests.
7. Validate the project.
8. Summarize what changed.

## Implementation Rules

- Do not implement multiple phases at once.
- Do not introduce large architectural changes without a spec.
- Do not remove working infrastructure unless the spec explicitly says so.
- Do not keep SmartDocs-specific behavior unless it is intentionally preserved as reusable infrastructure.
- Do not add new dependencies unless needed and justified.
- Do not implement moderation graph logic during project cleanup.
- Do not implement frontend screens for moderation before the backend foundation exists.

## Recommended Development Flow

### Phase 1 -- Project Cleanup

Goal:

Prepare the cloned SmartDocs base as ModerationFlow AI.

Expected output:

- SmartDocs branding removed.
- PDF/document-specific features removed or isolated.
- Base auth preserved.
- Backend starts.
- Frontend builds.
- README updated.

### Phase 2 -- Database Foundation

Goal:

Create the `moderation` schema and core tables.

Expected output:

- comments;
- guidelines;
- guideline_chunks;
- moderation_runs;
- moderation_steps;
- moderation_decisions;
- feedback_examples.

### Phase 3 -- Seed Data

Goal:

Add community guidelines and sample comments.

Expected output:

- initial moderation rules;
- sample comments with different categories;
- bootstrap or seed script.

### Phase 4 -- LangGraph Workflow

Goal:

Implement the graph with real conditional behavior.

Expected output:

- input_guard;
- intent_router;
- fast paths;
- guideline_retriever;
- risk_analyzer;
- confidence_gate;
- critic_agent;
- decision_builder.

### Phase 5 -- Human Review

Goal:

Implement human moderation decisions.

Expected output:

- pending review list;
- review detail;
- approve/remove/request_edit;
- save moderator feedback.

### Phase 6 -- Evaluation

Goal:

Create a small evaluation dataset and script.

Expected output:

- labeled examples;
- metrics;
- failure analysis.

## Validation Commands

Backend:

```bash
cd backend
python -m compileall app
```

If tests exist:

```bash
pytest
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Docker:

```bash
docker compose up --build
```

## Output Expected From AI Agents

After completing a task, summarize:

- files changed;
- what was removed;
- what was added;
- validation performed;
- known limitations;
- next recommended step.
