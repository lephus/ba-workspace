# Installers

Future: install/setup logic that copies or links `src/core` and selected modules into a project, collects config (via prompts or defaults), and writes `_config/config.yaml` and manifests. Ref: BMAD `tools/cli/installers/` (core/installer.js, config-collector.js, modules/manager.js).

For now, BAWS runs from repo root with no install step; config can be read from `_config/config.yaml.example` or env.
