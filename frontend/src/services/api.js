import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes for long scans
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available (for future use)
    const token = localStorage.getItem('xsspect-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || 'An error occurred';
      console.error('API Error:', message);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error: No response received');
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Scan API endpoints
export const scannerApi = {
  // Start a new scan
  startScan: async (config) => {
    const response = await api.post('/scan', config);
    return response.data;
  },

  // Get scan status
  getScanStatus: async (scanId) => {
    const response = await api.get(`/scan/${scanId}/status`);
    return response.data;
  },

  // Get scan results
  getScanResults: async (scanId) => {
    const response = await api.get(`/scan/${scanId}/results`);
    return response.data;
  },

  // Stop a running scan
  stopScan: async (scanId) => {
    const response = await api.post(`/scan/${scanId}/stop`);
    return response.data;
  },

  // Get scan history
  getHistory: async (page = 1, limit = 10) => {
    const response = await api.get('/scans', { params: { page, limit } });
    return response.data;
  },

  // Delete a scan
  deleteScan: async (scanId) => {
    const response = await api.delete(`/scan/${scanId}`);
    return response.data;
  },
};

export default api;
