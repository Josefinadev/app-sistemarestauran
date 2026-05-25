/* ═══════════════════════════════════════════════════════════
   VIEWMODEL — useMenuDigital
   Lógica del menú digital del cliente.
   Incluye validación min/max de agregados por grupo.
   ═══════════════════════════════════════════════════════════ */

import { useState, useEffect, useMemo, useCallback } from "react";
import { getCategorias, getProductos, getProductoDetalle, getMesas } from "@/lib/api";
import { useAuth, useCarrito } from "@/lib/store";
import type { Agregado } from "@/lib/database.types";
import { useProductosRealtime } from "@/lib/realtime";

export function useMenuDigital() {
  const { restaurante, usuario, mesa, activePedidoId, activePedidoEstado, setMesa } = useAuth();
  const { addItem, getItemCount, getTotal } = useCarrito();

  const [categorias, setCategorias] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productDetail, setProductDetail] = useState<any>(null);
  const [notas, setNotas] = useState("");
  const [selectedAgregados, setSelectedAgregados] = useState<Agregado[]>([]);
  const [cantidad, setCantidad] = useState(1);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = useCallback(async () => {
    if (!restaurante?.id) return;
    try {
      setLoading(true);
      const [cats, prods] = await Promise.all([
        getCategorias(restaurante.id),
        getProductos(restaurante.id),
      ]);
      setCategorias(cats || []);
      setProductos(prods || []);
    } catch (err) {
      console.error("Error loading menu:", err);
    } finally {
      setLoading(false);
    }
  }, [restaurante?.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Sync en tiempo real: si el admin crea/edita productos, el cliente ve el cambio sin recargar.
  const handleProductosChange = useCallback(() => {
    // Refetch simple; suficiente para mantener consistencia.
    load();
  }, [load]);

  useProductosRealtime(restaurante?.id || null, handleProductosChange);

  const productosFiltrados = useMemo(() => {
    return productos.filter((p: any) => {
      const matchCat = selectedCat === "all" || p.id_categoria === selectedCat;
      const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [productos, selectedCat, searchTerm]);

  const openProductDetail = async (prod: any) => {
    setSelectedProduct(prod);
    setNotas("");
    setSelectedAgregados([]);
    setCantidad(1);
    setLoadingDetail(true);
    try {
      const detail = await getProductoDetalle(prod.id);
      setProductDetail(detail);
    } catch {
      setProductDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const toggleAgregado = (ag: Agregado, grupoId?: string) => {
    setSelectedAgregados((prev) => {
      const already = prev.find((a) => a.id === ag.id);
      if (already) return prev.filter((a) => a.id !== ag.id);

      if (grupoId && productDetail?.producto_grupo) {
        const pg = productDetail.producto_grupo.find((p: any) => p.grupo?.id === grupoId);
        if (pg) {
          const max = pg.grupo.max_seleccion || 99;
          const currentInGroup = prev.filter((a) => pg.grupo.agregado?.some((ga: Agregado) => ga.id === a.id)).length;
          if (currentInGroup >= max) return prev;
        }
      }
      return [...prev, ag];
    });
  };

  const canAddToCart = useMemo(() => {
    if (!productDetail?.producto_grupo?.length) return true;
    for (const pg of productDetail.producto_grupo) {
      const grupo = pg.grupo;
      if (!grupo) continue;
      const min = grupo.min_seleccion || 0;
      if (min === 0) continue;
      const selectedInGroup = selectedAgregados.filter((a) => grupo.agregado?.some((ga: Agregado) => ga.id === a.id)).length;
      if (selectedInGroup < min) return false;
    }
    return true;
  }, [productDetail, selectedAgregados]);

  const handleAddToCart = () => {
    if (!selectedProduct || !canAddToCart) return;
    addItem(selectedProduct, cantidad, notas, selectedAgregados);
    setSelectedProduct(null);
    setProductDetail(null);
  };

  const quickAddProduct = (prod: any) => {
    addItem(prod, 1, "", []);
  };

  const usarMesaPrueba = async () => {
    if (!restaurante?.id) return;
    try {
      const mesas = await getMesas(restaurante.id);
      if (mesas && mesas.length > 0) {
        setMesa(mesas[0]);
      } else {
        alert("El restaurante no tiene mesas configuradas.");
      }
    } catch (err) {
      console.error("Error al obtener mesa de prueba:", err);
    }
  };

  const closeDetail = () => {
    setSelectedProduct(null);
    setProductDetail(null);
  };

  const precioConAgregados = selectedProduct
    ? Number(selectedProduct.precio) + selectedAgregados.reduce((s, a) => s + Number(a.precio), 0)
    : 0;

  return {
    categorias,
    productosFiltrados,
    loading,
    selectedCat,
    searchTerm,
    selectedProduct,
    productDetail,
    notas,
    selectedAgregados,
    cantidad,
    loadingDetail,
    precioConAgregados,
    canAddToCart,
    itemCount: getItemCount(),
    cartTotal: getTotal(),
    restaurante,
    usuario,
    mesa,
    activePedidoId,
    activePedidoEstado,
    hasActivePedido: Boolean(activePedidoId) && !["ENTREGADO", "CANCELADO"].includes(activePedidoEstado || ""),
    setSelectedCat,
    setSearchTerm,
    setNotas,
    setCantidad,
    openProductDetail,
    quickAddProduct,
    toggleAgregado,
    handleAddToCart,
    closeDetail,
    usarMesaPrueba,
  };
}
