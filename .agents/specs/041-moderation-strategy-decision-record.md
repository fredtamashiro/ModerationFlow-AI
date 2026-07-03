## Spec: 041 -- Moderation Strategy Decision Record

## Objetivo

Criar um Architecture Decision Record tecnico para consolidar a estrategia de moderacao recomendada pelo projeto com base nos resultados de avaliacao ja obtidos.

Esta etapa nao implementa nova logica, nao faz tuning e nao altera prompt, datasets, runner, LangGraph, endpoint, frontend, banco, migrations, analyzer, dynamic few-shot, guardrails ou instrumentacao LangSmith.

## Contexto

As etapas anteriores compararam:

- baseline heuristico;
- baseline LLM;
- few-shot estatico;
- dynamic few-shot;
- dynamic few-shot com selection guidance;
- dynamic few-shot com guardrail de seguranca `R-004`.

As validacoes documentadas em `docs/evaluation.md` mostram que:

- o heuristico e rapido, deterministico e auditavel, mas limitado em ambiguidade e generalizacao;
- o baseline LLM generalizou bem no dataset adversarial pos-tuning, mas segue mais lento e sujeito a variancia;
- o few-shot estatico nao trouxe ganho consistente;
- o dynamic few-shot trouxe ganhos localizados e observabilidade util;
- a selection guidance nao mostrou contribuicao isolada consistente;
- o guardrail `R-004` foi forte no dataset safety, mas nao mostrou ganho universal no adversarial pos-tuning.

## Escopo

Criar:

- `docs/architecture/adr-001-moderation-strategy-decision.md`
- `.agents/specs/041-moderation-strategy-decision-record.md`

Atualizar, se fizer sentido:

- `docs/evaluation.md`
- `README.md`

## Fora de Escopo

Nao alterar:

- heuristico;
- LangGraph principal;
- endpoint `/admin/moderation/comments/{comment_id}/analyze`;
- frontend;
- banco;
- migrations;
- datasets;
- prompt;
- analyzer;
- dynamic few-shot;
- guardrails;
- runner de avaliacao;
- instrumentacao LangSmith.

## Regras de Implementacao

- Documentar a decisao tecnica atual, sem inventar metricas novas.
- Separar claramente producao, pesquisa e experimento.
- Explicar por que Human-in-the-Loop continua obrigatorio.
- Documentar datasets e metodologia.
- Explicar ganhos e trade-offs do guardrail `R-004`.
- Manter README curto e apontar detalhes para o ADR.
- Adicionar em `docs/evaluation.md` apenas uma referencia curta ao ADR.

## Decisao Esperada

Registrar:

- fluxo principal/producao: baseline heuristico + Human-in-the-Loop;
- estrategia LLM principal de pesquisa: baseline LLM;
- estrategias experimentais: dynamic few-shot e dynamic few-shot guardrailed;
- guardrail `R-004`: manter como experimento de seguranca avaliado separadamente, sem promocao automatica como regra universal de producao.

## Criterios de Aceite

- spec criada;
- ADR criado;
- nenhuma logica de aplicacao alterada;
- nenhum dataset alterado;
- decisao entre producao, pesquisa e experimento esta explicita;
- Human-in-the-Loop esta justificado;
- guardrail `R-004` esta descrito com ganhos e trade-offs;
- metodologia de datasets esta documentada;
- criterios objetivos para reavaliar a decisao estao presentes;
- README atualizado apenas de forma breve.

## Validacao

Como esta etapa altera apenas documentacao:

```bash
git diff -- .agents/specs/041-moderation-strategy-decision-record.md docs/architecture/adr-001-moderation-strategy-decision.md docs/evaluation.md README.md
git status --short
```
