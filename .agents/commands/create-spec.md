# Create Spec Command

Use this template to create a new implementation spec in `.agents/specs/`.

## Spec Template

```md
# Spec: <title>

## Objective

Explain what this spec will implement.

## Context

Explain why this change is needed and how it fits the project.

## Scope

This spec includes:

- item 1;
- item 2;
- item 3.

This spec does not include:

- out-of-scope item 1;
- out-of-scope item 2.

## Files Likely Affected

- path/to/file
- path/to/other-file

## Implementation Requirements

- requirement 1;
- requirement 2;
- requirement 3.

## Architecture Rules

- rule 1;
- rule 2.

## Acceptance Criteria

- criterion 1;
- criterion 2;
- criterion 3.

## Validation Commands

```bash
cd backend
python -m compileall app
```

```bash
cd frontend
npm run lint
npm run build
```

## Notes

Any extra implementation notes.
```
