import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import FiltersBar from './components/FiltersBar';
import PatientTable from './components/PatientTable';
import PatientModal from './components/PatientModal';
import ConfirmModal from './components/ConfirmModal';
import Toast from './components/Toast';
import { api } from './services/api';

export default function App() {
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({ total_patients: 0, currently_admitted: 0, discharged: 0 });
  const [options, setOptions] = useState({
    genders: [],
    wards: [],
    departments: [],
    department_doctors: {},
    doctors: [],
    statuses: [],
  });

  const [filters, setFilters] = useState({
    search: '',
    ward: '',
    department: '',
    doctor: '',
    status: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [systemStatus, setSystemStatus] = useState('connecting');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    actionType: 'delete', // 'delete' | 'discharge'
    patient: null,
    isProcessing: false,
  });

  // Toasts state
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // AbortController ref for search cancellation
  const abortControllerRef = useRef(null);

  // Load master options and stats on initialization
  const loadInitialData = useCallback(async () => {
    try {
      const [optsData, statsData] = await Promise.all([
        api.getOptions(),
        api.getStats(),
      ]);
      setOptions(optsData);
      setStats(statsData);
      setSystemStatus('healthy');
    } catch (err) {
      console.error('Failed to load initial master data:', err);
      setSystemStatus('error');
      addToast(err.message || 'Could not connect to the hospital service.', 'error');
    }
  }, [addToast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load patients list with active filters
  const loadPatients = useCallback(async (currentFilters = filters, isManualRefresh = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await api.getPatients(currentFilters, controller.signal);
      setPatients(data);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Error fetching patients:', err);
      addToast(err.message || 'Failed to fetch patients list.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, addToast]);

  // Refresh stats helper
  const refreshStats = useCallback(async () => {
    try {
      const statsData = await api.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error refreshing statistics:', err);
    }
  }, []);

  // Debounced search and immediate filter changes
  const searchTimeoutRef = useRef(null);
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      loadPatients(filters);
    }, 250);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filters, loadPatients]);

  // Filter change handlers
  const handleFilterChange = (updates) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      ward: '',
      department: '',
      doctor: '',
      status: '',
    });
  };

  // Modal open handlers
  const handleOpenAdmit = () => {
    setPatientToEdit(null);
    setServerErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (patient) => {
    setPatientToEdit(patient);
    setServerErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false);
      setPatientToEdit(null);
      setServerErrors({});
    }
  };

  // Form submit handler for Create / Edit
  const handleModalSubmit = async (payload) => {
    setIsSubmitting(true);
    setServerErrors({});

    try {
      if (patientToEdit) {
        await api.updatePatient(patientToEdit.id, payload);
        addToast(`Patient record for '${payload.name}' updated successfully.`, 'success');
      } else {
        await api.createPatient(payload);
        addToast(`Patient '${payload.name}' admitted successfully.`, 'success');
      }

      setIsModalOpen(false);
      setPatientToEdit(null);

      // Refresh records and statistics
      await Promise.all([loadPatients(filters), refreshStats()]);
    } catch (err) {
      console.error('Failed to submit patient form:', err);
      if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setServerErrors(err.fieldErrors);
      }
      addToast(err.message || 'Operation failed. Please review form fields.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Discharge flow
  const handleDischargeClick = (patient) => {
    setConfirmModal({
      isOpen: true,
      actionType: 'discharge',
      patient,
      isProcessing: false,
    });
  };

  const handleConfirmDischarge = async () => {
    const patient = confirmModal.patient;
    if (!patient) return;

    setConfirmModal((prev) => ({ ...prev, isProcessing: true }));

    try {
      await api.dischargePatient(patient.id);
      addToast(`Patient '${patient.name}' has been marked as Discharged.`, 'success');
      setConfirmModal({ isOpen: false, actionType: 'discharge', patient: null, isProcessing: false });

      await Promise.all([loadPatients(filters), refreshStats()]);
    } catch (err) {
      console.error('Discharge failed:', err);
      addToast(err.message || 'Could not discharge patient.', 'error');
      setConfirmModal((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  // Delete flow
  const handleDeleteClick = (patient) => {
    setConfirmModal({
      isOpen: true,
      actionType: 'delete',
      patient,
      isProcessing: false,
    });
  };

  const handleConfirmDelete = async () => {
    const patient = confirmModal.patient;
    if (!patient) return;

    setConfirmModal((prev) => ({ ...prev, isProcessing: true }));

    try {
      await api.deletePatient(patient.id);
      addToast(`Patient record for '${patient.name}' permanently deleted.`, 'success');
      setConfirmModal({ isOpen: false, actionType: 'delete', patient: null, isProcessing: false });

      await Promise.all([loadPatients(filters), refreshStats()]);
    } catch (err) {
      console.error('Delete failed:', err);
      addToast(err.message || 'Could not delete patient record.', 'error');
      setConfirmModal((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  // Demo seeding handler
  const handleSeedDemo = async () => {
    setIsLoading(true);
    try {
      const res = await api.seedDemoData(true);
      addToast(res.message || 'Demo dataset populated successfully.', 'success');
      await Promise.all([loadPatients(filters), refreshStats()]);
    } catch (err) {
      console.error('Seed demo failed:', err);
      addToast(err.message || 'Failed to seed demo dataset.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.ward || filters.department || filters.doctor || filters.status
  );

  return (
    <div className="app-container">
      <Header
        onOpenAdmit={handleOpenAdmit}
        onRefresh={() => {
          loadPatients(filters, true);
          refreshStats();
        }}
        isRefreshing={isRefreshing}
        systemStatus={systemStatus}
      />

      <main>
        {/* Cold Start / Connection Warning Banner */}
        {systemStatus === 'error' && (
          <div
            style={{
              background: 'var(--warning-bg)',
              color: 'var(--warning-text)',
              border: '1px solid var(--warning-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
            role="alert"
          >
            <div>
              <strong>Demo server is waking up:</strong> Render free-tier services spin down after inactivity and may take 30–50 seconds to wake up on the first visit.
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSystemStatus('connecting');
                loadInitialData();
                loadPatients();
              }}
              style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem', minHeight: '34px' }}
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Metric Cards */}
        <StatsCards stats={stats} isLoading={isLoading && patients.length === 0} />

        {/* Workspace Card: Filters + Patient Table */}
        <section className="workspace-card" aria-label="Patient Admissions Directory">
          <FiltersBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            options={options}
            resultCount={patients.length}
            totalCount={stats?.total_patients ?? 0}
          />

          <PatientTable
            patients={patients}
            isLoading={isLoading}
            systemStatus={systemStatus}
            onRetry={() => {
              setSystemStatus('connecting');
              loadInitialData();
              loadPatients();
            }}
            onEdit={handleEdit}
            onDischargeClick={handleDischargeClick}
            onDeleteClick={handleDeleteClick}
            onClearFilters={handleClearFilters}
            onOpenAdmit={handleOpenAdmit}
            onSeedDemo={handleSeedDemo}
            hasActiveFilters={hasActiveFilters}
          />
        </section>
      </main>

      {/* Patient Admission / Edit Modal */}
      <PatientModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        patientToEdit={patientToEdit}
        options={options}
        isSubmitting={isSubmitting}
        serverErrors={serverErrors}
      />

      {/* Confirmation Modal (Discharge & Delete) */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          !confirmModal.isProcessing &&
          setConfirmModal({ isOpen: false, actionType: 'delete', patient: null, isProcessing: false })
        }
        onConfirm={
          confirmModal.actionType === 'delete'
            ? handleConfirmDelete
            : handleConfirmDischarge
        }
        patientName={confirmModal.patient?.name}
        actionType={confirmModal.actionType}
        isProcessing={confirmModal.isProcessing}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
