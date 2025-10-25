// Base API configuration - point directly to backend for now
const API_BASE_URL = import.meta.env.PROD 
  ? '/api'  // In production, use proxy
  : 'http://localhost:8000/api';  // In development, call backend directly

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getToken() {
    return localStorage.getItem('token');
  }

  // Build headers with auth token
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Generic GET request
  async get(endpoint) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API GET Error:', error);
      throw error;
    }
  }

  // Generic POST request
  async post(endpoint, data) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.detail || `HTTP error! status: ${response.status}`);
      }

      return responseData;
    } catch (error) {
      console.error('API POST Error:', error);
      throw error;
    }
  }

  // Generic PUT request
  async put(endpoint, data) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.detail || `HTTP error! status: ${response.status}`);
      }

      return responseData;
    } catch (error) {
      console.error('API PUT Error:', error);
      throw error;
    }
  }

  // Generic DELETE request
  async delete(endpoint) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.detail || `HTTP error! status: ${response.status}`);
      }

      return responseData;
    } catch (error) {
      console.error('API DELETE Error:', error);
      throw error;
    }
  }
}

export default new ApiService();
