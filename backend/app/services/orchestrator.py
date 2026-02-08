"""Agent orchestrator - runs analysis pipeline."""
import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

from flask import current_app

from app.agents.base import build_system_prompt
from app.services.config_loader import get_config
from app.services.document_parser import parse_document
from app.services.gemini_client import generate_content


AGENT_ORDER = ["alex", "emma", "sarah", "david", "paul"]
SPECIALIST_AGENTS = ["emma", "sarah", "david", "paul"]


def run_analysis(document_path: str, project_id: int) -> dict:
    """
    Run full analysis pipeline:
    1. Parse document
    2. Alex (overview) then Emma, Sarah, David, Paul (parallel)
    3. Return agent_results
    """
    parsed = parse_document(document_path)
    doc_text = parsed["document_text"]
    doc_metadata = parsed["document_metadata"]

    if not doc_text.strip():
        return {"error": "Document is empty or could not extract text"}

    agent_results = {}

    # Step 1: Alex (coordinator overview)
    try:
        alex_prompt = build_system_prompt("alex")
        alex_response = generate_content(alex_prompt, doc_text)
        agent_results["alex"] = alex_response
    except Exception as e:
        agent_results["alex"] = f"Error: {str(e)}"

    # Step 2: Specialist agents (parallel)
    def run_agent(name):
        try:
            prompt = build_system_prompt(name)
            return name, generate_content(prompt, doc_text)
        except Exception as e:
            return name, f"Error: {str(e)}"

    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(run_agent, name): name for name in SPECIALIST_AGENTS}
        for future in as_completed(futures):
            name, result = future.result()
            agent_results[name] = result

    return {
        "document_metadata": doc_metadata,
        "agent_results": agent_results,
    }


def save_analysis_output(project_id: int, analysis_id: int, result: dict):
    """Save analysis result as JSON to analysis_output folder."""
    config = get_config()
    output_path = Path(config.get("analysis_output", "data/output/analysis"))
    project_dir = output_path / str(project_id)
    project_dir.mkdir(parents=True, exist_ok=True)
    file_path = project_dir / f"analysis_{analysis_id}.json"
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
