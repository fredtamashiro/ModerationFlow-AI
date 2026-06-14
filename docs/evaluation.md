# Evaluation - ModerationFlow AI

## Baseline inicial

- total_examples: 35
- successful_runs: 35
- failed_runs: 0
- accuracy_action: 60.00%
- accuracy_risk_level: 74.29%
- accuracy_category: 85.71%
- policy_match_rate: 100.00%
- average_latency_ms: 5ms

## Ajustes da etapa 013

Padroes principais encontrados no baseline inicial:

- casos de `spam` estavam saindo como `flag` depois da passagem pelo `critic_agent`, quando o esperado era `remove`;
- comentarios de `hate_or_discrimination` e `dangerous_or_illegal_content` tambem estavam sendo reduzidos para `flag`;
- criticas legitimas estavam caindo em `ambiguous_deep_review` ou `fallback_human_review`, o que piorava `accuracy_action`;
- havia falso positivo de feedback positivo em textos com `nao gostei`, por causa da substring `gostei`.

Ajustes aplicados no baseline heuristico:

- refinamento das keywords do `intent_router` para separar sarcasmo de critica legitima;
- adicao de heuristicas de `legitimate_criticism` no `low_risk_path`;
- ajuste do `guideline_retriever` para associar melhor critica legitima a `R-006`;
- ajuste do `risk_analyzer` para recomendar `approve` em critica legitima de baixo risco;
- calibracao do `critic_agent` para nao reduzir indevidamente casos claros de `spam`, `hate_or_discrimination` e `dangerous_or_illegal_content`;
- correcao do falso positivo em `nao gostei`.

## Resultado apos tuning

- total_examples: 35
- successful_runs: 35
- failed_runs: 0
- accuracy_action: 100.00%
- accuracy_risk_level: 100.00%
- accuracy_category: 100.00%
- policy_match_rate: 100.00%
- average_latency_ms: 5ms

## Observacoes

Este resultado ainda representa um baseline heuristico local, executado em memoria e validado sobre um dataset curado pequeno. As metricas mostram aderencia ao conjunto atual de exemplos, mas nao provam generalizacao para comentarios reais em producao. A arquitetura continua exigindo revisao humana obrigatoria e nao adiciona LLM, embeddings, `pgvector` ou persistencia de resultados de avaliacao nesta etapa.
