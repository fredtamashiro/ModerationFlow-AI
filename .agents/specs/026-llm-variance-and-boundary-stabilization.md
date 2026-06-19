## Spec: 026 -- LLM Variance and Boundary Stabilization

## Objetivo

Reduzir a variancia do experimento `llm_risk_analyzer` e estabilizar categorias proximas, sem alterar o baseline heuristico, sem alterar o grafo principal e sem alterar o endpoint `/admin/moderation/comments/{comment_id}/analyze`.

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
- runner, se necessario para medir variancia;
- documentacao.

## Escopo

Esta etapa inclui:

- reduzir variancia do LLM quando possivel;
- reforcar regras de decisao para casos que oscilam;
- melhorar fronteira `personal_attack` vs `offensive_language`;
- melhorar falso negativo ou instabilidade em `hate_or_discrimination` / `R-004`;
- calibrar spam sutil que ainda sai agressivo demais;
- adicionar opcao no runner para executar multiplas rodadas LLM no mesmo dataset e reportar media e desvio;
- atualizar `docs/evaluation.md` com antes/depois;
- manter LangSmith funcionando como observabilidade opcional.
