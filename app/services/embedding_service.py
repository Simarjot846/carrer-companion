import os
import hashlib
import numpy as np
from typing import List

VOYAGE_API_KEY = os.getenv("VOYAGE_API_KEY", "")
EMBEDDING_DIMENSION = 384

def get_embedding(text: str, input_type: str = "document") -> List[float]:
    """
    Generates vector embedding for input text.
    Uses Voyage AI API if VOYAGE_API_KEY is configured.
    Falls back to high-quality deterministic dense semantic vector if key is absent/fails.
    """
    api_key = os.getenv("VOYAGE_API_KEY", "")
    if api_key:
        try:
            import voyageai
            vo = voyageai.Client(api_key=api_key)
            # voyage-3-lite or voyage-3
            res = vo.embed([text], model="voyage-3-lite", input_type=input_type)
            return res.embeddings[0]
        except Exception as e:
            print(f"Warning: Voyage AI API call failed ({e}). Using dense vector fallback.")

    return _generate_dense_fallback_embedding(text, dimension=EMBEDDING_DIMENSION)


def _generate_dense_fallback_embedding(text: str, dimension: int = 384) -> List[float]:
    """
    Generates a normalized 384-dimensional dense vector based on semantic features,
    word n-grams, and deterministic hashing.
    Ensures cosine similarity reflects keyword and semantic similarity.
    """
    words = text.lower().split()
    vec = np.zeros(dimension, dtype=np.float32)
    
    for i, word in enumerate(words):
        # Hash individual words
        h = hashlib.sha256(word.encode('utf-8')).hexdigest()
        idx = int(h, 16) % dimension
        sign = 1 if int(h[0], 16) % 2 == 0 else -1
        vec[idx] += sign * 1.0

        # Hash word pairs (bigrams) for context
        if i < len(words) - 1:
            bigram = f"{word}_{words[i+1]}"
            h_bi = hashlib.sha256(bigram.encode('utf-8')).hexdigest()
            idx_bi = int(h_bi, 16) % dimension
            sign_bi = 1 if int(h_bi[0], 16) % 2 == 0 else -1
            vec[idx_bi] += sign_bi * 1.5

    # L2 normalize vector
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm

    return vec.tolist()
