# Spec: 001 -- Project Cleanup

## Objective

Prepare the cloned SmartDocs AI base as a clean ModerationFlow AI project.

This task removes SmartDocs-specific branding and PDF/document features while preserving reusable infrastructure such as FastAPI, Next.js, PostgreSQL, Docker, authentication, layout patterns, environment configuration, and documentation structure.

## Context

The project was initialized from SmartDocs AI to save time.

SmartDocs AI was focused on PDF upload, document ingestion, RAG over PDFs, document chat, pgvector document chunks, and answer caching.

ModerationFlow AI is focused on AI-assisted moderation of online course comments using LangGraph, conditional routing, guideline retrieval, critic agent, Human-in-the-Loop, audit logs, and evaluation.

Before implementing moderation features, the project must stop looking and behaving like SmartDocs.

## Scope

This spec includes:

- renaming project identity to ModerationFlow AI;
- updating README;
- updating existing docs where necessary;
- removing user-facing SmartDocs/PDF/document references;
- removing or isolating backend modules specific to PDF/document chat;
- removing or replacing frontend pages specific to document chat;
- preserving admin auth and base infrastructure;
- preserving database connectivity and health checks;
- preserving Docker setup.

This spec does not include:

- creating moderation database schema;
- implementing LangGraph;
- implementing agents;
- implementing HITL;
- implementing RAG over guidelines;
- implementing evaluation;
- deploying to production.

## Backend Cleanup Requirements

Remove or isolate code related to:

- PDF upload;
- Smart Ingest;
- document processing;
- document chunks;
- document embeddings;
- document registry;
- chat with documents;
- document answer cache;
- suggested questions for documents;
- PDF source references;
- document themes if they are specific to SmartDocs.

Preserve:

- FastAPI app initialization;
- health endpoints;
- database connection;
- migrations structure;
- bootstrap structure;
- admin authentication if present;
- cookie settings if present;
- CORS settings;
- generic usage logs if present;
- Dockerfile;
- requirements.txt.

After cleanup, the backend should still start.

## Frontend Cleanup Requirements

Remove or replace UI related to:

- SmartDocs branding;
- PDF upload;
- document workspace;
- document selector;
- chat with documents;
- answer sources;
- local history per document;
- SmartDocs-specific cards and copy.

Preserve:

- Next.js structure;
- layout base;
- theme tokens;
- reusable UI components;
- API service structure;
- admin login if present;
- route protection if present.

Create a simple placeholder home page for ModerationFlow AI.

The home page should mention:

- AI-assisted moderation;
- LangGraph;
- Human-in-the-Loop;
- auditability;
- community guidelines;
- project in development.

Do not claim that moderation features are complete yet.

## README Requirements

Update `README.md` with:

- project name: ModerationFlow AI;
- short description;
- project status: in development;
- initial stack;
- link to `docs/development-runbook.md`;
- short explanation that the project is being prepared from a reusable full stack base.

Do not document features that are not implemented yet as if they were complete.

## Documentation Requirements

Review files in `docs/`.

Preserve:

- `docs/development-runbook.md`

Update or simplify:

- `docs/architecture.md`
- `docs/deploy-railway.md`
- `docs/pre-deploy-checklist.md`
- `docs/railway-deploy-checklist.md`
- `docs/railway-services.md`

If a document is still too specific to SmartDocs, add a note at the top:

```md
> TODO: Review this document for ModerationFlow AI. It was copied from the SmartDocs AI base.
```

## Environment Requirements

Update `.env.example`.

Remove variables that are clearly specific to PDFs, document ingestion, SmartDocs cache, or document chat.

Preserve generic variables such as:

- DATABASE_URL;
- OPENAI_API_KEY;
- admin/auth variables;
- JWT variables;
- cookie variables;
- CORS/frontend origins.

## Acceptance Criteria

- `AGENTS.md` exists.
- `.agents/` structure exists.
- README references ModerationFlow AI.
- User-facing SmartDocs references are removed.
- User-facing PDF/document chat features are removed or replaced.
- Backend health endpoint still works.
- Frontend build succeeds.
- Admin auth is preserved if it existed.
- No moderation graph implementation is added yet.

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

Search for old references:

```bash
grep -R "SmartDocs\\|smartdocs\\|PDF\\|pdf\\|document chat\\|Smart Ingest" .
```

Some references may remain in migration names, comments, or TODO notes, but user-facing references and active feature code should be removed or clearly marked for review.

## Expected Final Summary

After implementation, summarize:

- files changed;
- SmartDocs-specific items removed;
- reusable infrastructure preserved;
- validation commands run;
- old references still remaining and why;
- recommended next spec.
