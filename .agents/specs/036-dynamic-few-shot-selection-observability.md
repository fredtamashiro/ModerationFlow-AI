## Spec: 036 -- Dynamic Few-Shot Selection Observability

## Objetivo

Adicionar observabilidade estruturada ao experimento `dynamic-few-shot` para tornar auditavel:

- quais tags de selecao foram acionadas;
- quais exemplos curados foram escolhidos;
- quando houve fallback;
- quais tags concentram mais acertos e erros;
- como o modo dinamico se comporta sem alterar sua logica.

## Regra principal

Nao alterar:

- baseline heuristico;
- LangGraph principal;
- endpoint `/admin/moderation/comments/{comment_id}/analyze`;
- frontend;
- banco;
- migrations;
- datasets de benchmark;
- dataset de feedback humano;
- `prompt.py`;
- regras de selecao em `dynamic_few_shot.py`;
- logica de analise do LLM.

Esta etapa mede e exibe sinais da selecao dinamica. Nao recalibra classificacao.

## Escopo

Alterar prioritariamente:

- `backend/app/evaluation/runner.py`
- `backend/scripts/evaluate_moderation.py`
- `docs/evaluation.md`
- `docs/development-runbook.md`
- `.agents/specs/036-dynamic-few-shot-selection-observability.md`

## Regras de implementacao

- registrar em memoria, por exemplo avaliado em `dynamic-few-shot`:
  - `selection_tags`
  - `selected_feedback_example_ids`
  - `selection_fallback_used`
  - `few_shot_examples_count`
- nao persistir nada no banco;
- nao alterar saida publica do endpoint principal;
- mostrar a analise adicional apenas para `dynamic-few-shot`;
- preservar `compare-all` e anexar a analise apenas ao bloco dinamico;
- em `--runs > 1`, manter metricas agregadas e mostrar a analise de selecao apenas da ultima rodada.

## Validacao

Executar:

```bash
docker compose exec -e LANGSMITH_TRACING=false backend python -m compileall app

docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset blind --mode dynamic-few-shot
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset blind --mode dynamic-few-shot --runs 3

docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset safety --mode dynamic-few-shot
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset safety --mode dynamic-few-shot --runs 3

docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset blind --mode compare-all
```

## Criterios de aceite

- spec criada;
- nenhuma alteracao em prompt, selecao dinamica ou datasets;
- terminal mostra analise de tags, exemplos selecionados e fallback;
- terminal mostra metricas agrupadas por tag;
- `compare-all` continua funcionando;
- analise aparece apenas para `dynamic-few-shot`;
- `--runs` continua funcionando;
- `failed_runs = 0`;
- nenhuma migration, frontend, endpoint ou alteracao no LangGraph.
