import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { getTodayDateString } from '../utils/date';
import { validatePatientForm } from '../utils/validation';

export default function PatientModal({
  isOpen,
  onClose,
  onSubmit,
  patientToEdit,
  options,
  isSubmitting,
  serverErrors = {},
}) {
  const {
    genders = [],
    wards = [],
    departments = [],
    department_doctors = {},
    doctors = [],
  } = options;

  const today = getTodayDateString();

  const initialFormState = {
    name: '',
    age: '',
    gender: '',
    ward: '',
    department: '',
    doctor: '',
    admission_date: today,
    status: 'Admitted',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [clientErrors, setClientErrors] = useState({});
  const [touched, setTouched] = useState({});
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (patientToEdit) {
        setFormData({
          name: patientToEdit.name || '',
          age: patientToEdit.age ?? '',
          gender: patientToEdit.gender || '',
          ward: patientToEdit.ward || '',
          department: patientToEdit.department || '',
          doctor: patientToEdit.doctor || '',
          admission_date: patientToEdit.admission_date || today,
          status: patientToEdit.status || 'Admitted',
        });
      } else {
        setFormData({
          ...initialFormState,
          admission_date: today,
        });
      }
      setClientErrors({});
      setTouched({});

      // Auto-focus first input
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, patientToEdit]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const isEditing = Boolean(patientToEdit);

  // Filter available doctors if a department is selected
  const availableDoctors = formData.department && department_doctors[formData.department]
    ? department_doctors[formData.department]
    : doctors;

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // When department changes, if current doctor is not valid for new department, reset doctor
      if (field === 'department') {
        const allowed = department_doctors[value] || [];
        if (prev.doctor && !allowed.includes(prev.doctor)) {
          updated.doctor = '';
        }
      }
      return updated;
    });

    setTouched((prev) => ({ ...prev, [field]: true }));

    // Clear client error for this field
    if (clientErrors[field]) {
      setClientErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Mark all touched
    const allTouched = Object.keys(formData).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);

    const { isValid, errors } = validatePatientForm(formData, department_doctors);
    if (!isValid) {
      setClientErrors(errors);
      return;
    }

    // Submit payload with trimmed name and parsed age integer
    onSubmit({
      ...formData,
      name: formData.name.trim(),
      age: parseInt(formData.age, 10),
    });
  };

  // Merge client and server errors
  const getFieldError = (field) => clientErrors[field] || serverErrors[field];

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-modal-title"
    >
      <div className="modal-dialog">
        <div className="modal-header">
          <h2 id="patient-modal-title" className="modal-title">
            {isEditing ? 'Edit Patient Record' : 'Admit New Patient'}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            <div className="form-grid">
              {/* Patient Name */}
              <div className="form-group form-group-full">
                <label htmlFor="input-name" className="form-label">
                  Patient Full Name <span className="req-star">*</span>
                </label>
                <input
                  id="input-name"
                  ref={nameInputRef}
                  type="text"
                  className={`form-input ${getFieldError('name') ? 'input-error' : ''}`}
                  placeholder="e.g. Ramesh Chandra"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                {getFieldError('name') ? (
                  <span className="field-error-msg">{getFieldError('name')}</span>
                ) : (
                  <span className="field-hint">Letters and spaces only (no numbers or symbols).</span>
                )}
              </div>

              {/* Age */}
              <div className="form-group">
                <label htmlFor="input-age" className="form-label">
                  Age (Years) <span className="req-star">*</span>
                </label>
                <input
                  id="input-age"
                  type="number"
                  min="0"
                  max="120"
                  step="1"
                  className={`form-input ${getFieldError('age') ? 'input-error' : ''}`}
                  placeholder="0 - 120"
                  value={formData.age}
                  onChange={(e) => handleChange('age', e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                {getFieldError('age') ? (
                  <span className="field-error-msg">{getFieldError('age')}</span>
                ) : (
                  <span className="field-hint">Must be between 0 and 120.</span>
                )}
              </div>

              {/* Gender */}
              <div className="form-group">
                <label htmlFor="select-gender" className="form-label">
                  Gender <span className="req-star">*</span>
                </label>
                <select
                  id="select-gender"
                  className={`form-select ${getFieldError('gender') ? 'input-error' : ''}`}
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  disabled={isSubmitting}
                  required
                >
                  <option value="">Select Gender</option>
                  {genders.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                {getFieldError('gender') && (
                  <span className="field-error-msg">{getFieldError('gender')}</span>
                )}
              </div>

              {/* Department */}
              <div className="form-group">
                <label htmlFor="select-department" className="form-label">
                  Department <span className="req-star">*</span>
                </label>
                <select
                  id="select-department"
                  className={`form-select ${getFieldError('department') ? 'input-error' : ''}`}
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  disabled={isSubmitting}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {getFieldError('department') && (
                  <span className="field-error-msg">{getFieldError('department')}</span>
                )}
              </div>

              {/* Doctor */}
              <div className="form-group">
                <label htmlFor="select-doctor" className="form-label">
                  Admitting Doctor <span className="req-star">*</span>
                </label>
                <select
                  id="select-doctor"
                  className={`form-select ${getFieldError('doctor') ? 'input-error' : ''}`}
                  value={formData.doctor}
                  onChange={(e) => handleChange('doctor', e.target.value)}
                  disabled={isSubmitting}
                  required
                >
                  <option value="">
                    {formData.department ? 'Select Doctor' : 'Select Department First'}
                  </option>
                  {availableDoctors.map((doc) => (
                    <option key={doc} value={doc}>
                      {doc}
                    </option>
                  ))}
                </select>
                {getFieldError('doctor') && (
                  <span className="field-error-msg">{getFieldError('doctor')}</span>
                )}
              </div>

              {/* Ward */}
              <div className="form-group">
                <label htmlFor="select-ward" className="form-label">
                  Hospital Ward <span className="req-star">*</span>
                </label>
                <select
                  id="select-ward"
                  className={`form-select ${getFieldError('ward') ? 'input-error' : ''}`}
                  value={formData.ward}
                  onChange={(e) => handleChange('ward', e.target.value)}
                  disabled={isSubmitting}
                  required
                >
                  <option value="">Select Ward</option>
                  {wards.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
                {getFieldError('ward') && (
                  <span className="field-error-msg">{getFieldError('ward')}</span>
                )}
              </div>

              {/* Admission Date */}
              <div className="form-group">
                <label htmlFor="input-admission-date" className="form-label">
                  Admission Date <span className="req-star">*</span>
                </label>
                <input
                  id="input-admission-date"
                  type="date"
                  max={today}
                  className={`form-input ${getFieldError('admission_date') ? 'input-error' : ''}`}
                  value={formData.admission_date}
                  onChange={(e) => handleChange('admission_date', e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                {getFieldError('admission_date') ? (
                  <span className="field-error-msg">{getFieldError('admission_date')}</span>
                ) : (
                  <span className="field-hint">Today or prior date only.</span>
                )}
              </div>

              {/* Status */}
              <div className="form-group form-group-full">
                <label htmlFor="select-status" className="form-label">
                  Admission Status <span className="req-star">*</span>
                </label>
                <select
                  id="select-status"
                  className={`form-select ${getFieldError('status') ? 'input-error' : ''}`}
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  disabled={isSubmitting}
                  required
                >
                  <option value="Admitted">Admitted</option>
                  <option value="Discharged">Discharged</option>
                </select>
                {getFieldError('status') && (
                  <span className="field-error-msg">{getFieldError('status')}</span>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              id="btn-submit-patient-form"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Admit Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
