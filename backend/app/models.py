"""
SQLAlchemy ORM models for WardFlow patient records.
"""

from datetime import datetime, date
from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    CheckConstraint,
    func,
)
from app.database import Base


class Patient(Base):
    """
    Patient admission record table.
    Enforces check constraints for clinical validity and safety.
    """
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False, index=True)
    age = Column(Integer, nullable=False)
    gender = Column(String(30), nullable=False)
    ward = Column(String(50), nullable=False, index=True)
    department = Column(String(60), nullable=False, index=True)
    doctor = Column(String(80), nullable=False, index=True)
    admission_date = Column(Date, nullable=False, index=True)
    status = Column(String(20), nullable=False, default="Admitted", index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("age >= 0 AND age <= 120", name="check_valid_age_range"),
        CheckConstraint("status IN ('Admitted', 'Discharged')", name="check_valid_status"),
    )

    def to_dict(self):
        """Convert patient instance to dictionary representation."""
        return {
            "id": self.id,
            "name": self.name,
            "age": self.age,
            "gender": self.gender,
            "ward": self.ward,
            "department": self.department,
            "doctor": self.doctor,
            "admission_date": self.admission_date.isoformat() if isinstance(self.admission_date, (date, datetime)) else self.admission_date,
            "status": self.status,
            "created_at": self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
            "updated_at": self.updated_at.isoformat() if isinstance(self.updated_at, datetime) else self.updated_at,
        }
