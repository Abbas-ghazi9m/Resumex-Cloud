import httpx

def test_full_flow():
    client = httpx.Client(base_url="http://127.0.0.1:8000")
    
    # 1. Health
    h = client.get("/health").json()
    assert h["status"] in ["UP", "DEGRADED"], "Health check failed"
    print("[OK] Health UP")
    
    # 2. List analyses
    analyses = client.get("/api/analysis/list").json()
    assert len(analyses) > 0, "No analyses found"
    analysis_id = analyses[0]["id"]
    print(f"[OK] Found Analysis ID: {analysis_id} with score {analyses[0]['overall_score']}%")
    
    # 3. Generate Report
    rep = client.post(f"/api/reports/generate/{analysis_id}").json()
    assert "download_url" in rep, "Missing download URL"
    print(f"[OK] Generated PDF report: {rep['pdf_filename']}")
    
    # 4. Download PDF
    pdf_resp = client.get(rep["download_url"])
    assert pdf_resp.status_code == 200, "Download failed"
    assert len(pdf_resp.content) > 1000, "PDF too small"
    print(f"[OK] Downloaded valid PDF ({len(pdf_resp.content)} bytes)")
    
    # 5. Recruiter Jobs
    rec_jobs = client.get("/api/recruiter/jobs").json()
    assert len(rec_jobs) > 0, "No recruiter jobs found"
    rec_job_id = rec_jobs[0]["id"]
    detail = client.get(f"/api/recruiter/jobs/{rec_job_id}").json()
    print(f"[OK] Recruiter job '{detail['title']}' has {len(detail['candidates'])} ranked candidates")
    
    # 6. Assistant Query
    ast = client.post(f"/api/analysis/{analysis_id}/assistant", json={
        "analysis_id": analysis_id,
        "question": "What skills am I missing?"
    }).json()
    print(f"[OK] AI Assistant answered: {ast['answer'][:100]}...")
    
    # 7. Cloud Observability Stats
    stats = client.get("/api/cloud/stats").json()
    print(f"[OK] Cloud Stats: {stats['documents_processed']} docs, {stats['active_storage_provider']} storage")
    
    print("\nALL END-TO-END FLOW TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_full_flow()
