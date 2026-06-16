## Spec: 023 -- LangSmith Observability Experiment

## Objetivo

Adicionar observabilidade com LangSmith apenas no experimento LLM, sem alterar o baseline heuristico, sem alterar o grafo principal e sem alterar o endpoint `/admin/moderation/comments/{comment_id}/analyze`.

## Contexto

O experimento LLM ja foi ajustado nas etapas 019, 020, 021 e 022.

No dataset `blind`, o resultado atual do LLM e:

```text
accuracy_action: 71.88%
accuracy_risk_level: 78.12%
accuracy_category: 71.88%
policy_match_rate: 93.75%
average_latency_ms: ~5463ms
```

Comparado com o heuristico:

```text
action_accuracy_delta: +3.13%
risk_level_accuracy_delta: +9.37%
category_accuracy_delta: 0.00%
policy_match_rate_delta: -6.25%
```

O LLM ja mostra valor em acao e risco, mas ainda e lento e ainda erra categorias proximas. A proxima necessidade e tornar essas execucoes observaveis.

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

Alterar apenas o experimento LLM, configuracao, runner se necessario e documentacao.

## Escopo

Esta etapa inclui:

- adicionar integracao opcional com LangSmith no experimento LLM;
- instrumentar somente o `llm_risk_analyzer`;
- enviar traces apenas quando tracing estiver habilitado por variavel de ambiente;
- manter o modo heuristico funcionando sem LangSmith;
- manter o modo LLM funcionando mesmo com LangSmith desabilitado;
- documentar variaveis de ambiente;
- atualizar `docs/development-runbook.md` e criar `docs/observability.md`;
- validar que o runner continua funcionando.

## Fora de escopo

- alterar heuristicas;
- alterar prompt para melhorar metrica;
- alterar datasets;
- trocar producao para LLM;
- adicionar RAG vetorial;
- adicionar embeddings;
- adicionar `pgvector`;
- criar endpoint novo;
- alterar frontend;
- criar migrations;
- persistir traces no banco local.

## Variaveis de ambiente

Adicionar no `.env.example`:

```text
LANGSMITH_TRACING=false
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=moderation-flow-ai-dev
LANGSMITH_ENDPOINT=
```

Se houver compatibilidade simples com variaveis antigas como `LANGCHAIN_TRACING_V2`, ela pode ser preservada, mas o padrao principal desta etapa deve ser baseado nas variaveis atuais do LangSmith.

## Estrategia de instrumentacao

Instrumentar somente o fluxo experimental LLM.

Arquivos provaveis:

```text
backend/app/moderation/llm/analyzer.py
backend/app/moderation/llm/prompt.py
backend/scripts/evaluate_moderation.py
```

Se fizer sentido, criar:

```text
backend/app/observability/
backend/app/observability/__init__.py
backend/app/observability/langsmith.py
```

A instrumentacao deve ser opcional.

Se `LANGSMITH_TRACING=false` ou `LANGSMITH_API_KEY` estiver vazio:

- nao enviar traces;
- nao quebrar execucao;
- nao exigir LangSmith para modo heuristico;
- nao exigir LangSmith para modo LLM.

## O que registrar no trace

Registrar metadados uteis:

```text
dataset
mode
example_id
expected_category
expected_risk_level
expected_action
expected_policy_rules
predicted_category
predicted_risk_level
predicted_action
predicted_policy_references
latency_ms
schema_valid
```

Tambem registrar:

- comentario analisado;
- prompt enviado;
- resposta bruta do LLM;
- saida parseada;
- erros de schema ou parsing, quando existirem.

## Cuidados de privacidade

Documentar claramente:

- nao enviar dados pessoais reais sem necessidade;
- nao enviar e-mails, CPF, telefone, tokens, senhas ou identificadores sensiveis;
- em producao, aplicar masking ou redaction;
- manter LangSmith habilitado apenas em desenvolvimento e avaliacao por enquanto.

## Runner

Manter funcionando:

```bash
python scripts/evaluate_moderation.py
python scripts/evaluate_moderation.py --dataset blind
python scripts/evaluate_moderation.py --dataset blind --mode llm
python scripts/evaluate_moderation.py --dataset blind --mode compare
```

Com LangSmith desabilitado, tudo deve continuar igual.

Com LangSmith habilitado e `LANGSMITH_API_KEY` configurado, as execucoes de `llm` e `compare` devem gerar traces do LLM experimental.

Preferencia: instrumentar apenas o modo LLM nesta etapa.

## Documentacao

Criar `docs/observability.md` com:

- objetivo;
- variaveis de ambiente;
- como habilitar;
- como executar avaliacao com traces;
- o que e registrado;
- cuidados de privacidade;
- como desabilitar.

Tambem adicionar um link curto em `docs/development-runbook.md` apontando para `docs/observability.md`.

## Criterios de aceite

- spec criada;
- LangSmith e opcional;
- modo heuristico continua funcionando sem LangSmith;
- modo LLM continua funcionando com LangSmith desabilitado;
- modo LLM gera traces quando LangSmith esta habilitado;
- nenhum frontend e alterado;
- nenhuma migration e criada;
- nenhum dataset e alterado;
- endpoint `/analyze` nao muda comportamento;
- documentacao de observabilidade criada;
- cuidados de privacidade documentados;
- validacoes executadas.

## Validacao

Executar obrigatoriamente com LangSmith desabilitado:

```bash
docker compose exec backend python -m compileall app
docker compose exec backend python scripts/evaluate_moderation.py
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind --mode llm
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind --mode compare
```

Se `LANGSMITH_API_KEY` estiver configurado e o tracing estiver habilitado, executar tambem:

```bash
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind --mode llm
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind --mode compare
```

## Resumo final esperado

Ao final, informar:

- spec criada;
- arquivos alterados;
- como LangSmith foi isolado;
- variaveis adicionadas;
- como habilitar e desabilitar;
- comandos de validacao;
- se traces foram gerados com chave real;
- limitacoes conhecidas;
- proxima spec recomendada.
