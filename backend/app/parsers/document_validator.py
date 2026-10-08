import re
from pathlib import Path
from typing import Tuple
from app.core.config import settings

class ValidationError(Exception):
    pass

MAGIC_NUMBERS = {
    "pdf": [b"%PDF"],
    "docx": [b"PK\x03\x04"],
    "txt": []  # plain text doesn't have a single magic byte, checked via UTF-8/ASCII decoding
}

def sanitize_filename(filename: str) -> str:
    """Removes path traversal attacks and non-safe characters"""
    # Strip paths
    clean = Path(filename).name
    # Replace dangerous characters
    clean = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', clean)
    if not clean or clean.startswith('.'):
        clean = f"document_{clean.lstrip('.')}"
    return clean

def validate_uploaded_document(filename: str, content: bytes) -> Tuple[str, str]:
    """
    Validates document security, size, magic numbers, and returns sanitized name and document type.
    """
    if not content:
        raise ValidationError("Uploaded file is empty (0 bytes).")

    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.MAX_FILE_SIZE_MB:
        raise ValidationError(
            f"File size ({size_mb:.1f}MB) exceeds maximum allowable limit of {settings.MAX_FILE_SIZE_MB}MB."
        )

    clean_filename = sanitize_filename(filename)
    suffix = Path(clean_filename).suffix.lower()

    if suffix not in settings.ALLOWED_EXTENSIONS:
        raise ValidationError(
            f"Unsupported file format '{suffix}'. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Magic byte verification
    doc_type = suffix.lstrip('.')
    if doc_type == "pdf":
        if not any(content.startswith(magic) for magic in MAGIC_NUMBERS["pdf"]):
            raise ValidationError("File content does not match genuine PDF binary header signature.")
    elif doc_type == "docx":
        if not any(content.startswith(magic) for magic in MAGIC_NUMBERS["docx"]):
            raise ValidationError("File content does not match genuine OpenXML/DOCX ZIP signature.")
    elif doc_type == "txt":
        try:
            content.decode('utf-8')
        except UnicodeDecodeError:
            try:
                content.decode('latin-1')
            except UnicodeDecodeError:
                raise ValidationError("Text document must be valid UTF-8 or ASCII plain text.")

    return clean_filename, doc_type
