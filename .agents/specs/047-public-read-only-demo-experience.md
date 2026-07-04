# 047 -- Public Read-Only Demo Experience

## Objective

Create a public, read-only demo journey for portfolio visitors.

The visitor must be able to explore:

- landing page;
- demo moderation queue;
- comment detail;
- AI recommendation;
- registered human decision;
- summarized audit;
- evaluation dashboard.

## Public Routes

Add:

```text
/demo/moderation
/demo/moderation/comments/[id]
/demo/evaluations
```

These routes must work without admin authentication.

## Protected Admin Routes

Keep the existing administrative routes protected:

```text
/admin/moderation
/admin/moderation/comments/[id]
/admin/moderation/evaluations
```

Do not bypass authentication, open admin endpoints, or change backend auth.

## Scope Rules

Do not alter:

- moderation graph behavior;
- heuristic analyzer;
- LLM prompts;
- datasets;
- evaluation runner;
- database migrations;
- human decision rules;
- admin endpoints.

Use existing synthetic demo data through a frontend local layer unless a backend endpoint is absolutely necessary.

## UX Requirements

- Public demo pages must show a "Demonstração somente leitura" badge.
- Public demo buttons must say "Visualizar decisão", not "Revisar comentário".
- The comment detail hierarchy must be:
  1. original comment;
  2. AI recommendation;
  3. final human decision;
  4. summarized audit.
- Audit details should be secondary or collapsible.
- Public scenarios must include:
  - Crítica ambígua;
  - Spam explícito;
  - Conteúdo discriminatório.
- Public navigation should show:
  - Início;
  - Demonstração;
  - Avaliações.

## Documentation

Add:

```text
docs/public-read-only-demo.md
```

Update:

```text
docs/portfolio-demo.md
```

The documented public journey should be:

```text
/ -> /demo/moderation -> /demo/moderation/comments/[id] -> /demo/evaluations
```

## Validation

Run:

```bash
docker compose up -d
docker compose exec backend python -m compileall app
docker compose exec frontend npm run lint
docker compose exec -e NODE_ENV=production frontend npm run build
```

Manual checks:

- `/`, `/demo/moderation`, `/demo/moderation/comments/[id]`, and `/demo/evaluations` work without login.
- `/admin/moderation` and `/admin/moderation/evaluations` remain protected.
- unauthenticated write/analyze actions return `401` or `403`.
