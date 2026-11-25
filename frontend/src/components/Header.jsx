import React from 'react';
import { Plus, Activity, RefreshCw } from 'lucide-react';

export default function Header({ onOpenAdmit, onRefresh, isRefreshing, systemStatus }) {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-icon-wrapper" aria-hidden="true">
          <Activity size={24} />
        </div>
        <div>
          <div className="brand-title">
            WardFlow
            <span className="badge-demo">Round 1 Assignment</span>
          </div>
          <p className="brand-subtitle">
            Patient Admission Management · Inpatient operations for Indian hospitals
          </p>
        </div>
      </div>

      <div className="header-actions">
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            background:
              systemStatus === 'healthy'
                ? 'var(--admitted-bg)'
                : systemStatus === 'error'
                ? 'var(--danger-light)'
                : 'var(--warning-bg)',
            color:
              systemStatus === 'healthy'
                ? 'var(--admitted-text)'
                : systemStatus === 'error'
                ? 'var(--danger)'
                : 'var(--warning-text)',
            border: '1px solid currentColor',
          }}
          title={`Backend status: ${systemStatus}`}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'currentColor',
            }}
          />
          {systemStatus === 'healthy'
            ? 'API Online'
            : systemStatus === 'error'
            ? 'API Offline'
            : 'Connecting...'}
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh patient records"
          aria-label="Refresh patient records"
        >
          <RefreshCw size={16} className={isRefreshing ? 'spinner' : ''} style={{ margin: 0 }} />
          <span>Refresh</span>
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={onOpenAdmit}
          id="btn-admit-patient"
        >
          <Plus size={18} />
          <span>Admit patient</span>
        </button>
      </div>
    </header>
  );
}
