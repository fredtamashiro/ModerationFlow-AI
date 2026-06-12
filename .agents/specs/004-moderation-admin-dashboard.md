# Spec: 004 -- Moderation Admin Dashboard

## Objetivo

Criar o dashboard administrativo inicial do ModerationFlow AI para visualizar comentarios e diretrizes de moderacao.

Esta spec deve implementar apenas uma interface de leitura, consumindo os endpoints admin ja criados na spec `003-moderation-admin-api`.

O objetivo e validar a base visual, autenticacao admin, consumo da API e estrutura inicial do produto antes de implementar LangGraph, agentes, decisoes humanas ou Human-in-the-Loop.

## Contexto

O backend ja possui endpoints protegidos para:

```text
GET /admin/moderation/comments
GET /admin/moderation/comments/{comment_id}
GET /admin/moderation/guidelines
GET /admin/moderation/guidelines/{guideline_id}
GET /admin/moderation/guidelines/code/{code}
GET /admin/moderation/comments/{comment_id}/runs
GET /admin/moderation/runs/{run_id}/steps
GET /admin/moderation/comments/{comment_id}/decisions
```

Tambem ja existem seeds com:

- 8 diretrizes;
- 8 comentarios de exemplo.

Esta spec deve criar uma interface admin para visualizar esses dados.

## Escopo

Esta spec inclui:

- criar area admin inicial de moderacao;
- consumir endpoints admin existentes;
- listar comentarios;
- filtrar comentarios por status;
- visualizar detalhes de um comentario;
- listar diretrizes;
- visualizar detalhes de uma diretriz;
- exibir estado vazio para runs, steps e decisions;
- reaproveitar autenticacao admin existente;
- reaproveitar layout e componentes visuais existentes;
- tratar loading e erro de forma simples.

Esta spec nao inclui:

- implementar LangGraph;
- implementar agentes;
- implementar chamadas para LLM;
- implementar analise automatica de comentarios;
- implementar decisao humana;
- implementar formulario de aprovacao/remocao;
- implementar Human-in-the-Loop;
- implementar RAG;
- alterar backend;
- alterar migrations;
- alterar autenticacao.

## Rotas frontend sugeridas

Criar ou adaptar rotas admin, conforme padrao atual do projeto:

```text
/admin/moderation
/admin/moderation/comments/[id]
/admin/moderation/guidelines
/admin/moderation/guidelines/[id]
```

Se a estrutura atual do Next.js tiver outro padrao, seguir o padrao existente.

## Tela: Dashboard de Moderacao

Rota sugerida:

```text
/admin/moderation
```

Deve exibir:

- titulo: `Moderation Dashboard`;
- breve descricao do modulo;
- cards/resumo simples:
  - total de comentarios;
  - comentarios pendentes;
  - comentarios aguardando revisao humana;
  - comentarios aprovados/removidos, se houver;
- tabela ou lista de comentarios.

A lista de comentarios deve mostrar:

```text
author_name
course_name
lesson_name
status
created_at
```

Acoes disponiveis:

```text
ver detalhes
```

Filtros:

```text
status
```

Paginacao simples:

```text
limit
offset
```

Pode ser simples nesta fase.

## Tela: Detalhe do Comentario

Rota sugerida:

```text
/admin/moderation/comments/[id]
```

Deve exibir:

- autor;
- curso;
- aula;
- conteudo do comentario;
- status;
- metadata, se util;
- data de criacao;
- runs de moderacao relacionados;
- decisions relacionadas.

Como LangGraph e Human-in-the-Loop ainda nao existem, runs e decisions podem aparecer como estado vazio:

```text
Nenhuma analise de IA executada ainda.
Nenhuma decisao humana registrada ainda.
```

Nao criar botoes de decisao nesta spec.

## Tela: Diretrizes

Rota sugerida:

```text
/admin/moderation/guidelines
```

Deve exibir:

- lista de diretrizes;
- codigo;
- titulo;
- severidade;
- descricao resumida.

Filtros:

```text
severity
```

Acao:

```text
ver detalhes
```

## Tela: Detalhe da Diretriz

Rota sugerida:

```text
/admin/moderation/guidelines/[id]
```

Deve exibir:

- code;
- title;
- severity;
- description;
- examples;
- metadata, se util.

## Service/API Frontend

Criar ou adaptar um service no frontend para os endpoints de moderacao.

Sugestao:

```text
frontend/services/moderationApi.ts
```

Funcoes esperadas:

```text
listModerationComments(params)
getModerationComment(id)
listModerationGuidelines(params)
getModerationGuideline(id)
getModerationGuidelineByCode(code)
listCommentRuns(commentId)
listRunSteps(runId)
listCommentDecisions(commentId)
```

Seguir o padrao atual do projeto para chamadas autenticadas.

## Autenticacao

As telas admin devem respeitar o fluxo de autenticacao existente.

Se ja existe protecao de rota admin, reaproveitar.

Nao criar novo sistema de login.

Nao expor endpoints admin em paginas publicas.

## Estados de UI

Cada tela deve tratar:

- loading;
- erro;
- lista vazia;
- dados carregados.

Mensagens devem ser simples e profissionais.

## Textos e identidade

Usar a identidade:

```text
ModerationFlow AI
```

Evitar qualquer referencia a:

```text
SmartDocs
PDF
document chat
Smart Ingest
```

## Regras de arquitetura

- Nao implementar logica de IA no frontend.
- Nao adicionar acoes de decisao humana ainda.
- Nao criar botoes que chamem endpoints inexistentes.
- Nao alterar backend nesta spec.
- Nao alterar banco de dados nesta spec.
- Manter componentes reutilizaveis.
- Evitar duplicacao desnecessaria.
- Seguir o padrao visual ja existente no projeto.

## Criterios de aceite

- Admin autenticado consegue acessar `/admin/moderation`.
- Admin consegue listar comentarios seedados.
- Admin consegue filtrar comentarios por status.
- Admin consegue abrir detalhe de comentario.
- Admin consegue listar diretrizes.
- Admin consegue filtrar diretrizes por severity.
- Admin consegue abrir detalhe de diretriz.
- Telas mostram estados de loading, erro e vazio.
- Frontend usa endpoints reais do backend.
- Nenhuma funcionalidade de IA e implementada.
- Nenhuma decisao humana e implementada.
- Nenhuma referencia SmartDocs aparece nas telas novas.
- `npm run lint` passa.
- `npm run build` passa.

## Validacao

Executar:

```bash
cd frontend
npm run lint
npm run build
```

Se backend for necessario para testar manualmente:

```bash
docker compose up --build
```

Validar manualmente com admin local:

```text
admin@example.com / admin123
```

Acessar:

```text
/admin/moderation
/admin/moderation/guidelines
```

## Resumo final esperado

Ao final da implementacao, informar:

- arquivos criados/alterados;
- rotas frontend adicionadas;
- service/API criado;
- endpoints consumidos;
- validacoes executadas;
- limitacoes conhecidas;
- proxima spec recomendada.
