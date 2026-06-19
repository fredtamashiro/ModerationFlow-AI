## Spec: 028 -- LLM Safety Regression Set

## Objetivo

Criar um dataset de regressao focado em seguranca para validar casos sensiveis do experimento `llm_risk_analyzer`, sem alterar o baseline heuristico, sem alterar o grafo principal e sem alterar o endpoint `/admin/moderation/comments/{comment_id}/analyze`.

## Regra principal

Nao alterar:

- `backend/app/moderation/graph/nodes.py`;
- `backend/app/moderation/graph/workflow.py`;
- `backend/app/moderation/graph/state.py`;
- frontend;
- banco;
- migrations;
- endpoint `/admin/moderation/comments/{comment_id}/analyze`.

Nesta etapa, preferir criar dataset e runner/documentacao. So alterar prompt do LLM se for claramente necessario e baseado em padrao, nao em frase exata.
