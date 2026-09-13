import sqlite3
import json

conn = sqlite3.connect('dev.db')
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cur.fetchall()]
print("Tables:", tables)

for t in tables:
    cur.execute(f"SELECT COUNT(*) FROM {t}")
    count = cur.fetchone()[0]
    print(f"  {t}: {count} rows")

# Check job postings schema
if 'job_postings' in tables:
    cur.execute("PRAGMA table_info(job_postings)")
    cols = cur.fetchall()
    print("\njob_postings columns:")
    for c in cols:
        print(f"  {c[1]} ({c[2]})")

    # Check how many have embeddings
    cur.execute("SELECT COUNT(*) FROM job_postings WHERE embedding IS NOT NULL")
    with_embeddings = cur.fetchone()[0]
    print(f"\njob_postings with embeddings: {with_embeddings}")

    # Check a sample job to see if optional fields are populated
    cur.execute("SELECT title, company, responsibilities, preferred_skills, qualifications, experience_requirements, education_requirements FROM job_postings LIMIT 3")
    rows = cur.fetchall()
    print("\nSample job postings (checking optional fields):")
    for row in rows:
        print(f"  Title: {row[0]}, Company: {row[1]}")
        print(f"    responsibilities: {'SET' if row[2] else 'NULL'}")
        print(f"    preferred_skills: {'SET' if row[3] else 'NULL'}")
        print(f"    qualifications: {'SET' if row[4] else 'NULL'}")
        print(f"    experience_requirements: {'SET' if row[5] else 'NULL'}")
        print(f"    education_requirements: {'SET' if row[6] else 'NULL'}")

conn.close()
