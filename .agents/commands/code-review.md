# Code Review Command

Use this checklist when reviewing changes in ModerationFlow AI.

## Review Focus

Prioritize real issues:

- bugs;
- broken flows;
- incorrect business rules;
- unsafe moderation behavior;
- missing validation;
- invalid LLM output handling;
- database inconsistencies;
- broken authentication;
- regressions;
- performance problems;
- security risks;
- missing error handling;
- poor separation of concerns.

## Project-Specific Questions

1. Does this change follow the active spec?
2. Did it implement anything outside the requested scope?
3. Are SmartDocs/PDF-specific references accidentally kept?
4. Does the backend still start?
5. Does the frontend still build?
6. Are LLM outputs validated with Pydantic where applicable?
7. Does failure route to human review where applicable?
8. Is human review preserved as mandatory for final decisions?
9. Are logs/audit records preserved or improved?
10. Are sensitive values avoided in logs?

## Output Format

Return findings grouped by severity:

- Critical
- High
- Medium
- Low
- Suggestions

For each finding, include:

- file;
- line or area;
- problem;
- why it matters;
- suggested fix.
