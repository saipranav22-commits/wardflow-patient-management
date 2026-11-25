"""
Live Production Verification Script for WardFlow on Render + Neon PostgreSQL.
Executes complete clinical lifecycle against live endpoints.
"""

import sys
from datetime import date, timedelta
import httpx

LIVE_BACKEND_URL = "https://wardflow-app.onrender.com"
TODAY = date.today().isoformat()
TOMORROW = (date.today() + timedelta(days=1)).isoformat()


def run_live_audit():
    print(f"\n========================================================")
    print(f"Auditing Live Render Backend: {LIVE_BACKEND_URL}")
    print(f"========================================================\n")

    client = httpx.Client(base_url=LIVE_BACKEND_URL, timeout=30.0)

    # 1. Health Check
    health_res = client.get("/api/health")
    assert health_res.status_code == 200, f"Health check failed: {health_res.text}"
    health_data = health_res.json()
    print(f"[PASS] 1. Live Health Check: {health_data['status']}, Database: {health_data['database']}")
    assert health_data["database"] == "connected", "Database is not connected!"

    # 2. Dropdown Options Master Data
    options_res = client.get("/api/options")
    assert options_res.status_code == 200
    options = options_res.json()
    assert len(options["wards"]) == 6
    assert len(options["departments"]) == 7
    assert len(options["doctors"]) == 14
    print(f"[PASS] 2. Live Dropdown Options Verified: 6 Wards, 7 Depts, 14 Doctors")

    # 3. Live Stats
    stats_before = client.get("/api/stats").json()
    print(f"[PASS] 3. Live Database Stats: Total={stats_before['total_patients']}, Admitted={stats_before['currently_admitted']}, Discharged={stats_before['discharged']}")

    # 4. Validation Rejection Audit on Live Backend
    # Numbers in name
    res = client.post("/api/patients", json={"name": "Aarav123", "age": 30, "gender": "Male", "ward": "ICU", "department": "Cardiology", "doctor": "Dr. Arvind Kumar", "admission_date": TODAY})
    assert res.status_code == 422, "Live backend accepted name with numbers!"
    # Future admission date
    res = client.post("/api/patients", json={"name": "Aarav Sharma", "age": 30, "gender": "Male", "ward": "ICU", "department": "Cardiology", "doctor": "Dr. Arvind Kumar", "admission_date": TOMORROW})
    assert res.status_code == 422, "Live backend accepted future admission date!"
    # Age boundary violation (-1 and 125)
    res = client.post("/api/patients", json={"name": "Aarav Sharma", "age": -1, "gender": "Male", "ward": "ICU", "department": "Cardiology", "doctor": "Dr. Arvind Kumar", "admission_date": TODAY})
    assert res.status_code == 422
    res = client.post("/api/patients", json={"name": "Aarav Sharma", "age": 125, "gender": "Male", "ward": "ICU", "department": "Cardiology", "doctor": "Dr. Arvind Kumar", "admission_date": TODAY})
    assert res.status_code == 422
    # Doctor-department mismatch
    res = client.post("/api/patients", json={"name": "Aarav Sharma", "age": 30, "gender": "Male", "ward": "ICU", "department": "Cardiology", "doctor": "Dr. Rajesh Sharma", "admission_date": TODAY})
    assert res.status_code == 422
    print(f"[PASS] 4. Live Validation Rejection Audit: All invalid payloads rejected with HTTP 422")

    # 5. Create Live Fictional Test Patient
    test_payload = {
        "name": "Aadi Narayan",
        "age": 32,
        "gender": "Male",
        "ward": "Private Ward",
        "department": "Cardiology",
        "doctor": "Dr. Arvind Kumar",
        "admission_date": TODAY,
        "status": "Admitted",
    }
    create_res = client.post("/api/patients", json=test_payload)
    assert create_res.status_code == 201, f"Failed to create patient: {create_res.text}"
    created = create_res.json()
    p_id = created["id"]
    print(f"[PASS] 5. Created Live Patient: ID={p_id}, Name='{created['name']}'")

    # 6. Verify Search on Live Backend
    search_res = client.get(f"/api/patients?search=aadi")
    assert search_res.status_code == 200
    names = [p["name"] for p in search_res.json()]
    assert "Aadi Narayan" in names, "Search failed to return patient!"
    print(f"[PASS] 6. Live Case-Insensitive Search Verified ('aadi' -> 'Aadi Narayan')")

    # 7. Verify Multi-Condition Combined Filtering
    filter_res = client.get(f"/api/patients?search=Aadi&ward=Private Ward&department=Cardiology&doctor=Dr. Arvind Kumar&status=Admitted")
    assert filter_res.status_code == 200
    assert len(filter_res.json()) >= 1
    assert filter_res.json()[0]["id"] == p_id
    print(f"[PASS] 7. Live Combined AND Filtering Verified (Search + Ward + Dept + Doctor + Status)")

    # 8. Edit Patient on Live Backend
    edit_payload = test_payload.copy()
    edit_payload["age"] = 33
    edit_payload["ward"] = "ICU"
    edit_res = client.put(f"/api/patients/{p_id}", json=edit_payload)
    assert edit_res.status_code == 200
    updated = edit_res.json()
    assert updated["age"] == 33 and updated["ward"] == "ICU"
    print(f"[PASS] 8. Live Edit Verified: Age updated to 33, Ward updated to ICU")

    # 9. Mark as Discharged on Live Backend
    discharge_res = client.patch(f"/api/patients/{p_id}/discharge")
    assert discharge_res.status_code == 200
    discharged = discharge_res.json()
    assert discharged["status"] == "Discharged"
    print(f"[PASS] 9. Live Discharge Verified: Status set to 'Discharged', clinical record preserved")

    # 10. Repeated Discharge is Idempotent
    repeat_res = client.patch(f"/api/patients/{p_id}/discharge")
    assert repeat_res.status_code == 200
    assert repeat_res.json()["status"] == "Discharged"
    print(f"[PASS] 10. Repeated Discharge Idempotency Verified")

    # 11. Delete Patient from Live Backend
    del_res = client.delete(f"/api/patients/{p_id}")
    assert del_res.status_code == 200
    get_res = client.get(f"/api/patients/{p_id}")
    assert get_res.status_code == 404
    print(f"[PASS] 11. Live Deletion Verified: Record permanently removed (subsequent GET returns 404)")

    # 12. Final Stats Verification
    stats_after = client.get("/api/stats").json()
    assert stats_after["total_patients"] == stats_before["total_patients"]
    print(f"[PASS] 12. Live Stats Consistency Verified: Database restored to clean state")

    print(f"\n========================================================")
    print(f"ALL 12 LIVE BACKEND VERIFICATION CHECKS PASSED (100%)")
    print(f"========================================================\n")


if __name__ == "__main__":
    run_live_audit()
