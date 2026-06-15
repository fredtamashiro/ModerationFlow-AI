## Spec: 019 -- LLM Risk Analyzer Experiment

## Objetivo

Adicionar um experimento de analise de risco com LLM para comparar o baseline heuristico atual em avaliacao offline, sem alterar o fluxo principal de producao.

## Contexto

O projeto ja possui:

- grafo heuristico funcional;
- dataset principal de avaliacao;
- holdout dataset;
- blind validation dataset;
- runner de avaliacao em memoria;
- metricas objetivas;
- documentacao de resultados em `docs/evaluation.md`.

A etapa 018 mostrou boa aderencia do baseline em `main` e `holdout`, mas queda relevante em `blind`:

```text
Blind validation:
accuracy_action: 68.75%
accuracy_risk_level: 68.75%
accuracy_category: 71.88%
policy_match_rate: 100.00%
```

Isso justifica testar uma alternativa com LLM apenas para comparacao experimental.

## Regra principal

Nao substituir o grafo atual.

O endpoint:

```text
POST /admin/moderation/comments/{comment_id}/analyze
```

deve continuar com o mesmo comportamento heuristico atual.

## Por que usar LLM agora

- comparar generalizacao contra o baseline lexical atual;
- medir se o modelo melhora `blind validation` sem retuning manual;
- avaliar ganhos e falhas antes de considerar qualquer mudanca arquitetural maior;
- manter o experimento isolado para nao contaminar o fluxo principal.

## Escopo

Esta etapa inclui:

- criar um componente experimental `llm_risk_analyzer`;
- criar prompt estruturado para moderacao;
- usar guidelines carregadas como contexto textual;
- forcar saida JSON estruturada;
- validar a saida com schema/Pydantic;
- adicionar opcao no runner para comparar baseline heuristico vs LLM;
- suportar `--mode heuristic`, `--mode llm` e `--mode compare`;
- manter suporte a `--dataset main`, `--dataset holdout`, `--dataset blind` e `--dataset-path`;
- contabilizar falhas do LLM em `failed_runs`;
- documentar resultados em `docs/evaluation.md`.

## Fora de escopo

- trocar o grafo principal para LLM;
- alterar frontend;
- criar novos endpoints publicos;
- alterar banco;
- criar migrations;
- adicionar RAG vetorial;
- adicionar embeddings;
- adicionar `pgvector`;
- adicionar Langfuse ou LangSmith;
- persistir resultados do experimento.

## Modelo de execucao experimental

O experimento deve ficar isolado do grafo principal em um modulo proprio:

```text
backend/app/moderation/llm/
```

Ele deve:

1. receber um comentario;
2. receber guidelines ja carregadas como texto;
3. enviar um prompt estruturado ao modelo;
4. validar a resposta com schema Pydantic;
5. retornar uma previsao comparavel ao runner atual.

## Arquitetura sugerida

Criar, se fizer sentido:

```text
backend/app/moderation/llm/__init__.py
backend/app/moderation/llm/schemas.py
backend/app/moderation/llm/prompt.py
backend/app/moderation/llm/analyzer.py
```

## Configuracao

Seguir o padrao de variaveis de ambiente ja existente no projeto:

```text
OPENAI_API_KEY
OPENAI_CHAT_MODEL
```

Se o projeto ja tiver esse padrao em `backend/.env.example`, nao duplicar variaveis.

## Prompt

O prompt deve instruir o modelo a:

- atuar como analisador auxiliar de moderacao;
- nao tomar decisao final;
- classificar o comentario;
- usar apenas as guidelines fornecidas;
- retornar somente JSON valido;
- preferir `flag` quando houver ambiguidade;
- preferir `approve` para critica legitima sem ofensa;
- preferir `remove` para spam claro, discriminacao clara, conteudo perigoso ou ofensa grave;
- nao inferir contexto ausente no comentario;
- nao criar novas categorias, `risk_level`, `recommended_action` ou `policy_references`.

O prompt deve incluir:

- `comment`;
- `guidelines`;
- categorias validas;
- `risk_level` validos;
- `recommended_action` validos;
- schema de saida.

## Schema de resposta

Validar uma estrutura equivalente a:

```json
{
  "category": "legitimate_criticism",
  "risk_level": "low",
  "recommended_action": "approve",
  "confidence": 0.82,
  "policy_references": ["R-006"],
  "justification": "O comentario apresenta critica negativa sobre o curso, mas nao contem ataque pessoal, ofensa ou spam."
}
```

Categorias validas:

```text
spam
personal_attack
offensive_language
hate_or_discrimination
dangerous_or_illegal_content
legitimate_criticism
question_or_support_request
positive_feedback
ambiguous
other
```

Risk levels validos:

```text
low
medium
high
unknown
```

Actions validas:

```text
approve
flag
remove
request_edit
needs_human_review
```

Policy rules validas:

```text
R-001
R-002
R-003
R-004
R-005
R-006
R-007
R-008
```

## Mudancas no runner

Atualizar:

```text
backend/scripts/evaluate_moderation.py
backend/app/evaluation/runner.py
```

Adicionar suporte para:

```bash
python scripts/evaluate_moderation.py --mode heuristic
python scripts/evaluate_moderation.py --mode llm
python scripts/evaluate_moderation.py --mode compare
```

Comportamento:

- `--mode heuristic`: comportamento atual;
- `--mode llm`: avalia usando apenas o LLM experimental;
- `--mode compare`: roda heuristico e LLM e imprime metricas dos dois.

Compatibilidade obrigatoria:

```bash
python scripts/evaluate_moderation.py
```

Esse comando deve continuar usando o modo heuristico.

## Tratamento de erro

Se `OPENAI_API_KEY` nao estiver configurada e o modo for `llm` ou `compare`, falhar com mensagem clara:

```text
OPENAI_API_KEY is required for LLM evaluation mode.
```

Falhas de chamada, timeout, resposta invalida ou erro de validacao devem ser contabilizados em `failed_runs`.

O modo heuristico nao pode quebrar por ausencia de chave.

## Metricas

Manter:

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

No modo `compare`, imprimir:

- resultados heurisiticos;
- resultados LLM;
- deltas de comparacao.

## Documentacao

Atualizar:

```text
docs/evaluation.md
```

Adicionar a secao:

```md
## LLM risk analyzer experiment - Etapa 019
```

Com:

- objetivo;
- como executar;
- metricas heuristicas;
- metricas LLM;
- comparacao;
- observacoes;
- nota explicita de que o LLM e experimental e nao substitui decisao humana.

## Criterios de aceite

- spec criada;
- codigo LLM experimental isolado;
- modo heuristico continua funcionando sem chave OpenAI;
- runner aceita `--mode heuristic`;
- runner aceita `--mode llm`;
- runner aceita `--mode compare`;
- runner continua aceitando `--dataset main`, `--dataset holdout`, `--dataset blind`;
- runner continua aceitando `--dataset-path`;
- saida do LLM e validada por schema;
- falhas do LLM sao contabilizadas;
- documentacao atualizada;
- nenhum frontend e alterado;
- nenhuma migration e criada;
- nenhum endpoint publico e alterado;
- o fluxo principal `/analyze` nao muda de comportamento.

## Validacao

Executar obrigatoriamente:

```bash
docker compose exec backend python -m compileall app
docker compose exec backend python scripts/evaluate_moderation.py
docker compose exec backend python scripts/evaluate_moderation.py --dataset holdout
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind
```

Se houver `OPENAI_API_KEY` configurada, executar tambem:

```bash
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind --mode llm
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind --mode compare
```

Se nao houver chave configurada, validar que:

- o modo heuristico continua funcionando;
- o modo LLM falha com mensagem clara.

## Resumo final esperado

Ao final, informar:

- spec criada;
- arquivos alterados;
- como o LLM experimental foi isolado;
- mudancas no runner;
- comandos disponiveis;
- validacoes executadas;
- se o modo LLM foi testado com chave real ou apenas validado sem chave;
- metricas, se disponiveis;
- limitacoes conhecidas;
- proxima spec recomendada.
