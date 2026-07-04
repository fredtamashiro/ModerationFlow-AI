# Portfolio Demo

## Objective

The public landing page presents ModerationFlow AI as a portfolio-grade applied AI project.

It explains:

- the moderation problem;
- the operational moderation flow;
- why Human-in-the-Loop is mandatory;
- how demo scenarios should be shown;
- how offline evaluation supports strategy decisions;
- where to access the admin demo.

## Main Route

The landing page is available at:

```text
/
```

Primary demo links:

- `/admin/moderation`
- `/admin/moderation/evaluations`

These routes are part of the internal administrative demo. If authentication is required, use the local admin credentials configured for the development environment.

## Recommended Demo Journey

1. Start on `/`.
2. Explain the problem: education comments include spam, attacks, offensive language, discrimination, legitimate criticism, and support requests.
3. Show the moderation flow section: comment, analysis, rules, human decision, audit.
4. Open `/admin/moderation`.
5. Use the demo scenario cards:
   - `ambiguous_sarcasm`;
   - `clear_spam`;
   - `potentially_discriminatory`.
6. Open one comment detail and show:
   - original comment;
   - AI recommendation;
   - policy references;
   - human decision form;
   - audit history.
7. Open `/admin/moderation/evaluations`.
8. Explain that strategies are measured offline and are not promoted automatically.

## Three To Five Minute Script

Minute 1:

Introduce the project as an AI-assisted moderation system for online course comments. Emphasize that the product avoids full automation because moderation decisions have false positive and false negative risk.

Minute 2:

Show the operational queue and a demo scenario. Explain the core principle:

```text
The AI recommends. The moderator decides.
```

Minute 3:

Open a comment detail and point out the recommendation, rules, decision form, and audit trail.

Minute 4:

Move to evaluations. Explain that the project compares heuristic, baseline LLM, few-shot, dynamic few-shot, and R-004 guardrail strategies using documented offline snapshots.

Minute 5:

Close with the ADR decision: current main flow is heuristic + Human-in-the-Loop, baseline LLM is the primary research strategy, and guardrailed dynamic few-shot remains an experiment with safety gains and trade-offs.

## Technical Points For Interviews

- LangGraph is justified by conditional routing, confidence gates, critic behavior, failure handling, and human review boundaries.
- Human feedback is stored as a first-class output for future evaluation.
- The LLM recommendation is structured and validated, but does not make the final decision.
- The evaluation dashboard separates operational moderation from experimental strategy analysis.
- The ADR documents why a single strong metric is not enough to promote a strategy.
- The adversarial validation set is treated as an audit set, not immediate tuning input.

## Known Limitations

- The landing links point to authenticated admin routes.
- Evaluation numbers are documented snapshots, not live telemetry.
- Current datasets are curated and mostly synthetic.
- The LLM is not the production/default moderation path.

