# Runtime Config

This directory is populated at runtime (e.g. by an installer or first run). It holds resolved configuration and manifests:

- `config.yaml` – Resolved config (project_root, output_folder, database_path, module settings).
- `agent-manifest.csv` – List of available agents (for list-agents).
- `workflow-manifest.csv` – List of available workflows (for list-workflows).

Do not commit secrets. Use `.env` for API keys; keep `_config` for paths and non-secret options.

Ref: BMAD `_bmad/_config/`.
