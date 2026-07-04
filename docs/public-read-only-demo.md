# Public Read-Only Demo

## Purpose

The public demo lets portfolio visitors inspect ModerationFlow AI without an admin account.

It is intentionally read-only. Visitors can see synthetic moderation cases, AI recommendations, registered human decisions, related rules, and summarized audit steps, but they cannot run analysis, save decisions, edit comments, or access operational admin data.

## Public Routes

```text
/
/demo/moderation
/demo/moderation/comments/[id]
/demo/evaluations
```

Recommended journey:

1. Open `/`.
2. Open `/demo/moderation`.
3. Select a scenario.
4. Open `/demo/moderation/comments/[id]`.
5. Compare the AI recommendation with the final human decision.
6. Open `/demo/evaluations`.

## Demo Scenarios

The public queue uses synthetic examples:

- Crítica ambígua;
- Spam explícito;
- Conteúdo discriminatório.

Each scenario shows the same product principle:

```text
A IA recomenda. O moderador decide.
```

## Security Boundary

The public demo does not call admin moderation endpoints and does not expose write actions.

Administrative moderation remains under:

```text
/admin/moderation
/admin/moderation/comments/[id]
/admin/moderation/evaluations
```

These routes and their backend APIs continue to require authentication.

## Evaluation Snapshot

`/demo/evaluations` reuses the documented evaluation snapshot in read-only mode.

It does not execute the evaluation runner from the browser and does not promote an experimental strategy automatically.
