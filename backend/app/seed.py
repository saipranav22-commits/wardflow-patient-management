"""
Demonstration dataset generator for WardFlow.
Contains 14 realistic, fictional inpatient records across departments and wards.
Safe, idempotent, and non-destructive.
"""

from datetime import date, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models import Patient
from app.schemas import get_current_kolkata_date


def get_demo_patients_data() -> List[Dict[str, Any]]:
    today = get_current_kolkata_date()
    return [
        {
            "name": "Aarav Sharma",
            "age": 29,
            "gender": "Male",
            "ward": "General Ward",
            "department": "General Medicine",
            "doctor": "Dr. Rajesh Sharma",
            "admission_date": today - timedelta(days=2),
            "status": "Admitted",
        },
        {
            "name": "Priyanka Patel",
            "age": 34,
            "gender": "Female",
            "ward": "Maternity Ward",
            "department": "Obstetrics and Gynecology",
            "doctor": "Dr. Radhika Iyer",
            "admission_date": today - timedelta(days=1),
            "status": "Admitted",
        },
        {
            "name": "Rohan Deshmukh",
            "age": 8,
            "gender": "Male",
            "ward": "Pediatric Ward",
            "department": "Pediatrics",
            "doctor": "Dr. Rohan Kulkarni",
            "admission_date": today - timedelta(days=3),
            "status": "Admitted",
        },
        {
            "name": "Baby of Lakshmi",
            "age": 0,
            "gender": "Female",
            "ward": "Pediatric Ward",
            "department": "Pediatrics",
            "doctor": "Dr. Ananya Nair",
            "admission_date": today,
            "status": "Admitted",
        },
        {
            "name": "Harish Chandra Verma",
            "age": 72,
            "gender": "Male",
            "ward": "ICU",
            "department": "Cardiology",
            "doctor": "Dr. Arvind Kumar",
            "admission_date": today - timedelta(days=4),
            "status": "Admitted",
        },
        {
            "name": "Ananya Mukherjee",
            "age": 45,
            "gender": "Female",
            "ward": "Surgical Ward",
            "department": "General Surgery",
            "doctor": "Dr. Suresh Menon",
            "admission_date": today - timedelta(days=5),
            "status": "Discharged",
        },
        {
            "name": "Kavita Sundaram",
            "age": 52,
            "gender": "Female",
            "ward": "Private Ward",
            "department": "Neurology",
            "doctor": "Dr. Anand Swaminathan",
            "admission_date": today - timedelta(days=6),
            "status": "Admitted",
        },
        {
            "name": "Devendra Singh Rathore",
            "age": 61,
            "gender": "Male",
            "ward": "General Ward",
            "department": "Orthopedics",
            "doctor": "Dr. Vikram Patil",
            "admission_date": today - timedelta(days=7),
            "status": "Discharged",
        },
        {
            "name": "Meera Joshi",
            "age": 28,
            "gender": "Female",
            "ward": "Private Ward",
            "department": "Obstetrics and Gynecology",
            "doctor": "Dr. Pooja Joshi",
            "admission_date": today - timedelta(days=2),
            "status": "Admitted",
        },
        {
            "name": "Vikramaditya Roy",
            "age": 41,
            "gender": "Male",
            "ward": "Surgical Ward",
            "department": "General Surgery",
            "doctor": "Dr. Kavita Reddy",
            "admission_date": today - timedelta(days=8),
            "status": "Discharged",
        },
        {
            "name": "Sunita Sen",
            "age": 67,
            "gender": "Female",
            "ward": "ICU",
            "department": "Cardiology",
            "doctor": "Dr. Meera Nambiar",
            "admission_date": today - timedelta(days=3),
            "status": "Admitted",
        },
        {
            "name": "Mohammad Farooq",
            "age": 55,
            "gender": "Male",
            "ward": "General Ward",
            "department": "General Medicine",
            "doctor": "Dr. Sunita Rao",
            "admission_date": today - timedelta(days=4),
            "status": "Discharged",
        },
        {
            "name": "Karan Malhotra",
            "age": 23,
            "gender": "Other",
            "ward": "General Ward",
            "department": "Orthopedics",
            "doctor": "Dr. Priya Deshmukh",
            "admission_date": today - timedelta(days=1),
            "status": "Admitted",
        },
        {
            "name": "Rukmini Ammal",
            "age": 102,
            "gender": "Female",
            "ward": "Private Ward",
            "department": "Neurology",
            "doctor": "Dr. Shalini Sengupta",
            "admission_date": today - timedelta(days=5),
            "status": "Admitted",
        },
    ]


def seed_database(db: Session, force: bool = False) -> int:
    """
    Seed database with demonstration patients if empty or if force=True.
    Returns count of added records.
    """
    existing_count = db.query(Patient).count()
    if existing_count > 0 and not force:
        return 0

    patients_data = get_demo_patients_data()
    added_count = 0
    for item in patients_data:
        patient = Patient(**item)
        db.add(patient)
        added_count += 1

    db.commit()
    return added_count
