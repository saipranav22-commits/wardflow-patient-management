import React, { useEffect } from 'react';
import { AlertTriangle, UserCheck, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  patientName,
  actionType = 'delete', // 'delete' | 'discharge'
  isProcessing = false,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  if (!isOpen) return null;

  const isDelete = actionType === 'delete';

  return (
    <div
      className="modal-backdrop"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      <div className="modal-dialog modal-confirm-dialog">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                color: isDelete ? 'var(--danger)' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {isDelete ? <AlertTriangle size={22} /> : <UserCheck size={22} />}
            </div>
            <h2 id="confirm-modal-title" className="modal-title">
              {title || (isDelete ? 'Delete Patient Record' : 'Confirm Discharge')}
            </h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" id="confirm-modal-desc">
          {isDelete ? (
            <p style={{ color: 'var(--text-main)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
              Are you sure you want to permanently delete the inpatient record for{' '}
              <strong>{patientName}</strong>?
              <br />
              <span style={{ color: 'var(--danger)', fontSize: '0.8125rem', display: 'block', marginTop: '0.5rem' }}>
                Warning: This action permanently removes the record from the hospital database.
              </span>
            </p>
          ) : (
            <p style={{ color: 'var(--text-main)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
              Are you sure you want to mark <strong>{patientName}</strong> as{' '}
              <strong>Discharged</strong>?
              <br />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', display: 'block', marginTop: '0.5rem' }}>
                The record will be preserved with full admission history and clinical details intact.
              </span>
            </p>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isProcessing}
            id="btn-confirm-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            className={isDelete ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={onConfirm}
            disabled={isProcessing}
            id="btn-confirm-action"
          >
            {isProcessing
              ? 'Processing...'
              : isDelete
              ? 'Delete patient'
              : 'Mark as discharged'}
          </button>
        </div>
      </div>
    </div>
  );
}
