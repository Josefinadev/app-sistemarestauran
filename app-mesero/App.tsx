/* ═══════════════════════════════════════════════════════════
   APP MESERO — Punto de entrada principal
   App móvil para meseros de El Mijano, conectada al mismo
   backend Express + Supabase que el dashboard web.
   ═══════════════════════════════════════════════════════════ */

import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { ThemeProvider } from "./src/context/ThemeContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
