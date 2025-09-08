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
              title="YouTube"
            >
              <svg 
                viewBox="0 -3 20 20" 
                version="1.1" 
                xmlns="http://www.w3.org/2000/svg" 
                xmlnsXlink="http://www.w3.org/1999/xlink" 
                width="20" 
                height="20"
                className="youtube-icon"
              >
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                <g id="SVGRepo_iconCarrier"> 
                  <title>youtube [#168]</title>
                  <desc>Created with Sketch.</desc>
                  <defs> </defs>
                  <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd"> 
                    <g id="Dribbble-Light-Preview" transform="translate(-300.000000, -7442.000000)" fill="currentColor"> 
                      <g id="icons" transform="translate(56.000000, 160.000000)"> 
                        <path d="M251.988432,7291.58588 L251.988432,7285.97425 C253.980638,7286.91168 255.523602,7287.8172 257.348463,7288.79353 C255.843351,7289.62824 253.980638,7290.56468 251.988432,7291.58588 M263.090998,7283.18289 C262.747343,7282.73013 262.161634,7282.37809 261.538073,7282.26141 C259.705243,7281.91336 248.270974,7281.91237 246.439141,7282.26141 C245.939097,7282.35515 245.493839,7282.58153 245.111335,7282.93357 C243.49964,7284.42947 244.004664,7292.45151 244.393145,7293.75096 C244.556505,7294.31342 244.767679,7294.71931 245.033639,7294.98558 C245.376298,7295.33761 245.845463,7295.57995 246.384355,7295.68865 C247.893451,7296.0008 255.668037,7296.17532 261.506198,7295.73552 C262.044094,7295.64178 262.520231,7295.39147 262.895762,7295.02447 C264.385932,7293.53455 264.28433,7285.06174 263.090998,7283.18289" id="youtube-[#168]"> </path> 
                      </g> 
                    </g> 
                  </g> 
                </g>
              </svg>
            </a>
            <a 
              href="https://www.twitch.tv/antonic111" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link twitch-link"
              title="Twitch"
            >
              <svg 
                fill="currentColor" 
                viewBox="0 0 24 24" 
                role="img" 
                xmlns="http://www.w3.org/2000/svg"
                width="20" 
                height="20"
                className="twitch-icon"
              >
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  <title>Twitch icon</title>
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"></path>
                </g>
              </svg>
            </a>
            <a 
              href="https://discord.com/invite/YE9uCuQcrW" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link discord-link"
              title="Discord"
            >
              <svg 
                viewBox="0 -28.5 256 256" 
                version="1.1" 
                xmlns="http://www.w3.org/2000/svg" 
                xmlnsXlink="http://www.w3.org/1999/xlink" 
                preserveAspectRatio="xMidYMid" 
                width="20" 
                height="20"
                className="discord-icon"
              >
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                <g id="SVGRepo_iconCarrier"> 
                  <g> 
                    <path d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z" fill="currentColor" fillRule="nonzero"> </path> 
                  </g> 
                </g>
              </svg>
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h3>Credits</h3>
          <ul>
            <li>
              Built with{' '}
              <a 
                href="https://react.dev/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="credit-link"
              >
                React
              </a>
            </li>
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
            <li>
              Icons by{' '}
              <a 
                href="https://lucide.dev/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="credit-link"
              >
                Lucide React
              </a>
            </li>
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
