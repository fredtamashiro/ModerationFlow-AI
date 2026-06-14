# Spec: 009 -- Confidence Gate and Critic Agent

## Objetivo

Adicionar ao grafo de moderacao um `confidence_gate` e um `critic_agent` para introduzir uma ramificacao real apos `risk_analyzer`.

O fluxo passa a decidir se a recomendacao pode seguir direto para `decision_builder` ou se precisa de revisao adicional:

```text
risk_analyzer
-> confidence_gate
   -> high_confidence -> decision_builder
   -> needs_critic -> critic_agent -> decision_builder
```

A decisao final continua sendo humana. O critico apenas revisa a recomendacao inicial do grafo.

## Contexto

As specs `007` e `008` ja entregaram LangGraph, roteamento condicional, retrieval de diretrizes, analise de risco e persistencia de runs e steps.

Hoje, toda execucao segue diretamente de `risk_analyzer` para `decision_builder`. Esta etapa insere uma avaliacao intermediaria para baixa confianca, alta severidade, remocao ou ambiguidade.

## Escopo

- criar node `confidence_gate`;
- criar node `critic_agent`;
- adicionar `StateGraph.add_conditional_edges` apos `risk_analyzer`;
- expandir o estado com campos do gate e do critico;
- ajustar `decision_builder` para considerar ajustes do critico;
- registrar steps de `confidence_gate` e `critic_agent`;
- persistir `critic_applied` e metadata explicativa no run;
- manter `requires_human_review = true`.

## Fora de escopo

- LLM, OpenAI, prompts ou LangChain;
- RAG vetorial, embeddings ou `pgvector`;
- alteracoes no frontend;
- criacao automatica de `moderation_decisions`;
- migrations, salvo necessidade absoluta;
- health checks e auth.

## Mudancas no grafo

O fluxo evolui para:

```text
input_guard
-> intent_router
-> route-specific path
-> guideline_retriever
-> risk_analyzer
-> confidence_gate
   -> high_confidence -> decision_builder
   -> needs_critic -> critic_agent -> decision_builder
```

## Confidence Gate

O node avalia a saida de `risk_analyzer` e define:

```text
critic_required
critic_reason
confidence_gate_decision
```

Valores:

```text
confidence_gate_decision: high_confidence | needs_critic
```

O critico deve ser acionado quando houver ao menos uma das condicoes:

- `confidence < 0.75`
- `recommended_action == remove`
- `risk_level == high`
- `route == ambiguous_deep_review`
- `category == ambiguous`
- conflito entre `R-003` e `R-006`

## Critic Agent

O critico e heuristico e deterministico. Ele pode:

- reduzir remocao de baixa confianca para `flag`;
- preservar ambiguidade quando existir conflito entre critica legitima e linguagem inadequada;
- confirmar remocao em toxicidade clara;
- manter recomendacao conservadora nos demais casos.

Campos esperados no estado:

```text
critic_applied
critic_summary
critic_agrees
critic_adjusted_action
critic_adjusted_risk_level
critic_adjusted_confidence
```

## Decision Builder

Se houver ajuste do critico, `decision_builder` deve usar os valores ajustados e registrar o resumo do critico em `metadata`.

Se o critico nao for acionado, `critic_applied` permanece `false`.

## Persistencia

`moderation_runs` deve refletir:

- `critic_applied`
- recomendacao final apos o gate/critico
- confidence final
- metadata com motivo do gate e `critic_summary` quando existir

## Moderation Steps

Registrar:

```text
input_guard
intent_router
route-specific path
guideline_retriever
risk_analyzer
confidence_gate
critic_agent, quando acionado
decision_builder
```

## Criterios de aceite

- `confidence_gate` executa apos `risk_analyzer`;
- `confidence_gate` registra step;
- `critic_agent` executa apenas quando necessario;
- `critic_agent` registra step quando executado;
- `decision_builder` usa ajustes do critico quando existirem;
- casos ambiguos, remocao e baixa confianca passam pelo critico;
- casos simples de baixo risco podem pular o critico;
- `critic_applied` e persistido corretamente;
- comentario continua terminando em `waiting_human_review`;
- nenhuma decisao humana e criada automaticamente;
- nenhum frontend e alterado;
- nenhuma chamada de LLM e adicionada.

## Validacao

```bash
docker compose exec backend python -m compileall app
```

## Teste manual via Swagger

1. Fazer login admin em `http://localhost:8000/docs`.
2. Executar `/analyze` para spam, ofensa, ambiguidade e duvida.
3. Consultar runs e steps.
4. Confirmar step `confidence_gate` em todos os casos.
5. Confirmar step `critic_agent` nos casos necessarios.
6. Confirmar ausencia de `critic_agent` em caso simples de baixo risco.
7. Confirmar `critic_applied` no run.
8. Confirmar que `/decisions` continua vazio sem revisao humana.

## Resumo final esperado

Informar arquivos alterados, mudancas no grafo, comportamento do gate e do critico, uso pelo `decision_builder`, steps registrados, validacoes, teste manual, limitacoes e proxima spec recomendada.
