"""
Template export orchestrator: ties together prompt building, LLM generation,
JSON validation, and template filling into a single call.

This is the main entry point used by the messages API.
"""
import logging

from app.services.claude_client import generate_text
from app.services.template_prompt_builder import (
    build_export_prompt,
    parse_llm_json,
    validate_template_data,
)
from app.services.template_filler import fill_and_save_template
from app.services.template_registry import get_schema

logger = logging.getLogger(__name__)


def generate_template_data(template_type: str, conversation_id: int) -> dict:
    """
    Call Claude with a compact prompt to generate structured JSON data
    for the given template type, using conversation history as context.

    Returns the parsed and validated dict.
    Raises ValueError if the LLM output cannot be parsed.
    """
    prompt = build_export_prompt(template_type, conversation_id)
    raw_response = generate_text(prompt)

    data = parse_llm_json(raw_response)
    if data is None:
        logger.warning(
            "Template export: LLM returned unparseable JSON for %s. "
            "Raw (first 500 chars): %s",
            template_type,
            raw_response[:500],
        )
        raise ValueError(f"LLM output is not valid JSON for template '{template_type}'")

    is_valid, warnings = validate_template_data(template_type, data)
    if warnings:
        logger.info(
            "Template export validation warnings for %s: %s",
            template_type,
            "; ".join(warnings),
        )

    if not is_valid:
        raise ValueError(
            f"LLM output missing too many sections for template '{template_type}': "
            + "; ".join(warnings)
        )

    return data


def generate_and_save_template(
    project_id: int,
    conversation_id: int,
    template_type: str,
) -> str:
    """
    End-to-end: generate data via LLM, fill .docx template, save to disk.
    Returns the filename for the download URL.
    """
    data = generate_template_data(template_type, conversation_id)
    filename = fill_and_save_template(project_id, template_type, data)
    return filename
