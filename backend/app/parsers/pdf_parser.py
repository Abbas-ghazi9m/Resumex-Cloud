import io
from typing import Dict, Any, Tuple
import fitz  # PyMuPDF
from pypdf import PdfReader

class PDFParsingError(Exception):
    pass

class ScannedPDFWarning(Exception):
    pass

class PasswordProtectedPDFError(Exception):
    pass

def extract_pdf_data(pdf_bytes: bytes) -> Dict[str, Any]:
    """
    Parses PDF document using PyMuPDF with fallback to pypdf.
    Extracts text, page count, formatting clues (tables, multi-column, fonts),
    and detects scanned/image-only PDFs.
    """
    if not pdf_bytes or len(pdf_bytes) < 32:
        raise PDFParsingError("File is empty or corrupted (too small to be a valid PDF).")
    
    # Check signature
    if not pdf_bytes.startswith(b"%PDF"):
        raise PDFParsingError("Invalid PDF header signature. File is not a valid PDF.")

    page_count = 0
    full_text = []
    has_images = False
    total_image_count = 0
    font_names = set()
    two_column_risk = False
    tables_detected = False

    try:
        # Primary parser: PyMuPDF (fitz)
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        if doc.is_encrypted:
            raise PasswordProtectedPDFError("PDF is password protected and cannot be parsed.")
        
        page_count = len(doc)
        if page_count == 0:
            raise PDFParsingError("PDF contains 0 pages.")

        for page_idx in range(page_count):
            page = doc[page_idx]
            text = page.get_text("text")
            full_text.append(text)
            
            # Check for images
            images = page.get_images()
            if images:
                has_images = True
                total_image_count += len(images)
            
            # Layout heuristics: inspect text blocks
            blocks = page.get_text("blocks")
            # If multiple blocks share similar vertical coordinates with distinct horizontal coordinates
            # and significant column width separation, mark two-column layout risk
            col_lefts = []
            for b in blocks:
                if len(b) >= 5 and b[4].strip():
                    col_lefts.append(b[0])
            if len(col_lefts) >= 4:
                # Check if there are two distinct clusters of left margins (>150 pt difference)
                left_margins = sorted(col_lefts)
                min_m, max_m = left_margins[0], left_margins[-1]
                if (max_m - min_m) > 180:
                    two_column_risk = True

            # Font extraction
            for font in page.get_fonts():
                if font and len(font) > 3:
                    font_names.add(font[3])

        doc.close()
    except PasswordProtectedPDFError:
        raise
    except Exception as fitz_err:
        # Fallback parser: pypdf
        try:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            if reader.is_encrypted:
                raise PasswordProtectedPDFError("PDF is encrypted and password protected.")
            page_count = len(reader.pages)
            full_text = []
            for p in reader.pages:
                extracted = p.extract_text() or ""
                full_text.append(extracted)
        except PasswordProtectedPDFError:
            raise
        except Exception as pypdf_err:
            raise PDFParsingError(f"Corrupted or unreadable PDF: {str(fitz_err)} | {str(pypdf_err)}")

    combined_text = "\n\n".join(full_text).strip()
    word_count = len(combined_text.split())

    # Scanned document detection:
    # If document has pages but extremely low text density while having images
    is_scanned = False
    scanned_warning = None
    if page_count > 0 and word_count < 30 and (has_images or total_image_count > 0):
        is_scanned = True
        scanned_warning = "This document appears to contain scanned images. OCR is required for complete extraction."
    elif word_count == 0:
        if has_images:
            is_scanned = True
            scanned_warning = "This document appears to contain scanned images. OCR is required for complete extraction."
        else:
            raise PDFParsingError("PDF contains no selectable text or content.")

    return {
        "text": combined_text,
        "page_count": page_count,
        "word_count": word_count,
        "is_scanned": is_scanned,
        "scanned_warning": scanned_warning,
        "image_count": total_image_count,
        "two_column_risk": two_column_risk,
        "fonts_detected": list(font_names)[:10],
    }
