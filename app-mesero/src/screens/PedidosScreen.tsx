/* ═══════════════════════════════════════════════════════════
   PedidosScreen — Agrupado por Mesa
   Muestra pedidos LISTOS y ENTREGADOS agrupados por mesa.
   ═══════════════════════════════════════════════════════════ */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Animated,
  Platform,
  StatusBar,
  Image,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { getPedidos, actualizarEstadoDetalle } from "../config/api";
import { supabase } from "../config/supabase";
import { playNotificationSound, cleanupSound } from "../config/notification-sound";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing, Radius, FontSize, FontWeight, type ThemeColors } from "../config/theme";
import type { ItemServir } from "../types";

type Filtro = "todos" | "platos" | "bebidas";

/* ── Ítem agregado (2× Inca Kola) ── */
interface AggregatedItem {
  key: string;
  nombre: string;
  cantidad: number;
  itemIds: string[];
  mesa: number;
  hora: string;
  estado: "LISTO" | "ENTREGADO" | "MIXED";
  esBebida: boolean;
  notas: string | null;
  imagen_url: string | null;
  agregados: string[];
  listosIds: string[];
}

/* ── Tipo agrupado por pedido ── */
interface PedidoGroup {
  pedidoId: string;
  mesa: number;
  numeroPedido: number;
  horaPedido: string;
  items: ItemServir[];
  aggregated: AggregatedItem[];
  listosCount: number;
  entregadosCount: number;
}

/* ── Componente animado para cada ítem agregado (stagger) ── */
function AnimatedItemRow({
  item,
  index,
  colors,
  styles,
  updating,
  onEntregar,
  formatHora,
}: {
  item: AggregatedItem;
  index: number;
  colors: any;
  styles: any;
  updating: string | null;
  onEntregar: () => void;
  formatHora: (d: string) => string;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    const delay = index * 60;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 250, delay, useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 250, delay, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const allDelivered = item.estado === "ENTREGADO";
  const hasListos = item.listosIds.length > 0;

  return (
    <Animated.View
      style={[
        styles.itemRow,
        allDelivered && styles.itemRowDone,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      {/* Imagen */}
      {item.imagen_url ? (
        <Image source={{ uri: item.imagen_url }} style={styles.itemImage} resizeMode="cover" />
      ) : (
        <View style={[styles.itemImagePlaceholder, {
          backgroundColor: item.esBebida ? colors.accentSoft : colors.primarySoft,
        }]}>
          <Ionicons
            name={item.esBebida ? "beer-outline" : "restaurant-outline"}
            size={16}
            color={item.esBebida ? colors.accent : colors.primary}
          />
        </View>
      )}

      {/* Info */}
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, allDelivered && styles.itemNameDone]} numberOfLines={1}>
          {item.nombre}{item.cantidad > 1 ? ` x${item.cantidad}` : ""}
        </Text>
        {item.notas ? (
          <Text style={styles.itemNotas} numberOfLines={2}>📝 {item.notas}</Text>
        ) : null}
        {item.agregados.length > 0 && (
          <Text style={styles.itemExtras} numberOfLines={1}>＋ {item.agregados.join(", ")}</Text>
        )}
        <Text style={styles.itemHora}>{formatHora(item.hora)}</Text>
      </View>

      {/* Botón entregar */}
      {hasListos ? (
        <TouchableOpacity
          style={[styles.entregarBtnSmall, updating === item.key && styles.btnDisabled]}
          onPress={onEntregar}
          disabled={updating === item.key}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
        </TouchableOpacity>
      ) : (
        <Ionicons name="checkmark-circle" size={16} color={colors.textMuted} style={{ opacity: 0.4 }} />
      )}
    </Animated.View>
  );
}

export default function PedidosScreen() {
  const { restaurante } = useAuth();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [items, setItems] = useState<ItemServir[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [updating, setUpdating] = useState<string | null>(null);
  const prevListosRef = useRef<Set<string>>(new Set());
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [expandedPedidos, setExpandedPedidos] = useState<Set<string>>(new Set());

  // Habilitar LayoutAnimation en Android
  if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const togglePedido = (pedidoId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedPedidos((prev) => {
      const next = new Set(prev);
      if (next.has(pedidoId)) {
        next.delete(pedidoId);
      } else {
        next.add(pedidoId);
      }
      return next;
    });
  };

  const loadData = useCallback(async () => {
    if (!restaurante) return;
    try {
      const data = await getPedidos({ id_restaurante: restaurante.id });
      const newItems: ItemServir[] = [];

      for (const pedido of data || []) {
        const mesaNum = pedido.mesa?.numero || 0;

        for (const det of pedido.detalle_pedido || []) {
          if (det.estado === "LISTO" || det.estado === "ENTREGADO") {
            // Obtener nombres de agregados
            const agregados = (det.detalle_pedido_agregado || [])
              .map((a: any) => a.agregado?.nombre)
              .filter(Boolean);

            newItems.push({
              id: det.id,
              nombre: det.producto?.nombre || "Plato",
              mesa: mesaNum,
              hora: det.created_at || pedido.created_at,
              estado: det.estado,
              esBebida: det.producto?.es_bebida || false,
              pedidoId: pedido.id,
              numeroPedido: pedido.numero_pedido || 0,
              horaPedido: pedido.created_at,
              notas: det.notas,
              imagen_url: det.producto?.imagen_url || null,
              agregados,
              cantidad: 1,
            });
          }
        }
      }

      // Detectar nuevos items LISTOS → sonar + vibrar
      const currentListos = new Set(
        newItems.filter((i) => i.estado === "LISTO").map((i) => i.id)
      );
      for (const id of currentListos) {
        if (!prevListosRef.current.has(id)) {
          playNotificationSound();
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.03, duration: 120, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
          ]).start();
          break;
        }
      }
      prevListosRef.current = currentListos;

      setItems(newItems);
    } catch (err) {
      console.error("Error loading pedidos:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurante]);

  useEffect(() => {
    loadData();
    return () => {
      cleanupSound();
    };
  }, [loadData]);

  // Realtime subscriptions via Supabase
  useEffect(() => {
    if (!restaurante) return;

    const channel = supabase
      .channel("mesero-realtime")
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

  // Marcar uno o varios items como entregados (para aggregated)
  const marcarEntregadoIds = async (ids: string[], groupKey?: string) => {
    setUpdating(groupKey || ids[0]);
    try {
      for (const id of ids) {
        await actualizarEstadoDetalle(id, "ENTREGADO");
      }
      setItems((prev) =>
        prev.map((i) =>
          ids.includes(i.id) ? { ...i, estado: "ENTREGADO" as const } : i
        )
      );
    } catch (err) {
      console.error("Error updating:", err);
    } finally {
      setUpdating(null);
    }
  };

  // Marcar TODOS los items listos de un pedido + auto-colapsar
  const marcarTodosPedido = async (pedidoId: string, pedidoItems: ItemServir[]) => {
    const listos = pedidoItems.filter((i) => i.estado === "LISTO");
    if (listos.length === 0) return;
    setUpdating("pedido-all");
    try {
      for (const item of listos) {
        await actualizarEstadoDetalle(item.id, "ENTREGADO");
      }
      setItems((prev) =>
        prev.map((i) =>
          listos.some((l) => l.id === i.id)
            ? { ...i, estado: "ENTREGADO" as const }
            : i
        )
      );
      // Auto-colapsar el pedido
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedPedidos((prev) => {
        const next = new Set(prev);
        next.delete(pedidoId);
        return next;
      });
    } catch (err) {
      console.error("Error updating all:", err);
    } finally {
      setUpdating(null);
    }
  };

  // ── Filtrar y agrupar por pedido con agregación ──
  const itemsFiltrados = items.filter((i) => {
    if (filtro === "platos") return !i.esBebida;
    if (filtro === "bebidas") return i.esBebida;
    return true;
  });

  // Función para agregar items duplicados
  const aggregateItems = (rawItems: ItemServir[]): AggregatedItem[] => {
    const map = new Map<string, AggregatedItem>();
    for (const item of rawItems) {
      // Clave: nombre + notas + agregados (items con misma combo se unen)
      const key = `${item.nombre}|${item.notas || ""}|${item.agregados.join(",")}`;
      const existing = map.get(key);
      if (existing) {
        existing.cantidad++;
        existing.itemIds.push(item.id);
        if (item.estado === "LISTO") existing.listosIds.push(item.id);
        // Si hay mezcla de estados
        if (existing.estado !== item.estado) existing.estado = "MIXED";
      } else {
        map.set(key, {
          key,
          nombre: item.nombre,
          cantidad: 1,
          itemIds: [item.id],
          mesa: item.mesa,
          hora: item.hora,
          estado: item.estado,
          esBebida: item.esBebida,
          notas: item.notas,
          imagen_url: item.imagen_url,
          agregados: item.agregados,
          listosIds: item.estado === "LISTO" ? [item.id] : [],
        });
      }
    }
    // Ordenar: items con LISTO primero
    return Array.from(map.values()).sort((a, b) =>
      (a.listosIds.length > 0 ? -1 : 1) - (b.listosIds.length > 0 ? -1 : 1)
    );
  };

  const pedidoGroups: PedidoGroup[] = useMemo(() => {
    const map = new Map<string, ItemServir[]>();
    for (const item of itemsFiltrados) {
      const arr = map.get(item.pedidoId) || [];
      arr.push(item);
      map.set(item.pedidoId, arr);
    }
    return Array.from(map.entries())
      .map(([pedidoId, items]) => ({
        pedidoId,
        mesa: items[0].mesa,
        numeroPedido: items[0].numeroPedido,
        horaPedido: items[0].horaPedido,
        items,
        aggregated: aggregateItems(items),
        listosCount: items.filter((i) => i.estado === "LISTO").length,
        entregadosCount: items.filter((i) => i.estado === "ENTREGADO").length,
      }))
      .sort((a, b) => b.listosCount - a.listosCount);
  }, [itemsFiltrados]);

  const listosCount = items.filter((i) => i.estado === "LISTO").length;
  const bebidasCount = items.filter((i) => i.esBebida && i.estado === "LISTO").length;
  const platosCount = items.filter((i) => !i.esBebida && i.estado === "LISTO").length;

  const formatHora = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  // ── Render de cada pedido agrupado (accordion) ──
  const renderPedidoGroup = ({ item: group }: { item: PedidoGroup }) => {
    const isExpanded = expandedPedidos.has(group.pedidoId);

    return (
      <Animated.View
        style={[
          styles.mesaGroupCard,
          group.listosCount > 0 && styles.mesaGroupActive,
          group.listosCount > 0 && { transform: [{ scale: pulseAnim }] },
        ]}
      >
        {/* Header del pedido — siempre visible, tappable */}
        <TouchableOpacity
          style={styles.mesaGroupHeader}
          onPress={() => togglePedido(group.pedidoId)}
          activeOpacity={0.7}
        >
          <View style={styles.mesaGroupLeft}>
            <View style={styles.mesaGroupIcon}>
              <MaterialCommunityIcons name="table-furniture" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.mesaGroupTitle}>Mesa {group.mesa}</Text>
              <Text style={styles.mesaGroupSub}>
                Pedido #{group.numeroPedido} · {group.listosCount} listo{group.listosCount !== 1 ? "s" : ""} · {formatHora(group.horaPedido)}
              </Text>
            </View>
          </View>
          <View style={styles.mesaGroupRight}>
            {group.listosCount > 0 && (
              <View style={styles.listoBadge}>
                <Text style={styles.listoBadgeText}>{group.listosCount}</Text>
              </View>
            )}
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.textMuted}
            />
          </View>
        </TouchableOpacity>

        {/* Contenido expandible */}
        {isExpanded && (
          <>
            {/* Botón entregar todo */}
            {group.listosCount > 0 && (
              <TouchableOpacity
                style={styles.entregarTodosRow}
                onPress={() => marcarTodosPedido(group.pedidoId, group.items)}
                disabled={updating === "pedido-all"}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-done" size={14} color="#fff" />
                <Text style={styles.entregarTodosBtnText}>
                  {updating === "pedido-all" ? "..." : "Entregar todo"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Lista de ítems agregados — aparecen uno por uno */}
            {group.aggregated.map((agg, index) => (
              <AnimatedItemRow
                key={agg.key}
                item={agg}
                index={index}
                colors={colors}
                styles={styles}
                updating={updating}
                onEntregar={() => marcarEntregadoIds(agg.listosIds, agg.key)}
                formatHora={formatHora}
              />
            ))}
          </>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>Pedidos</Text>
          <Text style={styles.headerSubtitle}>
            {listosCount} {listosCount === 1 ? "plato listo" : "platos listos"} para servir
          </Text>
        </View>
        {listosCount > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{listosCount}</Text>
          </View>
        )}
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {[
          { label: "Por servir", value: listosCount, color: colors.success, bgColor: colors.successSoft, icon: "rocket-outline" as const },
          { label: "Platos", value: platosCount, color: colors.primary, bgColor: colors.primarySoft, icon: "restaurant-outline" as const },
          { label: "Bebidas", value: bebidasCount, color: colors.accent, bgColor: colors.accentSoft, icon: "beer-outline" as const },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: s.bgColor }]}>
              <Ionicons name={s.icon} size={14} color={s.color} />
            </View>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {(["todos", "platos", "bebidas"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filtro === f && styles.filterBtnActive]}
            onPress={() => setFiltro(f)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={f === "todos" ? "apps-outline" : f === "platos" ? "restaurant-outline" : "beer-outline"}
              size={14}
              color={filtro === f ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.filterText, filtro === f && styles.filterTextActive]}>
              {f === "todos" ? "Todos" : f === "platos" ? "Platos" : "Bebidas"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List — grouped by pedido */}
      <FlatList
        data={pedidoGroups}
        keyExtractor={(item) => item.pedidoId}
        renderItem={renderPedidoGroup}
        contentContainerStyle={styles.list}
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
            <View style={styles.emptyIcon}>
              <Ionicons name="sparkles" size={36} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {loading ? "Cargando..." : "¡Todo servido! 🎉"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {loading ? "Obteniendo pedidos..." : "No hay platos pendientes por servir"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: Spacing.xl,
      paddingTop: 0,
      paddingBottom: Spacing.lg,
    },
    headerTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: c.text },
    headerSubtitle: { fontSize: FontSize.sm, color: c.textMuted, marginTop: 2 },
    countBadge: {
      backgroundColor: c.primary,
      borderRadius: Radius.full,
      width: 38, height: 38,
      justifyContent: "center", alignItems: "center",
    },
    countBadgeText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: "#fff" },
    statsRow: {
      flexDirection: "row", paddingHorizontal: Spacing.xl,
      gap: Spacing.sm, marginBottom: Spacing.lg,
    },
    statCard: {
      flex: 1, backgroundColor: c.surface, borderRadius: Radius.md,
      padding: Spacing.md, borderWidth: 1, borderColor: c.border,
      alignItems: "center", gap: Spacing.xs,
    },
    statIconBg: {
      width: 28, height: 28, borderRadius: Radius.sm,
      justifyContent: "center", alignItems: "center",
    },
    statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: c.text },
    statLabel: { fontSize: FontSize.xs, color: c.textMuted, letterSpacing: 0.3 },
    filterRow: {
      flexDirection: "row", paddingHorizontal: Spacing.xl,
      gap: Spacing.sm, marginBottom: Spacing.lg,
    },
    filterBtn: {
      flexDirection: "row", alignItems: "center", gap: Spacing.xs,
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
      borderRadius: Radius.full, backgroundColor: c.surface,
      borderWidth: 1, borderColor: c.border,
    },
    filterBtnActive: { backgroundColor: c.primarySoft, borderColor: c.primary },
    filterText: { fontSize: FontSize.sm, color: c.textMuted, fontWeight: FontWeight.medium },
    filterTextActive: { color: c.text, fontWeight: FontWeight.semibold },
    list: { paddingHorizontal: Spacing.xl, paddingBottom: 100, gap: Spacing.md },

    // ── Mesa Group Card ──
    mesaGroupCard: {
      backgroundColor: c.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden",
    },
    mesaGroupActive: {
      borderColor: "rgba(52,211,153,0.2)",
    },
    mesaGroupHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.surfaceSecondary,
    },
    mesaGroupLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    mesaGroupIcon: {
      width: 36, height: 36, borderRadius: Radius.sm,
      backgroundColor: c.primarySoft,
      justifyContent: "center", alignItems: "center",
    },
    mesaGroupTitle: {
      fontSize: FontSize.md, fontWeight: FontWeight.bold, color: c.text,
    },
    mesaGroupSub: {
      fontSize: FontSize.xs, color: c.textMuted, marginTop: 1,
    },
    mesaGroupRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    listoBadge: {
      backgroundColor: c.success,
      borderRadius: Radius.full,
      width: 22, height: 22,
      justifyContent: "center", alignItems: "center",
    },
    listoBadgeText: {
      fontSize: 11, fontWeight: FontWeight.bold, color: "#fff",
    },
    entregarTodosRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
      backgroundColor: c.success,
      paddingVertical: Spacing.sm,
    },
    entregarTodosBtnText: {
      fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: "#fff",
    },

    // ── Item Row (dentro de la mesa) ──
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      gap: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    itemRowDone: {
      opacity: 0.4,
    },
    itemImage: {
      width: 44, height: 44,
      borderRadius: Radius.sm,
    },
    itemImagePlaceholder: {
      width: 44, height: 44,
      borderRadius: Radius.sm,
      justifyContent: "center", alignItems: "center",
    },
    itemInfo: { flex: 1 },
    itemName: {
      fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: c.text,
    },
    itemNameDone: {
      textDecorationLine: "line-through", color: c.textMuted,
    },
    itemNotas: {
      fontSize: FontSize.xs, color: c.accent, marginTop: 2, opacity: 0.85,
    },
    itemExtras: {
      fontSize: FontSize.xs, color: c.primary, marginTop: 2,
    },
    itemHora: {
      fontSize: 10, color: c.textMuted, marginTop: 2,
    },
    entregarBtnSmall: {
      width: 34, height: 34,
      borderRadius: 17,
      justifyContent: "center", alignItems: "center",
      backgroundColor: c.successSoft,
    },
    btnDisabled: { opacity: 0.5 },
    entregadoBadge: {
      flexDirection: "row", alignItems: "center", gap: Spacing.xs,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
      borderRadius: Radius.full, backgroundColor: c.successSoft,
    },
    entregadoText: { fontSize: FontSize.xs, color: c.success, fontWeight: FontWeight.medium },

    // ── Empty ──
    emptyContainer: { alignItems: "center", paddingTop: 80 },
    emptyIcon: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: c.surface, justifyContent: "center", alignItems: "center",
      marginBottom: Spacing.lg, borderWidth: 1, borderColor: c.border,
    },
    emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: c.text, marginBottom: Spacing.xs },
    emptySubtitle: { fontSize: FontSize.sm, color: c.textMuted },
  });
