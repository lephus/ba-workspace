---
name: analyze-document
description: Parse a document and run full multi-agent BA analysis (Alex, Emma, Sarah, David, Paul).
---

# Analyze Document Workflow

**Goal:** Given a document path, parse it, run all specialist agents, and produce a consolidated report (console + JSON).

**Role:** The CLI invokes this workflow; Alex (Senior BA) coordinates Emma, Sarah, David, and Paul. No user menus in CLI mode—single run to completion.

---

## Workflow Architecture (BMAD-style step-file)

- **Step 1:** Parse document (PDF/Word/TXT) → `document_text`, `document_metadata`.
- **Step 2:** Orchestrate agents (Alex first, then Emma, Sarah, David, Paul) → `agent_results`.
- **Step 3:** Generate output (console formatting + JSON file) → done.

### Step Files

- `steps/step-01-parse.md` – Document parsing instructions / contract.
- `steps/step-02-orchestrate.md` – Agent orchestration instructions / contract.
- `steps/step-03-output.md` – Output generation instructions / contract.

Implementation in code (e.g. `tools/` or `src/lib/`) will read these steps and execute the pipeline; they define the *contract* and instructions for each phase.

---

## INITIALIZATION

1. Load config from `_config/config.yaml` (project_root, output_folder, database_path, etc.).
2. Resolve document path (CLI argument).
3. Execute step 1 → step 2 → step 3 in order.
