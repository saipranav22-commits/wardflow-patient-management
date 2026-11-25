"""
Master constants and clinical dropdown values for WardFlow.
Fictional dataset tailored for Indian hospital inpatient operations.
"""

from typing import Dict, List

GENDERS: List[str] = [
    "Male",
    "Female",
    "Other",
    "Prefer not to say",
]

WARDS: List[str] = [
    "General Ward",
    "Private Ward",
    "ICU",
    "Surgical Ward",
    "Pediatric Ward",
    "Maternity Ward",
]

DEPARTMENTS: List[str] = [
    "General Medicine",
    "Cardiology",
    "Orthopedics",
    "Neurology",
    "Pediatrics",
    "General Surgery",
    "Obstetrics and Gynecology",
]

DEPARTMENT_DOCTORS: Dict[str, List[str]] = {
    "General Medicine": [
        "Dr. Rajesh Sharma",
        "Dr. Sunita Rao",
    ],
    "Cardiology": [
        "Dr. Arvind Kumar",
        "Dr. Meera Nambiar",
    ],
    "Orthopedics": [
        "Dr. Vikram Patil",
        "Dr. Priya Deshmukh",
    ],
    "Neurology": [
        "Dr. Anand Swaminathan",
        "Dr. Shalini Sengupta",
    ],
    "Pediatrics": [
        "Dr. Rohan Kulkarni",
        "Dr. Ananya Nair",
    ],
    "General Surgery": [
        "Dr. Suresh Menon",
        "Dr. Kavita Reddy",
    ],
    "Obstetrics and Gynecology": [
        "Dr. Radhika Iyer",
        "Dr. Pooja Joshi",
    ],
}

STATUSES: List[str] = [
    "Admitted",
    "Discharged",
]


def get_all_doctors() -> List[str]:
    """Return a flat sorted list of all approved doctors."""
    all_docs = []
    for docs in DEPARTMENT_DOCTORS.values():
        all_docs.extend(docs)
    return sorted(list(set(all_docs)))


def validate_doctor_department(doctor: str, department: str) -> bool:
    """Verify that doctor belongs to the specified department."""
    allowed = DEPARTMENT_DOCTORS.get(department, [])
    return doctor in allowed
