---
name: step-01-parse
description: Parse the input document and extract text and metadata.
nextStepFile: ./step-02-orchestrate.md
---

# Step 1: Document Parse

## Goal

Read the file at the given path (PDF, Word, or TXT), extract full text and metadata (filename, type, page count if applicable). Output: `document_text`, `document_metadata` for use in Step 2.

## Contract

- **Input:** `document_path` (string).
- **Output:** `{ document_text: string, document_metadata: object }`.
- **Errors:** Unsupported format or read failure → fail workflow with clear message.

## Implementation note

The actual parsing is implemented in `src/lib/documents/` (or equivalent). This step file defines the contract and instructions for that phase.
