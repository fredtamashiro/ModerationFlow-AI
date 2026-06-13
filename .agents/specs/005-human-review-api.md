# Spec: 005 -- Human Review API

## Objetivo

Implementar a API administrativa para registrar decisoes humanas de moderacao.

Esta etapa introduz o primeiro fluxo real de Human-in-the-Loop do ModerationFlow AI, ainda sem LangGraph, agentes ou chamadas para LLM.

O objetivo e permitir que um moderador admin revise um comentario e registre uma decisao final, como aprovar, remover, sinalizar ou solicitar edicao.

## Contexto

O projeto ja possui:

- `moderation.comments`;
- `moderation.moderation_decisions`;
- `moderation.feedback_examples`;
- API admin de leitura;
- dashboard admin inicial;
- autenticacao admin existente.

Nesta spec, a decisao humana e a fonte final de verdade.

A IA ainda nao participa do fluxo.

## Escopo

Esta spec inclui:

- criar schema Pydantic para request de decisao humana;
- criar schema Pydantic para response da decisao;
- criar funcao de repository para salvar decisao humana;
- atualizar o status do comentario apos a decisao;
- criar feedback example a partir da decisao humana;
- criar endpoint admin protegido para registrar decisao;
- validar decisoes permitidas;
- tratar erros de comentario inexistente;
- manter auditoria minima via banco.

Esta spec nao inclui:

- implementar LangGraph;
- implementar agentes;
- implementar analise automatica por IA;
- implementar RAG;
- implementar frontend;
- implementar edicao visual no dashboard;
- implementar autenticacao nova;
- alterar migrations, salvo se algum ajuste minimo for indispensavel.

## Endpoint esperado

Criar endpoint protegido:

```text
POST /admin/moderation/comments/{comment_id}/decisions
```

Este endpoint deve exigir autenticacao admin usando o mecanismo existente.

## Request Body

Criar um schema como `HumanDecisionCreate`.

Campos esperados:

```text
human_decision
human_category
human_risk_level
moderator_note
final_content
metadata
```

### `human_decision`

Obrigatorio.

Valores permitidos:

```text
approve
flag
remove
request_edit
```

### `human_category`

Opcional, mas recomendado.

Valores sugeridos:

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

### `human_risk_level`

Opcional.

Valores permitidos:

```text
low
medium
high
unknown
```

### `moderator_note`

Opcional.

Texto livre com a justificativa do moderador.

### `final_content`

Opcional.

Pode ser usado no futuro para armazenar uma versao editada do comentario, quando a decisao for `request_edit`.

### `metadata`

Opcional.

JSON generico.

## Response Body

Criar ou reutilizar schema de `ModerationDecision`.

A resposta deve incluir:

```text
id
comment_id
run_id
ai_recommendation
human_decision
human_category
human_risk_level
moderator_note
final_content
was_ai_correct
metadata
decided_at
created_at
```

Nesta fase:

- `run_id` pode ser null;
- `ai_recommendation` pode ser null;
- `was_ai_correct` pode ser null, pois ainda nao existe recomendacao da IA.

## Regras de status do comentario

Ao registrar uma decisao humana, atualizar `moderation.comments.status`:

```text
approve      -> approved
flag         -> waiting_human_review
remove       -> removed
request_edit -> edit_requested
```

Observacao:
`flag` nesta fase pode manter o comentario como `waiting_human_review`, pois representa que o moderador optou por manter o item sinalizado para acompanhamento.

## Feedback Example

Ao registrar uma decisao, criar tambem um registro em:

```text
moderation.feedback_examples
```

Campos:

```text
comment_text
ai_decision
human_decision
ai_category
human_category
ai_confidence
moderator_note
was_ai_correct
metadata
```

Nesta fase:

- `ai_decision` deve ser null;
- `ai_category` deve ser null;
- `ai_confidence` deve ser null;
- `was_ai_correct` deve ser null;
- `comment_text` deve vir de `moderation.comments.content`;
- `human_decision`, `human_category` e `moderator_note` devem vir do request.

## Repository/Service

Adicionar funcoes no dominio `moderation` para:

```text
create_human_decision(comment_id, payload)
update_comment_status(comment_id, status)
create_feedback_example(...)
```

Se o projeto ja usa service layer, a orquestracao deve ficar no service.

Regras:

- validar se o comentario existe antes de salvar;
- usar transacao para salvar decisao, atualizar comentario e criar feedback example;
- se qualquer etapa falhar, realizar rollback;
- usar SQL parametrizado;
- nao vazar erro SQL bruto na resposta.

## Error Handling

Retornar:

```text
404 se o comentario nao existir
400 se human_decision for invalido
400 se human_risk_level for invalido
401/403 conforme auth existente
500 apenas para erro inesperado
```

## Seguranca

- Endpoint deve ser protegido por admin auth.
- Nao criar endpoint publico.
- Nao criar novo sistema de autenticacao.
- Nao expor informacoes sensiveis em erros.

## Regras de arquitetura

- Rotas devem ser finas.
- Repository deve lidar com SQL.
- Service deve orquestrar regra de negocio.
- Nao implementar IA nesta spec.
- Nao implementar LangGraph nesta spec.
- Nao alterar frontend nesta spec.
- Nao criar worker ou fila nesta spec.

## Criterios de aceite

- Admin autenticado consegue registrar decisao humana para comentario existente.
- Comentario inexistente retorna 404.
- Decisao invalida retorna 400.
- O registro e criado em `moderation.moderation_decisions`.
- O status do comentario e atualizado corretamente.
- Um registro e criado em `moderation.feedback_examples`.
- A operacao ocorre em transacao.
- Endpoints de leitura existentes continuam funcionando.
- Health checks continuam funcionando.
- Nenhuma chamada de IA e adicionada.
- Nenhum codigo LangGraph e adicionado.
- Nenhuma tela frontend e alterada.

## Validacao

Executar:

```bash
cd backend
py -3 -m compileall app
```

Com backend rodando, testar no Swagger:

```text
http://localhost:8000/docs
```

Fluxo manual sugerido:

1. Fazer login admin.
2. Buscar um comentario em `GET /admin/moderation/comments`.
3. Registrar decisao em `POST /admin/moderation/comments/{comment_id}/decisions`.
4. Buscar novamente o comentario.
5. Confirmar status atualizado.
6. Buscar decisoes em `GET /admin/moderation/comments/{comment_id}/decisions`.
7. Confirmar que a decisao foi registrada.

## Fora de escopo

Nao implementar:

- UI de decisao;
- LangGraph;
- agentes;
- RAG;
- critic agent;
- avaliacao automatizada.

## Resumo final esperado

Ao final da implementacao, informar:

- arquivos alterados;
- endpoint criado;
- schemas criados;
- regras de status implementadas;
- como a transacao foi feita;
- validacoes executadas;
- testes manuais sugeridos;
- proxima spec recomendada.

## Criterios finais

- Criar somente o arquivo `.agents/specs/005-human-review-api.md`.
- Nao implementar nada ainda.
- Nao alterar backend, frontend, migrations ou README nesta tarefa.
