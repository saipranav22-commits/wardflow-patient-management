import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';

        return (
          <div
            key={toast.id}
            className={`toast ${
              isError ? 'toast-error' : isSuccess ? 'toast-success' : 'toast-info'
            }`}
            role="status"
          >
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {isError && <AlertCircle size={18} />}
              {isSuccess && <CheckCircle2 size={18} />}
              {!isError && !isSuccess && <Info size={18} />}
            </div>
            <div style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'currentColor',
                opacity: 0.8,
                cursor: 'pointer',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
