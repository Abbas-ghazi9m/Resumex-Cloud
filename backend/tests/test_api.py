import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["UP", "DEGRADED"]
    assert "components" in data

def test_readiness_endpoint():
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json()["ready"] is True

def test_quick_analysis_api():
    payload = {
        "resume_text": "Experienced Python and FastAPI backend developer with Docker and PostgreSQL expertise.",
        "job_text": "Seeking Python engineer with FastAPI and Docker. PostgreSQL is required.",
        "job_title": "Python Developer",
        "candidate_name": "Test Candidate"
    }
    response = client.post("/api/analysis/quick", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "overall_score" in data
    assert data["overall_score"] > 60
    assert "breakdown" in data
    assert "matched_keywords" in data
    assert len(data["matched_keywords"]) > 0

def test_invalid_upload_rejected():
    # Empty file
    response = client.post(
        "/api/resumes/upload",
        files={"file": ("empty.pdf", b"", "application/pdf")}
    )
    assert response.status_code == 400

    # Invalid extension
    response = client.post(
        "/api/resumes/upload",
        files={"file": ("malicious.exe", b"fake binary data content", "application/octet-stream")}
    )
    assert response.status_code == 400

def test_cloud_stats_api():
    response = client.get("/api/cloud/stats")
    assert response.status_code == 200
    data = response.json()
    assert "documents_processed" in data
    assert "active_storage_provider" in data
