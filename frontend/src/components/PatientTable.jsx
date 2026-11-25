import React from 'react';
import { Edit2, CheckCircle2, Trash2, Bed, SearchX, UserPlus, AlertCircle, RefreshCw } from 'lucide-react';
import { formatDateReadable } from '../utils/date';

export default function PatientTable({
  patients,
  isLoading,
  systemStatus,
  onRetry,
  onEdit,
  onDischargeClick,
  onDeleteClick,
  onClearFilters,
  onOpenAdmit,
  onSeedDemo,
  hasActiveFilters,
}) {
  // If actively loading data
  if (isLoading && patients.length === 0) {
    return (
      <div className="state-container">
        <div className="spinner" />
        <h3 className="state-title">Loading patient directory...</h3>
        <p className="state-description">
          Connecting to hospital database and retrieving inpatient records.
        </p>
      </div>
    );
  }

  // Handle server cold start / connection error state
  if (systemStatus === 'error' && patients.length === 0) {
    return (
      <div className="state-container">
        <div
          className="state-icon-circle"
          style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)' }}
        >
          <AlertCircle size={28} />
        </div>
        <h3 className="state-title">Hospital Service is Waking Up</h3>
        <p className="state-description">
          The cloud demonstration backend is spinning up from free-tier sleep (typically takes 30–50 seconds on cold start). Automatic reconnection is in progress.
        </p>
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          <RefreshCw size={16} />
          <span>Retry Connection Now</span>
        </button>
      </div>
    );
  }

  // Connecting state
  if (systemStatus === 'connecting' && patients.length === 0) {
    return (
      <div className="state-container">
        <div className="spinner" />
        <h3 className="state-title">Connecting to hospital service...</h3>
        <p className="state-description">
          Establishing connection to the cloud backend. Please wait a moment while records load.
        </p>
      </div>
    );
  }

  // Empty state: ONLY shown when connection is verified healthy
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

      {/* Mobile Card Layout */}
      <div className="mobile-cards-list" aria-label="Inpatient Directory Cards">
        {patients.map((p) => {
          const isDischarged = p.status === 'Discharged';
          return (
            <article key={p.id} className="patient-card">
              <div className="patient-card-header">
                <div>
                  <h3 className="patient-card-name">{p.name}</h3>
                  <div className="patient-card-demographics">
                    {p.age} yrs · {p.gender}
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

              <div className="patient-card-body">
                <div className="patient-card-row">
                  <span className="patient-card-label">Hospital Ward</span>
                  <span className="patient-card-val" style={{ fontWeight: 600 }}>
                    {p.ward}
                  </span>
                </div>
                <div className="patient-card-row">
                  <span className="patient-card-label">Department</span>
                  <span className="patient-card-val">{p.department}</span>
                </div>
                <div className="patient-card-row">
                  <span className="patient-card-label">Admitting Doctor</span>
                  <span className="patient-card-val">{p.doctor}</span>
                </div>
                <div className="patient-card-row">
                  <span className="patient-card-label">Admission Date</span>
                  <span className="patient-card-val">{formatDateReadable(p.admission_date)}</span>
                </div>
              </div>

              <div className="patient-card-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}
                  onClick={() => onEdit(p)}
                >
                  <Edit2 size={14} />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}
                  onClick={() => onDischargeClick(p)}
                  disabled={isDischarged}
                >
                  <CheckCircle2 size={14} />
                  <span>{isDischarged ? 'Discharged' : 'Discharge'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}
                  onClick={() => onDeleteClick(p)}
                  aria-label={`Delete record for ${p.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
