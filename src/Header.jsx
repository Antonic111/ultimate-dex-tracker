import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, User, Settings, Users, Database, Tally5, FileText, Shield, ShieldUser, Crown, Menu, X, Grid3x3, MessageCircleWarning, ListChecks, Heart } from "lucide-react";
import { authAPI } from './utils/api';
import { useTheme } from "./components/Shared/ThemeContext";
import changelogData from "./data/changelog.json";

export default function HeaderWithConditionalAuth({ user, setUser, showMenu, setShowMenu, userMenuRef }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);

  useEffect(() => {
    if (!changelogData || changelogData.length === 0) return;
    const latestVersion = changelogData[0].version;
    const viewedVersion = localStorage.getItem("lastViewedChangelogVersion");

    if (location.pathname === '/changelog') {
      localStorage.setItem("lastViewedChangelogVersion", latestVersion);
      setHasNewUpdate(false);
    } else if (viewedVersion !== latestVersion) {
      setHasNewUpdate(true);
    }
  }, [location.pathname]);

  // Close the menu after login/logout or on any navigation
  useEffect(() => { setShowMenu(false); }, [user?.username, location.pathname]);

  // Close mobile nav on navigation
  useEffect(() => { setShowMobileNav(false); }, [location.pathname]);

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    if (showMobileNav) {
      document.body.style.overflow = 'hidden';

      // Close dropdown on scroll events
      const handleScroll = (event) => {
        // Only close if it's a wheel event or touch scroll, not programmatic
        if (event.type === 'wheel' || event.type === 'touchmove') {
          setShowMobileNav(false);
        }
      };

      // Use capture phase to catch scroll events before they're handled
      document.addEventListener('wheel', handleScroll, { passive: true, capture: true });
      document.addEventListener('touchmove', handleScroll, { passive: true, capture: true });

      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('wheel', handleScroll, { capture: true });
        document.removeEventListener('touchmove', handleScroll, { capture: true });
      };
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMobileNav]);

  // Prevent body scroll when profile menu is open
  useEffect(() => {
    if (showMenu) {
      document.body.style.overflow = 'hidden';

      // Close dropdown on scroll events
      const handleScroll = (event) => {
        // Only close if it's a wheel event or touch scroll, not programmatic
        if (event.type === 'wheel' || event.type === 'touchmove') {
          setShowMenu(false);
        }
      };

      // Use capture phase to catch scroll events before they're handled
      document.addEventListener('wheel', handleScroll, { passive: true, capture: true });
      document.addEventListener('touchmove', handleScroll, { passive: true, capture: true });

      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('wheel', handleScroll, { capture: true });
        document.removeEventListener('touchmove', handleScroll, { capture: true });
      };
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMenu]);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!showMenu && !showMobileNav) return;

      // Check if click is outside the user menu wrapper
      if (showMenu && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowMenu(false);
      }

      // Check if click is outside the mobile nav dropdown
      if (showMobileNav && !event.target.closest('.mobile-nav-dropdown')) {
        setShowMobileNav(false);
      }
    };

    if (showMenu || showMobileNav) {
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenu, showMobileNav]);

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
      <div className="w-full h-[80px] md:h-[130px] max-h-[80px] md:max-h-[130px] mx-auto flex items-center justify-between px-3 md:px-8 md:pr-6 relative">

        {/* Logo — far left */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            to="/"
            className="flex items-center text-decoration-none hover:text-[var(--accent)] focus:text-[var(--accent)] active:text-[var(--accent)] hover:outline-none focus:outline-none"
            aria-label="Ultimate Dex Tracker"
            onClick={() => {
              // Dispatch event to refresh dex preferences
              window.dispatchEvent(new CustomEvent('refreshDexPreferences'));
            }}
          >
            <img src={logoSrc} onError={handleLogoError} alt="" className="h-[65px] md:h-[110px] w-auto max-w-[340px] md:max-w-[450px] lg:max-w-[550px]" />
          </Link>

          {/* Mobile Hamburger Menu Button */}
          {!['/login', '/register', '/email-sent', '/forgot-password', '/enter-reset-code', '/reset-password'].includes(location.pathname) && (
            <button
              onClick={() => {
                console.log('Hamburger clicked, current state:', showMobileNav);
                setShowMobileNav(!showMobileNav);
              }}
              className="xl:hidden flex items-center justify-center w-10 h-10 text-[var(--accent)] rounded-lg transition-colors duration-200 z-50 relative"
              aria-label="Toggle navigation menu"
              style={{ zIndex: 1000 }}
            >
              {showMobileNav ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>

        {/* Desktop Navigation — absolutely centered */}
        {!['/login', '/register', '/email-sent', '/forgot-password', '/enter-reset-code', '/reset-password'].includes(location.pathname) && (
          <nav className="hidden xl:flex items-center gap-1 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className="flex items-center gap-1 pointer-events-auto">

              <Link
                to="/trainers"
                className={`group relative flex items-center gap-2 px-5 pt-2 pb-3 text-lg font-semibold tracking-wide transition-colors duration-200 no-underline ${location.pathname === '/trainers'
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-muted,var(--text-color))] opacity-70 hover:opacity-100 hover:text-[var(--accent)]'
                  }`}
              >
                <Users size={19} className="flex-shrink-0" />
                <span>Trainers</span>
                <span className={`absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-[var(--accent)] transition-all duration-200 ${location.pathname === '/trainers' ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100'
                  }`} style={{ transformOrigin: 'center' }} />
              </Link>

              {user?.username && (
                <Link
                  to="/counters"
                  className={`group relative flex items-center gap-2 px-5 pt-2 pb-3 text-lg font-semibold tracking-wide transition-colors duration-200 no-underline ${location.pathname === '/counters'
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--text-muted,var(--text-color))] opacity-70 hover:opacity-100 hover:text-[var(--accent)]'
                    }`}
                >
                  <Tally5 size={19} className="flex-shrink-0" style={{ transform: 'rotate(-1deg)' }} />
                  <span>Counters</span>
                  <span className={`absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-[var(--accent)] transition-all duration-200 ${location.pathname === '/counters' ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100'
                    }`} style={{ transformOrigin: 'center' }} />
                </Link>
              )}

              {user?.username && (
                <Link
                  to="/mmo-tool"
                  className={`group relative flex items-center gap-2 px-5 pt-2 pb-3 text-lg font-semibold tracking-wide transition-colors duration-200 no-underline ${location.pathname === '/mmo-tool'
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--text-muted,var(--text-color))] opacity-70 hover:opacity-100 hover:text-[var(--accent)]'
                    }`}
                >
                  <ListChecks size={19} className="flex-shrink-0" />
                  <span className="whitespace-nowrap">MMO Tool</span>
                  <span className={`absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-[var(--accent)] transition-all duration-200 ${location.pathname === '/mmo-tool' ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100'
                    }`} style={{ transformOrigin: 'center' }} />
                </Link>
              )}

              {user?.username && (
                <Link
                  to="/bingo"
                  className={`group relative flex items-center gap-2 px-5 pt-2 pb-3 text-lg font-semibold tracking-wide transition-colors duration-200 no-underline ${location.pathname === '/bingo'
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--text-muted,var(--text-color))] opacity-70 hover:opacity-100 hover:text-[var(--accent)]'
                    }`}
                >
                  <Grid3x3 size={19} className="flex-shrink-0" />
                  <span className="whitespace-nowrap">Bingo</span>
                  <span className={`absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-[var(--accent)] transition-all duration-200 ${location.pathname === '/bingo' ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100'
                    }`} style={{ transformOrigin: 'center' }} />
                </Link>
              )}

              {user?.username && (
                <Link
                  to="/changelog"
                  className={`group relative flex items-center gap-2 px-5 pt-2 pb-3 text-lg font-semibold tracking-wide transition-colors duration-200 no-underline ${location.pathname === '/changelog'
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--text-muted,var(--text-color))] opacity-70 hover:opacity-100 hover:text-[var(--accent)]'
                    }`}
                >
                  <FileText size={19} className="flex-shrink-0" />
                  <span className="relative whitespace-nowrap">
                    Changelog
                    {hasNewUpdate && (
                      <span className="absolute -top-2 -right-7 px-[5px] py-[3px] text-[0.7rem] font-bold uppercase tracking-wider text-white bg-red-500 rounded-full leading-none shadow-sm pointer-events-none">New</span>
                    )}
                  </span>
                  <span className={`absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-[var(--accent)] transition-all duration-200 ${location.pathname === '/changelog' ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100'
                    }`} style={{ transformOrigin: 'center' }} />
                </Link>
              )}

              {user?.username && (
                <Link
                  to="/feedback"
                  className={`group relative flex items-center gap-2 px-5 pt-2 pb-3 text-lg font-semibold tracking-wide transition-colors duration-200 no-underline ${
                    location.pathname === '/feedback'
                      ? 'text-[var(--accent)]'
                      : 'text-[var(--text-muted,var(--text-color))] opacity-70 hover:opacity-100 hover:text-[var(--accent)]'
                  }`}
                >
                  <MessageCircleWarning size={19} className="flex-shrink-0" />
                  <span className="whitespace-nowrap">Feedback</span>
                  <span className={`absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-[var(--accent)] transition-all duration-200 ${
                    location.pathname === '/feedback' ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100'
                  }`} style={{ transformOrigin: 'center' }} />
                </Link>
              )}

              {user?.username && (
                <a
                  href="https://streamelements.com/antonic111-1c2e0/tip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex items-center gap-2 px-5 pt-2 pb-3 text-lg font-semibold tracking-wide transition-colors duration-200 no-underline text-[var(--text-muted,var(--text-color))] opacity-70 hover:opacity-100 hover:text-[var(--accent)]"
                >
                  <Heart size={19} className="flex-shrink-0 text-red-500" fill="currentColor" />
                  <span className="whitespace-nowrap">Leave a Tip</span>
                  <span className="absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-[var(--accent)] transition-all duration-200 opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100" style={{ transformOrigin: 'center' }} />
                </a>
              )}

            </div>
          </nav>
        )}

        {/* Mobile Navigation Dropdown */}
        {showMobileNav && !['/login', '/register', '/email-sent', '/forgot-password', '/enter-reset-code', '/reset-password'].includes(location.pathname) && (
          <div className="mobile-nav-dropdown xl:hidden fixed top-[90px] left-4 right-4 bg-[var(--dropdown-bg)] border border-[var(--dropdown-border)] rounded-xl py-2 shadow-[var(--dropdown-shadow),var(--dropdown-inset-shadow)] z-50 backdrop-blur-[10px] animate-[dropdownOpen_0.2s_ease-out]">
            <Link
              to="/trainers"
              className={`flex items-center w-full gap-3 px-[18px] py-3 text-[0.95rem] font-medium text-left cursor-pointer transition-all duration-200 relative overflow-hidden ${location.pathname === '/trainers' ? 'bg-[var(--dropdown-item-hover-bg)] text-[var(--dropdown-item-hover-text)]' : 'text-[var(--dropdown-item-text)] hover:bg-[var(--dropdown-item-hover-bg)] hover:text-[var(--dropdown-item-hover-text)]'}`}
              onClick={() => setShowMobileNav(false)}
            >
              <div className="flex items-center gap-3">
                <Users size={16} className="flex-shrink-0 text-[var(--dropdown-icon)]" />
                Trainers
              </div>
            </Link>

            {user?.username && (
              <>
                <Link
                  to="/counters"
                  className={`flex items-center w-full gap-3 px-[18px] py-3 text-[0.95rem] font-medium text-left cursor-pointer transition-all duration-200 relative overflow-hidden ${location.pathname === '/counters' ? 'bg-[var(--dropdown-item-hover-bg)] text-[var(--dropdown-item-hover-text)]' : 'text-[var(--dropdown-item-text)] hover:bg-[var(--dropdown-item-hover-bg)] hover:text-[var(--dropdown-item-hover-text)]'}`}
                  onClick={() => setShowMobileNav(false)}
                >
                  <div className="flex items-center gap-3">
                    <Tally5 size={16} className="flex-shrink-0 text-[var(--dropdown-icon)]" />
                    Counters
                  </div>
                </Link>

                <Link
                  to="/mmo-tool"
                  className={`flex items-center w-full gap-3 px-[18px] py-3 text-[0.95rem] font-medium text-left cursor-pointer transition-all duration-200 relative overflow-hidden ${location.pathname === '/mmo-tool' ? 'bg-[var(--dropdown-item-hover-bg)] text-[var(--dropdown-item-hover-text)]' : 'text-[var(--dropdown-item-text)] hover:bg-[var(--dropdown-item-hover-bg)] hover:text-[var(--dropdown-item-hover-text)]'}`}
                  onClick={() => setShowMobileNav(false)}
                >
                  <div className="flex items-center gap-3">
                    <ListChecks size={16} className="flex-shrink-0 text-[var(--dropdown-icon)]" />
                    <span className="whitespace-nowrap">MMO Tool</span>
                  </div>
                </Link>

                <Link
                  to="/bingo"
                  className={`flex items-center w-full gap-3 px-[18px] py-3 text-[0.95rem] font-medium text-left cursor-pointer transition-all duration-200 relative overflow-hidden ${location.pathname === '/bingo' ? 'bg-[var(--dropdown-item-hover-bg)] text-[var(--dropdown-item-hover-text)]' : 'text-[var(--dropdown-item-text)] hover:bg-[var(--dropdown-item-hover-bg)] hover:text-[var(--dropdown-item-hover-text)]'}`}
                  onClick={() => setShowMobileNav(false)}
                >
                  <div className="flex items-center gap-3">
                    <Grid3x3 size={16} className="flex-shrink-0 text-[var(--dropdown-icon)]" />
                    <span className="whitespace-nowrap">Bingo</span>
                  </div>
                </Link>

                <Link
                  to="/changelog"
                  className={`flex items-center w-full gap-3 px-[18px] py-3 text-[0.95rem] font-medium text-left cursor-pointer transition-all duration-200 relative overflow-hidden ${location.pathname === '/changelog' ? 'bg-[var(--dropdown-item-hover-bg)] text-[var(--dropdown-item-hover-text)]' : 'text-[var(--dropdown-item-text)] hover:bg-[var(--dropdown-item-hover-bg)] hover:text-[var(--dropdown-item-hover-text)]'}`}
                  onClick={() => setShowMobileNav(false)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <FileText size={16} className="flex-shrink-0 text-[var(--dropdown-icon)]" />
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      Changelog
                      {hasNewUpdate && (
                        <span className="px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-white bg-red-500 rounded-full leading-none">New</span>
                      )}
                    </span>
                  </div>
                </Link>

                <Link
                  to="/feedback"
                  className={`flex items-center w-full gap-3 px-[18px] py-3 text-[0.95rem] font-medium text-left cursor-pointer transition-all duration-200 relative overflow-hidden ${location.pathname === '/feedback' ? 'bg-[var(--dropdown-item-hover-bg)] text-[var(--dropdown-item-hover-text)]' : 'text-[var(--dropdown-item-text)] hover:bg-[var(--dropdown-item-hover-bg)] hover:text-[var(--dropdown-item-hover-text)]'}`}
                  onClick={() => setShowMobileNav(false)}
                >
                  <div className="flex items-center gap-3">
                    <MessageCircleWarning size={16} className="flex-shrink-0 text-[var(--dropdown-icon)]" />
                    <span className="whitespace-nowrap">Feedback</span>
                  </div>
                </Link>

                <a
                  href="https://streamelements.com/antonic111-1c2e0/tip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center w-full gap-3 px-[18px] py-3 text-[0.95rem] font-medium text-left cursor-pointer transition-all duration-200 relative overflow-hidden text-[var(--dropdown-item-text)] hover:bg-[var(--dropdown-item-hover-bg)] hover:text-[var(--dropdown-item-hover-text)]"
                  onClick={() => setShowMobileNav(false)}
                >
                  <div className="flex items-center gap-3">
                    <Heart size={16} className="flex-shrink-0 text-red-500" fill="currentColor" />
                    <span className="whitespace-nowrap">Leave a Tip</span>
                  </div>
                </a>
              </>
            )}
          </div>
        )}


        {user?.username && (
          <nav className="ml-auto pr-2 md:pr-4">
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
                  <Link to="/profile" className="flex items-center w-full gap-3 px-[18px] py-3 text-[var(--dropdown-item-text)] text-[0.95rem] font-medium text-left cursor-pointer transition-all duration-200 hover:bg-[var(--dropdown-item-hover-bg)] hover:text-[var(--dropdown-item-hover-text)] relative overflow-hidden" onClick={handleCloseMenu}>
                    <div className="flex items-center gap-3">
                      <User size={16} className="flex-shrink-0 text-[var(--dropdown-icon)]" />
                      Profile
                    </div>
                  </Link>
                  <Link to="/settings" className="flex items-center w-full gap-3 px-[18px] py-3 text-[var(--dropdown-item-text)] text-[0.95rem] font-medium text-left cursor-pointer transition-all duration-200 hover:bg-[var(--dropdown-item-hover-bg)] hover:text-[var(--dropdown-item-hover-text)] relative overflow-hidden" onClick={handleCloseMenu}>
                    <div className="flex items-center gap-3">
                      <Settings size={16} className="flex-shrink-0 text-[var(--dropdown-icon)]" />
                      Settings
                    </div>
                  </Link>
                  <Link to="/backup" className="flex items-center w-full gap-3 px-[18px] py-3 text-[var(--dropdown-item-text)] text-[0.95rem] font-medium text-left cursor-pointer transition-all duration-200 hover:bg-[var(--dropdown-item-hover-bg)] hover:text-[var(--dropdown-item-hover-text)] relative overflow-hidden" onClick={handleCloseMenu}>
                    <div className="flex items-center gap-3">
                      <Database size={16} className="flex-shrink-0 text-[var(--dropdown-icon)]" />
                      Backup
                    </div>
                  </Link>

                  {user?.isAdmin && (
                    <Link to="/admin" className="flex items-center w-full gap-3 px-[18px] py-3 text-[var(--dropdown-item-text)] text-[0.95rem] font-medium text-left cursor-pointer transition-all duration-200 hover:bg-[var(--dropdown-item-hover-bg)] hover:text-[var(--dropdown-item-hover-text)] relative overflow-hidden" onClick={handleCloseMenu}>
                      <div className="flex items-center gap-3">
                        <ShieldUser size={16} className="flex-shrink-0 text-[var(--dropdown-icon)]" />
                        Admin
                      </div>
                    </Link>
                  )}

                  <button
                    className="flex items-center w-full gap-3 px-[18px] py-3 text-[var(--dropdown-item-text)] text-[0.95rem] font-medium text-left cursor-pointer transition-all duration-200 hover:bg-[var(--dropdown-item-hover-bg)] hover:text-[var(--dropdown-item-hover-text)] relative overflow-hidden"
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
                    <div className="flex items-center gap-3">
                      <LogOut size={16} className="flex-shrink-0 text-[var(--dropdown-icon)]" />
                      Logout
                    </div>
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
