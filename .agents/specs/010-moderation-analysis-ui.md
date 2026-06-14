## Spec: 010 -- Moderation Analysis UI

## Objetivo

Implementar no frontend admin a interface para executar e visualizar a analise de moderacao feita pelo grafo.

O backend ja possui o endpoint:

```text
POST /admin/moderation/comments/{comment_id}/analyze
```

A tela de detalhe do comentario deve permitir que o admin execute a analise e visualize o resultado mais recente antes de registrar a decisao humana final.

## Contexto

O projeto ja possui:

- dashboard admin de comentarios;
- tela de detalhe do comentario;
- formulario de decisao humana;
- Human Review API;
- grafo de moderacao com `guideline_retriever`, `risk_analyzer`, `confidence_gate` e `critic_agent`;
- persistencia de `moderation_runs`;
- persistencia de `moderation_steps`.

Atualmente o fluxo de analise pode ser testado via Swagger, mas ainda nao existe uma acao no frontend para disparar e inspecionar o resultado do grafo.

## Escopo

Esta spec inclui:

- criar funcao frontend para chamar `POST /admin/moderation/comments/{comment_id}/analyze`;
- adicionar botao `Executar analise` na tela de detalhe do comentario;
- exibir loading e bloquear duplo envio durante a analise;
- exibir erro amigavel se a analise falhar;
- recarregar comentario, runs e steps apos sucesso;
- exibir resumo do ultimo `moderation_run`;
- exibir `policy_references`;
- exibir se `critic_agent` foi aplicado;
- exibir os `moderation_steps` do ultimo run;
- manter o formulario de decisao humana existente.

## Fora de escopo

- alterar backend;
- alterar heuristicas do grafo;
- alterar banco ou migrations;
- alterar auth;
- criar novos endpoints;
- implementar LLM, RAG vetorial ou avaliacao automatizada;
- criar novas telas no frontend.

## Tela afetada

Atualizar:

```text
/admin/moderation/comments/[id]
```

## Service/API frontend

Atualizar:

```text
frontend/services/moderationApi.ts
```

Adicionar:

```text
analyzeModerationComment(commentId)
```

A funcao deve:

- chamar `POST /admin/moderation/comments/{comment_id}/analyze`;
- usar `credentials: "include"`;
- seguir o padrao atual do service;
- retornar o `moderation_run` criado.

## Comportamento esperado

Na tela de detalhe do comentario:

- exibir botao `Executar analise`;
- desabilitar o botao enquanto a requisicao estiver em andamento;
- exibir estado de loading no botao;
- impedir duplo clique;
- recarregar comentario, runs e steps apos sucesso;
- mostrar mensagem amigavel em caso de erro.

Tambem deve ficar explicito que a analise do grafo e apenas uma recomendacao inicial e que a decisao final continua sendo humana.

Texto sugerido:

```text
A analise abaixo e uma recomendacao inicial do grafo. A decisao final deve ser registrada pelo moderador na secao de revisao humana.
```

## Resumo do ultimo run

Exibir o ultimo `moderation_run` com os campos:

```text
status
route
risk_level
category
confidence
recommended_action
ai_justification
critic_applied
requires_human_review
policy_references
created_at
updated_at
```

Labels podem estar em portugues. Valores tecnicos devem permanecer em ingles.

## Policy References

Quando `policy_references` existir, exibir:

```text
code
title
severity
```

Se nao houver referencias:

```text
Nenhuma diretriz relacionada encontrada.
```

## Steps do grafo

Usar o endpoint existente:

```text
GET /admin/moderation/runs/{run_id}/steps
```

Exibir:

```text
node_name
status
duration_ms
created_at
metadata
error_message
```

`metadata` pode ser mostrado com JSON formatado.

Se nao houver steps:

```text
Nenhum step registrado para esta analise.
```

## Estados de UI

Tratar:

- loading inicial da pagina;
- loading ao executar analise;
- erro ao carregar comentario;
- erro ao executar analise;
- ausencia de runs;
- ausencia de steps;
- analise executada com sucesso.

## Regras de arquitetura

- nao duplicar logica de fetch fora do service quando ja existir camada apropriada;
- nao alterar backend;
- nao alterar auth;
- nao implementar IA no frontend;
- reaproveitar componentes existentes quando possivel;
- manter labels em portugues e valores tecnicos em ingles.

## Criterios de aceite

- admin autenticado consegue abrir o detalhe de comentario;
- a tela possui botao `Executar analise`;
- o clique chama `POST /admin/moderation/comments/{comment_id}/analyze`;
- durante a analise o botao fica desabilitado e em loading;
- apos sucesso o ultimo run aparece na tela;
- apos sucesso o status do comentario e atualizado;
- `policy_references` aparecem quando existirem;
- os `moderation_steps` do ultimo run aparecem;
- `critic_applied` aparece visualmente;
- o formulario de decisao humana continua funcionando;
- nenhum backend e alterado;
- nenhum codigo de LLM ou LangGraph e alterado;
- `npm run lint` passa;
- `npm run build` passa.

## Validacao

Executar:

```bash
cd frontend
npm run lint
npm run build
```

## Teste manual

1. Rodar backend e frontend.
2. Fazer login admin.
3. Acessar `/admin/moderation`.
4. Abrir um comentario.
5. Clicar em `Executar analise`.
6. Confirmar que o ultimo run aparece na tela.
7. Confirmar que os steps aparecem.
8. Confirmar que `policy_references` aparecem quando aplicavel.
9. Confirmar que `critic_applied` aparece corretamente.
10. Registrar uma decisao humana e confirmar que o fluxo continua funcionando.

## Resumo final esperado

Ao final, informar:

- spec criada;
- arquivos alterados;
- funcao de API adicionada;
- tela alterada;
- componentes adicionados, se houver;
- validacoes executadas;
- como testar manualmente;
- limitacoes conhecidas;
- proxima spec recomendada.
