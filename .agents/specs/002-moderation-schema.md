# Spec: 002 -- Moderation Schema

## Objective

Create the database foundation for the ModerationFlow AI domain.

This spec introduces the `moderation` schema and the core tables needed to store comments, community guidelines, moderation runs, graph execution steps, human decisions, and feedback examples.

This phase should prepare the backend for future LangGraph and Human-in-the-Loop implementation, but must not implement the graph yet.

## Context

The project was initialized from the SmartDocs AI base and cleaned in spec `001-project-cleanup`.

The next step is to model the core moderation domain before implementing AI workflows.

ModerationFlow AI will analyze online course comments, retrieve relevant community guidelines, recommend moderation actions, require human review, store final decisions, and preserve feedback for evaluation.

The database model must support:

- pending comments;
- community guidelines;
- AI moderation executions;
- per-node execution logs;
- human decisions;
- feedback examples for evaluation and future improvement.

## Scope

This spec includes:

- creating the `moderation` schema;
- creating core moderation tables;
- adding migrations;
- adding database bootstrap support if needed;
- adding seed data for community guidelines;
- adding seed data for sample comments;
- creating minimal backend data access helpers if consistent with the current project structure;
- preserving existing auth, health checks and shared usage logs.

This spec does not include:

- implementing LangGraph;
- implementing agents;
- implementing RAG over guidelines;
- implementing vector embeddings;
- implementing `pgvector` for guideline chunks;
- implementing Human-in-the-Loop UI;
- implementing moderation API endpoints beyond optional basic internal helpers;
- implementing frontend screens;
- deploying to production.

## Database Schema

Create schema:

```sql
CREATE SCHEMA IF NOT EXISTS moderation;
```

## Tables

### 1. `moderation.comments`

Stores comments submitted for moderation.

Suggested columns:

```text
id UUID PRIMARY KEY
author_name VARCHAR(255) NOT NULL
course_name VARCHAR(255)
lesson_name VARCHAR(255)
content TEXT NOT NULL
status VARCHAR(50) NOT NULL
metadata JSONB DEFAULT '{}'::jsonb
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Allowed statuses:

```text
pending
analyzing
waiting_human_review
approved
removed
edit_requested
failed
```

Recommended default status:

```text
pending
```

### 2. `moderation.guidelines`

Stores community moderation guidelines.

Suggested columns:

```text
id UUID PRIMARY KEY
code VARCHAR(50) UNIQUE NOT NULL
title VARCHAR(255) NOT NULL
description TEXT NOT NULL
severity VARCHAR(50) NOT NULL
examples JSONB DEFAULT '[]'::jsonb
metadata JSONB DEFAULT '{}'::jsonb
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Allowed severities:

```text
low
medium
high
critical
```

Initial guideline examples:

```text
R-001 Spam e autopromocao
R-002 Ataques pessoais
R-003 Linguagem ofensiva
R-004 Discriminacao ou discurso de odio
R-005 Conteudo perigoso ou ilegal
R-006 Critica legitima permitida
R-007 Duvidas e pedidos de suporte
R-008 Feedback positivo ou neutro
```

### 3. `moderation.moderation_runs`

Stores each AI moderation workflow execution.

Suggested columns:

```text
id UUID PRIMARY KEY
comment_id UUID NOT NULL REFERENCES moderation.comments(id) ON DELETE CASCADE
status VARCHAR(50) NOT NULL
route VARCHAR(100)
risk_level VARCHAR(50)
category VARCHAR(100)
confidence NUMERIC(5,4)
recommended_action VARCHAR(50)
ai_justification TEXT
critic_applied BOOLEAN NOT NULL DEFAULT FALSE
requires_human_review BOOLEAN NOT NULL DEFAULT TRUE
policy_references JSONB DEFAULT '[]'::jsonb
metadata JSONB DEFAULT '{}'::jsonb
error_message TEXT
started_at TIMESTAMPTZ
finished_at TIMESTAMPTZ
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Allowed statuses:

```text
started
completed
failed
waiting_human_review
```

Expected routes:

```text
spam_fast_path
toxic_fast_path
low_risk_path
ambiguous_deep_review
fallback_human_review
```

Expected risk levels:

```text
low
medium
high
unknown
```

Expected recommended actions:

```text
approve
flag
remove
request_edit
needs_human_review
```

### 4. `moderation.moderation_steps`

Stores execution details for each graph node.

Suggested columns:

```text
id UUID PRIMARY KEY
run_id UUID NOT NULL REFERENCES moderation.moderation_runs(id) ON DELETE CASCADE
node_name VARCHAR(100) NOT NULL
status VARCHAR(50) NOT NULL
duration_ms INTEGER
model VARCHAR(100)
input_tokens INTEGER
output_tokens INTEGER
metadata JSONB DEFAULT '{}'::jsonb
error_message TEXT
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Allowed statuses:

```text
started
completed
failed
skipped
```

Purpose:
This table will support observability of the graph execution.

### 5. `moderation.moderation_decisions`

Stores the final human moderation decision.

Suggested columns:

```text
id UUID PRIMARY KEY
comment_id UUID NOT NULL REFERENCES moderation.comments(id) ON DELETE CASCADE
run_id UUID REFERENCES moderation.moderation_runs(id) ON DELETE SET NULL
ai_recommendation VARCHAR(50)
human_decision VARCHAR(50) NOT NULL
human_category VARCHAR(100)
human_risk_level VARCHAR(50)
moderator_note TEXT
final_content TEXT
was_ai_correct BOOLEAN
metadata JSONB DEFAULT '{}'::jsonb
decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Allowed human decisions:

```text
approve
flag
remove
request_edit
```

Purpose:
The AI recommendation is never final in V1. The human decision is the final source of truth.

### 6. `moderation.feedback_examples`

Stores human feedback examples for evaluation and future improvement.

Suggested columns:

```text
id UUID PRIMARY KEY
comment_text TEXT NOT NULL
ai_decision VARCHAR(50)
human_decision VARCHAR(50) NOT NULL
ai_category VARCHAR(100)
human_category VARCHAR(100)
ai_confidence NUMERIC(5,4)
moderator_note TEXT
was_ai_correct BOOLEAN
metadata JSONB DEFAULT '{}'::jsonb
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Purpose:
This table preserves human corrections so future versions can evaluate or improve AI behavior.

## Indexes

Add useful indexes:

```text
comments.status
comments.created_at
guidelines.code
moderation_runs.comment_id
moderation_runs.status
moderation_runs.created_at
moderation_steps.run_id
moderation_decisions.comment_id
moderation_decisions.run_id
feedback_examples.created_at
```

## Updated At

If the project already has a standard pattern for `updated_at`, reuse it.

Otherwise, add a simple trigger/function for tables that have `updated_at`, or keep the migration simple and let the application update it later.

Do not over-engineer this step.

## Seed Data

Add seed data for community guidelines.

Guidelines should include at least:

1. Spam e autopromocao
2. Ataques pessoais
3. Linguagem ofensiva
4. Discriminacao ou discurso de odio
5. Conteudo perigoso ou ilegal
6. Critica legitima permitida
7. Duvidas e pedidos de suporte
8. Feedback positivo ou neutro

Add sample comments covering different cases:

- clear spam;
- obvious insult;
- legitimate criticism;
- student question;
- positive feedback;
- ambiguous sarcasm;
- potentially discriminatory comment;
- dangerous/illegal content.

Sample comments should be realistic but not excessively offensive.

## Backend Organization

Follow the existing backend structure.

If useful, add or prepare modules such as:

```text
backend/app/moderation/
backend/app/moderation/models.py
backend/app/moderation/schemas.py
backend/app/moderation/repository.py
```

Only add these if they fit the existing project pattern.

Do not create API endpoints unless the current architecture requires a minimal internal check.

## Migration Requirements

Use the existing migration system.

Create a new migration file following the project naming convention.

The migration must be idempotent where practical:

- use `CREATE SCHEMA IF NOT EXISTS`;
- use `CREATE TABLE IF NOT EXISTS`;
- use `CREATE INDEX IF NOT EXISTS`;
- seed with `ON CONFLICT DO NOTHING` where applicable.

## Environment Requirements

No new required environment variables should be added in this spec.

## Architecture Rules

- Keep the schema domain-specific and separated under `moderation`.
- Do not mix moderation tables with SmartDocs legacy tables.
- Do not implement AI workflow logic in this spec.
- Do not implement vector search in this spec.
- Do not implement frontend screens in this spec.
- Preserve existing auth and health checks.
- Preserve `shared.usage_logs` if present.
- The schema must support future Human-in-the-Loop and graph observability.

## Acceptance Criteria

- A new migration creates the `moderation` schema.
- Core moderation tables are created.
- Indexes are created.
- Guidelines seed data is inserted.
- Sample comments seed data is inserted.
- Migration can run more than once without duplicating seed data.
- Backend still starts.
- Existing health checks still work.
- No LangGraph implementation is added.
- No frontend moderation screen is added.
- No pgvector guideline embedding implementation is added yet.

## Validation Commands

Backend:

```bash
cd backend
py -3 -m compileall app
```

If the project uses Python directly instead of `py -3`, use:

```bash
cd backend
python -m compileall app
```

Run migration/bootstrap according to the existing project pattern.

If Docker is available:

```bash
docker compose up --build
```

Frontend should remain unaffected, but if touched:

```bash
cd frontend
npm run lint
npm run build
```

## Expected Final Summary

After implementation, summarize:

- migration files created;
- tables created;
- seed data added;
- validation commands run;
- any assumptions made;
- recommended next spec.
