class AuthService {
  constructor() {
    this.API_URL = 'http://localhost:8000/api';
  }

  // Login
  async login(email, password) {
    try {
      const response = await fetch(`${this.API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }
      
      // Store auth token and user data
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Registration
  async register(userData) {
    try {
      const response = await fetch(`${this.API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }
      
      // Store auth token if returned
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Password Reset - Request
  async requestPasswordReset(email) {
    try {
      const response = await fetch(`${this.API_URL}/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send reset email');
      }
      
      return data;
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  // Password Reset - Verify Token
  async verifyResetToken(token) {
    try {
      const response = await fetch(`${this.API_URL}/auth/password-reset/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Invalid or expired token');
      }
      
      return data;
    } catch (error) {
      console.error('Token verification error:', error);
      throw error;
    }
  }

  // Password Reset - Confirm New Password
  async confirmPasswordReset(token, password) {
    try {
      const response = await fetch(`${this.API_URL}/auth/password-reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to reset password');
      }
      
      return data;
    } catch (error) {
      console.error('Password reset confirmation error:', error);
      throw error;
    }
  }

  // Email Verification - Send Code
  async sendVerificationCode(email) {
    try {
      const response = await fetch(`${this.API_URL}/auth/verify-email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send verification code');
      }
      
      return data;
    } catch (error) {
      console.error('Send verification code error:', error);
      throw error;
    }
  }

  // Email Verification - Confirm Code
  async confirmEmailVerification(email, code) {
    try {
      const response = await fetch(`${this.API_URL}/auth/verify-email/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to verify email');
      }
      
      return data;
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  // Logout
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if authenticated
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }
}

export default new AuthService();
