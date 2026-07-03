# Evaluation Dashboard

## Objective

The evaluation dashboard presents the documented offline comparison of moderation strategies used by ModerationFlow AI.

It is a technical area for portfolio review, architecture discussion, and experiment interpretation. It is not the operational moderation queue.

## Operation vs Experimentation

The operational moderation flow remains:

```text
comment queue -> AI recommendation -> Human-in-the-Loop -> human decision -> audit trail
```

The evaluation dashboard shows:

```text
datasets -> strategies -> metrics -> trade-offs -> decision evidence
```

The page must not be read as an automatic model promotion mechanism. A metric can support a technical decision, but it does not replace human review or independent validation.

## Data Source

The frontend reads a local typed snapshot from:

```text
frontend/data/moderation-evaluation-snapshot.ts
```

The numbers come from documented results in:

```text
docs/evaluation.md
```

Each result includes:

- dataset;
- strategy;
- action accuracy;
- risk accuracy;
- category accuracy;
- policy match rate;
- average latency, when documented;
- failed runs;
- source note;
- `snapshot_documented`.

Missing combinations are shown as:

```text
Nao avaliado
```

This avoids filling gaps with estimates.

## Why The Snapshot Is Not Real-Time

This stage does not integrate the frontend with the evaluation runner.

The snapshot is intentional because:

- offline runs can be expensive and variable;
- some datasets are methodological checkpoints, not production telemetry;
- browser-triggered evaluation would blur the line between demo, operation, and experiment;
- the current goal is to communicate evidence already documented, not run new experiments.

## Strategy Interpretation

Current project decision:

- Main flow: heuristic baseline + mandatory Human-in-the-Loop.
- Primary research strategy: baseline LLM.
- Experiments: dynamic few-shot and dynamic few-shot guardrailed.
- Historical comparison: static few-shot.

The guardrailed strategy is not presented as the best general model. It improved the safety regression dataset, especially R-004 behavior, but showed trade-offs in the post-tuning adversarial validation.

## Dataset Interpretation

- Main: baseline/tuning dataset for heuristic evaluation.
- Holdout: separate verification during heuristic retuning.
- Blind: generalization check outside the known sets.
- Safety regression: sensitive benchmark focused on R-004 and discrimination failures.
- Adversarial pos-tuning: independent validation after tuning cycles; it must not become immediate tuning input.
- Feedback examples: source for few-shot examples, not a benchmark.

## Demo Usage

In a guided demo:

1. Start in the moderation queue to show the operational flow.
2. Open the evaluation dashboard from the separated navigation item.
3. Explain the current strategy card: heuristic + HITL, baseline LLM for research, experiments isolated.
4. Switch datasets to show how results change by benchmark.
5. Use the comparison table to show `Nao avaliado` gaps and documented trade-offs.
6. Close with the learning points: the system measures strategies, but the moderator still decides.

