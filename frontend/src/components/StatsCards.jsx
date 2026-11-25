import React from 'react';
import { Users, Bed, CheckCircle2 } from 'lucide-react';

export default function StatsCards({ stats, isLoading, systemStatus = 'healthy' }) {
  const isReady = systemStatus === 'healthy' && stats !== null;
  const total = isReady ? stats.total_patients : '—';
  const admitted = isReady ? stats.currently_admitted : '—';
  const discharged = isReady ? stats.discharged : '—';

  return (
    <div className="stats-grid" aria-label="Hospital Admission Metrics">
      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">Total Patients</span>
          <span className="stat-value">{isLoading && !isReady ? '—' : total}</span>
        </div>
        <div className="stat-icon-wrap stat-icon-total" aria-hidden="true">
          <Users size={24} />
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">Currently Admitted</span>
          <span className="stat-value">{isLoading && !isReady ? '—' : admitted}</span>
        </div>
        <div className="stat-icon-wrap stat-icon-admitted" aria-hidden="true">
          <Bed size={24} />
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">Discharged</span>
          <span className="stat-value">{isLoading && !isReady ? '—' : discharged}</span>
        </div>
        <div className="stat-icon-wrap stat-icon-discharged" aria-hidden="true">
          <CheckCircle2 size={24} />
        </div>
      </div>
    </div>
  );
}
