# ModerationFlow AI

Aplicacao full stack de moderacao assistida por IA com LangGraph, roteamento condicional, agente critico, Human-in-the-Loop e auditoria.

Status: Projeto em desenvolvimento.

## Objetivo

O sistema vai analisar comentarios de uma plataforma de cursos online, consultar diretrizes de comunidade, classificar risco, sugerir uma decisao e encaminhar casos para revisao humana.

## Stack inicial

- FastAPI
- Next.js
- PostgreSQL
- LangGraph
- OpenAI
- Docker

## Ambiente local

Copie os arquivos de ambiente:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Suba o ambiente local:

```bash
docker compose up --build
```

## Referencia tecnica

O direcionamento atual do projeto esta documentado em [docs/development-runbook.md](docs/development-runbook.md).

## Moderation strategy

The current moderation flow uses a deterministic heuristic baseline combined with Human-in-the-Loop review.

LLM, few-shot, dynamic few-shot, and guardrail approaches are evaluated as isolated experiments. They are not promoted automatically based on a single dataset result.

The current decision record is documented in [docs/architecture/adr-001-moderation-strategy-decision.md](docs/architecture/adr-001-moderation-strategy-decision.md).

## Portfolio and deployment readiness

The public landing page is available at `/`. The moderation queue and evaluation dashboard are administrative areas and must stay protected by the existing admin authentication flow.

Demo data should be synthetic and seeded. LLM execution and LangSmith observability are optional; the app can start with `LANGSMITH_TRACING=false` and without `LANGSMITH_API_KEY`.

Deployment, demo-mode, environment, privacy, and security notes are documented in [docs/deployment-and-portfolio-readiness.md](docs/deployment-and-portfolio-readiness.md).

## CI/CD

GitHub Actions validates backend and frontend changes on pull requests and pushes to `main`.

Railway is configured to deploy the `main` branch automatically after CI passes.

See [docs/ci-cd.md](docs/ci-cd.md) for setup details.
