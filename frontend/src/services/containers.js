import api from './api';

export const containersService = {
  // Get all containers for current user
  async getAll() {
    try {
      return await api.get('/containers');
    } catch (error) {
      console.error('Get containers error:', error);
      throw error;
    }
  },

  // Create new container
  async create(containerData) {
    try {
      return await api.post('/containers', containerData);
    } catch (error) {
      console.error('Create container error:', error);
      throw error;
    }
  },

  // Start container
  async start(containerId) {
    try {
      return await api.post(`/containers/${containerId}/start`, {});
    } catch (error) {
      console.error('Start container error:', error);
      throw error;
    }
  },

  // Stop container
  async stop(containerId) {
    try {
      return await api.post(`/containers/${containerId}/stop`, {});
    } catch (error) {
      console.error('Stop container error:', error);
      throw error;
    }
  },

  // Delete container
  async delete(containerId) {
    try {
      return await api.delete(`/containers/${containerId}`);
    } catch (error) {
      console.error('Delete container error:', error);
      throw error;
    }
  },

  // Get container logs
  async getLogs(containerId) {
    try {
      return await api.get(`/containers/${containerId}/logs`);
    } catch (error) {
      console.error('Get logs error:', error);
      throw error;
    }
  }
};
