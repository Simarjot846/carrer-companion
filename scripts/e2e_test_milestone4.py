"""
M4.2 — Comprehensive End-to-End Test Suite
AI Career Companion · Milestone 4

Tests the full workflow for 3 student profiles:
  Profile creation → Resume upload → Job matching → Skill gap analysis →
  Resume/cover letter customization → Interview prep →
  Application tracking → Conversational assistant (multi-turn)

Also checks:
  - Cross-agent consistency (skill gap vs customization vs interview prep)
  - Resume parsing quality (not just fallback defaults)
  - No hallucination in customization output
  - Assistant context retention over 4-5 turns

Run from repo root:
    python scripts/e2e_test_milestone4.py

Requires the FastAPI server to be running on http://localhost:8000
"""

import requests
import json
import time
import re
import sys
from datetime import date, datetime
from typing import Optional
from pathlib import Path

BASE = "http://localhost:8000"
RESULTS = []  # Collects all check results for the summary

# ── Three sample student profiles for testing ────────────────────────────────
# Each has a PDF resume in the test_resumes/ directory.
# We create real students, upload real PDFs, and trace the full pipeline.

_RUN_ID = int(time.time())
TEST_PROFILES = [
    {
        "name": "Test Student Alpha",
        "email": f"alpha.e2e.{_RUN_ID}@testmail.com",
        "domain": "software engineering",
        "resume_path": None,
    },
    {
        "name": "Test Student Beta",
        "email": f"beta.e2e.{_RUN_ID}@testmail.com",
        "domain": "data science",
        "resume_path": None,
    },
    {
        "name": "Test Student Gamma",
        "email": f"gamma.e2e.{_RUN_ID}@testmail.com",
        "domain": "machine learning",
        "resume_path": None,
    },
]

# ── Synthetic resume PDFs (created programmatically if not present) ──────────
SYNTHETIC_RESUMES = {
    "alpha": """
Alex Johnson
alex.johnson@university.edu | github.com/alexjohnson | linkedin.com/in/alexjohnson

EDUCATION
B.S. Computer Science, Stanford University, 2022-2026, GPA: 3.8

SKILLS
Technical: Python, FastAPI, PostgreSQL, Docker, REST APIs, Git, SQL, JavaScript, React
Tools: VS Code, Postman, GitHub Actions, Linux
Soft Skills: Problem solving, Teamwork, Communication

EXPERIENCE
Backend Engineering Intern, TechCorp Inc., Jun 2024 - Aug 2024
- Developed RESTful APIs using FastAPI and PostgreSQL serving 50k+ daily users
- Reduced API latency by 35% through query optimization and Redis caching
- Wrote comprehensive unit and integration tests achieving 92% code coverage

Software Developer Intern, StartupXYZ, Jan 2024 - May 2024
- Built microservices architecture components using Python and Docker
- Collaborated with frontend team on 3 major feature releases

PROJECTS
AI Resume Matcher: Built an AI-powered resume matching system using Python, 
sentence-transformers, and FastAPI. Deployed on AWS with PostgreSQL backend.

Task Management API: RESTful API with JWT auth, rate limiting, and Swagger documentation.
Technologies: Python, FastAPI, PostgreSQL, Redis, Docker
""",
    "beta": """
Maya Sharma
maya.sharma@mit.edu | github.com/mayasharma

EDUCATION
M.S. Data Science, MIT, 2023-2025, GPA: 3.9
B.S. Statistics, UC Berkeley, 2019-2023

SKILLS
Technical: Python, R, SQL, TensorFlow, PyTorch, scikit-learn, Pandas, NumPy, Matplotlib, Seaborn
Tools: Jupyter, Tableau, Power BI, Apache Spark, AWS SageMaker, dbt, Airflow
Databases: PostgreSQL, MySQL, MongoDB

EXPERIENCE
Data Science Intern, DataAnalytics Corp, May 2024 - Aug 2024
- Developed predictive models using XGBoost achieving 87% accuracy on churn prediction
- Built automated data pipelines processing 5TB daily using Apache Spark and Airflow
- Created executive dashboards in Tableau reducing reporting time by 60%

Research Assistant, MIT AI Lab, Sep 2023 - Present
- Conducting research on transformer architectures for time-series forecasting
- Published 1 paper at NeurIPS workshop on attention mechanisms

PROJECTS
Customer Churn Prediction: End-to-end ML pipeline with feature engineering, 
model selection, and deployment. Technologies: Python, scikit-learn, FastAPI, Docker

NLP Sentiment Analysis: BERT fine-tuning for financial news sentiment with 91% F1 score.
""",
    "gamma": """
Jordan Kim
jordan.kim@caltech.edu | github.com/jordankim

EDUCATION
B.S. Computer Science and Mathematics, Caltech, 2021-2025, GPA: 3.7

SKILLS
Technical: Python, PyTorch, TensorFlow, JAX, CUDA, C++, MATLAB
ML/AI: Deep Learning, Reinforcement Learning, Computer Vision, NLP, LLMs
Tools: Git, Docker, Weights & Biases, Hugging Face Transformers, Ray

EXPERIENCE
ML Research Intern, DeepMind, Jun 2024 - Sep 2024
- Implemented novel attention mechanisms for protein structure prediction
- Achieved 12% improvement on benchmark datasets for molecular property prediction
- Collaborated with senior researchers on 2 publication-track projects

Teaching Assistant, Caltech CS156 ML Course, Sep 2023 - Jun 2024
- Led weekly lab sessions for 60 students on practical ML implementations
- Developed automated grading system using Python

PROJECTS
Vision Transformer for Medical Imaging: Fine-tuned ViT model for rare disease 
detection with 94% sensitivity. Technologies: PyTorch, Hugging Face, CUDA

Reinforcement Learning Trading Agent: Deep Q-Network for portfolio optimization.
Technologies: Python, PyTorch, OpenAI Gym, Ray RLlib
""",
}

# ── Helpers ──────────────────────────────────────────────────────────────────

def check(label: str, passed: bool, detail: str = "", warn: bool = False):
    """Records a check result and prints it."""
    status = "PASS" if passed else ("WARN" if warn else "FAIL")
    symbol = "✓" if passed else ("⚠" if warn else "✗")
    RESULTS.append({"label": label, "status": status, "detail": detail})
    colour = "\033[92m" if passed else ("\033[93m" if warn else "\033[91m")
    reset = "\033[0m"
    print(f"  {colour}{symbol}{reset} [{status}] {label}")
    if detail:
        print(f"       → {detail}")


def create_pdf_bytes(resume_text: str) -> bytes:
    """Creates a valid, PyMuPDF-parseable PDF from resume text using fitz (PyMuPDF)."""
    import fitz  # Always available — it's the same lib used by the parser
    from io import BytesIO
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text((50, 50), resume_text.strip(), fontsize=10, fontname="helv")
    buf = BytesIO()
    doc.save(buf)
    doc.close()
    return buf.getvalue()


def upload_resume_for_student(student_id: int, resume_key: str) -> dict:
    """Uploads a synthetic resume PDF for the given student."""
    pdf_bytes = create_pdf_bytes(SYNTHETIC_RESUMES[resume_key])
    resp = requests.post(
        f"{BASE}/students/{student_id}/resume",
        files={"file": ("resume.pdf", pdf_bytes, "application/pdf")},
        timeout=90,
    )
    return resp


def profile_has_real_data(profile: dict) -> bool:
    """Returns True if the profile contains non-trivial extracted data."""
    skills = profile.get("skills", [])
    edu = profile.get("education", [])
    exp = profile.get("experience", [])
    return len(skills) >= 3 or len(edu) >= 1 or len(exp) >= 1


def is_generic_reasoning(reasoning: str) -> bool:
    """Flags reasoning that appears generic/fallback (not job-specific)."""
    generic_phrases = [
        "ranked based on dense semantic",
        "partial fit based on foundational",
        "general background",
    ]
    return any(p.lower() in reasoning.lower() for p in generic_phrases)


def check_hallucination(customization: dict, profile: dict) -> tuple[bool, list[str]]:
    """
    Checks if the cover letter introduces skills or experience not in the
    student's original profile. Returns (passed, suspicious_items).
    This is a best-effort heuristic check.
    """
    cover_body = customization.get("cover_letter", {}).get("body", "").lower()
    all_skills = [s["name"].lower() for s in profile.get("skills", [])]
    all_orgs = [
        (e.get("organization") or "").lower() for e in profile.get("experience", [])
    ] + [
        (e.get("institution") or "").lower() for e in profile.get("education", [])
    ] + [
        (p.get("title") or "").lower() for p in profile.get("projects", [])
    ]

    # Look for specific technical claims in the cover letter
    tech_pattern = re.compile(
        r'\b(kubernetes|terraform|kafka|spark|cassandra|hadoop|scala|golang|rust|swift|kotlin)\b',
        re.IGNORECASE,
    )
    claimed_techs = tech_pattern.findall(cover_body)
    suspicious = [t for t in claimed_techs if t.lower() not in all_skills]
    return len(suspicious) == 0, suspicious


def gaps_consistent(skill_gap: dict, customization: dict) -> tuple[bool, str]:
    """
    Checks if the skill gaps identified by the Skill Gap Agent are at least
    partially reflected in the Customization Agent's prioritized_skills list.
    """
    gap_skills = set()
    for item in skill_gap.get("critical_missing", []):
        if s := item.get("skill"):
            gap_skills.add(s.lower())
    for item in skill_gap.get("partially_demonstrated", []):
        if s := item.get("skill"):
            gap_skills.add(s.lower())

    custom_skills = set(
        s.lower() for s in customization.get("resume_customization", {}).get("prioritized_skills", [])
    )

    if not gap_skills or not custom_skills:
        return True, "Insufficient data for comparison"

    # They should be somewhat disjoint — customization highlights strengths,
    # gap analysis highlights weaknesses. If all customization skills are gaps, that's wrong.
    overlap = gap_skills & custom_skills
    all_custom_are_gaps = custom_skills and custom_skills.issubset(gap_skills)
    if all_custom_are_gaps:
        return False, f"Customization is prioritizing gap skills as strengths: {overlap}"
    return True, f"Appropriate separation: {len(overlap)} overlapping skills out of {len(custom_skills)}"


def interview_refs_job_specific_skills(interview: dict, job: dict) -> tuple[bool, str]:
    """
    Checks that interview questions reference at least some of the required
    skills for the target job (not fully generic).
    """
    required = [s.lower() for s in job.get("required_skills", [])]
    all_questions = " ".join(
        q.get("question", "").lower()
        for q in (
            interview.get("technical_questions", []) +
            interview.get("resume_questions", []) +
            interview.get("project_questions", [])
        )
    )
    if not required:
        return True, "No required skills to check against"
    matches = [s for s in required if s in all_questions]
    ratio = len(matches) / len(required)
    if ratio < 0.15:
        return False, f"Only {len(matches)}/{len(required)} required skills referenced in questions"
    return True, f"{len(matches)}/{len(required)} required skills referenced ({ratio:.0%})"


def test_assistant_multi_turn(student_id: int) -> tuple[bool, str]:
    """
    Tests the assistant over 5 turns, verifying context retention.
    Checks that a follow-up about 'the role I just asked about' produces
    a coherent response referencing prior context.
    """
    history = []
    messages = [
        "What are my strongest technical skills for software engineering roles?",
        "Based on what you just told me, which of those skills would be most valuable for backend positions?",
        "Can you compare a backend role versus a data engineering role for someone with my profile?",
        "You mentioned data engineering — what additional skills would I need to pivot there?",
        "Given everything we've discussed, what should I focus on first to improve my candidacy?",
    ]

    for i, msg in enumerate(messages):
        try:
            resp = requests.post(
                f"{BASE}/students/{student_id}/assistant/chat",
                json={"message": msg, "history": history},
                timeout=60,
            )
            if resp.status_code != 200:
                return False, f"Turn {i+1} failed with status {resp.status_code}"
            data = resp.json()
            history = data.get("updated_history", [])
            reply = data.get("reply", "")
            if len(reply) < 20:
                return False, f"Turn {i+1} reply suspiciously short: '{reply[:60]}'"
        except Exception as e:
            return False, f"Turn {i+1} threw exception: {e}"

    # Context retention check: the final reply should reference skills or prior topics
    final_reply = (history[-1]["content"] if history else "").lower()
    context_words = ["skill", "backend", "data", "engineer", "role", "profile", "focus"]
    hits = [w for w in context_words if w in final_reply]
    if len(hits) < 2:
        return False, f"Final reply does not appear context-aware: '{final_reply[:120]}'"
    return True, f"5-turn conversation completed; context words found: {hits}"


# ── Main test runner ─────────────────────────────────────────────────────────

def run_tests():
    print("\n" + "=" * 65)
    print("  AI Career Companion — M4.2 End-to-End Test Suite")
    print(f"  Server: {BASE}")
    print(f"  Date:   {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 65 + "\n")

    # ── 0. Server health check ───────────────────────────────────────────────
    print("[ Health Check ]")
    try:
        r = requests.get(f"{BASE}/", timeout=10)
        check("Server is reachable", r.status_code == 200, f"Status {r.status_code}")
    except Exception as e:
        check("Server is reachable", False, str(e))
        print("\n⛔ Server is not running. Start with: uvicorn app.main:app --reload\n")
        write_results([])
        return

    # ── 1. Seed job postings ─────────────────────────────────────────────────
    print("\n[ Job Postings Seed ]")
    try:
        r = requests.post(f"{BASE}/jobs/seed", timeout=30)
        check("Job seed endpoint responded", r.status_code in (200, 201, 422),
              f"Status {r.status_code} — {r.text[:80]}")
        r2 = requests.get(f"{BASE}/jobs/", timeout=10)
        job_count = len(r2.json()) if r2.ok else 0
        check("Job postings exist in DB", job_count > 0, f"{job_count} postings found")
    except Exception as e:
        check("Job seed", False, str(e))

    student_ids = []
    profiles_data = []
    match_jobs = []  # Best job match per student

    resume_keys = ["alpha", "beta", "gamma"]

    for prof_idx, profile_def in enumerate(TEST_PROFILES):
        print(f"\n{'─'*65}")
        print(f"[ Profile {prof_idx + 1}/3 : {profile_def['name']} ({profile_def['domain']}) ]")
        print(f"{'─'*65}")

        student_id = None
        student_profile = None
        first_job = None

        # ── 1.1 Profile creation ─────────────────────────────────────────────
        print("\n  [1] Profile Creation")
        try:
            r = requests.post(
                f"{BASE}/students/",
                json={"name": profile_def["name"], "email": profile_def["email"]},
                timeout=15,
            )
            check(f"Student created", r.status_code in (200, 201),
                  f"Status {r.status_code} → id={r.json().get('id', '?')}")
            if r.ok:
                student_id = r.json()["id"]
                student_ids.append(student_id)
        except Exception as e:
            check("Student creation", False, str(e))
            continue

        # ── 1.2 Resume upload & parsing ──────────────────────────────────────
        print("\n  [2] Resume Upload & Parsing")
        t0 = time.time()
        try:
            r = upload_resume_for_student(student_id, resume_keys[prof_idx])
            elapsed = time.time() - t0
            check(f"Resume uploaded", r.status_code in (200, 201),
                  f"Status {r.status_code} in {elapsed:.1f}s")
            if r.ok:
                parse_status = r.json().get("parsing_status", "?")
                check("Parsing status = success", parse_status == "success",
                      f"Got: {parse_status}")
        except Exception as e:
            check("Resume upload", False, str(e))
            continue

        # ── 1.3 Profile has real extracted data ──────────────────────────────
        print("\n  [3] Profile Data Quality")
        try:
            r = requests.get(f"{BASE}/students/{student_id}/profile", timeout=15)
            check("Profile endpoint responds", r.ok, f"Status {r.status_code}")
            if r.ok:
                student_profile = r.json()
                profiles_data.append(student_profile)
                sk = len(student_profile.get("skills", []))
                ed = len(student_profile.get("education", []))
                ex = len(student_profile.get("experience", []))
                pr = len(student_profile.get("projects", []))
                real = profile_has_real_data(student_profile)
                check("Extracted non-trivial data (not fallback defaults)", real,
                      f"Skills={sk}, Education={ed}, Experience={ex}, Projects={pr}")
                check("At least 3 skills extracted", sk >= 3, f"{sk} skills")
                check("At least 1 education entry", ed >= 1, f"{ed} entries")
        except Exception as e:
            check("Profile data", False, str(e))
            continue

        # ── 1.4 Job matching ─────────────────────────────────────────────────
        print("\n  [4] Job Matching")
        t0 = time.time()
        try:
            r = requests.get(
                f"{BASE}/students/{student_id}/matches?top_k=10",
                timeout=90,
            )
            elapsed = time.time() - t0
            check("Matching endpoint responded", r.ok, f"Status {r.status_code} in {elapsed:.1f}s")
            if r.ok:
                matches = r.json().get("matches", [])
                check("Returned at least 3 matches", len(matches) >= 3, f"{len(matches)} matches")
                if matches:
                    first_job = matches[0]
                    match_jobs.append(first_job)
                    top_score = first_job.get("match_score", 0)
                    check("Top match score ≥ 50", top_score >= 50, f"Score={top_score}%")
                    top_reasoning = first_job.get("reasoning", "")
                    generic = is_generic_reasoning(top_reasoning)
                    check("Top match reasoning is job-specific (not fallback)", not generic,
                          top_reasoning[:120])
                    # Domain relevance: job title should vaguely relate to student's domain
                    domain_kw = profile_def["domain"].lower().split()
                    top_title = first_job.get("title", "").lower()
                    top_desc = first_job.get("description", "").lower()
                    domain_hit = any(kw in top_title or kw in top_desc for kw in domain_kw)
                    check("Top match is domain-relevant", domain_hit,
                          f"Domain='{profile_def['domain']}' | Title='{first_job.get('title', '?')}'",
                          warn=not domain_hit)
        except Exception as e:
            check("Job matching", False, str(e))
            continue

        if not first_job:
            print("  ⚠  No match returned — skipping agent tests for this profile")
            continue

        job_id = first_job["job_id"]

        # ── 1.5 Skill gap analysis ───────────────────────────────────────────
        print("\n  [5] Skill Gap Analysis")
        skill_gap_data = None
        t0 = time.time()
        try:
            r = requests.get(
                f"{BASE}/students/{student_id}/skill-gap/{job_id}",
                timeout=60,
            )
            elapsed = time.time() - t0
            check("Skill gap endpoint responded", r.ok, f"Status {r.status_code} in {elapsed:.1f}s")
            if r.ok:
                skill_gap_data = r.json()
                score = skill_gap_data.get("overall_readiness_score", -1)
                summary = skill_gap_data.get("readiness_summary", "")
                check("Readiness score in range 0-100", 0 <= score <= 100, f"Score={score}")
                check("Readiness summary non-empty", bool(summary), summary[:100])
                cats = ["critical_missing", "partially_demonstrated", "preferred_gaps",
                        "experience_gaps", "qualification_gaps"]
                cat_counts = {c: len(skill_gap_data.get(c, [])) for c in cats}
                has_any_gap = any(v > 0 for v in cat_counts.values())
                check("At least one gap category has entries", has_any_gap, str(cat_counts))
        except Exception as e:
            check("Skill gap analysis", False, str(e))

        # ── 1.6 Resume & cover letter customization ──────────────────────────
        print("\n  [6] Resume & Cover Letter Customization")
        custom_data = None
        t0 = time.time()
        try:
            r = requests.post(
                f"{BASE}/students/{student_id}/customize/{job_id}",
                timeout=90,
            )
            elapsed = time.time() - t0
            check("Customization endpoint responded", r.ok,
                  f"Status {r.status_code} in {elapsed:.1f}s")
            if r.ok:
                custom_data = r.json()
                rc = custom_data.get("resume_customization", {})
                cl = custom_data.get("cover_letter", {})
                check("Prioritized skills list non-empty",
                      len(rc.get("prioritized_skills", [])) > 0,
                      f"{len(rc.get('prioritized_skills', []))} skills")
                check("Cover letter body non-empty",
                      len(cl.get("body", "")) > 100,
                      f"{len(cl.get('body', ''))} chars")
                check("Cover letter subject line present",
                      bool(cl.get("subject_line")),
                      cl.get("subject_line", "")[:80])
                # Hallucination check
                if student_profile:
                    hall_ok, suspicious = check_hallucination(custom_data, student_profile)
                    check("No hallucinated skills/experience in cover letter", hall_ok,
                          f"Suspicious terms: {suspicious}" if not hall_ok else "Clean")
        except Exception as e:
            check("Customization", False, str(e))

        # ── 1.7 Interview prep ───────────────────────────────────────────────
        print("\n  [7] Interview Preparation")
        interview_data = None
        t0 = time.time()
        try:
            r = requests.get(
                f"{BASE}/students/{student_id}/interview-prep/{job_id}",
                timeout=90,
            )
            elapsed = time.time() - t0
            check("Interview prep endpoint responded", r.ok,
                  f"Status {r.status_code} in {elapsed:.1f}s")
            if r.ok:
                interview_data = r.json()
                tech_q = len(interview_data.get("technical_questions", []))
                res_q = len(interview_data.get("resume_questions", []))
                total_q = sum(
                    len(interview_data.get(k, []))
                    for k in ["technical_questions", "resume_questions",
                              "project_questions", "role_questions", "hr_questions"]
                )
                check("At least 5 questions generated total", total_q >= 5,
                      f"Total={total_q} (tech={tech_q}, resume={res_q})")
                check("Technical questions present", tech_q > 0, f"{tech_q} questions")
                # Job-relevance check
                job_rel_ok, job_rel_msg = interview_refs_job_specific_skills(
                    interview_data, first_job)
                check("Interview questions reference job-specific skills", job_rel_ok,
                      job_rel_msg, warn=not job_rel_ok)
        except Exception as e:
            check("Interview prep", False, str(e))

        # ── 1.8 Application tracking ─────────────────────────────────────────
        print("\n  [8] Application Tracking")
        try:
            app_payload = {
                "company_name": first_job.get("company", "Test Co"),
                "job_title": first_job.get("title", "Test Role"),
                "job_posting_id": job_id,
                "application_date": str(date.today()),
                "status": "Applied",
                "notes": f"Added via M4.2 E2E test — {profile_def['name']}",
            }
            r = requests.post(
                f"{BASE}/students/{student_id}/applications",
                json=app_payload,
                timeout=15,
            )
            check("Application created", r.status_code == 201,
                  f"Status {r.status_code}")
            if r.ok:
                app_id = r.json()["id"]

                # Update status
                r2 = requests.patch(
                    f"{BASE}/students/{student_id}/applications/{app_id}",
                    json={"status": "Under Review", "notes": "Updated by E2E test"},
                    timeout=15,
                )
                check("Application status updated", r2.ok, f"Status {r2.status_code}")

                # List applications
                r3 = requests.get(f"{BASE}/students/{student_id}/applications", timeout=15)
                check("Applications list returns entries", r3.ok and len(r3.json()) >= 1,
                      f"{len(r3.json()) if r3.ok else '?'} entries")

                # Dashboard
                r4 = requests.get(
                    f"{BASE}/students/{student_id}/applications/dashboard",
                    timeout=15,
                )
                check("Dashboard endpoint responds", r4.ok, f"Status {r4.status_code}")
                if r4.ok:
                    dash = r4.json()
                    check("Dashboard total ≥ 1",
                          dash.get("total_applications", 0) >= 1,
                          f"total={dash.get('total_applications')}")
        except Exception as e:
            check("Application tracking", False, str(e))

        # ── 1.9 Cross-agent consistency ──────────────────────────────────────
        print("\n  [9] Cross-Agent Consistency")
        if skill_gap_data and custom_data:
            ok, msg = gaps_consistent(skill_gap_data, custom_data)
            check("Skill Gap ↔ Customization: gaps not listed as strengths", ok, msg,
                  warn=not ok)

        if skill_gap_data and interview_data:
            ok2, msg2 = interview_refs_job_specific_skills(interview_data, first_job)
            check("Interview Prep references skills consistent with job", ok2, msg2,
                  warn=not ok2)

        # ── 1.10 Response time measurements ──────────────────────────────────
        print("\n  [10] Agent Response Time Summary (re-measured, cached)")
        try:
            t0 = time.time(); requests.get(f"{BASE}/students/{student_id}/profile", timeout=10); t1 = time.time()
            check("Profile fetch < 3s (SQLite)", (t1 - t0) < 3.0, f"{t1-t0:.2f}s")
        except Exception: pass

    # ── 2. Multi-turn assistant test (uses first student with data) ──────────
    print(f"\n{'─'*65}")
    print("[ Multi-Turn Conversational Assistant Test ]")
    print(f"{'─'*65}")
    if student_ids:
        ok, detail = test_assistant_multi_turn(student_ids[0])
        check("5-turn conversation completed with context retention", ok, detail)
    else:
        check("Multi-turn assistant test", False, "No valid student IDs available")

    # ── 3. Summary ───────────────────────────────────────────────────────────
    write_results(RESULTS)

    total = len(RESULTS)
    passed = sum(1 for r in RESULTS if r["status"] == "PASS")
    warned = sum(1 for r in RESULTS if r["status"] == "WARN")
    failed = sum(1 for r in RESULTS if r["status"] == "FAIL")

    print(f"\n{'═'*65}")
    print(f"  SUMMARY:  {passed}/{total} passed   {warned} warnings   {failed} failed")
    print(f"{'═'*65}\n")

    if failed == 0:
        print("  ✓ All checks passed (warnings are informational only)\n")
    else:
        print(f"  ✗ {failed} check(s) failed — see docs/milestone4_e2e_results.md\n")

    return failed == 0


def write_results(results: list):
    """Writes results to docs/milestone4_e2e_results.md"""
    out_path = Path(__file__).parent.parent / "docs" / "milestone4_e2e_results.md"
    out_path.parent.mkdir(exist_ok=True)

    total = len(results)
    passed = sum(1 for r in results if r["status"] == "PASS")
    warned = sum(1 for r in results if r["status"] == "WARN")
    failed = sum(1 for r in results if r["status"] == "FAIL")

    lines = [
        "# M4.2 — End-to-End Test Results",
        "",
        f"**Run date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  ",
        f"**Server:** {BASE}  ",
        f"**Total checks:** {total} | **Passed:** {passed} | **Warnings:** {warned} | **Failed:** {failed}",
        "",
        "---",
        "",
        "## Check Results",
        "",
        "| Status | Check |  Detail |",
        "|--------|-------|---------|",
    ]

    for r in results:
        icon = "✅" if r["status"] == "PASS" else ("⚠️" if r["status"] == "WARN" else "❌")
        detail = r["detail"].replace("|", "\\|").replace("\n", " ")[:120]
        lines.append(f"| {icon} {r['status']} | {r['label']} | {detail} |")

    lines += [
        "",
        "---",
        "",
        "## Cross-Agent Consistency Notes",
        "",
        "The test compares outputs across the three agents (Skill Gap, Customization, Interview Prep):",
        "",
        "- **Skill Gap ↔ Customization**: Checks that the Customization Agent does not list",
        "  critical gap skills as 'prioritized strengths'. Skills flagged as missing should not",
        "  appear as the top selling points in the tailored resume.",
        "",
        "- **Skill Gap ↔ Interview Prep**: Checks that interview questions reference skills",
        "  consistent with the job's required skill set, which the Skill Gap Agent also analyzed.",
        "",
        "- **Hallucination Guard**: The cover letter text is scanned for technical terms not",
        "  present in the student's verified profile (known skills, experience, projects).",
        "",
        "## Multi-Turn Assistant Context",
        "",
        "The assistant was tested over 5 turns:",
        "",
        "1. Ask about strongest skills",
        "2. Follow-up referencing 'what you just told me'",
        "3. Compare two role types",
        "4. Ask about skills needed for a pivot mentioned in the prior turn",
        "5. Summary of priorities",
        "",
        "Context retention is verified by checking that the final reply contains",
        "topic-relevant vocabulary from earlier in the conversation.",
        "",
    ]

    out_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"\n  Results saved → {out_path}\n")


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
