import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dev.db")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
UPLOAD_DIR = "uploads"
MAX_UPLOAD_SIZE_MB = 5
ALLOWED_RESUME_EXTENSIONS = {".pdf"}
