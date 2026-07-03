## Spec: 043 -- Moderation Review Experience and Demo Scenarios

## Objetivo

Melhorar a experiencia de revisao humana e preparar cenarios demonstraveis para portfolio.

A interface deve deixar claro:

```text
A IA recomenda.
O moderador decide.
A decisao fica auditavel.
```

Esta etapa nao cria dashboard tecnico de avaliacao, experimentos ou metricas.

## Escopo

Alterar apenas frontend e documentacao:

- `frontend/app/admin/moderation/`
- `frontend/components/moderation/`
- `docs/moderation-demo-scenarios.md`

## Fora de Escopo

Nao alterar:

- backend;
- endpoints;
- banco;
- migrations;
- LangGraph;
- heuristico;
- prompt;
- analyzer;
- datasets;
- runner;
- LangSmith;
- regras de decisao humana existentes.

## Regras de Implementacao

- Usar comentarios existentes.
- Nao criar comentario automaticamente.
- Nao criar endpoints, migrations ou seeds.
- Nao tratar divergencia como erro.
- Preservar o formulario de decisao humana e o payload atual.
- Manter auditoria secundaria, mas acessivel.
- Nao criar area de experimentos ou metricas.

## Melhorias Esperadas

### Revisao humana

Na tela de detalhe, a decisao humana deve mostrar:

- acao recomendada pela IA;
- categoria sugerida;
- nivel de risco;
- regras relacionadas;
- motivo resumido, usando `ai_justification` quando existir;
- mensagem neutra quando nao houver resumo confiavel.

### Decisao final

A area de decisao humana deve:

- deixar claro que a acao depende do moderador;
- manter envio bloqueado sem decisao;
- bloquear submissao duplicada durante envio;
- mostrar sucesso e erro de forma clara;
- permitir categoria, risco, nota e conteudo final conforme ja existe.

### Comparacao IA versus humano

Exibir:

- concordancia;
- divergencia;
- pendente;
- nao aplicavel.

Quando houver divergencia, mostrar explicitamente:

```text
IA recomendou: ...
Moderador decidiu: ...
```

### Cenarios de demonstracao

Criar area visual `Cenarios para demonstracao` na lista de moderacao com:

- Critica ambigua;
- Spam explicito;
- Conteudo discriminatorio.

Cada cenario deve ter titulo, resumo, o que demonstra e link para abrir o comentario quando encontrado nos dados existentes.

## Documentacao

Criar:

- `docs/moderation-demo-scenarios.md`

Documentar:

- os tres cenarios;
- o que cada um demonstra;
- roteiro de demo de aproximadamente tres minutos;
- como explicar IA, decisao humana e auditoria.

## Validacao

Executar:

```bash
docker compose up -d
docker compose exec frontend npm run lint
docker compose exec -e NODE_ENV=production frontend npm run build
```

Validar manualmente:

- lista de comentarios;
- filtros;
- cenarios de demonstracao;
- detalhe de comentario;
- recomendacao da IA;
- decisao humana;
- comparacao IA vs humano;
- sucesso e erro no envio;
- auditoria;
- regras da comunidade.

## Criterios de Aceite

- spec criada;
- nenhuma alteracao backend;
- decisao humana ganha mais clareza e feedback visual;
- comparacao IA vs humano e compreensivel;
- cenarios de demonstracao ficam visiveis e acessiveis;
- nenhuma decisao e criada automaticamente;
- auditoria permanece secundaria, mas acessivel;
- lint e build passam;
- documentacao de demo criada.

## Proxima Spec Recomendada

```text
044 -- Evaluation and Experiment Dashboard
```
