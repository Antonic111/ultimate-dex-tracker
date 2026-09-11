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

// Automatic suspension detection and session cleanup for the logged-in user
const handleSuspensionResponse = (errorData) => {
  if (
    typeof window !== 'undefined' &&
    (errorData?.error === 'ACCOUNT_SUSPENDED' || errorData?.code === 'ACCOUNT_SUSPENDED') &&
    errorData?.code !== 'TARGET_USER_SUSPENDED' &&
    errorData?.error !== 'TARGET_USER_SUSPENDED'
  ) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('mobileUserBackup');
    localStorage.removeItem('bingo-grid-state-v1');
    sessionStorage.removeItem('iosUserBackup');
    window.dispatchEvent(new CustomEvent('account-suspended', { detail: errorData }));
  }
};

// Format detailed error messages from API response
const extractErrorMessage = (errorData) => {
  let baseMsg = errorData?.error || errorData?.message || 'An error occurred';
  if (errorData?.details) {
    if (typeof errorData.details === 'object') {
      const details = Object.entries(errorData.details)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      if (details) {
        return `${baseMsg} (${details})`;
      }
    } else if (typeof errorData.details === 'string') {
      return `${baseMsg} (${errorData.details})`;
    }
  }
  return baseMsg;
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
          handleSuspensionResponse(errorData);
          const userMessage = extractErrorMessage(errorData);
          const error = new Error(`API Error: ${response.status} ${response.statusText} - ${userMessage}`);
          error.status = response.status;
          error.data = errorData;
          error.userMessage = userMessage;
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
          handleSuspensionResponse(errorData);
          const userMessage = extractErrorMessage(errorData);
          const error = new Error(`API Error: ${response.status} ${response.statusText} - ${userMessage}`);
          error.status = response.status;
          error.data = errorData;
          error.userMessage = userMessage;
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
          handleSuspensionResponse(errorData);
          const userMessage = extractErrorMessage(errorData);
          const error = new Error(`API Error: ${response.status} ${response.statusText} - ${userMessage}`);
          error.status = response.status;
          error.data = errorData;
          error.userMessage = userMessage;
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

  // PATCH request
  async patch(endpoint, data = null, options = {}) {
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
        method: 'PATCH',
        credentials: 'include',
        headers,
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          handleSuspensionResponse(errorData);
          const userMessage = extractErrorMessage(errorData);
          const error = new Error(`API Error: ${response.status} ${response.statusText} - ${userMessage}`);
          error.status = response.status;
          error.data = errorData;
          error.userMessage = userMessage;
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
          handleSuspensionResponse(errorData);
          const userMessage = extractErrorMessage(errorData);
          const error = new Error(`API Error: ${response.status} ${response.statusText} - ${userMessage}`);
          error.status = response.status;
          error.data = errorData;
          error.userMessage = userMessage;
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
    localStorage.removeItem('bingo-grid-state-v1');
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
  async updateCaughtEntry(key, info, newCatchTrigger = null, removeCatchTrigger = null) {
    const payload = { info };
    if (newCatchTrigger) {
      payload.newCatchTrigger = newCatchTrigger;
    }
    if (removeCatchTrigger) {
      payload.removeCatchTrigger = removeCatchTrigger;
    }
    return api.put(`/caught/${encodeURIComponent(key)}`, payload);
  },

  // Apply partial/delta updates: { key: info|null }
  async patchCaughtData(changes) {
    return api.put('/caught', changes, { method: 'PATCH' });
  },
};

export const achievementsAPI = {
  // Get global achievement badge rarities across eligible users
  async getRarity(forceRefresh = false) {
    const query = forceRefresh ? '?refresh=true' : '';
    return api.get(`/achievements/rarity${query}`);
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

export const streamerOverlayAPI = {
  // Get overlay configuration
  async getOverlayConfig() {
    return api.get('/streamer-tools/overlay');
  },

  // Update overlay configuration
  async updateOverlayConfig(config) {
    return api.put('/streamer-tools/overlay', config);
  },

  // Regenerate overlay token
  async regenerateToken() {
    return api.post('/streamer-tools/overlay/regenerate-token');
  },

  // Public endpoint for OBS browser source
  async getPublicOverlayData(token) {
    return api.get(`/overlay/public/${encodeURIComponent(token)}`);
  },
};

export const bingoAPI = {
  // Get bingo data
  async getBingo(year) {
    return api.get(year ? `/bingo?year=${encodeURIComponent(year)}` : '/bingo');
  },

  // Update bingo data
  async updateBingo(bingoData, bingoQuote, year) {
    return api.put('/bingo', { bingoData, bingoQuote, year });
  },

  // Get public bingo data
  async getPublicBingo(username, year) {
    return api.get(`/public/bingo/${encodeURIComponent(username)}${year ? `?year=${encodeURIComponent(year)}` : ''}`);
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

  // Upload custom profile avatar with Sightengine moderation
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    const url = buildApiUrl('/users/avatar');
    const token = localStorage.getItem('authToken');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        const error = new Error(errorData.error || 'Failed to upload avatar');
        error.userMessage = errorData.error || 'Failed to upload avatar';
        throw error;
      }
      const errorText = await response.text();
      const error = new Error(errorText || 'Failed to upload avatar');
      error.userMessage = errorText || 'Failed to upload avatar';
      throw error;
    }

    return response.json();
  },

  // Remove custom avatar
  async removeAvatar() {
    return api.delete('/users/avatar');
  },

  // Update dex preferences
  async updateDexPreferences(dexPreferences) {
    return api.put('/profile', { dexPreferences });
  },

  // Get public users for trainers or leaderboard page
  async getPublicUsers(query = '', page = 1, pageSize = 24, random = false, scope = '') {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (page) params.append('page', page.toString());
    if (pageSize) params.append('pageSize', pageSize.toString());
    if (random) params.append('random', '1');
    if (scope) params.append('scope', scope);

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

  // Send reset collection code
  async sendResetCollectionCode() {
    return api.post('/account/reset-collection/send');
  },

  // Confirm reset collection
  async confirmResetCollection(code, username) {
    return api.post('/account/reset-collection/confirm', { code, confirm: username });
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

// ─── Content Creator API ───────────────────────────────────────────────────────
export const creatorAPI = {
  // Submit a new creator request
  async submitRequest(data) {
    return api.post('/creator-request', data);
  },
  // Get the current user's request status
  async getStatus() {
    return api.get('/creator-request/status');
  },
  // Admin: get all creator requests
  async getAll(status = 'pending') {
    return api.get(`/admin/creator-requests?status=${status}`);
  },
  // Admin: approve or reject a request
  async updateRequest(id, data) {
    return api.patch(`/admin/creator-requests/${id}`, data);
  },
};

// ─── OAuth API ─────────────────────────────────────────────────────────────────
export const oauthAPI = {
  // Get all linked OAuth providers for the logged-in user
  async getProviders() {
    return api.get('/oauth/providers');
  },

  // Unlink a specific OAuth provider ('google' | 'discord')
  async unlinkProvider(provider) {
    return api.delete(`/oauth/unlink/${encodeURIComponent(provider)}`);
  },

  // Complete profile setup for new OAuth users (username and optional password)
  async completeOAuthSetup(data) {
    return api.post('/complete-oauth-setup', data);
  },
};

// ─── Notifications & Announcements API ───────────────────────────────────────
export const notificationsAPI = {
  // Get notifications for current user
  async getNotifications() {
    return api.get('/notifications');
  },

  // Mark single notification as read/unread
  async markAsRead(id, read = true) {
    return api.patch(`/notifications/${encodeURIComponent(id)}/read`, { read });
  },

  // Mark all notifications as read
  async markAllAsRead() {
    return api.post('/notifications/read-all');
  },

  // Delete/hide single notification for user
  async deleteNotification(id) {
    return api.delete(`/notifications/${encodeURIComponent(id)}`);
  },

  // Delete/hide all notifications for user
  async deleteAllNotifications() {
    return api.post('/notifications/delete-all');
  },

  // Admin: Broadcast a new announcement
  async sendAnnouncement(data) {
    return api.post('/notifications/announcement', data);
  },
  async postAdminAnnouncement(data) {
    return api.post('/notifications/announcement', data);
  },

  // Admin: Permanently delete an announcement
  async deleteAnnouncementAdmin(id) {
    return api.delete(`/notifications/admin/${encodeURIComponent(id)}`);
  },
  async adminDeleteNotification(id) {
    return api.delete(`/notifications/admin/${encodeURIComponent(id)}`);
  }
};

export const changelogAPI = {
  // Public: Get published changelog entries
  async getPublic() {
    return api.get('/changelog');
  },

  // Admin: Get all changelog releases (including drafts)
  async getAdminAll() {
    return api.get('/admin/changelog');
  },

  // Admin: Create a new release
  async create(data) {
    return api.post('/admin/changelog', data);
  },

  // Admin: Update release
  async update(id, data) {
    return api.put(`/admin/changelog/${encodeURIComponent(id)}`, data);
  },

  // Admin: Delete release
  async delete(id) {
    return api.delete(`/admin/changelog/${encodeURIComponent(id)}`);
  },

  // Admin: Toggle publish status
  async togglePublish(id) {
    return api.patch(`/admin/changelog/${encodeURIComponent(id)}/publish`);
  },

  // Admin: Duplicate previous release into a fresh draft
  async duplicate(id) {
    return api.post(`/admin/changelog/duplicate/${encodeURIComponent(id)}`);
  },

  // Admin: Quick add bullet entry to active draft
  async quickEntry(data) {
    return api.post('/admin/changelog/quick-entry', data);
  }
};

