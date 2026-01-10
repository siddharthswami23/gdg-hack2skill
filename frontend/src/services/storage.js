// Local storage utilities for scan history and preferences

const STORAGE_KEYS = {
  SCAN_HISTORY: 'xsspect-scan-history',
  SCAN_CONFIGS: 'xsspect-scan-configs',
  PREFERENCES: 'xsspect-preferences',
};

// Scan History Management
export const scanHistory = {
  getAll: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCAN_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  add: (scan) => {
    const history = scanHistory.getAll();
    const newScan = {
      ...scan,
      id: scan.id || Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    history.unshift(newScan);
    // Keep only last 50 scans
    const trimmed = history.slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify(trimmed));
    return newScan;
  },

  update: (scanId, updates) => {
    const history = scanHistory.getAll();
    const index = history.findIndex(s => s.id === scanId);
    if (index !== -1) {
      history[index] = { ...history[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify(history));
      return history[index];
    }
    return null;
  },

  get: (scanId) => {
    const history = scanHistory.getAll();
    return history.find(s => s.id === scanId);
  },

  delete: (scanId) => {
    const history = scanHistory.getAll();
    const filtered = history.filter(s => s.id !== scanId);
    localStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify(filtered));
  },

  clear: () => {
    localStorage.removeItem(STORAGE_KEYS.SCAN_HISTORY);
  },
};

// Saved Scan Configurations (Templates)
export const scanConfigs = {
  getAll: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCAN_CONFIGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  save: (name, config) => {
    const configs = scanConfigs.getAll();
    const newConfig = {
      id: Date.now().toString(),
      name,
      config,
      createdAt: new Date().toISOString(),
    };
    configs.push(newConfig);
    localStorage.setItem(STORAGE_KEYS.SCAN_CONFIGS, JSON.stringify(configs));
    return newConfig;
  },

  delete: (configId) => {
    const configs = scanConfigs.getAll();
    const filtered = configs.filter(c => c.id !== configId);
    localStorage.setItem(STORAGE_KEYS.SCAN_CONFIGS, JSON.stringify(filtered));
  },
};

// User Preferences
export const preferences = {
  get: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return data ? JSON.parse(data) : {
        theme: 'dark',
        defaultTimeout: 30,
        defaultConcurrency: 10,
        showAdvancedOptions: false,
      };
    } catch {
      return {
        theme: 'dark',
        defaultTimeout: 30,
        defaultConcurrency: 10,
        showAdvancedOptions: false,
      };
    }
  },

  set: (prefs) => {
    const current = preferences.get();
    const updated = { ...current, ...prefs };
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
    return updated;
  },
};
