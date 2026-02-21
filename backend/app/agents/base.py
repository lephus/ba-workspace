"""Base agent logic - load YAML and build prompt from persona."""
import os
from pathlib import Path

import yaml

# Paths relative to ba-analysis module (agents and prompts)
_BA_ANALYSIS_ROOT = Path(__file__).resolve().parent.parent.parent.parent / "src" / "modules" / "ba-analysis"
AGENTS_DIR = _BA_ANALYSIS_ROOT / "agents"
PROMPTS_DIR = _BA_ANALYSIS_ROOT / "prompts"

AGENT_FILES = {
    "alex": "alex.agent.yaml",
    "emma": "emma.agent.yaml",
    "sarah": "sarah.agent.yaml",
    "david": "david.agent.yaml",
    "paul": "paul.agent.yaml",
}


def load_agent_yaml(agent_name: str) -> dict:
    """Load agent YAML and return parsed config."""
    if agent_name not in AGENT_FILES:
        raise ValueError(f"Unknown agent: {agent_name}")
    path = AGENTS_DIR / AGENT_FILES[agent_name]
    if not path.exists():
        raise FileNotFoundError(f"Agent config not found: {path}")
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_agent_bot_info(agent_name: str) -> dict:
    """
    Return bot info for API: { name, avatar, role }.
    avatar is taken from metadata.icon in agent YAML.
    """
    data = load_agent_yaml(agent_name)
    meta = data.get("agent", {}).get("metadata", {})
    return {
        "name": meta.get("name", agent_name.title()),
        "avatar": meta.get("icon", ""),
        "role": "assistant",
    }


def build_system_prompt(agent_name: str) -> str:
    """Build system prompt from agent YAML persona and optional prompt_file."""
    data = load_agent_yaml(agent_name)
    agent = data.get("agent", {})
    persona = agent.get("persona", {})

    parts = []
    if persona.get("role"):
        parts.append(f"Role: {persona['role']}")
    if persona.get("identity"):
        parts.append(f"Identity: {persona['identity']}")
    if persona.get("communication_style"):
        parts.append(f"Communication style: {persona['communication_style']}")
    if persona.get("principles"):
        parts.append(f"Principles:\n{persona['principles']}")

    # Load prompt_file from activation if present (e.g. ../prompts/alex.prompt.txt)
    activation = agent.get("activation", {})
    prompt_file = activation.get("prompt_file")
    if prompt_file and PROMPTS_DIR.exists():
        # Resolve to PROMPTS_DIR / filename (e.g. alex.prompt.txt)
        name = Path(prompt_file).name
        path = PROMPTS_DIR / name
        if path.exists():
            parts.append(path.read_text(encoding="utf-8").strip())
        else:
            parts.append("\nAnalyze the provided document and return your analysis in a clear, structured format.")
    else:
        parts.append("\nAnalyze the provided document and return your analysis in a clear, structured format.")
    return "\n\n".join(parts)
