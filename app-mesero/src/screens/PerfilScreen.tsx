/* ═══════════════════════════════════════════════════════════
   PERFIL SCREEN — Información del mesero, configuración
   y cierre de sesión. Incluye toggle de modo claro/oscuro.
   ═══════════════════════════════════════════════════════════ */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { getPedidos } from "../config/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing, Radius, FontSize, FontWeight, type ThemeColors } from "../config/theme";

export default function PerfilScreen() {
  const { usuario, restaurante, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [stats, setStats] = useState({
    totalEntregados: 0,
    pedidosHoy: 0,
  });

  const loadStats = useCallback(async () => {
    if (!restaurante) return;
    try {
      const data = await getPedidos({ id_restaurante: restaurante.id });
      const hoy = new Date().toDateString();
      let totalEntregados = 0;
      let pedidosHoy = 0;

      for (const pedido of data || []) {
        if (new Date(pedido.created_at).toDateString() === hoy) {
          pedidosHoy++;
        }
        for (const det of pedido.detalle_pedido || []) {
          if (det.estado === "ENTREGADO") totalEntregados++;
        }
      }

      setStats({ totalEntregados, pedidosHoy });
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  }, [restaurante]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que deseas salir?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar Sesión",
          style: "destructive",
          onPress: logout,
        },
      ]
    );
  };

  const initials = usuario?.nombre
    ? usuario.nombre
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.headerTitle}>Perfil</Text>
        </View>

        {/* Avatar Card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{usuario?.nombre || "Mesero"}</Text>
          <Text style={styles.userEmail}>{usuario?.email || ""}</Text>
          <View style={styles.rolBadge}>
            <Ionicons name="person" size={11} color={colors.primary} />
            <Text style={styles.rolText}>
              {(usuario?.rol || "mesero").toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Restaurant Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurante</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="restaurant" size={16} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nombre</Text>
                <Text style={styles.infoValue}>
                  {restaurante?.nombre || "—"}
                </Text>
              </View>
            </View>
            {restaurante?.direccion && (
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: colors.accentSoft }]}>
                  <Ionicons name="location" size={16} color={colors.accent} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Dirección</Text>
                  <Text style={styles.infoValue}>
                    {restaurante.direccion}
                  </Text>
                </View>
              </View>
            )}
            {restaurante?.telefono && (
              <View style={[styles.infoRow, styles.infoRowLast]}>
                <View style={[styles.infoIcon, { backgroundColor: colors.successSoft }]}>
                  <Ionicons name="call" size={16} color={colors.success} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Teléfono</Text>
                  <Text style={styles.infoValue}>
                    {restaurante.telefono}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen de Hoy</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: colors.successSoft }]}>
                <Ionicons name="checkmark-done" size={15} color={colors.success} />
              </View>
              <View>
                <Text style={styles.statValue}>{stats.totalEntregados}</Text>
                <Text style={styles.statLabel}>Entregados</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="receipt" size={15} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.statValue}>{stats.pedidosHoy}</Text>
                <Text style={styles.statLabel}>Pedidos hoy</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          <View style={styles.infoCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.infoIcon, { backgroundColor: colors.surfaceSecondary }]}>
                  <Ionicons
                    name={isDark ? "moon" : "sunny"}
                    size={16}
                    color={isDark ? colors.accent : colors.warning}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>Modo oscuro</Text>
                  <Text style={styles.infoLabel}>
                    {isDark ? "Activado" : "Desactivado"}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.surfacePressed, true: colors.primarySoft }}
                thumbColor={isDark ? colors.primary : colors.textMuted}
              />
            </View>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplicación</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: colors.infoSoft }]}>
                <Ionicons name="information-circle" size={16} color={colors.info} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Versión</Text>
                <Text style={styles.infoValue}>1.0.0</Text>
              </View>
            </View>
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <View style={[styles.infoIcon, { backgroundColor: colors.successSoft }]}>
                <Ionicons name="cloud" size={16} color={colors.success} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Estado del servidor</Text>
                <Text style={[styles.infoValue, { color: colors.success }]}>
                  Conectado
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          El Mijano © {new Date().getFullYear()}
        </Text>
      </ScrollView>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    scrollContent: {
      paddingBottom: 120,
    },
    header: {
      paddingHorizontal: Spacing.xl,
      paddingTop: 0,
      paddingBottom: Spacing.md,
    },
    headerTitle: {
      fontSize: FontSize.xxl,
      fontWeight: FontWeight.bold,
      color: c.text,
    },
    avatarCard: {
      alignItems: "center",
      paddingVertical: Spacing.xxl,
      marginHorizontal: Spacing.xl,
      backgroundColor: c.surface,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: c.border,
    },
    avatarCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: c.primarySoft,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: Spacing.md,
    },
    avatarText: {
      fontSize: FontSize.xxl,
      fontWeight: FontWeight.bold,
      color: c.primary,
    },
    userName: {
      fontSize: FontSize.xl,
      fontWeight: FontWeight.bold,
      color: c.text,
      marginBottom: Spacing.xs,
    },
    userEmail: {
      fontSize: FontSize.sm,
      color: c.textMuted,
      marginBottom: Spacing.md,
    },
    rolBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      backgroundColor: c.primarySoft,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.full,
    },
    rolText: {
      fontSize: FontSize.xs,
      fontWeight: FontWeight.semibold,
      color: c.primary,
      letterSpacing: 0.8,
    },
    section: {
      paddingHorizontal: Spacing.xl,
      marginTop: Spacing.xxl,
    },
    sectionTitle: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.semibold,
      color: c.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: Spacing.md,
    },
    infoCard: {
      backgroundColor: c.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden",
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    infoRowLast: {
      borderBottomWidth: 0,
    },
    infoIcon: {
      width: 34,
      height: 34,
      borderRadius: Radius.sm,
      justifyContent: "center",
      alignItems: "center",
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: FontSize.xs,
      color: c.textMuted,
      letterSpacing: 0.3,
    },
    infoValue: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.medium,
      color: c.text,
      marginTop: 1,
    },
    statsRow: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    statCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: Radius.md,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    statIconBg: {
      width: 32,
      height: 32,
      borderRadius: Radius.sm,
      justifyContent: "center",
      alignItems: "center",
    },
    statValue: {
      fontSize: FontSize.xl,
      fontWeight: FontWeight.bold,
      color: c.text,
      lineHeight: 22,
    },
    statLabel: {
      fontSize: FontSize.xs,
      color: c.textMuted,
      letterSpacing: 0.2,
    },
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: Spacing.lg,
    },
    settingLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      flex: 1,
    },
    logoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      marginHorizontal: Spacing.xl,
      marginTop: Spacing.xxxl,
      paddingVertical: Spacing.lg,
      borderRadius: Radius.md,
      backgroundColor: c.errorSoft,
      borderWidth: 1,
      borderColor: "rgba(248, 113, 113, 0.15)",
    },
    logoutText: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.semibold,
      color: c.error,
    },
    footer: {
      textAlign: "center",
      color: c.textMuted,
      fontSize: FontSize.xs,
      marginTop: Spacing.xxl,
      letterSpacing: 0.3,
    },
  });
