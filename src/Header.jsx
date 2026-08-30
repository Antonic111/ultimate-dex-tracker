import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, User, Settings, Users, Database, Tally5, FileText, Shield, ShieldUser, Crown, Menu, X, Grid3x3, MessageCircleWarning, ListChecks, Heart, ChevronDown, ChevronRight, Sparkles, Tv, ShoppingBag, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { authAPI } from './utils/api';
import { useTheme } from "./components/Shared/ThemeContext";
import changelogData from "./data/changelog.json";
import NotificationDropdown from "./components/Notifications/NotificationDropdown";
import { getUserAvatarUrl } from "./utils/profileUtils";

const NAV_DROPDOWNS = [
  {
    id: "tracking",
    label: "Tracking",
    requiresAuth: true,
    items: [
      {
        to: "/counters",
        label: "Counters",
        description: "Shiny encounter tracker",
        icon: Tally5,
        iconRotate: "-1deg",
        color: "text-amber-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/20",
        tutorialId: "nav-counters",
      },
      {
        to: "/mmo-tool",
        label: "MMO Tool",
        description: "Massive mass outbreak tracker",
        icon: ListChecks,
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/20",
        tutorialId: "nav-mmo",
      },
      {
        to: "/bingo",
        label: "Bingo",
        description: "Interactive shiny bingo cards",
        icon: Grid3x3,
        color: "text-cyan-400",
        bgColor: "bg-cyan-500/10",
        borderColor: "border-cyan-500/20",
        tutorialId: "nav-bingo",
      },
    ],
  },
  {
    id: "community",
    label: "Community",
    requiresAuth: false,
    items: [
      {
        to: "/trainers",
        label: "Trainers",
        description: "Discover and follow trainers",
        icon: Users,
        color: "text-blue-400",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/20",
        tutorialId: "nav-trainers",
      },
      {
        to: "/leaderboard",
        label: "Leaderboards",
        description: "Global shiny rankings & stats",
        icon: Crown,
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/20",
      },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    requiresAuth: true,
    items: [
      {
        to: "/streamer-tools",
        label: "Streamer Tools",
        description: "OBS hunt overlay",
        icon: Tv,
        color: "text-purple-400",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/20",
      },
      {
        to: "/backup",
        label: "Backup",
        description: "Export or restore your dex data",
        icon: Database,
        color: "text-indigo-400",
        bgColor: "bg-indigo-500/10",
        borderColor: "border-indigo-500/20",
      },
    ],
  },
  {
    id: "shop",
    label: "Store",
    requiresAuth: false,
    items: [
      {
        to: "/shop",
        label: "Store",
        description: "Trainer cosmetics & badges",
        icon: ShoppingBag,
        color: "text-pink-400",
        bgColor: "bg-pink-500/10",
        borderColor: "border-pink-500/20",
      },
      {
        to: "/membership",
        label: "Membership",
        description: "Unlock supporter perks & badge",
        icon: Sparkles,
        color: "text-amber-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/20",
      },
    ],
  },
  {
    id: "about",
    label: "About",
    requiresAuth: false,
    items: [
      {
        to: "/changelog",
        label: "Changelog",
        description: "Patch notes & feature updates",
        icon: FileText,
        color: "text-sky-400",
        bgColor: "bg-sky-500/10",
        borderColor: "border-sky-500/20",
        hasBadge: true,
      },
      {
        to: "/feedback",
        label: "Feedback",
        description: "Report bugs & suggest features",
        icon: MessageCircleWarning,
        color: "text-rose-400",
        bgColor: "bg-rose-500/10",
        borderColor: "border-rose-500/20",
      },
    ],
  },
];

export default function HeaderWithConditionalAuth({ user, setUser, showMenu, setShowMenu, userMenuRef }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const [activeNavDropdown, setActiveNavDropdown] = useState(null);
  const navContainerRef = useRef(null);
  const navTimerRef = useRef(null);

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

  // Close menus on navigation
  useEffect(() => {
    setShowMenu(false);
    setShowMobileNav(false);
    setActiveNavDropdown(null);
  }, [user?.username, location.pathname]);

  // Automatically open the target menu when tutorial targets it
  useEffect(() => {
    const handleTutorialStep = (e) => {
      const targetId = e.detail?.targetId;
      
      const isMobileNavTarget = ['nav-trainers', 'nav-counters', 'nav-mmo', 'nav-bingo', 'nav-leaderboard'].includes(targetId);
      const isProfileNavTarget = ['nav-settings', 'nav-profile'].includes(targetId);

      if (isProfileNavTarget) {
        setShowMenu(true);
      } else {
        setShowMenu(false);
      }
      
      if (['nav-counters', 'nav-mmo', 'nav-bingo'].includes(targetId)) {
        if (window.innerWidth >= 1280) {
          setActiveNavDropdown('tracking');
        } else {
          setShowMobileNav(true);
        }
      } else if (['nav-trainers', 'nav-leaderboard'].includes(targetId)) {
        if (window.innerWidth >= 1280) {
          setActiveNavDropdown('community');
        } else {
          setShowMobileNav(true);
        }
      } else if (isMobileNavTarget) {
        if (window.innerWidth < 1280) {
          setShowMobileNav(true);
        }
      } else {
        setShowMobileNav(false);
        setActiveNavDropdown(null);
      }
    };
    window.addEventListener('tutorialStepChange', handleTutorialStep);
    return () => window.removeEventListener('tutorialStepChange', handleTutorialStep);
  }, []);

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    if (showMobileNav) {
      document.body.style.overflow = 'hidden';

      const handleScroll = (event) => {
        if (event.type === 'wheel' || event.type === 'touchmove') {
          setShowMobileNav(false);
        }
      };

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

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMobileNav]);

  // Prevent body scroll when profile menu is open
  useEffect(() => {
    if (showMenu) {
      const handleScroll = (event) => {
        if (event.type === 'wheel' || event.type === 'touchmove') {
          setShowMenu(false);
        }
      };

      document.addEventListener('wheel', handleScroll, { passive: true, capture: true });
      document.addEventListener('touchmove', handleScroll, { passive: true, capture: true });

      return () => {
        document.removeEventListener('wheel', handleScroll, { capture: true });
        document.removeEventListener('touchmove', handleScroll, { capture: true });
      };
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMenu]);

  // Handle clicking outside any dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!showMenu && !showMobileNav && !activeNavDropdown) return;
      
      if (document.body.classList.contains('tutorial-active')) return;

      if (showMenu && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowMenu(false);
      }

      if (showMobileNav && !event.target.closest('.mobile-nav-dropdown') && !event.target.closest('.mobile-nav-toggle-btn')) {
        setShowMobileNav(false);
      }

      if (activeNavDropdown && navContainerRef.current && !navContainerRef.current.contains(event.target)) {
        setActiveNavDropdown(null);
      }
    };

    if (showMenu || showMobileNav || activeNavDropdown) {
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenu, showMobileNav, activeNavDropdown, userMenuRef]);

  const handleNavMouseEnter = (id) => {
    if (navTimerRef.current) {
      clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
    }
    setActiveNavDropdown(id);
  };

  const handleNavMouseLeave = () => {
    if (navTimerRef.current) {
      clearTimeout(navTimerRef.current);
    }
    navTimerRef.current = setTimeout(() => {
      setActiveNavDropdown(null);
    }, 150);
  };

  const handleNavClick = (id) => {
    if (navTimerRef.current) {
      clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
    }
    setActiveNavDropdown((prev) => (prev === id ? null : id));
  };

  const isDropdownActive = (dropdown) => {
    return dropdown.items.some(
      (item) => location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to + '/'))
    );
  };

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
    <header className="sticky top-0 z-[100] bg-[var(--header)] transition-[background-color] duration-[var(--transition-speed)] border-b-8" style={{ borderColor: 'var(--accent)' }}>
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

        {/* Desktop Navigation — absolutely centered with prominent options */}
        {!['/login', '/register', '/email-sent', '/forgot-password', '/enter-reset-code', '/reset-password', '/complete-signup'].includes(location.pathname) && !user?.needsProfileSetup && (
          <nav ref={navContainerRef} className="hidden xl:flex items-center gap-1 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className="flex items-center gap-1 pointer-events-auto">
              {NAV_DROPDOWNS.map((dropdown) => {
                const isActive = isDropdownActive(dropdown);
                const isOpen = activeNavDropdown === dropdown.id;

                return (
                  <div
                    key={dropdown.id}
                    className="relative flex justify-center"
                    onMouseEnter={() => handleNavMouseEnter(dropdown.id)}
                    onMouseLeave={handleNavMouseLeave}
                  >
                    <button
                      type="button"
                      onClick={() => handleNavClick(dropdown.id)}
                      className={`group relative flex items-center gap-2 px-5 pt-2 pb-3 text-lg font-semibold tracking-wide transition-colors duration-200 cursor-pointer select-none bg-transparent border-0 outline-none ${
                        isActive || isOpen
                          ? 'text-[var(--accent)]'
                          : 'text-[var(--text)]/80 hover:text-[var(--accent)]'
                      }`}
                      aria-expanded={isOpen}
                      aria-label={`${dropdown.label} menu`}
                    >
                      <span>{dropdown.label}</span>
                      <ChevronDown
                        size={16}
                        strokeWidth={2.5}
                        className={`transition-transform duration-200 flex-shrink-0 ${
                          isOpen ? 'rotate-180 text-[var(--accent)]' : 'text-[var(--text)]/60 group-hover:text-[var(--accent)]'
                        }`}
                      />
                      <span
                        className={`absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-[var(--accent)] transition-all duration-200 ${
                          isActive
                            ? 'opacity-100 scale-x-100'
                            : isOpen
                            ? 'opacity-60 scale-x-75'
                            : 'opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100'
                        }`}
                        style={{ transformOrigin: 'center' }}
                      />
                    </button>

                    {/* Dropdown Menu Panel */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          key={`nav-dropdown-${dropdown.id}`}
                          initial={{ opacity: 0, y: 6, x: "-50%", scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
                          exit={{ opacity: 0, y: 4, x: "-50%", scale: 0.96 }}
                          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                          style={{ transformOrigin: "top center" }}
                          className="absolute top-[calc(100%+6px)] left-1/2 w-[285px] bg-[var(--dropdown-bg)] border border-[var(--dropdown-border)] rounded-2xl p-2 shadow-[var(--dropdown-shadow),var(--dropdown-inset-shadow),0_20px_45px_rgba(0,0,0,0.7)] z-50 backdrop-blur-[16px] overflow-hidden flex flex-col gap-1 pointer-events-auto"
                          onMouseEnter={() => handleNavMouseEnter(dropdown.id)}
                          onMouseLeave={handleNavMouseLeave}
                        >
                          {dropdown.items.map((item) => {
                            const ItemIcon = item.icon;
                            const isItemActive = location.pathname === item.to;

                            return (
                              <Link
                                key={item.to}
                                data-tutorial-id={item.tutorialId}
                                to={item.to}
                                onClick={() => setActiveNavDropdown(null)}
                                className={`group/item flex items-center justify-between p-2.5 rounded-xl transition-all duration-150 text-left no-underline cursor-pointer ${
                                  isItemActive
                                    ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                                    : 'hover:bg-black/5 dark:hover:bg-white/[0.08] text-[var(--text)]'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`w-9 h-9 rounded-xl ${item.bgColor} border ${item.borderColor} flex items-center justify-center ${item.color} group-hover/item:scale-105 transition-transform flex-shrink-0`}
                                  >
                                    <ItemIcon size={17} style={item.iconRotate ? { transform: `rotate(${item.iconRotate})` } : undefined} />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`font-bold text-[14px] leading-snug group-hover/item:text-[var(--accent)] transition-colors whitespace-nowrap ${isItemActive ? 'text-[var(--accent)]' : 'text-[var(--text)]'}`}>
                                        {item.label}
                                      </span>
                                      {item.hasBadge && hasNewUpdate && (
                                        <span className="px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-white bg-red-500 rounded-full leading-none shadow-sm">
                                          New
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] text-[var(--text-muted)] font-normal truncate">
                                      {item.description}
                                    </span>
                                  </div>
                                </div>

                                {/* Animated Arrow coming out smoothly from text on hover */}
                                <div className="relative flex items-center justify-center w-5 h-5 flex-shrink-0 ml-1">
                                  <div className="text-[var(--accent)] opacity-0 -translate-x-2.5 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-200 ease-out flex items-center">
                                    <ArrowRight size={15} strokeWidth={2.5} />
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
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
              className="mobile-nav-dropdown xl:hidden fixed top-[92px] left-3 right-3 bg-[var(--dropdown-bg)] border border-[var(--dropdown-border)] rounded-2xl py-2 px-1 shadow-[var(--dropdown-shadow),var(--dropdown-inset-shadow),0_20px_40px_rgba(0,0,0,0.6)] z-50 backdrop-blur-[16px] overflow-hidden max-h-[calc(100vh-110px)] overflow-y-auto"
            >
              <div className="flex flex-col gap-2 p-1">
                {NAV_DROPDOWNS.map((category) => (
                  <div key={category.id} className="flex flex-col">
                    <div className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      {category.label}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {category.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isItemActive = location.pathname === item.to;

                        return (
                          <Link
                            key={item.to}
                            data-tutorial-id={item.tutorialId}
                            to={item.to}
                            onClick={() => setShowMobileNav(false)}
                            className={`group/mob flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 text-left no-underline ${
                              isItemActive
                                ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                                : 'hover:bg-black/5 dark:hover:bg-white/[0.08] text-[var(--text)]'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-lg ${item.bgColor} border ${item.borderColor} flex items-center justify-center ${item.color} flex-shrink-0`}>
                                <ItemIcon size={16} style={item.iconRotate ? { transform: `rotate(${item.iconRotate})` } : undefined} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className={`font-bold text-[13.5px] leading-snug group-hover/mob:text-[var(--accent)] transition-colors ${isItemActive ? 'text-[var(--accent)]' : 'text-[var(--text)]'}`}>
                                    {item.label}
                                  </span>
                                  {item.hasBadge && hasNewUpdate && (
                                    <span className="px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-white bg-red-500 rounded-full leading-none shadow-sm">
                                      New
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-[var(--text-muted)] font-normal truncate">
                                  {item.description}
                                </span>
                              </div>
                            </div>
                            <ChevronRight size={15} className="text-[var(--text-muted)] group-hover/mob:text-[var(--accent)] group-hover/mob:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
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
            <div className="h-6 md:h-7 w-[1px] bg-[var(--border-color)] flex-shrink-0" />

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

                {user.nameColor1 && user.nameColor2 ? (
                  <span
                    className="animated-gradient-username-wrapper max-w-[85px] sm:max-w-[120px] md:max-w-[170px]"
                    style={{ "--grad-c1": user.nameColor1, "--grad-c2": user.nameColor2 }}
                  >
                    <span className="animated-gradient-username font-bold text-[13px] sm:text-[14px] md:text-[16px] tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
                      {user.username}
                    </span>
                  </span>
                ) : (
                  <span className="font-bold text-[var(--text)] text-[13px] sm:text-[14px] md:text-[16px] tracking-wide group-hover:text-[var(--accent)] transition-colors duration-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[85px] sm:max-w-[120px] md:max-w-[170px]">
                    {user.username}
                  </span>
                )}

                <ChevronDown
                  strokeWidth={3}
                  className={`w-5 h-5 sm:w-4.5 sm:h-4.5 min-w-[20px] min-h-[20px] text-[var(--text)] group-hover:text-[var(--accent)] transition-transform duration-200 flex-shrink-0 ${
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
                    <div className="relative flex items-center justify-between gap-3 p-2.5 pb-3.5 border-b border-[var(--border-color)] mb-2">
                      <div className="flex flex-col min-w-0 flex-1 z-10">
                        <span className="text-[12px] text-[var(--text-muted)] font-medium tracking-wide">
                          Hello,
                        </span>
                        {user.nameColor1 && user.nameColor2 ? (
                          <span
                            className="animated-gradient-username-wrapper inline-block truncate"
                            style={{ "--grad-c1": user.nameColor1, "--grad-c2": user.nameColor2 }}
                          >
                            <span className="animated-gradient-username font-extrabold text-[18px] leading-snug truncate">
                              {user.username}
                            </span>
                          </span>
                        ) : (
                          <span className="font-extrabold text-[var(--text)] text-[18px] leading-snug truncate">
                            {user.username}
                          </span>
                        )}
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
                        className="group flex items-center justify-between p-2 rounded-xl transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/[0.07] text-left no-underline"
                        onClick={handleCloseMenu}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 group-hover:scale-105 transition-all">
                            <User size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[var(--text)] text-[14px] leading-snug group-hover:text-cyan-500 transition-colors">
                              Profile
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] font-normal">
                              View your trainer profile
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--text)] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </Link>

                      {/* Settings */}
                      <Link
                        data-tutorial-id="nav-settings"
                        to="/settings"
                        className="group flex items-center justify-between p-2 rounded-xl transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/[0.07] text-left no-underline"
                        onClick={handleCloseMenu}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:bg-sky-500/20 group-hover:scale-105 transition-all">
                            <Settings size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[var(--text)] text-[14px] leading-snug group-hover:text-sky-500 transition-colors">
                              Settings
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] font-normal">
                              Manage your preferences
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--text)] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </Link>

                      {/* Backup */}
                      <Link
                        to="/backup"
                        className="group flex items-center justify-between p-2 rounded-xl transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/[0.07] text-left no-underline"
                        onClick={handleCloseMenu}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 group-hover:scale-105 transition-all">
                            <Database size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[var(--text)] text-[14px] leading-snug group-hover:text-purple-500 transition-colors">
                              Backup
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] font-normal">
                              Export or restore your data
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--text)] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </Link>

                      {/* Admin */}
                      {user?.isAdmin && (
                        <Link
                          to="/admin"
                          className="group flex items-center justify-between p-2 rounded-xl transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/[0.07] text-left no-underline"
                          onClick={handleCloseMenu}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 group-hover:scale-105 transition-all">
                              <Shield size={18} />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-[var(--text)] text-[14px] leading-snug group-hover:text-amber-500 transition-colors">
                                Admin
                              </span>
                              <span className="text-[11px] text-[var(--text-muted)] font-normal">
                                Site administration panel
                              </span>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--text)] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </Link>
                      )}

                      {/* Divider */}
                      <div className="h-[1px] bg-[var(--border-color)] my-1 mx-1" />

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
                            <span className="font-bold text-[var(--text)] text-[14px] leading-snug group-hover:text-rose-400 transition-colors">
                              Logout
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] font-normal">
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
