## Spec: 012 -- Evaluation Dataset and Runner

## Objetivo

Criar uma primeira estrutura de avaliacao para o motor de moderacao do ModerationFlow AI.

O projeto ja possui um grafo funcional com:

- roteamento condicional;
- recuperacao deterministica de diretrizes;
- analise de risco;
- `confidence_gate`;
- `critic_agent`;
- persistencia de runs e steps;
- revisao humana;
- auditoria visual.

Agora precisamos medir a qualidade das recomendacoes do grafo usando um dataset rotulado.

## Contexto

O projeto ainda nao usa LLM no grafo. A avaliacao inicial servira como baseline heuristico.

Em etapas futuras, quando adicionarmos LLM, RAG vetorial ou melhorias de prompt, poderemos comparar os resultados contra este baseline.

## Escopo

Esta etapa inclui:

- criar um dataset JSON com comentarios de avaliacao;
- criar runner de avaliacao;
- executar o fluxo de analise do grafo para cada item;
- comparar a saida do grafo com o esperado;
- calcular metricas simples;
- imprimir relatorio no terminal;
- registrar falhas de execucao;
- documentar como executar a avaliacao.

## Fora de escopo

- alterar o grafo;
- alterar heuristicas;
- alterar backend API;
- alterar frontend;
- alterar banco de dados de producao;
- criar novas migrations;
- adicionar LLM;
- adicionar RAG vetorial;
- adicionar embeddings;
- usar Langfuse/LangSmith;
- criar dashboard de avaliacao.

## Formato do dataset

Criar:

```text
backend/app/evaluation/datasets/moderation_eval.json
```

Cada item deve conter:

```json
{
  "id": "eval-001",
  "comment": "Esse curso e uma perda de tempo.",
  "expected_category": "legitimate_criticism",
  "expected_risk_level": "low",
  "expected_action": "approve",
  "expected_policy_rules": ["R-006"],
  "notes": "Critica negativa, mas sem ofensa direta."
}
```

Campos obrigatorios:

```text
id
comment
expected_category
expected_risk_level
expected_action
expected_policy_rules
```

Campo opcional:

```text
notes
```

O dataset deve ter entre 30 e 50 exemplos, cobrindo spam, ofensa, critica legitima, suporte, feedback positivo, ambiguidade, discriminacao e conteudo perigoso/ilegal.

## Metricas

Calcular e exibir:

```text
total_examples
successful_runs
failed_runs
accuracy_action
accuracy_risk_level
accuracy_category
policy_match_rate
average_latency_ms
```

`policy_match_rate` deve considerar match quando pelo menos uma policy esperada aparece entre as `policy_references` previstas.

## Runner

Criar:

```text
backend/scripts/evaluate_moderation.py
```

O script deve:

1. carregar o dataset JSON;
2. executar o grafo para cada comentario;
3. comparar o resultado previsto com o esperado;
4. calcular metricas;
5. imprimir relatorio textual no terminal.

Preferencia forte: executar o grafo em memoria, sem persistir `moderation_runs` nem `moderation_steps`.

## Criterios de aceite

- dataset JSON criado com pelo menos 30 exemplos;
- script de avaliacao criado;
- script executa sem erro;
- metricas sao impressas no terminal;
- divergencias sao exibidas;
- a avaliacao nao altera frontend;
- a avaliacao nao adiciona LLM;
- a avaliacao nao adiciona embeddings;
- a avaliacao nao altera migrations;
- o backend continua compilando;
- o comportamento do endpoint `/analyze` nao e quebrado.

## Validacao

```bash
cd backend
python -m compileall app
python scripts/evaluate_moderation.py
```

Com Docker:

```bash
docker compose exec backend python -m compileall app
docker compose exec backend python scripts/evaluate_moderation.py
```

## Comando de execucao

```bash
cd backend
python scripts/evaluate_moderation.py
```

## Resumo final esperado

Ao final, informar:

- spec criada;
- dataset criado;
- quantidade de exemplos;
- script criado;
- se a avaliacao persiste ou nao dados;
- metricas geradas;
- validacoes executadas;
- como rodar manualmente;
- limitacoes conhecidas;
- proxima spec recomendada.
