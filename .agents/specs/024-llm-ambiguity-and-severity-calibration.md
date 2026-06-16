## Spec: 024 -- LLM Ambiguity and Severity Calibration

## Objetivo

Melhorar a calibragem de ambiguidade e severidade do experimento `llm_risk_analyzer`, sem alterar o baseline heuristico, sem alterar o grafo principal e sem alterar o endpoint `/admin/moderation/comments/{comment_id}/analyze`.

## Contexto

A etapa 023 manteve o experimento LLM observavel com LangSmith opcional, mas os resultados no dataset `blind` ainda mostram erros em fronteiras de ambiguidade e severidade:

```text
accuracy_action: 68.75%
accuracy_risk_level: 78.12%
accuracy_category: 71.88%
policy_match_rate: 93.75%
average_latency_ms: ~6411ms
```

Principais divergencias observadas:

- `blind-005`: elogio com ressalva leve ainda pode oscilar entre `positive_feedback` e `legitimate_criticism`;
- `blind-007`, `blind-008`, `blind-011`: critica mais forte ou sarcastica ainda pode ser suavizada para `approve`;
- `blind-015`: spam sutil ainda pode ser escalado demais para `remove`.

## Regra principal

Nao alterar:

- `backend/app/moderation/graph/nodes.py`;
- `backend/app/moderation/graph/workflow.py`;
- `backend/app/moderation/graph/state.py`;
- datasets;
- frontend;
- banco;
- migrations;
- endpoint `/admin/moderation/comments/{comment_id}/analyze`.

Alterar apenas:

- experimento LLM;
- prompt;
- schema/validacao se necessario;
- pos-validacao leve se necessario;
- documentacao.

## Escopo

Esta etapa inclui:

- melhorar o prompt do LLM para calibrar ambiguidade;
- melhorar o prompt do LLM para calibrar severidade de spam sutil;
- reforcar a diferenca entre critica legitima leve, critica ambigua e sarcasmo;
- reforcar a diferenca entre spam sutil `flag` e spam explicito `remove`;
- atualizar `docs/evaluation.md` com antes e depois;
- manter observabilidade LangSmith funcionando;
- rodar avaliacao no `blind` em modo `llm` e `compare`.

## Fora de escopo

- alterar datasets;
- alterar heuristico;
- alterar LangGraph principal;
- trocar producao para LLM;
- adicionar RAG vetorial;
- adicionar embeddings;
- adicionar pgvector;
- criar endpoint novo;
- alterar frontend;
- criar migrations;
- persistir resultados.

## Diretrizes de calibragem

### Critica legitima leve

Criticas leves, objetivas e sem ironia devem continuar como:

```json
{
  "category": "legitimate_criticism",
  "risk_level": "low",
  "recommended_action": "approve",
  "policy_references": ["R-006"]
}
```

### Critica ambigua ou forte

Quando a critica tiver tom mais forte, julgamento depreciativo, frustracao intensa ou avaliacao negativa ampla, preferir:

```json
{
  "category": "ambiguous",
  "risk_level": "medium",
  "recommended_action": "flag",
  "policy_references": ["R-006"]
}
```

Regra importante:

```text
Se o comentario e negativo, mas nao e claramente ofensivo nem claramente simples, use ambiguous/medium/flag.
```

### Sarcasmo

Sarcasmo, ironia ou elogio seguido de negacao deve ser tratado como ambiguo:

```json
{
  "category": "ambiguous",
  "risk_level": "medium",
  "recommended_action": "flag",
  "policy_references": ["R-006"]
}
```

### Elogio com ressalva

Quando o comentario e majoritariamente positivo, mas contem ressalva leve, `positive_feedback` ou `legitimate_criticism` sao aceitaveis, desde que:

```json
{
  "risk_level": "low",
  "recommended_action": "approve"
}
```

### Spam sutil vs spam explicito

Spam explicito deve ser `remove`.

Spam sutil deve ser `flag`, por exemplo:

- `me chama no privado`;
- `me manda mensagem`;
- `tenho material por fora`;
- `posso enviar um guia`;
- `link no perfil`.

Regra importante:

```text
Nao usar remove para spam sutil sem link, venda explicita ou promocao clara. Use flag.
```

## Pos-validacao leve

Permitido:

- garantir que `spam` sutil com indicacao de contato externo nao seja automaticamente escalado para `remove` por normalizacao;
- garantir que `policy_references` continue consistente;
- nao alterar silenciosamente `category`, `risk_level` ou `recommended_action` para perseguir metrica.

Preferencia: resolver via prompt, nao via regra pos-processada.

## LangSmith

Manter LangSmith funcionando como observabilidade opcional.

Se `LANGSMITH_TRACING=true` e `LANGSMITH_API_KEY` estiver configurada, o modo LLM deve continuar gerando traces.

Nao adicionar tracing ao heuristico nesta etapa.

## Metricas

Registrar antes/depois no `blind`:

- `accuracy_action`
- `accuracy_risk_level`
- `accuracy_category`
- `policy_match_rate`
- `average_latency_ms`

Metas desejaveis:

```text
accuracy_action >= 71.88%
accuracy_risk_level >= 78.12%
accuracy_category >= 71.88%
policy_match_rate >= 93.75%
failed_runs = 0
```

## Documentacao

Atualizar `docs/evaluation.md` com secao:

```md
## LLM ambiguity and severity calibration - Etapa 024
```

Com:

- metricas antes;
- problema observado;
- ajustes realizados;
- metricas apos calibragem;
- comparacao com heuristico;
- observacoes.

## Validacao

Executar:

```bash
docker compose exec backend python -m compileall app
docker compose exec backend python scripts/evaluate_moderation.py
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind --mode llm
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind --mode compare
```

Opcional, se LangSmith estiver habilitado:

```bash
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind --mode llm
```

## Criterios de aceite

- spec criada;
- prompt do LLM melhora regras de ambiguidade e severidade;
- runner continua funcionando em modo heuristico;
- runner continua funcionando em modo LLM;
- runner continua funcionando em modo compare;
- LangSmith continua opcional;
- endpoint `/analyze` nao muda comportamento;
- nenhum frontend e alterado;
- nenhuma migration e criada;
- nenhum dataset e alterado para melhorar metrica;
- metricas antes/depois documentadas;
- falhas continuam sendo tratadas claramente.
