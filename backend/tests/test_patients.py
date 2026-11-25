"""
Comprehensive test suite for WardFlow Patient Admission Management.
Audits all mandatory functional, validation, and persistence requirements.
"""

from datetime import date, timedelta
from app.schemas import get_current_kolkata_date


def get_valid_payload():
    today = get_current_kolkata_date()
    return {
        "name": "Aarav Sharma",
        "age": 28,
        "gender": "Male",
        "ward": "General Ward",
        "department": "General Medicine",
        "doctor": "Dr. Rajesh Sharma",
        "admission_date": today.isoformat(),
        "status": "Admitted",
    }


# 1. System Endpoints
def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"


def test_get_options(client):
    response = client.get("/api/options")
    assert response.status_code == 200
    data = response.json()
    assert "Male" in data["genders"]
    assert "General Ward" in data["wards"]
    assert "Cardiology" in data["departments"]
    assert "Dr. Rajesh Sharma" in data["doctors"]
    assert "Admitted" in data["statuses"]
    assert "Discharged" in data["statuses"]


# 2. Patient Creation and Boundary Tests
def test_create_patient_success(client):
    payload = get_valid_payload()
    response = client.post("/api/patients", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Aarav Sharma"
    assert data["age"] == 28
    assert data["status"] == "Admitted"
    assert "id" in data
    assert "created_at" in data


def test_create_patient_age_boundary_zero(client):
    """Test valid newborn age boundary: 0"""
    payload = get_valid_payload()
    payload["name"] = "Baby of Lakshmi"
    payload["age"] = 0
    payload["ward"] = "Pediatric Ward"
    payload["department"] = "Pediatrics"
    payload["doctor"] = "Dr. Rohan Kulkarni"
    response = client.post("/api/patients", json=payload)
    assert response.status_code == 201
    assert response.json()["age"] == 0


def test_create_patient_age_boundary_120(client):
    """Test valid centenarian age boundary: 120"""
    payload = get_valid_payload()
    payload["name"] = "Swami Dayanand"
    payload["age"] = 120
    response = client.post("/api/patients", json=payload)
    assert response.status_code == 201
    assert response.json()["age"] == 120


def test_create_patient_multi_word_name(client):
    """Test multi-word full names with spaces"""
    payload = get_valid_payload()
    payload["name"] = "Devendra Singh Rathore"
    response = client.post("/api/patients", json=payload)
    assert response.status_code == 201
    assert response.json()["name"] == "Devendra Singh Rathore"


# 3. Mandatory Validation Rejection Tests
def test_reject_empty_or_whitespace_name(client):
    payload = get_valid_payload()
    payload["name"] = "    "
    response = client.post("/api/patients", json=payload)
    assert response.status_code == 422
    assert "name" in response.json().get("errors", {})


def test_reject_name_with_numbers(client):
    payload = get_valid_payload()
    payload["name"] = "Patient 123"
    response = client.post("/api/patients", json=payload)
    assert response.status_code == 422
    assert "name" in response.json().get("errors", {})


def test_reject_name_with_punctuation(client):
    payload = get_valid_payload()
    payload["name"] = "Ramesh Kumar!"
    response = client.post("/api/patients", json=payload)
    assert response.status_code == 422
    assert "name" in response.json().get("errors", {})


def test_reject_negative_age(client):
    payload = get_valid_payload()
    payload["age"] = -1
    response = client.post("/api/patients", json=payload)
    assert response.status_code == 422
    assert "age" in response.json().get("errors", {})


def test_reject_age_above_120(client):
    payload = get_valid_payload()
    payload["age"] = 121
    response = client.post("/api/patients", json=payload)
    assert response.status_code == 422
    assert "age" in response.json().get("errors", {})


def test_reject_boolean_age(client):
    payload = get_valid_payload()
    payload["age"] = True
    response = client.post("/api/patients", json=payload)
    assert response.status_code == 422
    assert "age" in response.json().get("errors", {})


def test_reject_future_admission_date(client):
    tomorrow = get_current_kolkata_date() + timedelta(days=1)
    payload = get_valid_payload()
    payload["admission_date"] = tomorrow.isoformat()
    response = client.post("/api/patients", json=payload)
    assert response.status_code == 422
    assert "admission_date" in response.json().get("errors", {})


def test_reject_invalid_gender(client):
    payload = get_valid_payload()
    payload["gender"] = "InvalidGender"
    response = client.post("/api/patients", json=payload)
    assert response.status_code == 422
    assert "gender" in response.json().get("errors", {})


def test_reject_invalid_ward(client):
    payload = get_valid_payload()
    payload["ward"] = "Nonexistent Ward"
    response = client.post("/api/patients", json=payload)
    assert response.status_code == 422
    assert "ward" in response.json().get("errors", {})


def test_reject_doctor_department_mismatch(client):
    """Dr. Rajesh Sharma belongs to General Medicine, not Cardiology"""
    payload = get_valid_payload()
    payload["department"] = "Cardiology"
    payload["doctor"] = "Dr. Rajesh Sharma"
    response = client.post("/api/patients", json=payload)
    assert response.status_code == 422


# 4. Search and Multi-Dimensional Filter Tests
def test_search_and_filters(client):
    today = get_current_kolkata_date()
    p1 = {
        "name": "Kavita Sundaram",
        "age": 42,
        "gender": "Female",
        "ward": "Private Ward",
        "department": "Neurology",
        "doctor": "Dr. Anand Swaminathan",
        "admission_date": today.isoformat(),
        "status": "Admitted",
    }
    p2 = {
        "name": "Kavita Reddy",
        "age": 30,
        "gender": "Female",
        "ward": "Surgical Ward",
        "department": "General Surgery",
        "doctor": "Dr. Suresh Menon",
        "admission_date": today.isoformat(),
        "status": "Discharged",
    }
    p3 = {
        "name": "Vikram Patil",
        "age": 55,
        "gender": "Male",
        "ward": "General Ward",
        "department": "Orthopedics",
        "doctor": "Dr. Priya Deshmukh",
        "admission_date": (today - timedelta(days=2)).isoformat(),
        "status": "Admitted",
    }

    client.post("/api/patients", json=p1)
    client.post("/api/patients", json=p2)
    client.post("/api/patients", json=p3)

    # 1. Case-insensitive search
    res = client.get("/api/patients?search=kavita")
    assert res.status_code == 200
    names = [p["name"] for p in res.json()]
    assert "Kavita Sundaram" in names
    assert "Kavita Reddy" in names
    assert "Vikram Patil" not in names

    # 2. Ward filter
    res = client.get("/api/patients?ward=Private Ward")
    assert len(res.json()) == 1
    assert res.json()[0]["name"] == "Kavita Sundaram"

    # 3. Department filter
    res = client.get("/api/patients?department=Orthopedics")
    assert len(res.json()) == 1
    assert res.json()[0]["name"] == "Vikram Patil"

    # 4. Doctor filter
    res = client.get("/api/patients?doctor=Dr. Suresh Menon")
    assert len(res.json()) == 1
    assert res.json()[0]["name"] == "Kavita Reddy"

    # 5. Status filter
    res = client.get("/api/patients?status=Discharged")
    assert len(res.json()) == 1
    assert res.json()[0]["name"] == "Kavita Reddy"

    # 6. Combined Search + Filters (AND logic)
    res = client.get("/api/patients?search=Kavita&ward=Private Ward&status=Admitted")
    assert len(res.json()) == 1
    assert res.json()[0]["name"] == "Kavita Sundaram"

    # No match when AND condition fails
    res = client.get("/api/patients?search=Kavita&ward=General Ward")
    assert len(res.json()) == 0


# 5. Edit Patient Test
def test_edit_patient(client):
    payload = get_valid_payload()
    created = client.post("/api/patients", json=payload).json()
    p_id = created["id"]

    update_payload = payload.copy()
    update_payload["name"] = "Aarav Sharma Updated"
    update_payload["age"] = 29
    update_payload["ward"] = "ICU"

    res = client.put(f"/api/patients/{p_id}", json=update_payload)
    assert res.status_code == 200
    updated = res.json()
    assert updated["id"] == p_id
    assert updated["name"] == "Aarav Sharma Updated"
    assert updated["age"] == 29
    assert updated["ward"] == "ICU"


# 6. Discharge Workflow Test
def test_discharge_patient(client):
    payload = get_valid_payload()
    created = client.post("/api/patients", json=payload).json()
    p_id = created["id"]
    assert created["status"] == "Admitted"

    res = client.patch(f"/api/patients/{p_id}/discharge")
    assert res.status_code == 200
    discharged = res.json()
    assert discharged["status"] == "Discharged"
    assert discharged["name"] == payload["name"]

    # Repeated discharge is idempotent
    res_repeat = client.patch(f"/api/patients/{p_id}/discharge")
    assert res_repeat.status_code == 200
    assert res_repeat.json()["status"] == "Discharged"


# 7. Delete Workflow Test
def test_delete_patient(client):
    payload = get_valid_payload()
    created = client.post("/api/patients", json=payload).json()
    p_id = created["id"]

    del_res = client.delete(f"/api/patients/{p_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Record should no longer exist
    get_res = client.get(f"/api/patients/{p_id}")
    assert get_res.status_code == 404


# 8. Live Stats Computation Test
def test_stats_computation(client):
    today = get_current_kolkata_date()
    p1 = get_valid_payload()
    p1["status"] = "Admitted"
    p2 = get_valid_payload()
    p2["name"] = "Sunita Rao"
    p2["status"] = "Discharged"

    client.post("/api/patients", json=p1)
    client.post("/api/patients", json=p2)

    stats_res = client.get("/api/stats")
    assert stats_res.status_code == 200
    data = stats_res.json()
    assert data["total_patients"] >= 2
    assert data["currently_admitted"] >= 1
    assert data["discharged"] >= 1
def test_persistence_across_connection_restarts(client):
    """
    Verify that records are persisted to disk and survive database connection teardown.
    """
    from app.database import engine, SessionLocal
    from app.models import Patient
    from datetime import date

    # Create record via direct session
    session1 = SessionLocal()
    new_patient = Patient(
        name="Persistence Test Patient",
        age=45,
        gender="Male",
        ward="ICU",
        department="Cardiology",
        doctor="Dr. Arvind Kumar",
        admission_date=date(2026, 11, 20),
        status="Admitted",
    )
    session1.add(new_patient)
    session1.commit()
    patient_id = new_patient.id
    session1.close()

    # Simulate restart by disposing the engine and opening a brand new session
    engine.dispose()
    session2 = SessionLocal()
    fetched = session2.query(Patient).filter(Patient.id == patient_id).first()

    assert fetched is not None
    assert fetched.name == "Persistence Test Patient"
    assert fetched.ward == "ICU"
    assert fetched.status == "Admitted"

    # Cleanup
    session2.delete(fetched)
    session2.commit()
    session2.close()
