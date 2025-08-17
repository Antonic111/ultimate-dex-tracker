// Simple debug utility to test API connectivity
export const testAPI = async () => {
  console.log('🧪 Testing API connectivity...');
  
  try {
    // Test basic CORS
    const corsResponse = await fetch('https://ultimate-dex-tracker-backend.onrender.com/api/cors-test', {
      method: 'GET',
      credentials: 'include'
    });
    console.log('✅ CORS test:', corsResponse.status, corsResponse.statusText);
    
    // Test health endpoint
    const healthResponse = await fetch('https://ultimate-dex-tracker-backend.onrender.com/api/health', {
      method: 'GET',
      credentials: 'include'
    });
    console.log('✅ Health test:', healthResponse.status, healthResponse.statusText);
    
    return { success: true, cors: corsResponse.status, health: healthResponse.status };
  } catch (error) {
    console.error('❌ API test failed:', error);
    return { success: false, error: error.message };
  }
};

// Test specific endpoints
export const testEndpoint = async (endpoint, method = 'GET', data = null) => {
  const url = `https://ultimate-dex-tracker-backend.onrender.com/api${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method,
      credentials: 'include',
      headers: data ? { 'Content-Type': 'application/json' } : {},
      body: data ? JSON.stringify(data) : undefined
    });
    
    console.log(`🧪 ${method} ${endpoint}:`, response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Response:', result);
      return { success: true, data: result };
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      return { success: false, status: response.status, error: errorText };
    }
  } catch (error) {
    console.error(`❌ ${method} ${endpoint} failed:`, error);
    return { success: false, error: error.message };
  }
};
