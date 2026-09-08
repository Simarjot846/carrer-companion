from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import DATABASE_URL

db_url = DATABASE_URL
connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

try:
    engine = create_engine(db_url, connect_args=connect_args)
    # Quick connectivity test
    with engine.connect() as conn:
        pass
except Exception as e:
    if not db_url.startswith("sqlite"):
        print(f"Warning: Could not connect to PostgreSQL ({e}). Falling back to SQLite dev.db.")
        db_url = "sqlite:///./dev.db"
        connect_args = {"check_same_thread": False}
        engine = create_engine(db_url, connect_args=connect_args)
    else:
        raise e

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a DB session and always closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

