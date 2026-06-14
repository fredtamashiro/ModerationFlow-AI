## Spec: 011 -- Audit View Runs and Decisions

## Objetivo

Melhorar a visualizacao de auditoria na tela de detalhe do comentario, permitindo comparar de forma clara:

- recomendacao do grafo;
- rota escolhida;
- confianca;
- se o `critic_agent` foi aplicado;
- diretrizes utilizadas;
- decisao humana final;
- se houve divergencia entre recomendacao e decisao humana.

Esta etapa deve reforcar a proposta do projeto como um sistema com rastreabilidade, Human-in-the-Loop e auditoria.

## Contexto

O projeto ja possui:

- execucao do grafo via frontend;
- `moderation_runs`;
- `moderation_steps`;
- `policy_references`;
- `critic_applied`;
- formulario de revisao humana;
- historico de decisoes humanas.

Atualmente a tela mostra o ultimo run e a decisao humana, mas ainda nao destaca claramente a comparacao entre recomendacao do grafo e decisao humana.

## Escopo

Esta etapa inclui:

- melhorar a secao de historico/auditoria no detalhe do comentario;
- exibir historico de runs de forma mais organizada;
- destacar o ultimo run;
- permitir visualizar runs anteriores de forma resumida;
- comparar recomendacao do grafo com decisao humana registrada;
- exibir indicador visual de concordancia/divergencia quando possivel;
- melhorar leitura dos steps, preferencialmente usando accordion ou estrutura colapsavel;
- manter o formulario de revisao humana funcionando.

## Fora de escopo

- alterar backend;
- alterar banco;
- alterar LangGraph;
- alterar Human Review API;
- adicionar LLM;
- adicionar RAG vetorial;
- implementar avaliacao automatica;
- criar novas tabelas.

## Tela afetada

Atualizar:

```text
/admin/moderation/comments/[id]
```

## Comportamento esperado

A tela deve reforcar que a analise do grafo e apenas uma recomendacao inicial e que a decisao final permanece humana.

## Auditoria do ultimo run

A secao do ultimo run deve destacar visualmente:

```text
route
risk_level
category
recommended_action
confidence
critic_applied
requires_human_review
policy_references
ai_justification
```

Adicionar o texto:

```text
A analise do grafo e uma recomendacao inicial. A decisao final deve ser registrada pelo moderador humano.
```

## Comparacao entre recomendacao e decisao humana

Quando existir pelo menos uma decisao humana registrada, comparar:

```text
latest_run.recommended_action
latest_decision.human_decision
```

Exibir um bloco de comparacao com labels em portugues.

Regras:

- se nao houver run, exibir `Nenhuma analise executada ainda`;
- se nao houver decisao humana, exibir `Nenhuma decisao humana registrada ainda`;
- se houver ambos, exibir comparacao;
- se `recommended_action` for `needs_human_review`, tratar como recomendacao sem decisao objetiva;
- se `was_ai_correct` estiver `null`, calcular visualmente apenas por comparacao simples entre acao recomendada e decisao humana, sem alterar o banco.

Labels sugeridas:

```text
Concordancia
Divergencia
Nao aplicavel
Pendente
```

## Historico de runs

Além do ultimo run, exibir lista resumida dos runs anteriores.

Cada item deve mostrar:

```text
created_at
status
route
risk_level
recommended_action
confidence
critic_applied
```

Pode ser lista simples ou accordion.

Nao e necessario permitir selecao detalhada do run nesta etapa, mas pode permitir expandir metadata se for simples.

## Steps do grafo

Melhorar a exibicao dos steps com estrutura colapsavel.

Preferencia:

- usar accordion/collapse por step;
- mostrar `node_name`, `status`, `duration_ms` no cabecalho;
- exibir `metadata` apenas quando expandido;
- exibir `error_message` se existir.

## Policy References

Manter a exibicao de `policy_references`, melhorando a leitura.

Cada item deve mostrar:

```text
code
title
severity
```

## Regras de UX

- manter a tela legivel;
- nao esconder informacao importante;
- evitar blocos JSON muito longos abertos por padrao;
- usar portugues nas labels;
- manter valores tecnicos em ingles;
- nao quebrar o formulario de revisao humana.

## Regras de arquitetura

- nao alterar backend;
- nao alterar banco;
- nao criar endpoints novos;
- nao alterar services existentes se nao for necessario;
- reaproveitar dados ja carregados na tela;
- reaproveitar componentes existentes quando possivel;
- criar componentes pequenos apenas se melhorar a organizacao.

## Criterios de aceite

- tela de detalhe continua carregando comentario;
- ultimo run aparece com informacoes principais;
- historico resumido de runs aparece quando houver mais de um run;
- comparacao entre recomendacao do grafo e decisao humana aparece quando houver ambos;
- a tela diferencia concordancia e divergencia;
- steps do grafo ficam mais legiveis e colapsaveis;
- policy references continuam visiveis;
- formulario de revisao humana continua funcionando;
- nenhum backend e alterado;
- nenhum LangGraph e alterado;
- `npm run lint` passa;
- `npm run build` passa.

## Validacao

```bash
cd frontend
npm run lint
npm run build
```

## Teste manual

1. Subir backend e frontend.
2. Fazer login admin.
3. Acessar `/admin/moderation`.
4. Abrir um comentario.
5. Executar analise, se necessario.
6. Registrar decisao humana.
7. Confirmar que aparece comparacao entre recomendacao e decisao.
8. Executar nova analise no mesmo comentario.
9. Confirmar que o historico de runs aparece.
10. Confirmar que steps continuam visiveis e mais organizados.

## Resumo final esperado

Ao final da implementacao, informar:

- spec criada;
- arquivos alterados;
- componentes criados ou alterados;
- melhorias visuais implementadas;
- como a comparacao entre run e decisao humana funciona;
- validacoes executadas;
- como testar manualmente;
- limitacoes conhecidas;
- proxima spec recomendada.
