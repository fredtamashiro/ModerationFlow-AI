# Spec: 001.5 -- Local Dev Environment

## Objective

Validate and normalize the local development environment for ModerationFlow AI before implementing the moderation schema.

This spec ensures that Docker, PostgreSQL, backend, frontend, and local environment variables are coherent and predictable for local development.

## Context

Spec `001-project-cleanup` prepared the project as a clean ModerationFlow AI base.

Spec `002-moderation-schema` defines the next database step, but it should not be implemented until the local environment is stable.

Before creating moderation migrations and seed data, the project must have a consistent local setup for:

- PostgreSQL;
- backend startup;
- frontend-to-backend communication;
- admin bootstrap variables;
- minimal developer instructions.

## Scope

This spec includes:

- reviewing `docker-compose.yml`;
- keeping coherent local services for backend, frontend, and postgres;
- removing Redis from the local stack if it is not required in this phase;
- revising `backend/.env.example`;
- creating or revising `frontend/.env.example` if useful;
- aligning backend defaults with local Docker values;
- aligning frontend API URLs with local backend values;
- adding short local setup instructions to `README.md`;
- validating compile/lint/build commands.

This spec does not include:

- creating the `moderation` schema;
- creating moderation migrations;
- creating moderation seeds;
- implementing LangGraph;
- implementing agents;
- implementing Human-in-the-Loop flows;
- implementing RAG;
- implementing moderation endpoints;
- implementing moderation UI.

## Local Services

The local environment should support:

- `postgres`
- `backend`
- `frontend`

If Redis is still present only as legacy infrastructure and is not required by the current application foundation, remove it from local development or clearly mark it as unnecessary for this phase.

Service naming should reflect ModerationFlow AI where practical, without breaking local startup.

## Environment Variables

Review:

```text
backend/.env.example
frontend/.env.example
```

Preserve or create generic local variables such as:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/moderation_flow
FRONTEND_ORIGINS=http://localhost:3000
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
COOKIE_DOMAIN=
JWT_SECRET_KEY=change-me-local
ADMIN_SEED_EMAIL=admin@example.com
ADMIN_SEED_PASSWORD=admin123
OPENAI_API_KEY=
```

Adjust names to the existing project conventions.

Do not introduce new variables for moderation workflows, LangGraph, RAG, embeddings, or pgvector retrieval in this spec.

## Backend Requirements

Ensure the backend can start with the local variables and Docker environment.

Preserve:

- FastAPI;
- health checks;
- database connection;
- bootstrap flow;
- admin authentication;
- usage logs, if present.

Do not implement:

- moderation schema;
- moderation endpoints;
- LangGraph logic.

## Frontend Requirements

Ensure the frontend points to the local backend.

Expected pattern:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
INTERNAL_API_URL=http://backend:8000
```

Adjust to the current project structure if needed.

Do not create moderation screens in this spec.

## Documentation Requirements

Add or update a minimal local setup section in `README.md` with:

```bash
docker compose up --build
```

and environment copy commands:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

If the Windows shell is different in practice, the README may also show equivalent commands, but keep the instructions short.

## Acceptance Criteria

- `.agents/specs/001-5-local-dev-environment.md` exists.
- `docker-compose.yml` reflects a coherent local stack.
- Backend local environment variables are aligned with Docker.
- Frontend local API URLs are aligned with Docker/backend.
- README contains minimal local startup instructions.
- Backend still compiles.
- Frontend still lints and builds.
- No moderation schema or LangGraph implementation is added.

## Validation Commands

Backend:

```bash
cd backend
py -3 -m compileall app
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

## Expected Final Summary

After implementation, summarize:

- files changed;
- local environment adjustments made;
- whether Redis was removed or preserved and why;
- validation commands run;
- assumptions made;
- recommended next spec.
