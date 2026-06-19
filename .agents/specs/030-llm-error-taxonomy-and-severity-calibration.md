## Spec: 030 -- LLM Error Taxonomy and Severity Calibration

## Objetivo

Adicionar analise estruturada de erros ao runner de avaliacao do ModerationFlow AI, para orientar futuras calibracoes do experimento LLM sem perseguir exemplos individuais ou criar overfitting.

## Regra principal

Nao alterar:

- baseline heuristico;
- LangGraph principal;
- endpoint `/admin/moderation/comments/{comment_id}/analyze`;
- frontend;
- banco;
- migrations;
- datasets existentes;
- prompt do LLM.

Alterar apenas, quando necessario:

- `backend/app/evaluation/runner.py`;
- `backend/scripts/evaluate_moderation.py`;
- `docs/evaluation.md`.
