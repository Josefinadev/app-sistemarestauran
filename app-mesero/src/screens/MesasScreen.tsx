/* ═══════════════════════════════════════════════════════════
   MESAS SCREEN — Estado de mesas en tiempo real
   Muestra cada mesa con su progreso de pedido activo
   ═══════════════════════════════════════════════════════════ */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { getPedidos, getMesas } from "../config/api";
import { supabase } from "../config/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing, Radius, FontSize, FontWeight, type ThemeColors } from "../config/theme";
import type { MesaEstado } from "../types";

export default function MesasScreen() {
  const { restaurante } = useAuth();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [mesas, setMesas] = useState<MesaEstado[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!restaurante) return;
    try {
      const [mesasData, pedidosData] = await Promise.all([
        getMesas(restaurante.id),
        getPedidos({ id_restaurante: restaurante.id }),
      ]);

      // Crear mapa de mesas desde las mesas reales
      const mesaMap: Record<string, MesaEstado> = {};
      for (const m of mesasData || []) {
        mesaMap[m.id] = {
          numero: m.numero,
          pedidoActivo: false,
          platosListos: 0,
          totalPlatos: 0,
          platosEntregados: 0,
        };
      }

      // Llenar con datos de pedidos activos
      for (const pedido of pedidosData || []) {
        const mesaId = pedido.id_mesa;
        if (!mesaMap[mesaId]) continue;

        // Solo pedidos activos (no entregados/cancelados)
        if (pedido.estado === "CANCELADO") continue;

        for (const det of pedido.detalle_pedido || []) {
          mesaMap[mesaId].totalPlatos++;
          mesaMap[mesaId].pedidoActivo = true;

          if (det.estado === "LISTO") {
            mesaMap[mesaId].platosListos++;
          } else if (det.estado === "ENTREGADO") {
            mesaMap[mesaId].platosEntregados++;
          }
        }
      }

      setMesas(
        Object.values(mesaMap).sort((a, b) => a.numero - b.numero)
      );
    } catch (err) {
      console.error("Error loading mesas:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurante]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime
  useEffect(() => {
    if (!restaurante) return;

    const channel = supabase
      .channel("mesas-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedido",
          filter: `id_restaurante=eq.${restaurante.id}`,
        },
        () => loadData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "detalle_pedido" },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurante, loadData]);

  const getStatusInfo = (mesa: MesaEstado) => {
    if (!mesa.pedidoActivo) {
      return { label: "Libre", color: colors.textMuted, icon: "remove-circle-outline" as const };
    }
    if (mesa.platosListos > 0) {
      return { label: `${mesa.platosListos} por servir`, color: colors.success, icon: "checkmark-circle" as const };
    }
    if (mesa.platosEntregados === mesa.totalPlatos && mesa.totalPlatos > 0) {
      return { label: "Todo entregado", color: colors.info, icon: "ribbon" as const };
    }
    return { label: "En preparación", color: colors.accent, icon: "flame" as const };
  };

  const getProgress = (mesa: MesaEstado) => {
    if (!mesa.totalPlatos) return 0;
    return ((mesa.platosListos + mesa.platosEntregados) / mesa.totalPlatos) * 100;
  };

  const renderMesa = ({ item: mesa }: { item: MesaEstado }) => {
    const status = getStatusInfo(mesa);
    const progress = getProgress(mesa);

    return (
      <View style={[styles.mesaCard, mesa.pedidoActivo && styles.mesaCardActive]}>
        {/* Top: Número + badge */}
        <View style={styles.mesaTopRow}>
          <View
            style={[
              styles.mesaNumber,
              {
                backgroundColor: mesa.pedidoActivo
                  ? colors.primarySoft
                  : colors.surfaceSecondary,
              },
            ]}
          >
            <Text
              style={[
                styles.mesaNumberText,
                { color: mesa.pedidoActivo ? colors.primary : colors.textMuted },
              ]}
            >
              {mesa.numero}
            </Text>
          </View>
          {mesa.pedidoActivo && (
            <View style={styles.mesaStats}>
              <Text style={styles.mesaStatsText}>
                {mesa.platosListos + mesa.platosEntregados}/{mesa.totalPlatos}
              </Text>
            </View>
          )}
        </View>

        {/* Middle: Nombre + estado */}
        <Text style={styles.mesaTitle} numberOfLines={1}>Mesa {mesa.numero}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={[styles.statusText, { color: status.color }]} numberOfLines={1}>
            {status.label}
          </Text>
        </View>

        {/* Bottom: Progress */}
        {mesa.pedidoActivo && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                    backgroundColor:
                      progress === 100 ? colors.info : colors.success,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {Math.round(progress)}%
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Stats
  const mesasActivas = mesas.filter((m) => m.pedidoActivo).length;
  const mesasLibres = mesas.filter((m) => !m.pedidoActivo).length;
  const mesasConListos = mesas.filter((m) => m.platosListos > 0).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Mesas</Text>
        <Text style={styles.headerSubtitle}>
          {restaurante?.nombre || "Restaurante"}
        </Text>
      </View>

      {/* Overview */}
      <View style={styles.overview}>
        {[
          { label: "Activas", value: mesasActivas, color: colors.primary, bgColor: colors.primarySoft, icon: "people" as const, useMaterial: false },
          { label: "Libres", value: mesasLibres, color: colors.textMuted, bgColor: colors.surfaceSecondary, icon: "table-furniture" as const, useMaterial: true },
          { label: "Por servir", value: mesasConListos, color: colors.success, bgColor: colors.successSoft, icon: "flash" as const, useMaterial: false },
        ].map((s) => (
          <View key={s.label} style={styles.overviewItem}>
            <View style={[styles.overviewIconBg, { backgroundColor: s.bgColor }]}>
              {s.useMaterial ? (
                <MaterialCommunityIcons name={s.icon as any} size={16} color={s.color} />
              ) : (
                <Ionicons name={s.icon as any} size={14} color={s.color} />
              )}
            </View>
            <Text style={styles.overviewValue}>{s.value}</Text>
            <Text style={styles.overviewLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Mesa Grid */}
      <FlatList
        data={mesas}
        keyExtractor={(item) => String(item.numero)}
        renderItem={renderMesa}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="grid-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              {loading ? "Cargando mesas..." : "No hay mesas configuradas"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      paddingHorizontal: Spacing.xl,
      paddingTop: 0,
      paddingBottom: Spacing.lg,
    },
    headerTitle: {
      fontSize: FontSize.xxl,
      fontWeight: FontWeight.bold,
      color: c.text,
    },
    headerSubtitle: {
      fontSize: FontSize.sm,
      color: c.textMuted,
      marginTop: 2,
    },
    overview: {
      flexDirection: "row",
      paddingHorizontal: Spacing.xl,
      gap: Spacing.sm,
      marginBottom: Spacing.xl,
    },
    overviewItem: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: Radius.md,
      padding: Spacing.md,
      alignItems: "center",
      gap: Spacing.xs,
      borderWidth: 1,
      borderColor: c.border,
    },
    overviewIconBg: {
      width: 28,
      height: 28,
      borderRadius: Radius.sm,
      justifyContent: "center",
      alignItems: "center",
    },
    overviewValue: {
      fontSize: FontSize.xxl,
      fontWeight: FontWeight.bold,
      color: c.text,
    },
    overviewLabel: {
      fontSize: FontSize.xs,
      color: c.textMuted,
      letterSpacing: 0.3,
    },
    gridContent: {
      padding: Spacing.xl,
      paddingTop: 0,
      paddingBottom: 100,
    },
    gridRow: {
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    mesaCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    mesaCardActive: {
      borderColor: "rgba(133,120,246,0.12)",
      backgroundColor: c.surfaceSecondary,
    },
    mesaTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: Spacing.sm,
    },
    mesaNumber: {
      width: 32,
      height: 32,
      borderRadius: Radius.sm,
      justifyContent: "center",
      alignItems: "center",
    },
    mesaNumberText: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.bold,
    },
    mesaTitle: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.semibold,
      color: c.text,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 3,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      fontSize: FontSize.xs,
      fontWeight: FontWeight.medium,
    },
    mesaStats: {
      backgroundColor: c.primarySoft,
      borderRadius: Radius.xs,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
    },
    mesaStatsText: {
      fontSize: FontSize.xs,
      color: c.primary,
      fontWeight: FontWeight.semibold,
    },
    progressContainer: {
      marginTop: Spacing.sm,
    },
    progressBg: {
      height: 3,
      borderRadius: 2,
      backgroundColor: c.surfacePressed,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 2,
    },
    progressLabel: {
      fontSize: 9,
      color: c.textMuted,
      marginTop: 3,
      textAlign: "right",
    },
    emptyContainer: {
      alignItems: "center",
      paddingTop: 80,
      gap: Spacing.md,
    },
    emptyText: {
      fontSize: FontSize.md,
      color: c.textMuted,
    },
  });
