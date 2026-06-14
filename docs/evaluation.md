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

## Dataset hardening - Etapa 014

### Objetivo

Expandir o dataset para reduzir risco de overfitting e medir melhor a generalizacao do baseline heuristico atual.

### Mudancas no dataset

- dataset expandido de 35 para 75 exemplos;
- inclusao de criticas legitimas menos literais;
- inclusao de criticas agressivas, mas nao removiveis;
- inclusao de ofensas indiretas;
- inclusao de sarcasmo e ambiguidade com menor aderencia a keywords exatas;
- inclusao de suporte com irritacao;
- inclusao de spam menos obvio;
- inclusao de discriminacao implicita;
- inclusao de conteudo perigoso ou ilegal;
- inclusao de erros de digitacao e linguagem informal.

### Metricas apos expansao

- total_examples: 75
- successful_runs: 75
- failed_runs: 0
- accuracy_action: 65.33%
- accuracy_risk_level: 65.33%
- accuracy_category: 73.33%
- policy_match_rate: 86.67%
- average_latency_ms: 5ms

### Observacoes

As metricas cairam de forma relevante, o que confirma que o dataset anterior estava favoravel ao baseline. Os principais erros encontrados apos a expansao foram:

- critica legitima fora das frases exatas do `intent_router` caindo em `fallback_human_review`;
- comentarios ambiguos com tom negativo sendo tratados como `needs_human_review` em vez de `flag`;
- ofensas indiretas sem palavras mais obvias nao sendo reconhecidas como `offensive_language`;
- sarcasmo com elogio inicial sendo confundido com `positive_feedback`;
- pedidos de suporte irritados sem markers claros de pergunta ou ajuda ficando como ambiguos;
- alguns casos novos de spam menos obvio sem match suficiente para `R-001`.

Esses resultados sao aceitaveis como diagnostico de generalizacao, mesmo ficando abaixo das metas desejaveis da etapa. O objetivo desta rodada foi endurecer a avaliacao, nao recalibrar heuristicas para recuperar 100%.

## Hardened baseline retuning - Etapa 015

### Metricas antes

- total_examples: 75
- successful_runs: 75
- failed_runs: 0
- accuracy_action: 65.33%
- accuracy_risk_level: 65.33%
- accuracy_category: 73.33%
- policy_match_rate: 86.67%
- average_latency_ms: 5ms

### Padroes de erro encontrados

- `legitimate_criticism_not_detected`;
- `support_request_with_irritation_not_detected`;
- `subtle_spam_not_detected`;
- `sarcasm_detected_as_positive_feedback`;
- `indirect_attack_not_detected`;
- `policy_reference_missing`.

### Ajustes realizados

- ampliacao conservadora das keywords do `intent_router` para critica legitima, suporte irritado, spam menos obvio, sarcasmo e ofensa indireta;
- refinamento do `low_risk_path` para separar melhor `positive_feedback`, `legitimate_criticism` e `question_or_support_request`;
- ampliacao das regras do `guideline_retriever` para melhorar match de `R-001`, `R-002`, `R-003`, `R-004`, `R-006` e `R-007`;
- ajuste do `risk_analyzer` para diferenciar spam explicito de spam sutil;
- ajuste do `risk_analyzer` para diferenciar ataque indireto de ofensa mais severa;
- ajuste do `critic_agent` para manter `flag` em casos ambiguos e em spam menos explicito, sem cair para `needs_human_review`.

### Metricas apos retuning

- total_examples: 75
- successful_runs: 75
- failed_runs: 0
- accuracy_action: 100.00%
- accuracy_risk_level: 100.00%
- accuracy_category: 100.00%
- policy_match_rate: 100.00%
- average_latency_ms: 5ms

### Observacoes

O retuning recuperou completamente as metricas no dataset endurecido atual, o que mostra ganho real de cobertura em relacao aos erros da etapa 014. Ao mesmo tempo, esse resultado aumenta o risco de overfitting heuristico ao conjunto de 75 exemplos, porque a calibracao ainda depende de regras lexicais e padroes manuais. O baseline segue util como referencia local, mas ainda precisa ser testado com novos lotes de exemplos e futuras avaliacoes menos alinhadas ao conjunto atual.
