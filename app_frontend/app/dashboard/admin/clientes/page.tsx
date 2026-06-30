"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getUsuarios, enviarPromocionEmail } from "@/lib/api";
import { useAuth } from "@/lib/store";
import {
  Users, Search, Mail, AlertCircle, ToggleRight, ToggleLeft, UserCircle, CheckCircle, XCircle
} from "lucide-react";
import { Modal, ModalFooter } from "@/components/Modal";
import { toast } from "@/lib/toast";

const ITEMS_PER_PAGE = 10;

export default function ClientesPage() {
  const { restaurante } = useAuth();
  const restauranteId = restaurante?.id;

  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Selección para email
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal Email
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAsunto, setEmailAsunto] = useState("");
  const [emailMensaje, setEmailMensaje] = useState("");
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [emailError, setEmailError] = useState("");

  const loadClientes = useCallback(async () => {
    if (!restauranteId) return;
    try {
      setLoading(true);
      // getUsuarios ya viene filtrado por restaurante en el backend
      const data = await getUsuarios(restauranteId);
      // Filtramos solo los que son clientes
      setClientes(data?.filter((u: any) => u.rol === 'cliente') || []);
    } catch (err) {
      console.error("Error loading clientes:", err);
    } finally {
      setLoading(false);
    }
  }, [restauranteId]);

  useEffect(() => { loadClientes(); }, [loadClientes]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedClientes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedClientes.map(c => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleEnviarEmail = async () => {
    setEmailError("");
    if (!emailAsunto.trim()) { setEmailError("El asunto es obligatorio."); return; }
    if (!emailMensaje.trim()) { setEmailError("El mensaje es obligatorio."); return; }
    
    setEnviandoEmail(true);
    try {
      await enviarPromocionEmail(Array.from(selectedIds), emailAsunto, emailMensaje);
      setShowEmailModal(false);
      setEmailAsunto("");
      setEmailMensaje("");
      setSelectedIds(new Set());
      toast.success({ message: "Promoción enviada", description: "Los correos han sido enviados exitosamente." });
    } catch (err: any) {
      setEmailError(err.message || "Error al enviar correos.");
    } finally {
      setEnviandoEmail(false);
    }
  };

  const filteredClientes = clientes.filter((u) => 
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredClientes.length / ITEMS_PER_PAGE));
  const paginatedClientes = filteredClientes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading && !clientes.length) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="skeleton" style={{ height: 80, borderRadius: 16, width: 250 }} />
        <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Stat card */}
      <div style={{ display: "flex", gap: 16 }}>
        <div className="dash-stat-card" style={{ width: 250 }}>
          <div className="dash-stat-icon" style={{ background: "rgba(155,147,134,0.1)" }}>
            <Users size={17} color="var(--text-muted)" />
          </div>
          <div className="dash-stat-body">
            <p className="dash-stat-label">Total Clientes</p>
            <p className="dash-stat-value" style={{ color: "var(--text)" }}>{clientes.length}</p>
            <p className="dash-stat-sub">Registrados en la plataforma</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ position: "relative", maxWidth: 380, width: "100%" }}>
          <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input type="text" autoComplete="off" placeholder="Buscar cliente por nombre o email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input" style={{ paddingLeft: 36 }} />
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => { setEmailError(""); setShowEmailModal(true); }}
          disabled={selectedIds.size === 0}
          style={{ display: "flex", alignItems: "center", gap: 6, opacity: selectedIds.size === 0 ? 0.5 : 1 }}
        >
          <Mail size={14} /> Enviar Promoción ({selectedIds.size})
        </button>
      </div>

      {/* User table */}
      <div className="card-flat" style={{ overflow: "hidden" }}>
        <div className="table-container" style={{ border: "none" }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input 
                    type="checkbox" 
                    checked={paginatedClientes.length > 0 && selectedIds.size === paginatedClientes.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Cliente</th>
                <th>Email</th>
                <th>Estado Email</th>
                <th>Acceso</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClientes.map((user) => (
                <tr key={user.id}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(user.id)}
                      onChange={() => toggleSelect(user.id)}
                    />
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(155,147,134,0.1)", border: `1.5px solid var(--text-muted)30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--text-muted)", flexShrink: 0 }}>
                        {user.nombre?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>{user.nombre}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{user.email || "—"}</td>
                  <td>
                    {/* El estado verificado se sabrá en producción con Supabase Email Auth. Por ahora, mostramos un mock de Verificado o No Verificado */}
                    <span className="badge" style={{ background: "rgba(22,163,74,0.1)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.2)" }}>
                      <CheckCircle size={10} style={{ marginRight: 4 }} /> Registrado
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.activo ? "badge-ready" : "badge-cancelled"}`}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: user.activo ? "var(--success)" : "var(--secondary)", display: "inline-block", marginRight: 5 }} />
                      {user.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              ))}
              {paginatedClientes.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: 13 }}>No se encontraron clientes</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="table-pagination">
            <span className="table-pagination-info">
              Mostrando {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredClientes.length)} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredClientes.length)} de {filteredClientes.length} clientes
            </span>
            <div className="pagination">
              <button className="page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pg = i + 1;
                return (
                  <button key={pg} className={`page-btn ${pg === currentPage ? "page-btn--active" : ""}`} onClick={() => setCurrentPage(pg)}>{pg}</button>
                );
              })}
              <button className="page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* Email Modal */}
      <Modal
        open={showEmailModal}
        onClose={() => !enviandoEmail && setShowEmailModal(false)}
        title="Enviar Correo Promocional"
        description={`Se enviará este correo a ${selectedIds.size} cliente(s) seleccionado(s).`}
        icon={<Mail size={18} />}
        accentColor="var(--primary)"
        size="md"
        footer={
          <ModalFooter>
            <button onClick={() => setShowEmailModal(false)} className="btn btn-secondary" disabled={enviandoEmail}>Cancelar</button>
            <button onClick={handleEnviarEmail} className="btn btn-primary" disabled={enviandoEmail}>
              {enviandoEmail ? "Enviando..." : "Enviar Correo"}
            </button>
          </ModalFooter>
        }
      >
        <div className="premium-field">
          <label className="premium-field-label">Asunto del Correo</label>
          <input className="input" placeholder="Ej. ¡Oferta especial de fin de semana!" value={emailAsunto} onChange={(e) => setEmailAsunto(e.target.value)} autoFocus />
        </div>
        <div className="premium-field">
          <label className="premium-field-label">Mensaje (HTML o Texto)</label>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 10px" }}>Puedes usar etiquetas HTML básicas como &lt;b&gt;, &lt;br&gt;, &lt;h1&gt;</p>
          <textarea 
            className="input" 
            placeholder="Escribe el mensaje de la promoción aquí..." 
            value={emailMensaje} 
            onChange={(e) => setEmailMensaje(e.target.value)}
            style={{ minHeight: 120, resize: "vertical" }}
          />
        </div>
        {emailError && <p style={{ fontSize: 12, color: "var(--secondary)", margin: 0, padding: "8px 12px", background: "rgba(226,114,91,0.08)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(226,114,91,0.2)" }}>{emailError}</p>}
      </Modal>

    </div>
  );
}
