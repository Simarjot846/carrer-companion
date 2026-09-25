import os
import numpy as np
from typing import List

# ---------------------------------------------------------------------------
# Embedding Service
# ---------------------------------------------------------------------------
# Priority order:
#   1. Voyage AI  — if VOYAGE_API_KEY is set and the call succeeds
#   2. sentence-transformers (all-MiniLM-L6-v2) — local, free, no API key
#
# The sentence-transformers model is a genuine 384-dim semantic embedding
# model (not a hash function). It runs entirely on-device with no rate
# limits, no billing, and no internet connection required after first download.
# ---------------------------------------------------------------------------

VOYAGE_API_KEY = os.getenv("VOYAGE_API_KEY", "")

# Lazy-load the local model so startup time is unaffected when Voyage is used.
_local_model = None

def _get_local_model():
    """Load sentence-transformers model once, reuse for all subsequent calls."""
    global _local_model
    if _local_model is None:
        from sentence_transformers import SentenceTransformer
        # Try local cache first for instant loading without HF Hub network roundtrips
        try:
            _local_model = SentenceTransformer("all-MiniLM-L6-v2", local_files_only=True)
        except Exception:
            _local_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _local_model


def preload_local_model() -> float:
    """Pre-warm sentence-transformers model at startup and return loading duration in seconds."""
    import time
    t0 = time.time()
    _get_local_model()
    return time.time() - t0


def get_embedding(text: str, input_type: str = "document") -> List[float]:
    """
    Returns a dense semantic embedding vector for the given text.

    Tries Voyage AI first (if VOYAGE_API_KEY is configured and working).
    Falls back to the local sentence-transformers model automatically.
    """
    api_key = os.getenv("VOYAGE_API_KEY", "")
    if api_key:
        try:
            import voyageai
            vo = voyageai.Client(api_key=api_key)
            res = vo.embed([text], model="voyage-3-lite", input_type=input_type)
            return res.embeddings[0]
        except Exception as e:
            print(f"Warning: Voyage AI API call failed ({e}). Using local sentence-transformers fallback.")

    return _get_local_embedding(text)


def _get_local_embedding(text: str) -> List[float]:
    """
    Generates a normalized 384-dim semantic embedding using
    sentence-transformers all-MiniLM-L6-v2 (runs fully locally).
    """
    model = _get_local_model()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()
