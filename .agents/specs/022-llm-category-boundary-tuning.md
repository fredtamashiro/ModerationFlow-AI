## Spec: 022 -- LLM Category Boundary Tuning

## Objetivo

Melhorar a separacao entre categorias proximas no experimento `llm_risk_analyzer`, sem alterar o baseline heuristico, sem alterar o grafo principal e sem alterar o endpoint `/admin/moderation/comments/{comment_id}/analyze`.

## Contexto

A etapa 021 melhorou `policy_match_rate` do LLM no dataset `blind`:

```text
Antes:
accuracy_action: 68.75%
accuracy_risk_level: 78.12%
accuracy_category: 71.88%
policy_match_rate: 90.62%

Depois:
accuracy_action: 68.75%
accuracy_risk_level: 78.12%
accuracy_category: 71.88%
policy_match_rate: 93.75%
average_latency_ms: ~5758ms
```

Agora o foco e melhorar `accuracy_category`, especialmente nas fronteiras entre categorias parecidas.

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

Alterar apenas o experimento LLM, prompt, schema ou validacao se necessario, runner se necessario e documentacao.

## Escopo

Esta etapa inclui:

- melhorar o prompt do LLM para separar categorias proximas;
- adicionar uma secao clara de `category boundary rules` no prompt;
- reforcar exemplos conceituais sem copiar frases exatas dos datasets;
- revisar validacao ou pos-validacao apenas se necessario;
- atualizar `docs/evaluation.md` com antes e depois;
- rodar avaliacao no `blind` em modo `llm` e `compare`.

## Fora de escopo

- alterar datasets;
- alterar heuristicas;
- trocar producao para LLM;
- adicionar RAG vetorial;
- adicionar embeddings;
- adicionar `pgvector`;
- criar endpoint novo;
- alterar frontend;
- criar migrations;
- persistir resultados.

## Fronteiras de categoria a reforcar

- `legitimate_criticism` vs `offensive_language`;
- `legitimate_criticism` vs `personal_attack`;
- `personal_attack` vs `offensive_language`;
- `hate_or_discrimination` vs `personal_attack` ou `offensive_language`;
- `positive_feedback` vs `legitimate_criticism`;
- `question_or_support_request` vs `legitimate_criticism`.

## Regras de fronteira

- usar `legitimate_criticism` quando a critica for sobre curso, aula, didatica, conteudo, profundidade ou organizacao, sem insulto direto;
- usar `offensive_language` quando houver linguagem abusiva, xingamento ou termos ofensivos, mesmo que o alvo seja o conteudo;
- usar `personal_attack` quando a critica atingir diretamente professor, tutor, aluno, equipe ou outra pessoa;
- usar `hate_or_discrimination` somente quando houver grupo protegido, exclusao, generalizacao depreciativa ou discriminacao;
- usar `positive_feedback` quando o comentario for predominantemente positivo;
- usar `legitimate_criticism` em elogio com ressalva quando a ressalva for a parte mais util ou dominante;
- usar `question_or_support_request` quando houver pedido claro de ajuda, acesso, correcao, certificado ou verificacao;
- se houver reclamacao mais pedido de ajuda, priorizar `question_or_support_request`;
- escolher a categoria dominante quando mais de um sinal aparecer.

## Schema e validacao

Manter validacao obrigatoria de:

- `category`;
- `risk_level`;
- `recommended_action`;
- `confidence`;
- `policy_references`;
- `justification`.

Nao criar correcao silenciosa que altere `category` para subir metrica artificialmente.

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

Meta desejavel:

```text
accuracy_category >= 75%
```

Sem reduzir de forma relevante:

- `accuracy_action`;
- `accuracy_risk_level`;
- `policy_match_rate`.

## Documentacao

Atualizar `docs/evaluation.md` com secao:

```md
## LLM category boundary tuning - Etapa 022
```

Com:

- metricas antes;
- problema observado;
- ajustes realizados;
- metricas apos tuning;
- comparacao com heuristico;
- observacoes.

## Criterios de aceite

- spec criada;
- prompt do LLM melhora fronteiras entre categorias;
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
- ajustes na validacao, se houver;
- metricas antes;
- metricas depois;
- validacoes executadas;
- limitacoes conhecidas;
- proxima spec recomendada.
