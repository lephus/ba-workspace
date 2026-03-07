"""
Template registry: compact schemas for BA document templates.
Each schema describes the section structure of a .docx template
so the LLM can generate JSON data to fill it (without seeing the full template).
"""
from pathlib import Path

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"

# Section types:
#   key_value  – rows are label|value pairs (col 0 = label, col 1 = value)
#   columnar   – row 1 = column headers, rows 2+ = data
#   text_block – row 1 = free-form paragraph text
#   two_column – row 1 = field headers, row 2 = corresponding values (side-by-side)

TEMPLATE_SCHEMAS: dict[str, dict] = {
    "brd": {
        "name": "Business Requirements Document",
        "template_file": "BRD_BAWS_Emma.docx",
        "title_table_index": 0,
        "sections": [
            {
                "id": "document_control",
                "header_match": "DOCUMENT CONTROL",
                "type": "columnar",
                "columns": ["Version", "Date", "Author", "Description"],
            },
            {
                "id": "project_overview",
                "header_match": "PROJECT OVERVIEW",
                "type": "key_value",
                "fields": [
                    "Project Name", "Project ID", "Client",
                    "Project Manager", "Project Owner", "AI Agent",
                    "Location", "Methodology", "Target Go-Live",
                ],
            },
            {
                "id": "business_context",
                "header_match": "BUSINESS CONTEXT",
                "type": "text_block",
            },
            {
                "id": "business_objectives",
                "header_match": "BUSINESS OBJECTIVES",
                "type": "columnar",
                "columns": ["#", "Objective", "Success Measure", "Target", "Deadline"],
            },
            {
                "id": "stakeholders",
                "header_match": "STAKEHOLDERS",
                "type": "columnar",
                "columns": ["Name", "Role", "Responsibilities", "Interest Level", "Influence Level"],
            },
            {
                "id": "scope",
                "header_match": "SCOPE",
                "type": "two_column",
                "fields": ["In Scope", "Out of Scope"],
            },
            {
                "id": "business_requirements",
                "header_match": "BUSINESS REQUIREMENTS",
                "type": "columnar",
                "columns": ["BR ID", "Category", "Business Requirement", "Priority", "Source"],
            },
            {
                "id": "assumptions_constraints",
                "header_match": "ASSUMPTIONS",
                "type": "two_column",
                "fields": ["Assumptions", "Constraints"],
            },
            {
                "id": "sign_off",
                "header_match": "SIGN-OFF",
                "type": "two_column",
                "fields": ["Project Owner (P.O)", "Project Manager (P.M)"],
            },
        ],
    },
    "frd": {
        "name": "Functional Requirements Document",
        "template_file": "FRD_BAWS_Emma.docx",
        "title_table_index": 0,
        "sections": [
            {
                "id": "document_control",
                "header_match": "DOCUMENT CONTROL",
                "type": "columnar",
                "columns": ["Version", "Date", "Author", "Description"],
            },
            {
                "id": "module_overview",
                "header_match": "MODULE OVERVIEW",
                "type": "key_value",
                "fields": ["Module 1", "Module 2", "Module 3", "Module 4"],
            },
            {
                "id": "module_1",
                "header_match": "MODULE 1",
                "type": "columnar",
                "columns": ["FR ID", "BR Ref", "Functional Requirement", "Priority", "Input", "Output"],
            },
            {
                "id": "module_2",
                "header_match": "MODULE 2",
                "type": "columnar",
                "columns": ["FR ID", "BR Ref", "Functional Requirement", "Priority", "Rule Type", "Trigger"],
            },
            {
                "id": "module_3",
                "header_match": "MODULE 3",
                "type": "columnar",
                "columns": ["FR ID", "BR Ref", "Functional Requirement", "Priority", "Accuracy Target", "Fallback"],
            },
            {
                "id": "module_4",
                "header_match": "MODULE 4",
                "type": "columnar",
                "columns": ["FR ID", "BR Ref", "Functional Requirement", "Priority", "UI Element", "Interaction"],
            },
            {
                "id": "non_functional_requirements",
                "header_match": "NON-FUNCTIONAL REQUIREMENTS",
                "type": "columnar",
                "columns": ["NFR ID", "Category", "Requirement", "Target", "BR Ref"],
            },
            {
                "id": "traceability_matrix",
                "header_match": "REQUIREMENTS TRACEABILITY MATRIX",
                "type": "columnar",
                "columns": ["FR ID", "BR Ref", "Business Objective", "Module", "Phase", "Priority"],
            },
            {
                "id": "sign_off",
                "header_match": "SIGN-OFF",
                "type": "two_column",
                "fields": ["Project Owner (P.O)", "Project Manager (P.M)"],
            },
        ],
    },
    "backlog": {
        "name": "Product Backlog / Requirements Register",
        "template_file": "ProductBacklog_BAWS_Emma.docx",
        "title_table_index": 0,
        "sections": [
            {
                "id": "document_control",
                "header_match": "DOCUMENT CONTROL",
                "type": "columnar",
                "columns": ["Version", "Date", "Author", "Description"],
            },
            {
                "id": "backlog_summary",
                "header_match": "BACKLOG SUMMARY",
                "type": "columnar",
                "columns": ["Phase", "Module", "Work Items", "Target Date"],
            },
            {
                "id": "requirements_register",
                "header_match": "REQUIREMENTS REGISTER",
                "type": "columnar",
                "columns": ["ID", "Phase", "Module", "Work Item / Requirement", "FR Ref", "Effort (d)", "Priority", "Status"],
            },
            {
                "id": "deferred_items",
                "header_match": "DEFERRED",
                "type": "columnar",
                "columns": ["ID", "Item", "Reason"],
            },
        ],
    },
    "charter": {
        "name": "Project Charter",
        "template_file": "Project_Charter_BAWS_Emma.docx",
        "title_table_index": 0,
        "sections": [
            {
                "id": "project_identification",
                "header_match": "PROJECT IDENTIFICATION",
                "type": "key_value",
                "fields": [
                    "Client", "Project Name", "Contract No.",
                    "Contract Value", "Project Manager (P.M)",
                    "Project Owner (P.O)", "Project Team", "Location", "Date",
                ],
            },
            {
                "id": "key_contacts",
                "header_match": "KEY CONTACTS",
                "type": "columnar",
                "columns": ["Role", "Name", "Email", "Phone"],
            },
            {
                "id": "objectives_requirements",
                "header_match": "OBJECTIVES",
                "type": "text_block",
            },
            {
                "id": "scope_of_work",
                "header_match": "SCOPE OF WORK",
                "type": "columnar",
                "columns": ["Work Area", "In Scope", "Out of Scope"],
            },
            {
                "id": "deliverables_milestones",
                "header_match": "DELIVERABLES",
                "type": "columnar",
                "columns": ["#", "Deliverable", "Milestone", "Deadline"],
            },
            {
                "id": "payment_schedule",
                "header_match": "PAYMENT SCHEDULE",
                "type": "key_value",
                "fields": ["Note"],
            },
            {
                "id": "risk_register",
                "header_match": "RISK REGISTER",
                "type": "columnar",
                "columns": ["#", "Risk", "Mitigation", "Owner"],
            },
            {
                "id": "other_notes",
                "header_match": "OTHER NOTES",
                "type": "text_block",
            },
            {
                "id": "sign_off",
                "header_match": "SIGN-OFF",
                "type": "two_column",
                "fields": [
                    "Client Representative",
                    "Project Owner (P.O)",
                    "Project Manager (P.M)",
                ],
            },
        ],
    },
}

VALID_TEMPLATE_TYPES = set(TEMPLATE_SCHEMAS.keys())


def get_schema(template_type: str) -> dict:
    """Return schema dict for a template type. Raises ValueError if unknown."""
    if template_type not in TEMPLATE_SCHEMAS:
        raise ValueError(
            f"Unknown template type: {template_type}. "
            f"Valid: {', '.join(VALID_TEMPLATE_TYPES)}"
        )
    return TEMPLATE_SCHEMAS[template_type]


def get_template_path(template_type: str) -> Path:
    """Return absolute path to the .docx template file."""
    schema = get_schema(template_type)
    path = TEMPLATES_DIR / schema["template_file"]
    if not path.exists():
        raise FileNotFoundError(f"Template file not found: {path}")
    return path


def schema_to_compact_prompt(schema: dict) -> str:
    """
    Serialize a template schema into a compact text representation
    for inclusion in the LLM prompt. Minimizes tokens.
    """
    lines = [f"Document: {schema['name']}", "Sections:"]
    for sec in schema["sections"]:
        sec_type = sec["type"]
        if sec_type == "columnar":
            cols = ", ".join(sec["columns"])
            lines.append(f'  {sec["id"]} (table): [{cols}]')
        elif sec_type in ("key_value", "two_column"):
            fields = ", ".join(sec.get("fields", []))
            lines.append(f'  {sec["id"]} (fields): {{{fields}}}')
        elif sec_type == "text_block":
            lines.append(f'  {sec["id"]} (text): free-form paragraph')
    return "\n".join(lines)


def schema_to_json_spec(schema: dict) -> str:
    """
    Build a compact JSON structure specification so the LLM knows
    the exact shape of the expected output.
    """
    lines = ["{"]
    for i, sec in enumerate(schema["sections"]):
        sec_id = sec["id"]
        sec_type = sec["type"]
        comma = "," if i < len(schema["sections"]) - 1 else ""

        if sec_type == "columnar":
            cols_obj = ", ".join(f'"{c}": "..."' for c in sec["columns"])
            lines.append(f'  "{sec_id}": [{{{cols_obj}}}]{comma}')
        elif sec_type in ("key_value", "two_column"):
            fields_obj = ", ".join(f'"{f}": "..."' for f in sec.get("fields", []))
            lines.append(f'  "{sec_id}": {{{fields_obj}}}{comma}')
        elif sec_type == "text_block":
            lines.append(f'  "{sec_id}": "...paragraph text..."{comma}')

    lines.append("}")
    return "\n".join(lines)
