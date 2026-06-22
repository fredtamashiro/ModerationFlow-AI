## Spec: 035 -- Dynamic Few-Shot Selection Experiment

## Objetivo

Criar um experimento isolado de selecao dinamica e deterministica de exemplos few-shot para comparar baseline LLM, few-shot estatico e few-shot dinamico.

## Regra principal

Nao alterar:

- baseline heuristico;
- LangGraph principal;
- endpoint `/admin/moderation/comments/{comment_id}/analyze`;
- frontend;
- banco;
- migrations;
- datasets `main`, `holdout`, `blind` e `safety`;
- comportamento atual de `--mode llm`;
- comportamento atual de `--mode few-shot`;
- prompt baseline.

O caminho dinamico deve ser opcional e separado.

## Escopo

Alterar apenas:

- `backend/app/moderation/llm/dynamic_few_shot.py`
- `backend/app/moderation/llm/analyzer.py`
- `backend/app/evaluation/runner.py`
- `backend/scripts/evaluate_moderation.py`
- `docs/evaluation.md`
- `docs/development-runbook.md`
- `.agents/specs/035-dynamic-few-shot-selection-experiment.md`

## Regras de implementacao

- adicionar `--mode dynamic-few-shot`;
- opcionalmente adicionar `--mode compare-all`;
- usar exclusivamente `moderation_feedback_examples.json`;
- selecao deterministica, local e baseada apenas no texto do comentario;
- sem embeddings, RAG, retrieval vetorial ou chamada extra de LLM;
- no maximo 4 exemplos no prompt;
- implementar fallback curto e diverso;
- manter fail-open de LangSmith.

## Validacao

Executar:

```bash
docker compose exec -e LANGSMITH_TRACING=false backend python -m compileall app

docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset blind --mode llm
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset blind --mode few-shot
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset blind --mode dynamic-few-shot
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset blind --mode dynamic-few-shot --runs 3

docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset safety --mode llm
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset safety --mode few-shot
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset safety --mode dynamic-few-shot
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset safety --mode dynamic-few-shot --runs 3
```

Se `compare-all` for implementado:

```bash
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset blind --mode compare-all
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset safety --mode compare-all
```
