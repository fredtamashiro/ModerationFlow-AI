## Spec: 039 -- Explicit Spam and Target-Boundary Calibration

## Objetivo

Calibrar apenas dois padroes residuais do experimento `dynamic-few-shot-guardrailed`:

- `explicit_spam`, especialmente quando o modelo sobe `medium -> high` e `flag -> remove` sem redirecionamento externo suficientemente explicito;
- fronteira `offensive_language` vs `personal_attack`, com foco em comentarios cujo alvo predominante e a qualidade de curso, material, conteudo, servico ou entrega.

O guardrail atual de `R-004` deve permanecer intacto.

## Regra principal

Nao alterar:

- baseline heuristico;
- LangGraph principal;
- endpoint `/admin/moderation/comments/{comment_id}/analyze`;
- frontend;
- banco;
- migrations;
- datasets `main`, `holdout`, `blind`, `safety` e feedback;
- comportamento de `llm`, `few-shot` e estrutura geral de `compare-all`.

## Escopo

Priorizar alteracoes apenas em:

- `backend/app/moderation/llm/dynamic_few_shot.py`
- `backend/app/moderation/llm/prompt.py`
- `backend/app/moderation/llm/analyzer.py`
- `docs/evaluation.md`
- `.agents/specs/039-explicit-spam-and-target-boundary-calibration.md`

## Regras de implementacao

- manter no maximo 4 exemplos no prompt dinamico;
- nao criar regras hardcoded por ID, frase literal ou exemplo de benchmark;
- manter contraste entre `spam / medium / flag` e `spam / high / remove` na selecao de `explicit_spam`;
- tratar convite generico para grupo, download ou contato sem redirecionamento externo forte como caso mais proximo de `medium / flag`;
- preservar `personal_attack` quando houver insulto humano direto e central;
- preferir `offensive_language` quando o comentario critica principalmente a qualidade do material, servico, explicacao, conteudo ou entrega, mesmo com mencao indireta a quem produziu;
- nao alterar a calibragem defensiva atual de `hate_or_discrimination / R-004`.

## Validacao

Executar:

```bash
docker compose exec -e LANGSMITH_TRACING=false backend python -m compileall app

docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset blind --mode dynamic-few-shot
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset blind --mode dynamic-few-shot --runs 3

docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset safety --mode dynamic-few-shot
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset safety --mode dynamic-few-shot --runs 3

docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset blind --mode compare-ablation
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset safety --mode compare-ablation
```

## Criterios de aceite

- spec criada;
- guardrail `R-004` preservado;
- nenhum benchmark alterado;
- nenhum fluxo principal alterado;
- selecao dinamica continua deterministica e limitada a 4 exemplos;
- `failed_runs = 0` nas validacoes finais registradas;
- metricas antes e depois documentadas;
- taxonomia e analise de selecao continuam funcionando;
- trade-offs residuais ficam documentados com clareza.
