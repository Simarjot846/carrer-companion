# M4.3 — Optimizations

**Basis:** Changes made only where M4.2 testing actually flagged issues.  
**Principle:** Do not fix what passed — document what was measured, apply fixes only to confirmed problems.

---

## What the M4.2 Test Found

| Finding | Severity | Action |
|---------|----------|--------|
| `request_options={"timeout": 2}` in customization and skill-gap agents caused silent fallback to empty/generic output | **Fixed** | Raised to 45s |
| First resume parse (Profile Alpha) took 16.7s vs 2.5s for subsequent calls | Documented — inherent Gemini API cold-start | No code change needed |
| Data science / ML profiles received a web-services role as raw embedding top-1 before LLM reranking | Documented — structural limitation of single-vector retrieval | No code change; see analysis below |
| 101/103 checks passed; 0 failures; 2 informational warnings | All critical paths clean | — |

---

## Optimization 1 — Gemini API Timeout (Customization & Skill Gap Agents)

**Problem identified in M4.2:**  
Both `customization_agent.py` and `skill_gap_agent.py` used `request_options={"timeout": 2}` on Gemini API calls. A 2-second timeout is shorter than Gemini's typical 3–8s response time for structured JSON outputs, meaning any API call that took longer than 2s would silently fall through to the fallback path and return empty `prioritized_skills` and generic reasoning.

This caused the first test run (before fix) to return `prioritized_skills: 0` for all three profiles.

**Fix applied:**

| File | Before | After |
|------|--------|-------|
| `app/services/customization_agent.py` — `_call_gemini_resume()` | `timeout: 2` | `timeout: 45` |
| `app/services/customization_agent.py` — `_call_gemini_cover_letter()` | `timeout: 2` | `timeout: 45` |
| `app/services/skill_gap_agent.py` — `_call_gemini_skill_gap()` | `timeout: 2` | `timeout: 45` |

**Before (from M4.2 test run 1 — broken timeout):**
```
[6] Resume & Cover Letter Customization
  ✗ [FAIL] Prioritized skills list non-empty  →  0 skills
```

**After (from M4.2 test run 2 — fixed timeout):**
```
[6] Resume & Cover Letter Customization
  ✓ [PASS] Prioritized skills list non-empty  →  6 skills (Alpha), 4 skills (Beta), 2 skills (Gamma)
```

**Impact:** This was the single most impactful fix — it converted 9 FAIL results to PASS across the three profiles (3 profiles × 3 agent calls each). The fix ensures the LLM path is used reliably rather than silently degrading to fallback.

---

## Optimization 2 — E2E Test Script: Email Validation Fix

**Problem identified in first test run:**  
The test script generated student emails with `.local` TLD (e.g. `alpha.test.1234@e2e.local`). The FastAPI `EmailStr` validator (pydantic-email-validator) correctly rejects non-routable TLDs, causing 422 errors on all three student creation calls and cascading failures across every profile test.

**Fix applied:**  
Changed test email format to `@testmail.com` — a valid TLD that passes email validation.

**Before:**
```python
"email": f"alpha.test.{int(time.time())}@e2e.local"   # fails EmailStr
```
**After:**
```python
"email": f"alpha.e2e.{_RUN_ID}@testmail.com"           # passes EmailStr
```

---

## What Was NOT Changed (and Why)

### First-call latency (16.7s for Alpha, 2.5s for Beta/Gamma)
The first Gemini API call after server restart takes 14–17 seconds on this deployment. Subsequent calls are consistently 2.5–6s. This is Gemini's model cold-start on the first request, not an application bug. The `preload_local_model()` call already pre-warms the sentence-transformers model at startup; a Gemini API "warm-up" call at startup is not implemented because it would add unnecessary cost to every server restart. **No change made.** The behaviour is documented as a known limitation.

### Domain-relevance warning (ML/DS profiles matching web-services role at embedding layer)
The two warnings (`⚠`) in the M4.2 test noted that data science and ML profiles received "Software Engineering Intern - Web Services" as the raw embedding top-1 match, before LLM reranking.

**Root cause:** The `all-MiniLM-L6-v2` embedding model produces a single dense vector per document. When a data science / ML profile lists Python, Docker, Git, and PostgreSQL (all common to web-services roles), the cosine similarity to web-services job embeddings is high — higher than to some DS-specific roles in the dataset. This is a fundamental limitation of single-vector dense retrieval for multi-domain profiles.

**Why no change was made:**
- The LLM reranker **correctly corrected** the domain mismatch in all cases. The final Gemini-scored top matches were 92% and 80% respectively, with domain-appropriate reasoning.
- The RAG pipeline is working as designed: vector search retrieves candidates, LLM corrects the ranking. This is the intended two-stage architecture.
- The alternative (domain-filtered retrieval or multi-vector indexing) would require a more substantial architectural change not warranted by test results that ultimately passed.

**Documented as a known limitation** in the Final Report (Section 11).

### Token usage
Measured across agent calls during the test run. No single call was observed sending more than ~1500 tokens of prompt context. The matching agent uses the top 5 jobs (not 10) for LLM scoring (already implemented in M2 as "FIX 2"). All other agents stay within reasonable bounds. **No change needed.**

---

## Response Time Summary (measured during M4.2 test run 2)

| Operation | Measured Time | Notes |
|-----------|--------------|-------|
| Resume parse (first call — Gemini cold start) | 16.7s | Alpha profile; cold API |
| Resume parse (subsequent calls) | ~2.5s | Beta and Gamma profiles |
| Job matching (10 matches, LLM scoring of top 5) | 4.5–5.6s | All profiles |
| Skill gap analysis | 2.4–4.1s | All profiles |
| Resume customization | 2.8–5.8s | Post-timeout fix |
| Interview prep | 2.7–5.9s | All profiles |
| Profile fetch (SQLite, cached) | ~2.1s | Within 3s threshold |
| Application CRUD operations | <0.5s | Pure DB operations |

**Slowest step:** Resume parsing on cold start (16.7s). On warm API, parsing runs in ~2.5s.
