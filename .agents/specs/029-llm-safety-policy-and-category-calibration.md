## Spec: 029 -- LLM Safety Policy and Category Calibration

## Objetivo

Melhorar o experimento `llm_risk_analyzer` nos padroes gerais encontrados no dataset `safety`, sem alterar o baseline heuristico, sem alterar o grafo principal e sem alterar o endpoint `/admin/moderation/comments/{comment_id}/analyze`.

## Regra principal

Nao alterar:

- `backend/app/moderation/graph/nodes.py`;
- `backend/app/moderation/graph/workflow.py`;
- `backend/app/moderation/graph/state.py`;
- datasets existentes, incluindo `moderation_safety_regression_eval.json`;
- frontend;
- banco;
- migrations;
- endpoint `/admin/moderation/comments/{comment_id}/analyze`.

Alterar apenas:

- `backend/app/moderation/llm/prompt.py`;
- `backend/app/moderation/llm/analyzer.py`;
- `backend/app/moderation/llm/schemas.py`, se necessario;
- `docs/evaluation.md`.
