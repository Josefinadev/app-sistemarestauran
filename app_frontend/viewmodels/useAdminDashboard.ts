/* ═══════════════════════════════════════════════════════════
   VIEWMODEL — useAdminDashboard
   Toda la lógica de negocio del panel admin.
   ═══════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from "react";
import {
  getProductosTodos,
  getCategorias,
  getMesas,
  getPedidos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  crearMesa,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  uploadImage,
  deleteImageFromStorage,
} from "@/lib/api";
import { useAuth } from "@/lib/store";
import { toast } from "@/lib/toast";
import { showActionOverlay } from "@/components/ActionFeedback";

export function useAdminDashboard() {
  const { restaurante } = useAuth();
  const idRestaurante = restaurante?.id;

  const [activeTab, setActiveTab] = useState("productos");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [productos, setProductos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [mesas, setMesas] = useState<any[]>([]);
  const [stats, setStats] = useState({ productos: 0, mesas: 0, pedidosHoy: 0, ingresosHoy: 0, trendPedidos: "—", trendIngresos: "—" });

  const [showProductModal, setShowProductModal] = useState(false);
  const [showMesaModal, setShowMesaModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);

  const [newProd, setNewProd] = useState({
    nombre: "",
    id_categoria: "",
    precio: "",
    descripcion: "",
    stock: "10",
    es_bebida: false,
    requiere_preparacion: true,
    imagen_url: "",
  });
  const [newMesa, setNewMesa] = useState({ numero: "", capacidad: "4" });
  const [newCat, setNewCat] = useState({ nombre: "", descripcion: "" });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!idRestaurante) return;
    try {
      setLoading(true);
      setError(null);
      const [prods, cats, mesasData, pedidosData] = await Promise.all([
        getProductosTodos(idRestaurante),
        getCategorias(idRestaurante),
        getMesas(idRestaurante),
        getPedidos({ id_restaurante: idRestaurante }),
      ]);

      setProductos(prods || []);
      setCategorias(cats || []);
      setMesas(mesasData || []);

      const activePrds = (prods || []).filter((p: any) => p.disponible && !p.deleted_at);
      const activeMesas = (mesasData || []).filter((m: any) => m.activa);

      // Filtrar pedidos de HOY y AYER para calcular tendencias reales
      const todayStr = new Date().toISOString().split("T")[0];
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const pedidosHoy = (pedidosData || []).filter((p: any) => {
        const d = new Date(p.created_at);
        // Ajustar a zona horaria local
        const localStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        return localStr === todayStr;
      });
      const pedidosAyer = (pedidosData || []).filter((p: any) => {
        const d = new Date(p.created_at);
        const localStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        return localStr === yesterdayStr;
      });

      const pagadosHoy = pedidosHoy.filter((p: any) => p.estado_pago === "PAGADO");
      const pagadosAyer = pedidosAyer.filter((p: any) => p.estado_pago === "PAGADO");
      const ingresosHoy = pagadosHoy.reduce((s: number, p: any) => s + Number(p.total), 0);
      const ingresosAyer = pagadosAyer.reduce((s: number, p: any) => s + Number(p.total), 0);

      // Calcular tendencias (porcentaje de cambio vs ayer)
      const calcTrend = (hoy: number, ayer: number): string => {
        if (ayer === 0) return hoy > 0 ? "+100% vs ayer" : "Sin datos ayer";
        const pct = Math.round(((hoy - ayer) / ayer) * 100);
        return `${pct >= 0 ? "+" : ""}${pct}% vs ayer`;
      };

      setStats({
        productos: activePrds.length,
        mesas: activeMesas.length,
        pedidosHoy: pedidosHoy.length,
        ingresosHoy,
        trendPedidos: calcTrend(pedidosHoy.length, pedidosAyer.length),
        trendIngresos: calcTrend(ingresosHoy, ingresosAyer),
      });
    } catch (err: any) {
      console.error("Error loading admin data:", err);
      const msg = err?.message || "Error cargando datos";
      const isNetworkError = msg.includes("No se pudo conectar") || msg.includes("Tiempo de espera");
      setError(
        isNetworkError
          ? "No se pudo conectar al servidor. Asegúrate de que el backend esté corriendo e intenta de nuevo."
          : msg
      );
    } finally {
      setLoading(false);
    }
  }, [idRestaurante]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateProduct = async (imageFile?: File | null) => {
    if (!newProd.nombre || !newProd.id_categoria || !newProd.precio) return false;
    setSaving(true);
    setError(null);
    try {
      let imagen_url = newProd.imagen_url;
      if (imageFile) {
        imagen_url = await uploadImage(imageFile, "productos");
      }

      const created = await crearProducto({
        id_restaurante: idRestaurante,
        id_categoria: newProd.id_categoria,
        nombre: newProd.nombre,
        descripcion: newProd.descripcion,
        precio: parseFloat(newProd.precio),
        stock: parseInt(newProd.stock) || 10,
        es_bebida: newProd.es_bebida,
        requiere_preparacion: newProd.es_bebida ? newProd.requiere_preparacion : true,
        disponible: true,
        imagen_url,
      });

      // Optimistic append: the new product goes straight into the list
      // without triggering a full reload + skeleton flash.
      if (created && created.id) {
        const next = {
          id: created.id,
          id_restaurante: idRestaurante,
          id_categoria: newProd.id_categoria,
          nombre: newProd.nombre,
          descripcion: newProd.descripcion,
          precio: parseFloat(newProd.precio),
          stock: parseInt(newProd.stock) || 10,
          es_bebida: newProd.es_bebida,
          requiere_preparacion: newProd.es_bebida ? newProd.requiere_preparacion : true,
          disponible: true,
          imagen_url: imagen_url || null,
          created_at: created.created_at || new Date().toISOString(),
        };
        setProductos((prev) => [next, ...prev]);
        setStats((s) => ({
          ...s,
          productos: s.productos + (next.disponible ? 1 : 0),
        }));
      }

      setShowProductModal(false);
      setNewProd({ nombre: "", id_categoria: "", precio: "", descripcion: "", stock: "10", es_bebida: false, requiere_preparacion: true, imagen_url: "" });
      showActionOverlay("success", "Producto creado");
      toast.success({
        message: "Producto creado",
        description: `${newProd.nombre} ya aparece en la carta.`,
      });
      return true;
    } catch (err: any) {
      console.error("Error creating product:", err);
      const msg = err?.message || "Error al crear producto";
      setError(msg);
      toast.error({ message: "No se pudo crear el producto", description: msg });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDisponible = async (prod: any) => {
    const nextValue = !prod.disponible;
    try {
      // Optimistic update for instant feedback
      setProductos((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, disponible: nextValue } : p))
      );
      setStats((s) => ({
        ...s,
        productos: s.productos + (nextValue ? 1 : -1),
      }));
      await actualizarProducto(prod.id, { disponible: nextValue });
      showActionOverlay("success", nextValue ? "Producto activado" : "Producto pausado");
      toast.success({
        message: nextValue ? "Producto activado" : "Producto pausado",
        description: `${prod.nombre} ahora está ${nextValue ? "visible" : "oculto"} en la carta.`,
        duration: 2500,
      });
    } catch (err: any) {
      console.error("Error toggling product:", err);
      // Revert on failure
      setProductos((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, disponible: prod.disponible } : p))
      );
      setStats((s) => ({
        ...s,
        productos: s.productos + (nextValue ? -1 : 1),
      }));
      const msg = err?.message || "Error al cambiar disponibilidad";
      setError(msg);
      toast.error({ message: "No se pudo cambiar el estado", description: msg });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const removed = productos.find((p) => p.id === id);
    try {
      // Optimistic update — instant UI feedback
      setProductos((prev) => prev.filter((p) => p.id !== id));
      if (removed?.disponible) {
        setStats((s) => ({ ...s, productos: Math.max(0, s.productos - 1) }));
      }
      await eliminarProducto(id);
      // Delete image from storage (non-blocking, best-effort)
      if (removed?.imagen_url) {
        deleteImageFromStorage(removed.imagen_url).catch(() => {});
      }
      showActionOverlay("delete", "Producto eliminado");
      toast.success({
        message: "Producto eliminado",
        description: removed ? `${removed.nombre} se quitó de la carta.` : undefined,
      });
    } catch (err: any) {
      console.error("Error deleting product:", err);
      // Roll back the optimistic removal
      if (removed) {
        setProductos((prev) => [removed, ...prev]);
        if (removed.disponible) {
          setStats((s) => ({ ...s, productos: s.productos + 1 }));
        }
      }
      const msg = err?.message || "Error al eliminar producto";
      setError(msg);
      toast.error({ message: "No se pudo eliminar", description: msg });
    }
  };

  
  const handleUpdateProduct = async (id: string, data: any, newImageFile?: File | null) => {
    try {
      let imagen_url = data.imagen_url;
      if (newImageFile) {
        // Delete old image first if it exists
        const old = productos.find((p) => p.id === id);
        if (old?.imagen_url) deleteImageFromStorage(old.imagen_url).catch(() => {});
        imagen_url = await uploadImage(newImageFile, "productos");
      }
      const payload = { ...data, imagen_url: imagen_url || null };
      await actualizarProducto(id, payload);
      // Optimistic update — no loadData()
      setProductos((prev) =>
        prev.map((p) => p.id === id ? { ...p, ...payload } : p)
      );
      showActionOverlay("success", "Producto actualizado"); toast.success({ message: "Producto actualizado", description: data.nombre, duration: 2000 });
      return true;
    } catch (err: any) {
      toast.error({ message: "No se pudo actualizar", description: err?.message });
      return false;
    }
  };

  // ── Update category (optimistic) ──
  const handleUpdateCategoria = async (id: string, data: { nombre: string; descripcion: string }) => {
    try {
      await actualizarCategoria(id, data);
      setCategorias((prev) =>
        prev.map((c) => c.id === id ? { ...c, ...data } : c)
      );
      showActionOverlay("success", "Categoría actualizada"); toast.success({ message: "Categoría actualizada", description: data.nombre, duration: 2000 });
      return true;
    } catch (err: any) {
      toast.error({ message: "No se pudo actualizar la categoría", description: err?.message });
      return false;
    }
  };

  // ── Delete category (optimistic) ──
  const handleDeleteCategoria = async (id: string) => {
    const removed = categorias.find((c) => c.id === id);
    try {
      setCategorias((prev) => prev.filter((c) => c.id !== id));
      await eliminarCategoria(id);
      showActionOverlay("delete", "Categoría eliminada"); toast.success({ message: "Categoría eliminada", description: removed?.nombre });
    } catch (err: any) {
      if (removed) setCategorias((prev) => [...prev, removed]);
      toast.error({ message: "No se pudo eliminar la categoría", description: err?.message });
    }
  };

  const handleCreateMesa = async () => {
    if (!newMesa.numero) return;
    setSaving(true);
    setError(null);
    try {
      const created = await crearMesa({
        id_restaurante: idRestaurante,
        numero: parseInt(newMesa.numero),
        capacidad: parseInt(newMesa.capacidad) || 4,
      });
      if (created && created.id) {
        setMesas((prev) => [created, ...prev]);
        setStats((s) => ({ ...s, mesas: s.mesas + (created.activa ? 1 : 0) }));
      }
      setShowMesaModal(false);
      setNewMesa({ numero: "", capacidad: "4" });
      showActionOverlay("success", "Mesa creada");
      toast.success({
        message: "Mesa creada",
        description: `Mesa ${newMesa.numero} lista. Su QR ya está disponible.`,
      });
    } catch (err: any) {
      console.error("Error creating mesa:", err);
      const msg = err?.message || "Error al crear mesa";
      setError(msg);
      toast.error({ message: "No se pudo crear la mesa", description: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategoria = async () => {
    if (!newCat.nombre) return;
    setSaving(true);
    setError(null);
    try {
      const created = await crearCategoria({
        id_restaurante: idRestaurante,
        nombre: newCat.nombre,
        descripcion: newCat.descripcion,
        orden: categorias.length + 1,
      });
      if (created && created.id) {
        setCategorias((prev) => [...prev, created]);
      }
      setShowCatModal(false);
      setNewCat({ nombre: "", descripcion: "" });
      showActionOverlay("success", "Categoría creada");
      toast.success({
        message: "Categoría creada",
        description: newCat.nombre,
      });
    } catch (err: any) {
      console.error("Error creating category:", err);
      const msg = err?.message || "Error al crear categoría";
      setError(msg);
      toast.error({ message: "No se pudo crear la categoría", description: msg });
    } finally {
      setSaving(false);
    }
  };

  const getQrUrl = (mesaSlug: string) => {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    if (!restaurante?.slug) return `${base}/m/${mesaSlug}`;
    return `${base}/${restaurante.slug}/m/${mesaSlug}`;
  };

  const clearError = () => setError(null);

  // ── Filtrado por búsqueda ──
  const productosFiltrados = productos.filter(
    (p: any) => !p.deleted_at && p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const categoriasFiltradas = categorias.filter(
    (c: any) => c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    // Estado
    activeTab, searchTerm, loading, saving, error,
    productos, productosFiltrados, categorias, categoriasFiltradas,
    mesas, stats,
    showProductModal, showMesaModal, showCatModal,
    newProd, newMesa, newCat,
    // Acciones
    setActiveTab, setSearchTerm,
    setShowProductModal, setShowMesaModal, setShowCatModal,
    setNewProd, setNewMesa, setNewCat,
    handleCreateProduct, handleToggleDisponible, handleDeleteProduct,
    handleUpdateProduct, handleUpdateCategoria, handleDeleteCategoria,
    handleCreateMesa, handleCreateCategoria,
    getQrUrl, loadData, clearError,
  };
}

