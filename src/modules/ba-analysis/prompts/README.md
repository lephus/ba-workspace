# Agent Prompts

System prompts for document analysis and conversation. All prompts use this structure:

- `[ROLE]` – Who the agent is
- `[CONTEXT]` – Situation and inputs
- `[GOAL]` – What to achieve
- `[OUTPUT STRUCTURE]` – How to format the response
- `[CONSTRAINTS]` – What to avoid or rules to follow

**Per-agent (document analysis):** Referenced by `activation.prompt_file` in each agent YAML. Loaded by `backend/app/agents/base.py` `build_system_prompt()` and used by the orchestrator when analyzing a document.

- `alex.prompt.txt` – Coordinator overview and recommendations
- `emma.prompt.txt` – Requirements validation (consistency, clarity, completeness)
- `sarah.prompt.txt` – Stakeholder mapping and alignment gaps
- `david.prompt.txt` – BABOK compliance and best practices
- `paul.prompt.txt` – Traceability, relationships, missing links

**Conversation:** `ba_conversation.prompt.txt` – Base prompt for the chat flow (router + multi-agent reply). Not agent-specific.
