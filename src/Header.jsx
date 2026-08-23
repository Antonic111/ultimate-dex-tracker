import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, User, Settings, Users, Database, Tally5, FileText, Shield, ShieldUser, Crown, Menu, X, Grid3x3, MessageCircleWarning, ListChecks, Heart, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { authAPI } from './utils/api';
import { useTheme } from "./components/Shared/ThemeContext";
import changelogData from "./data/changelog.json";
import NotificationDropdown from "./components/Notifications/NotificationDropdown";
import { getUserAvatarUrl } from "./utils/profileUtils";

export default function HeaderWithConditionalAuth({ user, setUser, showMenu, setShowMenu, userMenuRef }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);

  // 1/8192 Shiny Logo Easter Egg (persists for 1 hour once triggered)
  const [isRainbowLogo, setIsRainbowLogo] = useState(() => {
    try {
      const stored = localStorage.getItem('shinyLogoEasterEggUntil');
      if (stored) {
        const expiresAt = parseInt(stored, 10);
        if (Date.now() < expiresAt) {
          return true;
        } else {
          localStorage.removeItem('shinyLogoEasterEggUntil');
        }
      }
      // 1 in 8,192 shiny chance
      const roll = Math.floor(Math.random() * 8192);
      if (roll === 0) {
        const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour duration
        localStorage.setItem('shinyLogoEasterEggUntil', expiresAt.toString());
        return true;
      }
    } catch {
      // Fallback
    }
    return false;
  });

  useEffect(() => {
    window.triggerShinyLogo = (enable = true) => {
      if (enable) {
        const expiresAt = Date.now() + 60 * 60 * 1000;
        localStorage.setItem('shinyLogoEasterEggUntil', expiresAt.toString());
        setIsRainbowLogo(true);
        console.log('✨ 1/8192 Shiny Logo Easter Egg ACTIVATED for 1 hour!');
      } else {
        localStorage.removeItem('shinyLogoEasterEggUntil');
        setIsRainbowLogo(false);
        console.log('Shiny Logo Easter Egg deactivated.');
      }
    };
  }, []);

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

  // Automatically open the profile menu when tutorial targets it
  useEffect(() => {
    const handleTutorialStep = (e) => {
      const targetId = e.detail?.targetId;
      
      const isMobileNavTarget = ['nav-trainers', 'nav-counters', 'nav-mmo', 'nav-bingo'].includes(targetId);
      const isProfileNavTarget = ['nav-settings', 'nav-profile'].includes(targetId);

      if (isProfileNavTarget) {
        setShowMenu(true);
      } else {
        setShowMenu(false);
      }
      
      if (isMobileNavTarget) {
        if (window.innerWidth < 1280) {
          setShowMobileNav(true);
        }
      } else {
        setShowMobileNav(false);
      }
    };
    window.addEventListener('tutorialStepChange', handleTutorialStep);
    return () => window.removeEventListener('tutorialStepChange', handleTutorialStep);
  }, []);

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
        document.removeEventListener('wheel', handleScroll, { capture: true });
        document.removeEventListener('touchmove', handleScroll, { capture: true });
      };
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
      
      // Let the tutorial strictly manage menu states while active
      if (document.body.classList.contains('tutorial-active')) return;

      // Check if click is outside the user menu wrapper
      if (showMenu && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowMenu(false);
      }

      // Check if click is outside the mobile nav dropdown AND outside the toggle button
      if (showMobileNav && !event.target.closest('.mobile-nav-dropdown') && !event.target.closest('.mobile-nav-toggle-btn')) {
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

  const { theme, resolvedTheme, accent } = useTheme(); // has "dark"/"light" + your accent color

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

  const isAuthPage = ['/login', '/register', '/email-sent', '/forgot-password', '/enter-reset-code', '/reset-password', '/complete-signup'].includes(location.pathname);

  return (
    <header className={`relative z-[100] bg-[var(--header)] transition-[background-color] duration-[var(--transition-speed)] border-b-8 ${location.pathname === '/' ? 'sticky top-0' : ''}`} style={{ borderColor: 'var(--accent)' }}>
      <div className="w-full h-[80px] md:h-[130px] max-h-[80px] md:max-h-[130px] mx-auto flex items-center justify-between px-3 md:px-8 md:pr-6 relative">

        {/* Logo — far left */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            to={location.pathname === '/complete-signup' || user?.needsProfileSetup ? '#' : '/'}
            className={`flex items-center text-decoration-none ${
              location.pathname === '/complete-signup' || user?.needsProfileSetup
                ? 'cursor-default pointer-events-none'
                : 'hover:text-[var(--accent)] focus:text-[var(--accent)] active:text-[var(--accent)] hover:outline-none focus:outline-none'
            }`}
            aria-label="Ultimate Dex Tracker"
            onClick={(e) => {
              if (location.pathname === '/complete-signup' || user?.needsProfileSetup) {
                e.preventDefault();
                return;
              }
              // Dispatch event to refresh dex preferences
              window.dispatchEvent(new CustomEvent('refreshDexPreferences'));
            }}
          >
            {/* 3-layer logo — Layer1 sets natural size, layers 2+3 overlay on top */}
            <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0, flexShrink: 0 }}>
              {/* Layer 1: natural-flow img — defines the container's real width & height */}
              <img
                src="/Logo_Layer1.png"
                alt="Ultimate Dex Tracker"
                className="site-logo-img"
                style={{
                  filter: resolvedTheme === 'light' ? 'brightness(0) saturate(100%) invert(8%)' : 'none',
                  transition: 'filter var(--transition-speed)',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />

              {/* Layer 2: Static Details (Pokeball / secondary accents) */}
              <img
                src="/Logo_Layer2.png"
                alt=""
                style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '100%', height: '100%',
                  objectFit: 'contain',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              />

              {/* Layer 3: Dynamic Accent Color Overlay / Rainbow Easter Egg */}
              <div
                className={isRainbowLogo ? "rainbow-logo-layer3" : ""}
                style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '100%', height: '100%',
                  WebkitMask: 'url(/Logo_Layer3.png) no-repeat center / contain',
                  mask: 'url(/Logo_Layer3.png) no-repeat center / contain',
                  pointerEvents: 'none',
                  ...(isRainbowLogo ? {} : {
                    backgroundColor: 'var(--accent)',
                    transition: 'background-color var(--transition-speed)'
                  })
                }}
              />
            </div>
          </Link>

          {/* Mobile Hamburger Menu Button */}
          {!['/login', '/register', '/email-sent', '/forgot-password', '/enter-reset-code', '/reset-password', '/complete-signup'].includes(location.pathname) && !user?.needsProfileSetup && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMobileNav(prev => !prev);
              }}
              className="mobile-nav-toggle-btn xl:hidden flex items-center justify-center w-10 h-10 text-[var(--accent)] rounded-lg transition-colors duration-200 z-50 relative cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={showMobileNav}
              style={{ zIndex: 1000 }}
            >
              {showMobileNav ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>

        {/* Desktop Navigation — absolutely centered */}
        {!['/login', '/register', '/email-sent', '/forgot-password', '/enter-reset-code', '/reset-password', '/complete-signup'].includes(location.pathname) && !user?.needsProfileSetup && (
          <nav className="hidden xl:flex items-center gap-1 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className="flex items-center gap-1 pointer-events-auto">

              <Link
                data-tutorial-id="nav-trainers"
                to="/trainers"
                className={`group relative flex items-center gap-2 px-5 pt-2 pb-3 text-lg font-semibold tracking-wide transition-colors duration-200 no-underline ${location.pathname === '/trainers'
                  ? 'text-[var(--accent)]'
                  : 'text-white/80 hover:text-[var(--accent)] hover:opacity-100'
                  }`}
              >
                <Users size={19} className="flex-shrink-0" />
                <span>Trainers</span>
                <span className={`absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-[var(--accent)] transition-all duration-200 ${location.pathname === '/trainers' ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100'
                  }`} style={{ transformOrigin: 'center' }} />
              </Link>

              {user?.username && (
                <Link
                  data-tutorial-id="nav-counters"
                  to="/counters"
                  className={`group relative flex items-center gap-2 px-5 pt-2 pb-3 text-lg font-semibold tracking-wide transition-colors duration-200 no-underline ${location.pathname === '/counters'
                    ? 'text-[var(--accent)]'
                    : 'text-white/80 hover:text-[var(--accent)] hover:opacity-100'
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
                  data-tutorial-id="nav-mmo"
                  to="/mmo-tool"
                  className={`group relative flex items-center gap-2 px-5 pt-2 pb-3 text-lg font-semibold tracking-wide transition-colors duration-200 no-underline ${location.pathname === '/mmo-tool'
                    ? 'text-[var(--accent)]'
                    : 'text-white/80 hover:text-[var(--accent)] hover:opacity-100'
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
                  data-tutorial-id="nav-bingo"
                  to="/bingo"
                  className={`group relative flex items-center gap-2 px-5 pt-2 pb-3 text-lg font-semibold tracking-wide transition-colors duration-200 no-underline ${location.pathname === '/bingo'
                    ? 'text-[var(--accent)]'
                    : 'text-white/80 hover:text-[var(--accent)] hover:opacity-100'
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
                    : 'text-white/80 hover:text-[var(--accent)] hover:opacity-100'
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
                      : 'text-white/80 hover:text-[var(--accent)] hover:opacity-100'
                  }`}
                >
                  <MessageCircleWarning size={19} className="flex-shrink-0" />
                  <span className="whitespace-nowrap">Feedback</span>
                  <span className={`absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-[var(--accent)] transition-all duration-200 ${
                    location.pathname === '/feedback' ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100'
                  }`} style={{ transformOrigin: 'center' }} />
                </Link>
              )}

            </div>
          </nav>
        )}

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {showMobileNav && !['/login', '/register', '/email-sent', '/forgot-password', '/enter-reset-code', '/reset-password'].includes(location.pathname) && (
            <motion.div
              key="mobile-nav-dropdown"
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="mobile-nav-dropdown xl:hidden fixed top-[92px] left-3 right-3 bg-[var(--dropdown-bg)] border border-[var(--dropdown-border)] rounded-2xl py-2 shadow-[var(--dropdown-shadow),var(--dropdown-inset-shadow),0_20px_40px_rgba(0,0,0,0.6)] z-50 backdrop-blur-[16px] overflow-hidden"
            >
              <Link
                data-tutorial-id="nav-trainers"
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
                    data-tutorial-id="nav-counters"
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
                    data-tutorial-id="nav-mmo"
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
                    data-tutorial-id="nav-bingo"
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
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>


        {user?.username && !['/login', '/register', '/email-sent', '/forgot-password', '/enter-reset-code', '/reset-password', '/complete-signup'].includes(location.pathname) && !user?.needsProfileSetup && (
          <nav className="ml-auto pr-2 md:pr-4 flex items-center gap-3 md:gap-4.5">
            {/* Notification Bell */}
            <div className="flex items-center">
              <NotificationDropdown user={user} />
            </div>

            {/* Subtle Vertical Divider */}
            <div className="h-6 md:h-7 w-[1px] bg-white/20 flex-shrink-0" />

            {/* Profile Dropdown Trigger */}
            <div className="relative flex items-center" ref={userMenuRef}>
              <button
                type="button"
                data-tutorial-id="nav-profile-menu"
                className="group flex items-center gap-2 md:gap-3 cursor-pointer select-none bg-transparent border-0 p-0 outline-none focus:outline-none"
                onClick={() => {
                  if (showMenu) {
                    handleCloseMenu();
                  } else {
                    handleOpenMenu();
                  }
                }}
                aria-expanded={showMenu}
                aria-label="User profile menu"
              >
                <div
                  className="relative w-[36px] h-[36px] md:w-[44px] md:h-[44px] aspect-square rounded-full overflow-hidden border-2 border-[var(--accent)] shadow-md flex-shrink-0 group-hover:scale-105 transition-transform duration-200 flex items-center justify-center"
                  style={{ backgroundColor: 'var(--header, #0a0a0a)' }}
                >
                  <img
                    src={getUserAvatarUrl(user)}
                    alt="Profile"
                    className="w-full h-full select-none pointer-events-none"
                    style={{ objectFit: 'contain', objectPosition: 'center' }}
                  />
                </div>

                <span className="font-bold text-white text-[13px] sm:text-[14px] md:text-[16px] tracking-wide group-hover:text-[var(--accent)] transition-colors duration-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[85px] sm:max-w-[120px] md:max-w-[170px]">
                  {user.username}
                </span>

                <ChevronDown
                  strokeWidth={3}
                  className={`w-5 h-5 sm:w-4.5 sm:h-4.5 min-w-[20px] min-h-[20px] text-white group-hover:text-[var(--accent)] transition-transform duration-200 flex-shrink-0 ${
                    showMenu ? "rotate-180 text-[var(--accent)]" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    key="profile-dropdown-menu"
                    initial={{ opacity: 0, y: -10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="fixed top-[92px] right-3 w-[calc(100vw-24px)] max-w-[310px] sm:absolute sm:top-[calc(100%+16px)] sm:right-0 sm:w-[310px] bg-[var(--dropdown-bg)] border border-[var(--dropdown-border)] rounded-2xl p-3 shadow-[var(--dropdown-shadow),var(--dropdown-inset-shadow),0_20px_45px_rgba(0,0,0,0.7)] z-50 backdrop-blur-[16px] overflow-hidden flex flex-col"
                  >
                    {/* User Header Section */}
                    <div className="relative flex items-center justify-between gap-3 p-2.5 pb-3.5 border-b border-white/[0.08] mb-2">
                      <div className="flex flex-col min-w-0 flex-1 z-10">
                        <span className="text-[12px] text-gray-400 font-medium tracking-wide">
                          Hello,
                        </span>
                        <span className="font-extrabold text-white text-[18px] leading-snug truncate">
                          {user.username}
                        </span>
                      </div>

                      {/* Accent-colored Sparkle centered with the header */}
                      <div
                        className="w-10 h-10 flex-shrink-0 pointer-events-none opacity-40 mr-1"
                        style={{
                          backgroundColor: 'var(--accent)',
                          WebkitMaskImage: 'url(/leaderboard/sparkle.svg)',
                          WebkitMaskSize: 'contain',
                          WebkitMaskRepeat: 'no-repeat',
                          WebkitMaskPosition: 'center',
                          maskImage: 'url(/leaderboard/sparkle.svg)',
                          maskSize: 'contain',
                          maskRepeat: 'no-repeat',
                          maskPosition: 'center',
                          filter: 'drop-shadow(0 0 6px var(--accent-glow, color-mix(in srgb, var(--accent) 50%, transparent)))'
                        }}
                      />
                    </div>

                    {/* Menu items */}
                    <div className="flex flex-col gap-1">
                      {/* Profile */}
                      <Link
                        data-tutorial-id="nav-profile"
                        to="/profile"
                        className="group flex items-center justify-between p-2 rounded-xl transition-all duration-150 hover:bg-white/[0.07] text-left no-underline"
                        onClick={handleCloseMenu}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 group-hover:scale-105 transition-all">
                            <User size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-white text-[14px] leading-snug group-hover:text-cyan-300 transition-colors">
                              Profile
                            </span>
                            <span className="text-[11px] text-gray-400 font-normal">
                              View your trainer profile
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </Link>

                      {/* Settings */}
                      <Link
                        data-tutorial-id="nav-settings"
                        to="/settings"
                        className="group flex items-center justify-between p-2 rounded-xl transition-all duration-150 hover:bg-white/[0.07] text-left no-underline"
                        onClick={handleCloseMenu}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:bg-sky-500/20 group-hover:scale-105 transition-all">
                            <Settings size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-white text-[14px] leading-snug group-hover:text-sky-300 transition-colors">
                              Settings
                            </span>
                            <span className="text-[11px] text-gray-400 font-normal">
                              Manage your preferences
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </Link>

                      {/* Backup */}
                      <Link
                        to="/backup"
                        className="group flex items-center justify-between p-2 rounded-xl transition-all duration-150 hover:bg-white/[0.07] text-left no-underline"
                        onClick={handleCloseMenu}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 group-hover:scale-105 transition-all">
                            <Database size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-white text-[14px] leading-snug group-hover:text-purple-300 transition-colors">
                              Backup
                            </span>
                            <span className="text-[11px] text-gray-400 font-normal">
                              Export or restore your data
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </Link>

                      {/* Admin */}
                      {user?.isAdmin && (
                        <Link
                          to="/admin"
                          className="group flex items-center justify-between p-2 rounded-xl transition-all duration-150 hover:bg-white/[0.07] text-left no-underline"
                          onClick={handleCloseMenu}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 group-hover:scale-105 transition-all">
                              <Shield size={18} />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-white text-[14px] leading-snug group-hover:text-amber-300 transition-colors">
                                Admin
                              </span>
                              <span className="text-[11px] text-gray-400 font-normal">
                                Site administration panel
                              </span>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </Link>
                      )}

                      {/* Divider */}
                      <div className="h-[1px] bg-white/[0.08] my-1 mx-1" />

                      {/* Logout */}
                      <button
                        type="button"
                        className="group flex items-center justify-between p-2 rounded-xl transition-all duration-150 hover:bg-red-500/10 text-left cursor-pointer border-0 bg-transparent outline-none w-full"
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
                          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:bg-rose-500/20 group-hover:scale-105 transition-all">
                            <LogOut size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-white text-[14px] leading-snug group-hover:text-rose-400 transition-colors">
                              Logout
                            </span>
                            <span className="text-[11px] text-gray-400 font-normal">
                              Sign out of your account
                            </span>
                          </div>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
