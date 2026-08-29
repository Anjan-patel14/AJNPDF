"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  mounted: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function enforceLightTheme() {
  const root = document.documentElement;
  root.classList.remove("dark");
  root.dataset.theme = "light";
  root.style.colorScheme = "light";

  try {
    window.localStorage.removeItem("ajn_theme");
  } catch {
    // Storage can be unavailable. The light-only runtime still remains active.
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    enforceLightTheme();
    setMounted(true);
  }, []);

  const setTheme = useCallback((_requestedTheme: Theme) => {
    enforceLightTheme();
  }, []);

  const toggleTheme = useCallback(() => {
    enforceLightTheme();
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: "light", mounted, setTheme, toggleTheme }),
    [mounted, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider.");
  return value;
}
