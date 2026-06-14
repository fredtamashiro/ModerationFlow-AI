## Spec: 015 -- Hardened Baseline Retuning

## Objetivo

Realizar um retuning controlado do baseline heuristico apos o endurecimento do dataset de avaliacao.

## Contexto

O projeto possui:

- LangGraph funcional;
- roteamento condicional;
- `guideline_retriever`;
- `risk_analyzer`;
- `confidence_gate`;
- `critic_agent`;
- dataset endurecido com 75 exemplos;
- runner de avaliacao em memoria;
- documentacao em `docs/evaluation.md`.

## Metricas antes

Antes do retuning no dataset endurecido:

```text
total_examples: 75
successful_runs: 75
failed_runs: 0
accuracy_action: 65.33%
accuracy_risk_level: 65.33%
accuracy_category: 73.33%
policy_match_rate: 86.67%
average_latency_ms: 5ms
```

## Padroes de erro

Padroes principais identificados:

- `legitimate_criticism_not_detected`;
- `support_request_with_irritation_not_detected`;
- `subtle_spam_not_detected`;
- `sarcasm_detected_as_positive_feedback`;
- `indirect_attack_not_detected`;
- `policy_reference_missing`.

## Escopo

Esta etapa inclui:

- rodar o runner no dataset endurecido;
- analisar as divergencias;
- agrupar os erros por tipo;
- ajustar heuristicas de forma conservadora;
- melhorar cobertura de critica legitima;
- melhorar deteccao de suporte irritado;
- melhorar deteccao de spam menos obvio;
- melhorar deteccao de sarcasmo e ambiguidade;
- melhorar deteccao de ofensa indireta;
- ajustar `policy_references` quando necessario;
- recalibrar `risk_level`, `recommended_action` e `confidence`;
- atualizar `docs/evaluation.md` com antes e depois;
- manter avaliacao em memoria.

## Fora de escopo

- adicionar LLM;
- adicionar embeddings;
- adicionar `pgvector`;
- alterar frontend;
- alterar banco;
- criar migrations;
- criar endpoints novos;
- adicionar Langfuse ou LangSmith;
- usar LLM as Judge.

## Estrategia de retuning

- ampliar cobertura de keywords e padroes do `intent_router` sem acoplar demais a frases exatas;
- melhorar heuristicas de `low_risk_path` para separar elogio, critica legitima e suporte;
- melhorar heuristicas de `guideline_retriever` para `R-001`, `R-002`, `R-003`, `R-006` e `R-007`;
- ajustar `risk_analyzer` para diferenciar spam mais explicito de spam menos obvio;
- ajustar `critic_agent` apenas quando ele reduzir severidade de forma indevida ou quando precisar manter `flag` em vez de `needs_human_review`.

## Criterios de aceite

- spec criada;
- runner continua executando sem erro;
- dataset continua com 75 exemplos ou mais;
- avaliacao continua em memoria;
- metricas antes e depois documentadas;
- `failed_runs = 0`;
- `policy_match_rate` melhora ou fica pelo menos em 90%;
- `accuracy_action` melhora em relacao aos 65.33%, ou ha explicacao clara;
- nenhum frontend e alterado;
- nenhum LLM e adicionado;
- nenhuma migration e criada;
- nenhum endpoint e alterado;
- health checks continuam funcionando.

## Validacao

```bash
docker compose exec backend python -m compileall app
docker compose exec backend python scripts/evaluate_moderation.py
```

## Documentacao do antes/depois

Atualizar:

```text
docs/evaluation.md
```

Adicionar uma secao dedicada a etapa 015 com:

- metricas antes;
- padroes de erro encontrados;
- ajustes realizados;
- metricas apos retuning;
- observacoes sobre ganhos, limites e risco de overfitting.
