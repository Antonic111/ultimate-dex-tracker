import { useEffect, useState, useRef, useCallback } from "react";
import { getCaughtKey, migrateOldCaughtData } from './caughtStorage';
import { fetchCaughtData, updateCaughtData } from './api/caught';
import { migrateHuntMethods } from './utils/migrateHuntMethods';
import { authAPI, profileAPI } from './utils/api';
import { debugAPI } from './utils/debug';

import { BALL_OPTIONS, GAME_OPTIONS, MARK_OPTIONS, METHOD_OPTIONS } from "./Constants";
import "./css/App.css";
import formsData from "./data/forms.json";
import detectivePikachu from "./data/pikachu.png";
import pokemonData from "./data/pokemon.json";
import DexSection from "./components/Dex/DexSection";
import Sidebar from "./components/Dex/PokemonSidebar";
import ProgressManager from "./components/Progress/ProgressManager";
import SearchBar from "./components/Shared/SearchBar";
import NoResults from "./components/Shared/NoResults";
import { formatPokemonName, getLevenshteinDistance, getEvolutionChainIds, findPokemon } from "./utils";
import { isLegendary, isMythical, isUltraBeast, isPseudoLegendary, isSubLegendary, isStarter, isFossil, isBaby, isParadox, getPokemonCategory } from "./utils/pokemonCategories";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { MessageProvider } from "./components/Shared/MessageContext";
import { UserContext } from "./components/Shared/UserContext";
import HeaderWithConditionalAuth from "./Header";
import { ThemeProvider } from "./components/Shared/ThemeContext";
import './css/theme.css';
// import './css/pageAnimations.css'; // Moved to backup folder

// Lazy load routes for code splitting
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const EmailSent = lazy(() => import("./pages/EmailSent"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const EnterResetCode = lazy(() => import("./pages/EnterResetCode"));
const Profile = lazy(() => import("./pages/Profile"));
const PublicHome = lazy(() => import("./pages/PublicHome"));
const Settings = lazy(() => import("./pages/Settings"));
const Backup = lazy(() => import("./pages/Backup"));
const Trainers = lazy(() => import("./pages/Trainers"));
const Counters = lazy(() => import("./pages/Counters"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const ViewDex = lazy(() => import("./pages/ViewDex.jsx"));
const Changelog = lazy(() => import("./pages/Changelog"));
const Admin = lazy(() => import("./pages/Admin"));
import { LoadingProvider, useLoading } from "./components/Shared/LoadingContext";
import { LoadingSpinner } from "./components/Shared";
import Footer from "./components/Shared/Footer";
import CustomScrollbar from "./components/Shared/CustomScrollbar";
import { getFilteredFormsData, getDexPreferences } from "./utils/dexPreferences";
import { createPortal } from "react-dom";
import { RotateCcw } from "lucide-react";

// Mobile Keyboard Handler Hook
const useMobileKeyboardHandler = () => {
  useEffect(() => {
    // Only run on mobile devices
    const isMobile = () => window.innerWidth <= 768;
    
    if (!isMobile()) return;

    let initialViewportHeight = window.innerHeight;
    let isSidebarOpen = false;
    let savedScrollY = 0;
    
    const handleResize = () => {
      const newHeight = window.innerHeight;
      
      // If height decreased significantly, keyboard likely appeared
      if (newHeight < initialViewportHeight * 0.8) {
        // Add padding to bottom to account for keyboard
        document.body.style.paddingBottom = `${initialViewportHeight - newHeight}px`;
      }
      // If height increased back to normal, keyboard likely disappeared
      else if (newHeight >= initialViewportHeight * 0.95) {
        document.body.style.paddingBottom = '0px';
      }
    };

    // Prevent main page scrolling when sidebar is open on mobile
    const preventScroll = () => {
      if (isMobile()) {
        savedScrollY = window.scrollY;
        document.body.classList.add('sidebar-open');
        document.body.style.top = `-${savedScrollY}px`;
      }
    };

    const allowScroll = () => {
      if (isMobile()) {
        document.body.classList.remove('sidebar-open');
        document.body.style.top = '';
        window.scrollTo(0, savedScrollY);
      }
    };

    // Listen for sidebar open/close events
    const handleSidebarOpen = () => {
      isSidebarOpen = true;
      preventScroll();
    };

    const handleSidebarClose = () => {
      isSidebarOpen = false;
      allowScroll();
    };

    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('sidebarOpen', handleSidebarOpen);
    window.addEventListener('sidebarClose', handleSidebarClose);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('sidebarOpen', handleSidebarOpen);
      window.removeEventListener('sidebarClose', handleSidebarClose);
      document.body.style.paddingBottom = '0px';
      document.body.classList.remove('sidebar-open');
      document.body.style.top = '';
    };
  }, []);
};

// Global Loading Indicator Component
const GlobalLoadingIndicator = () => {
  const { globalLoading } = useLoading();
  
  if (!globalLoading) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '3px',
      backgroundColor: 'var(--accent)',
      zIndex: 10000,
      animation: 'loading-bar 2s ease-in-out infinite'
    }}>
      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

// Location Listener Component for detecting navigation to home page
const LocationListener = ({ onNavigateToHome }) => {
  const location = useLocation();
  const prevLocationRef = useRef(location.pathname);
  
  useEffect(() => {
    const prevPath = prevLocationRef.current;
    const currentPath = location.pathname;
    
    // Only trigger if we're navigating TO the home page (not already on it)
    if (currentPath === '/' && prevPath !== '/') {
      onNavigateToHome();
    }
    
    // Update the previous location
    prevLocationRef.current = currentPath;
  }, [location.pathname, onNavigateToHome]);
  
  return null; // This component doesn't render anything
};



const typeOptions = [
  "normal", "fire", "water", "grass", "electric", "ice", "fighting", "poison", "ground", "flying",
  "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"
];


const getTypeOptions = () => Array.from(
  new Set([
    ...pokemonData.flatMap(p => p.types),
    ...getCurrentFilteredFormsData().flatMap(p => p.types)
  ])
).sort();

const getGenOptions = () => Array.from(
  new Set([
    ...pokemonData.map(p => p.gen),
    ...getCurrentFilteredFormsData().map(p => p.gen)
  ])
).filter(Boolean).sort((a, b) => a - b);

const FORM_TYPES = [
  "gender",
  "alolan",
  "galarian",
  "gmax",
  "hisuian",
  "paldean",
  "unown",
  "other",
  "alcremie",
  "vivillon",
  "alpha",
  "alphaother"
];

// Function to get filtered forms data based on current user preferences
const getCurrentFilteredFormsData = () => getFilteredFormsData(formsData);

// Function to create dex sections with current filtered forms data
const createDexSections = () => {
  const currentFilteredFormsData = getCurrentFilteredFormsData();
  
  return [
    {
      key: "main",
      title: "Main Living Dex",
      getList: () => pokemonData
    },
    ...FORM_TYPES.map(type => ({
      key: type,
      title: type === "alphaother" ? "Alpha Genders & Other's" : `${type.charAt(0).toUpperCase() + type.slice(1)} Forms`,
      getList: () => {
        const filtered = currentFilteredFormsData.filter(p => p.formType === type);
        
        // Special sorting for Alpha Forms - sort by Pokemon number (id)
        if (type === "alpha" || type === "alphaother") {
          return filtered.sort((a, b) => (a.id || 0) - (b.id || 0));
        }
        
        // Default sorting for other form types (by JSON order)
        return filtered;
      }
    }))
  ];
};





// Place near the top of App.jsx
function saveDexToggles({ showShiny, showForms }) {
  localStorage.setItem("dexToggles", JSON.stringify({ showShiny, showForms }));
}
function loadDexToggles() {
  const raw = localStorage.getItem("dexToggles");
  if (!raw) return { showShiny: false, showForms: true };
  try { return JSON.parse(raw); } catch { return { showShiny: false, showForms: true }; }
}


function hasMeaningfulInfo(info) {
  if (!info) return false;
  
  // Handle new entries format
  if (info.entries && Array.isArray(info.entries)) {
    return info.entries.some(entry => hasMeaningfulInfo(entry));
  }
  
  // Handle old format (direct fields)
  const { date, ball, mark, method, game, checks, notes } = info;

  // date filled?
  if (date && String(date).trim() !== "") return true;

  // ball / mark / game values — these are option values; if not "", they're meaningful
  if (ball) return true;
  if (mark) return true;
  if (game) return true;

  // method text
  if (method && String(method).trim() !== "") return true;

  // numeric or string checks
  if (checks !== undefined && checks !== null && String(checks).trim() !== "" && Number(checks) !== 0) return true;

  // notes
  if (notes && String(notes).trim() !== "") return true;

  return false;
}

function RequireAuth({ loading, authReady, user, children }) {
  if (loading || !authReady) {
    return null; // Don't show anything, let the Profile component handle loading
  }
  return user?.username ? children : <Navigate to="/login" replace />;
}


export default function App() {
  const [user, setUser] = useState({
    username: null,
    email: null,
    createdAt: null,
    profileTrainer: null,
    verified: false,
    progressBars: [],
  });
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const userMenuRef = useRef(null);
  const [authReady, setAuthReady] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false); // Add flag to track recent login
  const [authTimeout, setAuthTimeout] = useState(false); // Timeout flag for bots/crawlers
  const [dexSections, setDexSections] = useState(() => createDexSections());
  const [currentDexPreferences, setCurrentDexPreferences] = useState(() => getDexPreferences());

  // Mobile keyboard handling
  useMobileKeyboardHandler();

  // Memoized callback for refreshing dex preferences
  // This prevents infinite re-renders when used in LocationListener
  const refreshDexPreferences = useCallback(() => {
    const newPreferences = getDexPreferences();
    setCurrentDexPreferences(newPreferences);
    setDexSections(createDexSections());
    // Force a re-render to update all dynamic values
    setCaught(prev => ({ ...prev }));
  }, []);

  // Helper to check if user is still logged in
  const checkAuth = async (silent = false) => {
    // Skip checkAuth if user just logged in
    if (justLoggedIn) {
      return;
    }

    try {
      // Mobile-specific: Add retry logic for initial auth check
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      let userData = null;
      let authError = null;

      if (isMobile) {
        // Try up to 3 times on mobile with delays
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            userData = await authAPI.getCurrentUser();
            break; // Success, exit retry loop
          } catch (error) {
            authError = error;
            if (attempt < 3) {
              console.log(`Mobile auth attempt ${attempt} failed, retrying...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
        }
      } else {
        // Desktop: single attempt
        try {
          userData = await authAPI.getCurrentUser();
        } catch (error) {
          authError = error;
        }
      }

      // Check if user is authenticated
      if (userData && userData.username) {
        // Preserve existing progress bars if the server response doesn't include them
        const existingProgressBars = user.progressBars || [];
        const serverProgressBars = userData.progressBars || [];
        
        const finalProgressBars = serverProgressBars.length > 0 
          ? serverProgressBars 
          : existingProgressBars;
        
        setUser({
          ...userData,
          progressBars: finalProgressBars
        });
      } else if (authError) {
        // Handle authentication failure
        console.log('Auth check failed:', authError.message);
        
        // For mobile devices, try a more robust fallback approach
        if (isMobile) {
          try {
            let backupData = null;
            
            // Try localStorage first
            const mobileBackup = localStorage.getItem('mobileUserBackup');
            if (mobileBackup) {
              backupData = JSON.parse(mobileBackup);
            }
            
            // iOS fallback: Try sessionStorage if localStorage failed
            const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
            if (!backupData && isIOS) {
              const iosBackup = sessionStorage.getItem('iosUserBackup');
              if (iosBackup) {
                backupData = JSON.parse(iosBackup);
              }
            }
            
            if (backupData) {
              const isRecent = (Date.now() - backupData.timestamp) < (2 * 60 * 60 * 1000); // 2 hours instead of 24
              
              // Only use backup if it has essential fields and is recent
              if (isRecent && backupData.username && backupData.verified !== undefined) {
                console.log('Using mobile backup data');
                setUser(backupData);
                
                // Try to refresh the data in the background
                setTimeout(async () => {
                  try {
                    const freshData = await authAPI.getCurrentUser();
                    if (freshData && freshData.username) {
                      console.log('Background refresh successful, updating user data');
                      setUser(freshData);
                    }
                  } catch (refreshError) {
                    console.log('Background refresh failed, keeping backup data');
                  }
                }, 1000);
                
                return; // Don't clear user data, use backup instead
              }
            }
          } catch (backupError) {
            console.log('Mobile backup failed:', backupError.message);
          }
        }
        
        // Clear user data if no valid backup or not mobile
        setUser(null);
      } else {
        // Clear user data if not authenticated
        setUser(null);
      }
    } catch (error) {
      console.log('Auth check failed:', error.message);
      setUser(null);
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setAuthReady(true);
    }
  };

  // Custom setUser function that handles login properly
  const handleUserUpdate = (newUserData) => {
    
    // If this is a login (has username and progressBars), set the flag
    if (newUserData.username && newUserData.progressBars) {
      setJustLoggedIn(true);
    }
    
    setUser(newUserData);
    
    // Mobile fallback: Store user data in localStorage as backup
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isMobile && newUserData && newUserData.username) {
      try {
        // Ensure we have all essential fields for backup
        const backupData = {
          username: newUserData.username,
          email: newUserData.email,
          verified: newUserData.verified,
          createdAt: newUserData.createdAt,
          profileTrainer: newUserData.profileTrainer,
          progressBars: newUserData.progressBars || [],
          timestamp: Date.now(),
          isIOS: isIOS
        };
        
        localStorage.setItem('mobileUserBackup', JSON.stringify(backupData));
        
        // iOS-specific: Also store in sessionStorage as additional fallback
        if (isIOS) {
          sessionStorage.setItem('iosUserBackup', JSON.stringify(backupData));
        }
        
        console.log('Mobile backup data stored successfully');
        
      } catch (error) {
        console.log('Mobile backup storage failed:', error.message);
      }
    }
    
    // Clear the flag after a short delay
    if (newUserData.username && newUserData.progressBars) {
      setTimeout(() => {
        setJustLoggedIn(false);
      }, 2000);
    }
  };


  // Initial auth check on page load
  useEffect(() => {
    setAuthReady(false);
    setAuthTimeout(false);
    
    // Detect if this is a bot/crawler (Google AdSense, Googlebot, etc.)
    const userAgent = navigator.userAgent.toLowerCase();
    const isBot = /googlebot|adsbot|mediapartners|adsense|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebot|ia_archiver/i.test(userAgent);
    
    // For bots/crawlers, set a short timeout to show content quickly
    if (isBot) {
      // Show content after 500ms for bots (they won't wait long)
      const botTimeout = setTimeout(() => {
        setAuthTimeout(true);
        setAuthReady(true);
        setLoading(false);
      }, 500);
      
      // Still try to check auth, but don't wait for it
      checkAuth(false).finally(() => {
        clearTimeout(botTimeout);
        setAuthTimeout(false);
      });
    } else {
      // For regular users, set a timeout so page doesn't hang forever
      const userTimeout = setTimeout(() => {
        setAuthTimeout(true);
        setAuthReady(true);
        setLoading(false);
      }, 3000); // 3 second timeout for regular users
      
      checkAuth(false).finally(() => {
        clearTimeout(userTimeout);
        setAuthTimeout(false);
      });
    }
  }, []);



useEffect(() => {
  // close sidebar on login/logout
  setSidebarOpen(false);
  setSelectedPokemon(null);
}, [user?.username]);

useEffect(() => {
  const onPageShow = (e) => {
    // Skip auth refresh if user just logged in or if we have valid user data
    if (justLoggedIn) {
      return;
    }
    
    // Only refresh auth if the page was restored from cache AND we don't have valid user data
    if ((e.persisted || document.wasDiscarded) && (!user?.username || !user?.verified)) {
      checkAuth(true); // silent refresh: does NOT set loading/authReady
    }
  };
  window.addEventListener("pageshow", onPageShow);
  return () => window.removeEventListener("pageshow", onPageShow);
}, [user?.username, user?.verified, justLoggedIn]);


  const [caught, setCaught] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [toggles, setToggles] = useState(() => loadDexToggles());
  const [externalLinkPreference, setExternalLinkPreference] = useState('serebii');
  
  // Reset modal state for grid clicks and bulk operations
  const [resetModal, setResetModal] = useState({ 
    show: false, 
    pokemon: null, 
    pokemonName: '', 
    isShiny: false, 
    isBulkReset: false, 
    box: null 
  });
  const [resetModalClosing, setResetModalClosing] = useState(false);
  const showShiny = toggles.showShiny;
  const showForms = toggles.showForms;


  const setShowShiny = val => setToggles(prev => {
    const updated = { ...prev, showShiny: val };
    saveDexToggles(updated);
    
    // Dispatch custom event to notify ViewDex component
    window.dispatchEvent(new CustomEvent('dexTogglesChanged', { detail: updated }));
    
    return updated;
  });
  const setShowForms = val => setToggles(prev => {
    const updated = { ...prev, showForms: val };
    saveDexToggles(updated);
    
    // Dispatch event to notify ViewDex component
    window.dispatchEvent(new CustomEvent('dexTogglesChanged', { detail: updated }));
    
    return updated;
  });

  // Load external link preference when user changes
  useEffect(() => {
    if (user?.username) {
      (async () => {
        try {
          const data = await profileAPI.getProfile();
          const preference = data?.externalLinkPreference || 'serebii';
          setExternalLinkPreference(preference);
          // Also save to localStorage as backup
          localStorage.setItem('externalLinkPreference', preference);
        } catch (error) {
          console.error('Failed to load external link preference:', error);
        }
      })();
    }
  }, [user?.username]);

  // Load external link preference from localStorage on initial load
  useEffect(() => {
    const savedPreference = localStorage.getItem('externalLinkPreference');
    if (savedPreference) {
      setExternalLinkPreference(savedPreference);
    }
  }, []);

  // Listen for external link preference changes
  useEffect(() => {
    const handleExternalLinkPreferenceChange = async () => {
      try {
        const data = await profileAPI.getProfile();
        setExternalLinkPreference(data?.externalLinkPreference || 'serebii');
      } catch (error) {
        console.error('Failed to load external link preference:', error);
      }
    };

    window.addEventListener('externalLinkPreferenceChanged', handleExternalLinkPreferenceChange);
    
    return () => {
      window.removeEventListener('externalLinkPreferenceChanged', handleExternalLinkPreferenceChange);
    };
  }, []);

  // Listen for localStorage changes from other components (like ViewDex)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "dexToggles") {
        try {
          const newToggles = JSON.parse(e.newValue || "{}");
          setToggles(prev => ({ ...prev, ...newToggles }));
        } catch (error) {
          // Handle error silently
        }
      }
    };
    
    // Listen for custom events from ViewDex
    const handleToggleChange = (e) => {
      setToggles(prev => ({ ...prev, ...e.detail }));
    };
    
    // Listen for dex preferences refresh event (from logo click)
    const handleRefreshDexPreferences = refreshDexPreferences;
    
    // Listen for dex preferences changes
    const handleDexPreferencesChanged = () => {
      const newPreferences = getDexPreferences();
      setCurrentDexPreferences(newPreferences);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dexTogglesChanged', handleToggleChange);
    window.addEventListener('refreshDexPreferences', handleRefreshDexPreferences);
    window.addEventListener('dexPreferencesChanged', handleDexPreferencesChanged);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dexTogglesChanged', handleToggleChange);
      window.removeEventListener('refreshDexPreferences', handleRefreshDexPreferences);
      window.removeEventListener('dexPreferencesChanged', handleDexPreferencesChanged);
    };
  }, []);


  const [filters, setFilters] = useState({
    searchTerm: "",
    game: "",
    ball: "",
    type: "",
    gen: "",
    mark: "",
    method: "",
    caught: "",
    showEvolutions: false
  });

  useEffect(() => {
    if (!user?.username) return;
    fetchCaughtData(user.username).then(data => {
      // Check if user needs migration - be more explicit about the check
      let migratedData;
      const needsMigration = user.huntMethodMigrationCompleted === false || user.huntMethodMigrationCompleted === undefined;
      
      // Additional check: prevent migration if already done in this session
      const migrationKey = `migration_completed_${user.username}`;
      const alreadyMigratedThisSession = localStorage.getItem(migrationKey);
      
      console.log(`Migration check for ${user.username}:`, {
        huntMethodMigrationCompleted: user.huntMethodMigrationCompleted,
        migrationVersion: user.migrationVersion,
        needsMigration,
        alreadyMigratedThisSession
      });
      
      if (alreadyMigratedThisSession) {
        console.log(`User ${user.username} already migrated in this session - skipping`);
        migratedData = data || {};
      } else if (needsMigration) {
        console.log(`Migrating hunt methods for user: ${user.username} (migration status: ${user.huntMethodMigrationCompleted})`);
        // Set localStorage flag immediately to prevent multiple runs
        localStorage.setItem(migrationKey, 'true');
        // Migrate hunt methods to new system if needed
        migratedData = migrateHuntMethods(data || {});
        
        // Save migrated data back to database if changes were made
        if (migratedData !== data) {
          updateCaughtData(user.username, null, migratedData).then(() => {
            // Mark migration as completed
            authAPI.updateUser({ huntMethodMigrationCompleted: true, migrationVersion: "1.1" })
              .then(() => {
                console.log(`Migration completed for user: ${user.username}`);
                localStorage.setItem(migrationKey, 'true');
                // Update local user state to prevent re-migration
                setUser(prevUser => ({
                  ...prevUser,
                  huntMethodMigrationCompleted: true,
                  migrationVersion: "1.1"
                }));
              })
              .catch(console.error);
          }).catch(console.error);
        } else {
          // No data changes needed, but mark as migrated
          authAPI.updateUser({ huntMethodMigrationCompleted: true, migrationVersion: "1.1" })
            .then(() => {
              console.log(`Migration marked as completed for user: ${user.username} (no data changes needed)`);
              localStorage.setItem(migrationKey, 'true');
              // Update local user state to prevent re-migration
              setUser(prevUser => ({
                ...prevUser,
                huntMethodMigrationCompleted: true,
                migrationVersion: "1.1"
              }));
            })
            .catch(console.error);
        }
      } else {
        // User already migrated, use existing data
        console.log(`User ${user.username} already migrated (version: ${user.migrationVersion})`);
        migratedData = data || {};
      }
      
      setCaughtInfoMap(migratedData);
      const caughtMap = {};
      for (const key in migratedData) {
        const info = migratedData[key];
        // Check if Pokemon is actually caught (has entries or is marked as caught)
        if (info && typeof info === 'object') {
          // New format: check if it has entries or is marked as caught
          if (info.entries && Array.isArray(info.entries) && info.entries.length > 0) {
            caughtMap[key] = true;
          } else if (info.caught === true) {
            caughtMap[key] = true;
          } else {
            caughtMap[key] = false;
          }
        } else {
          // Old format: simple boolean check
          caughtMap[key] = !!info;
        }
      }
      setCaught(caughtMap);
    });
  }, [user?.username]);


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // Function to get all keys for main + form Pokémon
  const getAllMonKeys = () => [
    ...pokemonData.map(p => getCaughtKey(p)),
    ...getCurrentFilteredFormsData().map(p => getCaughtKey(p))
  ];

  const totalCount = getAllMonKeys().length;
  const caughtCount = Object.values(caught).filter(Boolean).length;

  const [caughtInfoMap, setCaughtInfoMap] = useState({});

  // Load cached caught info immediately for seamless refreshes
  useEffect(() => {
    if (!user?.username) return;
    try {
      const raw = localStorage.getItem(`caughtInfoMap:${user.username}`);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached && typeof cached === 'object') {
          setCaughtInfoMap(prev => (Object.keys(prev).length ? prev : cached));
          // Derive caught booleans from cache for instant UI
          const caughtMap = {};
          for (const key in cached) {
            const info = cached[key];
            if (info && typeof info === 'object') {
              if (info.entries && Array.isArray(info.entries) && info.entries.length > 0) {
                caughtMap[key] = true;
              } else if (info.caught === true) {
                caughtMap[key] = true;
              } else {
                caughtMap[key] = false;
              }
            } else {
              caughtMap[key] = !!info;
            }
          }
          setCaught(prev => (Object.keys(prev).length ? prev : caughtMap));
        }
      }
    } catch {}
  }, [user?.username]);

  // Persist caught info to cache on change
  useEffect(() => {
    if (!user?.username) return;
    try {
      localStorage.setItem(`caughtInfoMap:${user.username}`, JSON.stringify(caughtInfoMap));
    } catch {}
  }, [caughtInfoMap, user?.username]);

  // Migration: Convert old caught data to new format when component mounts
  useEffect(() => {
    if (Object.keys(caughtInfoMap).length > 0 && user?.username) {
      const migratedData = migrateOldCaughtData(caughtInfoMap);
      
      if (JSON.stringify(migratedData) !== JSON.stringify(caughtInfoMap)) {
        setCaughtInfoMap(migratedData);
        // Save migrated data to backend
        updateCaughtData(user.username, null, migratedData).then(() => {
          // Force a refresh of the caught data to ensure UI updates
          fetchCaughtData(user.username).then(freshData => {
            setCaughtInfoMap(freshData);
            // Also refresh the caught state
            const caughtMap = {};
            for (const key in freshData) {
              const info = freshData[key];
              if (info && typeof info === 'object') {
                if (info.entries && Array.isArray(info.entries) && info.entries.length > 0) {
                  caughtMap[key] = true;
                } else if (info.caught === true) {
                  caughtMap[key] = true;
                } else {
                  caughtMap[key] = false;
                }
              } else {
                caughtMap[key] = !!info;
              }
            }
            setCaught(caughtMap);
          });
        }).catch((error) => {
          console.error("Migration failed:", error);
        });
      }
    }
  }, [caughtInfoMap, user?.username]);

  // Listen for caught data changes from other components (like Counters page)
  useEffect(() => {
    const handleCaughtDataChanged = (event) => {
      const { pokemon, caughtInfo, caughtKey } = event.detail;
      console.log('App.jsx - Received caughtDataChanged event:', { pokemon, caughtInfo, caughtKey });
      
      // Update the caughtInfoMap with the new data
      setCaughtInfoMap(prev => {
        const updated = {
          ...prev,
          [caughtKey]: caughtInfo
        };
        console.log('App.jsx - Updated caughtInfoMap:', updated);
        return updated;
      });
      
      // Update the caught boolean map
      setCaught(prev => {
        const updated = {
          ...prev,
          [caughtKey]: true
        };
        console.log('App.jsx - Updated caught map:', updated);
        return updated;
      });
    };

    window.addEventListener('caughtDataChanged', handleCaughtDataChanged);
    
    return () => {
      window.removeEventListener('caughtDataChanged', handleCaughtDataChanged);
    };
  }, []);

  // Prevent scrolling when reset modal is open
  useEffect(() => {
    const preventScroll = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    if (resetModal.show) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('wheel', preventScroll, { passive: false });
      document.addEventListener('touchmove', preventScroll, { passive: false });
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
    }
    
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
    };
  }, [resetModal.show]);

  function filterMons(list, forceShowForms = false, isShiny = false) {
    return list.filter(poke => {
      // 🧬 Respect toggle or force flag
      if (!forceShowForms && !showForms && poke.formType && poke.formType !== "main" && poke.formType !== "default") {
        return false;
      }
      
      // Get caught info for the appropriate shiny status
      const info = caughtInfoMap[getCaughtKey(poke, null, isShiny)] || {};
      
      // Get the first entry for filtering (or use old structure for backward compatibility)
      const firstEntry = info.entries?.[0] || info;

      // Search by name/dex
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const nameMatch = poke.name.toLowerCase().includes(term);
        // If search is a number, do exact match (allow both raw and padded search)
        let dexMatch = false;
        if (!isNaN(Number(term))) {
          dexMatch =
            poke.id.toString() === term ||
            poke.id.toString().padStart(4, "0") === term;
        } else {
          dexMatch = poke.id.toString().padStart(4, "0").includes(term);
        }

        // If showEvolutions is enabled, check if any pokemon in the evolution chain matches
        if (!nameMatch && !dexMatch) {
          if (filters.showEvolutions) {
            const chainIds = getEvolutionChainIds(poke);
            // Check if any pokemon in the chain matches the search
            const chainMatches = chainIds.some(chainId => {
              const chainPoke = findPokemon(chainId);
              if (!chainPoke) return false;
              const chainNameMatch = chainPoke.name.toLowerCase().includes(term);
              let chainDexMatch = false;
              if (!isNaN(Number(term))) {
                chainDexMatch =
                  chainPoke.id.toString() === term ||
                  chainPoke.id.toString().padStart(4, "0") === term;
              } else {
                chainDexMatch = chainPoke.id.toString().padStart(4, "0").includes(term);
              }
              return chainNameMatch || chainDexMatch;
            });
            if (!chainMatches) return false;
          } else {
            return false;
          }
        }
      }
      // Game
      if (filters.game && firstEntry.game !== filters.game) return false;
      // Ball
      if (filters.ball && firstEntry.ball !== filters.ball) return false;
      // Mark
      if (filters.mark && firstEntry.mark !== filters.mark) return false;
      // Method
      if (filters.method && firstEntry.method !== filters.method) return false;
      // Type (must match at least one)
      if (filters.type && !(poke.types || []).includes(filters.type)) return false;
      // Gen
      if (filters.gen && String(poke.gen) !== String(filters.gen)) return false;
      // Caught/uncaught - check the appropriate shiny status
      const caughtKey = getCaughtKey(poke, null, isShiny);
      if (filters.caught === "caught" && !caught[caughtKey]) return false;
      if (filters.caught === "uncaught" && caught[caughtKey]) return false;
      
      // Category filtering
      if (filters.categories && filters.categories.length > 0) {
        const pokemonCategory = getPokemonCategory(poke);
        const matchesAnyCategory = filters.categories.some(category => {
          switch (category) {
            case "legendary":
              return isLegendary(poke);
            case "mythical":
              return isMythical(poke);
            case "ultra-beast":
              return isUltraBeast(poke);
            case "pseudo-legendary":
              return isPseudoLegendary(poke);
            case "sub-legendary":
              return isSubLegendary(poke);
            case "paradox":
              return isParadox(poke);
            case "starter":
              return isStarter(poke);
            case "fossil":
              return isFossil(poke);
            case "baby":
              return isBaby(poke);
            default:
              return false;
          }
        });
        
        if (!matchesAnyCategory) return false;
      }

      return true;
    });
  }

function CloseSidebarOnRouteChange() {
  const location = useLocation();
  useEffect(() => {
    const isDex = location.pathname === "/" || location.pathname.startsWith("/dex");
    if (!isDex) {
      setSidebarOpen(false);
      setSelectedPokemon(null);
    }
  }, [location.pathname]);
  return null;
}



  function updateCaughtInfo(poke, info, isShiny = false) {
    const key = getCaughtKey(poke, null, isShiny);



  setCaughtInfoMap(prev => {
    // If we're resetting/clearing data
    if (info == null) {
      console.log("  - Clearing data for key:", key);
      const updated = { ...prev, [key]: null };
      if (user?.username) {
        console.log("  - Calling updateCaughtData with null");
        updateCaughtData(user.username, key, null); // persist delete
      }
      return updated;
    }

    // Normalize data for backend schema (checks is Number or omitted)
    const checksStr = info.checks == null ? "" : String(info.checks).trim();
    const cleanedInfo = { ...info };
    if (checksStr === "" || checksStr === "0") {
      delete cleanedInfo.checks;
    } else if (!Number.isNaN(Number(checksStr))) {
      cleanedInfo.checks = Number(checksStr);
    } else {
      delete cleanedInfo.checks;
    }

    console.log("  - cleanedInfo:", cleanedInfo);

    const updated = { ...prev, [key]: cleanedInfo };
    if (user?.username) {
      console.log("  - Calling updateCaughtData with:", cleanedInfo);
      updateCaughtData(user.username, key, cleanedInfo); // persist update
    }
    return updated;
  });

  // caught = true if we have info, false if we cleared it
  setCaught(prev => ({ ...prev, [key]: !!info }));

  // keep sidebar in sync - only switch when caught status actually changes
  if (sidebarOpen && selectedPokemon) {
    // Check if it's a different Pokémon (different ID) or different form (same ID but different name/formType)
    const isDifferentPokemon = selectedPokemon.id !== poke.id;
    const isDifferentForm = selectedPokemon.id === poke.id && selectedPokemon.name !== poke.name;
    
    if (isDifferentPokemon || isDifferentForm) {
      console.log("Sidebar is open, switching to newly caught pokemon:", poke.name, "form:", poke.formType);
      setSelectedPokemon(poke);
    }
  }
}

  function handleSelectPokemon(poke) {
    setSidebarOpen(true);
    setSelectedPokemon(poke);
  }

  async function handleMarkAll(box, isShiny = false) {
    const allMarked = box.every(p => caught[getCaughtKey(p, null, isShiny)]);

    // 🔍 Check for any Pokémon that has saved info
    if (allMarked) {
      const hasInfo = box.some(p => {
        const key = getCaughtKey(p, null, isShiny);
        const info = caughtInfoMap[key];
        return hasMeaningfulInfo(info);
      });

      if (hasInfo) {
        // Show reset modal instead of old confirm dialog
        const boxNames = box.map(p => formatPokemonName(p.name));
        const uniqueNames = [...new Set(boxNames)];
        const displayNames = uniqueNames.length <= 3 
          ? uniqueNames.join(', ') 
          : `${uniqueNames.slice(0, 2).join(', ')} and ${uniqueNames.length - 2} others`;
        
        setResetModal({ 
          show: true, 
          pokemon: null, // Special case for bulk reset
          pokemonName: displayNames, 
          isShiny: isShiny,
          isBulkReset: true,
          box: box
        });
        setResetModalClosing(false);
        return;
      }
    }

    const newCaughtMap = { ...caught };
    const newInfoMap = { ...caughtInfoMap };
    const delta = {};

    box.forEach(p => {
      const key = getCaughtKey(p, null, isShiny);
      const shouldBeCaught = !allMarked;

      newCaughtMap[key] = shouldBeCaught;

      if (shouldBeCaught) {
        // ✅ Only add fresh info if there isn't already info saved
        if (!newInfoMap[key]) {
          const newEntry = {
            date: "",
            ball: BALL_OPTIONS[0].value,
            mark: MARK_OPTIONS[0].value,
            method: METHOD_OPTIONS[0],
            game: GAME_OPTIONS[0].value,
            checks: "",
            notes: "",
            entryId: Math.random().toString(36).substr(2, 9)
          };
          
          const freshInfo = {
            caught: true,
            entries: [newEntry]
          };
          
          newInfoMap[key] = freshInfo;
          delta[key] = freshInfo;
        }
      } else {
        newInfoMap[key] = null; // explicitly mark as deleted
        delta[key] = null;
      }
    });

    setCaught(newCaughtMap);
    setCaughtInfoMap(newInfoMap);

    // ✅ Send only the changes to server and wait for completion to avoid overwrite on refresh
    try {
      // Prefer delta patch if available; fall back to full save if empty
      if (Object.keys(delta).length > 0 && typeof window !== 'undefined') {
        // Use API helper directly to avoid circular import
        const { caughtAPI } = await import('./utils/api.js');
        await caughtAPI.patchCaughtData({ changes: delta });
      } else if (user?.username) {
        await updateCaughtData(user.username, null, newInfoMap);
      }
    } catch (e) {
      // swallow; UI already updated optimistically
    }



  }




  // App.jsx
  async function handleToggleCaught(poke, isShiny = false) {
    const key = getCaughtKey(poke, null, isShiny);

    if (caught[key]) {
      const info = caughtInfoMap[key];
      if (hasMeaningfulInfo(info)) {
        // Show reset modal instead of old confirm dialog
        setResetModal({ 
          show: true, 
          pokemon: poke, 
          pokemonName: formatPokemonName(poke?.name), 
          isShiny: isShiny 
        });
        setResetModalClosing(false);
        return;
      }
    }

    setCaught(prev => {
      const newState = { ...prev, [key]: !prev[key] };

      if (!prev[key]) {
        const newEntry = {
          date: "",
          ball: BALL_OPTIONS[0].value,
          mark: MARK_OPTIONS[0].value,
          method: METHOD_OPTIONS[0],
          game: GAME_OPTIONS[0].value,
          checks: "",
          notes: "",
          entryId: Math.random().toString(36).substr(2, 9)
        };

        const freshInfo = {
          caught: true,
          entries: [newEntry]
        };

        setCaughtInfoMap(prevInfoMap => ({
          ...prevInfoMap,
          [key]: freshInfo
        }));
        if (user?.username) {
          updateCaughtData(user.username, key, freshInfo);
        }
      } else {
        setCaughtInfoMap(prevInfoMap => {
          const updated = { ...prevInfoMap };
          delete updated[key];
          return updated;
        });
        if (user?.username) {
          updateCaughtData(user.username, key, null);
        }
      }

      return newState;
    });

    // keep sidebar in sync - switch to newly caught pokemon
    if (sidebarOpen && selectedPokemon) {
      // Check if it's a different Pokémon (different ID) or different form (same ID but different name/formType)
      const isDifferentPokemon = selectedPokemon.id !== poke.id;
      const isDifferentForm = selectedPokemon.id === poke.id && selectedPokemon.name !== poke.name;
      
      if (isDifferentPokemon || isDifferentForm) {
        console.log("Sidebar is open, switching to newly toggled pokemon:", poke.name, "form:", poke.formType);
        setSelectedPokemon(poke);
      }
    }
  }

  // Handle reset confirmation from grid click or bulk operations
  const handleResetConfirm = () => {
    // Close modal with animation
    setResetModalClosing(true);
    setTimeout(() => {
      setResetModal({ 
        show: false, 
        pokemon: null, 
        pokemonName: '', 
        isShiny: false, 
        isBulkReset: false, 
        box: null 
      });
      setResetModalClosing(false);
    }, 300);
    
    if (resetModal.isBulkReset && resetModal.box) {
      // Handle bulk reset (Unmark All)
      const newCaughtMap = { ...caught };
      const newInfoMap = { ...caughtInfoMap };
      const delta = {};
      
      resetModal.box.forEach(p => {
        const key = getCaughtKey(p, null, resetModal.isShiny);
        newCaughtMap[key] = false;
        newInfoMap[key] = null;
        delta[key] = null;
      });
      
      setCaught(newCaughtMap);
      setCaughtInfoMap(newInfoMap);
      
      // Send changes to server
      if (user?.username) {
        try {
          const { caughtAPI } = import('./utils/api.js');
          caughtAPI.patchCaughtData({ changes: delta });
        } catch (e) {
          // Fallback to full save
          updateCaughtData(user.username, null, newInfoMap);
        }
      }
      
      // Close sidebar if any of these Pokémon were selected
      if (selectedPokemon && resetModal.box.some(p => getCaughtKey(p, null, resetModal.isShiny) === getCaughtKey(selectedPokemon, null, showShiny))) {
        setSelectedPokemon(null);
        setSidebarOpen(false);
      }
    } else if (resetModal.pokemon) {
      // Handle individual reset (grid click)
      const key = getCaughtKey(resetModal.pokemon, null, resetModal.isShiny);
      
      // Actually reset the Pokémon data
      setCaught(prev => ({ ...prev, [key]: false }));
      setCaughtInfoMap(prev => ({ ...prev, [key]: null }));
      if (user?.username) {
        updateCaughtData(user.username, key, null);
      }
      
      // Close sidebar if this Pokémon was selected
      if (selectedPokemon && getCaughtKey(selectedPokemon, null, showShiny) === key) {
        setSelectedPokemon(null);
        setSidebarOpen(false);
      }
    }
  };

  let mergedMons = [];
  const seen = new Set();

     // Use current shiny state for search suggestions
   mergedMons = dexSections
     .flatMap(section => filterMons(section.getList(), showForms, showShiny))
     .filter(mon => {
      const key = getCaughtKey(mon, null, showShiny);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const showNoResults = mergedMons.length === 0;
  let suggestion = null;

  // Check if we have any active search criteria
  const hasActiveSearch = filters.searchTerm || filters.game || filters.ball || filters.mark || filters.method || filters.type || filters.gen || filters.caught || (filters.categories && filters.categories.length > 0);

  if (showNoResults && hasActiveSearch) {
    // Only provide suggestions for name/dex searches, not for other filter types
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      const allNames = dexSections.flatMap(section =>
        section.getList().map(p => p.name)
      );

      const ranked = allNames
        .map(name => ({
          name,
          score:
            getLevenshteinDistance(searchTerm, name.toLowerCase()) -
            (name.toLowerCase().startsWith(searchTerm) ? 2 : 0) -
            (name.toLowerCase().includes(searchTerm) ? 1 : 0)
        }))
        .sort((a, b) => a.score - b.score);

      if (ranked.length && ranked[0].score <= 4) {
        suggestion = ranked[0].name;
      }
    }
  }


  return (
    <ThemeProvider>
      <LoadingProvider>
        <UserContext.Provider value={{ ...user, setUser: handleUserUpdate, loading }}>
          <MessageProvider>
            <Router>
              <div className="flex flex-col min-h-screen">
                <CloseSidebarOnRouteChange />

                <HeaderWithConditionalAuth
                  user={user}
                  setUser={handleUserUpdate}
                  showMenu={showMenu}
                  setShowMenu={setShowMenu}
                  userMenuRef={userMenuRef}
                />
                
                {/* Global Loading Indicator */}
                <GlobalLoadingIndicator />
                
                {/* Location Listener for detecting navigation to home page */}
                <LocationListener onNavigateToHome={refreshDexPreferences} />

                <main className="flex-grow">
                  <Routes>
                    {/* Main App */}
                    <Route
                      path="/"
                      element={
                        // Only show loading spinner if we haven't timed out and auth isn't ready
                        (!authTimeout && (loading || !authReady)) ? (
                          <LoadingSpinner 
                            fullScreen 
                            text="Loading..." 
                            variant="spinner"
                            size="large"
                          />
                        ) : user?.username ? (

                          <>
                            <div className="progress-manager-container page-animate-1">
                              <ProgressManager
                                allMons={[...pokemonData, ...getFilteredFormsData(formsData, currentDexPreferences)]}
                                caughtInfoMap={caughtInfoMap}
                                progressBarsOverride={user.progressBars}
                                showShiny={showShiny}
                                dexPreferences={currentDexPreferences}
                              />

                            </div>

                            <div className="search-bar-container page-animate-2">
                              <SearchBar
                                filters={filters}
                                setFilters={setFilters}
                                typeOptions={typeOptions}
                                genOptions={getGenOptions()}
                                showShiny={showShiny}
                                setShowShiny={setShowShiny}
                              />
                            </div>

                            {/* Mobile tip below the entire search section, above categories/grid */}
                            <div className="md:hidden w-full mt-3 mb-5 px-3 fade-in-up page-animate-3">
                              <div
                                className="text-sm rounded-md px-3 py-2"
                                style={{
                                  background: 'var(--searchbar-dropdown)',
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text)'
                                }}
                              >
                                <ul className="list-disc pl-5 space-y-1">
                                  <li>Tap a Pokémon to toggle caught.</li>
                                  <li>Hold to open the sidebar.</li>
                                </ul>
                              </div>
                            </div>

                            <div className="main-bg page-container fade-in-up">
                           {/* Dynamic Dex Grid based on showShiny toggle */}
                           {showShiny ? (
                             // Show Shiny Pokémon Grid
                             <div className="dex-grid-section">
                               {(filters.searchTerm || filters.game || filters.ball || filters.type || filters.gen || filters.mark || filters.method || filters.caught)
                                                                 ? dexSections.map(section => {
                                  const filteredMons = filterMons(section.getList(), showForms, true)
                                    .sort((a, b) => a.id - b.id);
                                  if (!filteredMons.length) return null;

                                   return (
                                     <DexSection
                                       readOnly={false}
                                       caughtInfoMap={caughtInfoMap}
                                       updateCaughtInfo={(poke, info) => updateCaughtInfo(poke, info, true)}
                                       key={`shiny_${section.key}`}
                                       sidebarOpen={sidebarOpen}
                                       title={section.title}
                                       pokemonList={filteredMons}
                                       caught={caught}
                                       isCaught={(poke) => caught[getCaughtKey(poke, null, true)] || false}
                                       onMarkAll={(box) => handleMarkAll(box, true)}
                                       onToggleCaught={(poke) => handleToggleCaught(poke, true)}
                                       onSelect={handleSelectPokemon}
                                       showShiny={true}
                                       showForms={showForms}
                                     />
                                   );
                                 })
                                                                   : dexSections.map(section => {
                                    const filteredMons = filterMons(section.getList(), false, true);
                                    if (!filteredMons.length) return null;

                                   return (
                                     <DexSection
                                       readOnly={false}
                                       caughtInfoMap={caughtInfoMap}
                                       updateCaughtInfo={(poke, info) => updateCaughtInfo(poke, info, true)}
                                       key={`shiny_${section.key}`}
                                       sidebarOpen={sidebarOpen}
                                       title={section.title}
                                       pokemonList={filteredMons}
                                       caught={caught}
                                       isCaught={(poke) => caught[getCaughtKey(poke, null, true)] || false}
                                       onMarkAll={(box) => handleMarkAll(box, true)}
                                       onToggleCaught={(poke) => handleToggleCaught(poke, true)}
                                       onSelect={handleSelectPokemon}
                                       showShiny={true}
                                       showForms={showForms}
                                     />
                                   );
                                 })}
                             </div>
                           ) : (
                             // Show Regular Pokémon Grid
                             <div className="dex-grid-section">
                               {(filters.searchTerm || filters.game || filters.ball || filters.type || filters.gen || filters.mark || filters.method || filters.caught)
                                                                 ? dexSections.map(section => {
                                  const filteredMons = filterMons(section.getList(), showForms, false)
                                    .sort((a, b) => a.id - b.id);
                                  if (!filteredMons.length) return null;

                                   return (
                                     <DexSection
                                       readOnly={false}
                                       caughtInfoMap={caughtInfoMap}
                                       updateCaughtInfo={(poke, info) => updateCaughtInfo(poke, info, false)}
                                       key={`regular_${section.key}`}
                                       sidebarOpen={sidebarOpen}
                                       title={section.title}
                                       pokemonList={filteredMons}
                                       caught={caught}
                                       isCaught={(poke) => caught[getCaughtKey(poke, null, false)] || false}
                                       onMarkAll={(box) => handleMarkAll(box, false)}
                                       onToggleCaught={(poke) => handleToggleCaught(poke, false)}
                                       onSelect={handleSelectPokemon}
                                       showShiny={false}
                                       showForms={showForms}
                                     />
                                   );
                                 })
                                                                 : dexSections.map(section => {
                                  const filteredMons = filterMons(section.getList(), false, false);
                                  if (!filteredMons.length) return null;

                                   return (
                                     <DexSection
                                       readOnly={false}
                                       caughtInfoMap={caughtInfoMap}
                                       updateCaughtInfo={(poke, info) => updateCaughtInfo(poke, info, false)}
                                       key={`regular_${section.key}`}
                                       sidebarOpen={sidebarOpen}
                                       title={section.title}
                                       pokemonList={filteredMons}
                                       caught={caught}
                                       isCaught={(poke) => caught[getCaughtKey(poke, null, false)] || false}
                                       onMarkAll={(box) => handleMarkAll(box, false)}
                                       onToggleCaught={(poke) => handleToggleCaught(poke, false)}
                                       onSelect={handleSelectPokemon}
                                       showShiny={false}
                                       showForms={showForms}
                                     />
                                   );
                                 })}
                             </div>
                           )}
                         </div>


                          {showNoResults && hasActiveSearch && (
                           <NoResults
                             searchTerm={filters.searchTerm || "your search filters"}
                             suggestion={suggestion}
                             onSuggestionClick={(suggestion) => setFilters(f => ({ ...f, searchTerm: suggestion }))}
                           />
                          )}


                        {selectedPokemon && (() => {
                          const key = getCaughtKey(selectedPokemon, null, showShiny);
                          const caughtInfo = caughtInfoMap[key];
                          return (
                            <Sidebar
                              open={!!selectedPokemon}
                              pokemon={selectedPokemon}
                              onClose={() => setSelectedPokemon(null)}
                              caughtInfo={caughtInfo}
                              updateCaughtInfo={updateCaughtInfo}
                              showShiny={showShiny}
                              onPokemonSelect={setSelectedPokemon}
                              externalLinkPreference={externalLinkPreference}
                            />
                          );
                        })()}
                      </>
                    ) : (
                      <Suspense fallback={<LoadingSpinner fullScreen text="Loading..." variant="spinner" size="large" />}>
                        <PublicHome />
                      </Suspense>
                    )
                  }
                />

                <Route
                  path="/login"
                  element={
                    <Suspense fallback={<LoadingSpinner fullScreen text="Loading..." variant="spinner" size="large" />}>
                      {user?.username ? <Navigate to="/" /> : <Login onLogin={handleUserUpdate} />}
                    </Suspense>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <Suspense fallback={<LoadingSpinner fullScreen text="Loading..." variant="spinner" size="large" />}>
                      {user?.username ? <Navigate to="/" /> : <Register onRegister={handleUserUpdate} />}
                    </Suspense>
                  }
                />
                <Route
                  path="/email-sent"
                  element={
                    <Suspense fallback={<LoadingSpinner fullScreen text="Loading..." variant="spinner" size="large" />}>
                      {!user?.username ? <EmailSent /> : <Navigate to="/" />}
                    </Suspense>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <Suspense fallback={<LoadingSpinner fullScreen text="Loading..." variant="spinner" size="large" />}>
                      {!user?.username ? <ForgotPassword /> : <Navigate to="/" />}
                    </Suspense>
                  }
                />
                <Route
                  path="/reset-password"
                  element={
                    <Suspense fallback={<LoadingSpinner fullScreen text="Loading..." variant="spinner" size="large" />}>
                      {!user?.username ? <ResetPassword /> : <Navigate to="/" />}
                    </Suspense>
                  }
                />
                <Route
                  path="/enter-reset-code"
                  element={
                    <Suspense fallback={<LoadingSpinner fullScreen text="Loading..." variant="spinner" size="large" />}>
                      {!user?.username ? <EnterResetCode /> : <Navigate to="/" />}
                    </Suspense>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <RequireAuth loading={loading} authReady={authReady} user={user}>
                      <Suspense fallback={<LoadingSpinner fullScreen text="Loading..." variant="spinner" size="large" />}>
                        <Profile />
                      </Suspense>
                    </RequireAuth>
                  }
                />

                <Route 
                  path="/trainers" 
                  element={
                    <Suspense fallback={<LoadingSpinner fullScreen text="Loading..." variant="spinner" size="large" />}>
                      <Trainers />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/counters" 
                  element={
                    <RequireAuth loading={loading} authReady={authReady} user={user}>
                      <Suspense fallback={<LoadingSpinner fullScreen text="Loading..." variant="spinner" size="large" />}>
                        <Counters />
                      </Suspense>
                    </RequireAuth>
                  } 
                />
                <Route 
                  path="/changelog" 
                  element={
                    <RequireAuth loading={loading} authReady={authReady} user={user}>
                      <Suspense fallback={<LoadingSpinner fullScreen text="Loading..." variant="spinner" size="large" />}>
                        <Changelog />
                      </Suspense>
                    </RequireAuth>
                  } 
                />
                <Route 
                  path="/admin" 
                  element={
                    <RequireAuth loading={loading} authReady={authReady} user={user}>
                      <Suspense fallback={<LoadingSpinner fullScreen text="Loading..." variant="spinner" size="large" />}>
                        <Admin />
                      </Suspense>
                    </RequireAuth>
                  } 
                />
                <Route 
                  path="/u/:username" 
                  element={
                    <Suspense fallback={<LoadingSpinner fullScreen text="Loading..." variant="spinner" size="large" />}>
                      <PublicProfile />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/u/:username/dex" 
                  element={
                    <Suspense fallback={<LoadingSpinner fullScreen text="Loading..." variant="spinner" size="large" />}>
                      <ViewDex />
                    </Suspense>
                  } 
                />

                <Route
                  path="/settings"
                  element={
                    <RequireAuth loading={loading} authReady={authReady} user={user}>
                      <Suspense fallback={<LoadingSpinner fullScreen text="Loading..." variant="spinner" size="large" />}>
                        <Settings />
                      </Suspense>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/backup"
                  element={
                    <RequireAuth loading={loading} authReady={authReady} user={user}>
                      <Suspense fallback={<LoadingSpinner fullScreen text="Loading..." variant="spinner" size="large" />}>
                        <Backup />
                      </Suspense>
                    </RequireAuth>
                  }
                />

                  </Routes>
                </main>
                
                <Footer />
                
                {/* Custom Scrollbar for Desktop */}
                <CustomScrollbar />
              </div>
            </Router>
            
            {/* Reset Modal for Grid Clicks */}
            {resetModal.show && createPortal(
              <div
                className={`fixed inset-0 z-[20000] ${resetModalClosing ? 'animate-[fadeOut_0.3s_ease-in_forwards]' : 'animate-[fadeIn_0.3s_ease-out]'}`}
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
              >
                <div className="bg-black/80 w-full h-full flex items-center justify-center">
                  <div
                    className={`bg-[var(--progress-bg)] border border-[#444] rounded-[20px] p-6 max-w-md w-full mx-4 shadow-xl ${resetModalClosing ? 'animate-[slideOut_0.3s_ease-in_forwards]' : 'animate-[slideIn_0.3s_ease-out]'}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                        <RotateCcw className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--accent)]">
                          {resetModal.isBulkReset ? 'Unmark All Pokémon' : 'Reset Pokémon'}
                        </h3>
                        <p className="text-sm text-[var(--progressbar-info)]">This action cannot be undone</p>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-6">
                      {resetModal.isBulkReset ? (
                        <>
                          Are you sure you want to unmark all Pokémon in this section? This will delete all saved data for <span className="font-semibold text-[var(--accent)]">{resetModal.pokemonName}</span>.
                        </>
                      ) : (
                        <>
                          Are you sure you want to reset <span className="font-semibold text-[var(--accent)]">{resetModal.pokemonName}</span>?
                          This will delete all saved data.
                        </>
                      )}
                    </p>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => {
                          setResetModalClosing(true);
                          setTimeout(() => {
                            setResetModal({ 
                              show: false, 
                              pokemon: null, 
                              pokemonName: '', 
                              isShiny: false, 
                              isBulkReset: false, 
                              box: null 
                            });
                            setResetModalClosing(false);
                          }, 300);
                        }}
                        className="px-4 py-2 rounded-lg bg-transparent border-2 border-[var(--dividers)] text-[var(--text)] hover:bg-[var(--dividers)] transition-colors font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleResetConfirm}
                        className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black hover:text-white transition-colors font-semibold"
                      >
                        {resetModal.isBulkReset ? 'Unmark All' : 'Reset Pokémon'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </MessageProvider>
        </UserContext.Provider>
      </LoadingProvider>
    </ThemeProvider>
  );
}
