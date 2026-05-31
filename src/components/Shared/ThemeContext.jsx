import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { profileAPI } from "../../utils/api";

const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

// "light" | "dark" | "system"
const THEME_KEY = "theme";
const ACCENT_KEY = "accent";

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem(THEME_KEY) || "dark");
  const [accent, setAccentState] = useState(() => localStorage.getItem(ACCENT_KEY) || "yellow");

  // Track whether we've loaded server prefs yet (prevents overwriting server values with stale localStorage)
  const serverLoaded = useRef(false);

  // OS preference watcher for "system"
  const media = useMemo(
    () => (typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null),
    []
  );
  const [prefersDark, setPrefersDark] = useState(() => media ? media.matches : false);

  // Resolve the theme we actually apply
  const resolvedTheme = theme === "system" ? (prefersDark ? "dark" : "light") : theme;

  const accentMap = {
    yellow: "#facc15",
    red: "#ef4444",
    orange: "#f97316",
    green: "#22c55e",
    blue: "#3b82f6",
    cyan: "#06b6d4",
    purple: "#a855f7",
    pink: "#ec4899",
    brown: "#8f4d00",
  };

  const accentHoverMap = {
    yellow: "#e6cd55",
    red: "#dc2626",
    orange: "#ea580c",
    green: "#16a34a",
    blue: "#2563eb",
    cyan: "#0891b2",
    purple: "#9333ea",
    pink: "#db2777",
    brown: "#6a3c06",
  };

  // Apply resolved theme to <html> and persist to localStorage
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme, resolvedTheme]);

  // React to OS changes while in "system"
  useEffect(() => {
    if (!media) return;
    const onChange = (e) => setPrefersDark(e.matches);
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, [media]);

  // Apply accent CSS vars and persist to localStorage
  useEffect(() => {
    localStorage.setItem(ACCENT_KEY, accent);
    document.documentElement.style.setProperty("--accent", accentMap[accent]);
    document.documentElement.style.setProperty("--accent-hover", accentHoverMap[accent]);
  }, [accent]);

  // Called once after login/auth with values from the server profile
  const initFromProfile = (serverAccent, serverTheme) => {
    if (serverAccent && serverAccent !== accent) {
      setAccentState(serverAccent);
      localStorage.setItem(ACCENT_KEY, serverAccent);
    }
    if (serverTheme && serverTheme !== theme) {
      setThemeState(serverTheme);
      localStorage.setItem(THEME_KEY, serverTheme);
    }
    serverLoaded.current = true;
  };

  // Wrapper: sets locally + saves to server
  const setAccent = async (newAccent) => {
    setAccentState(newAccent);
    try {
      await profileAPI.updateProfile({ accentColor: newAccent });
    } catch (e) {
      console.error("Failed to save accent to server:", e);
    }
  };

  const setTheme = async (newTheme) => {
    setThemeState(newTheme);
    try {
      await profileAPI.updateProfile({ siteTheme: newTheme });
    } catch (e) {
      console.error("Failed to save theme to server:", e);
    }
  };

  // Keep your toggle cycling just light <-> dark
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // Expose resolvedTheme for assets (logos, etc.)
  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, toggleTheme, accent, setAccent, resolvedTheme, initFromProfile }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
