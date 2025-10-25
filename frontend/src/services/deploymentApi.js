const API_BASE_URL = 'http://localhost:8000/api/deployment';

export const deploymentApi = {
  // Deploy Docker image (with optional credentials)
  async deployDockerImage(imageName, containerName, port = null, userId = 'student', userName = 'Student', credentials = null) {
    const response = await fetch(`${API_BASE_URL}/docker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageName,
        containerName,
        port,
        userId,
        userName,
        credentials // { username, password } for private images
      })
    });
    return await response.json();
  },

  // Deploy from GitHub (with optional credentials)
  async deployFromGitHub(repoUrl, containerName, port = null, userId = 'student', userName = 'Student', dockerfilePath = 'Dockerfile', credentials = null) {
    const response = await fetch(`${API_BASE_URL}/github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repoUrl,
        containerName,
        port,
        userId,
        userName,
        dockerfilePath,
        credentials // { username, token } for private repos
      })
    });
    return await response.json();
  },

  // Stop container
  async stopContainer(containerId) {
    const response = await fetch(`${API_BASE_URL}/stop/${containerId}`, {
      method: 'POST'
    });
    return await response.json();
  },

  // Remove container
  async removeContainer(containerId, force = false) {
    const response = await fetch(`${API_BASE_URL}/remove/${containerId}?force=${force}`, {
      method: 'DELETE'
    });
    return await response.json();
  },

  // Get deployment history
  async getHistory(limit = 50) {
    const response = await fetch(`${API_BASE_URL}/history?limit=${limit}`);
    return await response.json();
  },

  // Get available port
  async getAvailablePort() {
    const response = await fetch(`${API_BASE_URL}/available-port`);
    return await response.json();
  }
};
