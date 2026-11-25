/**
 * REST API Client for WardFlow.
 * Communicates with FastAPI backend with AbortController support, automatic
 * cold-start retry with backoff, 60s timeout, and unified error parsing.
 */

// Normalize API base URL: remove trailing slashes and redundant '/api' suffix
let rawBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
if (rawBase.endsWith('/api')) {
  rawBase = rawBase.slice(0, -4);
}
// Robust fallback: if pointing to older wardflow-api placeholder or empty on Render, route to live wardflow-app backend
if (
  rawBase === 'https://wardflow-api.onrender.com' ||
  (!rawBase && typeof window !== 'undefined' && window.location.hostname.includes('onrender.com'))
) {
  rawBase = 'https://wardflow-app.onrender.com';
}
const API_BASE_URL = rawBase;

export class ApiError extends Error {
  constructor(message, status, fieldErrors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const RETRYABLE_STATUSES = new Set([0, 408, 502, 503, 504]);
const DEFAULT_TIMEOUT_MS = 60000; // 60 seconds to accommodate Render free-tier wake-up
const MAX_GET_RETRIES = 4; // Up to 4 automatic retries on cold-start / 502 / network drop

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'));
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true }
    );
  });
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const maxAttempts = isGet ? MAX_GET_RETRIES : 1;

  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const callerSignal = options.signal;
    if (callerSignal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    // Set up 60s timeout controller linked with caller's signal
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      timeoutController.abort(new Error('Request timed out after 60s'));
    }, DEFAULT_TIMEOUT_MS);

    // Merge caller signal and timeout signal
    let combinedSignal = timeoutController.signal;
    if (callerSignal) {
      if (typeof AbortSignal.any === 'function') {
        combinedSignal = AbortSignal.any([callerSignal, timeoutController.signal]);
      } else {
        callerSignal.addEventListener(
          'abort',
          () => timeoutController.abort(callerSignal.reason),
          { once: true }
        );
      }
    }

    const config = {
      ...options,
      signal: combinedSignal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      let data = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        let message = `Server responded with status ${response.status}.`;
        let fieldErrors = {};

        if (data) {
          if (data.errors && typeof data.errors === 'object') {
            fieldErrors = data.errors;
          }
          if (data.detail) {
            if (typeof data.detail === 'string') {
              message = data.detail;
            } else if (Array.isArray(data.detail)) {
              message = data.detail.map((d) => d.msg || JSON.stringify(d)).join('; ');
            }
          } else if (data.message) {
            message = data.message;
          }
        }

        const apiErr = new ApiError(message, response.status, fieldErrors);

        // If retryable server error (502, 503, 504) on GET and retries remain, loop
        if (isGet && RETRYABLE_STATUSES.has(response.status) && attempt < maxAttempts) {
          lastError = apiErr;
          const backoff = attempt * 2500;
          console.warn(
            `[API] Render cold-start / server status ${response.status} detected on attempt ${attempt}/${maxAttempts}. Auto-retrying in ${backoff}ms...`
          );
          await delay(backoff, callerSignal);
          continue;
        }

        throw apiErr;
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);

      // Never retry if caller intentionally aborted (e.g. typing fast in search)
      if (callerSignal?.aborted || err.name === 'AbortError') {
        throw new DOMException('Aborted', 'AbortError');
      }

      if (err instanceof ApiError) {
        lastError = err;
      } else {
        lastError = new ApiError(
          'Unable to connect to hospital service. The server may be waking up from sleep or the network is unavailable.',
          0,
          {}
        );
      }

      // If network failure on GET and retries remain, back off and retry
      if (isGet && attempt < maxAttempts) {
        const backoff = attempt * 2500;
        console.warn(
          `[API] Network failure on attempt ${attempt}/${maxAttempts}. Cloud backend may be cold-starting. Auto-retrying in ${backoff}ms...`
        );
        await delay(backoff, callerSignal);
        continue;
      }

      throw lastError;
    }
  }

  throw lastError;
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
