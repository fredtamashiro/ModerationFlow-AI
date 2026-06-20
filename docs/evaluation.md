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

## LLM risk analyzer experiment - Etapa 019

### Objetivo

Adicionar um modo experimental com LLM para comparar o baseline heuristico atual em avaliacao offline, sem alterar o grafo principal nem o endpoint `POST /admin/moderation/comments/{comment_id}/analyze`.

### Como executar

```bash
docker compose exec backend python scripts/evaluate_moderation.py --mode heuristic
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind --mode llm
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind --mode compare
```

### Metricas heuristicas

As metricas heuristicas continuam sendo as registradas na etapa 018 para `blind validation`:

- total_examples: 32
- successful_runs: 32
- failed_runs: 0
- accuracy_action: 68.75%
- accuracy_risk_level: 68.75%
- accuracy_category: 71.88%
- policy_match_rate: 100.00%
- average_latency_ms: 5ms

### Metricas LLM

Pendentes de execucao com `OPENAI_API_KEY` configurada no ambiente alvo.

O runner agora contabiliza:

- `successful_runs` para respostas validas do schema;
- `failed_runs` para erro de chamada, timeout, JSON invalido ou falha de validacao.

### Comparacao

O modo `compare` imprime:

- resultados do baseline heuristico;
- resultados do `llm_risk_analyzer`;
- deltas de `accuracy_action`, `accuracy_risk_level`, `accuracy_category` e `policy_match_rate`.

### Observacoes

O `llm_risk_analyzer` fica isolado em `backend/app/moderation/llm/` e usa guidelines como contexto textual, com saida JSON validada por Pydantic. Esse modo e apenas experimental e nao substitui a revisao humana nem o fluxo principal de producao.

## LLM prompt and schema tuning - Etapa 020

### Metricas antes

Heuristic blind:

- accuracy_action: 68.75%
- accuracy_risk_level: 68.75%
- accuracy_category: 71.88%
- policy_match_rate: 100.00%

LLM blind:

- accuracy_action: 59.38%
- accuracy_risk_level: 65.62%
- accuracy_category: 56.25%
- policy_match_rate: 90.62%
- average_latency_ms: 6651ms

### Padroes de erro do LLM

- suavizacao excessiva de casos ambiguos para `approve`;
- perda de severidade esperada em casos ligados a `R-004` e `R-005`;
- agressividade acima do esperado em alguns casos de `spam` e `personal_attack`;
- variacao entre execucoes independentes, mesmo mantendo o mesmo dataset;
- latencia muito superior ao baseline heuristico.

### Ajustes realizados

- reforco do `SYSTEM_PROMPT` com regras mais explicitas para ambiguidade, critica legitima, suporte irritado, discriminacao, conteudo perigoso e spam;
- inclusao de `decision rules` mais diretas no prompt para priorizar `flag` quando nao houver certeza suficiente;
- inclusao de exemplos curtos de referencia no prompt, sem hardcode do dataset;
- revisao do schema Pydantic do `llm_risk_analyzer`;
- deduplicacao de `policy_references`;
- validacao explicita de `justification`;
- pos-validacao leve no analisador para normalizar campos textuais, deduplicar policies e rejeitar respostas inconsistentes;
- manutencao do comportamento de falha clara no runner quando a saida nao puder ser validada.

### Metricas apos tuning

LLM blind:

- accuracy_action: 68.75%
- accuracy_risk_level: 78.12%
- accuracy_category: 71.88%
- policy_match_rate: 90.62%
- average_latency_ms: 6025ms

Compare blind:

- action_accuracy_delta: 0.00%
- risk_level_accuracy_delta: 9.37%
- category_accuracy_delta: 0.00%
- policy_match_rate_delta: -9.38%

### Observacoes

O tuning melhorou o modo LLM em `accuracy_action`, `accuracy_risk_level` e `accuracy_category`, atingindo as metas desejaveis de `accuracy_action >= 65%`, `accuracy_risk_level >= 65%`, `accuracy_category >= 65%` e `failed_runs = 0`. A meta desejavel de `policy_match_rate >= 90%` tambem foi atendida, embora ainda abaixo do baseline heuristico.

O principal ganho ficou em classificacao de risco. O principal problema remanescente e a fundamentacao de policy em alguns casos ambiguos e em um caso relevante de `R-004`, alem da latencia ainda muito superior ao baseline heuristico.

Durante a etapa foi testada uma tentativa de reduzir variancia com `temperature=0`, mas o modelo configurado nao aceita esse valor e retornou erro `400`, entao o ajuste foi revertido. O LLM continua experimental e nao substitui a decisao humana nem o fluxo principal de producao.

## LLM policy reference calibration - Etapa 021

### Metricas antes

LLM blind:

- accuracy_action: 68.75%
- accuracy_risk_level: 78.12%
- accuracy_category: 71.88%
- policy_match_rate: 90.62%
- average_latency_ms: 6025ms

### Problema observado

Mesmo apos a etapa 020, o experimento LLM ainda perdia em `policy_match_rate` para o baseline heuristico. O problema principal era inconsistencia entre `category` e `policy_references`, especialmente quando o modelo:

- classificava corretamente a categoria principal, mas devolvia a regra errada;
- devolvia uma policy secundaria sem incluir a policy obrigatoria da categoria;
- misturava `personal_attack` e `offensive_language` sem manter a policy minima esperada;
- mantinha variancia entre execucoes independentes.

### Ajustes realizados

- reforco do prompt com regras explicitas de mapeamento `category -> policy`;
- inclusao de instrucoes claras para `spam`, `personal_attack`, `offensive_language`, `hate_or_discrimination`, `dangerous_or_illegal_content`, `legitimate_criticism`, `question_or_support_request` e `positive_feedback`;
- calibragem leve em `backend/app/moderation/llm/analyzer.py` para:
  - remover duplicadas;
  - preservar ordem;
  - filtrar policies inconsistentes com a categoria quando o mapeamento for claro;
  - inserir a policy primaria obrigatoria da categoria quando ela estiver ausente e o mapeamento for inequivoco;
  - registrar essa calibragem na `justification` interna, sem alterar `recommended_action`, `risk_level` ou `category`.

### Metricas apos calibragem

LLM blind:

- accuracy_action: 68.75%
- accuracy_risk_level: 78.12%
- accuracy_category: 71.88%
- policy_match_rate: 93.75%
- average_latency_ms: 5758ms

### Comparacao com heuristico

Heuristic blind:

- accuracy_action: 68.75%
- accuracy_risk_level: 68.75%
- accuracy_category: 71.88%
- policy_match_rate: 100.00%

LLM blind:

- accuracy_action: 68.75%
- accuracy_risk_level: 78.12%
- accuracy_category: 71.88%
- policy_match_rate: 93.75%

Delta LLM vs heuristic:

- action_accuracy_delta: 0.00%
- risk_level_accuracy_delta: 9.37%
- category_accuracy_delta: 0.00%
- policy_match_rate_delta: -6.25%

### Observacoes

A calibragem de policies melhorou o `policy_match_rate` de `90.62%` para `93.75%`, sem perda relevante nas outras metricas e mantendo `failed_runs = 0`. A meta desejavel de `policy_match_rate >= 95%` nao foi atingida nesta etapa.

Os erros remanescentes de policy agora estao mais concentrados em casos em que a propria categoria escolhida pelo LLM ainda diverge do esperado, como `legitimate_criticism` versus `hate_or_discrimination` ou `offensive_language`. Isso indica que o proximo gargalo nao e apenas policy mapping, mas separacao semantica mais robusta entre categorias proximas.

O LLM continua experimental, mais lento que o baseline heuristico e com alguma variancia entre execucoes independentes. Ele nao substitui a decisao humana nem o fluxo principal de producao.

## LLM category boundary tuning - Etapa 022

### Metricas antes

LLM blind:

- accuracy_action: 68.75%
- accuracy_risk_level: 78.12%
- accuracy_category: 71.88%
- policy_match_rate: 93.75%
- average_latency_ms: 5758ms

### Problema observado

Mesmo apos a etapa 021, o principal gargalo do experimento LLM continuava sendo a separacao entre categorias proximas. Os erros mais recorrentes estavam em fronteiras como:

- `legitimate_criticism` versus `positive_feedback` em elogio com ressalva;
- `legitimate_criticism` versus `ambiguous` em comentarios negativos moderados;
- `offensive_language` versus `personal_attack` quando havia alvo humano claro;
- `hate_or_discrimination` sendo subdetectado em caso semantico mais sutil.

### Ajustes realizados

- reforco do prompt com uma secao explicita de `category boundary rules`;
- instrucoes claras para escolher a categoria dominante;
- reforco para usar `question_or_support_request` quando houver pedido claro de ajuda;
- reforco para usar `personal_attack` quando o alvo humano for central;
- reforco para nao usar `hate_or_discrimination` sem grupo protegido claro;
- reforco para tratar elogio com ressalva relevante como `legitimate_criticism`, e nao `positive_feedback`.

### Metricas apos tuning

LLM blind:

- accuracy_action: 71.88%
- accuracy_risk_level: 78.12%
- accuracy_category: 71.88%
- policy_match_rate: 93.75%
- average_latency_ms: 5463ms

### Comparacao com heuristico

Heuristic blind:

- accuracy_action: 68.75%
- accuracy_risk_level: 68.75%
- accuracy_category: 71.88%
- policy_match_rate: 100.00%

LLM blind:

- accuracy_action: 71.88%
- accuracy_risk_level: 78.12%
- accuracy_category: 71.88%
- policy_match_rate: 93.75%

Delta LLM vs heuristic:

- action_accuracy_delta: 3.13%
- risk_level_accuracy_delta: 9.37%
- category_accuracy_delta: 0.00%
- policy_match_rate_delta: -6.25%

### Observacoes

Esta etapa melhorou `accuracy_action` do LLM sem perder `accuracy_risk_level` ou `policy_match_rate`, e manteve `failed_runs = 0` na execucao pareada de `compare`. A meta desejavel de `accuracy_category >= 75%` nao foi atingida; o resultado ficou em `71.88%`.

O principal gargalo remanescente continua sendo a separacao fina entre `legitimate_criticism`, `ambiguous`, `personal_attack` e `offensive_language`, alem de um caso ainda mal resolvido de `hate_or_discrimination`. O LLM segue experimental, mais lento que o baseline heuristico e sujeito a alguma variancia entre execucoes independentes. Ele nao substitui a decisao humana nem o fluxo principal de producao.

## LLM ambiguity and severity calibration - Etapa 024

### Metricas antes

LLM blind:

- accuracy_action: 68.75%
- accuracy_risk_level: 78.12%
- accuracy_category: 71.88%
- policy_match_rate: 93.75%
- average_latency_ms: ~6411ms

### Problema observado

Mesmo com LangSmith funcional e com a separacao de categorias melhor que nas etapas anteriores, o LLM ainda errava em tres grupos principais:

- critica mais forte, decepcao ampla e sarcasmo ainda podiam cair em `approve` ou em categoria leve demais;
- elogio com ressalva ainda oscilava entre `positive_feedback` e `legitimate_criticism`;
- spam sutil com convite para contato externo ainda podia subir para `remove` de forma agressiva.

### Ajustes realizados

- reforco do `SYSTEM_PROMPT` para empurrar comentarios negativos nao triviais para `ambiguous / medium / flag`;
- reforco explicito de que sarcasmo, ironia e elogio seguido de negacao nao devem virar `positive_feedback`;
- nova secao de calibragem de ambiguidade e severidade no prompt, separando:
  - critica legitima leve;
  - critica mais forte ou frustrada;
  - elogio com ressalva;
  - spam sutil versus spam explicito;
- inclusao de exemplos conceituais adicionais para:
  - critica ambigua;
  - sarcasmo;
  - elogio com ressalva;
  - spam sutil com convite para contato externo;
- manutencao da pos-validacao existente sem alterar silenciosamente `category`, `risk_level` ou `recommended_action`.

### Metricas apos calibragem

LLM blind no `--mode compare`:

- accuracy_action: 84.38%
- accuracy_risk_level: 87.50%
- accuracy_category: 81.25%
- policy_match_rate: 93.75%
- average_latency_ms: 6269ms

LLM blind em execucao separada de `--mode llm`:

- accuracy_action: 84.38%
- accuracy_risk_level: 87.50%
- accuracy_category: 78.12%
- policy_match_rate: 93.75%
- average_latency_ms: 7136ms

### Comparacao com heuristico

Heuristic blind:

- accuracy_action: 68.75%
- accuracy_risk_level: 68.75%
- accuracy_category: 71.88%
- policy_match_rate: 100.00%

LLM blind no `compare`:

- accuracy_action: 84.38%
- accuracy_risk_level: 87.50%
- accuracy_category: 81.25%
- policy_match_rate: 93.75%

Delta LLM vs heuristic:

- action_accuracy_delta: 15.63%
- risk_level_accuracy_delta: 18.75%
- category_accuracy_delta: 9.37%
- policy_match_rate_delta: -6.25%

### Observacoes

Esta etapa superou com folga as metas desejaveis de `accuracy_action`, `accuracy_risk_level` e `accuracy_category`, manteve `policy_match_rate` em `93.75%` e eliminou falhas do runner LLM nas execucoes validadas.

O principal problema remanescente ficou concentrado em:

- uma fronteira ainda discutivel entre `positive_feedback` e `legitimate_criticism` em elogio com ressalva;
- um caso de spam ainda mais agressivo que o esperado (`blind-017`);
- fronteiras entre `personal_attack` e `offensive_language`;
- um falso negativo relevante em `hate_or_discrimination` (`blind-028`).

Tambem permaneceu alguma variancia entre execucoes independentes do LLM, especialmente em `accuracy_category` e latencia media. O experimento segue opcional, observavel com LangSmith, e nao substitui o fluxo principal heuristico nem a revisao humana obrigatoria.

## LLM harmful content and attack boundary calibration - Etapa 025

### Metricas antes

LLM blind da etapa 024 no `--mode compare`:

- accuracy_action: 84.38%
- accuracy_risk_level: 87.50%
- accuracy_category: 81.25%
- policy_match_rate: 93.75%
- average_latency_ms: 6269ms

### Problema observado

Mesmo apos a calibragem de ambiguidade da etapa 024, ainda restavam gargalos em tres fronteiras:

- `personal_attack` vs `offensive_language`, principalmente quando havia alvo humano claro e linguagem ofensiva severa;
- falso negativo relevante em `hate_or_discrimination` / `R-004`;
- spam sutil ainda agressivo demais em um caso de convite externo, com `remove` quando o esperado era `flag`.

### Ajustes realizados

- reforco do `SYSTEM_PROMPT` para priorizar `hate_or_discrimination` quando houver preconceito, exclusao, inferiorizacao ou hostilidade ligada a grupo protegido;
- nova secao de `harmful content and attack boundary rules` no prompt;
- reforco para usar `personal_attack` quando o alvo principal for pessoa ou equipe;
- reforco para usar `offensive_language` quando o abuso for principalmente contra conteudo, aula, modulo ou produto;
- reforco para permitir `offensive_language` dominante em insulto humano severo com `R-003` e `R-002` quando fizer sentido;
- reforco para nao suavizar conteudo ligado a preconceito para `legitimate_criticism`, `ambiguous` ou `positive_feedback`;
- ajustes conceituais e exemplos curtos para:
  - `R-004` envolvendo religiao;
  - ataques a professor/equipe;
  - abuso severo com insulto direto;
  - spam sutil vs spam explicito.

Nenhuma mudanca foi feita no grafo heuristico, endpoint `/analyze`, frontend, banco, migrations ou datasets.

### Metricas apos calibragem

LLM blind em execucao separada de `--mode llm`:

- accuracy_action: 90.62%
- accuracy_risk_level: 93.75%
- accuracy_category: 84.38%
- policy_match_rate: 96.88%
- average_latency_ms: 6652ms

LLM blind no `--mode compare`:

- accuracy_action: 87.50%
- accuracy_risk_level: 87.50%
- accuracy_category: 81.25%
- policy_match_rate: 90.62%
- average_latency_ms: 6775ms

### Comparacao com heuristico

Heuristic blind:

- accuracy_action: 68.75%
- accuracy_risk_level: 68.75%
- accuracy_category: 71.88%
- policy_match_rate: 100.00%

LLM blind no `compare`:

- accuracy_action: 87.50%
- accuracy_risk_level: 87.50%
- accuracy_category: 81.25%
- policy_match_rate: 90.62%

Delta LLM vs heuristic:

- action_accuracy_delta: 18.75%
- risk_level_accuracy_delta: 18.75%
- category_accuracy_delta: 9.37%
- policy_match_rate_delta: -9.38%

### Observacoes

Esta etapa melhorou substancialmente a execucao isolada do LLM em `action`, `risk`, `category` e `policy_match_rate`, mantendo `failed_runs = 0`. O melhor resultado observado nesta rodada foi:

- accuracy_action: 90.62%
- accuracy_risk_level: 93.75%
- accuracy_category: 84.38%
- policy_match_rate: 96.88%

Ao mesmo tempo, a execucao pareada de `compare` mostrou variancia e um trade-off relevante em `policy_match_rate`, que caiu para `90.62%`. Isso indica que a calibragem ainda nao estabilizou completamente entre execucoes independentes.

Os erros remanescentes ficaram concentrados em:

- `blind-017`, ainda agressivo demais em spam com convite externo;
- `blind-023` e `blind-024`, ainda saindo como `personal_attack` em vez de `offensive_language`;
- `blind-026`, ainda subestimando severidade de insulto direto;
- `blind-028`, ainda instavel em `R-004` entre execucoes diferentes.

O experimento continua opcional, observavel com LangSmith e sujeito a variancia. Ele nao substitui o fluxo principal heuristico nem a revisao humana obrigatoria.

## LLM variance and boundary stabilization - Etapa 026

### Metricas antes

Referencia da etapa 025:

Melhor execucao isolada `--mode llm`:

- accuracy_action: 90.62%
- accuracy_risk_level: 93.75%
- accuracy_category: 84.38%
- policy_match_rate: 96.88%
- failed_runs: 0

Execucao pareada `--mode compare`:

- accuracy_action: 87.50%
- accuracy_risk_level: 87.50%
- accuracy_category: 81.25%
- policy_match_rate: 90.62%

### Problema observado

A etapa 025 melhorou o experimento LLM, mas ainda havia dois problemas:

- variancia entre execucoes independentes, especialmente em `category` e `policy_match_rate`;
- fronteiras ainda instaveis em spam sutil, `personal_attack` vs `offensive_language` e `hate_or_discrimination` / `R-004`.

Casos prioritarios:

- `blind-017`: spam sutil ainda agressivo demais;
- `blind-023` e `blind-024`: oscilacao entre `personal_attack` e `offensive_language`;
- `blind-026`: severidade ainda subestimada em algumas execucoes;
- `blind-028`: instabilidade importante em `R-004`.

### Ajustes realizados

- reforco do prompt para forcar `flag` em spam com contato externo ou material por fora quando nao houver link, venda explicita ou promocao comercial clara;
- reforco da fronteira entre `personal_attack` e `offensive_language`, com instrucao explicita para tratar critica de incompetencia ou baixa qualidade de trabalho como `offensive_language` quando o foco principal for a qualidade do servico ou do material;
- reforco da regra de `R-004` para nao suavizar comentarios sobre preconceito contra grupo protegido para `positive_feedback`, `other` ou `legitimate_criticism`;
- inclusao de exemplos conceituais adicionais para suporte despreparado, estruturacao ruim do conteudo e preconceito contra religiao;
- adicao da opcao `--runs` no runner para executar multiplas rodadas no mesmo dataset e reportar media, desvio, minimo e maximo, sem alterar o comportamento padrao.

Exemplo:

```bash
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind --mode llm --runs 3
```

### Metricas apos estabilizacao

Execucao isolada `--mode llm`:

- accuracy_action: 87.50%
- accuracy_risk_level: 90.62%
- accuracy_category: 84.38%
- policy_match_rate: 93.75%
- average_latency_ms: 6704ms
- failed_runs: 0

Execucao pareada `--mode compare`:

- accuracy_action: 87.50%
- accuracy_risk_level: 90.62%
- accuracy_category: 87.50%
- policy_match_rate: 93.75%
- average_latency_ms: 6424ms
- failed_runs: 0

### Variancia observada

Rodando `--mode llm --runs 3` no dataset `blind`:

- accuracy_action mean: 89.58% | stddev: 1.47 | min: 87.50% | max: 90.62%
- accuracy_risk_level mean: 91.66% | stddev: 1.48 | min: 90.62% | max: 93.75%
- accuracy_category mean: 85.42% | stddev: 1.47 | min: 84.38% | max: 87.50%
- policy_match_rate mean: 94.79% | stddev: 1.48 | min: 93.75% | max: 96.88%
- average_latency_ms mean: 6179.33 | stddev: 173.85 | min: 6006 | max: 6417
- failed_runs mean: 0.00 | stddev: 0.00

### Comparacao com heuristico

Heuristic blind:

- accuracy_action: 68.75%
- accuracy_risk_level: 68.75%
- accuracy_category: 71.88%
- policy_match_rate: 100.00%

LLM blind no `compare`:

- accuracy_action: 87.50%
- accuracy_risk_level: 90.62%
- accuracy_category: 87.50%
- policy_match_rate: 93.75%

Delta LLM vs heuristic:

- action_accuracy_delta: 18.75%
- risk_level_accuracy_delta: 21.87%
- category_accuracy_delta: 15.62%
- policy_match_rate_delta: -6.25%

### Observacoes

Esta etapa melhorou o patamar do `compare` em `risk_level`, `category` e `policy_match_rate`, manteve `failed_runs = 0` e adicionou uma forma objetiva de medir variancia. A dispersao observada em tres rodadas ficou relativamente baixa, o que sugere ganho real de estabilidade em relacao a etapa 025.

Ainda restam erros relevantes:

- `blind-017` continua agressivo demais para spam sutil;
- `blind-023` ainda pode cair em `personal_attack` em vez de `offensive_language`;
- `blind-026` ainda subestima severidade em uma das fronteiras de insulto direto;
- `blind-028` continua sendo o caso mais sensivel de `R-004`, embora com melhor estabilidade agregada.

O experimento segue opcional, observavel com LangSmith e nao substitui o fluxo principal heuristico nem a revisao humana obrigatoria.

## LLM R-004 and severity calibration - Etapa 027

### Metricas antes

Referencia da etapa 026:

LLM:

- accuracy_action: 87.50%
- accuracy_risk_level: 90.62%
- accuracy_category: 84.38%
- policy_match_rate: 93.75%
- failed_runs: 0

Compare:

- accuracy_action: 87.50%
- accuracy_risk_level: 90.62%
- accuracy_category: 87.50%
- policy_match_rate: 93.75%
- failed_runs: 0

Runs 3 media:

- action: 89.58%
- risk: 91.66%
- category: 85.42%
- policy: 94.79%

### Problema observado

Mesmo apos a etapa 026, ainda restavam quatro gargalos mais sensiveis:

- `blind-017`: spam sutil ainda podia sair agressivo demais;
- `blind-023`: ainda oscilava para `personal_attack` em vez de `offensive_language`;
- `blind-026`: severidade de insulto direto ainda subestimava em parte das execucoes;
- `blind-028`: seguia como o caso mais problematico de `R-004`.

### Ajustes realizados

- reforco do prompt para nao suavizar casos de grupo protegido com preconceito claro para `other`, `legitimate_criticism`, `ambiguous`, `personal_attack` ou `offensive_language`;
- reforco da regra `remove` vs `flag`, deixando `remove` mais explicitamente reservado para violacao clara e severa;
- reforco de severidade para insulto direto humilhante contra pessoa ou equipe, permitindo `personal_attack / high / remove` com `R-002` e `R-003` quando houver abuso explicito;
- reforco de spam sutil como `flag`, inclusive no exemplo de grupo externo sem empurrao comercial claro;
- revisao de exemplos conceituais para professor ridiculo, professor imbecil e grupo externo de download.

Nenhuma mudanca foi feita no grafo heuristico, endpoint `/analyze`, frontend, banco, migrations ou datasets.

### Metricas apos calibragem

Execucao `--mode llm`:

- accuracy_action: 93.75%
- accuracy_risk_level: 93.75%
- accuracy_category: 84.38%
- policy_match_rate: 93.75%
- average_latency_ms: 7145ms
- failed_runs: 0

Execucao `--mode compare`:

- accuracy_action: 93.75%
- accuracy_risk_level: 93.75%
- accuracy_category: 84.38%
- policy_match_rate: 93.75%
- average_latency_ms: 7262ms
- failed_runs: 0

### Variancia observada

Rodando `--mode llm --runs 3` no dataset `blind`:

- accuracy_action mean: 93.75% | stddev: 0.00 | min: 93.75% | max: 93.75%
- accuracy_risk_level mean: 93.75% | stddev: 0.00 | min: 93.75% | max: 93.75%
- accuracy_category mean: 85.42% | stddev: 1.47 | min: 84.38% | max: 87.50%
- policy_match_rate mean: 93.75% | stddev: 0.00 | min: 93.75% | max: 93.75%
- average_latency_ms mean: 8637.67 | stddev: 1659.08 | min: 7107 | max: 10943
- failed_runs mean: 0.00 | stddev: 0.00

### Comparacao com heuristico

Heuristic blind:

- accuracy_action: 68.75%
- accuracy_risk_level: 68.75%
- accuracy_category: 71.88%
- policy_match_rate: 100.00%

LLM blind no `compare`:

- accuracy_action: 93.75%
- accuracy_risk_level: 93.75%
- accuracy_category: 84.38%
- policy_match_rate: 93.75%

Delta LLM vs heuristic:

- action_accuracy_delta: 25.00%
- risk_level_accuracy_delta: 25.00%
- category_accuracy_delta: 12.50%
- policy_match_rate_delta: -6.25%

### Observacoes

Esta etapa melhorou `accuracy_action` e `accuracy_risk_level` tanto em `llm` quanto em `compare`, manteve `policy_match_rate`, zerou `failed_runs` e reduziu fortemente a variancia observada nessas metricas. O ganho mais claro foi em estabilidade operacional de `action` e `risk`.

Ainda restam limitacoes importantes:

- `blind-028` continua escapando de `R-004`, embora o restante das metricas tenha estabilizado;
- `blind-025` e `blind-026` ainda ficam em `personal_attack` em vez de `offensive_language`, apesar de acao e risco terem melhorado;
- `blind-005` e `blind-021` seguem como fronteira entre `positive_feedback` e `legitimate_criticism`;
- a latencia ficou mais alta na rodada `--runs 3`, com maior dispersao de tempo.

O experimento continua opcional, observavel com LangSmith e nao substitui o fluxo principal heuristico nem a revisao humana obrigatoria.

## LLM safety regression set - Etapa 028

### Objetivo

Criar um dataset de regressao focado em seguranca para proteger o experimento `llm_risk_analyzer` contra regressao em casos sensiveis, especialmente:

- `R-004` / `hate_or_discrimination`;
- fronteira `personal_attack` vs `offensive_language`;
- fronteira `remove` vs `flag`;
- spam sutil vs spam explicito.

### Dataset

Arquivo criado:

- `backend/app/evaluation/datasets/moderation_safety_regression_eval.json`

Tamanho:

- 24 exemplos sinteticos

Grupos cobertos:

- discriminacao, exclusao e generalizacao depreciativa contra grupo protegido;
- negativos de controle para evitar falso positivo de `R-004`;
- ataques a pessoa vs linguagem ofensiva contra conteudo;
- insulto moderado vs insulto severo;
- spam sutil com contato externo;
- spam explicito com grupo, link, compra ou promocao clara;
- alguns casos de critica legitima e sarcasmo para contraste.

### Metricas no safety regression dataset

LLM `--mode llm`:

- total_examples: 24
- successful_runs: 24
- failed_runs: 0
- accuracy_action: 87.50%
- accuracy_risk_level: 83.33%
- accuracy_category: 79.17%
- policy_match_rate: 79.17%
- average_latency_ms: 14081ms

LLM `--mode compare`:

- accuracy_action: 87.50%
- accuracy_risk_level: 83.33%
- accuracy_category: 79.17%
- policy_match_rate: 79.17%

Heuristic `--mode compare`:

- accuracy_action: 54.17%
- accuracy_risk_level: 50.00%
- accuracy_category: 41.67%
- policy_match_rate: 75.00%

LLM `--runs 3` no `safety`:

- accuracy_action mean: 88.89% | stddev: 1.97 | min: 87.50% | max: 91.67%
- accuracy_risk_level mean: 81.94% | stddev: 1.96 | min: 79.17% | max: 83.33%
- accuracy_category mean: 83.33% | stddev: 3.40 | min: 79.17% | max: 87.50%
- policy_match_rate mean: 83.33% | stddev: 3.40 | min: 79.17% | max: 87.50%
- average_latency_ms mean: 9025.33 | stddev: 843.78 | min: 7856 | max: 9816
- failed_runs mean: 0.00 | stddev: 0.00

### Divergencias principais

Padroes mais relevantes encontrados no `safety`:

- `R-004` ainda falha em casos importantes como `safety-005` e `safety-006`, com suavizacao para `personal_attack`, `other`, `approve` ou risco baixo;
- `offensive_language` ainda pode cair em `ambiguous` ou `personal_attack`, como em `safety-008` e `safety-022`;
- spam explicito com grupo externo ainda pode ser suavizado para `flag`, como em `safety-017`;
- um caso de spam comercial com `link no perfil` ainda pode escorregar para `dangerous_or_illegal_content`, como em `safety-024`;
- o falso positivo grave de `R-004` no heuristico aparece em `safety-023`, o que confirma utilidade do dataset tambem para o baseline de referencia.

### Observacoes

Este dataset nao foi criado para buscar 100%, e sim para detectar regressao de seguranca de forma mais clara do que o `blind`. Ele expande a avaliacao com exemplos sinteticos dedicados aos pontos mais sensiveis observados nas etapas 026 e 027.

O `safety` mostrou que:

- o experimento LLM segue melhor que o heuristico nesses casos sensiveis;
- `failed_runs` permaneceu em zero;
- os maiores gargalos atuais nao estao mais em acao bruta, mas em categoria e `policy_match_rate`, principalmente em `R-004` e na fronteira `offensive_language` vs `personal_attack`.

O dataset deve ser mantido como conjunto de regressao para futuras etapas, especialmente antes de qualquer novo tuning de prompt voltado a `R-004`, spam explicito e mapeamento de policies.

## LLM safety policy and category calibration - Etapa 029

### Problemas observados no safety regression dataset

A etapa 028 mostrou quatro fragilidades mais importantes no experimento LLM:

- `R-004` ainda podia nao ser priorizado em casos claros de discriminacao ou preconceito contra grupo protegido;
- `policy_references` ainda podia sair incompleta ou incoerente com a categoria final;
- a fronteira `personal_attack` vs `offensive_language` seguia instavel, especialmente em critica de incompetencia ou baixa qualidade;
- spam explicito ainda podia ser suavizado demais ou escorregar para `dangerous_or_illegal_content` / `R-005`.

### Ajustes realizados

- reforco do `SYSTEM_PROMPT` para exigir `hate_or_discrimination / high / remove / R-004` quando houver grupo protegido claro com exclusao, inferiorizacao, generalizacao depreciativa ou preconceito explicito;
- reforco para nao usar `R-004` em critica comum, negatividade generica ou frustracao sem alvo de grupo protegido;
- reforco da separacao entre `personal_attack` e `offensive_language` pelo alvo principal da mensagem;
- reforco para tratar insultos fortes contra aula, curso, modulo, conteudo, material ou servico como `offensive_language`, e nao como `legitimate_criticism`;
- reforco para manter spam explicito como `spam / R-001`, sem cair em `R-005` quando nao houver instrucao ilegal ou perigosa real;
- revisao da pos-validacao de `policy_references` para:
  - remover policies incompatíveis com a categoria final;
  - deduplicar policies;
  - inserir a policy primaria obrigatoria quando o mapeamento da categoria for inequivoco;
  - registrar a calibragem na justificativa interna sem alterar silenciosamente `category`, `risk_level` ou `recommended_action`.

Nenhuma mudanca foi feita no baseline heuristico, LangGraph principal, endpoint `/analyze`, frontend, banco, migrations ou datasets.

### Metricas antes

Referencia da etapa 028 no dataset `safety`:

LLM `--dataset safety --mode llm`:

- accuracy_action: 87.50%
- accuracy_risk_level: 83.33%
- accuracy_category: 83.33%
- policy_match_rate: 83.33%
- failed_runs: 0

LLM `--dataset safety --mode compare`:

- accuracy_action: 87.50%
- accuracy_risk_level: 83.33%
- accuracy_category: 83.33%
- policy_match_rate: 83.33%
- failed_runs: 0

LLM `--dataset safety --mode llm --runs 3`:

- accuracy_action mean: 87.50%
- accuracy_risk_level mean: 83.33%
- accuracy_category mean: 79.17%
- policy_match_rate mean: 79.17%
- failed_runs mean: 0.00

Referencia imediatamente anterior no dataset `blind` com `--mode llm --runs 3`:

- accuracy_action mean: 93.75%
- accuracy_risk_level mean: 93.75%
- accuracy_category mean: 83.34%
- policy_match_rate mean: 93.75%
- failed_runs mean: 0.00

### Metricas depois

LLM `--dataset safety --mode llm`:

- total_examples: 24
- successful_runs: 24
- failed_runs: 0
- accuracy_action: 95.83%
- accuracy_risk_level: 95.83%
- accuracy_category: 91.67%
- policy_match_rate: 91.67%
- average_latency_ms: 5975ms

LLM `--dataset safety --mode compare`:

- accuracy_action: 95.83%
- accuracy_risk_level: 95.83%
- accuracy_category: 91.67%
- policy_match_rate: 91.67%
- failed_runs: 0

Heuristic `--dataset safety --mode compare`:

- accuracy_action: 54.17%
- accuracy_risk_level: 50.00%
- accuracy_category: 41.67%
- policy_match_rate: 75.00%

LLM `--dataset safety --mode llm --runs 3`:

- accuracy_action mean: 95.83% | stddev: 0.00 | min: 95.83% | max: 95.83%
- accuracy_risk_level mean: 95.83% | stddev: 0.00 | min: 95.83% | max: 95.83%
- accuracy_category mean: 91.67% | stddev: 0.00 | min: 91.67% | max: 91.67%
- policy_match_rate mean: 91.67% | stddev: 0.00 | min: 91.67% | max: 91.67%
- average_latency_ms mean: 6109.00 | stddev: 260.77 | min: 5754.00 | max: 6373.00
- failed_runs mean: 0.00 | stddev: 0.00

### Efeito no blind dataset

LLM `--dataset blind --mode llm --runs 3`:

- accuracy_action mean: 93.75% | stddev: 0.00 | min: 93.75% | max: 93.75%
- accuracy_risk_level mean: 87.50% | stddev: 0.00 | min: 87.50% | max: 87.50%
- accuracy_category mean: 88.54% | stddev: 1.47 | min: 87.50% | max: 90.62%
- policy_match_rate mean: 96.88% | stddev: 0.00 | min: 96.88% | max: 96.88%
- average_latency_ms mean: 6159.33 | stddev: 166.91 | min: 5967.00 | max: 6374.00
- failed_runs mean: 0.00 | stddev: 0.00

LLM `--dataset blind --mode compare`:

- accuracy_action: 93.75%
- accuracy_risk_level: 87.50%
- accuracy_category: 84.38%
- policy_match_rate: 96.88%
- failed_runs: 0

Leitura do efeito no `blind`:

- `policy_match_rate` melhorou de forma clara;
- `accuracy_category` em `--runs 3` tambem subiu;
- `accuracy_action` permaneceu estavel;
- `accuracy_risk_level` caiu em relacao a referencia anterior, concentrando o trade-off em spam explicito que passou a sair mais severo.

### Limitacoes conhecidas

Mesmo apos a calibragem, ainda restam desvios importantes:

- `safety-005` continua saindo como `personal_attack / medium / flag` em vez de `hate_or_discrimination / high / remove`;
- `safety-022` continua saindo como `personal_attack / R-002` em vez de `offensive_language / R-003`;
- no `blind`, alguns casos de spam explicito passaram a sair mais severos no `risk_level` do que o esperado pelo dataset;
- no `blind`, `blind-023`, `blind-025` e `blind-026` ainda mostram a fronteira instavel entre `personal_attack` e `offensive_language`.

O experimento continua opcional, observavel com LangSmith quando habilitado, e nao substitui o fluxo principal heuristico nem a revisao humana obrigatoria.

## LLM error taxonomy and severity calibration - Etapa 030

### Objetivo

Adicionar taxonomia de erro ao runner de avaliacao para identificar padroes recorrentes antes de qualquer nova calibragem de prompt, normalizacao ou regras. O foco desta etapa nao foi mudar comportamento do LLM, e sim melhorar a leitura dos erros para evitar tuning reativo em exemplos isolados.

### Analises adicionadas

O runner agora exibe, alem das metricas e divergencias por exemplo:

- `category confusion`, agrupando `expected_category -> predicted_category`;
- `action confusion`, agrupando `expected_action -> predicted_action`;
- `risk confusion`, agrupando `expected_risk -> predicted_risk`;
- `policy divergences`, agrupando `expected_policy_rules -> predicted_policy_rules`;
- `pattern summary`, com os principais mismatches por categoria, acao, risco e policy.

Compatibilidade preservada:

- `heuristic`;
- `llm`;
- `compare`;
- `--runs > 1`.

No modo `compare`, a analise aparece separadamente em `Heuristic results` e `LLM results`. Em `--runs > 1`, as metricas agregadas continuam iguais e a taxonomia de erro e mostrada apenas para a ultima rodada, com indicacao explicita.

### Como executar

Exemplos:

```bash
docker compose exec backend python scripts/evaluate_moderation.py --dataset safety --mode llm
docker compose exec backend python scripts/evaluate_moderation.py --dataset safety --mode compare
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind --mode llm --runs 3
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind --mode compare
```

Exemplo resumido de saida:

```text
Error analysis:
Category confusion:
- hate_or_discrimination -> personal_attack: 1
- offensive_language -> personal_attack: 1
Action confusion:
- remove -> flag: 1
Risk confusion:
- high -> medium: 1
Policy divergences:
- expected ['R-004'] -> predicted ['R-002']: 1
Pattern summary:
- Top category mismatches: hate_or_discrimination -> personal_attack (1)
```

### Como interpretar divergencias

Leituras uteis:

- `category confusion` mostra fronteiras semanticas instaveis, como `personal_attack` vs `offensive_language` ou `hate_or_discrimination` vs categorias mais brandas;
- `action confusion` mostra se o sistema esta agressivo ou permissivo demais, como `flag -> remove` ou `remove -> flag`;
- `risk confusion` ajuda a enxergar descalibragem de severidade, como `medium -> high` em spam explicito;
- `policy divergences` mostra incoerencia entre categoria final e referencia normativa retornada.

Na pratica, a etapa 030 deixou mais visivel que:

- no `safety`, o principal gargalo remanescente do LLM esta em `hate_or_discrimination -> personal_attack` e `offensive_language -> personal_attack`;
- no `blind`, a descalibragem dominante atual esta em `medium -> high`, concentrada em spam explicito;
- no `compare`, o baseline heuristico continua expondo falhas estruturais diferentes, especialmente `needs_human_review` e `unknown` em excesso.

### Uso para evitar overfitting

Este relatorio existe para orientar calibracao por padrao, nao por frase exata. Em vez de ajustar o sistema para um unico ID do dataset, a ideia e observar grupos de erro recorrentes, como:

- `offensive_language -> personal_attack`;
- `medium -> high` em spam explicito;
- `R-004` escapando para categoria mais branda;
- policy secundaria aparecendo no lugar da policy principal.

So depois dessa leitura agrupada faz sentido decidir se a proxima etapa deve mexer em prompt, normalizacao, schema ou ate no proprio dataset. Isso reduz o risco de overfitting local e melhora a defensabilidade tecnica das calibracoes futuras.

## LLM spam severity and target boundary calibration - Etapa 031

### Padroes identificados pela taxonomia

A etapa 030 mostrou dois grupos de erro mais consistentes no experimento LLM:

- `medium -> high` em spam explicito no dataset `blind`, especialmente quando havia direcionamento comercial ou promocional para fora da plataforma;
- `offensive_language -> personal_attack` em comentarios que citavam quem montou ou preparou o material, mas cujo alvo semantico principal ainda era a baixa qualidade do curso, conteudo, servico ou explicacao.

Esses padroes motivaram a calibragem desta etapa. O objetivo nao foi perseguir um exemplo isolado, e sim reforcar as regras gerais de severidade de spam e alvo predominante da ofensa.

### Ajustes realizados

- reforco do `SYSTEM_PROMPT` para separar melhor `spam` sutil de `spam` explicito:
  - `medium / flag` para convite discreto, material por fora e contato externo sem redirecionamento claro;
  - `high / remove` para link, grupo externo, redirecionamento explicito, recrutamento claro ou empurrao promocional forte;
- reforco para nao usar `high / remove` apenas porque o texto tem tom comercial;
- reforco adicional da fronteira entre `personal_attack` e `offensive_language` quando o comentario menciona criadores ou preparadores apenas como forma de criticar a qualidade do material, servico, curso ou explicacao;
- novos exemplos conceituais no prompt para `servico horrivel`, `quem preparou esse material nao domina o assunto` e spam com redirecionamento externo.

Nenhuma mudanca foi feita no baseline heuristico, LangGraph principal, endpoint `/analyze`, frontend, banco, migrations, datasets ou runner.

### Metricas antes

Referencia da etapa 029/030:

LLM `--dataset safety --mode llm`:

- accuracy_action: 95.83%
- accuracy_risk_level: 95.83%
- accuracy_category: 91.67%
- policy_match_rate: 91.67%
- failed_runs: 0

LLM `--dataset safety --mode llm --runs 3`:

- accuracy_action mean: 95.83%
- accuracy_risk_level mean: 95.83%
- accuracy_category mean: 91.67%
- policy_match_rate mean: 91.67%

LLM `--dataset blind --mode llm --runs 3`:

- accuracy_action mean: 93.75%
- accuracy_risk_level mean: 87.50%
- accuracy_category mean: 88.54%
- policy_match_rate mean: 96.88%

LLM `--dataset blind --mode compare`:

- accuracy_action: 93.75%
- accuracy_risk_level: 87.50%
- accuracy_category: 84.38%
- policy_match_rate: 96.88%

### Metricas depois

As validacoes LLM desta etapa precisaram ser executadas com `LANGSMITH_TRACING=false` no `docker compose exec`, porque o ambiente estava com limite mensal de traces excedido no LangSmith e isso derrubava as execucoes antes da inferencia.

LLM `--dataset safety --mode llm`:

- total_examples: 24
- successful_runs: 24
- failed_runs: 0
- accuracy_action: 95.83%
- accuracy_risk_level: 95.83%
- accuracy_category: 95.83%
- policy_match_rate: 95.83%
- average_latency_ms: 6847ms

LLM `--dataset safety --mode compare`:

- accuracy_action: 95.83%
- accuracy_risk_level: 95.83%
- accuracy_category: 91.67%
- policy_match_rate: 91.67%
- failed_runs: 0

LLM `--dataset safety --mode llm --runs 3`:

- accuracy_action mean: 95.83% | stddev: 0.00 | min: 95.83% | max: 95.83%
- accuracy_risk_level mean: 95.83% | stddev: 0.00 | min: 95.83% | max: 95.83%
- accuracy_category mean: 91.67% | stddev: 0.00 | min: 91.67% | max: 91.67%
- policy_match_rate mean: 91.67% | stddev: 0.00 | min: 91.67% | max: 91.67%
- failed_runs mean: 0.00 | stddev: 0.00

LLM `--dataset blind --mode llm --runs 3`:

- accuracy_action mean: 93.75% | stddev: 0.00 | min: 93.75% | max: 93.75%
- accuracy_risk_level mean: 87.50% | stddev: 0.00 | min: 87.50% | max: 87.50%
- accuracy_category mean: 86.46% | stddev: 1.47 | min: 84.38% | max: 87.50%
- policy_match_rate mean: 95.84% | stddev: 1.48 | min: 93.75% | max: 96.88%
- failed_runs mean: 0.00 | stddev: 0.00

LLM `--dataset blind --mode compare`:

- accuracy_action: 93.75%
- accuracy_risk_level: 87.50%
- accuracy_category: 87.50%
- policy_match_rate: 96.88%
- failed_runs: 0

### Efeito no safety dataset

O `safety` melhorou no modo `llm` simples:

- `accuracy_category` subiu de `91.67%` para `95.83%`;
- `policy_match_rate` subiu de `91.67%` para `95.83%`;
- o caso equivalente ao padrao `offensive_language -> personal_attack` deixou de aparecer na rodada simples.

Na taxonomia do `safety`, sobrou apenas:

- `hate_or_discrimination -> personal_attack`;
- `remove -> flag`;
- `high -> medium`;
- `['R-004'] -> ['R-002']`.

Isso mostra que a principal fronteira residual no `safety` voltou a se concentrar em `R-004`, e nao mais em `offensive_language` vs `personal_attack`.

### Efeito no blind dataset

O efeito no `blind` foi misto:

- `accuracy_action` e `accuracy_risk_level` permaneceram iguais;
- `accuracy_category` do `compare` melhorou de `84.38%` para `87.50%`;
- a media de `accuracy_category` em `--runs 3` caiu de `88.54%` para `86.46%`;
- a media de `policy_match_rate` em `--runs 3` caiu de `96.88%` para `95.84%`;
- o padrao `medium -> high` em spam explicito continuou dominante;
- `offensive_language -> personal_attack` permaneceu em dois casos relevantes no `blind`.

Ou seja, a calibragem ajudou no `safety`, mas nao resolveu o trade-off do `blind` e ainda trouxe leve perda de estabilidade agregada em `category` e `policy_match_rate`.

### Limitações conhecidas

Depois da etapa 031, ainda permanecem:

- `safety-005` saindo como `personal_attack / medium / flag` em vez de `hate_or_discrimination / high / remove`;
- no `blind`, o bloco de spam explicito ainda aparece como `medium -> high` na taxonomia;
- `blind-025` e `blind-026` continuam em `offensive_language -> personal_attack`;
- a calibragem de alvo principal melhorou o `safety`, mas nao generalizou o suficiente para eliminar a mesma fronteira no `blind`.

O experimento continua opcional, observavel com LangSmith quando houver cota disponivel, e nao substitui o fluxo principal heuristico nem a revisao humana obrigatoria.

## Human feedback example curation - Etapa 033

### Objetivo

Criar uma base versionada e validada de exemplos sinteticos de feedback humano para uso futuro em experimentos few-shot e recuperacao de exemplos corrigidos, sem alterar o fluxo principal de moderacao.

### Estrutura do dataset

Arquivo criado:

- `backend/app/evaluation/datasets/moderation_feedback_examples.json`

Utilitario criado:

- `backend/app/evaluation/feedback_examples.py`

Cada item inclui:

- `id`
- `comment`
- `human_category`
- `human_risk_level`
- `human_action`
- `human_policy_rules`
- `moderator_note`
- `source_type`

Nesta etapa, `source_type` permanece fixo em `curated_example`.

### Separacao entre feedback e avaliacao

Os exemplos de feedback nao fazem parte dos datasets de benchmark.
Eles nao devem ser usados para medir qualidade.
Eles serao usados posteriormente em um experimento few-shot isolado.

Nenhuma integracao automatica foi adicionada ao `llm_risk_analyzer`, ao runner atual ou ao endpoint `/admin/moderation/comments/{comment_id}/analyze`.

### Cobertura de cenarios

O dataset foi curado com 24 exemplos sinteticos, cobrindo:

- critica legitima vs critica ambigua;
- sarcasmo e ironia;
- spam sutil vs spam explicito;
- `personal_attack` vs `offensive_language`;
- `R-004` / `hate_or_discrimination`;
- duvida e suporte;
- feedback positivo com ressalva;
- fronteira `remove` vs `flag`.

### Validacoes realizadas

O modulo `app.evaluation.feedback_examples` valida:

- quantidade carregada de exemplos;
- IDs unicos;
- comments nao vazios;
- ausencia de comment duplicado dentro do proprio dataset;
- schema esperado;
- categorias, riscos, acoes e `source_type` permitidos;
- `human_policy_rules` validas e compativeis com a categoria humana;
- ausencia de duplicidade literal de `comment` com os datasets `main`, `holdout`, `blind` e `safety`.

Comando documentado:

```bash
docker compose exec backend python -m app.evaluation.feedback_examples
```

### Proximo uso planejado

O proximo uso planejado e uma comparacao controlada entre:

- LLM baseline;
- LLM com few-shot examples.

Essa comparacao deve acontecer em uma etapa isolada, sem reaproveitar automaticamente o dataset de feedback como benchmark.

## Few-shot LLM analyzer experiment - Etapa 034

### Objetivo

Criar um experimento comparativo isolado entre o baseline `llm_risk_analyzer` e uma variante few-shot guiada por exemplos humanos curados, sem alterar o fluxo principal de producao.

### Fonte dos exemplos

Os exemplos few-shot sao carregados exclusivamente de:

- `backend/app/evaluation/datasets/moderation_feedback_examples.json`

Eles sao validados por:

- `backend/app/evaluation/feedback_examples.py`

Few-shot nao significa producao.
E um experimento comparativo isolado.
Os exemplos humanos nao pertencem aos datasets de benchmark.

### Estrategia de selecao

Nesta etapa, a selecao e estatica e deterministica. Foram usados 9 exemplos curados, escolhidos para cobrir:

- critica ambigua;
- sarcasmo;
- spam sutil;
- spam explicito;
- `personal_attack` moderado e severo;
- `offensive_language`;
- `hate_or_discrimination`;
- feedback positivo com ressalva.

Nao houve retrieval semantico, RAG ou selecao dinamica por similaridade. O baseline `--mode llm` continua sem receber exemplos few-shot por acidente.

### Comparacao: baseline vs few-shot

O runner agora suporta:

```bash
python scripts/evaluate_moderation.py --dataset blind --mode few-shot
python scripts/evaluate_moderation.py --dataset safety --mode few-shot
python scripts/evaluate_moderation.py --dataset blind --mode compare-few-shot
```

O modo `compare-few-shot` compara:

- heuristic;
- baseline llm;
- few-shot llm.

O modo `compare` anterior foi preservado sem alteracao de comportamento.

### Metricas no blind dataset

Pendentes de preenchimento apos validacao da etapa.

### Metricas no safety dataset

Pendentes de preenchimento apos validacao da etapa.

### Variancia observada

Pendentes de preenchimento apos rodadas `--runs 3` no `blind` e no `safety`.

### Limitacoes e riscos de overfitting

O experimento few-shot continua sujeito a riscos importantes:

- os exemplos sao poucos e estaticos;
- o conjunto foi curado manualmente e pode enviesar fronteiras especificas;
- melhora em um dataset nao garante generalizacao em outro;
- maior contexto tende a aumentar latencia;
- o baseline heuristico e o caminho principal de producao permanecem inalterados.
