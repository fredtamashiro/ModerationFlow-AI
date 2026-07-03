## Spec: 042 -- Frontend UX and Information Architecture

## Objetivo

Reorganizar a experiencia frontend administrativa do ModerationFlow AI para deixar clara a jornada operacional:

```text
fila de comentarios
-> analise assistida
-> recomendacao da IA
-> decisao humana
-> auditoria
```

A etapa deve melhorar arquitetura de informacao, navegacao, hierarquia visual, estados vazios e consistencia de layout. Ela nao cria dashboard tecnico de avaliacao de LLM e nao promove experimentos para o fluxo operacional.

## Regra Principal

O produto deve comunicar visualmente:

```text
A IA recomenda.
O moderador decide.
```

A decisao humana deve ser mais importante na interface do que metricas, experimentos ou detalhes internos de LLM.

## Escopo

Alterar apenas frontend e documentacao:

- `frontend/app/admin/moderation/`
- `frontend/components/`
- `frontend/services/`, somente se necessario para usar endpoints existentes
- `frontend/types/`, se existir e for necessario
- `docs/frontend-moderation-ux.md`

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
- runner de avaliacao;
- LangSmith;
- regras de Human-in-the-Loop.

## Regras de Implementacao

- Usar apenas endpoints ja existentes.
- Nao criar area de experimentos, avaliacoes ou metricas.
- Manter diretrizes acessiveis como `Regras da comunidade`.
- Separar visualmente recomendacao da IA e decisao humana.
- Mover detalhes tecnicos de runs, steps e metadata para uma area secundaria de auditoria.
- Preservar o formulario de decisao humana.
- Preservar loading, erro, estados vazios e responsividade basica.
- Reaproveitar design system e componentes existentes.

## Jornada Esperada

### Lista de comentarios

A pagina principal deve funcionar como fila operacional, com filtros por status e cards/lista que mostrem:

- status;
- trecho do comentario;
- autor;
- data;
- categoria e risco recomendados, quando houver run;
- decisao humana, quando houver decision.

### Detalhe do comentario

A pagina deve seguir esta ordem visual:

1. comentario original;
2. analise e recomendacao da IA;
3. decisao humana;
4. auditoria e historico.

### Analise da IA

Exibir de forma clara:

- categoria sugerida;
- nivel de risco;
- acao recomendada;
- regras relacionadas;
- confianca;
- critic agent;
- status da analise.

### Decisao humana

Dar destaque ao formulario e ao ultimo resultado humano:

- aprovar;
- sinalizar;
- remover;
- solicitar edicao;
- categoria final;
- risco final;
- nota do moderador;
- conteudo final editado.

Comparar visualmente recomendacao da IA versus decisao humana:

- concordancia;
- divergencia;
- pendente;
- nao aplicavel.

### Auditoria

Organizar como area secundaria:

- runs;
- steps do grafo;
- critic agent;
- metadata;
- historico de decisoes.

## Documentacao

Criar:

- `docs/frontend-moderation-ux.md`

Documentar:

- jornada do moderador;
- hierarquia da pagina de detalhe;
- papel da recomendacao de IA;
- papel da decisao humana;
- separacao entre operacao e experimentacao.

## Validacao

Executar:

```bash
docker compose up -d
docker compose exec frontend npm run lint
docker compose exec frontend npm run build
```

Validar manualmente:

- lista de comentarios;
- detalhe de comentario;
- analise de IA;
- decisao humana;
- auditoria;
- diretrizes.

## Criterios de Aceite

- spec criada;
- nenhuma alteracao backend;
- pagina principal funciona como fila de moderacao;
- pagina de detalhe segue fluxo comentario -> IA -> decisao humana -> auditoria;
- recomendacao IA e decisao humana estao visualmente separadas;
- auditoria fica secundaria, mas acessivel;
- diretrizes continuam acessiveis;
- estados vazios e loading sao claros;
- responsividade basica preservada;
- documentacao frontend criada.

## Proxima Spec Recomendada

```text
043 -- Moderation Review Experience and Demo Scenarios
```
