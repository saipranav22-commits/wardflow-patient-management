/**
 * Clinical data validation logic for WardFlow.
 * Enforces identical rules to backend FastAPI / Pydantic schemas.
 */

import { getTodayDateString } from './date';

// Regex allowing English and international unicode letters and single spaces
export const NAME_REGEX = /^\p{L}+(?: \p{L}+)*$/u;

export function validatePatientForm(formData, departmentDoctors = {}) {
  const errors = {};

  // 1. Name validation
  const rawName = formData.name || '';
  const trimmedName = rawName.trim();
  if (!trimmedName) {
    errors.name = 'Patient name is required.';
  } else if (trimmedName.length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (trimmedName.length > 100) {
    errors.name = 'Name cannot exceed 100 characters.';
  } else if (!NAME_REGEX.test(trimmedName)) {
    errors.name = 'Name accepts letters only (no numbers, punctuation, or special characters).';
  }

  // 2. Age validation
  const rawAge = formData.age;
  if (rawAge === '' || rawAge === undefined || rawAge === null) {
    errors.age = 'Age is required.';
  } else {
    const numAge = Number(rawAge);
    if (!Number.isInteger(numAge) || String(rawAge).includes('.')) {
      errors.age = 'Age must be a whole integer number.';
    } else if (numAge < 0 || numAge > 120) {
      errors.age = 'Age must be between 0 and 120 inclusive.';
    }
  }

  // 3. Gender validation
  if (!formData.gender || !formData.gender.trim()) {
    errors.gender = 'Please select a gender.';
  }

  // 4. Ward validation
  if (!formData.ward || !formData.ward.trim()) {
    errors.ward = 'Please select a hospital ward.';
  }

  // 5. Department validation
  if (!formData.department || !formData.department.trim()) {
    errors.department = 'Please select a medical department.';
  }

  // 6. Doctor validation and cross-department validation
  if (!formData.doctor || !formData.doctor.trim()) {
    errors.doctor = 'Please select an admitting doctor.';
  } else if (formData.department && departmentDoctors[formData.department]) {
    const validDoctors = departmentDoctors[formData.department];
    if (!validDoctors.includes(formData.doctor)) {
      errors.doctor = `Doctor '${formData.doctor}' does not belong to ${formData.department}.`;
    }
  }

  // 7. Admission Date validation
  if (!formData.admission_date || !formData.admission_date.trim()) {
    errors.admission_date = 'Admission date is required.';
  } else {
    const today = getTodayDateString();
    if (formData.admission_date > today) {
      errors.admission_date = `Admission date cannot be in the future (today is ${today}).`;
    } else if (formData.admission_date < '1900-01-01') {
      errors.admission_date = 'Admission date cannot be prior to 1900.';
    }
  }

  // 8. Status validation
  if (!formData.status || !['Admitted', 'Discharged'].includes(formData.status)) {
    errors.status = "Status must be either 'Admitted' or 'Discharged'.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
