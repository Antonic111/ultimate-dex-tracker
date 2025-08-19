import React from 'react';
import { Link } from 'react-router-dom';
import { Youtube, Twitch } from 'lucide-react';
import '../../css/Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/profile">Profile</Link></li>
            <li><Link to="/trainers">Trainers</Link></li>
            <li><Link to="/settings">Settings</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>About</h3>
          <p>Track your Pokémon collection with Antonic's living dex tracker and stay organized through your hunting adventures.</p>
          <div className="social-links">
            <a 
              href="https://www.youtube.com/Antonic111" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link youtube-link"
            >
              <Youtube size={16} />
              YouTube
            </a>
            <a 
              href="https://www.twitch.tv/antonic111" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link twitch-link"
            >
              <Twitch size={16} />
              Twitch
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h3>Credits</h3>
          <ul>
            <li>Built with React</li>
            <li>
              Pokémon data and sprites from{' '}
              <a 
                href="https://pokeapi.co/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="credit-link"
              >
                PokéAPI
              </a>
            </li>
            <li>Icons by Lucide React</li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Legal</h3>
          <ul>
            <li>© {currentYear} Ultimate Dex Tracker</li>
            <li>Not affiliated with Nintendo/Game Freak/The Pokémon Company</li>
            <li>Pokémon is a trademark of Nintendo</li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>
          <img
            src="/data/balls/cherish-ball.png"
            alt="Cherish Ball"
            className="inline-ball"
          />
          {" "}every entry,{' '}
          <img
            src="/data/balls/repeat-ball.png"
            alt="Repeat Ball"
            className="inline-ball"
          />
          {" "}the pursuit,{' '}
          <img
            src="/data/balls/master-ball.png"
            alt="Master Ball"
            className="inline-ball"
          />
          {" "}the dex,{' '}
          <img
            src="/data/balls/love-ball.png"
            alt="Love Ball"
            className="inline-ball"
          />
          {" "}the grind.
        </p>
      </div>
    </footer>
  );
}
