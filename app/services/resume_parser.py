import fitz  # PyMuPDF


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts raw text from a PDF file.

    WHY a dedicated library instead of asking the LLM to read the PDF:
    PDF-to-text is a solved, deterministic problem. Using PyMuPDF is faster,
    cheaper, and more reliable than sending raw PDF bytes to an LLM. The LLM's
    job starts AFTER we already have clean text — see llm_extractor.py.
    """
    text_chunks = []
    with fitz.open(file_path) as doc:
        for page in doc:
            text_chunks.append(page.get_text())

    raw_text = "\n".join(text_chunks).strip()

    if not raw_text:
        raise ValueError(
            "No extractable text found in PDF. It may be a scanned image "
            "rather than a text-based PDF (OCR not implemented in this phase)."
        )

    return raw_text
