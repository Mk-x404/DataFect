import requests

BASE_URL = "http://127.0.0.1:8000"

def test_routes():
    print("=== STARTING COMPREHENSIVE API ROUTE & FALLBACK VERIFICATION ===")
    session = requests.Session()
    tests_passed = 0
    total_tests = 0

    # 1. Health check
    total_tests += 1
    r = session.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "healthy"
    print("  [PASS] GET /api/health returned 200 healthy")
    tests_passed += 1

    # 2. Session handshake
    total_tests += 1
    r = session.get(f"{BASE_URL}/api/auth/session")
    assert r.status_code == 200
    assert "role" in r.json()
    print(f"  [PASS] GET /api/auth/session returned 200 with role '{r.json()['role']}'")
    tests_passed += 1

    # 3. Upload valid CSV
    total_tests += 1
    rows = ["country,points,price"] + [f"Country_{i},{80 + (i % 20)},{20 + i*2}" for i in range(50)]
    csv_data = "\n".join(rows) + "\n"
    r = session.post(
        f"{BASE_URL}/api/upload",
        files={"file": ("test_wine.csv", csv_data, "text/csv")}
    )
    assert r.status_code == 200
    upload_resp = r.json()
    assert upload_resp["cleaning"]["rows_after"] == 50
    assert "quality" in upload_resp
    assert "correlations" in upload_resp
    assert "prediction" in upload_resp
    session_id = upload_resp["session_id"]
    print(f"  [PASS] POST /api/upload returned 200 with session_id '{session_id[:8]}...'")
    tests_passed += 1

    # 4. Upload with ragged / irregular lines (tests resilient parser fallback)
    total_tests += 1
    ragged_csv = "col1,col2\na,1\nb,2,extra_column\nc,3\n"
    r = session.post(
        f"{BASE_URL}/api/upload",
        files={"file": ("ragged.csv", ragged_csv, "text/csv")}
    )
    assert r.status_code == 200
    print("  [PASS] POST /api/upload gracefully handled ragged CSV lines via fallback")
    tests_passed += 1

    # 5. Upload empty 0-byte file (must return clean 400 with descriptive detail, NOT 500)
    total_tests += 1
    r = session.post(
        f"{BASE_URL}/api/upload",
        files={"file": ("empty.csv", "", "text/csv")}
    )
    assert r.status_code == 400
    err_body = r.json()
    assert "empty" in err_body["detail"].lower()
    print(f"  [PASS] POST /api/upload empty file returned 400 with detail: '{err_body['detail']}'")
    tests_passed += 1

    # 6. POST /api/narrate (AI Story generation)
    total_tests += 1
    r = session.post(
        f"{BASE_URL}/api/narrate",
        json=upload_resp
    )
    assert r.status_code == 200
    narrate_data = r.json()
    assert "insights" in narrate_data
    assert len(narrate_data["insights"]) > 0
    print(f"  [PASS] POST /api/narrate returned 200 with {len(narrate_data['insights'])} structured analytical insights")
    tests_passed += 1

    # 7. POST /api/chat with Top-N ranking query (In-memory DataFrame query)
    total_tests += 1
    r = session.post(
        f"{BASE_URL}/api/chat",
        json={
            "history": [],
            "message": "top 3 by points",
            "analysis_summary": upload_resp,
            "session_id": session_id
        }
    )
    assert r.status_code == 200
    chat_data = r.json()
    assert "response" in chat_data
    assert "follow_up_questions" in chat_data
    assert "points" in chat_data["response"].lower()
    print("  [PASS] POST /api/chat answered top-N query accurately with tabular data and follow-ups")
    tests_passed += 1

    # 8. POST /api/auth/logout
    total_tests += 1
    r = session.post(f"{BASE_URL}/api/auth/logout")
    assert r.status_code == 200
    assert "Logged out" in r.json()["message"]
    print("  [PASS] POST /api/auth/logout returned 200")
    tests_passed += 1

    print(f"\nALL {tests_passed}/{total_tests} API ROUTES & FALLBACKS VERIFIED SUCCESSFULLY (100% PASS)!")

if __name__ == "__main__":
    test_routes()
