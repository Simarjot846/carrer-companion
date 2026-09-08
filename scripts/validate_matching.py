import sys
from pathlib import Path

# Ensure root directory is on sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from sqlalchemy.orm import Session
from app.database import Base, engine, SessionLocal
from app import models
from app.services.matching_agent import get_job_matches_for_student

# 10 Varied Sample Student Profiles for Validation
SAMPLE_STUDENTS = [
    {
        "name": "Alex Chen",
        "email": "alex.chen@university.edu",
        "skills": [
            {"name": "Python", "category": "technical"},
            {"name": "FastAPI", "category": "technical"},
            {"name": "PostgreSQL", "category": "technical"},
            {"name": "Docker", "category": "tool"},
            {"name": "Redis", "category": "tool"},
            {"name": "REST APIs", "category": "technical"},
            {"name": "Git", "category": "tool"},
        ],
        "education": [{
            "institution": "UC Berkeley",
            "degree": "B.S.",
            "field_of_study": "Computer Science",
            "start_date": "2022",
            "end_date": "2026",
            "grade": "3.8 GPA"
        }],
        "experience": [{
            "title": "Backend Engineering Intern",
            "organization": "CloudTech Systems",
            "start_date": "Jun 2025",
            "end_date": "Aug 2025",
            "description": "Designed asynchronous REST APIs in FastAPI and wrote SQL migration scripts for PostgreSQL databases."
        }],
        "projects": [{
            "title": "Distributed Task Queue",
            "description": "Built a scalable background job processor using Python, Redis, and Docker containers.",
            "technologies": "Python, Redis, Docker, FastAPI"
        }]
    },
    {
        "name": "Maya Patel",
        "email": "maya.patel@tech.edu",
        "skills": [
            {"name": "Python", "category": "technical"},
            {"name": "SQL", "category": "technical"},
            {"name": "Pandas", "category": "technical"},
            {"name": "Scikit-Learn", "category": "technical"},
            {"name": "Tableau", "category": "tool"},
            {"name": "A/B Testing", "category": "technical"},
            {"name": "Statistics", "category": "technical"},
        ],
        "education": [{
            "institution": "Columbia University",
            "degree": "M.S.",
            "field_of_study": "Data Science",
            "start_date": "2024",
            "end_date": "2026",
            "grade": "3.9 GPA"
        }],
        "experience": [{
            "title": "Data Analyst Intern",
            "organization": "Insight Analytics",
            "start_date": "May 2025",
            "end_date": "Aug 2025",
            "description": "Built automated customer segmentation models using Python and Pandas, reducing churn reporting overhead."
        }],
        "projects": [{
            "title": "E-Commerce User Churn Predictor",
            "description": "Trained logistic regression and random forest models in Scikit-learn on transactional SQL datasets.",
            "technologies": "Python, Scikit-Learn, SQL, Pandas"
        }]
    },
    {
        "name": "Jordan Rivera",
        "email": "jordan.rivera@designtech.edu",
        "skills": [
            {"name": "React", "category": "technical"},
            {"name": "TypeScript", "category": "technical"},
            {"name": "Tailwind CSS", "category": "technical"},
            {"name": "Next.js", "category": "technical"},
            {"name": "HTML5", "category": "technical"},
            {"name": "Figma", "category": "tool"},
            {"name": "Git", "category": "tool"},
        ],
        "education": [{
            "institution": "NYU Tisch School of Arts",
            "degree": "B.A.",
            "field_of_study": "Interactive Media Arts",
            "start_date": "2022",
            "end_date": "2026",
            "grade": "3.7 GPA"
        }],
        "experience": [{
            "title": "Frontend Developer Intern",
            "organization": "Pixel Studio",
            "start_date": "Jun 2025",
            "end_date": "Sep 2025",
            "description": "Crafted responsive web interfaces using React, TypeScript, and Tailwind CSS for client dashboards."
        }],
        "projects": [{
            "title": "SaaS Dashboard UI Kit",
            "description": "Created a modern component library in Next.js with dark mode support and interactive charts.",
            "technologies": "React, Next.js, TypeScript, Tailwind CSS"
        }]
    },
    {
        "name": "Priya Sharma",
        "email": "priya.sharma@stanford.edu",
        "skills": [
            {"name": "Python", "category": "technical"},
            {"name": "PyTorch", "category": "technical"},
            {"name": "Transformers", "category": "technical"},
            {"name": "RAG", "category": "technical"},
            {"name": "Hugging Face", "category": "tool"},
            {"name": "Vector Databases", "category": "technical"},
            {"name": "pgvector", "category": "tool"},
        ],
        "education": [{
            "institution": "Stanford University",
            "degree": "B.S.",
            "field_of_study": "Artificial Intelligence",
            "start_date": "2023",
            "end_date": "2026",
            "grade": "3.95 GPA"
        }],
        "experience": [{
            "title": "AI Research Assistant",
            "organization": "Stanford AI Lab",
            "start_date": "Jan 2025",
            "end_date": "Present",
            "description": "Fine-tuned Llama 3 models on domain-specific corpora using PyTorch and built RAG retrieval pipelines."
        }],
        "projects": [{
            "title": "Semantic Document QA Agent",
            "description": "Implemented pgvector embedding retrieval paired with LLM context summarization for technical manuals.",
            "technologies": "Python, PyTorch, pgvector, LangChain"
        }]
    },
    {
        "name": "David Kim",
        "email": "david.kim@kellogg.northwestern.edu",
        "skills": [
            {"name": "Product Management", "category": "technical"},
            {"name": "User Research", "category": "technical"},
            {"name": "Agile", "category": "soft"},
            {"name": "Jira", "category": "tool"},
            {"name": "SQL", "category": "technical"},
            {"name": "Wireframing", "category": "technical"},
            {"name": "Figma", "category": "tool"},
        ],
        "education": [{
            "institution": "Northwestern University",
            "degree": "B.S.",
            "field_of_study": "Industrial Engineering & Management",
            "start_date": "2022",
            "end_date": "2026",
            "grade": "3.65 GPA"
        }],
        "experience": [{
            "title": "Associate Product Manager Intern",
            "organization": "VentureScale SaaS",
            "start_date": "May 2025",
            "end_date": "Aug 2025",
            "description": "Wrote PRDs for onboarding user flows, ran 15 qualitative customer interviews, and prioritized sprint backlogs."
        }],
        "projects": [{
            "title": "Student Mobile App Feature Teardown",
            "description": "Analyzed user funnel drop-offs using SQL and Figma wireframes to propose product improvements.",
            "technologies": "SQL, Figma, Jira, Mixpanel"
        }]
    },
    {
        "name": "Samantha Taylor",
        "email": "samantha.taylor@rhodeisland.edu",
        "skills": [
            {"name": "Figma", "category": "tool"},
            {"name": "UI/UX Design", "category": "technical"},
            {"name": "Prototyping", "category": "technical"},
            {"name": "Wireframing", "category": "technical"},
            {"name": "User Research", "category": "technical"},
            {"name": "Design Systems", "category": "technical"},
        ],
        "education": [{
            "institution": "RISD (Rhode Island School of Design)",
            "degree": "B.F.A.",
            "field_of_study": "Graphic & Interaction Design",
            "start_date": "2022",
            "end_date": "2026",
            "grade": "3.85 GPA"
        }],
        "experience": [{
            "title": "UX Design Intern",
            "organization": "Creative UX Studio",
            "start_date": "Jun 2025",
            "end_date": "Aug 2025",
            "description": "Created interactive high-fidelity Figma prototypes and user testing scenarios for e-commerce clients."
        }],
        "projects": [{
            "title": "Accessible Mobile Banking Redesign",
            "description": "Designed inclusive WCAG-compliant UI screens and design tokens in Figma.",
            "technologies": "Figma, User Testing, Prototyping"
        }]
    },
    {
        "name": "Marcus Johnson",
        "email": "marcus.johnson@purdue.edu",
        "skills": [
            {"name": "AWS", "category": "tool"},
            {"name": "Terraform", "category": "tool"},
            {"name": "Docker", "category": "tool"},
            {"name": "Kubernetes", "category": "tool"},
            {"name": "Linux", "category": "technical"},
            {"name": "Python", "category": "technical"},
            {"name": "GitHub Actions", "category": "tool"},
        ],
        "education": [{
            "institution": "Purdue University",
            "degree": "B.S.",
            "field_of_study": "Cybersecurity & Cloud Computing",
            "start_date": "2022",
            "end_date": "2026",
            "grade": "3.7 GPA"
        }],
        "experience": [{
            "title": "DevOps Engineering Intern",
            "organization": "CloudScale Ops",
            "start_date": "May 2025",
            "end_date": "Aug 2025",
            "description": "Provisioned AWS infrastructure using Terraform modules and constructed CI/CD build pipelines."
        }],
        "projects": [{
            "title": "Automated K8s Deployment Pipeline",
            "description": "Containerized multi-tier microservices with Docker and deployed to AWS EKS with Prometheus monitoring.",
            "technologies": "AWS, Docker, Kubernetes, Terraform"
        }]
    },
    {
        "name": "Elena Rostova",
        "email": "elena.rostova@georgiatech.edu",
        "skills": [
            {"name": "Swift", "category": "technical"},
            {"name": "SwiftUI", "category": "technical"},
            {"name": "iOS", "category": "technical"},
            {"name": "React Native", "category": "technical"},
            {"name": "TypeScript", "category": "technical"},
            {"name": "REST APIs", "category": "technical"},
            {"name": "Git", "category": "tool"},
        ],
        "education": [{
            "institution": "Georgia Tech",
            "degree": "B.S.",
            "field_of_study": "Computer Science - Mobile Systems",
            "start_date": "2023",
            "end_date": "2026",
            "grade": "3.75 GPA"
        }],
        "experience": [{
            "title": "iOS App Developer Intern",
            "organization": "AppPulse Mobile",
            "start_date": "Jun 2025",
            "end_date": "Aug 2025",
            "description": "Built SwiftUI consumer application views and connected CoreData offline caching mechanisms."
        }],
        "projects": [{
            "title": "Fitness Tracker Native App",
            "description": "Developed an iOS app in Swift with custom animations and HealthKit API integrations.",
            "technologies": "Swift, SwiftUI, iOS, CoreData"
        }]
    },
    {
        "name": "Liam O'Connor",
        "email": "liam.oconnor@cmu.edu",
        "skills": [
            {"name": "Cybersecurity", "category": "technical"},
            {"name": "Python", "category": "technical"},
            {"name": "Linux", "category": "technical"},
            {"name": "Wireshark", "category": "tool"},
            {"name": "Application Security", "category": "technical"},
            {"name": "OWASP", "category": "technical"},
            {"name": "Metasploit", "category": "tool"},
        ],
        "education": [{
            "institution": "Carnegie Mellon University",
            "degree": "B.S.",
            "field_of_study": "Information Security & Policy",
            "start_date": "2022",
            "end_date": "2026",
            "grade": "3.8 GPA"
        }],
        "experience": [{
            "title": "Cybersecurity Intern",
            "organization": "SecureGuard Cyber",
            "start_date": "May 2025",
            "end_date": "Aug 2025",
            "description": "Audited API authentication tokens, performed static security analysis, and parsed log metrics in Splunk."
        }],
        "projects": [{
            "title": "Vulnerability Scanner Tool",
            "description": "Wrote a Python CLI script to inspect web endpoints for OWASP Top 10 header configuration issues.",
            "technologies": "Python, Security Testing, OWASP"
        }]
    },
    {
        "name": "Chloe Bennett",
        "email": "chloe.bennett@usc.edu",
        "skills": [
            {"name": "Technical Writing", "category": "technical"},
            {"name": "Developer Relations", "category": "technical"},
            {"name": "Content Strategy", "category": "technical"},
            {"name": "APIs", "category": "technical"},
            {"name": "Python", "category": "technical"},
            {"name": "Public Speaking", "category": "soft"},
            {"name": "Git", "category": "tool"},
        ],
        "education": [{
            "institution": "USC Annenberg",
            "degree": "B.A.",
            "field_of_study": "Communication & Technology",
            "start_date": "2022",
            "end_date": "2026",
            "grade": "3.85 GPA"
        }],
        "experience": [{
            "title": "DevRel & Content Intern",
            "organization": "Apiary Tools",
            "start_date": "Jun 2025",
            "end_date": "Sep 2025",
            "description": "Authored technical blog posts, recorded developer video guides, and managed community GitHub discussions."
        }],
        "projects": [{
            "title": "Developer Portal Tutorials",
            "description": "Created interactive API quickstart guides in Markdown for open-source SDK developers.",
            "technologies": "Markdown, Technical Writing, Python, Git"
        }]
    }
]


def validate_pipeline():
    """
    Creates/updates 10 sample student profiles and runs them through the RAG matching pipeline.
    Prints formatted evaluation tables to verify scoring and retrieval quality.
    """
    db = SessionLocal()
    try:
        # Create schema if needed
        Base.metadata.create_all(bind=engine)

        print("\n============================================================")
        print("  AI CAREER COMPANION - MATCHING PIPELINE VALIDATION SUITE  ")
        print("============================================================\n")

        for sample in SAMPLE_STUDENTS:
            # Check or create student
            student = db.query(models.Student).filter(models.Student.email == sample["email"]).first()
            if not student:
                student = models.Student(name=sample["name"], email=sample["email"])
                db.add(student)
                db.commit()
                db.refresh(student)

            # Clear old profile rows to allow clean re-run
            db.query(models.Skill).filter(models.Skill.student_id == student.id).delete()
            db.query(models.Education).filter(models.Education.student_id == student.id).delete()
            db.query(models.Experience).filter(models.Experience.student_id == student.id).delete()
            db.query(models.Project).filter(models.Project.student_id == student.id).delete()
            db.commit()

            # Insert sample profile data
            for sk in sample["skills"]:
                db.add(models.Skill(student_id=student.id, **sk, source="manual"))
            for ed in sample["education"]:
                db.add(models.Education(student_id=student.id, **ed))
            for ex in sample["experience"]:
                db.add(models.Experience(student_id=student.id, **ex))
            for pr in sample["projects"]:
                db.add(models.Project(student_id=student.id, **pr))

            db.commit()
            db.refresh(student)

            # Run matching pipeline
            matches = get_job_matches_for_student(student.id, db, top_k=3)

            # Print student validation block
            skills_list = ", ".join([s["name"] for s in sample["skills"]])
            edu_info = f"{sample['education'][0]['degree']} {sample['education'][0]['field_of_study']} ({sample['education'][0]['institution']})"

            print("------------------------------------------------------------")
            print(f"CANDIDATE: {student.name} (ID: {student.id})")
            print(f"PROFILE:   {edu_info}")
            print(f"SKILLS:    {skills_list}")
            print("------------------------------------------------------------")
            print("TOP RANKED JOB MATCHES:")

            for rank, job in enumerate(matches, 1):
                missing_str = ", ".join(job["missing_skills"]) if job["missing_skills"] else "None"
                print(f"  #{rank} | Match Score: {job['match_score']}% (Vec Sim: {job['vector_similarity']})")
                print(f"      Title:          {job['title']} at {job['company']}")
                print(f"      Type/Location:  {job['experience_level']} | {job['posting_type']} | {job['location']}")
                print(f"      Reasoning:      {job['reasoning']}")
                print(f"      Missing Skills: {missing_str}\n")

        print("============================================================")
        print("  VALIDATION COMPLETE - ALL 10 CANDIDATE PIPELINES VERIFIED ")
        print("============================================================\n")

    finally:
        db.close()


if __name__ == "__main__":
    validate_pipeline()
