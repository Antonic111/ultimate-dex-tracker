import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, User, Settings, Users, Database } from "lucide-react";
import { authAPI } from './utils/api';
import { useTheme } from "./components/Shared/ThemeContext";

export default function HeaderWithConditionalAuth({ user, setUser, showMenu, setShowMenu, userMenuRef }) {
  const navigate = useNavigate();
  const location = useLocation();

   // Close the menu after login/logout or on any navigation
  useEffect(() => { setShowMenu(false); }, [user?.username, location.pathname]);
  
  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!showMenu) return;
      
      // Check if click is outside the user menu wrapper
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenu]);

  const { theme, accent } = useTheme(); // has "dark"/"light" + your accent color
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "Yellow");

  // Build primary + fallback logo paths (place files in /public)
  const base = `/Logo${cap(accent)}`;
  const primary = `${base}${theme === "light" ? "Light" : ""}.png`; // e.g. /LogoYellowLight.png

  const [logoSrc, setLogoSrc] = useState(primary);
  useEffect(() => setLogoSrc(primary), [primary]);

  const handleLogoError = () => {
    // 1) try non-Light version, 2) fall back to /Logo.png
    if (logoSrc !== `${base}.png`) setLogoSrc(`${base}.png`);
    else if (logoSrc !== "/Logo.png") setLogoSrc("/Logo.png");
  };

  const handleOpenMenu = () => {
    setShowMenu(true);
  };

  const handleCloseMenu = () => {
    setShowMenu(false);
  };


  return (

    <header className="site-header">
      <div className="site-header-content">
        <Link to="/" className="site-logo" aria-label="PokéTracker">
          <img src={logoSrc} onError={handleLogoError} alt="" className="Logo-img" />
        </Link>

        <nav className="main-nav">
          {/* Only show Trainers button when not on auth flow pages, but allow on public home page */}
          {!['/login', '/register', '/email-sent', '/forgot-password', '/enter-reset-code', '/reset-password'].includes(location.pathname) && (
            <Link 
              to="/trainers" 
              className={`nav-link ${location.pathname === '/trainers' ? 'active' : ''}`}
            >
              <Users size={16} />
              <span>Trainers</span>
            </Link>
          )}
        </nav>


        {user?.username && (
          <nav style={{ marginLeft: "auto" }}>
            <div className="user-menu-wrapper" ref={userMenuRef}>
                             <div className="user-display" onClick={() => {
                 if (showMenu) {
                   handleCloseMenu();
                 } else {
                   handleOpenMenu();
                 }
               }}>
                <div className="user-text">
                  <div className="hello-line">Hello!</div>
                  <div className="name-line">{user.username}</div>
                </div>
                <img
                  src={user.profileTrainer ? `/data/trainer_sprites/${user.profileTrainer}` : "/avatar.png"}
                  alt="Profile"
                  className="profile-icon"
                />
              </div>

                                                                          {showMenu && (
                 <div className="user-dropdown">
                  <Link to="/profile" className="dropdown-item" onClick={handleCloseMenu}>
                    <User size={16} className="dropdown-icon" />
                    Profile
                  </Link>
                  <Link to="/settings" className="dropdown-item" onClick={handleCloseMenu}>
                    <Settings size={16} className="dropdown-icon" />
                    Settings
                  </Link>
                  <Link to="/backup" className="dropdown-item" onClick={handleCloseMenu}>
                    <Database size={16} className="dropdown-icon" />
                    Backup
                  </Link>
                  <button
                    className="dropdown-item"
                    onClick={async () => {
                      try {
                        await authAPI.logout();
                        setUser({
                          username: null,
                          email: null,
                          createdAt: null,
                          profileTrainer: null,
                          verified: false,
                          progressBars: [],
                        });
                        navigate("/login", { replace: true });
                      } catch (e) {
                        // removed console.warn to reduce console noise
                      }
                    }}
                  >
                    <LogOut size={16} className="dropdown-icon" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
