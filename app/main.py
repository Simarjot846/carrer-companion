import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import students, resumes, jobs, agents, applications

# Creates all tables (including new Application table) on startup.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Career Companion Agent",
    description="Internship matching, skill-gap analysis, customization, interview prep, and application tracking — Milestone 4",
    version="0.4.0",
)

# Enable CORS for frontend integration (Vite dev server & deployed production frontend)
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

if allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Allow any HTTP/HTTPS origin dynamically with credentials support
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?://.*$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(students.router)
app.include_router(resumes.router)
app.include_router(jobs.router)
app.include_router(agents.router)
app.include_router(applications.router)


def _async_startup_tasks():
    """Background thread: pre-warms embedding model and seeds database without delaying port binding."""
    try:
        from app.services.embedding_service import preload_local_model
        elapsed = preload_local_model()
        print(f"INFO:     [Background] Sentence-transformers model pre-warmed in {elapsed:.3f}s")
    except Exception as e:
        print(f"WARNING:  [Background] Could not pre-warm model ({e})")

    auto_seed = os.getenv("AUTO_SEED_JOBS", "true").lower() in ("true", "1", "yes")
    if auto_seed:
        try:
            from app.models import JobPosting
            from app.database import SessionLocal
            db = SessionLocal()
            try:
                count = db.query(JobPosting).count()
                if count == 0:
                    print("INFO:     [Background] Database is empty. Seeding initial job postings...")
                    from scripts.seed_jobs import seed_job_postings
                    seeded = seed_job_postings(db=db, force_reseed=False)
                    print(f"INFO:     [Background] Auto-seeded {seeded} jobs successfully.")
            finally:
                db.close()
        except Exception as e:
            print(f"WARNING:  [Background] Auto-seed check failed ({e})")


@app.on_event("startup")
def startup_event():
    """Return immediately so Uvicorn binds to the port in <1s for Render health checks."""
    import threading
    t = threading.Thread(target=_async_startup_tasks, daemon=True)
    t.start()


@app.get("/")
def root():
    return {"status": "ok", "service": "AI Career Companion Agent API", "version": "0.4.0"}


@app.get("/health")
@app.get("/api/health")
def health_check():
    """Health check endpoint — used by frontend to detect if backend is awake."""
    return {"status": "ok"}
