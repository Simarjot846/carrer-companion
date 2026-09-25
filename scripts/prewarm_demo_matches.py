"""
Pre-warm Demo Matches Script
Precomputes and caches job matches for all demo preset candidate profiles.
Run this script while the FastAPI backend is running (http://localhost:8000)
before your live presentation so viewing preset student matches is instant (<10ms).

Usage:
    .venv/Scripts/python scripts/prewarm_demo_matches.py
"""

import sys
import os
import time
import json
import urllib.request
import urllib.error

# Ensure app directory is on path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

PRESET_USERS = [
    {"name": "Alex Chen", "emails": ["alex.chen@berkeley.edu", "alex.chen@university.edu"], "role": "Software Engineering Intern - Backend"},
    {"name": "Maya Patel", "emails": ["maya.patel@columbia.edu", "maya.patel@tech.edu"], "role": "Data Science & Analytics Intern"},
    {"name": "Jordan Rivera", "emails": ["jordan.rivera@nyu.edu", "jordan.rivera@designtech.edu"], "role": "Frontend Developer Intern"},
    {"name": "Priya Sharma", "emails": ["priya.sharma@stanford.edu"], "role": "Machine Learning & AI Research Intern"},
    {"name": "David Kim", "emails": ["david.kim@northwestern.edu", "david.kim@kellogg.northwestern.edu"], "role": "Associate Product Manager Intern"},
    {"name": "Samantha Taylor", "emails": ["samantha.taylor@risd.edu", "samantha.taylor@rhodeisland.edu"], "role": "UI/UX Product Design Intern"},
]


def get_active_server_url():
    """Checks whether backend server is reachable on localhost or 127.0.0.1 and returns base URL."""
    for base in ["http://localhost:8000", "http://127.0.0.1:8000"]:
        try:
            req = urllib.request.Request(f"{base}/", headers={"User-Agent": "PrewarmScript/1.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status == 200:
                    return base
        except Exception:
            continue
    return None


def fetch_students_from_api(api_base):
    """Fetches list of existing students from the running API."""
    url = f"{api_base}/students/"
    req = urllib.request.Request(url, headers={"User-Agent": "PrewarmScript/1.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode())


def prewarm_via_api(student_id, api_base):
    """Calls live API to compute and store in server's in-memory cache."""
    url = f"{api_base}/students/{student_id}/matches?force_refresh=true"
    t0 = time.time()
    req = urllib.request.Request(url, headers={"User-Agent": "PrewarmScript/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode())
    elapsed = time.time() - t0
    return data, elapsed


def verify_cache_speed(student_id, api_base):
    """Calls live API with cached=true (default) to verify instant hit."""
    url = f"{api_base}/students/{student_id}/matches"
    t0 = time.time()
    req = urllib.request.Request(url, headers={"User-Agent": "PrewarmScript/1.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode())
    elapsed = time.time() - t0
    return elapsed


def main():
    print("=" * 70, flush=True)
    print("      AI CAREER COMPANION — DEMO PRE-WARMING PIPELINE", flush=True)
    print("=" * 70, flush=True)

    active_url = get_active_server_url()
    if not active_url:
        print("\n[!] Error: FastAPI backend server is not running.", flush=True)
        print("    Please start your server first with:", flush=True)
        print("    .venv/Scripts/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000\n", flush=True)
        return

    print(f"\n[+] Connected to running FastAPI server ({active_url}).", flush=True)
    students = fetch_students_from_api(active_url)
    print(f"[+] Found {len(students)} total students registered in database.", flush=True)

    # Map preset candidates to actual student records
    preset_emails = {}
    for p in PRESET_USERS:
        for em in p["emails"]:
            preset_emails[em.lower()] = p["name"]

    target_students = []
    seen_ids = set()
    for s in students:
        s_email = s.get("email", "").lower()
        if s_email in preset_emails and s["id"] not in seen_ids:
            target_students.append(s)
            seen_ids.add(s["id"])

    print(f"[+] Identified {len(target_students)} preset demo profiles to pre-warm.\n", flush=True)
    print(f"{'Candidate Name':<18} {'Student ID':<12} {'Matches':<10} {'Compute Time':<15} {'Cache Hit':<12}", flush=True)
    print("-" * 70, flush=True)

    prewarmed_count = 0
    total_compute_time = 0.0

    for s in target_students:
        s_id = s["id"]
        s_name = s.get("name", "Unknown")
        try:
            data, compute_time = prewarm_via_api(s_id, active_url)
            total_compute_time += compute_time
            cache_time = verify_cache_speed(s_id, active_url)
            match_count = data.get("total_matches", len(data.get("matches", [])))
            print(f"{s_name:<18} ID: {s_id:<8} {match_count:<10} {compute_time:.2f}s (fresh)     {cache_time*1000:.1f}ms (instant)", flush=True)
            prewarmed_count += 1
        except Exception as e:
            print(f"{s_name:<18} ID: {s_id:<8} FAILED: {e}", flush=True)

    print("-" * 70, flush=True)
    print(f"\n[OK] Successfully pre-warmed {prewarmed_count} preset demo profiles in {total_compute_time:.2f}s total!", flush=True)
    print("[OK] During your live demo, selecting any preset profile will render matches in <20ms.", flush=True)
    print("=" * 70, flush=True)


if __name__ == "__main__":
    main()
