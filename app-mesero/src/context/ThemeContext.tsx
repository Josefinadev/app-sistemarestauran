/* ═══════════════════════════════════════════════════════════
   THEME CONTEXT — Gestión del modo claro / oscuro
   Persiste la preferencia en AsyncStorage.
   Cambio instantáneo sin esperar al storage.
   ═══════════════════════════════════════════════════════════ */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkColors, LightColors, type ThemeColors } from "../config/theme";

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  colors: DarkColors,
  toggleTheme: () => {},
});

export const useAppTheme = () => useContext(ThemeContext);

const THEME_KEY = "mesero-theme-mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val === "light") setIsDark(false);
      setReady(true);
    }).catch(() => setReady(true));
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      // Fire-and-forget — no esperar al storage
      AsyncStorage.setItem(THEME_KEY, next ? "dark" : "light").catch(() => {});
      return next;
    });
  }, []);

  const colors = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
