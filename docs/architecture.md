# Arquitetura — ModerationFlow AI

Este documento foi simplificado durante a limpeza da base herdada que originou o ModerationFlow AI.

## Estado atual

- Frontend em Next.js com landing page inicial e login administrativo reaproveitado.
- Backend em FastAPI com rotas base de `health`, autenticacao administrativa e `usage_logs`.
- PostgreSQL como persistencia principal.
- Redis mantido como infraestrutura reutilizavel da base tecnica.

## Pendencia

O detalhamento da arquitetura de moderacao assistida por IA sera refeito nas proximas etapas, com foco em comentarios, diretrizes de comunidade, LangGraph, Human-in-the-Loop e auditoria.

Referencia principal desta fase: `docs/development-runbook.md`.
