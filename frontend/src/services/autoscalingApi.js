const API_BASE_URL = 'http://localhost:8000/api/autoscaling';

export const autoscalingApi = {
  // Start auto-scaler
  async start() {
    const response = await fetch(`${API_BASE_URL}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await response.json();
  },

  // Stop auto-scaler
  async stop() {
    const response = await fetch(`${API_BASE_URL}/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await response.json();
  },

  // Update configuration
  async updateConfig(config) {
    const response = await fetch(`${API_BASE_URL}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return await response.json();
  },

  // Get status
  async getStatus() {
    const response = await fetch(`${API_BASE_URL}/status`);
    return await response.json();
  },

  // Get history
  async getHistory() {
    const response = await fetch(`${API_BASE_URL}/history`);
    return await response.json();
  }
};
