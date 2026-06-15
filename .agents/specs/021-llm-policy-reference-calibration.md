## Spec: 021 -- LLM Policy Reference Calibration

## Objetivo

Melhorar a calibragem de `policy_references` no experimento `llm_risk_analyzer`, sem alterar o baseline heuristico, sem alterar o grafo principal e sem alterar o endpoint `/admin/moderation/comments/{comment_id}/analyze`.

## Contexto

A etapa 020 melhorou o LLM no dataset `blind`:

```text
LLM antes:
accuracy_action: 59.38%
accuracy_risk_level: 65.62%
accuracy_category: 56.25%
policy_match_rate: 90.62%

LLM depois:
accuracy_action: 68.75%
accuracy_risk_level: 78.12%
accuracy_category: 71.88%
policy_match_rate: 90.62%
average_latency_ms: ~6025ms
```

O LLM empatou com o heuristico em `accuracy_action` e `accuracy_category`, superou em `accuracy_risk_level`, mas ainda perdeu em `policy_match_rate`.

O foco desta etapa e melhorar a consistencia entre categoria, risco, acao recomendada e regras (`R-001` a `R-008`).

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

Alterar apenas o experimento LLM, validacao ou pos-validacao leve se necessario, runner se necessario e documentacao.

## Escopo

Esta etapa inclui:

- melhorar instrucoes de `policy_references` no prompt do LLM;
- reforcar o mapeamento esperado entre categoria e regras;
- melhorar validacao das policies retornadas;
- impedir policies fora do conjunto permitido;
- documentar divergencias de policy no relatorio, se necessario;
- atualizar `docs/evaluation.md` com antes e depois;
- rodar avaliacao no dataset `blind` em modo `llm` e `compare`.

## Fora de escopo

- alterar datasets para melhorar metrica;
- alterar heuristicas;
- trocar producao para LLM;
- adicionar RAG vetorial;
- adicionar embeddings;
- adicionar `pgvector`;
- criar endpoint novo;
- alterar frontend;
- criar migrations;
- persistir resultados.

## Mapeamento esperado de policies

Reforcar no prompt e na calibragem:

```text
spam -> R-001
personal_attack -> R-002
offensive_language -> R-003
hate_or_discrimination -> R-004
dangerous_or_illegal_content -> R-005
legitimate_criticism -> R-006
question_or_support_request -> R-007
positive_feedback -> R-008
ambiguous -> usar a regra mais relevante, frequentemente R-006, R-002 ou R-003 conforme o caso
other -> policy_references pode ser vazio ou conter regra relevante se houver
```

## Regras especificas

- `spam`: quando `category = spam`, exigir `R-001`;
- `personal_attack`: quando `category = personal_attack`, exigir `R-002`, com `R-003` opcional se houver linguagem ofensiva explicita;
- `offensive_language`: quando `category = offensive_language`, exigir `R-003`, com `R-002` opcional se houver ataque direcionado;
- `hate_or_discrimination`: quando `category = hate_or_discrimination`, exigir `R-004`;
- `dangerous_or_illegal_content`: quando `category = dangerous_or_illegal_content`, exigir `R-005`;
- `legitimate_criticism`: quando `category = legitimate_criticism`, exigir `R-006`;
- `question_or_support_request`: quando `category = question_or_support_request`, exigir `R-007`;
- `positive_feedback`: quando `category = positive_feedback`, exigir `R-008`, com `R-006` opcional em elogio com ressalva.

## Pos-validacao leve

Se fizer sentido, adicionar uma funcao pequena e explicita para normalizar `policy_references` do LLM:

- remover policies invalidas;
- remover duplicadas;
- preservar ordem;
- nao inventar policy quando a saida estiver vazia, exceto se houver mapeamento inequivoco pela categoria;
- se adicionar policy por mapeamento inequivoco, registrar isso de forma explicita na justificativa interna se existir.

Importante:

- nao alterar `recommended_action` silenciosamente;
- nao alterar `risk_level` silenciosamente;
- nao alterar `category` silenciosamente.

## Runner

Manter funcionando:

```bash
python scripts/evaluate_moderation.py
python scripts/evaluate_moderation.py --dataset holdout
python scripts/evaluate_moderation.py --dataset blind
python scripts/evaluate_moderation.py --dataset blind --mode llm
python scripts/evaluate_moderation.py --dataset blind --mode compare
```

## Metricas

Registrar antes e depois no `blind`:

```text
accuracy_action
accuracy_risk_level
accuracy_category
policy_match_rate
average_latency_ms
```

Objetivo desejavel:

```text
policy_match_rate >= 95%
```

Sem reduzir de forma relevante:

- `accuracy_action`;
- `accuracy_risk_level`;
- `accuracy_category`.

## Documentacao

Atualizar `docs/evaluation.md` com secao:

```md
## LLM policy reference calibration - Etapa 021
```

Com:

- metricas antes;
- problema observado;
- ajustes realizados;
- metricas apos calibragem;
- comparacao com heuristico;
- observacoes.

## Criterios de aceite

- spec criada;
- prompt do LLM melhora instrucoes de `policy_references`;
- validacao ou pos-validacao de policies revisada;
- runner continua funcionando em modo heuristico;
- runner continua funcionando em modo LLM;
- runner continua funcionando em modo compare;
- endpoint `/analyze` nao muda comportamento;
- nenhum frontend e alterado;
- nenhuma migration e criada;
- nenhum dataset e alterado para melhorar metrica;
- metricas antes e depois documentadas;
- falhas continuam sendo tratadas de forma clara.

## Validacao

Executar:

```bash
docker compose exec backend python -m compileall app
docker compose exec backend python scripts/evaluate_moderation.py
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind --mode llm
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind --mode compare
```

Opcional:

```bash
docker compose exec backend python scripts/evaluate_moderation.py --dataset holdout --mode compare
```

## Resumo final esperado

Ao final, informar:

- spec criada;
- arquivos alterados;
- ajustes no prompt;
- ajustes na validacao ou pos-validacao;
- metricas antes;
- metricas depois;
- validacoes executadas;
- limitacoes conhecidas;
- proxima spec recomendada.
