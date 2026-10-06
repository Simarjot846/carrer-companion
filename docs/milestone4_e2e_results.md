# M4.2 — End-to-End Test Results

**Run date:** 2026-10-06 09:12:20  
**Server:** http://localhost:8000  
**Total checks:** 103 | **Passed:** 102 | **Warnings:** 0 | **Failed:** 1

---

## Check Results

| Status | Check |  Detail |
|--------|-------|---------|
| ✅ PASS | Server is reachable | Status 200 |
| ✅ PASS | Job seed endpoint responded | Status 200 — {"message":"Successfully seeded 160 job postings."} |
| ✅ PASS | Job postings exist in DB | 100 postings found |
| ✅ PASS | Student created | Status 200 → id=23 |
| ✅ PASS | Resume uploaded | Status 200 in 19.1s |
| ✅ PASS | Parsing status = success | Got: success |
| ✅ PASS | Profile endpoint responds | Status 200 |
| ✅ PASS | Extracted non-trivial data (not fallback defaults) | Skills=16, Education=1, Experience=2, Projects=2 |
| ✅ PASS | At least 3 skills extracted | 16 skills |
| ✅ PASS | At least 1 education entry | 1 entries |
| ✅ PASS | Matching endpoint responded | Status 200 in 5.0s |
| ✅ PASS | Returned at least 3 matches | 10 matches |
| ✅ PASS | Top match score ≥ 50 | Score=98% |
| ✅ PASS | Top match reasoning is job-specific (not fallback) | The candidate's backend engineering background at TechCorp Inc. and StartupXYZ involves Python, FastAPI, PostgreSQL, Doc |
| ✅ PASS | Top match is domain-relevant | Domain='software engineering' \| Title='Software Engineering Intern - Backend' |
| ✅ PASS | Skill gap endpoint responded | Status 200 in 22.0s |
| ✅ PASS | Readiness score in range 0-100 | Score=85 |
| ✅ PASS | Readiness summary non-empty | Test Student Alpha is a strong candidate who meets all core required technical skills, needing only  |
| ✅ PASS | At least one gap category has entries | {'critical_missing': 1, 'partially_demonstrated': 1, 'preferred_gaps': 1, 'experience_gaps': 1, 'qualification_gaps': 0} |
| ✅ PASS | Customization endpoint responded | Status 200 in 35.1s |
| ✅ PASS | Prioritized skills list non-empty | 8 skills |
| ✅ PASS | Cover letter body non-empty | 1558 chars |
| ✅ PASS | Cover letter subject line present | Application for Software Engineering Intern - Backend at CloudScale Systems — Te |
| ✅ PASS | No hallucinated skills/experience in cover letter | Clean |
| ✅ PASS | Interview prep endpoint responded | Status 200 in 30.6s |
| ✅ PASS | At least 5 questions generated total | Total=13 (tech=4, resume=3) |
| ✅ PASS | Technical questions present | 4 questions |
| ✅ PASS | Interview questions reference job-specific skills | 4/6 required skills referenced (67%) |
| ✅ PASS | Application created | Status 201 |
| ✅ PASS | Application status updated | Status 200 |
| ✅ PASS | Applications list returns entries | 1 entries |
| ✅ PASS | Dashboard endpoint responds | Status 200 |
| ✅ PASS | Dashboard total ≥ 1 | total=1 |
| ✅ PASS | Skill Gap ↔ Customization: gaps not listed as strengths | Appropriate separation: 0 overlapping skills out of 8 |
| ✅ PASS | Interview Prep references skills consistent with job | 4/6 required skills referenced (67%) |
| ✅ PASS | Profile fetch < 3s (SQLite) | 2.04s |
| ✅ PASS | Student created | Status 200 → id=24 |
| ✅ PASS | Resume uploaded | Status 200 in 23.7s |
| ✅ PASS | Parsing status = success | Got: success |
| ✅ PASS | Profile endpoint responds | Status 200 |
| ✅ PASS | Extracted non-trivial data (not fallback defaults) | Skills=20, Education=2, Experience=2, Projects=2 |
| ✅ PASS | At least 3 skills extracted | 20 skills |
| ✅ PASS | At least 1 education entry | 2 entries |
| ✅ PASS | Matching endpoint responded | Status 200 in 5.0s |
| ✅ PASS | Returned at least 3 matches | 10 matches |
| ✅ PASS | Top match score ≥ 50 | Score=95% |
| ✅ PASS | Top match reasoning is job-specific (not fallback) | The candidate has an M.S. in Data Science from MIT and extensive experience with Python, SQL, Pandas, NumPy, and Scikit- |
| ✅ PASS | Top match is domain-relevant | Domain='data science' \| Title='Data Science Intern - Analytics & Insights' |
| ✅ PASS | Skill gap endpoint responded | Status 200 in 19.6s |
| ✅ PASS | Readiness score in range 0-100 | Score=88 |
| ✅ PASS | Readiness summary non-empty | Test Student Beta exceeds all core technical and educational requirements, needing only to better sh |
| ✅ PASS | At least one gap category has entries | {'critical_missing': 0, 'partially_demonstrated': 2, 'preferred_gaps': 1, 'experience_gaps': 1, 'qualification_gaps': 1} |
| ✅ PASS | Customization endpoint responded | Status 200 in 28.2s |
| ✅ PASS | Prioritized skills list non-empty | 10 skills |
| ✅ PASS | Cover letter body non-empty | 1861 chars |
| ✅ PASS | Cover letter subject line present | Application for Data Science Intern - Analytics & Insights at DataFlow Analytics |
| ❌ FAIL | No hallucinated skills/experience in cover letter | Suspicious terms: ['spark'] |
| ✅ PASS | Interview prep endpoint responded | Status 200 in 63.4s |
| ✅ PASS | At least 5 questions generated total | Total=12 (tech=3, resume=2) |
| ✅ PASS | Technical questions present | 3 questions |
| ✅ PASS | Interview questions reference job-specific skills | 3/7 required skills referenced (43%) |
| ✅ PASS | Application created | Status 201 |
| ✅ PASS | Application status updated | Status 200 |
| ✅ PASS | Applications list returns entries | 1 entries |
| ✅ PASS | Dashboard endpoint responds | Status 200 |
| ✅ PASS | Dashboard total ≥ 1 | total=1 |
| ✅ PASS | Skill Gap ↔ Customization: gaps not listed as strengths | Appropriate separation: 0 overlapping skills out of 10 |
| ✅ PASS | Interview Prep references skills consistent with job | 3/7 required skills referenced (43%) |
| ✅ PASS | Profile fetch < 3s (SQLite) | 2.06s |
| ✅ PASS | Student created | Status 200 → id=25 |
| ✅ PASS | Resume uploaded | Status 200 in 13.3s |
| ✅ PASS | Parsing status = success | Got: success |
| ✅ PASS | Profile endpoint responds | Status 200 |
| ✅ PASS | Extracted non-trivial data (not fallback defaults) | Skills=17, Education=1, Experience=2, Projects=2 |
| ✅ PASS | At least 3 skills extracted | 17 skills |
| ✅ PASS | At least 1 education entry | 1 entries |
| ✅ PASS | Matching endpoint responded | Status 200 in 5.3s |
| ✅ PASS | Returned at least 3 matches | 10 matches |
| ✅ PASS | Top match score ≥ 50 | Score=95% |
| ✅ PASS | Top match reasoning is job-specific (not fallback) | The candidate has a strong background in deep learning, Python, and PyTorch, perfectly aligning with the core requiremen |
| ✅ PASS | Top match is domain-relevant | Domain='machine learning' \| Title='Deep Learning Research Intern' |
| ✅ PASS | Skill gap endpoint responded | Status 200 in 17.5s |
| ✅ PASS | Readiness score in range 0-100 | Score=70 |
| ✅ PASS | Readiness summary non-empty | Candidate meets 5/6 required skills. Focus on closing critical gaps before applying. |
| ✅ PASS | At least one gap category has entries | {'critical_missing': 1, 'partially_demonstrated': 0, 'preferred_gaps': 2, 'experience_gaps': 0, 'qualification_gaps': 0} |
| ✅ PASS | Customization endpoint responded | Status 200 in 3.2s |
| ✅ PASS | Prioritized skills list non-empty | 5 skills |
| ✅ PASS | Cover letter body non-empty | 856 chars |
| ✅ PASS | Cover letter subject line present | Application for Deep Learning Research Intern at DeepCore Labs — Test Student Ga |
| ✅ PASS | No hallucinated skills/experience in cover letter | Clean |
| ✅ PASS | Interview prep endpoint responded | Status 200 in 3.0s |
| ✅ PASS | At least 5 questions generated total | Total=12 (tech=3, resume=2) |
| ✅ PASS | Technical questions present | 3 questions |
| ✅ PASS | Interview questions reference job-specific skills | 3/6 required skills referenced (50%) |
| ✅ PASS | Application created | Status 201 |
| ✅ PASS | Application status updated | Status 200 |
| ✅ PASS | Applications list returns entries | 1 entries |
| ✅ PASS | Dashboard endpoint responds | Status 200 |
| ✅ PASS | Dashboard total ≥ 1 | total=1 |
| ✅ PASS | Skill Gap ↔ Customization: gaps not listed as strengths | Appropriate separation: 0 overlapping skills out of 5 |
| ✅ PASS | Interview Prep references skills consistent with job | 3/6 required skills referenced (50%) |
| ✅ PASS | Profile fetch < 3s (SQLite) | 2.05s |
| ✅ PASS | 5-turn conversation completed with context retention | 5-turn conversation completed; context words found: ['skill', 'profile'] |

---

## Cross-Agent Consistency Notes

The test compares outputs across the three agents (Skill Gap, Customization, Interview Prep):

- **Skill Gap ↔ Customization**: Checks that the Customization Agent does not list
  critical gap skills as 'prioritized strengths'. Skills flagged as missing should not
  appear as the top selling points in the tailored resume.

- **Skill Gap ↔ Interview Prep**: Checks that interview questions reference skills
  consistent with the job's required skill set, which the Skill Gap Agent also analyzed.

- **Hallucination Guard**: The cover letter text is scanned for technical terms not
  present in the student's verified profile (known skills, experience, projects).

## Multi-Turn Assistant Context

The assistant was tested over 5 turns:

1. Ask about strongest skills
2. Follow-up referencing 'what you just told me'
3. Compare two role types
4. Ask about skills needed for a pivot mentioned in the prior turn
5. Summary of priorities

Context retention is verified by checking that the final reply contains
topic-relevant vocabulary from earlier in the conversation.
