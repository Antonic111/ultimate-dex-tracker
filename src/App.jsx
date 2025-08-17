import { useEffect, useState, useRef } from "react";
import { getCaughtKey } from './caughtStorage';
import { fetchCaughtData, updateCaughtData } from './api/caught';
import { authAPI } from './utils/api';
import { debugAPI } from './utils/debug';
import { showConfirm } from "./components/Shared/ConfirmDialog";
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
import { formatPokemonName, getLevenshteinDistance } from "./utils";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EmailSent from "./pages/EmailSent";
import { MessageProvider } from "./components/Shared/MessageContext";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import EnterResetCode from "./pages/EnterResetCode";
import { UserContext } from "./components/Shared/UserContext";
import Profile from "./pages/Profile";
import PublicHome from "./pages/PublicHome";
import HeaderWithConditionalAuth from "./Header";
import Settings from "./pages/Settings";
import { ThemeProvider } from "./components/Shared/ThemeContext";
import './css/theme.css';
import Trainers from "./pages/Trainers";
import PublicProfile from "./pages/PublicProfile";
import ViewDex from "./pages/ViewDex.jsx";
import { LoadingProvider, useLoading } from "./components/Shared/LoadingContext";
import { LoadingSpinner } from "./components/Shared";
import Footer from "./components/Shared/Footer";

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



const typeOptions = [
  "normal", "fire", "water", "grass", "electric", "ice", "fighting", "poison", "ground", "flying",
  "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"
];


const TYPE_OPTIONS = Array.from(
  new Set([
    ...pokemonData.flatMap(p => p.types),
    ...formsData.flatMap(p => p.types)
  ])
).sort();

const GEN_OPTIONS = Array.from(
  new Set([
    ...pokemonData.map(p => p.gen),
    ...formsData.map(p => p.gen)
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
  "alpha"
];

const dexSections = [
  {
    key: "main",
    title: "Main Living Dex",
    getList: () => pokemonData
  },
  ...FORM_TYPES.map(type => ({
    key: type,
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} Forms`,
    getList: () => formsData.filter(p => p.formType === type)
  }))
];

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
  });
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const userMenuRef = useRef(null);
  const [authReady, setAuthReady] = useState(false);

  // Helper to check if user is still logged in
  const checkAuth = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      console.log('🔐 Checking authentication...');
      const data = await authAPI.getCurrentUser();
      console.log('✅ Authentication successful:', data);
      setUser({
        username: data.username,
        email: data.email ?? null,
        createdAt: data.createdAt ?? null,
        profileTrainer: data.profileTrainer ?? "ash.png",
        verified: data.verified,
        progressBars: data.progressBars || [],
      });
    } catch (error) {
      console.log('❌ Authentication failed:', error.message);
      // Clear user data on authentication failure
      setUser({
        username: null,
        email: null,
        createdAt: null,
        profileTrainer: null,
        verified: false,
        progressBars: [],
      });
    } finally {
      if (!silent) setLoading(false);
      setAuthReady(true);
    }
  };


  // Initial auth check on page load
  useEffect(() => {
    setAuthReady(false);
    checkAuth(false);
  }, []);

  useEffect(() => {
  // close sidebar on login/logout
  setSidebarOpen(false);
  setSelectedPokemon(null);
}, [user?.username]);

useEffect(() => {
  const onPageShow = (e) => {
    if (e.persisted || document.wasDiscarded) {
      checkAuth(true); // silent refresh: does NOT set loading/authReady
    }
  };
  window.addEventListener("pageshow", onPageShow);
  return () => window.removeEventListener("pageshow", onPageShow);
}, []);


  const [caught, setCaught] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [toggles, setToggles] = useState(() => loadDexToggles());
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

  // Listen for localStorage changes from other components (like ViewDex)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "dexToggles") {
        try {
          const newToggles = JSON.parse(e.newValue || "{}");
          console.log('App - Storage change detected:', newToggles);
          setToggles(prev => ({ ...prev, ...newToggles }));
        } catch (error) {
          console.error('App - Error parsing storage change:', error);
        }
      }
    };
    
    // Listen for custom events from ViewDex
    const handleToggleChange = (e) => {
      console.log('App - Custom toggle change event:', e.detail);
      setToggles(prev => ({ ...prev, ...e.detail }));
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dexTogglesChanged', handleToggleChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dexTogglesChanged', handleToggleChange);
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
    caught: ""
  });

  useEffect(() => {
    if (!user?.username) return;
    fetchCaughtData(user.username).then(data => {
      setCaughtInfoMap(data || {});
      const caughtMap = {};
      for (const key in data) {
        caughtMap[key] = !!data[key];
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


  // Collect all keys for main + form Pokémon
  const allMonKeys = [
    ...pokemonData.map(p => getCaughtKey(p)),
    ...formsData.map(p => getCaughtKey(p))
  ];

  const totalCount = allMonKeys.length;
  const caughtCount = Object.values(caught).filter(Boolean).length;

  const [caughtInfoMap, setCaughtInfoMap] = useState({});


  function filterMons(list, forceShowForms = false) {
    return list.filter(poke => {
      // 🧬 Respect toggle or force flag
      if (!forceShowForms && !showForms && poke.formType && poke.formType !== "main" && poke.formType !== "default") {
        return false;
      }
      const info = caughtInfoMap[getCaughtKey(poke)] || {};

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

        if (!nameMatch && !dexMatch) return false;
      }
      // Game
      if (filters.game && info.game !== filters.game) return false;
      // Ball
      if (filters.ball && info.ball !== filters.ball) return false;
      // Mark
      if (filters.mark && info.mark !== filters.mark) return false;
      // Method
      if (filters.method && info.method !== filters.method) return false;
      // Type (must match at least one)
      if (filters.type && !(poke.types || []).includes(filters.type)) return false;
      // Gen
      if (filters.gen && String(poke.gen) !== String(filters.gen)) return false;
      // Caught/uncaught
      if (filters.caught === "caught" && !caught[getCaughtKey(poke)]) return false;
      if (filters.caught === "uncaught" && caught[getCaughtKey(poke)]) return false;

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



function updateCaughtInfo(poke, info) {
  const key = getCaughtKey(poke);

  setCaughtInfoMap(prev => {
    // If we're resetting/clearing data
    if (info == null) {
      const updated = { ...prev, [key]: null };
      updateCaughtData(user.username, key, null); // persist delete
      return updated;
    }

    // Clean checks safely
    const checksStr = info.checks == null ? "" : String(info.checks).trim();
    const cleanedInfo = {
      ...info,
      checks: checksStr === "0" ? "" : checksStr,
    };

    const updated = { ...prev, [key]: cleanedInfo };
    updateCaughtData(user.username, key, cleanedInfo); // persist update
    return updated;
  });

  // caught = true if we have info, false if we cleared it
  setCaught(prev => ({ ...prev, [key]: !!info }));

  // keep sidebar in sync
  if (sidebarOpen) setSelectedPokemon(poke);
}

  function handleSelectPokemon(poke) {
    setSidebarOpen(true);
    setSelectedPokemon(poke);
  }

  async function handleMarkAll(box) {
    const allMarked = box.every(p => caught[getCaughtKey(p)]);

    // 🔍 Check for any Pokémon that has saved info
    if (allMarked) {
      const hasInfo = box.some(p => {
        const key = getCaughtKey(p);
        const info = caughtInfoMap[key];
        return hasMeaningfulInfo(info);
      });

      if (hasInfo) {
        const confirmed = await showConfirm(
          `Unmarking will delete saved info for one or more Pokémon in this section. Continue?`
        );
        if (!confirmed) return;
      }
    }

    const newCaughtMap = { ...caught };
    const newInfoMap = { ...caughtInfoMap };

    box.forEach(p => {
      const key = getCaughtKey(p);
      const shouldBeCaught = !allMarked;

      newCaughtMap[key] = shouldBeCaught;

      if (shouldBeCaught) {
        // ✅ Only add fresh info if there isn't already info saved
        if (!newInfoMap[key]) {
          const freshInfo = {
            date: "",
            ball: BALL_OPTIONS[0].value,
            mark: MARK_OPTIONS[0].value,
            method: METHOD_OPTIONS[0],
            game: GAME_OPTIONS[0].value,
            checks: "",
            notes: ""
          };
          newInfoMap[key] = freshInfo;
        }
      } else {
        newInfoMap[key] = null; // explicitly mark as deleted
      }
    });

    setCaught(newCaughtMap);
    setCaughtInfoMap(newInfoMap);

    // ✅ Save full update to server
    updateCaughtData(user.username, null, newInfoMap);

    if (selectedPokemon) {
      const affected = box.find(p => getCaughtKey(p) === getCaughtKey(selectedPokemon));
      if (affected) {
        setSelectedPokemon({ ...selectedPokemon });
      }
    }

  }




  // App.jsx
  async function handleToggleCaught(poke) {
    const key = getCaughtKey(poke);

    if (caught[key]) {
      const info = caughtInfoMap[key];
      if (hasMeaningfulInfo(info)) {
        const confirmed = await showConfirm(
          `Doing this will delete ALL info for ${formatPokemonName(poke?.name)}. Are you sure you wanna continue?`
        );

        if (!confirmed) return;
      }
    }

    setCaught(prev => {
      const newState = { ...prev, [key]: !prev[key] };

      if (!prev[key]) {
        const freshInfo = {
          date: "",
          ball: BALL_OPTIONS[0].value,
          mark: MARK_OPTIONS[0].value,
          method: METHOD_OPTIONS[0],
          game: GAME_OPTIONS[0].value,
          checks: "",
          notes: ""
        };

        setCaughtInfoMap(prevInfoMap => ({
          ...prevInfoMap,
          [key]: freshInfo
        }));
        updateCaughtData(user.username, key, freshInfo);
      } else {
        setCaughtInfoMap(prevInfoMap => {
          const updated = { ...prevInfoMap };
          delete updated[key];
          return updated;
        });
        updateCaughtData(user.username, key, null);
      }

      return newState;
    });

    if (sidebarOpen && (!selectedPokemon || getCaughtKey(selectedPokemon) !== key)) {
      setSelectedPokemon(poke);
    }
  }

  let mergedMons = [];
  const seen = new Set();

  mergedMons = dexSections
    .flatMap(section => filterMons(section.getList(), showForms)) // ✅ Pass toggle state
    .filter(mon => {
      const key = getCaughtKey(mon);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const showNoResults = mergedMons.length === 0;
  let suggestion = null;

  if (showNoResults && filters.searchTerm) {
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


  return (
    <ThemeProvider>
      <LoadingProvider>
        <UserContext.Provider value={{ ...user, setUser, loading }}>
          <MessageProvider>
            <Router>

            <CloseSidebarOnRouteChange />

            <HeaderWithConditionalAuth
              user={user}
              setUser={setUser}
              showMenu={showMenu}
              setShowMenu={setShowMenu}
              userMenuRef={userMenuRef}
            />
            
            {/* Global Loading Indicator */}
            <GlobalLoadingIndicator />


            <Routes>
              {/* Main App */}
              <Route
                path="/"
                element={
                  (loading || !authReady) ? (
                    <LoadingSpinner 
                      fullScreen 
                      text="Loading..." 
                      variant="dots"
                      size="large"
                    />
                  ) : user?.username ? (

                    <>
                      <ProgressManager
                        allMons={[...pokemonData, ...formsData]}
                        caughtInfoMap={caughtInfoMap}
                      />

                      <SearchBar
                        filters={filters}
                        setFilters={setFilters}
                        typeOptions={typeOptions}
                        genOptions={GEN_OPTIONS}
                        showShiny={showShiny}
                        setShowShiny={setShowShiny}
                        showForms={showForms}
                        setShowForms={setShowForms}
                      />

                      <div className="main-bg">
                        {(filters.searchTerm || filters.game || filters.ball || filters.type || filters.gen || filters.mark || filters.method || filters.caught)
                          ? dexSections.map(section => {
                            const filteredMons = filterMons(section.getList(), showForms)
                              .sort((a, b) => a.id - b.id);
                            if (!filteredMons.length) return null;

                            return (
                              <DexSection
                                readOnly={false}
                                caughtInfoMap={caughtInfoMap}
                                updateCaughtInfo={updateCaughtInfo}
                                key={section.key}
                                sidebarOpen={sidebarOpen}
                                title={section.title}
                                pokemonList={filteredMons}
                                caught={caught}
                                onMarkAll={handleMarkAll}
                                onToggleCaught={handleToggleCaught}
                                onSelect={handleSelectPokemon}
                                showShiny={showShiny}
                                showForms={true}
                              />
                            );
                          })
                          : dexSections.map(section => {
                            const filteredMons = filterMons(section.getList());
                            if (!filteredMons.length) return null;

                            return (
                              <DexSection
                                readOnly={false}
                                caughtInfoMap={caughtInfoMap}
                                updateCaughtInfo={updateCaughtInfo}
                                key={section.key}
                                sidebarOpen={sidebarOpen}
                                title={section.title}
                                pokemonList={filteredMons}
                                caught={caught}
                                onMarkAll={handleMarkAll}
                                onToggleCaught={handleToggleCaught}
                                onSelect={handleSelectPokemon}
                                showShiny={showShiny}
                                showForms={showForms}
                              />
                            );
                          })}
                      </div>

                        {showNoResults && filters.searchTerm && (
                         <NoResults
                           searchTerm={filters.searchTerm}
                           suggestion={suggestion}
                           onSuggestionClick={(suggestion) => setFilters(f => ({ ...f, searchTerm: suggestion }))}
                         />
                        )}


                      <Sidebar
                        open={sidebarOpen}
                        pokemon={selectedPokemon}
                        onClose={() => {
                          setSidebarOpen(false);
                          setSelectedPokemon(null);
                        }}
                        caughtInfo={selectedPokemon ? caughtInfoMap[getCaughtKey(selectedPokemon)] : null}
                        updateCaughtInfo={updateCaughtInfo}
                        showShiny={showShiny}
                      />
                    </>
                  ) : (
                    <PublicHome />
                  )
                }
              />

              <Route
                path="/login"
                element={user.username ? <Navigate to="/" /> : <Login onLogin={setUser} />}
              />
              <Route
                path="/register"
                element={user.username ? <Navigate to="/" /> : <Register onRegister={setUser} />}
              />
              <Route
                path="/email-sent"
                element={!user.username ? <EmailSent /> : <Navigate to="/" />}
              />
              <Route
                path="/forgot-password"
                element={!user.username ? <ForgotPassword /> : <Navigate to="/" />}
              />
              <Route
                path="/reset-password"
                element={!user.username ? <ResetPassword /> : <Navigate to="/" />}
              />
              <Route
                path="/enter-reset-code"
                element={!user.username ? <EnterResetCode /> : <Navigate to="/" />}
              />
              <Route
                path="/profile"
                element={
                  <RequireAuth loading={loading} authReady={authReady} user={user}>
                    <Profile />
                  </RequireAuth>
                }
              />

              <Route path="/trainers" element={<Trainers />} />
              <Route path="/u/:username" element={<PublicProfile />} />
              <Route path="/u/:username/dex" element={<ViewDex />} />

              <Route
                path="/settings"
                element={
                  <RequireAuth loading={loading} authReady={authReady} user={user}>
                    <Settings />
                  </RequireAuth>
                }
              />

            </Routes>
            
            <Footer />
            
          </Router>
        </MessageProvider>
      </UserContext.Provider>
        </LoadingProvider>
    </ThemeProvider>
  );
}
