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
