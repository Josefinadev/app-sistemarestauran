/* ═══════════════════════════════════════════════════════════
   APP NAVIGATOR — Navegación principal de la App Mesero
   - Si no hay sesión: LoginScreen
   - Si hay sesión: Bottom Tab Navigator
     → Pedidos (items listos para servir)
     → Tomar Pedido (crear nuevo pedido)
     → Mesas (estado de mesas)
     → Perfil (info + logout + configuración)
   ═══════════════════════════════════════════════════════════ */

import React, { useMemo } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";

import LoginScreen from "../screens/LoginScreen";
import PedidosScreen from "../screens/PedidosScreen";
import TomarPedidoScreen from "../screens/TomarPedidoScreen";
import MesasScreen from "../screens/MesasScreen";
import PerfilScreen from "../screens/PerfilScreen";

import { Spacing, Radius, FontSize, FontWeight, type ThemeColors } from "../config/theme";

const Tab = createBottomTabNavigator();

function LoadingScreen() {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <View style={[styles.loadingIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="restaurant" size={36} color={colors.primary} />
      </View>
      <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      <Text style={[styles.loadingText, { color: colors.text }]}>El Mijano</Text>
      <Text style={[styles.loadingSubtext, { color: colors.textMuted }]}>Cargando...</Text>
    </View>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, isDark } = useAppTheme();

  const navTheme = useMemo(
    () => ({
      dark: isDark,
      colors: {
        primary: colors.primary,
        background: colors.background,
        card: colors.tabBar,
        text: colors.text,
        border: colors.tabBarBorder,
        notification: colors.error,
      },
      fonts: Platform.select({
        ios: {
          regular: { fontFamily: "System", fontWeight: "400" as const },
          medium: { fontFamily: "System", fontWeight: "500" as const },
          bold: { fontFamily: "System", fontWeight: "700" as const },
          heavy: { fontFamily: "System", fontWeight: "800" as const },
        },
        default: {
          regular: { fontFamily: "sans-serif", fontWeight: "normal" as const },
          medium: { fontFamily: "sans-serif-medium", fontWeight: "normal" as const },
          bold: { fontFamily: "sans-serif", fontWeight: "bold" as const },
          heavy: { fontFamily: "sans-serif", fontWeight: "bold" as const },
        },
      })!,
    }),
    [colors, isDark]
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopWidth: 1,
            borderTopColor: colors.tabBarBorder,
            height: 74,
            paddingBottom: 14,
            paddingTop: 8,
            position: "absolute" as const,
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: FontWeight.medium,
            letterSpacing: 0.2,
          },
          tabBarIcon: ({ focused, color }) => {
            let iconName: keyof typeof Ionicons.glyphMap = "apps";

            switch (route.name) {
              case "Pedidos":
                iconName = focused ? "receipt" : "receipt-outline";
                break;
              case "Nuevo":
                iconName = focused ? "add-circle" : "add-circle-outline";
                break;
              case "Mesas":
                iconName = focused ? "grid" : "grid-outline";
                break;
              case "Perfil":
                iconName = focused ? "person-circle" : "person-circle-outline";
                break;
            }

            return <Ionicons name={iconName} size={22} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="Pedidos"
          component={PedidosScreen}
          options={{ tabBarLabel: "Pedidos" }}
        />
        <Tab.Screen
          name="Nuevo"
          component={TomarPedidoScreen}
          options={{ tabBarLabel: "Nuevo" }}
        />
        <Tab.Screen
          name="Mesas"
          component={MesasScreen}
          options={{ tabBarLabel: "Mesas" }}
        />
        <Tab.Screen
          name="Perfil"
          component={PerfilScreen}
          options={{ tabBarLabel: "Perfil" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingIcon: {
    width: 76,
    height: 76,
    borderRadius: Radius.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: FontSize.sm,
    marginTop: 4,
  },
});
