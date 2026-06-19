## Spec: 031 -- LLM Spam Severity and Target Boundary Calibration

## Objetivo

Calibrar o experimento `llm_risk_analyzer` usando os padroes gerais revelados pela taxonomia de erros, sem alterar o baseline heuristico, LangGraph principal, endpoint `/analyze`, frontend, banco, migrations ou datasets.

## Regra principal

Nao alterar:

- `backend/app/moderation/graph/nodes.py`;
- `backend/app/moderation/graph/workflow.py`;
- `backend/app/moderation/graph/state.py`;
- datasets existentes;
- frontend;
- banco;
- migrations;
- endpoint `/admin/moderation/comments/{comment_id}/analyze`;
- runner de avaliacao, exceto se houver bug impeditivo.

Alterar apenas:

- `backend/app/moderation/llm/prompt.py`;
- `backend/app/moderation/llm/analyzer.py`, se necessario;
- `docs/evaluation.md`.
