import { buildApiUrl } from '../config/api.js';

// Simple debug utility to test API connectivity
export const testAPI = async () => {
  // removed console logs
  
  try {
    // Test basic CORS
    const corsResponse = await fetch(buildApiUrl('/cors-test'), {
      method: 'GET',
      credentials: 'include'
    });
    
    // Test health endpoint
    const healthResponse = await fetch(buildApiUrl('/health'), {
      method: 'GET',
      credentials: 'include'
    });
    
    return { success: true, cors: corsResponse.status, health: healthResponse.status };
  } catch (error) {
    console.error('❌ API test failed:', error);
    return { success: false, error: error.message };
  }
};

// Test specific endpoints
export const testEndpoint = async (endpoint, method = 'GET', data = null) => {
  const url = buildApiUrl(endpoint);
  
  try {
    const response = await fetch(url, {
      method,
      credentials: 'include',
      headers: data ? { 'Content-Type': 'application/json' } : {},
      body: data ? JSON.stringify(data) : undefined
    });
    
    if (response.ok) {
      const result = await response.json();
      return { success: true, data: result };
    } else {
      const errorText = await response.text();
      return { success: false, status: response.status, error: errorText };
    }
  } catch (error) {
    console.error(`❌ ${method} ${endpoint} failed:`, error);
    return { success: false, error: error.message };
  }
};

// Main debug API object that Header.jsx expects
export const debugAPI = {
  async runAllTests() {
    
    
    try {
      // Test basic API connectivity
      const apiTest = await testAPI();
      
      
      // Test auth endpoints (use actual existing endpoints)
      const authTest = await testEndpoint('/auth/check-verified?email=test@example.com');
      
      
      // Test health endpoint (this exists)
      const healthTest = await testEndpoint('/health');
      
      
      return {
        success: true,
        tests: {
          api: apiTest,
          auth: authTest,
          health: healthTest
        }
      };
    } catch (error) {
      console.error('❌ Debug tests failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};
