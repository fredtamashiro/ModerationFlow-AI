## Spec: 032 -- LangSmith Fail-Open Resilience

## Objetivo

Garantir que LangSmith seja observabilidade opcional e best-effort.

## Regra principal

Nao alterar:

- prompt do LLM;
- heuristico;
- LangGraph principal;
- endpoint `/admin/moderation/comments/{comment_id}/analyze`;
- datasets;
- frontend;
- banco;
- migrations;
- metricas de avaliacao.

Alterar apenas a camada de observabilidade e documentacao.
