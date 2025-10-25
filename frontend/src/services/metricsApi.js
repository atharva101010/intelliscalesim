const API_BASE_URL = 'http://localhost:8000/api/metrics';

export const metricsApi = {
  // Get all containers with real metrics
  async getContainersMetrics(userId = null) {
    const url = userId ? `${API_BASE_URL}/containers?user_id=${userId}` : `${API_BASE_URL}/containers`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  },

  // Get specific container metrics
  async getContainerMetrics(containerId) {
    const response = await fetch(`${API_BASE_URL}/container/${containerId}`);
    const data = await response.json();
    return data;
  },

  // Get container logs
  async getContainerLogs(containerId, tail = 100) {
    const response = await fetch(`${API_BASE_URL}/container/${containerId}/logs?tail=${tail}`);
    const data = await response.json();
    return data;
  },

  // Check Docker status
  async getDockerStatus() {
    const response = await fetch(`${API_BASE_URL}/status`);
    const data = await response.json();
    return data;
  },

  // Connect to live metrics stream (Server-Sent Events)
  connectLiveMetrics(userId, onMessage, onError) {
    const url = userId ? `${API_BASE_URL}/live?user_id=${userId}` : `${API_BASE_URL}/live`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      if (onError) onError(error);
      eventSource.close();
    };

    return eventSource;
  }
};
