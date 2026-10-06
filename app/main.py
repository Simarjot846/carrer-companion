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

# Enable CORS for frontend integration (Vite dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(students.router)
app.include_router(resumes.router)
app.include_router(jobs.router)
app.include_router(agents.router)
app.include_router(applications.router)


@app.on_event("startup")
def startup_event():
    """Pre-warm sentence-transformers embedding model at server startup."""
    from app.services.embedding_service import preload_local_model
    elapsed = preload_local_model()
    print(f"INFO:     [Startup] Sentence-transformers model (all-MiniLM-L6-v2) pre-warmed in {elapsed:.3f}s")


@app.get("/")
def root():
    return {"status": "ok", "service": "AI Career Companion Agent API", "version": "0.4.0"}
