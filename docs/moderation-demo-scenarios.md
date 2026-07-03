# Moderation Demo Scenarios

This document describes a short portfolio demo for the operational moderation UI.

Core message:

```text
The AI recommends. The moderator decides. The decision is auditable.
```

## Scenario 1: Ambiguous Criticism

Seed case:

```text
ambiguous_sarcasm
```

What it demonstrates:

- a comment can be negative without being an obvious removal case;
- the moderator should inspect tone, policy references, risk, and justification;
- Human-in-the-Loop is valuable for borderline content.

Suggested narration:

1. Open the scenario from `Cenarios para demonstracao`.
2. Show the original comment.
3. Run or inspect the AI analysis.
4. Explain that the recommendation helps prioritize review, but the moderator still decides.

## Scenario 2: Explicit Spam

Seed case:

```text
clear_spam
```

What it demonstrates:

- the system can surface promotional or off-platform behavior;
- policy references support the recommendation;
- the moderator can agree or choose a less severe action.

Suggested narration:

1. Open the spam scenario.
2. Show recommended action, risk, category, and related rules.
3. Register or discuss the human decision.
4. Point out that agreement with AI is recorded for future evaluation.

## Scenario 3: Discriminatory Content

Seed case:

```text
potentially_discriminatory
```

What it demonstrates:

- sensitive content needs careful review;
- false positives and false negatives both matter;
- auditability is important when policy impact is high.

Suggested narration:

1. Open the discriminatory-content scenario.
2. Show how policy references and risk are presented.
3. Explain that the final action remains human.
4. Open the audit section and show runs, graph steps, and decision history.

## Three-Minute Demo Flow

1. Start in the comment queue and explain the operational flow.
2. Open `Cenarios para demonstracao`.
3. Pick one scenario and open the comment detail.
4. Show original comment, AI recommendation, and related rules.
5. Show the human decision area and explain agreement/divergence.
6. Expand audit briefly to show traceability.

## What Not To Show Here

Do not present LLM experiment rankings, ablation metrics, prompt tuning, or evaluation datasets in this operational flow. Those belong in the future technical dashboard.
