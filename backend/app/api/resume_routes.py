import json
import io
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Query, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.database_models import Resume, CloudEvent, User
from app.models.schemas import ResumeUploadResponse, ResumeResponse
from app.parsers.document_validator import validate_uploaded_document, ValidationError
from app.parsers.pdf_parser import extract_pdf_data, PDFParsingError, PasswordProtectedPDFError
from app.parsers.docx_parser import extract_docx_data, DOCXParsingError
from app.nlp.section_detector import detect_resume_sections
from app.nlp.ats_compat_checker import check_ats_compatibility
from app.storage.storage_provider import get_storage_provider, LocalStorageProvider
from app.api.auth_routes import get_current_user_optional

router = APIRouter(prefix="/resumes", tags=["Resumes"])
storage = get_storage_provider()

@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    try:
        content = await file.read()
        clean_filename, doc_type = validate_uploaded_document(file.filename, content)
    except ValidationError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File validation error: {str(e)}")

    # Document extraction
    page_count = 1
    word_count = 0
    extracted_text = ""
    resume_metadata = {}

    try:
        if doc_type == "pdf":
            parsed = extract_pdf_data(content)
            extracted_text = parsed["text"]
            page_count = parsed["page_count"]
            word_count = parsed["word_count"]
            resume_metadata = {
                "two_column_risk": parsed["two_column_risk"],
                "is_scanned": parsed["is_scanned"],
                "image_count": parsed["image_count"],
                "scanned_warning": parsed.get("scanned_warning"),
                "has_tables": False
            }
        elif doc_type == "docx":
            parsed = extract_docx_data(content)
            extracted_text = parsed["text"]
            page_count = parsed["page_count"]
            word_count = parsed["word_count"]
            resume_metadata = {
                "two_column_risk": False,
                "is_scanned": False,
                "image_count": 0,
                "has_tables": parsed["has_tables"]
            }
        elif doc_type == "txt":
            extracted_text = content.decode("utf-8", errors="ignore")
            word_count = len(extracted_text.split())
            page_count = max(1, round(word_count / 350))
            resume_metadata = {
                "two_column_risk": False,
                "is_scanned": False,
                "image_count": 0,
                "has_tables": False
            }
    except PasswordProtectedPDFError as pe:
        raise HTTPException(status_code=422, detail="PDF is password protected and cannot be ingested.")
    except (PDFParsingError, DOCXParsingError) as pe:
        raise HTTPException(status_code=422, detail=f"Failed to extract document contents: {str(pe)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected extraction failure: {str(e)}")

    # Extract sections
    sections = detect_resume_sections(extracted_text)
    formatting_risks = check_ats_compatibility(resume_metadata, sections, extracted_text)

    # Store file in storage
    storage_key = storage.upload(io.BytesIO(content), clean_filename, file.content_type or "application/octet-stream")

    # Save to database
    user_id = current_user.id if current_user else None
    db_resume = Resume(
        user_id=user_id,
        filename=clean_filename,
        file_size_bytes=len(content),
        file_type=doc_type,
        storage_path=storage_key,
        page_count=page_count,
        word_count=word_count,
        raw_text=extracted_text,
        parsed_sections_json=json.dumps(sections),
        ats_formatting_analysis_json=json.dumps(formatting_risks)
    )
    db.add(db_resume)
    
    # Log event
    evt = CloudEvent(
        event_type="DOCUMENT_INGESTED",
        level="INFO",
        message=f"Document '{clean_filename}' ingested successfully ({doc_type.upper()}, {page_count} pages, {word_count} words).",
        metadata_json=json.dumps({"filename": clean_filename, "size_bytes": len(content), "type": doc_type})
    )
    db.add(evt)
    db.commit()
    db.refresh(db_resume)

    return {
        "id": db_resume.id,
        "filename": clean_filename,
        "file_size_bytes": len(content),
        "file_type": doc_type,
        "page_count": page_count,
        "word_count": word_count,
        "status": "UPLOADED",
        "message": "Resume uploaded, encrypted in storage, and parsed into sections successfully."
    }

@router.get("", response_model=List[ResumeResponse])
def list_resumes(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    query = db.query(Resume)
    if current_user:
        query = query.filter((Resume.user_id == current_user.id) | (Resume.user_id == None))
    resumes = query.order_by(Resume.created_at.desc()).limit(20).all()
    
    results = []
    for r in resumes:
        results.append({
            "id": r.id,
            "filename": r.filename,
            "file_size_bytes": r.file_size_bytes,
            "file_type": r.file_type,
            "page_count": r.page_count,
            "word_count": r.word_count,
            "parsed_sections": json.loads(r.parsed_sections_json) if r.parsed_sections_json else {},
            "ats_formatting_analysis": json.loads(r.ats_formatting_analysis_json) if r.ats_formatting_analysis_json else {},
            "created_at": r.created_at
        })
    return results

@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(resume_id: str, db: Session = Depends(get_db)):
    r = db.query(Resume).filter(Resume.id == resume_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resume not found")
    return {
        "id": r.id,
        "filename": r.filename,
        "file_size_bytes": r.file_size_bytes,
        "file_type": r.file_type,
        "page_count": r.page_count,
        "word_count": r.word_count,
        "parsed_sections": json.loads(r.parsed_sections_json) if r.parsed_sections_json else {},
        "ats_formatting_analysis": json.loads(r.ats_formatting_analysis_json) if r.ats_formatting_analysis_json else {},
        "created_at": r.created_at
    }

@router.delete("/{resume_id}")
def delete_resume(resume_id: str, db: Session = Depends(get_db)):
    r = db.query(Resume).filter(Resume.id == resume_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Delete from storage
    try:
        storage.delete(r.storage_path)
    except Exception:
        pass

    db.delete(r)
    db.commit()
    return {"status": "DELETED", "message": f"Resume {resume_id} and associated documents purged."}

@router.get("/download/{filename}")
def download_resume_file(
    filename: str,
    expires: Optional[int] = Query(None),
    signature: Optional[str] = Query(None)
):
    if isinstance(storage, LocalStorageProvider) and expires and signature:
        if not storage.verify_signed_url(filename, expires, signature):
            raise HTTPException(status_code=403, detail="Invalid or expired signed URL.")
    
    clean_name = Path(filename).name
    file_path = settings.LOCAL_STORAGE_DIR / clean_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found in storage.")
        
    return FileResponse(path=file_path, filename=clean_name)
