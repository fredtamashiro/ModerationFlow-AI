# Observability - ModerationFlow AI

## LangSmith experiment

### Objetivo

Adicionar observabilidade opcional para o experimento `llm_risk_analyzer`, sem alterar o baseline heuristico nem o fluxo principal de producao.

### Variaveis de ambiente

```text
LANGSMITH_TRACING=false
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=moderation-flow-ai-dev
LANGSMITH_ENDPOINT=
```

### Como habilitar

1. Defina `LANGSMITH_TRACING=true`.
2. Preencha `LANGSMITH_API_KEY`.
3. Opcionalmente ajuste `LANGSMITH_PROJECT`.
4. Opcionalmente ajuste `LANGSMITH_ENDPOINT` se estiver usando um endpoint especifico.

Se `LANGSMITH_TRACING=false` ou `LANGSMITH_API_KEY` estiver vazio, nenhum trace e enviado e o runner continua funcionando normalmente.

### Como executar avaliacao com traces

```bash
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind --mode llm
docker compose exec backend python scripts/evaluate_moderation.py --dataset blind --mode compare
```

Nesta etapa, o tracing e aplicado apenas ao experimento LLM.

### O que e registrado

Inputs:

- `comment`
- `prompt`
- `guidelines`

Metadados:

- `dataset`
- `mode`
- `example_id`
- `expected_category`
- `expected_risk_level`
- `expected_action`
- `expected_policy_rules`
- `predicted_category`
- `predicted_risk_level`
- `predicted_action`
- `predicted_policy_references`
- `latency_ms`
- `schema_valid`

Outputs:

- resposta bruta do LLM;
- saida parseada;
- erro de schema ou parsing, quando existir.

### Cuidados de privacidade

- nao enviar dados pessoais reais sem necessidade;
- nao enviar e-mails, CPF, telefone, tokens, senhas ou identificadores sensiveis;
- em producao, aplicar masking ou redaction antes de enviar traces;
- manter LangSmith habilitado apenas em desenvolvimento e avaliacao por enquanto.

Os datasets atuais sao sinteticos e curados, entao o comentario do dataset pode ser enviado no experimento atual. Isso nao deve ser generalizado para comentarios reais em producao sem revisao de privacidade.

### Como desabilitar

Defina:

```text
LANGSMITH_TRACING=false
```

Ou deixe `LANGSMITH_API_KEY` vazio.
