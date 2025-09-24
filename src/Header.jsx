import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, User, Settings, Users, Database, Tally5 } from "lucide-react";
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


  // Don't render header on public home page (only when user is not logged in)
  if (location.pathname === '/' && !user?.username) {
    return null;
  }

  return (

    <header className="bg-[var(--header)] transition-[background-color] duration-[var(--transition-speed)] border-b-8" style={{ borderColor: 'var(--accent)' }}>
      <div className="w-full md:w-[1300px] h-[60px] md:h-[130px] max-h-[60px] md:max-h-[130px] mx-auto flex items-center justify-between px-3 md:px-3 md:pr-2">
        <Link 
          to="/" 
          className="flex items-center text-decoration-none hover:text-[var(--accent)] focus:text-[var(--accent)] active:text-[var(--accent)] hover:outline-none focus:outline-none" 
          aria-label="Ultimate Dex Tracker"
          onClick={() => {
            // Dispatch event to refresh dex preferences
            window.dispatchEvent(new CustomEvent('refreshDexPreferences'));
          }}
        >
                     <img src={logoSrc} onError={handleLogoError} alt="" className="h-[50px] md:h-[110px] w-auto max-w-[340px] md:max-w-[450px] lg:max-w-[550px]" />
        </Link>

        <nav className="flex items-end gap-1 md:gap-3 w-full max-w-full md:max-w-none self-end ml-4 md:ml-8 mr-4 md:mr-8">
          {/* Only show Trainers button when not on auth flow pages, but allow on public home page */}
          {!['/login', '/register', '/email-sent', '/forgot-password', '/enter-reset-code', '/reset-password'].includes(location.pathname) && (
            <Link 
              to="/trainers" 
              className={`flex items-center gap-1 md:gap-1.5 px-1 md:px-4 py-0.5 md:py-2 pb-1.5 md:pb-4 border-2 border-[var(--accent)] border-b-0 rounded-t-lg text-decoration-none cursor-pointer text-[10px] md:text-base font-medium transition-all duration-200 md:hover:bg-[var(--accent)] md:hover:text-white md:hover:pb-2.5 md:hover:pb-5 ${location.pathname === '/trainers' ? 'bg-[var(--accent)] text-white pb-1.5 md:pb-5' : 'bg-[var(--header)] text-[var(--accent)]'}`}
            >
              <Users size={10} className="md:w-4 md:h-4 bg-transparent" />
              <span>Trainers</span>
            </Link>
          )}
          
          {/* Only show Counters button when not on auth flow pages, but allow on public home page */}
          {!['/login', '/register', '/email-sent', '/forgot-password', '/enter-reset-code', '/reset-password'].includes(location.pathname) && (
            <Link 
              to="/counters" 
              className={`flex items-center gap-1 md:gap-1.5 px-1 md:px-4 py-0.5 md:py-2 pb-1.5 md:pb-4 border-2 border-[var(--accent)] border-b-0 rounded-t-lg text-decoration-none cursor-pointer text-[10px] md:text-base font-medium transition-all duration-200 md:hover:bg-[var(--accent)] md:hover:text-white md:hover:pb-2.5 md:hover:pb-5 ${location.pathname === '/counters' ? 'bg-[var(--accent)] text-white pb-1.5 md:pb-5' : 'bg-[var(--header)] text-[var(--accent)]'}`}
            >
              <Tally5 size={10} className="md:w-4 md:h-4 bg-transparent" style={{ transform: 'rotate(-1deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
              <span>Counters</span>
            </Link>
          )}
          
          {/* Theme toggle removed per request */}
        </nav>


        {user?.username && (
          <nav className="ml-auto">
            <div className="relative flex items-center" ref={userMenuRef}>
                             <div className="flex items-center gap-3 cursor-pointer" onClick={() => {
                 if (showMenu) {
                   handleCloseMenu();
                 } else {
                   handleOpenMenu();
                 }
               }}>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                <div className="flex flex-col text-right leading-tight text-[var(--text-color)] translate-y-[8px] md:translate-y-[8px]">
                     <div className="text-[7px] md:text-sm text-[var(--text-color)] transition-[color] duration-[var(--transition-speed)]">Hello!</div>
                     <div className="text-[10px] md:text-base font-bold text-[var(--text)] transition-[color] duration-[var(--transition-speed)] whitespace-nowrap overflow-hidden text-ellipsis">{user.username}</div>
                   </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <img
                             src={user.profileTrainer ? `/data/trainer_sprites/${user.profileTrainer}` : "/avatar.png"}
                             alt="Profile"
                                                 className="w-[60px] h-[60px] md:w-[110px] md:h-[110px] object-contain ml-0 translate-y-[2px] md:translate-y-[13px] rounded-none bg-transparent shadow-none max-w-none"
                             style={{ imageRendering: 'pixelated' }}
                           />
              </div>

                                                                          {showMenu && (
                 <div className="absolute top-[calc(100%+20px)] right-0 bg-[var(--dropdown-bg)] border border-[var(--dropdown-border)] rounded-xl py-2 shadow-[var(--dropdown-shadow),var(--dropdown-inset-shadow)] z-10 min-w-[140px] backdrop-blur-[10px] animate-[dropdownOpen_0.2s_ease-out]">
                  <Link to="/profile" className="flex items-center w-full gap-3 px-[18px] py-3 text-[var(--dropdown-item-text)] text-[0.95rem] font-medium text-left cursor-pointer transition-all duration-200 hover:bg-[var(--dropdown-item-hover-bg)] hover:text-[var(--dropdown-item-hover-text)] hover:translate-x-0.5 active:translate-x-[1px] relative overflow-hidden" onClick={handleCloseMenu}>
                    <User size={16} className="flex-shrink-0 text-[var(--dropdown-icon)] transition-all duration-200 group-hover:text-[var(--accent)] group-hover:scale-105" />
                    Profile
                  </Link>
                  <Link to="/settings" className="flex items-center w-full gap-3 px-[18px] py-3 text-[var(--dropdown-item-text)] text-[0.95rem] font-medium text-left cursor-pointer transition-all duration-200 hover:bg-[var(--dropdown-item-hover-bg)] hover:text-[var(--dropdown-item-hover-text)] hover:translate-x-0.5 active:translate-x-[1px] relative overflow-hidden" onClick={handleCloseMenu}>
                    <Settings size={16} className="flex-shrink-0 text-[var(--dropdown-icon)] transition-all duration-200 group-hover:text-[var(--accent)] group-hover:scale-105" />
                    Settings
                  </Link>
                  <Link to="/backup" className="flex items-center w-full gap-3 px-[18px] py-3 text-[var(--dropdown-item-text)] text-[0.95rem] font-medium text-left cursor-pointer transition-all duration-200 hover:bg-[var(--dropdown-item-hover-bg)] hover:text-[var(--dropdown-item-hover-text)] hover:translate-x-0.5 active:translate-x-[1px] relative overflow-hidden" onClick={handleCloseMenu}>
                    <Database size={16} className="flex-shrink-0 text-[var(--dropdown-icon)] transition-all duration-200 group-hover:text-[var(--accent)] group-hover:scale-105" />
                    Backup
                  </Link>

                  <button
                    className="flex items-center w-full gap-3 px-[18px] py-3 text-[var(--dropdown-item-text)] text-[0.95rem] font-medium text-left cursor-pointer transition-all duration-200 hover:bg-[var(--dropdown-item-hover-bg)] hover:text-[var(--dropdown-item-hover-text)] hover:translate-x-0.5 active:translate-x-[1px] relative overflow-hidden"
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
                    <LogOut size={16} className="flex-shrink-0 text-[var(--dropdown-icon)] transition-all duration-200 group-hover:text-[var(--accent)] group-hover:scale-105" />
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
