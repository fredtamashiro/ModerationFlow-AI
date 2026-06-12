# AGENTS.md -- ModerationFlow AI

## Project Overview

ModerationFlow AI is a full stack AI-assisted moderation system for online course comments.

The project uses AI agents and workflow orchestration to analyze user comments, retrieve relevant community guidelines, classify moderation risk, recommend actions, involve a human moderator, and store feedback for evaluation and continuous improvement.

This project is intentionally designed to avoid shallow "AI demo" implementation. The goal is to build a technically defensible system with real conditional routing, Human-in-the-Loop, structured outputs, auditability, evaluation, and failure handling.

## Main Technical Goals

- Build a real LangGraph workflow with conditional routing.
- Use structured outputs validated with Pydantic.
- Retrieve community guidelines to ground AI recommendations.
- Add a critic agent for ambiguous or low-confidence cases.
- Require human review before final moderation decisions.
- Store human feedback for evaluation and future improvement.
- Log graph execution steps for observability.
- Keep the system maintainable, modular, and production-oriented.

## Stack

- Backend: FastAPI
- Frontend: Next.js
- Database: PostgreSQL
- AI workflow: LangGraph
- LLM provider: OpenAI
- Validation: Pydantic
- Infrastructure: Docker
- Documentation: Markdown

## Important Architecture Rules

1. Do not create fake multi-agent workflows.
   - If a step is purely sequential and deterministic, it can be a function or service.
   - Use agents only when reasoning, decision-making, critique, or routing is required.

2. LangGraph must be justified by real graph behavior:
   - conditional routing;
   - confidence gates;
   - fallback paths;
   - human review interrupts;
   - optional reanalysis loops.

3. The AI must not make final moderation decisions in V1.
   - All AI recommendations must go through human review.

4. Human feedback is a first-class system output.
   - Store whether the human agreed or disagreed with the AI.
   - Store moderator notes.
   - Preserve feedback for future evaluation.

5. All LLM outputs must be structured and validated.
   - Use Pydantic models.
   - Provide safe fallbacks when validation fails.

6. On failure, escalate to human review.
   - Never auto-approve when the system is uncertain or broken.

7. Keep the implementation scoped.
   - Follow the active spec in `.agents/specs/`.
   - Do not implement features outside the current spec.

## Files Agents Must Read Before Changes

Before implementing any task, agents should read:

1. `AGENTS.md`
2. `docs/development-runbook.md`
3. `.agents/docs/project-context.md`
4. `.agents/docs/code-standards.md`
5. `.agents/docs/implementation-recipe.md`
6. The active spec in `.agents/specs/`

## Current Active Spec

The first implementation spec is:

```text
.agents/specs/001-project-cleanup.md
```

## Validation Expectations

When changing code, always consider:

- backend starts successfully;
- frontend builds successfully;
- no references to SmartDocs remain in user-facing areas;
- no PDF-specific functionality remains unless intentionally preserved for reuse;
- authentication and base infrastructure remain intact;
- changes are scoped to the active spec.

## Commit Style

Use clear commit messages, for example:

```text
chore: prepare ModerationFlow AI base
docs: add agent specification structure
feat: add moderation database schema
```
