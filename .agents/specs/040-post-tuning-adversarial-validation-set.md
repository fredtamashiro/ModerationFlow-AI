## Spec: 040 -- Post-Tuning Adversarial Validation Set

## Objetivo

Criar um dataset novo de validacao adversarial para medir a generalizacao pos-tuning da estrategia principal atual:

- `dynamic_few_shot_guardrailed`

O dataset deve ser separado de todos os conjuntos usados em tuning anterior e servir como validacao final da versao atual, nao como fonte imediata para nova rodada de ajuste.

## Regra principal

Nao alterar:

- baseline heuristico;
- LangGraph principal;
- endpoint `/admin/moderation/comments/{comment_id}/analyze`;
- prompt;
- analyzer;
- `dynamic_few_shot`;
- guardrail `R-004`;
- frontend;
- banco;
- migrations;
- datasets existentes.

Esta etapa e apenas de validacao e documentacao.

## Escopo

Priorizar alteracoes em:

- `backend/app/evaluation/datasets/moderation_post_tuning_adversarial_eval.json`
- `backend/scripts/evaluate_moderation.py`
- `docs/evaluation.md`
- `docs/development-runbook.md`
- `.agents/specs/040-post-tuning-adversarial-validation-set.md`

## Regras de implementacao

- criar entre 25 e 35 exemplos ineditos, sinteticos e semanticamente distintos;
- nao reutilizar literalmente comentarios presentes em:
  - `main`
  - `holdout`
  - `blind`
  - `safety`
  - `feedback_examples`
- adicionar suporte a `--dataset adversarial`;
- preservar todos os modos atuais de avaliacao;
- permitir:
  - `--dataset adversarial --mode dynamic-few-shot`
  - `--dataset adversarial --mode dynamic-few-shot --runs 3`
  - `--dataset adversarial --mode compare-ablation`
- nao alterar prompt, calibragem, guardrail ou seletor.

## Cobertura obrigatoria

Cobrir exemplos ineditos para:

- `R-004` com grupo protegido claro;
- casos negativos que nao devem virar `R-004`;
- spam sutil;
- spam explicito;
- promocao comercial leve;
- link externo e grupo externo;
- `personal_attack` severo;
- `offensive_language` contra conteudo ou servico;
- critica ambigua;
- sarcasmo;
- feedback positivo com ressalva;
- duvida ou suporte;
- `flag` versus `remove`;
- `medium` versus `high`.

## Validacao

Executar:

```bash
docker compose exec backend python -m compileall app

docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset adversarial --mode dynamic-few-shot
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset adversarial --mode dynamic-few-shot --runs 3
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset adversarial --mode compare-ablation
```

## Criterios de aceite

- spec criada;
- dataset novo com 25 a 35 exemplos ineditos;
- runner aceita `--dataset adversarial`;
- nenhum prompt, guardrail ou seletor e alterado;
- nenhum dataset existente e modificado;
- nenhum texto e duplicado literalmente dos datasets atuais;
- metricas documentadas;
- `failed_runs = 0`;
- a documentacao deixa explicito que esse dataset e de validacao pos-tuning.
