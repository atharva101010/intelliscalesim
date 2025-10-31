import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Deployment APIs
export const deployDockerImage = (data) => api.post('/api/deployment/docker', data);
export const deployGitHub = (data) => api.post('/deploy/github', data);

// Container Management APIs
export const getContainers = (all = true) => api.get(`/containers?all=${all}`);
export const startContainer = (containerId) => api.post(`/containers/${containerId}/start`);
export const stopContainer = (containerId) => api.post(`/containers/${containerId}/stop`);
export const removeContainer = (containerId) => api.delete(`/containers/${containerId}`);

// Deployment History
export const getDeploymentHistory = () => api.get('/deployments/history');

// Autoscaling (placeholder for future implementation)
export const getAutoscaleStatus = () => Promise.resolve({ data: { enabled: false, containers: [] } });
export const getAutoscalerStatus = () => Promise.resolve({ data: { enabled: false, containers: [] } });

// Health Check
export const getHealth = () => api.get('/health');

export default api;
