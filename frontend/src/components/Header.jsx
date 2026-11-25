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
