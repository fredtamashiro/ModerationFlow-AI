## Spec: 016 -- Holdout Evaluation Dataset

## Objetivo

Criar um dataset adicional de avaliacao separado, chamado holdout dataset, para validar generalizacao do baseline heuristico sem recalibrar diretamente sobre os mesmos exemplos usados no tuning.

## Contexto

A etapa 015 alcancou 100% no dataset endurecido atual:

```text
total_examples: 75
successful_runs: 75
failed_runs: 0
accuracy_action: 100.00%
accuracy_risk_level: 100.00%
accuracy_category: 100.00%
policy_match_rate: 100.00%
average_latency_ms: 5ms
```

Esse resultado e positivo, mas aumenta risco de overfitting heuristico. O holdout dataset deve funcionar como uma nova prova: exemplos diferentes, mesma estrutura, sem alterar heuristicas nesta etapa.

## Risco de overfitting

Quando o mesmo conjunto de exemplos e usado para hardening e retuning, as metricas podem inflar artificialmente. O holdout serve para medir o comportamento do baseline em comentarios nao usados diretamente durante o ajuste.

## Conceito de holdout dataset

O holdout dataset e um segundo conjunto rotulado, separado do dataset principal, usado apenas para validacao de generalizacao. Ele nao deve ser usado como alvo imediato de tuning nesta etapa.

## Escopo

Esta etapa inclui:

- criar um segundo dataset JSON de avaliacao;
- adicionar suporte no runner para escolher qual dataset executar;
- rodar avaliacao no dataset principal e no holdout;
- documentar metricas do holdout em `docs/evaluation.md`;
- manter avaliacao em memoria;
- nao alterar heuristicas.

## Fora de escopo

- ajustar regras do grafo;
- alterar `nodes.py` para subir metrica;
- adicionar LLM;
- adicionar embeddings;
- adicionar `pgvector`;
- alterar frontend;
- alterar banco;
- criar migrations;
- alterar endpoints.

## Formato do dataset

Criar:

```text
backend/app/evaluation/datasets/moderation_holdout_eval.json
```

Manter o mesmo formato do dataset principal:

```json
{
  "id": "holdout-001",
  "comment": "Achei o conteudo raso, mas deu para acompanhar.",
  "expected_category": "legitimate_criticism",
  "expected_risk_level": "low",
  "expected_action": "approve",
  "expected_policy_rules": ["R-006"],
  "notes": "Critica negativa leve, sem ofensa."
}
```

## Alteracoes no runner

Manter compatibilidade com:

```bash
python scripts/evaluate_moderation.py
```

Adicionar suporte para:

```bash
python scripts/evaluate_moderation.py --dataset holdout
python scripts/evaluate_moderation.py --dataset-path app/evaluation/datasets/moderation_holdout_eval.json
```

Se `--dataset-path` for usado, validar se o arquivo existe e falhar com mensagem clara.

## Criterios de aceite

- spec criada;
- holdout dataset criado com pelo menos 30 exemplos;
- dataset principal continua funcionando;
- runner aceita `--dataset holdout`;
- avaliacao continua em memoria;
- metricas do holdout sao impressas;
- divergencias do holdout sao impressas;
- `docs/evaluation.md` atualizado;
- nenhuma heuristica e alterada;
- nenhum frontend e alterado;
- nenhum backend API e alterado;
- nenhuma migration e criada;
- nenhum LLM e adicionado;
- `failed_runs = 0`.

## Validacao

```bash
docker compose exec backend python -m compileall app
docker compose exec backend python scripts/evaluate_moderation.py
docker compose exec backend python scripts/evaluate_moderation.py --dataset holdout
docker compose exec backend python scripts/evaluate_moderation.py --dataset-path app/evaluation/datasets/moderation_holdout_eval.json
```

## Documentacao das metricas

Atualizar:

```text
docs/evaluation.md
```

Adicionar uma secao da etapa 016 com:

- objetivo;
- dataset;
- metricas no dataset principal;
- metricas no holdout;
- observacoes sobre divergencias e limitacoes.
