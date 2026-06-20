## Spec: 034 -- Few-Shot LLM Analyzer Experiment

## Objetivo

Criar um experimento isolado de few-shot prompting para comparar o baseline LLM atual com uma variante guiada por exemplos humanos curados.

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
- prompt baseline existente.

O few-shot deve ser uma estrategia nova, opcional e isolada.

## Escopo

Alterar apenas:

- `backend/app/moderation/llm/prompt.py`
- `backend/app/moderation/llm/analyzer.py`
- `backend/app/evaluation/runner.py`
- `backend/scripts/evaluate_moderation.py`
- `docs/evaluation.md`
- `docs/development-runbook.md`
- `.agents/specs/034-few-shot-llm-analyzer-experiment.md`

Pode criar:

- `backend/app/moderation/llm/few_shot.py`

## Regras de implementacao

- adicionar `--mode few-shot`;
- preservar `heuristic`, `llm` e `compare`;
- permitir `compare-few-shot` sem alterar o comportamento atual de `compare`;
- usar exemplos estaticos e deterministicos vindos de `moderation_feedback_examples.json`;
- selecionar entre 6 e 10 exemplos;
- nao usar retrieval, RAG ou selecao dinamica por similaridade;
- manter o mesmo schema de saida, mesma validacao estrutural, mesma calibragem de policies e mesma observabilidade opcional.

## Validacao

Executar:

```bash
docker compose exec backend python -m compileall app

docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset blind --mode llm
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset blind --mode few-shot
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset blind --mode few-shot --runs 3

docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset safety --mode llm
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset safety --mode few-shot
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset safety --mode few-shot --runs 3
```

Se `compare-few-shot` for implementado:

```bash
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset blind --mode compare-few-shot
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset safety --mode compare-few-shot
```

## Criterios de aceite

- spec criada;
- novo modo `few-shot` disponivel;
- baseline LLM permanece intacto;
- feedback examples sao usados apenas no caminho few-shot;
- nenhum benchmark e usado como exemplo few-shot;
- nenhum dataset de benchmark e alterado;
- `failed_runs = 0`;
- LangSmith continua opcional e fail-open;
- metricas baseline vs few-shot documentadas;
- nenhuma alteracao em frontend, banco, migrations, endpoint ou LangGraph.
