import { buildApiUrl } from '../config/api.js';

// Mobile and iOS detection utilities
const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

// Mobile retry utility with iOS-specific handling
const mobileRetry = async (fn, maxRetries = 2) => {
  const isIOSDevice = isIOS();
  const retries = isIOSDevice ? 3 : maxRetries; // More retries for iOS

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;

      // iOS-specific: Longer wait times and different backoff strategy
      const waitTime = isIOSDevice
        ? Math.pow(2, i) * 1500 + Math.random() * 1000 // 1.5s base + jitter for iOS
        : Math.pow(2, i) * 1000; // 1s base for other mobile

      await new Promise(resolve => setTimeout(resolve, waitTime));

      if (isIOSDevice) {
        console.log(`🍎 iOS API Retry ${i + 1}/${retries} after ${waitTime}ms`);
      }
    }
  }
};

// Centralized API utility for making authenticated requests
export const api = {
  // GET request
  async get(endpoint, options = {}) {
    const url = buildApiUrl(endpoint);

    const fetchRequest = async () => {
      // Get token from localStorage for all users
      const token = localStorage.getItem('authToken');
      const headers = {
        ...options.headers,
      };

      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers,
        ...options,
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          const error = new Error(`API Error: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
          error.status = response.status;
          error.data = errorData;
          error.userMessage = errorData?.error || 'An error occurred';
          throw error;
        } else {
          const errorText = await response.text();
          const error = new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
          error.status = response.status;
          error.data = { error: errorText };
          error.userMessage = errorText || 'An error occurred';
          throw error;
        }
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data;
      }

      return { message: 'Success' };
    };

    // Use mobile retry for mobile devices
    if (isMobile()) {
      return mobileRetry(fetchRequest);
    }

    return fetchRequest();
  },

  // POST request
  async post(endpoint, data = null, options = {}) {
    const url = buildApiUrl(endpoint);

    const fetchRequest = async () => {
      // Get token from localStorage for iPhone users
      const token = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // Add Authorization header if token exists (for iPhone users)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          const error = new Error(`API Error: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
          error.status = response.status;
          error.data = errorData;
          error.userMessage = errorData?.error || 'An error occurred';
          throw error;
        } else {
          const errorText = await response.text();
          const error = new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
          error.status = response.status;
          error.data = { error: errorText };
          error.userMessage = errorText || 'An error occurred';
          throw error;
        }
      }

      // Handle responses that might not have JSON content
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        return result;
      }

      return { message: 'Success' };
    };

    // Use mobile retry for mobile devices
    if (isMobile()) {
      return mobileRetry(fetchRequest);
    }

    return fetchRequest();
  },

  // PUT request
  async put(endpoint, data = null, options = {}) {
    const url = buildApiUrl(endpoint);

    const fetchRequest = async () => {
      // Get token from localStorage for all users
      const token = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          const error = new Error(`API Error: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
          error.status = response.status;
          error.data = errorData;
          error.userMessage = errorData?.error || 'An error occurred';
          throw error;
        } else {
          const errorText = await response.text();
          const error = new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
          error.status = response.status;
          error.data = { error: errorText };
          error.userMessage = errorText || 'An error occurred';
          throw error;
        }
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        return result;
      }

      return { message: 'Success' };
    };

    // Use mobile retry for mobile devices
    if (isMobile()) {
      return mobileRetry(fetchRequest);
    }

    return fetchRequest();
  },

  // DELETE request
  async delete(endpoint, options = {}) {
    const url = buildApiUrl(endpoint);

    const fetchRequest = async () => {
      // Get token from localStorage for all users
      const token = localStorage.getItem('authToken');
      const headers = {
        ...options.headers,
      };

      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
        headers,
        ...options,
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          const error = new Error(`API Error: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
          error.status = response.status;
          error.data = errorData;
          error.userMessage = errorData?.error || 'An error occurred';
          throw error;
        } else {
          const errorText = await response.text();
          const error = new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
          error.status = response.status;
          error.data = { error: errorText };
          error.userMessage = errorText || 'An error occurred';
          throw error;
        }
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }

      return { message: 'Success' };
    };

    // Use mobile retry for mobile devices
    if (isMobile()) {
      return mobileRetry(fetchRequest);
    }

    return fetchRequest();
  },
};

// Specific API functions for common operations
export const authAPI = {
  // Check current user
  async getCurrentUser() {
    return api.get('/me');
  },

  // Update user data
  async updateUser(userData) {
    return api.put('/profile', userData);
  },

  // Login
  async login(credentials) {
    const response = await api.post('/login', credentials);

    // Store token in localStorage for all users (needed for Authorization header)
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }

    return response;
  },

  // Register
  async register(userData) {
    return api.post('/register', userData);
  },

  // Logout
  async logout() {
    const response = await api.post('/logout');

    // Clear token from localStorage for all users
    localStorage.removeItem('authToken');

    // Clear backup user data to prevent "half logged in" state on mobile
    localStorage.removeItem('mobileUserBackup');
    sessionStorage.removeItem('iosUserBackup');

    return response;
  },

  // Verify email code
  async verifyCode(email, code) {
    const response = await api.post('/verify-code', { email, code });
    if (response?.token) {
      localStorage.setItem('authToken', response.token);
    }
    return response;
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

  // Update entire caught map (bulk)
  async updateCaughtData(caughtMap) {
    return api.post('/caught', { caughtMap });
  },

  // Atomically update a single entry
  async updateCaughtEntry(key, info) {
    return api.put(`/caught/${encodeURIComponent(key)}`, { info });
  },

  // Apply partial/delta updates: { key: info|null }
  async patchCaughtData(changes) {
    return api.put('/caught', changes, { method: 'PATCH' });
  },
};

export const progressAPI = {
  // Get progress bars
  async getProgressBars() {
    return api.get('/progressBars');
  },

  // Update progress bars
  async updateProgressBars(progressBars) {
    return api.put('/progressBars', progressBars);
  },
};

export const huntAPI = {
  // Get hunt data
  async getHuntData() {
    return api.get('/hunts');
  },

  // Update hunt data
  async updateHuntData(huntData) {
    return api.put('/hunts', huntData);
  },
};

export const bingoAPI = {
  // Get bingo data
  async getBingo() {
    return api.get('/bingo');
  },

  // Update bingo data
  async updateBingo(bingoData) {
    return api.put('/bingo', { bingoData });
  },

  // Get public bingo data
  async getPublicBingo(username) {
    return api.get(`/public/bingo/${encodeURIComponent(username)}`);
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

  // Update dex preferences
  async updateDexPreferences(dexPreferences) {
    return api.put('/profile', { dexPreferences });
  },

  // Get public users for trainers page
  async getPublicUsers(query = '', page = 1, pageSize = 24, random = false) {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (page) params.append('page', page.toString());
    if (pageSize) params.append('pageSize', pageSize.toString());
    if (random) params.append('random', '1');

    const queryString = params.toString();
    const endpoint = queryString ? `/users/public?${queryString}` : '/users/public';
    return api.get(endpoint);
  },

  // Get public profile by username
  async getPublicProfile(username) {
    return api.get(`/users/${username}/public`);
  },

  // Get profile likes
  async getProfileLikes(username) {
    return api.get(`/profiles/${encodeURIComponent(username)}/likes`);
  },

  // Get public profile likes (no authentication required)
  async getPublicProfileLikes(username) {
    return api.get(`/profiles/${encodeURIComponent(username)}/likes/public`);
  },

  // Get public caught data for a username
  async getPublicCaughtData(username) {
    return api.get(`/public/dex/${encodeURIComponent(username)}`);
  },

  // Toggle profile like
  async toggleProfileLike(username) {
    return api.post(`/profiles/${encodeURIComponent(username)}/like`);
  },
};

export const userAPI = {
  // Check username availability
  async checkUsernameAvailability(username) {
    return api.get(`/check-username?username=${encodeURIComponent(username)}`);
  },

  // Check username change cooldown
  async checkUsernameCooldown() {
    return api.get('/username-cooldown');
  },

  // Update username
  async updateUsername(newUsername) {
    return api.put('/update-username', { newUsername });
  },

  // Change email
  async changeEmail(newEmail, currentPassword) {
    return api.put('/change-email', { newEmail, currentPassword });
  },

  // Send verification code to current email
  async sendCurrentEmailVerificationCode() {
    return api.post('/send-current-email-verification-code');
  },

  // Verify current email code
  async verifyCurrentEmailCode(code) {
    return api.post('/verify-current-email-code', { code });
  },

  // Send verification code to new email
  async sendNewEmailVerificationCode() {
    return api.post('/send-new-email-verification-code');
  },

  // Verify new email code
  async verifyNewEmailCode(code) {
    return api.post('/verify-new-email-code', { code });
  },

  // Change password
  async changePassword(currentPassword, newPassword, confirmPassword) {
    return api.put('/change-password', { currentPassword, newPassword, confirmPassword });
  },

  // Send password verification code
  async sendPasswordVerificationCode() {
    return api.post('/send-password-verification-code');
  },

  // Verify password code
  async verifyPasswordCode(code) {
    return api.post('/verify-password-code', { code });
  },

  // Send delete account code
  async sendDeleteCode() {
    return api.post('/account/delete/send');
  },

  // Confirm delete account
  async confirmDeleteAccount(code, username) {
    return api.post('/account/delete/confirm', { code, confirm: username });
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
