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


EXTRACTION_PROMPT_TEMPLATE = """\
You are an expert resume parser. Extract ALL structured information from the resume text below.
Respond with ONLY valid JSON — no markdown fences, no explanation, no preamble.

Use EXACTLY this JSON structure:
{
  "skills": [
    {"name": "Python", "category": "technical"},
    {"name": "Communication", "category": "soft"},
    {"name": "VS Code", "category": "tool"}
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Bachelor of Technology",
      "field_of_study": "Computer Science",
      "start_date": "2021",
      "end_date": "2025",
      "grade": "8.5 CGPA"
    }
  ],
  "experience": [
    {
      "title": "Software Engineering Intern",
      "organization": "Company Name",
      "start_date": "May 2024",
      "end_date": "July 2024",
      "description": "Full description of responsibilities and achievements"
    }
  ],
  "projects": [
    {
      "title": "Project Name",
      "description": "What the project does and your role",
      "technologies": "Python, React, PostgreSQL",
      "link": "https://github.com/..."
    }
  ]
}

EXTRACTION RULES (follow carefully):
1. Skills — extract EVERY skill mentioned ANYWHERE in the resume:
   - Programming languages (Python, Java, C++, JavaScript, TypeScript, etc.)
   - Frameworks & libraries (React, FastAPI, Django, Spring Boot, TensorFlow, etc.)
   - Databases (PostgreSQL, MySQL, MongoDB, Redis, etc.)
   - DevOps & cloud (Docker, Kubernetes, AWS, GCP, Azure, Git, CI/CD, etc.)
   - Tools (VS Code, Postman, Figma, JIRA, etc.)
   - Soft skills (Communication, Leadership, Teamwork, Problem Solving, etc.)
   - Concepts (Machine Learning, REST APIs, Microservices, Data Structures, etc.)
   - Assign category: "technical" for languages/frameworks/databases/concepts, "tool" for dev tools/cloud platforms, "soft" for interpersonal skills
2. Education — extract ALL education entries (degree, diploma, certification, etc.)
3. Experience — extract ALL internships, jobs, research positions, and volunteering
4. Projects — extract ALL projects (academic, personal, open-source). Include GitHub/demo links if present.
5. Use null for any field genuinely not present. Do NOT guess or hallucinate.
6. For descriptions, include the full text — do not truncate.

Resume text:
---
__RESUME_TEXT__
---
"""


def extract_structured_profile(resume_text: str) -> dict:
    """
    Main entry point. Tries Gemini LLM first, falls back to rule-based extraction.
    Returns a dict with keys: skills, education, experience, projects.
    """
    prompt = EXTRACTION_PROMPT_TEMPLATE.replace("__RESUME_TEXT__", resume_text)

    # 1. Try Gemini: gemini-1.5-flash is fast, free-tier, accurate
    if HAS_GENAI and GOOGLE_API_KEY:
        for model_name in ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.0-pro"]:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(
                    prompt,
                    generation_config={
                        "temperature": 0.0,       # deterministic extraction
                        "max_output_tokens": 4096, # enough for long resumes
                    },
                )
                raw_output = response.text.strip()
                parsed = _parse_raw_llm_json(raw_output)
                # Validate we got meaningful data
                if parsed.get("skills") or parsed.get("experience") or parsed.get("projects"):
                    return parsed
            except Exception as e:
                print(f"[llm_extractor] Gemini ({model_name}) failed: {e}. Trying next.")
                continue

    # 2. Rule-based fallback
    print("[llm_extractor] All Gemini attempts failed. Using rule-based fallback.")
    return _fallback_extract_profile(resume_text)


def _parse_raw_llm_json(raw_output: str) -> dict:
    """
    Robustly strips markdown fences and parses JSON.
    Handles: ```json ... ```, ``` ... ```, plain JSON.
    """
    # Strip markdown code fences
    raw_output = re.sub(r"^```(?:json)?\s*", "", raw_output, flags=re.MULTILINE)
    raw_output = re.sub(r"\s*```$", "", raw_output, flags=re.MULTILINE)
    raw_output = raw_output.strip()

    # Try parsing as-is first
    try:
        parsed = json.loads(raw_output)
    except json.JSONDecodeError:
        # Try to extract JSON object from the text (in case of extra prose)
        match = re.search(r"\{[\s\S]+\}", raw_output)
        if match:
            parsed = json.loads(match.group())
        else:
            raise ValueError(f"LLM returned unparseable output: {raw_output[:200]}")

    required_keys = {"skills", "education", "experience", "projects"}
    if not required_keys.issubset(parsed.keys()):
        missing = required_keys - parsed.keys()
        raise ValueError(f"LLM response missing required keys: {missing}")

    # Normalize: ensure lists (not None)
    for key in required_keys:
        if not isinstance(parsed.get(key), list):
            parsed[key] = []

    return parsed


# ---------------------------------------------------------------------------
# Rule-based fallback — covers 100+ common tech skills
# ---------------------------------------------------------------------------

_TECHNICAL_SKILLS = [
    # Languages
    "Python", "Java", "C", "C++", "C#", "JavaScript", "TypeScript", "Go", "Golang",
    "Rust", "Swift", "Kotlin", "Ruby", "PHP", "Scala", "R", "MATLAB", "Shell",
    "Bash", "PowerShell", "Dart", "Flutter", "HTML", "CSS", "HTML5", "CSS3",
    # Web frameworks
    "React", "Angular", "Vue", "Vue.js", "Next.js", "Nuxt.js", "Svelte",
    "FastAPI", "Django", "Flask", "Spring", "Spring Boot", "Express", "Node.js",
    "Laravel", "Rails", "Ruby on Rails", "ASP.NET", ".NET", "GraphQL",
    # Data / ML
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "Data Science",
    "TensorFlow", "PyTorch", "Keras", "Scikit-Learn", "Pandas", "NumPy", "Matplotlib",
    "Seaborn", "NLTK", "SpaCy", "Hugging Face", "OpenCV", "XGBoost", "LightGBM",
    "RAG", "LLM", "Generative AI", "Prompt Engineering", "Transformers",
    # Databases
    "SQL", "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "Cassandra",
    "Elasticsearch", "DynamoDB", "Firebase", "Supabase", "Oracle", "MS SQL",
    "NoSQL", "Vector Database", "Pinecone", "ChromaDB", "FAISS",
    # DevOps & cloud
    "Docker", "Kubernetes", "AWS", "GCP", "Azure", "CI/CD", "Jenkins", "GitHub Actions",
    "Terraform", "Ansible", "Linux", "Nginx", "Apache", "REST", "REST APIs",
    "GraphQL", "gRPC", "Microservices", "Serverless", "Cloud Computing",
    # Tools
    "Git", "GitHub", "GitLab", "Bitbucket", "JIRA", "Confluence", "Postman",
    "VS Code", "IntelliJ", "PyCharm", "Figma", "Notion",
    # Concepts
    "Object-Oriented Programming", "OOP", "Data Structures", "Algorithms",
    "System Design", "API Design", "Agile", "Scrum", "Software Engineering",
    "Full Stack", "Backend", "Frontend", "Web Development", "Mobile Development",
]

_SOFT_SKILLS = [
    "Communication", "Leadership", "Teamwork", "Problem Solving", "Critical Thinking",
    "Time Management", "Adaptability", "Creativity", "Collaboration", "Mentoring",
    "Project Management", "Analytical", "Detail-Oriented", "Self-Motivated",
]


def _fallback_extract_profile(text: str) -> dict:
    """
    Keyword-based extraction when Gemini is unavailable.
    Scans resume text for known skills; attempts to parse sections.
    """
    text_lower = text.lower()

    # ── Skills ─────────────────────────────────────────────────────────────
    found_technical = [
        {"name": s, "category": "technical"}
        for s in _TECHNICAL_SKILLS
        if s.lower() in text_lower
    ]
    found_soft = [
        {"name": s, "category": "soft"}
        for s in _SOFT_SKILLS
        if s.lower() in text_lower
    ]
    all_skills = found_technical + found_soft
    if not all_skills:
        all_skills = [{"name": "Software Engineering", "category": "technical"}]

    # ── Education — look for degree keywords ───────────────────────────────
    education = []
    degree_patterns = [
        (r"b\.?tech|bachelor of technology", "Bachelor of Technology"),
        (r"b\.?e\.?|bachelor of engineering", "Bachelor of Engineering"),
        (r"b\.?sc|bachelor of science", "Bachelor of Science"),
        (r"m\.?tech|master of technology", "Master of Technology"),
        (r"m\.?sc|master of science", "Master of Science"),
        (r"mba|master of business", "MBA"),
        (r"ph\.?d|doctorate", "PhD"),
        (r"diploma", "Diploma"),
    ]
    for pattern, degree_label in degree_patterns:
        if re.search(pattern, text_lower):
            education.append({
                "institution": _extract_institution(text) or "University / College",
                "degree": degree_label,
                "field_of_study": _extract_field(text_lower),
                "start_date": None,
                "end_date": None,
                "grade": None,
            })
            break

    if not education:
        education = [{
            "institution": _extract_institution(text) or "University / College",
            "degree": "Bachelor's Degree",
            "field_of_study": "Computer Science / Engineering",
            "start_date": None,
            "end_date": None,
            "grade": None,
        }]

    # ── Experience — look for internship/job keywords ──────────────────────
    experience = []
    if re.search(r"intern|internship|engineer|developer|analyst|researcher", text_lower):
        experience = [{
            "title": "Software / Technical Intern",
            "organization": None,
            "start_date": None,
            "end_date": None,
            "description": "Technical contributions extracted from resume. Upload a text-based PDF for full extraction.",
        }]

    # ── Projects ───────────────────────────────────────────────────────────
    projects = []
    if re.search(r"project|built|developed|created|implemented", text_lower):
        tech_str = ", ".join([s["name"] for s in found_technical[:6]]) or "Various Technologies"
        projects = [{
            "title": "Technical Project",
            "description": "Project details extracted from resume. Upload a text-based PDF for full extraction.",
            "technologies": tech_str,
            "link": None,
        }]

    return {
        "skills": all_skills,
        "education": education,
        "experience": experience,
        "projects": projects,
    }


def _extract_institution(text: str) -> str | None:
    """Try to find a university/college name."""
    patterns = [
        r"(?:university|college|institute|iit|nit|bits|iiit|vit|srm|manipal|amity|lpu)[^\n,]{0,60}",
        r"(?:of technology|of science|of engineering)[^\n,]{0,40}",
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            return m.group().strip()[:80]
    return None


def _extract_field(text_lower: str) -> str:
    """Guess the field of study."""
    fields = [
        ("computer science", "Computer Science"),
        ("information technology", "Information Technology"),
        ("software engineering", "Software Engineering"),
        ("electrical engineering", "Electrical Engineering"),
        ("mechanical engineering", "Mechanical Engineering"),
        ("data science", "Data Science"),
        ("artificial intelligence", "Artificial Intelligence"),
        ("electronics", "Electronics and Communication"),
    ]
    for keyword, label in fields:
        if keyword in text_lower:
            return label
    return "Computer Science / Engineering"
