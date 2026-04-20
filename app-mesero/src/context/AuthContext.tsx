/* ═══════════════════════════════════════════════════════════
   AUTH CONTEXT — Gestión de sesión del mesero
   Persiste en AsyncStorage para mantener sesión activa.
   ═══════════════════════════════════════════════════════════ */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { AuthUsuario, Restaurante } from "../types";
import {
  loginAuth,
  saveAuthToken,
  clearAuthToken,
  saveUserData,
  getUserData,
  saveRestauranteData,
  getRestauranteData,
  getAuthMe,
} from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthContextType {
  usuario: AuthUsuario | null;
  restaurante: Restaurante | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  restaurante: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<AuthUsuario | null>(null);
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurar sesión al montar
  useEffect(() => {
    const restore = async () => {
      try {
        const token = await AsyncStorage.getItem("mesero-auth-token");
        if (token) {
          // Verificar token con el backend
          const data = await getAuthMe();
          setUsuario(data.usuario);
          setRestaurante(data.restaurante);
        }
      } catch (err) {
        // Token inválido, limpiar
        await clearAuthToken();
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginAuth(email, password);

    // Verificar que el rol sea mesero o admin
    if (data.usuario.rol !== "mesero" && data.usuario.rol !== "admin") {
      throw new Error("Esta app es exclusiva para meseros. Contacta al administrador.");
    }

    await saveAuthToken(data.access_token);
    await saveUserData(data.usuario);
    await saveRestauranteData(data.restaurante);

    setUsuario(data.usuario);
    setRestaurante(data.restaurante);
  }, []);

  const logout = useCallback(async () => {
    await clearAuthToken();
    setUsuario(null);
    setRestaurante(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        restaurante,
        isAuthenticated: !!usuario,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
