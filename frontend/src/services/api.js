import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for long scans
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data?.message || 'An error occurred';
      console.error('API Error:', message);
    } else if (error.request) {
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
    const response = await api.post('/scan', {
      url: config.url,
      method: config.method || 'GET',
      parameters: config.parameters || extractParams(config.url)
    });
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

  // Download CSV
  downloadCSV: async (scanId) => {
    const response = await api.get(`/scan/${scanId}/download`, {
      responseType: 'blob'
    });
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

// Helper function to extract parameters from URL
function extractParams(url) {
  try {
    const urlObj = new URL(url);
    const params = Array.from(urlObj.searchParams.keys());
    return params.join(',');
  } catch {
    return '';
  }
}

export default api;
