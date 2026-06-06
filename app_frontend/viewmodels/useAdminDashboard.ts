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
  uploadImage,
} from "@/lib/api";
import { useAuth } from "@/lib/store";
import { toast } from "@/lib/toast";

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
  const [stats, setStats] = useState({ productos: 0, mesas: 0, pedidosHoy: 0, ingresosHoy: 0 });

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
      const pagados = (pedidosData || []).filter((p: any) => p.estado_pago === "PAGADO");
      const ingresos = pagados.reduce((s: number, p: any) => s + Number(p.total), 0);

      setStats({
        productos: activePrds.length,
        mesas: activeMesas.length,
        pedidosHoy: (pedidosData || []).length,
        ingresosHoy: ingresos,
      });
    } catch (err: any) {
      console.error("Error loading admin data:", err);
      setError(err?.message || "Error cargando datos");
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
      // Optimistic update
      setProductos((prev) => prev.filter((p) => p.id !== id));
      if (removed?.disponible) {
        setStats((s) => ({ ...s, productos: Math.max(0, s.productos - 1) }));
      }
      await eliminarProducto(id);
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
    handleCreateMesa, handleCreateCategoria,
    getQrUrl, loadData, clearError,
  };
}
