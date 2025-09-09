import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

// "light" | "dark" | "system"
const THEME_KEY = "theme";
const ACCENT_KEY = "accent";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "dark");
  const [accent, setAccent] = useState(() => localStorage.getItem(ACCENT_KEY) || "yellow");

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

  // Apply resolved theme to <html> and persist user's choice ("system" is stored as-is)
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

  // Accent handling (unchanged)
  useEffect(() => {
    localStorage.setItem(ACCENT_KEY, accent);
    document.documentElement.style.setProperty("--accent", accentMap[accent]);
    document.documentElement.style.setProperty("--accent-hover", accentHoverMap[accent]);
  }, [accent]);

  // Keep your toggle cycling just light <-> dark (leaves "system" to the cards UI)
  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  // Expose resolvedTheme for assets (logos, etc.)
  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, toggleTheme, accent, setAccent, resolvedTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
