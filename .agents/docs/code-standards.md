# Code Standards -- ModerationFlow AI

## General Principles

- Prefer simple, explicit code.
- Keep modules small and focused.
- Avoid hidden side effects.
- Avoid large files with mixed responsibilities.
- Prefer clear naming over clever abstractions.
- Do not implement features outside the active spec.

## Backend Standards

- Use FastAPI for API routes.
- Use Pydantic for request, response, and LLM output validation.
- Keep API routes thin.
- Place business logic in services.
- Place LangGraph workflow logic in graph-related modules.
- Log important workflow steps.
- Validate all external inputs.
- Never trust LLM output without validation.

## Suggested Backend Organization

```text
backend/app/
  api/
  auth/
  database/
  moderation/
  graphs/
  services/
  schemas/
  evaluation/
```

## LLM Standards

- Use structured outputs whenever possible.
- Validate outputs with Pydantic.
- Keep prompts versioned in code or markdown where appropriate.
- Do not expose secrets in logs.
- Do not log sensitive user data unnecessarily.
- Add safe fallbacks for invalid outputs.

## LangGraph Standards

- Use LangGraph only where graph behavior is justified.
- Conditional routing must be real, not cosmetic.
- Nodes should have clear responsibilities.
- State should be explicit and typed.
- Graph steps should be auditable.
- Low-confidence or failed analysis must route to human review.

## Frontend Standards

- Use reusable components.
- Keep pages focused.
- Avoid mixing API logic directly inside UI components when a service layer exists.
- Preserve the design system where possible.
- Remove SmartDocs-specific text and flows.
- Do not create UI for features that do not exist yet unless clearly marked as placeholder.
- Modals and overlays should close when the user clicks outside the modal content, unless the spec explicitly requires a blocking modal.
- Clickable buttons, icons, and custom interactive elements should provide clear pointer feedback with `cursor: pointer` when applicable.
- Clickable icons should prefer hover feedback aligned with the project palette, with `hover:text-[var(--accent-secondary)]` as the default choice unless another state color is more appropriate.

## Database Standards

- Use migrations for schema changes.
- Prefer schemas to separate domains:
  - `moderation`
  - `shared`
- Avoid mixing SmartDocs tables with ModerationFlow tables.
- Store audit information for moderation runs and decisions.

## Documentation Standards

- Keep README focused on what exists now.
- Use `docs/development-runbook.md` for long-term technical vision.
- Use `.agents/specs/` for implementation specs.
- Each spec should include:
  - objective;
  - scope;
  - files likely affected;
  - implementation rules;
  - acceptance criteria;
  - validation commands.

## Safety Rules

- The AI must not make final moderation decisions in V1.
- Human review is mandatory.
- If the system fails, route to human review.
- If confidence is low, route to critic or human review.
- Never auto-approve on error.
