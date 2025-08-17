// Debug utility for troubleshooting API issues
export const debugAPI = {
  // Test basic connectivity
  async testConnection() {
    try {
      const response = await fetch('https://ultimate-dex-tracker-backend.onrender.com/api/health');
      const data = await response.json();
      console.log('✅ Backend connection test:', data);
      return true;
    } catch (error) {
      console.error('❌ Backend connection test failed:', error);
      return false;
    }
  },

  // Test authentication
  async testAuth() {
    try {
      const response = await fetch('https://ultimate-dex-tracker-backend.onrender.com/api/me', {
        credentials: 'include'
      });
      console.log('🔐 Auth test status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Auth test successful:', data);
        return true;
      } else {
        console.log('❌ Auth test failed:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Auth test error:', error);
      return false;
    }
  },

  // Test caught data API
  async testCaughtAPI() {
    try {
      const response = await fetch('https://ultimate-dex-tracker-backend.onrender.com/api/caught', {
        credentials: 'include'
      });
      console.log('🎯 Caught API test status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Caught API test successful:', data);
        return true;
      } else {
        console.log('❌ Caught API test failed:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Caught API test error:', error);
      return false;
    }
  },

  // Test progress bars API
  async testProgressAPI() {
    try {
      const response = await fetch('https://ultimate-dex-tracker-backend.onrender.com/api/progressBars', {
        credentials: 'include'
      });
      console.log('📊 Progress API test status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Progress API test successful:', data);
        return true;
      } else {
        console.log('❌ Progress API test failed:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Progress API test error:', error);
      return false;
    }
  },

  // Run all tests
  async runAllTests() {
    console.log('🧪 Running API tests...');
    
    const connectionTest = await this.testConnection();
    const authTest = await this.testAuth();
    const caughtTest = await this.testCaughtAPI();
    const progressTest = await this.testProgressAPI();
    
    console.log('📋 Test Results:');
    console.log('  Connection:', connectionTest ? '✅' : '❌');
    console.log('  Auth:', authTest ? '✅' : '❌');
    console.log('  Caught API:', caughtTest ? '✅' : '❌');
    console.log('  Progress API:', progressTest ? '✅' : '❌');
    
    return {
      connection: connectionTest,
      auth: authTest,
      caught: caughtTest,
      progress: progressTest
    };
  }
};
