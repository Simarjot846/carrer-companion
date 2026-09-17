"""
Runtime smoke test for all four M3 agents.
Uses the existing dev.db data (students + job_postings).
"""
import sys, os
sys.path.insert(0, os.path.abspath('.'))
os.environ.setdefault('DATABASE_URL', 'sqlite:///./dev.db')

from dotenv import load_dotenv
load_dotenv()

import warnings; warnings.filterwarnings('ignore')

from app.database import SessionLocal
from app import models

db = SessionLocal()

# ── Find test data ──────────────────────────────────────────────────────────
student = db.query(models.Student).first()
job     = db.query(models.JobPosting).first()

if not student:
    print("SKIP: no students in DB — run the app, create a student first")
    db.close()
    sys.exit(0)

if not job:
    print("SKIP: no job postings in DB — run /jobs/seed first")
    db.close()
    sys.exit(0)

print(f"Using student: {student.name} (id={student.id})")
print(f"Using job:     {job.title} at {job.company} (id={job.id})\n")

ERRORS = []

# ── M3.1 Skill Gap ──────────────────────────────────────────────────────────
print("=" * 60)
print("M3.1 — Skill Gap Agent")
try:
    from app.services.skill_gap_agent import analyze_skill_gap
    result = analyze_skill_gap(student.id, job.id, db)

    assert 'critical_missing'        in result, "missing key: critical_missing"
    assert 'partially_demonstrated'  in result, "missing key: partially_demonstrated"
    assert 'preferred_gaps'          in result, "missing key: preferred_gaps"
    assert 'experience_gaps'         in result, "missing key: experience_gaps"
    assert 'qualification_gaps'      in result, "missing key: qualification_gaps"
    assert 'overall_readiness_score' in result, "missing key: overall_readiness_score"
    assert 'readiness_summary'       in result, "missing key: readiness_summary"
    assert isinstance(result['overall_readiness_score'], int), "score must be int"
    assert 0 <= result['overall_readiness_score'] <= 100, "score out of range"

    print(f"  readiness_score : {result['overall_readiness_score']}")
    print(f"  summary         : {result['readiness_summary'][:80]}")
    print(f"  critical_missing: {len(result['critical_missing'])} gaps")
    print("  PASS ✓")
except Exception as e:
    print(f"  FAIL ✗ — {e}")
    ERRORS.append(f"M3.1: {e}")

# ── M3.2 Customization ──────────────────────────────────────────────────────
print()
print("=" * 60)
print("M3.2 — Customization Agent")
try:
    from app.services.customization_agent import generate_customization
    result = generate_customization(student.id, job.id, db)

    assert 'resume_customization' in result, "missing key: resume_customization"
    assert 'cover_letter'         in result, "missing key: cover_letter"

    rc = result['resume_customization']
    cl = result['cover_letter']

    assert 'prioritized_skills'           in rc, "missing rc key: prioritized_skills"
    assert 'rewritten_bullets'            in rc, "missing rc key: rewritten_bullets"
    assert 'section_order_recommendation' in rc, "missing rc key: section_order_recommendation"

    assert 'body'          in cl, "missing cl key: body"
    assert 'subject_line'  in cl, "missing cl key: subject_line"
    assert 'hallucination_check' in cl, "missing cl key: hallucination_check"
    assert len(cl['body']) > 50, f"cover letter body too short: {len(cl['body'])} chars"

    print(f"  prioritized_skills      : {rc['prioritized_skills'][:3]}")
    print(f"  rewritten_bullets       : {len(rc['rewritten_bullets'])}")
    print(f"  section_order           : {rc['section_order_recommendation']}")
    print(f"  cover_letter chars      : {len(cl['body'])}")
    print(f"  hallucination_check     : {cl['hallucination_check']}")
    print("  PASS ✓")
except Exception as e:
    print(f"  FAIL ✗ — {e}")
    ERRORS.append(f"M3.2: {e}")

# ── M3.3 Interview Prep ─────────────────────────────────────────────────────
print()
print("=" * 60)
print("M3.3 — Interview Prep Agent")
try:
    from app.services.interview_prep_agent import generate_interview_prep
    result = generate_interview_prep(student.id, job.id, db, skill_gaps=None)

    for key in ('technical_questions','resume_questions','project_questions',
                'role_questions','hr_questions','topics_to_revise'):
        assert key in result, f"missing key: {key}"

    all_q = (result['technical_questions'] + result['resume_questions'] +
             result['project_questions'] + result['role_questions'] + result['hr_questions'])
    assert len(all_q) > 0, "no questions generated"

    for q in all_q:
        assert 'question'     in q, f"question item missing 'question' key: {q}"
        assert 'prep_guidance' in q, f"question item missing 'prep_guidance' key: {q}"

    print(f"  technical_questions : {len(result['technical_questions'])}")
    print(f"  resume_questions    : {len(result['resume_questions'])}")
    print(f"  project_questions   : {len(result['project_questions'])}")
    print(f"  hr_questions        : {len(result['hr_questions'])}")
    print(f"  topics_to_revise    : {result['topics_to_revise'][:4]}")
    print("  PASS ✓")
except Exception as e:
    print(f"  FAIL ✗ — {e}")
    ERRORS.append(f"M3.3: {e}")

# ── M3.4 Career Assistant ───────────────────────────────────────────────────
print()
print("=" * 60)
print("M3.4 — Career Assistant")
try:
    from app.services.career_assistant import chat
    result = chat(
        student_id=student.id,
        message="What are my strongest skills?",
        history=[],
        db=db,
    )

    assert 'reply'           in result, "missing key: reply"
    assert 'updated_history' in result, "missing key: updated_history"
    assert len(result['reply']) > 10,   f"reply too short: {result['reply']!r}"
    assert len(result['updated_history']) >= 2, "history should have at least 2 turns"

    for turn in result['updated_history']:
        assert 'role'    in turn, f"turn missing 'role': {turn}"
        assert 'content' in turn, f"turn missing 'content': {turn}"
        assert turn['role'] in ('user', 'assistant'), f"unknown role: {turn['role']}"

    print(f"  reply preview    : {result['reply'][:100]}...")
    print(f"  history turns    : {len(result['updated_history'])}")
    print("  PASS ✓")
except Exception as e:
    print(f"  FAIL ✗ — {e}")
    ERRORS.append(f"M3.4: {e}")

# ── Summary ──────────────────────────────────────────────────────────────────
print()
print("=" * 60)
db.close()

if ERRORS:
    print(f"FAILED — {len(ERRORS)} error(s):")
    for err in ERRORS:
        print(f"  • {err}")
    sys.exit(1)
else:
    print("ALL M3 AGENTS PASSED ✓")
    sys.exit(0)
