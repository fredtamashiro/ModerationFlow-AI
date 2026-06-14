# Spec: 007 -- Moderation Graph Foundation

## Objetivo

Implementar a fundacao inicial do grafo de moderacao com LangGraph, roteamento condicional real e persistencia auditavel.

O fluxo inicial deve executar:

```text
comment
-> input_guard
-> intent_router
-> route-specific path
-> decision_builder
-> waiting_human_review
```

A recomendacao produzida pelo grafo nao e uma decisao final. Toda execucao deve exigir revisao humana.

## Contexto

O projeto ja possui as tabelas `moderation.comments`, `moderation.moderation_runs`, `moderation.moderation_steps`, `moderation.moderation_decisions` e `moderation.feedback_examples`, alem de API e UI para decisao humana.

O backend ja inclui `langgraph==0.2.64`. Esta etapa usa regras heuristicas deterministicas, sem LLM, para estabelecer o contrato e a auditabilidade do workflow.

## Escopo

Esta spec inclui:

- criar `ModerationGraphState`;
- implementar `input_guard` e `intent_router`;
- implementar arestas condicionais reais;
- implementar `spam_fast_path`, `toxic_fast_path`, `low_risk_path`, `ambiguous_deep_review` e `fallback_human_review`;
- implementar `decision_builder`;
- criar `POST /admin/moderation/comments/{comment_id}/analyze`;
- persistir `moderation_runs` e `moderation_steps`;
- atualizar o comentario para `analyzing` e depois `waiting_human_review`;
- registrar falhas sem aprovar automaticamente.

## Fora de escopo

- LLM e prompts;
- RAG, embeddings e `pgvector`;
- guideline retrieval;
- `critic_agent`;
- avaliacao automatizada;
- Langfuse ou LangSmith;
- mudancas no frontend, auth ou migrations;
- criacao automatica de `moderation_decisions`.

## Estrutura do grafo

```text
START
  -> input_guard
       -> fallback_human_review, quando invalido
       -> intent_router, quando valido
            -> spam_fast_path
            -> toxic_fast_path
            -> low_risk_path
            -> ambiguous_deep_review
            -> fallback_human_review
  -> decision_builder
  -> END
```

## Estado do grafo

Criar `ModerationGraphState` com:

```text
comment_id
comment_content
author_name
course_name
lesson_name
input_valid
input_guard_reason
route
route_reason
route_confidence
risk_level
category
confidence
recommended_action
ai_justification
critic_applied
requires_human_review
policy_references
run_id
steps
errors
metadata
```

`steps` deve acumular os nodes executados para persistencia posterior.

## Nodes

### `input_guard`

Validar comentario vazio, curto demais, longo demais ou sem conteudo alfanumerico analisavel. Falhas seguem para `fallback_human_review`.

### `intent_router`

Usar heuristicas deterministicas para selecionar uma rota entre:

```text
spam_fast_path
toxic_fast_path
low_risk_path
ambiguous_deep_review
fallback_human_review
```

### Paths

- `spam_fast_path`: risco `medium`, categoria `spam`, acao `remove`;
- `toxic_fast_path`: risco `high`, categoria `offensive_language`, acao `remove`;
- `low_risk_path`: risco `low`, categoria de suporte ou feedback, acao `approve`;
- `ambiguous_deep_review`: risco `medium`, categoria `ambiguous`, acao `flag`;
- `fallback_human_review`: risco `unknown`, categoria `ambiguous`, acao `needs_human_review`.

Todos devem definir `requires_human_review = true`.

### `decision_builder`

Consolidar a recomendacao e garantir:

```text
requires_human_review = true
critic_applied = false
policy_references = []
```

## Endpoint

Criar endpoint admin protegido:

```text
POST /admin/moderation/comments/{comment_id}/analyze
```

O endpoint deve validar o comentario, executar o grafo e retornar o `moderation_run` final.

## Persistencia

1. Criar `moderation_run` com status `started`.
2. Atualizar o comentario para `analyzing`.
3. Executar o grafo.
4. Persistir um `moderation_step` para cada node executado.
5. Finalizar o run como `waiting_human_review` com a recomendacao consolidada.
6. Atualizar o comentario para `waiting_human_review`.
7. Em erro, marcar o run como `failed`, registrar step de falha e manter o comentario em `waiting_human_review`.

## Logs em `moderation_steps`

Cada step deve registrar:

```text
run_id
node_name
status
duration_ms
metadata
error_message
```

`model`, `input_tokens` e `output_tokens` permanecem null nesta etapa.

## Seguranca

- reutilizar auth admin existente;
- nao criar endpoint publico;
- nunca criar decisao humana automaticamente;
- nunca aprovar automaticamente;
- nao expor erro SQL bruto.

## Criterios de aceite

- endpoint de analise existe e exige admin auth;
- comentario inexistente retorna 404;
- comentario existente gera um run;
- `input_guard` e executado;
- comentarios validos executam `intent_router`;
- uma aresta condicional escolhe o path correspondente;
- `decision_builder` e executado;
- nodes executados geram `moderation_steps`;
- run termina com recomendacao inicial e revisao humana obrigatoria;
- comentario termina em `waiting_human_review`;
- falhas terminam em revisao humana;
- nenhum registro de decisao humana e criado pelo grafo;
- frontend, auth, health checks e migrations permanecem inalterados.

## Validacao

Executar:

```bash
cd backend
py -3 -m compileall app
```

Quando `py` nao estiver disponivel, usar o interpretador Python do ambiente ou o container backend.

## Teste manual via Swagger

1. Acessar `http://localhost:8000/docs`.
2. Fazer login admin.
3. Obter um comentario em `GET /admin/moderation/comments`.
4. Executar `POST /admin/moderation/comments/{comment_id}/analyze`.
5. Consultar `GET /admin/moderation/comments/{comment_id}/runs`.
6. Consultar `GET /admin/moderation/runs/{run_id}/steps`.
7. Confirmar `input_guard`, `intent_router`, o path selecionado e `decision_builder`.
8. Confirmar status `waiting_human_review` no comentario.

## Resumo final esperado

Informar arquivos alterados, endpoint, estrutura e nodes do grafo, roteamento condicional, persistencia dos steps, validacoes, teste manual, limitacoes e proxima spec recomendada.
