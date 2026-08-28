from fastapi import FastAPI
from app.database import Base, engine
from app.routers import students, resumes

# Creates tables on startup if they don't exist yet.
# For real schema changes going forward, we use Alembic migrations instead.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Career Companion Agent",
    description="Internship matching and interview preparation backend — Milestone 1",
    version="0.1.0",
)

app.include_router(students.router)
app.include_router(resumes.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "AI Career Companion Agent API"}
