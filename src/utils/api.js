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
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
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
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
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
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
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
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
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

export const profileAPI = {
  // Get profile
  async getProfile() {
    return api.get('/profile');
  },

  // Update profile
  async updateProfile(profileData) {
    return api.put('/profile', profileData);
  },

  // Get public profile
  async getPublicProfile(username) {
    return api.get(`/users/${encodeURIComponent(username)}/public`);
  },

  // Like profile
  async likeProfile(username) {
    return api.post(`/profiles/${encodeURIComponent(username)}/like`);
  },

  // Get profile likes
  async getProfileLikes(username) {
    return api.get(`/profiles/${encodeURIComponent(username)}/likes`);
  },
};

export const caughtAPI = {
  // Get caught data
  async getCaughtData() {
    return api.get('/caught');
  },

  // Update caught data
  async updateCaughtData(key, infoMap) {
    const body = { caughtMap: key ? { [key]: infoMap } : infoMap };
    return api.post('/caught', body);
  },

  // Get public caught data
  async getPublicCaughtData(username) {
    return api.get(`/caught/${encodeURIComponent(username)}/public`);
  },
};

export const progressAPI = {
  // Get progress bars
  async getProgressBars() {
    return api.get('/progressBars');
  },

  // Update progress bars
  async updateProgressBars(progressData) {
    return api.put('/progressBars', progressData);
  },
};
