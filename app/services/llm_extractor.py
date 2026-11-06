"""
Resume LLM Extractor
====================
Converts raw resume text → structured JSON profile.
Uses Gemini with a concise prompt (fast, reliable on Render free tier).
Falls back to rule-based extraction if all LLM calls fail.
"""
import json
import re
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

# ---------------------------------------------------------------------------
# Prompt — kept SHORT on purpose.
# Gemini flash handles 2k-token prompts in ~3-6s.
# Longer prompts increase latency and timeout risk on Render free tier.
# ---------------------------------------------------------------------------

_SYSTEM_INSTRUCTION = (
    "You are a precise resume parser. Extract ONLY real information from the resume. "
    "NEVER invent, guess, or use placeholder values. Use null for missing fields. "
    "Respond with ONLY valid JSON — no markdown, no explanation."
)

_EXTRACTION_PROMPT = """\
Extract structured information from this resume. Return ONLY valid JSON, no markdown.

JSON schema (use these exact keys):
{
  "skills": [{"name": "...", "category": "technical|tool|soft"}],
  "education": [{"institution": "...", "degree": "...", "field_of_study": "...", "start_date": "...", "end_date": "...", "grade": "..."}],
  "experience": [{"title": "...", "organization": "...", "start_date": "...", "end_date": "...", "description": "..."}],
  "projects": [{"title": "...", "description": "...", "technologies": "...", "link": "..."}]
}

Rules:
- skills: extract EVERY skill (languages, frameworks, databases, cloud, tools, soft skills). category=technical for langs/frameworks/concepts, tool for platforms/IDEs/services, soft for interpersonal.
- education: use the REAL institution name from the resume (e.g. "Lovely Professional University", "IIT Delhi"). NEVER use "University / College" or similar placeholders.
- experience: use REAL company names and REAL job titles. Include ALL bullet points in description.
- projects: include ALL projects with their tech stacks and links if present.
- Use null for any field not found in the resume text. Return [] for empty sections.

Resume:
---
{resume_text}
---"""


# ---------------------------------------------------------------------------
# Hallucination patterns — output is rejected if these appear
# ---------------------------------------------------------------------------
_BAD_PATTERNS = [
    "university / college", "university/college", "tech company",
    "company name", "organization name", "software / technical intern",
    "job title", "your company", "developed technical solutions",
    "bachelor of science in computer science / technical field",
    "computer science / technical field",
]


def _is_bad(value: str) -> bool:
    if not value:
        return False
    v = value.lower().strip()
    return any(p in v for p in _BAD_PATTERNS)


def _clean(data: dict) -> dict:
    """Remove hallucinated/placeholder entries from LLM output."""
    edu = [
        e for e in data.get("education", []) or []
        if e and not _is_bad(e.get("institution", "") or "")
        and not _is_bad(e.get("degree", "") or "")
    ]
    exp = [
        e for e in data.get("experience", []) or []
        if e and not _is_bad(e.get("title", "") or "")
        and not _is_bad(e.get("organization", "") or "")
    ]
    proj = [
        p for p in data.get("projects", []) or []
        if p and not _is_bad(p.get("title", "") or "")
    ]

    # De-duplicate by key
    def dedup(items, keys):
        seen, out = set(), []
        for item in items:
            k = tuple((item.get(k) or "").lower().strip() for k in keys)
            if k not in seen:
                seen.add(k)
                out.append(item)
        return out

    return {
        "skills": data.get("skills", []) or [],
        "education": dedup(edu, ["institution", "degree"]),
        "experience": dedup(exp, ["title", "organization"]),
        "projects": dedup(proj, ["title"]),
    }


def _parse_json(raw: str) -> dict:
    """Strip markdown fences and parse JSON robustly."""
    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
    raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE)
    raw = raw.strip()
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        m = re.search(r"\{[\s\S]+\}", raw)
        if m:
            parsed = json.loads(m.group())
        else:
            raise ValueError(f"No valid JSON in LLM output: {raw[:200]}")
    for key in ("skills", "education", "experience", "projects"):
        if not isinstance(parsed.get(key), list):
            parsed[key] = []
    return parsed


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def extract_structured_profile(resume_text: str) -> dict:
    """
    Tries Gemini first (fast models, 20s timeout each).
    Falls back to rule-based extraction on all failures.
    Always returns a dict with skills / education / experience / projects.
    """
    if not resume_text or not resume_text.strip():
        print("[llm_extractor] Empty resume text — returning empty profile.")
        return {"skills": [], "education": [], "experience": [], "projects": []}

    # Truncate to 6000 chars max to keep prompt fast on free-tier Gemini
    text_for_prompt = resume_text[:6000]
    prompt = _EXTRACTION_PROMPT.format(resume_text=text_for_prompt)

    if HAS_GENAI and GOOGLE_API_KEY:
        # Try fastest models first; fall through on any failure
        for model_name in ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"]:
            try:
                model = genai.GenerativeModel(
                    model_name,
                    system_instruction=_SYSTEM_INSTRUCTION,
                )
                response = model.generate_content(
                    prompt,
                    generation_config={
                        "temperature": 0.0,
                        "max_output_tokens": 2048,
                    },
                    request_options={"timeout": 20},
                )
                raw = response.text.strip()
                parsed = _parse_json(raw)
                cleaned = _clean(parsed)

                n_skills = len(cleaned["skills"])
                n_edu = len(cleaned["education"])
                n_exp = len(cleaned["experience"])
                n_proj = len(cleaned["projects"])

                print(
                    f"[llm_extractor] {model_name}: "
                    f"skills={n_skills}, edu={n_edu}, exp={n_exp}, proj={n_proj}"
                )

                # Accept if we got any meaningful data
                if n_skills > 0 or n_edu > 0 or n_exp > 0 or n_proj > 0:
                    return cleaned

                print(f"[llm_extractor] {model_name} returned all-empty — trying next.")

            except Exception as e:
                print(f"[llm_extractor] {model_name} failed: {e}")
                continue
    else:
        print("[llm_extractor] No GOOGLE_API_KEY — using rule-based fallback.")

    print("[llm_extractor] All LLM models failed — using rule-based fallback.")
    return _fallback(resume_text)


# ---------------------------------------------------------------------------
# Rule-based fallback
# ---------------------------------------------------------------------------

_TECH_SKILLS = [
    # Languages
    "Python", "Java", "C", "C++", "C#", "JavaScript", "TypeScript", "Go", "Golang",
    "Rust", "Swift", "Kotlin", "Ruby", "PHP", "Scala", "R", "MATLAB",
    "Shell", "Bash", "Dart", "Flutter", "HTML", "CSS", "HTML5", "CSS3",
    # Web / backend
    "React", "Angular", "Vue", "Vue.js", "Next.js", "Svelte",
    "FastAPI", "Django", "Flask", "Spring Boot", "Express", "Node.js",
    "Laravel", "ASP.NET", ".NET", "GraphQL", "REST APIs",
    # Data / ML / AI
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "Data Science",
    "TensorFlow", "PyTorch", "Keras", "Scikit-Learn", "Pandas", "NumPy",
    "Matplotlib", "Seaborn", "Hugging Face", "OpenCV", "XGBoost", "LightGBM",
    "RAG", "LLM", "Generative AI", "Prompt Engineering", "Transformers",
    # Databases
    "SQL", "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "Cassandra",
    "Elasticsearch", "DynamoDB", "Firebase", "Supabase", "NoSQL",
    # DevOps / Cloud
    "Docker", "Kubernetes", "AWS", "GCP", "Azure", "CI/CD",
    "Jenkins", "GitHub Actions", "Terraform", "Linux", "Nginx",
    "Microservices", "Serverless", "Cloud Computing",
    # Tools & concepts
    "Git", "GitHub", "GitLab", "JIRA", "Postman", "VS Code", "Figma",
    "OOP", "Data Structures", "Algorithms", "System Design",
    "Agile", "Scrum", "Full Stack", "Backend", "Frontend",
]

_SOFT_SKILLS = [
    "Communication", "Leadership", "Teamwork", "Problem Solving",
    "Critical Thinking", "Time Management", "Adaptability",
    "Creativity", "Collaboration", "Project Management",
    "Analytical", "Detail-Oriented", "Self-Motivated",
]


def _fallback(text: str) -> dict:
    """Keyword scan — reliable for skills; never fabricates education/experience/projects."""
    lo = text.lower()
    skills = (
        [{"name": s, "category": "technical"} for s in _TECH_SKILLS if s.lower() in lo]
        + [{"name": s, "category": "soft"}      for s in _SOFT_SKILLS  if s.lower() in lo]
    )

    # Try to find a real institution name
    institution = _find_institution(text)
    education = []
    if institution:
        degree = _find_degree(lo)
        field  = _find_field(lo)
        education = [{
            "institution": institution,
            "degree": degree,
            "field_of_study": field,
            "start_date": None,
            "end_date": None,
            "grade": None,
        }]

    return {"skills": skills, "education": education, "experience": [], "projects": []}


def _find_institution(text: str) -> str | None:
    patterns = [
        # Named universities / institutes — match the full name up to newline
        r"(?:(?:lovely\s+professional|lpu|iit|nit|bits|iiit|vit|srm|manipal|amity)[^\n,]{0,60})",
        r"(?:\w[\w\s]{2,40}(?:university|college|institute|school))[^\n,]{0,30}",
        r"(?:university|college|institute)\s+of\s+\w[\w\s]{2,40}",
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            name = m.group().strip().rstrip(".,;")
            if len(name) > 4:
                return name[:100]
    return None


def _find_degree(text_lower: str) -> str | None:
    for pat, label in [
        (r"b\.?tech|bachelor of technology", "Bachelor of Technology"),
        (r"b\.?e\b|bachelor of engineering",  "Bachelor of Engineering"),
        (r"b\.?sc\b|bachelor of science",      "Bachelor of Science"),
        (r"m\.?tech|master of technology",     "Master of Technology"),
        (r"m\.?sc\b|master of science",        "Master of Science"),
        (r"\bmba\b",                           "MBA"),
        (r"ph\.?d|doctorate",                  "PhD"),
        (r"\bdiploma\b",                       "Diploma"),
    ]:
        if re.search(pat, text_lower):
            return label
    return None


def _find_field(text_lower: str) -> str | None:
    for kw, label in [
        ("computer science",       "Computer Science"),
        ("information technology", "Information Technology"),
        ("software engineering",   "Software Engineering"),
        ("electrical engineering", "Electrical Engineering"),
        ("mechanical engineering", "Mechanical Engineering"),
        ("data science",           "Data Science"),
        ("artificial intelligence","Artificial Intelligence"),
        ("electronics",            "Electronics and Communication"),
    ]:
        if kw in text_lower:
            return label
    return None
