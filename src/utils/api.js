import { buildApiUrl } from '../config/api.js';

// Centralized API utility for making authenticated requests
export const api = {
  // GET request
  async get(endpoint, options = {}) {
    const url = buildApiUrl(endpoint);
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      ...options,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return response.json();
  },

  // POST request
  async post(endpoint, data = null, options = {}) {
    const url = buildApiUrl(endpoint);
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    // Handle responses that might not have JSON content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return { message: 'Success' };
  },

  // PUT request
  async put(endpoint, data = null, options = {}) {
    const url = buildApiUrl(endpoint);
    const response = await fetch(url, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return { message: 'Success' };
  },

  // DELETE request
  async delete(endpoint, options = {}) {
    const url = buildApiUrl(endpoint);
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      ...options,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return { message: 'Success' };
  },
};

// Specific API functions for common operations
export const authAPI = {
  // Check current user
  async getCurrentUser() {
    return api.get('/me');
  },

  // Login
  async login(credentials) {
    return api.post('/login', credentials);
  },

  // Register
  async register(userData) {
    return api.post('/register', userData);
  },

  // Logout
  async logout() {
    return api.post('/logout');
  },

  // Verify email code
  async verifyCode(email, code) {
    return api.post('/verify-code', { email, code });
  },

  // Resend verification code
  async resendCode(email) {
    return api.post('/resend-code', { email });
  },

  // Forgot password
  async forgotPassword(email) {
    return api.post('/forgot-password', { email });
  },

  // Verify reset code
  async verifyResetCode(email, code) {
    return api.post('/verify-reset-code', { email, code });
  },

  // Reset password
  async resetPassword(email, code, newPassword) {
    return api.post('/reset-password', { email, code, newPassword });
  },
};

export const caughtAPI = {
  // Get caught Pokemon data
  async getCaughtData() {
    return api.get('/caught');
  },

  // Update caught Pokemon data
  async updateCaughtData(caughtMap) {
    return api.put('/caught', { caughtMap });
  },
};

export const progressAPI = {
  // Get progress bars
  async getProgressBars() {
    return api.get('/progressBars');
  },

  // Update progress bars
  async updateProgressBars(progressBars) {
    return api.put('/progressBars', { progressBars });
  },
};

export const profileAPI = {
  // Get user profile
  async getProfile() {
    return api.get('/profile');
  },

  // Update user profile
  async updateProfile(profileData) {
    return api.put('/profile', profileData);
  },

  // Get public users for trainers page
  async getPublicUsers() {
    return api.get('/users/public');
  },

  // Get public profile by username
  async getPublicProfile(username) {
    return api.get(`/users/${username}/public`);
  },
};

export const userAPI = {
  // Update username
  async updateUsername(newUsername) {
    return api.put('/update-username', { newUsername });
  },

  // Change password
  async changePassword(currentPassword, newPassword) {
    return api.put('/change-password', { currentPassword, newPassword });
  },

  // Send delete account code
  async sendDeleteCode() {
    return api.post('/account/delete/send-code');
  },

  // Confirm delete account
  async confirmDeleteAccount(code) {
    return api.post('/account/delete/confirm', { code });
  },

  // Delete account
  async deleteAccount() {
    return api.delete('/account');
  },
};

// Debug API utility
export const debugAPI = {
  // Test CORS
  async testCors() {
    return api.get('/cors-test');
  },

  // Test simple endpoint
  async testSimple() {
    return api.get('/simple-test');
  },

  // Test health
  async testHealth() {
    return api.get('/health');
  },
};
