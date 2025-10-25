import api from './api';

export const assignmentsService = {
  // Get all assignments for current user
  async getAll() {
    try {
      return await api.get('/assignments');
    } catch (error) {
      console.error('Get assignments error:', error);
      throw error;
    }
  },

  // Get single assignment by ID
  async getById(id) {
    try {
      return await api.get(`/assignments/${id}`);
    } catch (error) {
      console.error('Get assignment error:', error);
      throw error;
    }
  },

  // Update assignment progress
  async updateProgress(id, progress) {
    try {
      return await api.put(`/assignments/${id}/progress`, { progress });
    } catch (error) {
      console.error('Update progress error:', error);
      throw error;
    }
  },

  // Mark module as complete
  async completeModule(assignmentId, moduleId) {
    try {
      return await api.post(`/assignments/${assignmentId}/modules/${moduleId}/complete`, {});
    } catch (error) {
      console.error('Complete module error:', error);
      throw error;
    }
  }
};
