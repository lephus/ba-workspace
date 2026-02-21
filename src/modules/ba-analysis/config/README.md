# Config – Conversation agents

- **conversation-agents.yaml**: Declares 4 agents (Paul, Emma, Sarah, David) with responsibility and keywords.
- The backend uses this file to **infer** which agent(s) handle each user question or input; **multiple agents** may be selected to collaborate.
- Router: `backend/app/services/agent_router.py` (loads config and uses LLM to select agent ids).
