## Spec: 017 -- Holdout-Guided Retuning

## Objetivo

Melhorar a generalizacao do baseline heuristico usando os achados do holdout dataset, sem otimizar diretamente para frases exatas do holdout.

## Contexto

A etapa 016 mostrou um contraste forte entre o dataset principal e o holdout:

```text
Dataset principal:
total_examples: 75
accuracy_action: 100.00%
accuracy_risk_level: 100.00%
accuracy_category: 100.00%
policy_match_rate: 100.00%

Holdout:
total_examples: 35
accuracy_action: 48.57%
accuracy_risk_level: 48.57%
accuracy_category: 57.14%
policy_match_rate: 88.57%
failed_runs: 0
```

O holdout revelou falhas de generalizacao em critica legitima leve, spam indireto, sarcasmo iniciado por elogio, suporte irritado, ofensa indireta, linguagem informal e falso positivo severo em `R-004`.

## Metricas antes

Dataset principal:

- total_examples: 75
- accuracy_action: 100.00%
- accuracy_risk_level: 100.00%
- accuracy_category: 100.00%
- policy_match_rate: 100.00%

Holdout:

- total_examples: 35
- accuracy_action: 48.57%
- accuracy_risk_level: 48.57%
- accuracy_category: 57.14%
- policy_match_rate: 88.57%

## Risco de overfitting

O retuning deve ser guiado pelos grupos de erro do holdout, mas sem memorizar frases exatas do dataset. As regras devem capturar intencao e padroes mais gerais.

## Estrategia de retuning

- ampliar padroes gerais do `intent_router`;
- melhorar cobertura lexical para critica legitima leve;
- melhorar reconhecimento de elogio com ressalva;
- melhorar deteccao de sarcasmo com elogio inicial e contraste;
- melhorar spam indireto com termos gerais de contato externo;
- melhorar suporte irritado com linguagem informal;
- melhorar ofensa indireta por termos mais gerais de desqualificacao;
- reduzir falso positivo de discriminacao exigindo match mais robusto para `R-004`;
- ajustar `guideline_retriever`, `risk_analyzer` e `critic_agent` apenas quando necessario.

## Escopo

Esta etapa inclui:

- rodar avaliacao no dataset principal;
- rodar avaliacao no holdout;
- analisar divergencias do holdout;
- agrupar erros por padrao;
- ajustar heuristicas gerais no grafo;
- melhorar cobertura de critica legitima leve;
- melhorar spam indireto;
- melhorar sarcasmo iniciado por elogio;
- melhorar suporte irritado;
- melhorar ofensa indireta;
- reduzir falso positivo severo em `R-004`;
- melhorar `policy_match_rate` do holdout;
- documentar metricas antes e depois em `docs/evaluation.md`.

## Fora de escopo

- alterar dataset para favorecer metrica;
- remover exemplos dificeis;
- adicionar LLM;
- adicionar embeddings;
- adicionar `pgvector`;
- alterar frontend;
- alterar banco;
- criar migrations;
- criar endpoints novos;
- usar Langfuse ou LangSmith.

## Criterios de aceite

- spec criada;
- runner continua funcionando para dataset principal;
- runner continua funcionando para holdout;
- avaliacao continua em memoria;
- holdout melhora em relacao a etapa 016 ou ha explicacao clara;
- `policy_match_rate` do holdout chega perto de 90% ou supera 90%;
- `failed_runs = 0`;
- nenhum dataset e reduzido para melhorar metrica;
- nenhum LLM e adicionado;
- nenhum frontend e alterado;
- nenhuma migration e criada;
- nenhum endpoint e alterado;
- metricas antes e depois sao documentadas.

## Validacao

```bash
docker compose exec backend python -m compileall app
docker compose exec backend python scripts/evaluate_moderation.py
docker compose exec backend python scripts/evaluate_moderation.py --dataset holdout
```

## Documentacao do antes/depois

Atualizar:

```text
docs/evaluation.md
```

Adicionar secao com:

- metricas antes;
- padroes de erro encontrados;
- ajustes realizados;
- metricas apos retuning no dataset principal;
- metricas apos retuning no holdout;
- observacoes sobre ganhos, limites e risco de overfitting.
