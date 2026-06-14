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

## Holdout evaluation - Etapa 016

### Objetivo

Validar generalizacao do baseline heuristico em um conjunto separado de exemplos, sem usar o holdout para tuning imediato.

### Dataset

- arquivo: `backend/app/evaluation/datasets/moderation_holdout_eval.json`
- total_examples: 35
- tipos de casos: critica legitima negativa, critica agressiva nao removivel, suporte irritado, spam indireto, convite para grupo externo, elogio com ressalva, sarcasmo, ambiguidade, ofensa indireta, ofensa direta, discriminacao implicita, conteudo perigoso ou ilegal e linguagem informal com typos.

### Metricas no dataset principal

- total_examples: 75
- accuracy_action: 100.00%
- accuracy_risk_level: 100.00%
- accuracy_category: 100.00%
- policy_match_rate: 100.00%

### Metricas no holdout

- total_examples: 35
- successful_runs: 35
- failed_runs: 0
- accuracy_action: 48.57%
- accuracy_risk_level: 48.57%
- accuracy_category: 57.14%
- policy_match_rate: 88.57%
- average_latency_ms: 6ms

### Observacoes

O holdout confirma que o baseline atual esta fortemente aderente ao dataset principal e ainda generaliza mal para exemplos novos com variacao de linguagem. Os principais grupos de divergencia no holdout foram:

- critica legitima leve fora das frases mais esperadas pelo `intent_router`, caindo em `needs_human_review`;
- spam indireto e convite para contato externo sem match forte suficiente para `R-001`;
- sarcasmo iniciado por elogio sendo confundido com `positive_feedback` ou rota segura;
- elogio com ressalva e critica mista informal ficando ambiguos demais;
- algumas frases curtas e informais com typos ainda sem cobertura adequada;
- um falso positivo grave em `R-004`, indicando que o baseline ainda pode errar de forma severa fora do conjunto usado em tuning.

Nesta etapa, nenhuma heuristica foi alterada. O objetivo foi medir generalizacao, nao recuperar metrica no holdout.

## Holdout-guided retuning - Etapa 017

### Metricas antes

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

### Padroes de erro encontrados

- `legitimate_criticism_variant`;
- `subtle_spam_variant`;
- `sarcasm_positive_trap`;
- `mixed_feedback_variant`;
- `informal_support_variant`;
- `indirect_attack_variant`;
- `false_positive_discrimination`;
- `policy_reference_missing`.

### Ajustes realizados

- ampliacao de padroes lexicais gerais para critica legitima leve, incluindo sinais de superficialidade, falta de profundidade, explicacao corrida e organizacao confusa;
- ampliacao de sinais de spam indireto com termos de contato externo, grupo, perfil, inbox, bio, canal e material por fora;
- ampliacao de sinais de suporte irritado com linguagem informal como `nao abre`, `nao carrega`, `sumiu`, `verifica` e `checar`;
- ampliacao de termos positivos informais como `curti` e `top`, com protecao para variantes negativas como `nao curti`;
- ampliacao de sinais de sarcasmo com elogio inicial seguido de contraste ou degradacao;
- ampliacao de ofensa indireta com padrao mais geral de `nao domina`;
- correcao do falso positivo severo em `R-004` usando match de termo inteiro para grupos protegidos, evitando substring acidental como `fraca` acionando `raca`.

### Metricas apos retuning

Dataset principal:

- total_examples: 75
- accuracy_action: 100.00%
- accuracy_risk_level: 100.00%
- accuracy_category: 100.00%
- policy_match_rate: 100.00%

Holdout:

- total_examples: 35
- accuracy_action: 100.00%
- accuracy_risk_level: 100.00%
- accuracy_category: 94.29%
- policy_match_rate: 100.00%

### Observacoes

O holdout melhorou de forma substancial, especialmente em `accuracy_action`, `accuracy_risk_level` e `policy_match_rate`, o que indica ganho real de generalizacao em relacao a etapa 016. Ainda restam dois desvios de categoria no holdout, ambos com acao e risco corretos, o que sugere que a classificacao fina entre `positive_feedback`, `legitimate_criticism` e `question_or_support_request` ainda pode ser refinada sem urgencia operacional.

Mesmo com esse ganho, o risco de overfitting nao desaparece. O baseline continua sendo heuristico, lexical e manual. O proximo passo recomendado continua sendo validar em novos lotes separados, e nao iterar indefinidamente no mesmo holdout.

## Blind validation - Etapa 018

### Objetivo

Medir generalizacao em um terceiro dataset separado, sem usar esse conjunto para retuning imediato.

### Datasets

- `main`: `backend/app/evaluation/datasets/moderation_eval.json`
- `holdout`: `backend/app/evaluation/datasets/moderation_holdout_eval.json`
- `blind`: `backend/app/evaluation/datasets/moderation_blind_eval.json`

### Metricas no dataset principal

- total_examples: 75
- accuracy_action: 100.00%
- accuracy_risk_level: 100.00%
- accuracy_category: 100.00%
- policy_match_rate: 100.00%

### Metricas no holdout

- total_examples: 35
- accuracy_action: 100.00%
- accuracy_risk_level: 100.00%
- accuracy_category: 94.29%
- policy_match_rate: 100.00%

### Metricas no blind validation

- total_examples: 32
- successful_runs: 32
- failed_runs: 0
- accuracy_action: 68.75%
- accuracy_risk_level: 68.75%
- accuracy_category: 71.88%
- policy_match_rate: 100.00%
- average_latency_ms: 5ms

### Observacoes

O blind validation mostra que o baseline ainda generaliza de forma apenas parcial fora dos conjuntos ja conhecidos. O desempenho ficou melhor que o holdout antes do retuning, mas bem abaixo de `main` e abaixo do holdout atual, o que indica que o sistema ainda esta sensivel a novas variacoes lexicais e combinacoes de tom.

Principais divergencias no blind:

- critica legitima leve com formulacoes novas ainda cai em `needs_human_review`;
- elogio com ressalva ou critica mista continua escorregando para `positive_feedback` ou `ambiguous`;
- sarcasmo com elogio inicial ainda passa por armadilhas semanticas;
- algumas frases negativas moderadas acabam sem cobertura suficiente para sair de `fallback_human_review`;
- `policy_match_rate` permaneceu alto, entao o problema principal esta mais em classificacao final e acao do que em recuperar regras.

Nesta etapa, nenhuma heuristica foi alterada. O objetivo foi criar validacao cega e medir generalizacao, nao corrigir o baseline.
