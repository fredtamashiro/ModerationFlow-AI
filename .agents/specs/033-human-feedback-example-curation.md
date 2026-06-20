## Spec: 033 -- Human Feedback Example Curation

## Objetivo

Criar uma base versionada e validada de exemplos de feedback humano para uso futuro em experimentos few-shot e recuperacao de exemplos corrigidos.

## Regra principal

Nao alterar:

- baseline heuristico;
- LangGraph principal;
- endpoint `/admin/moderation/comments/{comment_id}/analyze`;
- prompt atual do LLM;
- analyzer atual;
- frontend;
- banco;
- migrations;
- datasets `main`, `holdout`, `blind` e `safety`;
- comportamento atual do runner.

Alterar apenas dataset, validacao e documentacao.

## Escopo

Criar:

- `backend/app/evaluation/datasets/moderation_feedback_examples.json`;
- `backend/app/evaluation/feedback_examples.py`;
- documentacao da etapa em `docs/evaluation.md`;
- comando de validacao no `docs/development-runbook.md`.

## Regras de implementacao

- manter o dataset de feedback separado dos datasets de benchmark;
- nao adicionar `--mode few-shot` nesta etapa;
- nao usar o dataset novo para melhorar metricas atuais;
- validar schema, IDs, valores permitidos e compatibilidade de policies;
- impedir duplicidade literal de `comment` com `main`, `holdout`, `blind` e `safety`.

## Validacao

Executar:

```bash
docker compose exec backend python -m compileall app
docker compose exec backend python -m app.evaluation.feedback_examples
```

## Criterios de aceite

- spec criada;
- dataset separado de feedback criado;
- entre 20 e 30 exemplos representativos;
- nenhuma alteracao em prompt, analyzer, heuristico ou LangGraph;
- nenhuma alteracao nos datasets de avaliacao;
- validacao de schema e duplicidade implementada;
- validacao contra duplicidade literal com datasets de avaliacao implementada;
- documentacao atualizada;
- nenhuma migration criada;
- nenhum frontend alterado.
