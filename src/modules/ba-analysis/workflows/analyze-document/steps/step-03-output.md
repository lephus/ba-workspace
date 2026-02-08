---
name: step-03-output
description: Format and write console output and JSON report.
---

# Step 3: Output

## Goal

Using `agent_results` from Step 2, produce:

1. **Console:** Formatted text (sections per agent, summary).
2. **JSON file:** Full report written to path from config (e.g. `analysis_output` + timestamp or CLI `--output`).

## Contract

- **Input:** `agent_results`, session metadata (file path, timestamp).
- **Output:** Console output + JSON file path.
- **Config:** Use `output_folder` / `analysis_output` and optional `--output` path.

## Implementation note

Output generation is implemented in `src/lib/output/output-generator.js` (or equivalent). This step file defines the contract for the output phase.
