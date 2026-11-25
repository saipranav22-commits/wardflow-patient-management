"""
Pydantic validation schemas for WardFlow patient operations.
Ensures rigorous data integrity on all input boundaries.
"""

import re
from datetime import date, datetime, timezone, timedelta
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from app.constants import (
    GENDERS,
    WARDS,
    DEPARTMENTS,
    DEPARTMENT_DOCTORS,
    STATUSES,
    get_all_doctors,
)

# Regex allowing English and international unicode alphabetic letters and single spaces
# No digits, punctuation, or symbols allowed.
NAME_REGEX = re.compile(r"^[A-Za-z]+(?: [A-Za-z]+)*$")


def get_current_kolkata_date() -> date:
    """Return today's date in Asia/Kolkata timezone (UTC+05:30)."""
    kolkata_tz = timezone(timedelta(hours=5, minutes=30))
    return datetime.now(kolkata_tz).date()


class PatientBase(BaseModel):
    name: str = Field(..., description="Patient full name (letters and spaces only)")
    age: int = Field(..., description="Patient age in completed years (0-120)")
    gender: str = Field(..., description="Patient gender from approved clinical list")
    ward: str = Field(..., description="Hospital ward from approved clinical list")
    department: str = Field(..., description="Medical department from approved clinical list")
    doctor: str = Field(..., description="Admitting doctor belonging to the department")
    admission_date: date = Field(..., description="Date of admission (cannot be future date)")
    status: str = Field(default="Admitted", description="Patient status: 'Admitted' or 'Discharged'")

    @field_validator("name", mode="before")
    @classmethod
    def validate_name(cls, value):
        if not isinstance(value, str):
            raise ValueError("Name must be a text string.")
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Name is required and cannot be blank.")
        if len(cleaned) < 2:
            raise ValueError("Name must be at least 2 characters long.")
        if len(cleaned) > 100:
            raise ValueError("Name cannot exceed 100 characters.")
        if not NAME_REGEX.match(cleaned):
            raise ValueError("Name accepts letters only. Numbers, punctuation, and special characters are not allowed.")
        return cleaned

    @field_validator("age", mode="before")
    @classmethod
    def validate_age(cls, value):
        # In Python, bool is a subclass of int (True == 1, False == 0)
        if isinstance(value, bool):
            raise ValueError("Age must be an integer, not a boolean.")
        if isinstance(value, float):
            if not value.is_integer():
                raise ValueError("Age must be a whole integer number between 0 and 120.")
            value = int(value)
        if not isinstance(value, int):
            try:
                # If numeric string passed
                if isinstance(value, str) and value.strip().isdigit():
                    value = int(value.strip())
                else:
                    raise ValueError()
            except Exception:
                raise ValueError("Age must be a valid integer number between 0 and 120.")

        if value < 0 or value > 120:
            raise ValueError("Age must be between 0 and 120 years inclusive.")
        return value

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, value: str) -> str:
        if value not in GENDERS:
            raise ValueError(f"Gender must be selected from the approved list: {', '.join(GENDERS)}")
        return value

    @field_validator("ward")
    @classmethod
    def validate_ward(cls, value: str) -> str:
        if value not in WARDS:
            raise ValueError(f"Ward must be selected from the approved list: {', '.join(WARDS)}")
        return value

    @field_validator("department")
    @classmethod
    def validate_department(cls, value: str) -> str:
        if value not in DEPARTMENTS:
            raise ValueError(f"Department must be selected from the approved list: {', '.join(DEPARTMENTS)}")
        return value

    @field_validator("doctor")
    @classmethod
    def validate_doctor_in_list(cls, value: str) -> str:
        approved_doctors = get_all_doctors()
        if value not in approved_doctors:
            raise ValueError(f"Doctor '{value}' is not in the approved clinical staff list.")
        return value

    @field_validator("admission_date", mode="before")
    @classmethod
    def validate_admission_date(cls, value):
        parsed_date: date
        if isinstance(value, str):
            try:
                parsed_date = datetime.strptime(value.strip(), "%Y-%m-%d").date()
            except ValueError:
                raise ValueError("Admission Date must be a valid date in YYYY-MM-DD format.")
        elif isinstance(value, datetime):
            parsed_date = value.date()
        elif isinstance(value, date):
            parsed_date = value
        else:
            raise ValueError("Admission Date is required.")

        today_kolkata = get_current_kolkata_date()
        if parsed_date > today_kolkata:
            raise ValueError(f"Admission Date cannot be a future date (current hospital date is {today_kolkata.isoformat()}).")

        # Clinical sanity check: not earlier than 1900
        if parsed_date < date(1900, 1, 1):
            raise ValueError("Admission Date cannot be prior to the year 1900.")

        return parsed_date

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in STATUSES:
            raise ValueError(f"Status must be either 'Admitted' or 'Discharged', received '{value}'.")
        return value

    @model_validator(mode="after")
    def validate_doctor_department_consistency(self):
        """Cross-field validation ensuring the doctor practices in the selected department."""
        dept = self.department
        doc = self.doctor
        dept_doctors = DEPARTMENT_DOCTORS.get(dept, [])
        if doc not in dept_doctors:
            raise ValueError(
                f"Doctor '{doc}' does not belong to the selected Department '{dept}'. "
                f"Available doctors for {dept}: {', '.join(dept_doctors)}"
            )
        return self


class PatientCreate(PatientBase):
    pass


class PatientUpdate(PatientBase):
    pass


class PatientResponse(BaseModel):
    id: int
    name: str
    age: int
    gender: str
    ward: str
    department: str
    doctor: str
    admission_date: date
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PatientStats(BaseModel):
    total_patients: int
    currently_admitted: int
    discharged: int


class OptionsResponse(BaseModel):
    genders: List[str]
    wards: List[str]
    departments: List[str]
    department_doctors: Dict[str, List[str]]
    doctors: List[str]
    statuses: List[str]
