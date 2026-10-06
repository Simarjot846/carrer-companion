# M4.2 — End-to-End Test Results

**Run date:** 2026-10-03 23:50:07  
**Server:** http://localhost:8000  
**Total checks:** 103 | **Passed:** 101 | **Warnings:** 2 | **Failed:** 0

---

## Check Results

| Status | Check |  Detail |
|--------|-------|---------|
| ✅ PASS | Server is reachable | Status 200 |
| ✅ PASS | Job seed endpoint responded | Status 200 — {"message":"Successfully seeded 160 job postings."} |
| ✅ PASS | Job postings exist in DB | 100 postings found |
| ✅ PASS | Student created | Status 200 → id=20 |
| ✅ PASS | Resume uploaded | Status 200 in 16.7s |
| ✅ PASS | Parsing status = success | Got: success |
| ✅ PASS | Profile endpoint responds | Status 200 |
| ✅ PASS | Extracted non-trivial data (not fallback defaults) | Skills=16, Education=1, Experience=2, Projects=2 |
| ✅ PASS | At least 3 skills extracted | 16 skills |
| ✅ PASS | At least 1 education entry | 1 entries |
| ✅ PASS | Matching endpoint responded | Status 200 in 4.5s |
| ✅ PASS | Returned at least 3 matches | 10 matches |
| ✅ PASS | Top match score ≥ 50 | Score=98% |
| ✅ PASS | Top match reasoning is job-specific (not fallback) | The candidate matches all required skills including Python, FastAPI, PostgreSQL, Docker, REST APIs, and Git, alongside d |
| ✅ PASS | Top match is domain-relevant | Domain='software engineering' \| Title='Software Engineering Intern - Backend' |
| ✅ PASS | Skill gap endpoint responded | Status 200 in 4.0s |
| ✅ PASS | Readiness score in range 0-100 | Score=85 |
| ✅ PASS | Readiness summary non-empty | Candidate meets 6/6 required skills. Focus on closing critical gaps before applying. |
| ✅ PASS | At least one gap category has entries | {'critical_missing': 0, 'partially_demonstrated': 0, 'preferred_gaps': 2, 'experience_gaps': 0, 'qualification_gaps': 0} |
| ✅ PASS | Customization endpoint responded | Status 200 in 5.7s |
| ✅ PASS | Prioritized skills list non-empty | 6 skills |
| ✅ PASS | Cover letter body non-empty | 886 chars |
| ✅ PASS | Cover letter subject line present | Application for Software Engineering Intern - Backend at CloudScale Systems — Te |
| ✅ PASS | No hallucinated skills/experience in cover letter | Clean |
| ✅ PASS | Interview prep endpoint responded | Status 200 in 5.8s |
| ✅ PASS | At least 5 questions generated total | Total=12 (tech=3, resume=2) |
| ✅ PASS | Technical questions present | 3 questions |
| ✅ PASS | Interview questions reference job-specific skills | 3/6 required skills referenced (50%) |
| ✅ PASS | Application created | Status 201 |
| ✅ PASS | Application status updated | Status 200 |
| ✅ PASS | Applications list returns entries | 1 entries |
| ✅ PASS | Dashboard endpoint responds | Status 200 |
| ✅ PASS | Dashboard total ≥ 1 | total=1 |
| ✅ PASS | Skill Gap ↔ Customization: gaps not listed as strengths | Insufficient data for comparison |
| ✅ PASS | Interview Prep references skills consistent with job | 3/6 required skills referenced (50%) |
| ✅ PASS | Profile fetch < 3s (SQLite) | 2.05s |
| ✅ PASS | Student created | Status 200 → id=21 |
| ✅ PASS | Resume uploaded | Status 200 in 2.5s |
| ✅ PASS | Parsing status = success | Got: success |
| ✅ PASS | Profile endpoint responds | Status 200 |
| ✅ PASS | Extracted non-trivial data (not fallback defaults) | Skills=11, Education=1, Experience=1, Projects=1 |
| ✅ PASS | At least 3 skills extracted | 11 skills |
| ✅ PASS | At least 1 education entry | 1 entries |
| ✅ PASS | Matching endpoint responded | Status 200 in 4.5s |
| ✅ PASS | Returned at least 3 matches | 10 matches |
| ✅ PASS | Top match score ≥ 50 | Score=92% |
| ✅ PASS | Top match reasoning is job-specific (not fallback) | The candidate has a very strong technical overlap with Python, FastAPI, PostgreSQL, and Git, perfectly matching the requ |
| ⚠️ WARN | Top match is domain-relevant | Domain='data science' \| Title='Software Engineering Intern - Web Services' |
| ✅ PASS | Skill gap endpoint responded | Status 200 in 3.9s |
| ✅ PASS | Readiness score in range 0-100 | Score=56 |
| ✅ PASS | Readiness summary non-empty | Candidate meets 4/6 required skills. Focus on closing critical gaps before applying. |
| ✅ PASS | At least one gap category has entries | {'critical_missing': 2, 'partially_demonstrated': 0, 'preferred_gaps': 1, 'experience_gaps': 0, 'qualification_gaps': 0} |
| ✅ PASS | Customization endpoint responded | Status 200 in 5.8s |
| ✅ PASS | Prioritized skills list non-empty | 4 skills |
| ✅ PASS | Cover letter body non-empty | 891 chars |
| ✅ PASS | Cover letter subject line present | Application for Software Engineering Intern - Web Services at OmniCloud Tech — T |
| ✅ PASS | No hallucinated skills/experience in cover letter | Clean |
| ✅ PASS | Interview prep endpoint responded | Status 200 in 2.7s |
| ✅ PASS | At least 5 questions generated total | Total=10 (tech=3, resume=1) |
| ✅ PASS | Technical questions present | 3 questions |
| ✅ PASS | Interview questions reference job-specific skills | 3/6 required skills referenced (50%) |
| ✅ PASS | Application created | Status 201 |
| ✅ PASS | Application status updated | Status 200 |
| ✅ PASS | Applications list returns entries | 1 entries |
| ✅ PASS | Dashboard endpoint responds | Status 200 |
| ✅ PASS | Dashboard total ≥ 1 | total=1 |
| ✅ PASS | Skill Gap ↔ Customization: gaps not listed as strengths | Appropriate separation: 0 overlapping skills out of 4 |
| ✅ PASS | Interview Prep references skills consistent with job | 3/6 required skills referenced (50%) |
| ✅ PASS | Profile fetch < 3s (SQLite) | 2.07s |
| ✅ PASS | Student created | Status 200 → id=22 |
| ✅ PASS | Resume uploaded | Status 200 in 2.5s |
| ✅ PASS | Parsing status = success | Got: success |
| ✅ PASS | Profile endpoint responds | Status 200 |
| ✅ PASS | Extracted non-trivial data (not fallback defaults) | Skills=5, Education=1, Experience=1, Projects=1 |
| ✅ PASS | At least 3 skills extracted | 5 skills |
| ✅ PASS | At least 1 education entry | 1 entries |
| ✅ PASS | Matching endpoint responded | Status 200 in 4.8s |
| ✅ PASS | Returned at least 3 matches | 10 matches |
| ✅ PASS | Top match score ≥ 50 | Score=80% |
| ✅ PASS | Top match reasoning is job-specific (not fallback) | The candidate has a strong foundation in Python and Git, which are required for this internship, alongside a relevant Co |
| ⚠️ WARN | Top match is domain-relevant | Domain='machine learning' \| Title='Software Engineering Intern - Web Services' |
| ✅ PASS | Skill gap endpoint responded | Status 200 in 2.4s |
| ✅ PASS | Readiness score in range 0-100 | Score=28 |
| ✅ PASS | Readiness summary non-empty | Candidate meets 2/6 required skills. Focus on closing critical gaps before applying. |
| ✅ PASS | At least one gap category has entries | {'critical_missing': 4, 'partially_demonstrated': 0, 'preferred_gaps': 2, 'experience_gaps': 0, 'qualification_gaps': 0} |
| ✅ PASS | Customization endpoint responded | Status 200 in 2.8s |
| ✅ PASS | Prioritized skills list non-empty | 2 skills |
| ✅ PASS | Cover letter body non-empty | 885 chars |
| ✅ PASS | Cover letter subject line present | Application for Software Engineering Intern - Web Services at OmniCloud Tech — T |
| ✅ PASS | No hallucinated skills/experience in cover letter | Clean |
| ✅ PASS | Interview prep endpoint responded | Status 200 in 2.8s |
| ✅ PASS | At least 5 questions generated total | Total=10 (tech=3, resume=1) |
| ✅ PASS | Technical questions present | 3 questions |
| ✅ PASS | Interview questions reference job-specific skills | 3/6 required skills referenced (50%) |
| ✅ PASS | Application created | Status 201 |
| ✅ PASS | Application status updated | Status 200 |
| ✅ PASS | Applications list returns entries | 1 entries |
| ✅ PASS | Dashboard endpoint responds | Status 200 |
| ✅ PASS | Dashboard total ≥ 1 | total=1 |
| ✅ PASS | Skill Gap ↔ Customization: gaps not listed as strengths | Appropriate separation: 0 overlapping skills out of 2 |
| ✅ PASS | Interview Prep references skills consistent with job | 3/6 required skills referenced (50%) |
| ✅ PASS | Profile fetch < 3s (SQLite) | 2.08s |
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
