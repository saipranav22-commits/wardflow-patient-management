"""
Patient admission, search, filter, update, discharge, and deletion router.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Patient
from app.schemas import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientStats,
    OptionsResponse,
)
from app.constants import (
    GENDERS,
    WARDS,
    DEPARTMENTS,
    DEPARTMENT_DOCTORS,
    STATUSES,
    get_all_doctors,
)

router = APIRouter(prefix="/api", tags=["Patients"])


@router.get("/options", response_model=OptionsResponse)
def get_options():
    """
    Return authoritative master data for clinical dropdowns.
    Ensures frontend and backend dropdown values remain 100% synchronized.
    """
    return OptionsResponse(
        genders=GENDERS,
        wards=WARDS,
        departments=DEPARTMENTS,
        department_doctors=DEPARTMENT_DOCTORS,
        doctors=get_all_doctors(),
        statuses=STATUSES,
    )


@router.get("/stats", response_model=PatientStats)
def get_stats(db: Session = Depends(get_db)):
    """
    Compute live admission metrics directly from database records.
    Never returns hardcoded or stale analytics.
    """
    total = db.query(func.count(Patient.id)).scalar() or 0
    admitted = db.query(func.count(Patient.id)).filter(Patient.status == "Admitted").scalar() or 0
    discharged = db.query(func.count(Patient.id)).filter(Patient.status == "Discharged").scalar() or 0

    return PatientStats(
        total_patients=total,
        currently_admitted=admitted,
        discharged=discharged,
    )


@router.get("/patients", response_model=List[PatientResponse])
def list_patients(
    search: Optional[str] = Query(None, description="Case-insensitive name search query"),
    ward: Optional[str] = Query(None, description="Filter by Ward"),
    department: Optional[str] = Query(None, description="Filter by Department"),
    doctor: Optional[str] = Query(None, description="Filter by Doctor"),
    status: Optional[str] = Query(None, description="Filter by Status ('Admitted' or 'Discharged')"),
    db: Session = Depends(get_db),
):
    """
    List patient records with multi-dimensional AND filtering and case-insensitive search.
    Ordered deterministically by admission date descending, then ID descending.
    """
    query = db.query(Patient)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(Patient.name.ilike(term))

    if ward and ward.strip():
        query = query.filter(Patient.ward == ward.strip())

    if department and department.strip():
        query = query.filter(Patient.department == department.strip())

    if doctor and doctor.strip():
        query = query.filter(Patient.doctor == doctor.strip())

    if status and status.strip():
        query = query.filter(Patient.status == status.strip())

    # Deterministic order: newest admission first
    patients = query.order_by(Patient.admission_date.desc(), Patient.id.desc()).all()
    return patients


@router.get("/patients/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    """
    Fetch a single patient record by unique ID.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found."
        )
    return patient


@router.post("/patients", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(payload: PatientCreate, db: Session = Depends(get_db)):
    """
    Admit a new patient.
    Enforces all clinical validation rules on payload before persisting.
    """
    patient = Patient(
        name=payload.name,
        age=payload.age,
        gender=payload.gender,
        ward=payload.ward,
        department=payload.department,
        doctor=payload.doctor,
        admission_date=payload.admission_date,
        status=payload.status,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.put("/patients/{patient_id}", response_model=PatientResponse)
def update_patient(patient_id: int, payload: PatientUpdate, db: Session = Depends(get_db)):
    """
    Update an existing patient record.
    Maintains original patient ID and created_at timestamp.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot edit: Patient with ID {patient_id} does not exist."
        )

    patient.name = payload.name
    patient.age = payload.age
    patient.gender = payload.gender
    patient.ward = payload.ward
    patient.department = payload.department
    patient.doctor = payload.doctor
    patient.admission_date = payload.admission_date
    patient.status = payload.status

    db.commit()
    db.refresh(patient)
    return patient


@router.patch("/patients/{patient_id}/discharge", response_model=PatientResponse)
def discharge_patient(patient_id: int, db: Session = Depends(get_db)):
    """
    Mark a patient as Discharged.
    Preserves all clinical fields and record history. Safe against repeated calls.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot discharge: Patient with ID {patient_id} does not exist."
        )

    patient.status = "Discharged"
    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/patients/{patient_id}", status_code=status.HTTP_200_OK)
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    """
    Permanently delete a patient record after explicit confirmation.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot delete: Patient with ID {patient_id} does not exist."
        )

    patient_name = patient.name
    db.delete(patient)
    db.commit()
    return {
        "success": True,
        "message": f"Patient record for '{patient_name}' (ID: {patient_id}) has been permanently deleted.",
        "id": patient_id,
    }
