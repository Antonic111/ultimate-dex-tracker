import { Link } from "react-router-dom";
import "../css/PublicHome.css";

export default function PublicHome() {
  return (
    <div className="public-home page-container scale-in">
      <div className="public-home-content">
        <h1>Welcome to Ultimate Dex Tracker!</h1>
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
    </div>
  );
}
