## Spec: 020 -- LLM Prompt and Schema Tuning

## Objetivo

Melhorar o experimento `llm_risk_analyzer` com tuning controlado de prompt, schema e validacao da saida, sem substituir o baseline heuristico e sem alterar o fluxo principal de producao.

## Contexto

A etapa 019 mostrou que o modo LLM funciona operacionalmente, mas ficou pior que o baseline heuristico no dataset `blind`.

Metricas atuais no `blind --mode compare`:

```text
Heuristic:
accuracy_action: 68.75%
accuracy_risk_level: 68.75%
accuracy_category: 71.88%
policy_match_rate: 100.00%

LLM:
accuracy_action: 59.38%
accuracy_risk_level: 65.62%
accuracy_category: 56.25%
policy_match_rate: 90.62%

Delta LLM vs heuristic:
action_accuracy_delta: -9.37%
risk_level_accuracy_delta: -3.13%
category_accuracy_delta: -15.63%
policy_match_rate_delta: -9.38%
```

Padroes principais de erro observados:

- suavizou casos ambiguos para `approve`;
- deixou passar casos graves de `R-004` e `R-005`;
- foi mais agressivo que o esperado em alguns casos de `spam` e `personal_attack`;
- ficou muito mais lento que o baseline.

## Regra principal

Nao alterar o baseline heuristico.

Nao alterar:

- `backend/app/moderation/graph/nodes.py`;
- `backend/app/moderation/graph/workflow.py`;
- `backend/app/moderation/graph/state.py`;
- endpoint `POST /admin/moderation/comments/{comment_id}/analyze`;
- frontend;
- banco;
- migrations.

Esta etapa deve mexer apenas no experimento LLM, runner e documentacao.

## Escopo

Esta etapa inclui:

- melhorar o prompt do `llm_risk_analyzer`;
- reforcar regras de severidade;
- reforcar tratamento de ambiguidade;
- melhorar instrucoes para `R-004` e `R-005`;
- revisar schema e validacao da saida;
- adicionar pos-validacao leve se necessario;
- atualizar `docs/evaluation.md` com antes e depois;
- rodar avaliacao no `blind` em modo `llm` e `compare`.

## Fora de escopo

- trocar producao para LLM;
- alterar o grafo principal;
- alterar heuristicas;
- alterar datasets para subir metrica;
- adicionar embeddings;
- adicionar `pgvector`;
- adicionar RAG vetorial;
- criar endpoint novo;
- criar frontend;
- criar migrations;
- persistir resultados.

## Estrategia de prompt tuning

O prompt deve ficar mais explicito sobre:

- quando usar `flag` por ambiguidade;
- quando aprovar critica legitima;
- quando aprovar suporte irritado;
- quando classificar `R-004` como severo;
- quando classificar `R-005` como severo;
- como diferenciar `spam` explicito de `spam` sutil.

O prompt deve incluir exemplos curtos de referencia, mas sem hardcode de dataset.

Regra central:

```text
Quando nao houver certeza suficiente para approve ou remove, use flag.
```

## Estrategia de validacao

Garantir que a saida do LLM continue validada com Pydantic para:

- `category`;
- `risk_level`;
- `recommended_action`;
- `confidence`;
- `policy_references`;
- `justification`.

Adicionar pos-validacao leve apenas para:

- deduplicar `policy_references`;
- rejeitar lista vazia de policy quando `category != other`;
- manter `confidence` entre 0 e 1;
- falhar de forma explicita se a resposta vier inconsistente.

Nao corrigir silenciosamente a decisao do LLM.

## Runner

Manter funcionando:

```bash
python scripts/evaluate_moderation.py
python scripts/evaluate_moderation.py --dataset holdout
python scripts/evaluate_moderation.py --dataset blind
python scripts/evaluate_moderation.py --dataset blind --mode llm
python scripts/evaluate_moderation.py --dataset blind --mode compare
```

## Metas desejaveis

Nao e obrigatorio superar o heuristico nesta etapa.

Metas desejaveis para o LLM no `blind`:

```text
accuracy_action >= 65%
accuracy_risk_level >= 65%
accuracy_category >= 65%
policy_match_rate >= 90%
failed_runs = 0
```

Se nao atingir, documentar claramente.

## Documentacao

Atualizar:

```text
docs/evaluation.md
```

Adicionar secao:

```md
## LLM prompt and schema tuning - Etapa 020
```

Com:

- metricas antes;
- padroes de erro do LLM;
- ajustes realizados;
- metricas apos tuning;
- comparacao no `blind`;
- observacoes;
- nota explicita de que o LLM continua experimental e nao substitui decisao humana.

## Criterios de aceite

- spec criada;
- prompt do LLM melhorado;
- schema e validacao revisados;
- runner continua funcionando em modo heuristico;
- runner continua funcionando em modo LLM;
- runner continua funcionando em modo compare;
- endpoint `/analyze` nao muda comportamento;
- nenhum frontend e alterado;
- nenhuma migration e criada;
- nenhum dataset e alterado para melhorar metrica;
- metricas antes e depois documentadas;
- falhas sao tratadas de forma clara.

## Validacao

Executar obrigatoriamente:

```bash
docker compose exec backend python -m compileall app
docker compose exec backend python scripts/evaluate_moderation.py
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind --mode llm
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind --mode compare
```

Opcionalmente executar:

```bash
docker compose exec backend python scripts/evaluate_moderation.py --dataset holdout --mode compare
```

## Resumo final esperado

Ao final, informar:

- spec criada;
- arquivos alterados;
- ajustes no prompt;
- ajustes no schema e validacao;
- metricas antes;
- metricas depois;
- validacoes executadas;
- limitacoes conhecidas;
- proxima spec recomendada.
