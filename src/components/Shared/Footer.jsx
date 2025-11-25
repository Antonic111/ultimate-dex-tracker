import React from 'react';
import { Link } from 'react-router-dom';
import { Youtube, Twitch, Home, User, Users, Settings } from 'lucide-react';
import '../../css/Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Quick Links</h3>
          <div className="quick-links-grid">
            <Link to="/" className="quick-link">
              <Home size={16} />
              <span>Home</span>
            </Link>
            <Link to="/profile" className="quick-link">
              <User size={16} />
              <span>Profile</span>
            </Link>
            <Link to="/trainers" className="quick-link">
              <Users size={16} />
              <span>Trainers</span>
            </Link>
            <Link to="/settings" className="quick-link">
              <Settings size={16} />
              <span>Settings</span>
            </Link>
          </div>
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
              href="https://www.instagram.com/yt_antonic" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link instagram-link"
              title="Instagram"
            >
              <svg 
                role="img" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
                width="20" 
                height="20"
                className="instagram-icon"
                fill="currentColor"
              >
                <title>Instagram</title>
                <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/>
              </svg>
            </a>
            <a 
              href="https://www.tiktok.com/@yt_antonic" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link tiktok-link"
              title="TikTok"
            >
              <svg 
                role="img" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
                width="20" 
                height="20"
                className="tiktok-icon"
                fill="currentColor"
              >
                <title>TikTok</title>
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
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
