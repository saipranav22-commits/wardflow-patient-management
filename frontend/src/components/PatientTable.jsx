import React from 'react';
import { Edit2, CheckCircle2, Trash2, Bed, SearchX, UserPlus } from 'lucide-react';
import { formatDateReadable } from '../utils/date';

export default function PatientTable({
  patients,
  isLoading,
  onEdit,
  onDischargeClick,
  onDeleteClick,
  onClearFilters,
  onOpenAdmit,
  onSeedDemo,
  hasActiveFilters,
}) {
  if (isLoading) {
    return (
      <div className="state-container">
        <div className="spinner" />
        <h3 className="state-title">Loading patient records...</h3>
        <p className="state-description">Retrieving admission data from the database.</p>
      </div>
    );
  }

  if (patients.length === 0) {
    if (hasActiveFilters) {
      return (
        <div className="state-container">
          <div className="state-icon-circle">
            <SearchX size={28} />
          </div>
          <h3 className="state-title">No matching patients found</h3>
          <p className="state-description">
            No admission records match your current search and filter criteria.
          </p>
          <button type="button" className="btn btn-secondary" onClick={onClearFilters}>
            Clear all filters
          </button>
        </div>
      );
    }

    return (
      <div className="state-container">
        <div className="state-icon-circle">
          <Bed size={28} />
        </div>
        <h3 className="state-title">No patient records in database</h3>
        <p className="state-description">
          The inpatient directory is currently empty. You can admit your first patient or populate demonstration records.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={onOpenAdmit}>
            <UserPlus size={16} />
            <span>Admit patient</span>
          </button>
          <button type="button" className="btn btn-secondary" onClick={onSeedDemo}>
            <span>Load demo dataset</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop & Tablet Table */}
      <div className="table-wrapper">
        <table className="patient-table" aria-label="Inpatient Directory">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Ward</th>
              <th>Department & Doctor</th>
              <th>Admission Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => {
              const isDischarged = p.status === 'Discharged';
              return (
                <tr key={p.id} id={`patient-row-${p.id}`}>
                  <td>
                    <div className="patient-primary-cell">
                      <span className="patient-name-text">{p.name}</span>
                      <span className="patient-demographics-text">
                        {p.age} yrs · {p.gender}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 500 }}>{p.ward}</span>
                  </td>
                  <td>
                    <div className="doctor-cell">
                      <span className="doctor-name">{p.doctor}</span>
                      <span className="department-name">{p.department}</span>
                    </div>
                  </td>
                  <td>
                    <span>{formatDateReadable(p.admission_date)}</span>
                  </td>
                  <td>
                    <span
                      className={`badge-status ${
                        isDischarged ? 'badge-discharged' : 'badge-admitted'
                      }`}
                    >
                      <span className="badge-dot" aria-hidden="true" />
                      {p.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="action-btn"
                        onClick={() => onEdit(p)}
                        title={`Edit record for ${p.name}`}
                        aria-label={`Edit record for ${p.name}`}
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        type="button"
                        className="action-btn action-btn-discharge"
                        onClick={() => onDischargeClick(p)}
                        disabled={isDischarged}
                        title={
                          isDischarged
                            ? 'Patient is already discharged'
                            : `Mark ${p.name} as discharged`
                        }
                        aria-label={`Mark ${p.name} as discharged`}
                      >
                        <CheckCircle2 size={15} />
                      </button>

                      <button
                        type="button"
                        className="action-btn action-btn-delete"
                        onClick={() => onDeleteClick(p)}
                        title={`Delete record for ${p.name}`}
                        aria-label={`Delete record for ${p.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards (Screens < 768px) */}
      <div className="mobile-cards-list">
        {patients.map((p) => {
          const isDischarged = p.status === 'Discharged';
          return (
            <div key={p.id} className="patient-card" id={`patient-card-${p.id}`}>
              <div className="patient-card-header">
                <div>
                  <div className="card-patient-name">{p.name}</div>
                  <div className="card-patient-sub">
                    {p.age} years old · {p.gender}
                  </div>
                </div>
                <span
                  className={`badge-status ${
                    isDischarged ? 'badge-discharged' : 'badge-admitted'
                  }`}
                >
                  <span className="badge-dot" aria-hidden="true" />
                  {p.status}
                </span>
              </div>

              <div className="card-grid-details">
                <div className="card-detail-item">
                  <span className="card-detail-label">Ward</span>
                  <span className="card-detail-val">{p.ward}</span>
                </div>
                <div className="card-detail-item">
                  <span className="card-detail-label">Admitted On</span>
                  <span className="card-detail-val">{formatDateReadable(p.admission_date)}</span>
                </div>
                <div className="card-detail-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="card-detail-label">Department & Doctor</span>
                  <span className="card-detail-val">
                    {p.doctor} ({p.department})
                  </span>
                </div>
              </div>

              <div className="card-actions-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onEdit(p)}
                  aria-label={`Edit ${p.name}`}
                >
                  <Edit2 size={14} />
                  <span>Edit</span>
                </button>

                {!isDischarged && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => onDischargeClick(p)}
                    aria-label={`Discharge ${p.name}`}
                  >
                    <CheckCircle2 size={14} />
                    <span>Discharge</span>
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => onDeleteClick(p)}
                  aria-label={`Delete ${p.name}`}
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
