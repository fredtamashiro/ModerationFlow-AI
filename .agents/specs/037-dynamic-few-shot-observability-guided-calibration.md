## Spec: 037 -- Dynamic Few-Shot Observability-Guided Calibration

## Objetivo

Calibrar o experimento `dynamic-few-shot` usando os padroes gerais observados na etapa 036, sem alterar o fluxo principal de moderacao.

## Regra principal

Nao alterar:

- baseline heuristico;
- LangGraph principal;
- endpoint `/admin/moderation/comments/{comment_id}/analyze`;
- frontend;
- banco;
- migrations;
- datasets `main`, `holdout`, `blind` e `safety`;
- dataset de feedback humano;
- runner de avaliacao, exceto correcao impeditiva;
- comportamento de `llm`, `few-shot` e `compare-all`.

## Escopo

Priorizar alteracoes apenas em:

- `backend/app/moderation/llm/dynamic_few_shot.py`
- `backend/app/moderation/llm/prompt.py`
- `backend/app/moderation/llm/analyzer.py`
- `docs/evaluation.md`
- `.agents/specs/037-dynamic-few-shot-observability-guided-calibration.md`

## Regras de implementacao

- manter no maximo 4 exemplos no prompt dinamico;
- nao criar regras hardcoded por ID de benchmark, comentario literal de benchmark ou desvio isolado;
- usar padroes gerais da etapa 036 para calibrar:
  - `explicit_spam`
  - `hate_or_discrimination`
  - fronteira `offensive_language` vs `personal_attack`
- manter selecao local, deterministica e sem chamada extra de LLM.

## Validacao

Executar:

```bash
docker compose exec -e LANGSMITH_TRACING=false backend python -m compileall app

docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset blind --mode dynamic-few-shot
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset blind --mode dynamic-few-shot --runs 3

docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset safety --mode dynamic-few-shot
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset safety --mode dynamic-few-shot --runs 3

docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset blind --mode compare-all
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset safety --mode compare-all
```

## Criterios de aceite

- spec criada;
- nenhuma alteracao no fluxo principal;
- nenhum benchmark alterado;
- selecao dinamica continua com ate quatro exemplos;
- `failed_runs = 0`;
- analise da etapa 036 continua disponivel;
- metricas antes e depois documentadas;
- trade-offs registrados com clareza.
