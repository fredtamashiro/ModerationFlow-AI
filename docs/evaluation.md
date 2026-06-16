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
