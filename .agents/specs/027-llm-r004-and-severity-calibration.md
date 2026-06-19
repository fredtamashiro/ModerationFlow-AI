## Spec: 027 -- LLM R-004 and Severity Calibration

## Objetivo

Melhorar a calibracao do experimento `llm_risk_analyzer` em casos sensiveis de `R-004`, severidade de insultos diretos e distincao `remove` vs `flag`, sem alterar o baseline heuristico, sem alterar o grafo principal e sem alterar o endpoint `/admin/moderation/comments/{comment_id}/analyze`.

## Regra principal

Nao alterar:

- `backend/app/moderation/graph/nodes.py`;
- `backend/app/moderation/graph/workflow.py`;
- `backend/app/moderation/graph/state.py`;
- datasets;
- frontend;
- banco;
- migrations;
- endpoint `/admin/moderation/comments/{comment_id}/analyze`.

Alterar apenas:

- experimento LLM;
- prompt;
- schema/validacao se necessario;
- pos-validacao leve se necessario;
- documentacao.
