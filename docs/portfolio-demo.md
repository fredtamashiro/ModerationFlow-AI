# Portfolio Demo

## Objective

The public landing page presents ModerationFlow AI as a portfolio-grade applied AI project.

It explains:

- the moderation problem;
- the operational moderation flow;
- the public demonstration video hosted on YouTube;
- why Human-in-the-Loop is mandatory;
- how demo scenarios should be shown;
- how offline evaluation supports strategy decisions;
- where to access the public read-only demo.

## Main Route

The landing page is available at:

```text
/
```

Primary demo links:

- `/demo/moderation`
- `/demo/evaluations`

These routes are public and read-only. Administrative moderation remains available under `/admin/moderation` for authenticated users only.

## Recommended Demo Journey

1. Start on `/`.
2. Explain the problem: education comments include spam, attacks, offensive language, discrimination, legitimate criticism, and support requests.
3. Show the moderation flow section: comment, analysis, rules, human decision, audit.
4. Play or reference the public video embedded on the landing page.
5. Open `/demo/moderation`.
6. Use the demo scenario cards:
   - `ambiguous_sarcasm`;
   - `clear_spam`;
   - `potentially_discriminatory`.
7. Open `/demo/moderation/comments/[id]` and show:
   - original comment;
   - AI recommendation;
   - policy references;
   - registered human decision;
   - summarized audit history.
8. Open `/demo/evaluations`.
9. Explain that strategies are measured offline and are not promoted automatically.

## Three To Five Minute Script

Minute 1:

Introduce the project as an AI-assisted moderation system for online course comments. Emphasize that the product avoids full automation because moderation decisions have false positive and false negative risk.

Minute 2:

Show the read-only demo queue and a demo scenario. Explain the core principle:

```text
The AI recommends. The moderator decides.
```

Minute 3:

Open a comment detail and point out the recommendation, rules, registered human decision, and audit summary.

Minute 4:

Move to evaluations. Explain that the project compares heuristic, baseline LLM, few-shot, dynamic few-shot, and R-004 guardrail strategies using documented offline snapshots.

Minute 5:

Close with the ADR decision: current main flow is heuristic + Human-in-the-Loop, baseline LLM is the primary research strategy, and guardrailed dynamic few-shot remains an experiment with safety gains and trade-offs.

## Technical Points For Interviews

- LangGraph is justified by conditional routing, confidence gates, critic behavior, failure handling, and human review boundaries.
- Human feedback is stored as a first-class output for future evaluation.
- The LLM recommendation is structured and validated, but does not make the final decision.
- The evaluation dashboard separates operational moderation from experimental strategy analysis.
- Public demo routes are read-only and do not expose admin write actions.
- The ADR documents why a single strong metric is not enough to promote a strategy.
- The adversarial validation set is treated as an audit set, not immediate tuning input.

## Known Limitations

- The public demo uses synthetic examples and does not expose live operational data.
- Evaluation numbers are documented snapshots, not live telemetry.
- Current datasets are curated and mostly synthetic.
- The LLM is not the production/default moderation path.
