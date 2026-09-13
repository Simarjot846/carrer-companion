import sqlite3
import json

conn = sqlite3.connect('dev.db')
cur = conn.cursor()

# Check the full count and posting_type breakdown
cur.execute("SELECT posting_type, COUNT(*) FROM job_postings GROUP BY posting_type")
print("Job postings by type:")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]}")

# Check a sample embedding to see what kind it is (real Voyage or deterministic fallback)
cur.execute("SELECT title, embedding FROM job_postings LIMIT 1")
row = cur.fetchone()
emb = json.loads(row[1]) if isinstance(row[1], str) else row[1]
print(f"\nEmbedding for '{row[0]}':")
print(f"  Dimension: {len(emb)}")
print(f"  First 5 values: {emb[:5]}")
print(f"  Type of values: {type(emb[0])}")

# Check if embeddings look like real ML embeddings (smooth distribution) or deterministic hashes (sparse)
import statistics
nonzero = [v for v in emb if abs(v) > 0.001]
print(f"  Non-zero elements: {len(nonzero)} out of {len(emb)}")
print(f"  Mean: {statistics.mean(emb):.6f}")
print(f"  Stdev: {statistics.stdev(emb):.6f}")

# Check seed data - does it have responsibilities, preferred_skills etc in the raw data?
# Look at the actual stored values
cur.execute("SELECT title, responsibilities, preferred_skills, qualifications, experience_requirements, education_requirements FROM job_postings LIMIT 5")
print("\n\nFull field check (first 5 jobs):")
for row in cur.fetchall():
    title, resp, pref, qual, exp_req, edu_req = row
    print(f"\n  [{title}]")
    print(f"    responsibilities: {resp[:80] if resp else 'NULL'}...")
    print(f"    preferred_skills: {pref[:80] if pref else 'NULL'}")
    print(f"    qualifications: {qual[:80] if qual else 'NULL'}...")
    print(f"    experience_requirements: {exp_req[:80] if exp_req else 'NULL'}...")
    print(f"    education_requirements: {edu_req[:80] if edu_req else 'NULL'}...")

conn.close()
