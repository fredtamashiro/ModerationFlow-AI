## Spec: 025 -- LLM Harmful Content and Attack Boundary Calibration

## Objetivo

Melhorar a calibracao do experimento `llm_risk_analyzer` nos casos de conteudo prejudicial, ataques pessoais e linguagem ofensiva, sem alterar o baseline heuristico, sem alterar o grafo principal e sem alterar o endpoint `/admin/moderation/comments/{comment_id}/analyze`.

## Contexto

A etapa 024 melhorou bastante o LLM no dataset `blind`:

```text
Antes:
accuracy_action: 68.75%
accuracy_risk_level: 78.12%
accuracy_category: 71.88%
policy_match_rate: 93.75%

Depois:
accuracy_action: 84.38%
accuracy_risk_level: 87.50%
accuracy_category: 81.25%
policy_match_rate: 93.75%
average_latency_ms: ~6269ms
```

Ainda existem limitacoes conhecidas:

- `personal_attack` vs `offensive_language` ainda e imperfeito;
- ha um falso negativo importante em `hate_or_discrimination` / `R-004`;
- ha um caso de spam sutil agressivo demais, usando `remove` quando o esperado e `flag`.

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

- melhorar prompt para diferenciar `personal_attack` e `offensive_language`;
- reforcar deteccao de `hate_or_discrimination` / `R-004`;
- reduzir falso negativo de discriminacao;
- evitar falso positivo de discriminacao por palavra ambigua isolada;
- calibrar spam sutil para `flag` em vez de `remove`;
- manter ganhos da etapa 024 em ambiguidade;
- atualizar `docs/evaluation.md` com antes/depois;
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

## Ajustes desejados no prompt

### `personal_attack` vs `offensive_language`

- usar `personal_attack` quando houver alvo humano claro;
- usar `offensive_language` quando houver agressao verbal contra o conteudo ou sem alvo humano claro;
- se houver ataque humano + linguagem ofensiva, escolher a categoria dominante e incluir `R-002` e `R-003` quando fizer sentido.

### `hate_or_discrimination` / `R-004`

- usar `hate_or_discrimination` quando houver grupo protegido, generalizacao depreciativa, exclusao, inferiorizacao ou preconceito ligado a origem, raca, etnia, religiao, genero, deficiencia ou orientacao;
- nao usar `R-004` quando houver apenas palavra ambigua, critica comum, comparacao generica ou comentario negativo sem referencia a grupo protegido;
- se houver ataque ou generalizacao negativa contra grupo protegido, nao suavizar para `personal_attack`, `offensive_language`, `ambiguous` ou `legitimate_criticism`.

### Spam sutil

- spam explicito deve ser `remove` quando houver link externo, venda direta, promocao clara, grupo externo explicito ou divulgacao comercial;
- spam sutil deve ser `flag` quando houver convite de contato, material por fora, guia por fora, link no perfil ou envio posterior sem promocao explicita;
- nao usar `remove` para spam sutil sem link, venda explicita ou promocao clara.

## Pos-validacao leve

Preferir resolver via prompt.

Se necessario, revisar pos-validacao apenas para:

- preservar consistencia entre `category` e `policy_references`;
- nao corrigir silenciosamente `category`, `risk_level` ou `recommended_action`;
- nao criar regra que force metrica artificialmente.

## LangSmith

Manter LangSmith como observabilidade opcional.

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
accuracy_action >= 84.38%
accuracy_risk_level >= 87.50%
accuracy_category >= 81.25%
policy_match_rate >= 93.75%
failed_runs = 0
```

## Documentacao

Atualizar `docs/evaluation.md` com secao:

```md
## LLM harmful content and attack boundary calibration - Etapa 025
```

## Validacao

Executar:

```bash
docker compose exec backend python -m compileall app
docker compose exec backend python scripts/evaluate_moderation.py
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind --mode llm
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind --mode compare
```
