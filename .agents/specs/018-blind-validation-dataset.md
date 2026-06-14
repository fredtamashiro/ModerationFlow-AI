## Spec: 018 -- Blind Validation Dataset

## Objetivo

Criar um terceiro dataset de avaliacao, chamado blind validation dataset, para medir generalizacao apos o retuning orientado por holdout.

## Contexto

A etapa 017 melhorou muito o desempenho:

Dataset principal:

```text
accuracy_action: 100.00%
accuracy_risk_level: 100.00%
accuracy_category: 100.00%
policy_match_rate: 100.00%
```

Holdout:

```text
accuracy_action: 100.00%
accuracy_risk_level: 100.00%
accuracy_category: 94.29%
policy_match_rate: 100.00%
```

Esse resultado e excelente, mas tambem aumenta risco de overfitting heuristico. Esta etapa deve criar um novo dataset separado para validacao cega.

## Diferenca entre main, holdout e blind

- `main`: dataset principal usado no ciclo base de avaliacao;
- `holdout`: dataset separado criado para medir generalizacao apos tuning;
- `blind`: novo dataset adicional, independente de `main` e `holdout`, usado como nova prova de validacao cega.

## Risco de overfitting

Quanto mais o baseline se ajusta ao `main` e ao `holdout`, maior o risco de inflar metrica sem provar generalizacao real. O `blind` existe para reduzir esse risco.

## Escopo

Esta etapa inclui:

- criar novo dataset `moderation_blind_eval.json`;
- adicionar suporte no runner para `--dataset blind`;
- rodar avaliacao no dataset principal, holdout e blind;
- documentar metricas em `docs/evaluation.md`;
- manter avaliacao em memoria.

## Fora de escopo

- retuning;
- alteracao de heuristicas;
- LLM;
- embeddings;
- `pgvector`;
- frontend;
- backend API;
- banco;
- migrations.

## Formato do dataset

Criar:

```text
backend/app/evaluation/datasets/moderation_blind_eval.json
```

Manter o formato:

```json
{
  "id": "blind-001",
  "comment": "O conteudo ajudou, mas achei que faltou aprofundar alguns pontos.",
  "expected_category": "legitimate_criticism",
  "expected_risk_level": "low",
  "expected_action": "approve",
  "expected_policy_rules": ["R-006"],
  "notes": "Elogio com critica leve."
}
```

## Alteracoes no runner

Manter funcionando:

```bash
python scripts/evaluate_moderation.py
python scripts/evaluate_moderation.py --dataset holdout
python scripts/evaluate_moderation.py --dataset-path app/evaluation/datasets/moderation_holdout_eval.json
```

Adicionar:

```bash
python scripts/evaluate_moderation.py --dataset blind
```

## Criterios de aceite

- spec criada;
- blind dataset criado com pelo menos 30 exemplos;
- runner aceita `--dataset blind`;
- dataset principal continua funcionando;
- holdout continua funcionando;
- avaliacao continua em memoria;
- metricas do blind sao documentadas;
- divergencias do blind sao exibidas;
- nenhuma heuristica e alterada;
- nenhum frontend e alterado;
- nenhum endpoint e alterado;
- nenhuma migration e criada;
- nenhum LLM e adicionado;
- `failed_runs = 0`.

## Validacao

```bash
docker compose exec backend python -m compileall app
docker compose exec backend python scripts/evaluate_moderation.py
docker compose exec backend python scripts/evaluate_moderation.py --dataset holdout
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind
```

## Documentacao das metricas

Atualizar:

```text
docs/evaluation.md
```

Adicionar secao da etapa 018 com:

- objetivo;
- datasets;
- metricas no dataset principal;
- metricas no holdout;
- metricas no blind validation;
- observacoes sobre divergencias e limitacoes.
