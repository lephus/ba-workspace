# Lib – Implementation Code

Runtime implementation used by the CLI and workflows (not just declarative YAML/MD):

- **documents/** – Document parser (PDF, Word, TXT); chunking.
- **ai/** – AI provider (OpenAI/Gemini); chat completion, embeddings.
- **agents/** – Base agent class; orchestrator; load prompts and invoke AI.
- **output/** – Console formatting and JSON report generation.
- **db/** – SQLite connection, schema, migrations (sessions, agent results).

Agents and workflows in `src/core/` and `src/modules/` declare *what* to run; this directory implements *how*.
