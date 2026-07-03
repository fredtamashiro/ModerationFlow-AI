## Spec: 044 -- Evaluation and Experiment Dashboard

## Objetivo

Criar uma area administrativa separada para apresentar a estrategia de avaliacao do projeto e os resultados de experimentos documentados.

A tela deve comunicar que o projeto:

- mede estrategias;
- compara resultados;
- registra trade-offs;
- mantem Human-in-the-Loop;
- nao promove LLM automaticamente com base em uma metrica isolada.

## Regra Principal

Deixar explicito:

- fluxo principal: heuristico + Human-in-the-Loop;
- pesquisa principal: baseline LLM;
- experimentos: few-shot, dynamic few-shot e R-004 guardrail.

Nao apresentar a variante guardrailed como melhor modelo geral. A ablacao mostrou ganhos fortes em safety e trade-offs no adversarial pos-tuning.

## Escopo

Alterar apenas frontend e documentacao:

- `frontend/app/admin/moderation/evaluations/page.tsx`
- `frontend/components/moderation/evaluation-dashboard.tsx`
- `frontend/components/moderation/strategy-comparison-table.tsx`
- `frontend/components/moderation/metric-card.tsx`
- `frontend/components/moderation/dataset-card.tsx`
- `frontend/data/moderation-evaluation-snapshot.ts`
- `frontend/types/moderation-evaluation.ts`
- `frontend/components/moderation/admin-moderation-nav.tsx`
- `docs/evaluation-dashboard.md`

## Fora de Escopo

Nao alterar:

- heuristico;
- LangGraph principal;
- endpoint `/admin/moderation/comments/{comment_id}/analyze`;
- banco;
- migrations;
- prompt;
- analyzer;
- dynamic few-shot;
- guardrails;
- datasets;
- runner;
- LangSmith.

Nao criar endpoints novos.

## Fonte dos Dados

Criar fonte local e tipada no frontend com resultados ja documentados em `docs/evaluation.md`.

Cada linha deve identificar:

- dataset;
- estrategia;
- `accuracy_action`;
- `accuracy_risk_level`;
- `accuracy_category`;
- `policy_match_rate`;
- latency;
- failed runs;
- observacoes;
- `snapshot_documented`.

Quando nao houver metrica documentada para uma combinacao, exibir `Nao avaliado`.

## Navegacao

Adicionar `Avaliacoes` na navegacao administrativa de moderacao, separada visualmente da operacao principal.

Nao adicionar:

- configuracoes de modelo;
- deploy de experimento;
- execucao de avaliacao pelo navegador.

## Estrutura da Pagina

Criar `/admin/moderation/evaluations` com:

1. Cabecalho `Avaliacoes e experimentos` e badge `Snapshot de avaliacao`.
2. Card `Estrategia atual do projeto`.
3. Cards de metricas para action, risk, category, policy e latency.
4. Seletor simples de dataset: Main, Holdout, Blind, Safety, Adversarial pos-tuning.
5. Tabela comparativa com heuristico, baseline LLM, few-shot estatico, dynamic few-shot e dynamic few-shot guardrailed.
6. Cards de metodologia para datasets, incluindo feedback examples como nao benchmark.
7. Secao `Principais aprendizados`.
8. Secao `Padroes observados` com erros documentados pela taxonomia offline.

## Design

Seguir o estilo administrativo atual.

Usar cards, tabelas, badges e texto tecnico claro.

Nao introduzir biblioteca de graficos.

## Validacao

Executar:

```bash
docker compose up -d
docker compose exec frontend npm run lint
docker compose exec -e NODE_ENV=production frontend npm run build
```

Validar manualmente:

- `/admin/moderation/evaluations`;
- navegacao entre Comentarios, Regras da comunidade e Avaliacoes;
- troca de dataset;
- cards de metricas;
- tabela comparativa;
- secao de decisao tecnica;
- responsividade basica.

## Criterios de Aceite

- spec criada;
- pagina `/admin/moderation/evaluations` criada;
- navegacao administrativa atualizada;
- nenhuma alteracao backend;
- dados identificados como snapshot documentado;
- nenhum numero inventado;
- estrategia principal, pesquisa e experimentos diferenciados;
- datasets e metodologia claros;
- trade-offs apresentados com honestidade;
- Human-in-the-Loop central;
- lint e build passam;
- documentacao criada.

## Proxima Spec Recomendada

```text
045 -- Portfolio Landing Page and Guided Demo
```

