/* ═══════════════════════════════════════════════════════════
   TOMAR PEDIDO SCREEN — Crear nuevo pedido desde la app
   El mesero selecciona mesa, productos y envía el pedido.
   ═══════════════════════════════════════════════════════════ */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  Platform,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { getMesas, getProductos, getCategorias, crearPedido } from "../config/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing, Radius, FontSize, FontWeight, type ThemeColors } from "../config/theme";

interface CartItem {
  id_producto: string;
  nombre: string;
  precio: number;
  cantidad: number;
  notas: string;
  esBebida: boolean;
}
interface Mesa { id: string; numero: number; }
interface Categoria { id: string; nombre: string; }
interface Producto {
  id: string; nombre: string; precio: number; es_bebida: boolean;
  disponible: boolean; id_categoria: string; imagen_url: string | null; descripcion: string | null;
}

export default function TomarPedidoScreen() {
  const { restaurante, usuario } = useAuth();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notasPedido, setNotasPedido] = useState("");
  const [sending, setSending] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const loadData = useCallback(async () => {
    if (!restaurante) return;
    try {
      const [mesasData, prodsData, catsData] = await Promise.all([
        getMesas(restaurante.id), getProductos(restaurante.id), getCategorias(restaurante.id),
      ]);
      setMesas((mesasData || []).sort((a: Mesa, b: Mesa) => a.numero - b.numero));
      setProductos(prodsData || []);
      setCategorias(catsData || []);
    } catch (err) { console.error("Error loading data:", err); }
    finally { setLoading(false); }
  }, [restaurante]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredProducts = useMemo(() => {
    let prods = productos;
    if (selectedCategoria) prods = prods.filter((p) => p.id_categoria === selectedCategoria);
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      prods = prods.filter((p) => p.nombre.toLowerCase().includes(q));
    }
    return prods;
  }, [productos, selectedCategoria, searchText]);

  const addToCart = (product: Producto) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id_producto === product.id);
      if (existing) return prev.map((c) => c.id_producto === product.id ? { ...c, cantidad: c.cantidad + 1 } : c);
      return [...prev, { id_producto: product.id, nombre: product.nombre, precio: product.precio, cantidad: 1, notas: "", esBebida: product.es_bebida }];
    });
  };
  const removeFromCart = (id: string) => setCart((prev) => prev.filter((c) => c.id_producto !== id));
  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((c) => c.id_producto === id ? { ...c, cantidad: Math.max(0, c.cantidad + delta) } : c).filter((c) => c.cantidad > 0));
  };
  const updateItemNotes = (id: string, notas: string) => {
    setCart((prev) => prev.map((c) => (c.id_producto === id ? { ...c, notas } : c)));
  };
  const cartTotal = useMemo(() => cart.reduce((s, c) => s + c.precio * c.cantidad, 0), [cart]);
  const cartItemCount = useMemo(() => cart.reduce((s, c) => s + c.cantidad, 0), [cart]);
  const getCartQty = (productId: string) => cart.find((c) => c.id_producto === productId)?.cantidad || 0;

  const sendOrder = async () => {
    if (!restaurante || !selectedMesa || cart.length === 0) return;
    setSending(true);
    try {
      await crearPedido({
        id_restaurante: restaurante.id, id_mesa: selectedMesa.id, id_usuario: usuario?.id,
        notas: notasPedido || undefined,
        items: cart.map((c) => ({ id_producto: c.id_producto, cantidad: c.cantidad, notas: c.notas || undefined })),
      });
      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); setCart([]); setNotasPedido(""); setSelectedMesa(null); setShowCart(false); }, 2000);
    } catch (err: any) { Alert.alert("Error", err.message || "No se pudo enviar el pedido."); }
    finally { setSending(false); }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: FontSize.sm }}>Cargando menú...</Text>
      </View>
    );
  }

  // ── Step 1: Seleccionar mesa ──
  if (!selectedMesa) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.headerTitle}>Tomar Pedido</Text>
          <Text style={styles.headerSubtitle}>Selecciona una mesa</Text>
        </View>
        <FlatList
          data={mesas}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={styles.mesaGridRow}
          contentContainerStyle={styles.mesaGridContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.mesaCard}
              onPress={() => setSelectedMesa(item)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name="table-furniture" 
                size={44} 
                color={colors.primary} 
                style={styles.mesaIconAlone}
              />
              <Text style={styles.mesaCardNumber}>{item.numero}</Text>
              <Text style={styles.mesaCardLabel}>Mesa</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  // ── Step 2: Seleccionar productos ──
  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setSelectedMesa(null)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Mesa {selectedMesa.numero}</Text>
            <Text style={styles.headerSubtitle}>Selecciona productos</Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar producto..."
          placeholderTextColor={colors.textMuted}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText ? (
          <TouchableOpacity onPress={() => setSearchText("")}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Categories */}
      <View style={{ height: 44 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScrollContent}
        >
          <TouchableOpacity
            style={[styles.catBtn, !selectedCategoria && styles.catBtnActive]}
            onPress={() => setSelectedCategoria(null)}
          >
            <Text style={[styles.catBtnText, !selectedCategoria && styles.catBtnTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
          {categorias.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catBtn, selectedCategoria === cat.id && styles.catBtnActive]}
              onPress={() => setSelectedCategoria(selectedCategoria === cat.id ? null : cat.id)}
            >
              <Text style={[styles.catBtnText, selectedCategoria === cat.id && styles.catBtnTextActive]}>
                {cat.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products Grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.prodRow}
        contentContainerStyle={styles.prodContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: product }) => {
          const qty = getCartQty(product.id);
          return (
            <TouchableOpacity
              style={[styles.prodCard, qty > 0 && styles.prodCardSelected]}
              onPress={() => addToCart(product)}
              activeOpacity={0.7}
            >
              <View style={styles.prodHeader}>
                <View style={[styles.prodIconBg, { backgroundColor: product.es_bebida ? colors.accentSoft : colors.primarySoft }]}>
                  <Ionicons
                    name={product.es_bebida ? "beer-outline" : "restaurant-outline"}
                    size={16}
                    color={product.es_bebida ? colors.accent : colors.primary}
                  />
                </View>
                {qty > 0 && (
                  <View style={styles.qtyBadge}>
                    <Text style={styles.qtyBadgeText}>{qty}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.prodName} numberOfLines={2}>{product.nombre}</Text>
              <Text style={styles.prodPrice}>S/ {product.precio.toFixed(2)}</Text>
              {qty > 0 && (
                <View style={styles.qtyControls}>
                  <TouchableOpacity onPress={() => updateQty(product.id, -1)} style={styles.qtyBtn}>
                    <Ionicons name="remove" size={14} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{qty}</Text>
                  <TouchableOpacity onPress={() => updateQty(product.id, 1)} style={styles.qtyBtn}>
                    <Ionicons name="add" size={14} color={colors.text} />
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <Ionicons name="search" size={28} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, marginTop: 8, fontSize: FontSize.sm }}>
              No se encontraron productos
            </Text>
          </View>
        }
      />

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <TouchableOpacity style={styles.cartFab} onPress={() => setShowCart(true)} activeOpacity={0.8}>
          <Ionicons name="cart" size={20} color="#fff" />
          <Text style={styles.cartFabText}>
            Ver pedido ({cartItemCount}) · S/ {cartTotal.toFixed(2)}
          </Text>
        </TouchableOpacity>
      )}

      {/* Cart Modal */}
      <Modal visible={showCart} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pedido — Mesa {selectedMesa.numero}</Text>
              <TouchableOpacity onPress={() => setShowCart(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {cart.map((item) => (
                <View key={item.id_producto} style={styles.cartItem}>
                  <View style={styles.cartItemTop}>
                    <Ionicons
                      name={item.esBebida ? "beer-outline" : "restaurant-outline"}
                      size={15}
                      color={item.esBebida ? colors.accent : colors.primary}
                    />
                    <Text style={styles.cartItemName} numberOfLines={1}>{item.nombre}</Text>
                    <TouchableOpacity onPress={() => removeFromCart(item.id_producto)}>
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.cartItemBottom}>
                    <View style={styles.qtyControls}>
                      <TouchableOpacity onPress={() => updateQty(item.id_producto, -1)} style={styles.qtyBtnSmall}>
                        <Ionicons name="remove" size={13} color={colors.text} />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.cantidad}</Text>
                      <TouchableOpacity onPress={() => updateQty(item.id_producto, 1)} style={styles.qtyBtnSmall}>
                        <Ionicons name="add" size={13} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.cartItemPrice}>S/ {(item.precio * item.cantidad).toFixed(2)}</Text>
                  </View>
                  <TextInput
                    style={styles.cartItemNotes}
                    placeholder="Notas (sin sal, extra picante...)"
                    placeholderTextColor={colors.textMuted}
                    value={item.notas}
                    onChangeText={(t) => updateItemNotes(item.id_producto, t)}
                  />
                </View>
              ))}

              <View style={styles.generalNotes}>
                <Text style={styles.generalNotesLabel}>Notas del pedido</Text>
                <TextInput
                  style={styles.generalNotesInput}
                  placeholder="Notas generales..."
                  placeholderTextColor={colors.textMuted}
                  value={notasPedido}
                  onChangeText={setNotasPedido}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>S/ {cartTotal.toFixed(2)}</Text>
              </View>
              <TouchableOpacity
                style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
                onPress={sendOrder}
                disabled={sending}
                activeOpacity={0.8}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#fff" />
                    <Text style={styles.sendBtnText}>Enviar Pedido</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={56} color={colors.success} />
            <Text style={styles.successTitle}>¡Pedido Enviado!</Text>
            <Text style={styles.successSubtitle}>
              Mesa {selectedMesa?.numero} · S/ {cartTotal.toFixed(2)}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: { paddingHorizontal: Spacing.xl, paddingTop: 0, paddingBottom: Spacing.md },
    headerRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
    backBtn: {
      width: 36, height: 36, borderRadius: Radius.sm,
      backgroundColor: c.surface, justifyContent: "center", alignItems: "center",
      borderWidth: 1, borderColor: c.border,
    },
    headerTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: c.text },
    headerSubtitle: { fontSize: FontSize.sm, color: c.textMuted, marginTop: 2 },

    // ── Mesa selection — tarjetas cuadradas ──
    mesaGridRow: {
      gap: Spacing.sm,
      paddingHorizontal: Spacing.xl,
    },
    mesaGridContent: {
      paddingTop: Spacing.lg,
      paddingBottom: 100,
      gap: Spacing.sm,
    },
    mesaCard: {
      flex: 1,
      height: 110,
      maxWidth: "31.5%", // Evita estiramiento si hay menos de 3 columnas
      backgroundColor: c.surface,
      borderRadius: Radius.lg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: c.border,
    },
    mesaIconAlone: {
      marginBottom: 2,
    },
    mesaCardNumber: {
      fontSize: FontSize.xl,
      fontWeight: FontWeight.bold,
      color: c.text,
      lineHeight: 22,
    },
    mesaCardLabel: {
      fontSize: FontSize.xs,
      color: c.textMuted,
      marginTop: 2,
    },

    // ── Search ──
    searchContainer: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: c.surface, borderRadius: Radius.md,
      marginHorizontal: Spacing.xl, paddingHorizontal: Spacing.lg,
      borderWidth: 1, borderColor: c.border, marginBottom: Spacing.md, gap: Spacing.sm,
    },
    searchInput: {
      flex: 1, fontSize: FontSize.md, color: c.text,
      paddingVertical: Platform.OS === "ios" ? 13 : 11,
    },

    // ── Categories ──
    catScrollContent: { paddingHorizontal: Spacing.xl, gap: Spacing.sm, alignItems: "center", height: 44 },
    catBtn: {
      height: 34,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 16,
      borderRadius: 17,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    catBtnActive: { backgroundColor: c.primarySoft, borderColor: c.primary },
    catBtnText: { fontSize: FontSize.sm, color: c.textMuted, fontWeight: FontWeight.medium },
    catBtnTextActive: { color: c.text, fontWeight: FontWeight.semibold },

    // ── Products ──
    prodRow: { gap: Spacing.sm, paddingHorizontal: Spacing.xl },
    prodContent: { paddingBottom: 110, gap: Spacing.sm },
    prodCard: {
      flex: 1, backgroundColor: c.surface, borderRadius: Radius.md,
      padding: Spacing.lg, borderWidth: 1, borderColor: c.border,
    },
    prodCardSelected: { borderColor: c.primary, backgroundColor: c.surfaceSecondary },
    prodHeader: {
      flexDirection: "row", justifyContent: "space-between",
      alignItems: "center", marginBottom: Spacing.sm,
    },
    prodIconBg: {
      width: 30, height: 30, borderRadius: Radius.xs,
      justifyContent: "center", alignItems: "center",
    },
    prodName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.text, marginBottom: Spacing.xs },
    prodPrice: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: c.primary },
    qtyBadge: {
      backgroundColor: c.primary, borderRadius: Radius.full,
      width: 22, height: 22, justifyContent: "center", alignItems: "center",
    },
    qtyBadgeText: { fontSize: 11, fontWeight: FontWeight.bold, color: "#fff" },
    qtyControls: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginTop: Spacing.sm },
    qtyBtn: {
      width: 28, height: 28, borderRadius: Radius.sm,
      backgroundColor: c.surfaceSecondary, justifyContent: "center", alignItems: "center",
      borderWidth: 1, borderColor: c.border,
    },
    qtyBtnSmall: {
      width: 26, height: 26, borderRadius: 13,
      backgroundColor: c.surfaceSecondary, justifyContent: "center", alignItems: "center",
      borderWidth: 1, borderColor: c.border,
    },
    qtyText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: c.text, minWidth: 20, textAlign: "center" },

    // ── Cart FAB ──
    cartFab: {
      position: "absolute", bottom: 90, left: Spacing.xl, right: Spacing.xl,
      backgroundColor: c.primary, borderRadius: Radius.lg,
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      paddingVertical: Spacing.lg, gap: Spacing.sm,
    },
    cartFabText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: "#fff" },

    // ── Modal ──
    modalOverlay: { flex: 1, backgroundColor: c.overlay, justifyContent: "flex-end" },
    modalContent: { backgroundColor: c.background, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, maxHeight: "85%" },
    modalHeader: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text },
    modalBody: { paddingHorizontal: Spacing.xl },
    cartItem: {
      backgroundColor: c.surface, borderRadius: Radius.md, padding: Spacing.lg,
      marginTop: Spacing.md, borderWidth: 1, borderColor: c.border,
    },
    cartItemTop: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
    cartItemName: { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: c.text },
    cartItemBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: Spacing.sm },
    cartItemPrice: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: c.primary },
    cartItemNotes: {
      backgroundColor: c.inputBg, borderRadius: Radius.sm, padding: Spacing.sm,
      marginTop: Spacing.sm, fontSize: FontSize.sm, color: c.text,
      borderWidth: 1, borderColor: c.border,
    },
    generalNotes: { marginTop: Spacing.lg, marginBottom: Spacing.lg },
    generalNotesLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.textSecondary, marginBottom: Spacing.sm },
    generalNotesInput: {
      backgroundColor: c.surface, borderRadius: Radius.md, padding: Spacing.lg,
      fontSize: FontSize.md, color: c.text, minHeight: 60,
      borderWidth: 1, borderColor: c.border, textAlignVertical: "top",
    },
    modalFooter: { padding: Spacing.xl, borderTopWidth: 1, borderTopColor: c.border },
    totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.lg },
    totalLabel: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: c.textSecondary },
    totalValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: c.text },
    sendBtn: {
      backgroundColor: c.success, borderRadius: Radius.md, flexDirection: "row",
      justifyContent: "center", alignItems: "center", paddingVertical: 15, gap: Spacing.sm,
    },
    sendBtnDisabled: { opacity: 0.6 },
    sendBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: "#fff" },

    // ── Success ──
    successOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" },
    successCard: {
      backgroundColor: c.surface, borderRadius: Radius.xl, padding: Spacing.xxxl,
      alignItems: "center", borderWidth: 1, borderColor: c.border,
    },
    successTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: c.text, marginTop: Spacing.lg, marginBottom: Spacing.xs },
    successSubtitle: { fontSize: FontSize.md, color: c.textMuted },
  });
