from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import DATABASE_URL
import os

db_url = DATABASE_URL
connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

print(f"INFO:     Connecting to database: {db_url[:40]}..." if len(db_url) > 40 else f"INFO:     Connecting to database: {db_url}")

try:
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        # Pool settings for PostgreSQL on Render free tier
        pool_pre_ping=True,   # reconnect if connection dropped
        pool_recycle=300,     # recycle connections every 5 min
    )
    # Quick connectivity test
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("INFO:     Database connection successful.")
except Exception as e:
    if db_url.startswith("sqlite"):
        raise e
    # On Render, fail loudly so the issue is visible in logs
    # rather than silently falling back to an empty SQLite file
    print(f"ERROR:    Could not connect to database: {e}")
    raise RuntimeError(
        f"Cannot connect to the configured database. "
        f"Check that DATABASE_URL is set correctly in Render environment variables. Error: {e}"
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a DB session and always closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

