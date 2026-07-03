# Frontend Moderation UX

## Moderator Journey

The operational moderation journey is:

```text
comment queue
-> assisted analysis
-> AI recommendation
-> human decision
-> audit trail
```

The interface is organized around the moderator's work. The AI recommendation is useful context, but it is not the final decision.

Core principle:

```text
The AI recommends. The moderator decides.
```

## Information Architecture

The admin moderation area is organized as:

- `Comments`: the operational queue for comment review.
- `Community rules`: the policy reference used by analysis and moderation.
- `Audit`: a secondary anchor in comment details for runs, graph steps, metadata, and decision history.

Experiment dashboards, LLM evaluation metrics, and tuning views are intentionally absent from this operational area. They belong in a future technical dashboard.

## Comment Queue

The queue page prioritizes scan speed:

- status;
- comment excerpt;
- author and date;
- recommended category and risk when an analysis run exists;
- human decision when a moderator decision exists.

Filters use existing backend support and do not introduce new endpoints.

## Comment Detail Hierarchy

The comment detail page follows this visual order:

1. Original comment.
2. AI analysis and recommendation.
3. Human decision.
4. Audit and history.

This keeps the review task clear. Technical details are available, but they do not compete with the decision workflow.

## AI Recommendation

The AI recommendation area shows:

- analysis status;
- route;
- recommended action;
- risk level;
- category;
- confidence;
- policy references;
- critic agent status;
- justification.

The area explicitly frames the analysis as a recommendation.

## Human Decision

The human decision area is visually stronger than the audit area. It includes:

- the latest human decision, when available;
- the decision form;
- final category and risk;
- moderator note;
- final edited content, when available;
- comparison between AI recommendation and human decision.

The comparison can be:

- agreement;
- divergence;
- pending;
- not applicable.

## Audit

Audit is secondary and organized with collapsible sections:

- latest run metadata;
- previous runs;
- graph steps;
- decision history;
- comment metadata.

This preserves traceability for demos and technical review while keeping the moderator's workflow focused.

## Operational vs Experimental

The admin moderation UI is for operational review. It should not show LLM experiment rankings, ablation metrics, evaluation datasets, or tuning controls.

Those belong to a separate future technical area so moderators do not confuse research evidence with a production decision workflow.
