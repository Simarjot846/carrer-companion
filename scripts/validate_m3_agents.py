"""
Validation script for Milestone 3 Agents:
1. M3.1 — Skill Gap Analysis Agent
2. M3.2 — Resume & Cover Letter Customization Agent
3. M3.3 — Interview Preparation Agent
4. M3.4 — Conversational Career Assistant
"""
import sys
from app.database import SessionLocal
from app import models
from app.services.skill_gap_agent import analyze_skill_gap
from app.services.customization_agent import generate_customization
from app.services.interview_prep_agent import generate_interview_prep
from app.services.career_assistant import chat

def run_validation():
    db = SessionLocal()
    try:
        # Find first student and first job in database
        student = db.query(models.Student).first()
        job = db.query(models.JobPosting).first()

        if not student:
            print("ERROR: No student found in database.")
            sys.exit(1)
        if not job:
            print("ERROR: No job posting found in database.")
            sys.exit(1)

        print(f"=== Validating M3 Agents with Student #{student.id} ({student.name}) and Job #{job.id} ({job.title} at {job.company}) ===\n")

        # 1. Test Skill Gap Analysis (M3.1)
        print("1. Testing M3.1 — Skill Gap Analysis Agent...")
        gap_res = analyze_skill_gap(student.id, job.id, db)
        assert "overall_readiness_score" in gap_res, "Missing readiness score"
        assert "critical_missing" in gap_res, "Missing critical_missing key"
        print(f"   [SUCCESS] Readiness score: {gap_res['overall_readiness_score']}%, Critical gaps count: {len(gap_res['critical_missing'])}\n")

        # 2. Test Resume Customization (M3.2)
        print("2. Testing M3.2 — Resume & Cover Letter Customization Agent...")
        cust_res = generate_customization(student.id, job.id, db)
        assert "resume_customization" in cust_res, "Missing resume_customization key"
        assert "cover_letter" in cust_res, "Missing cover_letter key"
        assert cust_res["cover_letter"]["hallucination_check"] is True, "Hallucination check failed"
        print(f"   [SUCCESS] Cover letter generated, Subject: '{cust_res['cover_letter']['subject_line']}', Hallucination check passed.\n")

        # 3. Test Interview Preparation (M3.3)
        print("3. Testing M3.3 — Interview Preparation Agent...")
        prep_res = generate_interview_prep(student.id, job.id, db, skill_gaps=gap_res)
        assert "technical_questions" in prep_res, "Missing technical_questions key"
        assert "resume_questions" in prep_res, "Missing resume_questions key"
        assert "project_questions" in prep_res, "Missing project_questions key"
        assert "role_questions" in prep_res, "Missing role_questions key"
        assert "hr_questions" in prep_res, "Missing hr_questions key"
        assert "topics_to_revise" in prep_res, "Missing topics_to_revise key"
        print(f"   [SUCCESS] Tech Qs: {len(prep_res['technical_questions'])}, Resume Qs: {len(prep_res['resume_questions'])}, Topics to revise: {len(prep_res['topics_to_revise'])}\n")

        # 4. Test Conversational Career Assistant (M3.4)
        print("4. Testing M3.4 — Conversational Career Assistant...")
        chat_res = chat(student.id, "How can I prepare for an interview for this role?", [], db)
        assert "reply" in chat_res, "Missing reply key"
        assert "updated_history" in chat_res, "Missing updated_history key"
        assert len(chat_res["updated_history"]) == 2, "History should have 2 turns after 1 message"
        print(f"   [SUCCESS] Assistant reply: '{chat_res['reply'][:100]}...'\n")

        print("=== ALL MILESTONE 3 AGENT TESTS PASSED SUCCESSFULLY ===")

    finally:
        db.close()

if __name__ == "__main__":
    run_validation()
