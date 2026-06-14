## Spec: 013 -- Evaluation Baseline Tuning

## Objetivo

Melhorar o baseline heuristico do motor de moderacao com base nas divergencias encontradas pela avaliacao.

## Contexto

O grafo atual possui:

- `input_guard`;
- `intent_router`;
- paths condicionais;
- `guideline_retriever`;
- `risk_analyzer`;
- `confidence_gate`;
- `critic_agent`;
- `decision_builder`;
- runner de avaliacao em memoria;
- dataset rotulado.

## Metricas iniciais

Baseline atual antes do tuning:

```text
total_examples: 35
successful_runs: 35
failed_runs: 0
accuracy_action: 60.00%
accuracy_risk_level: 74.29%
accuracy_category: 85.71%
policy_match_rate: 100.00%
average_latency_ms: 5ms
```

## Escopo

Esta etapa inclui:

- rodar o evaluation runner atual;
- analisar divergencias impressas pelo runner;
- identificar padroes de erro;
- ajustar heuristicas do grafo de forma conservadora;
- melhorar regras de `recommended_action`;
- calibrar `confidence` quando necessario;
- ajustar comportamento do `critic_agent` quando ele estiver reduzindo ou mantendo acoes de forma inadequada;
- rodar novamente a avaliacao;
- registrar metricas antes/depois em documentacao;
- manter avaliacao em memoria;
- manter decisao humana obrigatoria.

## Fora de escopo

- adicionar LLM;
- adicionar OpenAI;
- adicionar RAG vetorial;
- adicionar embeddings;
- adicionar `pgvector`;
- alterar frontend;
- alterar banco;
- criar migrations;
- alterar endpoints;
- adicionar Langfuse/LangSmith;
- usar LLM as Judge.

## Estrategia de analise

Rodar:

```bash
cd backend
python scripts/evaluate_moderation.py
```

Ou via Docker:

```bash
docker compose exec backend python scripts/evaluate_moderation.py
```

Classificar divergencias em grupos como:

- acao muito severa;
- acao muito permissiva;
- critica legitima tratada como ambigua;
- spam nao removido;
- conteudo perigoso nao escalado corretamente;
- `critic_agent` reduziu severidade indevidamente;
- confidence incoerente.

## Tipos de ajustes permitidos

- melhorar keywords usadas pelo `intent_router`;
- melhorar mapeamento de `route` para categoria;
- melhorar mapeamento de diretrizes para acao;
- ajustar regras do `risk_analyzer`;
- ajustar thresholds do `confidence_gate`;
- ajustar regras do `critic_agent`;
- ajustar `confidence` heuristica;
- melhorar `ai_justification`;
- ajustar dataset somente se houver erro claro de rotulagem.

## Criterios de aceite

- evaluation runner continua executando sem erro;
- dataset continua com pelo menos 30 exemplos;
- a avaliacao continua em memoria;
- metricas antes/depois sao documentadas;
- ajustes sao conservadores e explicaveis;
- `accuracy_action` melhora ou, se nao melhorar, ha explicacao clara;
- `policy_match_rate` nao cai abaixo de 90%;
- `failed_runs` permanece 0;
- nenhuma chamada de LLM e adicionada;
- nenhum frontend e alterado;
- nenhuma migration e criada;
- endpoints existentes nao sao quebrados;
- health checks continuam funcionando.

## Validacao

```bash
docker compose exec backend python -m compileall app
docker compose exec backend python scripts/evaluate_moderation.py
```

## Documentacao do antes/depois

Preferencia: criar ou atualizar:

```text
docs/evaluation.md
```

O documento deve registrar:

- baseline inicial;
- padroes de divergencia encontrados;
- ajustes da etapa 013;
- resultado apos tuning;
- limitacoes do baseline heuristico.
