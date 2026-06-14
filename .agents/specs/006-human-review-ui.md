# Spec: 006 -- Human Review UI

## Objetivo

Implementar a interface administrativa para registrar uma decisao humana de moderacao na tela de detalhe do comentario.

Esta etapa conecta o frontend ao endpoint existente:

```text
POST /admin/moderation/comments/{comment_id}/decisions
```

O admin deve conseguir revisar o comentario, registrar a decisao final e visualizar imediatamente o status e o historico atualizados.

## Contexto

O backend ja oferece leitura de comentarios e decisoes, registro transacional de decisao humana, atualizacao do status do comentario e criacao de `feedback_examples`.

O frontend ja possui dashboard administrativo, tela de detalhe, autenticacao admin, `AdminPageShell` e o service `frontend/services/moderationApi.ts`.

## Escopo

Esta spec inclui:

- adicionar formulario de revisao humana ao detalhe do comentario;
- coletar `human_decision`, `human_category`, `human_risk_level`, `moderator_note` e `final_content`;
- adicionar `createHumanDecision(commentId, payload)` ao service;
- impedir envio sem `human_decision`;
- impedir duplo envio durante a requisicao;
- tratar loading, erro e sucesso;
- recarregar comentario e decisoes apos salvar;
- exibir o historico de decisoes humanas.

Esta spec nao inclui:

- alterar backend, banco, migrations ou auth;
- implementar LangGraph, agentes, LLM, RAG ou analise automatica;
- criar novas rotas frontend.

## Tela afetada

Atualizar:

```text
/admin/moderation/comments/[id]
```

Adicionar a secao `Revisao humana` antes do historico de decisoes.

## Service/API frontend

Atualizar `frontend/services/moderationApi.ts` com tipos para o payload e com:

```text
createHumanDecision(commentId, payload)
```

A funcao deve enviar `POST` para `/admin/moderation/comments/{comment_id}/decisions`, usar `credentials: "include"` e retornar a decisao criada.

## Campos do formulario

### `human_decision`

Obrigatorio, com valores:

```text
approve
flag
remove
request_edit
```

### `human_category`

Opcional, com valores:

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

Opcional, com valores:

```text
low
medium
high
unknown
```

### `moderator_note`

Opcional. Texto livre com a justificativa do moderador.

### `final_content`

Opcional. Exibir quando `human_decision` for `request_edit`.

O payload deve incluir `metadata: {}` nesta fase.

## Regras de UX

- labels visuais em portugues e valores enviados em ingles;
- botao de envio desabilitado sem decisao ou durante o salvamento;
- mensagem amigavel de erro;
- mensagem de sucesso apos persistencia;
- limpar o formulario apos sucesso;
- atualizar status e historico sem recarregar a pagina inteira;
- exibir `Nao aplicavel` quando `was_ai_correct` for null;
- nao mencionar recursos de IA como disponiveis.

## Estados

- loading inicial da pagina;
- salvamento em andamento no formulario;
- erro de carregamento da pagina;
- erro de envio da decisao;
- sucesso de envio;
- historico vazio ou preenchido.

## Criterios de aceite

- admin autenticado acessa o detalhe do comentario;
- formulario de revisao humana e exibido;
- envio sem `human_decision` e bloqueado;
- `POST /admin/moderation/comments/{comment_id}/decisions` e executado corretamente;
- botao bloqueia duplo envio;
- status do comentario e atualizado apos salvar;
- decisao criada aparece no historico;
- loading, erro e sucesso sao tratados;
- backend, auth e migrations nao sao alterados;
- nenhuma chamada de IA ou codigo LangGraph e adicionado;
- `npm run lint` passa;
- `npm run build` passa.

## Validacao

Executar:

```bash
cd frontend
npm run lint
npm run build
```

Teste manual:

1. Subir backend e frontend.
2. Fazer login admin.
3. Acessar `/admin/moderation`.
4. Abrir um comentario.
5. Preencher e salvar a revisao humana.
6. Confirmar a mudanca do status.
7. Confirmar a nova entrada no historico.

## Fora de escopo

- LangGraph;
- agentes;
- LLM;
- RAG/pgvector;
- critic agent;
- analise automatica;
- alteracoes no backend ou banco.

## Resumo final esperado

Ao final, informar:

- arquivos criados e alterados;
- componente adicionado;
- funcao de API adicionada;
- tela alterada;
- validacoes executadas;
- teste manual sugerido;
- limitacoes conhecidas;
- proxima spec recomendada.
