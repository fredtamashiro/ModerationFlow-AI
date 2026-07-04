## Spec: 045 -- Portfolio Landing Page and Guided Demo

## Objetivo

Criar uma landing page publica para apresentar o ModerationFlow AI como projeto de portfolio.

A pagina deve explicar:

- problema;
- fluxo de moderacao;
- Human-in-the-Loop;
- avaliacao de estrategias;
- decisao tecnica;
- acesso a demonstracao.

## Escopo

Alterar apenas frontend e documentacao:

- `frontend/app/page.tsx`
- `frontend/components/layout/app-navigation.tsx`
- `docs/portfolio-demo.md`
- `.agents/specs/045-portfolio-landing-page-and-guided-demo.md`

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
- regras de decisao humana.

## Estrutura da Pagina

A rota `/` deve conter:

1. Hero com `ModerationFlow AI`, subtitulo e botoes para demonstracao e avaliacoes.
2. Secao de problema.
3. Fluxo visual de moderacao.
4. Tres cenarios demonstraveis:
   - critica ambigua;
   - spam explicito;
   - conteudo discriminatorio.
5. Secao Human-in-the-Loop.
6. Secao de avaliacao e experimentacao.
7. Bloco de decisao tecnica resumindo o ADR.
8. Lista de tecnologias realmente usadas.
9. Call to action final.

## Regras de Implementacao

- Manter a pagina coerente com a identidade visual administrativa.
- Usar links existentes:
  - `/admin/moderation`
  - `/admin/moderation/evaluations`
- Nao criar endpoints.
- Nao criar execucao de avaliacao pelo navegador.
- Apresentar estrategias com honestidade, sem prometer precisao total.
- Deixar claro que a autenticacao pode ser necessaria para acessar a demonstracao administrativa.

## Documentacao

Criar `docs/portfolio-demo.md` com:

- objetivo da landing;
- jornada recomendada;
- roteiro de 3 a 5 minutos;
- links principais;
- pontos tecnicos para entrevista.

## Validacao

Executar:

```bash
docker compose up -d
docker compose exec frontend npm run lint
docker compose exec -e NODE_ENV=production frontend npm run build
```

Validar manualmente:

- `/`;
- links para fila de moderacao;
- links para avaliacoes;
- cenarios demonstraveis;
- responsividade basica;
- coerencia visual com area administrativa.

## Criterios de Aceite

- spec criada;
- landing page criada ou aprimorada;
- nenhuma alteracao backend;
- fluxo de moderacao explicado;
- Human-in-the-Loop central;
- cenarios de demo acessiveis;
- estrategias tecnicas apresentadas com honestidade;
- link para avaliacoes presente;
- ADR resumido de forma clara;
- lint e build passam;
- documentacao de portfolio criada.

