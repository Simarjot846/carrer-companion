import json
from anthropic import Anthropic
from app.config import ANTHROPIC_API_KEY

client = Anthropic(api_key=ANTHROPIC_API_KEY)

EXTRACTION_PROMPT_TEMPLATE = """You are a resume parsing assistant. Extract structured information
from the resume text below. Respond with ONLY valid JSON, no markdown fences, no preamble.

Use exactly this JSON structure:
{
  "skills": [{"name": str, "category": "technical" | "soft" | "tool"}],
  "education": [{"institution": str, "degree": str, "field_of_study": str, "start_date": str, "end_date": str, "grade": str}],
  "experience": [{"title": str, "organization": str, "start_date": str, "end_date": str, "description": str}],
  "projects": [{"title": str, "description": str, "technologies": str, "link": str}]
}

Rules:
- If a field is not present in the resume, use null (not a guess).
- Do not invent information that is not in the text.
- Dates: use whatever format appears in the resume (e.g. "2022", "Jan 2023").

Resume text:
---
__RESUME_TEXT__
---
"""
# NOTE: uses a plain placeholder + str.replace() instead of str.format(),
# because the JSON example above contains literal { } characters that
# str.format() would misinterpret as format fields.


def extract_structured_profile(resume_text: str) -> dict:
    """
    Calls Claude to convert raw resume text into structured JSON.

    WHY an LLM here (and not regex/rules): resumes have no consistent format.
    Skills, experience, and project descriptions are written in free text with
    huge variation between candidates. An LLM handles that variation; a rules
    engine would break on the first unusual resume layout.

    RELIABILITY (Section 12): the LLM can still return malformed JSON or
    hallucinate fields. We validate structure before returning, and raise a
    clear error the caller can catch and mark parsing_status='failed' instead
    of silently saving garbage data.
    """
    prompt = EXTRACTION_PROMPT_TEMPLATE.replace("__RESUME_TEXT__", resume_text)

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )

    raw_output = response.content[0].text.strip()

    # Defensive cleanup: models sometimes wrap JSON in markdown fences
    # despite instructions not to. Strip them if present.
    if raw_output.startswith("```"):
        raw_output = raw_output.strip("`")
        if raw_output.startswith("json"):
            raw_output = raw_output[4:]
        raw_output = raw_output.strip()

    try:
        parsed = json.loads(raw_output)
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM returned invalid JSON: {e}")

    required_keys = {"skills", "education", "experience", "projects"}
    if not required_keys.issubset(parsed.keys()):
        missing = required_keys - parsed.keys()
        raise ValueError(f"LLM response missing required keys: {missing}")

    return parsed
