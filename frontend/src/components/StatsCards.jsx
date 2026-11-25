import React from 'react';
import { Users, Bed, CheckCircle2 } from 'lucide-react';

export default function StatsCards({ stats, isLoading }) {
  const total = stats?.total_patients ?? 0;
  const admitted = stats?.currently_admitted ?? 0;
  const discharged = stats?.discharged ?? 0;

  return (
    <div className="stats-grid" aria-label="Hospital Admission Metrics">
      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">Total Patients</span>
          <span className="stat-value">{isLoading ? '—' : total}</span>
        </div>
        <div className="stat-icon-wrap stat-icon-total" aria-hidden="true">
          <Users size={24} />
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">Currently Admitted</span>
          <span className="stat-value">{isLoading ? '—' : admitted}</span>
        </div>
        <div className="stat-icon-wrap stat-icon-admitted" aria-hidden="true">
          <Bed size={24} />
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">Discharged</span>
          <span className="stat-value">{isLoading ? '—' : discharged}</span>
        </div>
        <div className="stat-icon-wrap stat-icon-discharged" aria-hidden="true">
          <CheckCircle2 size={24} />
        </div>
      </div>
    </div>
  );
}
