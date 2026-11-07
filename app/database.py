from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import DATABASE_URL
import os

_RENDER = os.getenv("RENDER") == "true"  # Render injects RENDER=true automatically

db_url = DATABASE_URL
connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

_display = db_url[:40] + "..." if len(db_url) > 40 else db_url
print(f"INFO:     Connecting to database: {_display}")

try:
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_pre_ping=True,    # reconnect if connection dropped (relevant for Postgres)
        pool_recycle=300,      # recycle connections every 5 min
    )
    # Quick connectivity test
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("INFO:     Database connection successful.")

except Exception as e:
    if db_url.startswith("sqlite"):
        # SQLite failure is unrecoverable — re-raise immediately
        raise

    print(f"WARNING:  Could not connect to {_display}: {e}")

    if _RENDER:
        # On Render, hard-fail so the issue is visible in deployment logs
        # rather than silently serving from an empty SQLite file
        raise RuntimeError(
            "Cannot connect to the configured database. "
            f"Check DATABASE_URL in Render environment variables. Error: {e}"
        )

    # Local dev — fall back to SQLite so the server starts without Postgres
    _sqlite_url = "sqlite:///./dev.db"
    print(f"INFO:     Falling back to SQLite: {_sqlite_url}")
    db_url = _sqlite_url
    connect_args = {"check_same_thread": False}
    engine = create_engine(db_url, connect_args=connect_args)
    print("INFO:     SQLite fallback connection successful.")


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a DB session and always closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
