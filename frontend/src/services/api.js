/**
 * REST API Client for WardFlow.
 * Communicates with FastAPI backend with AbortController support and unified error parsing.
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

class ApiError extends Error {
  constructor(message, status, fieldErrors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      let message = 'An unexpected server error occurred.';
      let fieldErrors = {};

      if (data) {
        if (data.errors && typeof data.errors === 'object') {
          fieldErrors = data.errors;
        }
        if (data.detail) {
          if (typeof data.detail === 'string') {
            message = data.detail;
          } else if (Array.isArray(data.detail)) {
            message = data.detail.map(d => d.msg || JSON.stringify(d)).join('; ');
          }
        } else if (data.message) {
          message = data.message;
        }
      }

      throw new ApiError(message, response.status, fieldErrors);
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err; // Re-throw aborts for the caller to quietly ignore
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      'Unable to connect to the hospital server. The server may be waking up from sleep or the network is unavailable.',
      0,
      {}
    );
  }
}

export const api = {
  getHealth: () => request('/api/health'),

  getOptions: () => request('/api/options'),

  getStats: () => request('/api/stats'),

  getPatients: (params = {}, signal = null) => {
    const query = new URLSearchParams();
    if (params.search && params.search.trim()) query.append('search', params.search.trim());
    if (params.ward && params.ward.trim()) query.append('ward', params.ward.trim());
    if (params.department && params.department.trim()) query.append('department', params.department.trim());
    if (params.doctor && params.doctor.trim()) query.append('doctor', params.doctor.trim());
    if (params.status && params.status.trim()) query.append('status', params.status.trim());

    const qs = query.toString();
    const endpoint = `/api/patients${qs ? `?${qs}` : ''}`;
    return request(endpoint, { signal });
  },

  getPatient: (id) => request(`/api/patients/${id}`),

  createPatient: (payload) =>
    request('/api/patients', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updatePatient: (id, payload) =>
    request(`/api/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  dischargePatient: (id) =>
    request(`/api/patients/${id}/discharge`, {
      method: 'PATCH',
    }),

  deletePatient: (id) =>
    request(`/api/patients/${id}`, {
      method: 'DELETE',
    }),

  seedDemoData: (force = false) =>
    request(`/api/seed?force=${force}`, {
      method: 'POST',
    }),
};
