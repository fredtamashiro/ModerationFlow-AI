# ADR-001: Moderation Strategy Decision

## Status

Accepted for the current project stage.

## Context

ModerationFlow AI is an AI-assisted moderation system for online course comments. The current flow is designed to support a human moderator, not to automatically remove every comment with an LLM.

The intended moderation path is:

```text
comment
-> heuristic or experimental analysis
-> recommendation
-> Human-in-the-Loop
-> human decision
-> audit trail and feedback examples
```

The system should help prioritize review, suggest category, risk, action, and policy references, preserve traceability, and evaluate strategies before any change is promoted. The core principle remains:

```text
The model recommends; the moderator decides.
```

## Strategies Evaluated

### 1. Heuristic baseline

Objective:

- provide the current deterministic baseline for the main moderation flow.

Strengths:

- fast;
- deterministic;
- auditable;
- inexpensive;
- strong for clear lexical rules and known policy mappings.

Limitations:

- limited with ambiguity, sarcasm, contextual discrimination, and new wording;
- can overfit curated datasets through manual lexical tuning;
- weaker when the same intent appears with unseen phrasing.

Recommended use:

- current production/main-flow baseline, always followed by Human-in-the-Loop review.

### 2. Baseline LLM

Objective:

- evaluate whether a structured LLM analyzer can generalize better than manual heuristics in offline evaluation.

Strengths:

- generalized well on the post-tuning adversarial dataset;
- reached strong action, risk, and policy results in the latest validation;
- handles some semantic variation better than lexical rules;
- uses structured output validation.

Limitations:

- higher latency than the heuristic baseline;
- can vary across runs;
- depends on provider behavior and model version;
- still requires fallback handling and human review.

Recommended use:

- primary LLM research strategy, not the production/default moderation path yet.

### 3. Static few-shot LLM

Objective:

- test whether a fixed set of curated human feedback examples improves the baseline LLM.

Strengths:

- simple to reason about;
- uses feedback examples without changing benchmarks;
- keeps the experiment isolated from the main graph and endpoint.

Limitations:

- did not show consistent improvement over the baseline LLM;
- showed local overfitting risk;
- can bias the model toward the fixed examples instead of improving generalization.

Recommended use:

- historical experiment and comparison point; not recommended as the main LLM strategy.

### 4. Dynamic few-shot LLM

Objective:

- select a small deterministic set of examples based on the input comment and compare it against baseline LLM and static few-shot.

Strengths:

- improved some specific scenarios;
- made example selection observable;
- stayed local and deterministic, without embeddings or extra LLM calls;
- helped expose which examples and tags affected a run.

Limitations:

- did not show universal gains across all datasets;
- still had residual instability on category boundaries;
- remained sensitive to spam severity and target-boundary cases.

Recommended use:

- controlled experiment for research and analysis, not automatic production promotion.

### 5. Dynamic few-shot with selection guidance

Objective:

- add guidance to the dynamic selection path and measure whether the guidance improves the selected examples' effect.

Strengths:

- makes the intended use of selected examples more explicit;
- helps inspect whether the model is being steered by relevant example clusters.

Limitations:

- did not show consistent isolated contribution;
- regressed category and policy metrics in some blind dataset comparisons;
- was not the causal source of the strongest safety improvement.

Recommended use:

- keep as an experimental variant only.

### 6. Dynamic few-shot with R-004 safety guardrail

Objective:

- protect sensitive `hate_or_discrimination` cases where protected-group exclusion or prejudice could be misclassified as lower-severity personal attack.

Strengths:

- strongly improved the safety regression dataset;
- corrected `hate_or_discrimination -> personal_attack` failures;
- reduced `R-004 -> R-002` escapes in the safety-focused validation;
- produced clear value for sensitive safety coverage.

Limitations:

- did not show universal improvement on the post-tuning adversarial dataset;
- introduced trade-offs outside the safety set;
- should not be treated as a universally correct production rule without new independent validation.

Recommended use:

- safety experiment evaluated separately; not automatically promoted as the universal production strategy.

## Evidence and Evaluation Datasets

The decision is based on the evaluation history documented in `docs/evaluation.md`, especially the LLM, few-shot, dynamic few-shot, ablation, safety, and post-tuning adversarial stages.

Datasets used:

- `main`: initial baseline and tuning dataset.
- `holdout`: separate verification during heuristic tuning.
- `blind`: generalization check outside the main dataset.
- `safety regression`: sensitive boundary set for safety regressions, especially `R-004`.
- `post-tuning adversarial`: independent validation created after tuning cycles; it must not be used immediately for more prompt or guardrail tuning.
- `feedback examples`: curated source for future experiments; it is not a benchmark.

Key evidence:

- the heuristic baseline is fast, deterministic, and useful for clear rules, but it can overfit curated lexical examples;
- baseline LLM generalized well on the post-tuning adversarial dataset and remains the cleanest LLM research baseline;
- static few-shot did not provide consistent gain over baseline LLM;
- dynamic few-shot improved some cases and added useful observability, but did not produce universal improvement;
- selection guidance did not show consistent isolated value and regressed some blind comparisons;
- the R-004 guardrail was highly effective on the safety dataset, but did not show universal advantage on the adversarial validation set.

## Decision

For the current project stage:

- Production/main flow: heuristic baseline + mandatory Human-in-the-Loop.
- Primary LLM research strategy: baseline LLM.
- Experimental strategies: dynamic few-shot and dynamic few-shot guardrailed.
- R-004 safety guardrail: keep as a separately evaluated safety experiment; do not promote it automatically as a universal production rule without new independent validation.

This decision is based on:

- generalization evidence;
- latency;
- auditability;
- overfitting risk;
- variance across runs;
- need for human review;
- trade-offs between safety-specific gains and broader adversarial generalization.

## Human-in-the-Loop

Human review remains mandatory because moderation decisions have social and operational consequences that metrics alone cannot safely resolve.

The system still needs human judgment for:

- category boundaries;
- sarcasm;
- strong criticism versus personal attack;
- spam severity;
- contextual discrimination;
- false positive risk;
- false negative risk;
- justification quality and auditability.

The project should continue to store moderator agreement, disagreement, notes, and final decisions as first-class outputs. Human feedback is not only a review step; it is the source of future evaluation and improvement.

## Consequences

Positive consequences:

- lower risk of promoting a strategy based on a single metric or dataset;
- decision is evidence-oriented and easier to defend;
- better auditability;
- clear separation between production flow and research experiments;
- stronger project narrative for portfolio review and technical interviews.

Negative consequences:

- LLM is not yet the main flow;
- experiments increase documentation and evaluation complexity;
- LLM strategies still imply cost and latency;
- synthetic datasets do not replace anonymized real-world moderation data;
- results may vary by model, provider, and future model versions.

## Risks and Limitations

- The current datasets are curated and mostly synthetic.
- The post-tuning adversarial dataset measures independent validation, not production behavior.
- Reusing the adversarial set for immediate tuning would weaken its value as an external audit.
- The `offensive_language` versus `personal_attack` boundary remains fragile.
- Spam severity can still differ between benchmark labels and defensible moderation policy.
- Strong safety gains from the R-004 guardrail may not transfer to all moderation categories.

## Revisit Criteria

Revisit this decision only when there is:

- a new independent dataset with broad coverage;
- consistent improvement across multiple runs;
- gain without relevant regression on adversarial validation;
- acceptable latency and cost;
- a privacy policy for real moderation data;
- enough human feedback and monitoring data;
- a rollback plan for any promoted LLM or guardrail strategy.
