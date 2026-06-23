## Spec: 038 -- Dynamic Few-Shot Guardrail Ablation Experiment

## Objetivo

Criar um experimento de ablacao para medir separadamente o efeito de:

- dynamic few-shot selection;
- selection guidance;
- safety guardrail / R-004 defensive calibration.

## Regra principal

Nao alterar:

- baseline heuristico;
- LangGraph principal;
- endpoint `/admin/moderation/comments/{comment_id}/analyze`;
- frontend;
- banco;
- migrations;
- datasets `main`, `holdout`, `blind`, `safety` e feedback;
- comportamento existente de `llm`, `few-shot`, `dynamic-few-shot` e `compare-all`.

## Escopo

Priorizar alteracoes em:

- `backend/app/moderation/llm/analyzer.py`
- `backend/app/evaluation/runner.py`
- `backend/scripts/evaluate_moderation.py`
- `docs/evaluation.md`
- `docs/development-runbook.md`
- `.agents/specs/038-dynamic-few-shot-guardrail-ablation-experiment.md`

## Regras de implementacao

- adicionar:
  - `dynamic-few-shot-base`
  - `dynamic-few-shot-guided`
  - `dynamic-few-shot-guardrailed`
  - `compare-ablation`
- manter `dynamic-few-shot` apontando para a estrategia completa atual;
- nao criar regras por ID ou frase de benchmark;
- manter guardrail generalizavel para grupo protegido + exclusao, inferiorizacao, discriminacao ou preconceito claro;
- nao usar embeddings, RAG, retrieval vetorial ou chamada extra de LLM;
- nao criar endpoint novo.

## Validacao

Executar:

```bash
docker compose exec -e LANGSMITH_TRACING=false backend python -m compileall app

docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset blind --mode compare-ablation
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset safety --mode compare-ablation

docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset blind --mode dynamic-few-shot-guardrailed --runs 3
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset safety --mode dynamic-few-shot-guardrailed --runs 3
```

## Criterios de aceite

- spec criada;
- modos de ablacao disponiveis;
- estrategias existentes preservadas;
- nenhum benchmark alterado;
- comparacao separa selection guidance e guardrail;
- `failed_runs = 0`;
- metricas documentadas no `blind` e `safety`;
- nenhuma alteracao em heuristico, endpoint, frontend, banco ou LangGraph.
