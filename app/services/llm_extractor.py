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
You are an expert resume parser. Your ONLY job is to extract real information from the resume text below.

CRITICAL RULES — read carefully before responding:
1. ONLY extract information that is EXPLICITLY written in the resume text.
2. NEVER invent, guess, or use placeholder values. If you cannot find a real value, use null.
3. Do NOT use generic descriptions like "Tech Company", "University / College", "Developed technical solutions", "Software / Technical Intern", or any template-like text.
4. If the resume text is too short, garbled, or unclear — still only extract what is clearly readable. Return empty arrays rather than fake data.
5. Respond with ONLY valid JSON — no markdown fences, no explanation, no preamble.

Use EXACTLY this JSON structure (the values shown are FAKE EXAMPLES — replace with REAL data from the resume):
{
  "skills": [
    {"name": "REAL_SKILL_FROM_RESUME", "category": "technical"},
    {"name": "REAL_SOFT_SKILL", "category": "soft"},
    {"name": "REAL_TOOL", "category": "tool"}
  ],
  "education": [
    {
      "institution": "ACTUAL_UNIVERSITY_NAME_FROM_RESUME",
      "degree": "ACTUAL_DEGREE_e.g._B.Tech",
      "field_of_study": "ACTUAL_FIELD_e.g._Computer_Science",
      "start_date": "ACTUAL_YEAR_e.g._2021",
      "end_date": "ACTUAL_YEAR_OR_PRESENT",
      "grade": "ACTUAL_CGPA_OR_PERCENTAGE_OR_NULL"
    }
  ],
  "experience": [
    {
      "title": "ACTUAL_JOB_TITLE_FROM_RESUME",
      "organization": "ACTUAL_COMPANY_NAME_FROM_RESUME",
      "start_date": "ACTUAL_MONTH_YEAR",
      "end_date": "ACTUAL_MONTH_YEAR_OR_PRESENT",
      "description": "ACTUAL_RESPONSIBILITIES_AND_ACHIEVEMENTS_FROM_RESUME"
    }
  ],
  "projects": [
    {
      "title": "ACTUAL_PROJECT_NAME",
      "description": "ACTUAL_PROJECT_DESCRIPTION_FROM_RESUME",
      "technologies": "ACTUAL_TECH_STACK_USED",
      "link": "ACTUAL_URL_OR_NULL"
    }
  ]
}

EXTRACTION RULES:
1. Skills — extract EVERY skill mentioned ANYWHERE in the resume:
   - Programming languages (Python, Java, C++, JavaScript, TypeScript, etc.)
   - Frameworks & libraries (React, FastAPI, Django, Spring Boot, TensorFlow, etc.)
   - Databases (PostgreSQL, MySQL, MongoDB, Redis, etc.)
   - DevOps & cloud (Docker, Kubernetes, AWS, GCP, Azure, Git, CI/CD, etc.)
   - Tools (VS Code, Postman, Figma, JIRA, etc.)
   - Soft skills (Communication, Leadership, Teamwork, Problem Solving, etc.)
   - Concepts (Machine Learning, REST APIs, Microservices, Data Structures, etc.)
   - category: "technical" for languages/frameworks/databases/concepts, "tool" for dev tools/platforms, "soft" for interpersonal
2. Education — extract ALL real education entries. institution MUST be a real school name from the resume.
3. Experience — extract ALL real work entries. organization MUST be a real company name from the resume.
4. Projects — extract ALL projects (academic, personal, open-source). Include real GitHub/demo links if present.
5. Use null for any field not found. NEVER use placeholder text.
6. For descriptions, copy the full text — do not truncate.

Resume text:
---
__RESUME_TEXT__
---
"""

# Values that indicate hallucinated/generic output — reject these
_HALLUCINATION_PATTERNS = [
    "university / college", "university/college",
    "tech company", "company name", "organization name",
    "software / technical intern", "software/technical intern",
    "technical intern", "job title", "your company",
    "developed technical solutions and contributed",
    "bachelor of science in computer science / technical field",
    "computer science / technical field",
    "bachelor of science / technical",
    "field of study",
]


def _is_hallucinated(value: str) -> bool:
    """Returns True if the value looks like a template placeholder."""
    if not value:
        return False
    v = value.lower().strip()
    return any(pat in v for pat in _HALLUCINATION_PATTERNS)


def _clean_extracted(data: dict) -> dict:
    """
    Post-process LLM output to remove hallucinated/generic entries.
    Logs any removed entries so we can track the issue.
    """
    # Clean education
    clean_edu = []
    for edu in data.get("education", []):
        inst = edu.get("institution", "") or ""
        if _is_hallucinated(inst):
            print(f"[llm_extractor] Rejected hallucinated education entry: institution='{inst}'")
            continue
        # Also reject if degree+field looks generic
        degree = edu.get("degree", "") or ""
        field = edu.get("field_of_study", "") or ""
        if _is_hallucinated(degree) or _is_hallucinated(field):
            print(f"[llm_extractor] Rejected hallucinated education entry: degree='{degree}', field='{field}'")
            continue
        clean_edu.append(edu)

    # Clean experience
    clean_exp = []
    for exp in data.get("experience", []):
        title = exp.get("title", "") or ""
        org = exp.get("organization", "") or ""
        desc = exp.get("description", "") or ""
        if _is_hallucinated(title) or _is_hallucinated(org) or _is_hallucinated(desc):
            print(f"[llm_extractor] Rejected hallucinated experience: title='{title}', org='{org}'")
            continue
        clean_exp.append(exp)

    # Clean projects (less strict — just reject if title is generic)
    clean_proj = []
    for proj in data.get("projects", []):
        title = proj.get("title", "") or ""
        if _is_hallucinated(title):
            print(f"[llm_extractor] Rejected hallucinated project: title='{title}'")
            continue
        clean_proj.append(proj)

    # De-duplicate education by institution+degree
    seen_edu = set()
    deduped_edu = []
    for edu in clean_edu:
        key = (
            (edu.get("institution") or "").lower().strip(),
            (edu.get("degree") or "").lower().strip(),
        )
        if key not in seen_edu:
            seen_edu.add(key)
            deduped_edu.append(edu)

    # De-duplicate experience by title+organization
    seen_exp = set()
    deduped_exp = []
    for exp in clean_exp:
        key = (
            (exp.get("title") or "").lower().strip(),
            (exp.get("organization") or "").lower().strip(),
        )
        if key not in seen_exp:
            seen_exp.add(key)
            deduped_exp.append(exp)

    return {
        "skills": data.get("skills", []),
        "education": deduped_edu,
        "experience": deduped_exp,
        "projects": clean_proj,
    }


def extract_structured_profile(resume_text: str) -> dict:
    """
    Main entry point. Tries Gemini LLM first, falls back to rule-based extraction.
    Returns a dict with keys: skills, education, experience, projects.
    """
    prompt = EXTRACTION_PROMPT_TEMPLATE.replace("__RESUME_TEXT__", resume_text)

    # 1. Try Gemini — use the fastest available models with an explicit timeout so
    #    Render's request timeout can't silently kill the call and drop to fallback.
    #    Model priority: gemini-2.0-flash (fast, current) → gemini-1.5-flash → gemini-flash-latest
    if HAS_GENAI and GOOGLE_API_KEY:
        for model_name in ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"]:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(
                    prompt,
                    generation_config={
                        "temperature": 0.0,        # deterministic extraction
                        "max_output_tokens": 4096, # enough for long resumes
                    },
                    request_options={"timeout": 25},  # explicit 25s — prevents silent hang on Render
                )
                raw_output = response.text.strip()
                parsed = _parse_raw_llm_json(raw_output)
                cleaned = _clean_extracted(parsed)
                # Validate we got meaningful data (skills are easiest to extract)
                if cleaned.get("skills") or cleaned.get("experience") or cleaned.get("projects"):
                    print(f"[llm_extractor] Gemini ({model_name}) extracted: "
                          f"{len(cleaned['skills'])} skills, {len(cleaned['education'])} edu, "
                          f"{len(cleaned['experience'])} exp, {len(cleaned['projects'])} projects")
                    return cleaned
                print(f"[llm_extractor] Gemini ({model_name}) returned empty data — trying next model.")
            except Exception as e:
                print(f"[llm_extractor] Gemini ({model_name}) failed: {e}. Trying next.")
                continue
    else:
        print("[llm_extractor] GOOGLE_API_KEY not set — skipping Gemini, using rule-based fallback.")

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
    Keyword-based fallback used only when Gemini is unavailable.
    ONLY extracts skills via keyword matching — never invents education,
    experience or projects. Those require LLM to be accurate.
    """
    text_lower = text.lower()

    # ── Skills — reliable via keyword scan ─────────────────────────────────
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

    # ── Education — only if we can find a real institution name ────────────
    education = []
    institution = _extract_institution(text)
    if institution:
        degree = None
        for pattern, label in [
            (r"b\.?tech|bachelor of technology", "Bachelor of Technology"),
            (r"b\.?e\b|bachelor of engineering", "Bachelor of Engineering"),
            (r"b\.?sc\b|bachelor of science", "Bachelor of Science"),
            (r"m\.?tech|master of technology", "Master of Technology"),
            (r"m\.?sc\b|master of science", "Master of Science"),
            (r"\bmba\b|master of business", "MBA"),
            (r"ph\.?d|doctorate", "PhD"),
            (r"\bdiploma\b", "Diploma"),
        ]:
            if re.search(pattern, text_lower):
                degree = label
                break
        field = _extract_field(text_lower)
        education = [{
            "institution": institution,
            "degree": degree,
            "field_of_study": field if field != "Computer Science / Engineering" else None,
            "start_date": None,
            "end_date": None,
            "grade": None,
        }]

    # ── Experience and Projects — leave empty; never fabricate ─────────────
    # These require accurate LLM extraction. Returning fake entries is worse
    # than returning nothing.

    return {
        "skills": all_skills,
        "education": education,
        "experience": [],
        "projects": [],
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
