---
name: step-02-orchestrate
description: Run Alex and specialist agents on the document.
nextStepFile: ./step-03-output.md
---

# Step 2: Orchestrate Agents

## Goal

Using `document_text` and `document_metadata` from Step 1, run Alex (Senior BA) and then Emma, Sarah, David, Paul. Aggregate results into a single `agent_results` structure.

## Contract

- **Input:** `document_text`, `document_metadata`.
- **Output:** `agent_results` (object keyed by agent name: alex, emma, sarah, david, paul).
- **Order:** Alex may run first for overview; then specialist agents (parallel or sequential as implemented).

## Implementation note

Orchestration is implemented in `src/lib/agents/orchestrator.js` (or equivalent). This step file defines the contract for the orchestration phase.
