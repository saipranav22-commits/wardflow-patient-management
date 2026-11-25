import React from 'react';
import { Search, X } from 'lucide-react';

export default function FiltersBar({
  filters,
  onFilterChange,
  onClearFilters,
  options,
  resultCount,
  totalCount,
}) {
  const { search, ward, department, doctor, status } = filters;
  const { wards = [], departments = [], department_doctors = {}, doctors = [] } = options;

  // Filter available doctors if a department is selected
  const availableDoctors = department && department_doctors[department]
    ? department_doctors[department]
    : doctors;

  const hasActiveFilters = Boolean(search || ward || department || doctor || status);

  const handleDepartmentChange = (e) => {
    const newDept = e.target.value;
    const updates = { department: newDept };
    // If current doctor does not belong to new department, reset doctor
    if (doctor && newDept && department_doctors[newDept] && !department_doctors[newDept].includes(doctor)) {
      updates.doctor = '';
    }
    onFilterChange(updates);
  };

  return (
    <div className="filters-bar" aria-label="Search and filter patient records">
      <div className="filters-row">
        {/* Name Search */}
        <div className="search-field-wrapper">
          <Search size={16} className="search-icon" aria-hidden="true" />
          <input
            type="text"
            className="search-input"
            placeholder="Search patients by name..."
            value={search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            aria-label="Search patients by name"
          />
          {search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => onFilterChange({ search: '' })}
              title="Clear search"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Ward Filter */}
        <select
          className="filter-select"
          value={ward}
          onChange={(e) => onFilterChange({ ward: e.target.value })}
          aria-label="Filter by Ward"
        >
          <option value="">All Wards</option>
          {wards.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>

        {/* Department Filter */}
        <select
          className="filter-select"
          value={department}
          onChange={handleDepartmentChange}
          aria-label="Filter by Department"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* Doctor Filter */}
        <select
          className="filter-select"
          value={doctor}
          onChange={(e) => onFilterChange({ doctor: e.target.value })}
          aria-label="Filter by Doctor"
        >
          <option value="">
            {department ? `Doctors in ${department}` : 'All Doctors'}
          </option>
          {availableDoctors.map((doc) => (
            <option key={doc} value={doc}>
              {doc}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          className="filter-select"
          value={status}
          onChange={(e) => onFilterChange({ status: e.target.value })}
          aria-label="Filter by Status"
        >
          <option value="">All Statuses</option>
          <option value="Admitted">Admitted Only</option>
          <option value="Discharged">Discharged Only</option>
        </select>
      </div>

      {/* Meta Bar: Match Count and Active Filter Chips */}
      <div className="filter-meta-bar">
        <div>
          Showing <strong>{resultCount}</strong> of <strong>{totalCount}</strong> patients
          {hasActiveFilters && ' (filtered)'}
        </div>

        <div className="active-filters-chips">
          {search && (
            <span className="chip">
              Search: "{search}"
              <button
                type="button"
                className="chip-remove"
                onClick={() => onFilterChange({ search: '' })}
                aria-label="Remove search filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {ward && (
            <span className="chip">
              Ward: {ward}
              <button
                type="button"
                className="chip-remove"
                onClick={() => onFilterChange({ ward: '' })}
                aria-label="Remove ward filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {department && (
            <span className="chip">
              Dept: {department}
              <button
                type="button"
                className="chip-remove"
                onClick={() => onFilterChange({ department: '', doctor: '' })}
                aria-label="Remove department filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {doctor && (
            <span className="chip">
              Doctor: {doctor}
              <button
                type="button"
                className="chip-remove"
                onClick={() => onFilterChange({ doctor: '' })}
                aria-label="Remove doctor filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {status && (
            <span className="chip">
              Status: {status}
              <button
                type="button"
                className="chip-remove"
                onClick={() => onFilterChange({ status: '' })}
                aria-label="Remove status filter"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              className="btn-link-clear"
              onClick={onClearFilters}
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
