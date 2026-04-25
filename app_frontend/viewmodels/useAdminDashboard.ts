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

export function useAdminDashboard() {
  const { restaurante } = useAuth();
  const idRestaurante = restaurante?.id;

  const [activeTab, setActiveTab] = useState("productos");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

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
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateProduct = async (imageFile?: File | null) => {
    if (!newProd.nombre || !newProd.id_categoria || !newProd.precio) return false;
    setSaving(true);
    try {
      let imagen_url = newProd.imagen_url;
      if (imageFile) {
        imagen_url = await uploadImage(imageFile, "productos");
      }

      await crearProducto({
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
      setShowProductModal(false);
      setNewProd({ nombre: "", id_categoria: "", precio: "", descripcion: "", stock: "10", es_bebida: false, requiere_preparacion: true, imagen_url: "" });
      loadData();
      return true;
    } catch (err) {
      console.error("Error creating product:", err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDisponible = async (prod: any) => {
    try {
      await actualizarProducto(prod.id, { disponible: !prod.disponible });
      setProductos((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, disponible: !p.disponible } : p))
      );
    } catch (err) {
      console.error("Error toggling product:", err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await eliminarProducto(id);
      loadData();
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  const handleCreateMesa = async () => {
    if (!newMesa.numero) return;
    setSaving(true);
    try {
      await crearMesa({
        id_restaurante: idRestaurante,
        numero: parseInt(newMesa.numero),
        capacidad: parseInt(newMesa.capacidad) || 4,
      });
      setShowMesaModal(false);
      setNewMesa({ numero: "", capacidad: "4" });
      loadData();
    } catch (err) {
      console.error("Error creating mesa:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategoria = async () => {
    if (!newCat.nombre) return;
    setSaving(true);
    try {
      await crearCategoria({
        id_restaurante: idRestaurante,
        nombre: newCat.nombre,
        descripcion: newCat.descripcion,
        orden: categorias.length + 1,
      });
      setShowCatModal(false);
      setNewCat({ nombre: "", descripcion: "" });
      loadData();
    } catch (err) {
      console.error("Error creating category:", err);
    } finally {
      setSaving(false);
    }
  };

  const getQrUrl = (mesaSlug: string) => {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    if (!restaurante?.slug) return `${base}/m/${mesaSlug}`;
    return `${base}/${restaurante.slug}/m/${mesaSlug}`;
  };

  // ── Filtrado por búsqueda ──
  const productosFiltrados = productos.filter(
    (p: any) => !p.deleted_at && p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const categoriasFiltradas = categorias.filter(
    (c: any) => c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    // Estado
    activeTab, searchTerm, loading, saving,
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
    getQrUrl,
  };
}
