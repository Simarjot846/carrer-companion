from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import students, resumes, jobs, agents

# Creates tables on startup if they don't exist yet.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Career Companion Agent",
    description="Internship matching and interview preparation backend — Milestone 2",
    version="0.2.0",
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


@app.get("/")
def root():
    return {"status": "ok", "service": "AI Career Companion Agent API"}

