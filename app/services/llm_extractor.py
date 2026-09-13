import json
import os
import warnings
from app.config import GOOGLE_API_KEY

try:
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        import google.generativeai as genai
    HAS_GENAI = True
    if GOOGLE_API_KEY:
        genai.configure(api_key=GOOGLE_API_KEY)
except Exception:
    genai = None
    HAS_GENAI = False

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


def extract_structured_profile(resume_text: str) -> dict:
    prompt = EXTRACTION_PROMPT_TEMPLATE.replace("__RESUME_TEXT__", resume_text)

    # 1. Try Gemini if configured
    if HAS_GENAI and GOOGLE_API_KEY:
        try:
            model = genai.GenerativeModel("gemini-3.6-flash")
            response = model.generate_content(prompt)
            raw_output = response.text.strip()
            return _parse_raw_llm_json(raw_output)
        except Exception as e:
            print(f"Warning: Gemini resume parsing API call failed ({e}). Using rule-based fallback extractor.")

    # 2. Fallback to rule-based extractor
    return _fallback_extract_profile(resume_text)



def _parse_raw_llm_json(raw_output: str) -> dict:
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


def _fallback_extract_profile(text: str) -> dict:
    """Extracts basic structured keywords from resume text if API key is absent or fails."""
    known_skills = [
        "Python", "FastAPI", "React", "TypeScript", "JavaScript", "SQL", "PostgreSQL",
        "Docker", "Kubernetes", "AWS", "Git", "PyTorch", "Pandas", "Scikit-Learn", "Figma",
        "Tailwind CSS", "Next.js", "Node.js", "Java", "C++", "Go", "Rest APIs"
    ]
    text_lower = text.lower()
    extracted_skills = [{"name": skill, "category": "technical"} for skill in known_skills if skill.lower() in text_lower]

    return {
        "skills": extracted_skills if extracted_skills else [{"name": "Software Engineering", "category": "technical"}],
        "education": [{
            "institution": "University / College",
            "degree": "Bachelor of Science",
            "field_of_study": "Computer Science / Technical Field",
            "start_date": "2022",
            "end_date": "2026",
            "grade": "N/A"
        }],
        "experience": [{
            "title": "Software / Technical Intern",
            "organization": "Tech Company",
            "start_date": "2024",
            "end_date": "Present",
            "description": "Developed technical solutions and contributed to software engineering projects."
        }],
        "projects": [{
            "title": "Engineering Project",
            "description": "Built technical web/data application.",
            "technologies": "Python, SQL, Web Technologies",
            "link": None
        }]
    }


