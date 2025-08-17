import { Link } from "react-router-dom";
import "../css/PublicHome.css"; // optional: create a matching CSS file for styling
import { useState } from "react";
import { authAPI } from "../utils/api.js";
import { debugAPI } from "../utils/debug.js";

export default function PublicHome() {
  const [debugInfo, setDebugInfo] = useState(null);
  const [testing, setTesting] = useState(false);

  const testAPI = async () => {
    setTesting(true);
    try {
      const result = await debugAPI.runAllTests();
      setDebugInfo(result);
      console.log('Debug test result:', result);
    } catch (error) {
      setDebugInfo({ success: false, error: error.message });
      console.error('Debug test failed:', error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="public-home">
      <div className="public-home-content">
        <h1>Welcome to PokéTracker!</h1>
        <p>Track your shiny Pokémon collection across all games with ease.</p>
        <div className="public-home-buttons">
          <Link to="/login" className="home-login-btn">Login</Link>
          <Link to="/register" className="home-signup-btn">Sign Up</Link>
        </div>
        <div className="preview-section">
          <h2>What you can do:</h2>
          <ul>
            <li>✔️ Track caught Pokémon with detailed info</li>
            <li>✔️ Visualize your shiny living dex</li>
            <li>✔️ Manage your progress with custom filters</li>
            <li>✔️ View stats and personalize your profile</li>
          </ul>
        </div>
      </div>

      {/* Debug Section */}
      <div className="debug-section" style={{ margin: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>🔧 Debug API Connection</h3>
        <p>Test if the frontend can connect to the backend API</p>
        <button
          onClick={testAPI}
          disabled={testing}
          style={{
            padding: '10px 20px',
            backgroundColor: testing ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: testing ? 'not-allowed' : 'pointer'
          }}
        >
          {testing ? 'Testing...' : 'Test API Connection'}
        </button>

        {debugInfo && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: debugInfo.success ? '#d4edda' : '#f8d7da', borderRadius: '4px' }}>
            <h4>Test Results:</h4>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
