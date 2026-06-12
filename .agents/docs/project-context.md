# Project Context -- ModerationFlow AI

## Product Idea

ModerationFlow AI is an AI-assisted moderation platform for online course comments.

The system helps moderators review high volumes of student comments by:

- analyzing comment content;
- identifying possible violations;
- retrieving relevant community guidelines;
- classifying risk;
- recommending an action;
- involving a human moderator;
- storing the final decision;
- using human feedback for evaluation and future improvement.

## Why This Project Exists

The project is designed as a portfolio-grade applied AI system.

It should demonstrate engineering depth in:

- backend architecture;
- AI workflows;
- LangGraph;
- Human-in-the-Loop;
- structured LLM outputs;
- observability;
- evaluation;
- failure handling.

The project should not be a simple "LLM wrapper" or a fake multi-agent pipeline.

## Core Use Case

A student posts a comment in a course platform.

The system analyzes the comment and suggests one of the following actions:

- approve;
- flag;
- remove;
- request_edit.

The final decision is always made by a human moderator in V1.

## Expected Moderation Categories

Examples:

- spam;
- personal_attack;
- offensive_language;
- hate_or_discrimination;
- dangerous_or_illegal_content;
- legitimate_criticism;
- question_or_support_request;
- positive_feedback;
- ambiguous.

## Expected Graph Behavior

The graph should include:

- input validation;
- intent routing;
- fast paths for obvious spam or toxic comments;
- deeper analysis for ambiguous comments;
- guideline retrieval;
- risk analysis;
- confidence gate;
- critic agent for low-confidence or high-impact decisions;
- human review;
- decision finalization;
- feedback storage.

## Relationship With SmartDocs AI

This project reuses the technical foundation of SmartDocs AI, such as:

- FastAPI;
- Next.js;
- PostgreSQL;
- Docker;
- admin authentication;
- layout patterns;
- environment configuration;
- deployment documentation style.

However, it must remove or replace SmartDocs-specific functionality, including:

- PDF upload;
- document ingestion;
- document chat;
- document chunks;
- document answer cache;
- SmartDocs branding.

## First Goal

The first goal is not to implement moderation.

The first goal is to clean the cloned SmartDocs base and prepare it as a clean ModerationFlow AI foundation.
