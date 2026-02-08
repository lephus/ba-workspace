# BAWS – Developer Guide & Architecture

This document explains the **project architecture** of BAWS (Business Analysis Workspace), how it aligns with **BMAD-METHOD**, and where to add or change code.

---

## 1. High-Level Layout

BAWS is organized into three main areas:

| Area | Purpose | BMAD equivalent |
|------|---------|------------------|
| **tools/** | CLI entry point, commands, installers, schemas | `tools/cli/`, `tools/installers/`, `tools/schema/` |
| **src/** | Core + modules (agents, workflows) + shared lib | `src/core/`, `src/bmm/`, `src/utility/` |
| **_config/** | Resolved runtime config and manifests | `_bmad/_config/` |

Runtime data (database, uploaded documents, analysis output) lives under **data/** and is gitignored.

---

## 2. Directory Tree

```
ba-workspace/
├── package.json              # name: baws, bin: baws, scripts, dependencies
├── DEV-README.md             # This file
├── README.md
├── .gitignore
│
├── tools/                    # CLI and build/install tooling
│   ├── baws-cli.js           # Entry: Commander, loads commands, default welcome
│   ├── commands/             # CLI subcommands (welcome, analyze, ...)
│   │   └── welcome.js
│   ├── lib/                  # CLI helpers (displayWelcome, etc.)
│   │   └── cli-utils.js
│   ├── installers/           # Future: install/setup into a project
│   │   └── README.md
│   └── schema/              # Optional: agent/workflow schema validation
│       └── README.md
│
├── src/
│   ├── core/                 # Core framework (BMAD: src/core)
│   │   ├── module.yaml       # Core config vars (user_name, output_folder, ...)
│   │   ├── agents/
│   │   │   └── baws-master.agent.yaml
│   │   ├── workflows/
│   │   │   └── README.md
│   │   └── resources/
│   │       └── README.md
│   │
│   ├── modules/              # Domain modules (BMAD: src/bmm, etc.)
│   │   └── ba-analysis/
│   │       ├── module.yaml   # Module config (project_name, analysis_output, ...)
│   │       ├── agents/       # Alex, Emma, Sarah, David, Paul
│   │       │   ├── alex.agent.yaml
│   │       │   ├── emma.agent.yaml
│   │       │   ├── sarah.agent.yaml
│   │       │   ├── david.agent.yaml
│   │       │   └── paul.agent.yaml
│   │       ├── prompts/      # System prompts per agent (alex.prompt.txt, ...)
│   │       │   └── README.md
│   │       └── workflows/
│   │           └── analyze-document/
│   │               ├── workflow.md
│   │               └── steps/
│   │                   ├── step-01-parse.md
│   │                   ├── step-02-orchestrate.md
│   │                   └── step-03-output.md
│   │
│   ├── utility/              # Shared agent/workflow building blocks (BMAD: src/utility)
│   │   └── README.md
│   │
│   └── lib/                  # Implementation code (not in BMAD as "lib" – BMAD uses tools/cli/lib)
│       └── README.md         # documents/, ai/, agents/, output/, db/
│
├── _config/                  # Runtime config (BMAD: _bmad/_config)
│   ├── README.md
│   └── config.yaml.example
│
└── data/                     # Gitignored: database, documents, output
    # Created at runtime
```

---

## 3. Mapping to BMAD-METHOD

### 3.1 Core vs modules

- **BMAD:** `src/core/` = core module (BMad Master agent, core config, core workflows). `src/bmm/` = one domain module (PM, Architect, Dev, UX, etc.).
- **BAWS:** `src/core/` = core (BAWS Master, core config). `src/modules/ba-analysis/` = one domain module (Alex, Emma, Sarah, David, Paul and the analyze-document workflow).

### 3.2 Agents

- **BMAD:** Agents are defined in YAML under `src/core/agents/` and `src/bmm/agents/`. Each has `metadata`, `persona`, and `menu` (triggers → workflow or action). Optional sidecar dirs.
- **BAWS:** Same idea. Core agent: `src/core/agents/baws-master.agent.yaml`. Domain agents: `src/modules/ba-analysis/agents/*.agent.yaml`. Each can reference `prompt_file` (e.g. `../prompts/alex.prompt.txt`) for the system prompt used at runtime.

### 3.3 Workflows and steps

- **BMAD:** Workflows live under `src/core/workflows/` or `src/bmm/workflows/`. A workflow is a folder with a `workflow.md` (or `workflow.yaml`) and a `steps/` directory. Steps are Markdown files executed in order; they define menus, next-step file, and output files.
- **BAWS:** Same pattern. `src/modules/ba-analysis/workflows/analyze-document/` has `workflow.md` and `steps/step-01-parse.md`, `step-02-orchestrate.md`, `step-03-output.md`. These define the *contract* and instructions; the actual execution is implemented in code under `src/lib/` (or `tools/`).

### 3.4 Config

- **BMAD:** Core and each module have `module.yaml` (config variables, prompts for installer). Resolved config and manifests go to `_bmad/_config/`.
- **BAWS:** `src/core/module.yaml` and `src/modules/ba-analysis/module.yaml` define variables. Resolved config goes to `_config/config.yaml` (example: `_config/config.yaml.example`).

### 3.5 CLI

- **BMAD:** `tools/cli/bmad-cli.js` uses Commander, dynamically loads `tools/cli/commands/*.js`, registers each as a subcommand. Help when no args.
- **BAWS:** `tools/baws-cli.js` uses Commander, loads `tools/commands/*.js`, registers subcommands, and uses a default action (no subcommand) to show the welcome banner.

### 3.6 Installers and schema

- **BMAD:** `tools/cli/installers/` contains the install flow (copy/link sources, collect config, write manifests). `tools/schema/` and `validate-agent-schema.js` validate agent YAML.
- **BAWS:** `tools/installers/` and `tools/schema/` are stubbed with READMEs for future parity; no install or schema validation yet.

---

## 4. Data Flow (Analyze Document)

When the `analyze` command is implemented, the flow will follow the workflow steps:

1. **CLI** (`tools/commands/analyze.js`)  
   Receives a file path and options. Validates path, loads config, starts a session (if DB is used).

2. **Step 1 – Parse**  
   Implementation in `src/lib/documents/` reads the file (PDF/Word/TXT), extracts text and metadata. Output: `document_text`, `document_metadata`.

3. **Step 2 – Orchestrate**  
   Implementation in `src/lib/agents/orchestrator.js` (or equivalent) loads Alex and the four specialist agents (Emma, Sarah, David, Paul), runs them with the document content and their prompts from `src/modules/ba-analysis/prompts/*.prompt.txt`, aggregates results into `agent_results`.

4. **Step 3 – Output**  
   Implementation in `src/lib/output/` formats `agent_results` for console and writes a JSON report to the path from config or `--output`.

The step files under `src/modules/ba-analysis/workflows/analyze-document/steps/` describe this contract and can be used by code or by an AI runner that “follows” the workflow.

---

## 5. Where to Add or Change Things

| Need | Location |
|------|----------|
| New CLI command | `tools/commands/<name>.js`; register in `tools/baws-cli.js` (dynamic load already picks up new files). |
| New core config variable | `src/core/module.yaml`. |
| New module | New folder under `src/modules/<module-code>/` with `module.yaml`, `agents/`, optional `workflows/`, `prompts/`. |
| New agent in ba-analysis | New `src/modules/ba-analysis/agents/<name>.agent.yaml` and optional `prompts/<name>.prompt.txt`. |
| Change welcome banner | `tools/lib/cli-utils.js` → `displayWelcome()`. |
| Document parsing | `src/lib/documents/` (parser, chunking). |
| AI calls | `src/lib/ai/` (provider wrapper, API keys from env). |
| Agent execution / orchestration | `src/lib/agents/` (base agent, orchestrator, prompt loading). |
| Report output | `src/lib/output/`. |
| Database | `src/lib/db/` (schema, migrations); use `database_path` from config. |
| Resolved config | `_config/config.yaml` (do not commit secrets; use `.env` for API keys). |

---

## 6. Conventions

- **Agent YAML:** Same structure as BMAD: `agent.metadata`, `agent.persona`, `agent.menu` or `agent.activation`. Use `prompt_file` to point to a `.prompt.txt` in the same module.
- **Workflows:** One folder per workflow; `workflow.md` (or `.yaml`) at top level; `steps/` with ordered step files. Step files define input/output contract and instructions.
- **Config:** Paths use placeholders like `{project-root}` and `{output_folder}`; resolve at runtime from `_config/config.yaml`.
- **Prompts:** Follow repo-root `master_prompt.txt` structure (persona, input_specification, core_directives_and_principles, output_blueprint, etc.) so agents behave consistently.

---

## 7. Running BAWS Today

- Install deps: `npm install`
- Welcome: `node tools/baws-cli.js` or `node tools/baws-cli.js welcome`
- Global CLI (optional): `npm link` then `baws` or `baws welcome`
- Help: `node tools/baws-cli.js --help`; version: `node tools/baws-cli.js -V`

The rest of the architecture is in place so that the `analyze` command and pipeline can be implemented without moving files around; add code under `src/lib/` and a new command under `tools/commands/analyze.js` when ready.
