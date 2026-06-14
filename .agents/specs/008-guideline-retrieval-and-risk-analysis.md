# Spec: 008 -- Guideline Retrieval and Risk Analysis

## Objetivo

Evoluir o grafo de moderacao para recuperar diretrizes cadastradas e produzir uma analise de risco explicitamente fundamentada nas politicas da comunidade.

O fluxo passa a executar:

```text
input_guard
-> intent_router
-> route-specific path
-> guideline_retriever
-> risk_analyzer
-> decision_builder
```

A recomendacao continua sendo apenas uma sugestao para revisao humana obrigatoria.

## Contexto

A spec `007-moderation-graph-foundation.md` criou um LangGraph com roteamento condicional, paths heuristicos, persistencia de runs e auditoria por steps.

O banco ja possui diretrizes seedadas em `moderation.guidelines`. Esta etapa utiliza esses registros de forma estruturada, sem busca vetorial ou LLM.

## Escopo

- carregar diretrizes pelo repository antes da execucao do grafo;
- adicionar `guideline_retriever`;
- adicionar `risk_analyzer`;
- selecionar diretrizes por rota e keywords;
- armazenar diretrizes recuperadas no estado;
- preencher `policy_references` com referencias compactas;
- fundamentar `ai_justification` nos codigos recuperados;
- registrar os novos nodes em `moderation_steps`;
- manter o endpoint `/admin/moderation/comments/{comment_id}/analyze`;
- manter revisao humana obrigatoria.

## Fora de escopo

- LLM, OpenAI ou prompts;
- RAG vetorial, embeddings ou `pgvector`;
- `critic_agent`;
- avaliacao automatizada;
- Langfuse ou LangSmith;
- alteracoes no frontend, auth, migrations ou tabelas.

## Mudancas no grafo

Todos os route-specific paths devem seguir para `guideline_retriever`. Depois, o grafo executa `risk_analyzer` e `decision_builder`.

O roteamento condicional criado na spec anterior permanece inalterado.

## Guideline Retriever

O node recebe:

```text
route
category
comment_content
available_guidelines
```

O repository continua responsavel por SQL. O service carrega o catalogo de diretrizes e o injeta no estado inicial.

O node combina dois criterios:

- codigos sugeridos pela rota;
- codigos sugeridos por keywords do comentario.

Mapeamento inicial por rota:

```text
spam_fast_path        -> R-001
toxic_fast_path       -> R-002, R-003
low_risk_path         -> R-006, R-007, R-008
ambiguous_deep_review -> R-003, R-006
fallback_human_review -> R-006
```

A saida `retrieved_guidelines` deve conter `id`, `code`, `title`, `severity` e um excerpt curto. Quando nao houver match, o node tenta `R-006` e registra o fallback na metadata do step.

## Risk Analyzer

O node recebe rota, comentario e diretrizes recuperadas. Ele confirma ou refina:

```text
risk_level
category
confidence
recommended_action
ai_justification
policy_references
```

Regras iniciais:

- `R-001`: spam, risco `medium`, acao `remove`;
- `R-002` ou `R-003` em rota toxica: linguagem ofensiva, risco `high`, acao `remove`;
- conflito `R-003`/`R-006` em rota ambigua: risco `medium`, acao `flag`;
- `R-007`: pergunta ou suporte, risco `low`, acao `approve`;
- `R-008`: feedback positivo, risco `low`, acao `approve`;
- `R-004`: discriminacao, risco `high`, acao `remove`;
- `R-005`: conteudo perigoso ou ilegal, risco `high`, acao `remove`;
- ausencia de fundamento claro: risco `unknown`, acao `needs_human_review`.

## Policy References

Persistir somente referencias compactas:

```json
[
  {
    "code": "R-003",
    "title": "Linguagem ofensiva",
    "severity": "medium"
  }
]
```

Nao persistir descriptions ou examples completos nesse campo.

## Moderation Steps

Adicionar:

```text
guideline_retriever
risk_analyzer
```

Metadata de retrieval deve informar `matched_codes`, `match_strategy` e uso de fallback. Metadata de risk deve informar resultado e codigos utilizados.

## Seguranca

- `requires_human_review` permanece `true`;
- nenhuma decisao humana e criada automaticamente;
- falhas continuam encaminhadas para revisao humana;
- erros SQL nao sao expostos;
- nenhum endpoint publico e criado.

## Criterios de aceite

- endpoint `/analyze` continua funcionando;
- grafo executa `guideline_retriever` e `risk_analyzer`;
- novos steps sao persistidos;
- `policy_references` e preenchido quando aplicavel;
- `ai_justification` cita codigos recuperados;
- spam, toxicidade, ambiguidade e baixo risco usam diretrizes coerentes;
- comentario termina em `waiting_human_review`;
- nenhuma decisao humana e criada automaticamente;
- nenhuma chamada de LLM, embedding ou `pgvector` e adicionada;
- frontend, auth, health checks e migrations permanecem inalterados.

## Validacao

```bash
cd backend
python -m compileall app
```

Com Docker:

```bash
docker compose exec backend python -m compileall app
```

## Teste manual via Swagger

1. Acessar `http://localhost:8000/docs` e fazer login.
2. Executar `/analyze` para comentarios de spam, ofensa, ambiguidade e duvida.
3. Consultar os runs e seus steps.
4. Confirmar `guideline_retriever` e `risk_analyzer`.
5. Confirmar `policy_references`, justificativa e revisao humana obrigatoria.
6. Confirmar que `/decisions` nao recebeu registro automatico.

## Resumo final esperado

Informar arquivos alterados, mudancas no grafo, comportamento dos novos nodes, politica de referencias, steps, validacoes, teste manual, limitacoes e proxima spec recomendada.
