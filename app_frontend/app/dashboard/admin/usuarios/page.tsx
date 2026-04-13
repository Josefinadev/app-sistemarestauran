"use client";

import { useState, useEffect, useCallback } from "react";
import { getUsuarios, actualizarUsuario, eliminarUsuario } from "@/lib/api";
import { crearUsuarioAuth, cambiarPasswordAuth } from "@/lib/api";
import {
  Users, Plus, X, Crown, Flame, UtensilsCrossed, Wallet, UserCircle,
  Search, Shield, Trash2, ToggleLeft, ToggleRight, Mail, Pencil,
  Lock, Eye, EyeOff, AlertTriangle, Check, Key,
} from "lucide-react";

const ID_RESTAURANTE = "a0000000-0000-0000-0000-000000000001";

const roleConfig: Record<string, { label: string; Icon: any; color: string }> = {
  admin: { label: "Admin", Icon: Crown, color: "var(--primary)" },
  cocina: { label: "Cocina", Icon: Flame, color: "var(--secondary)" },
  mesero: { label: "Mesero", Icon: UtensilsCrossed, color: "var(--tertiary)" },
  caja: { label: "Cajero", Icon: Wallet, color: "var(--success)" },
  cliente: { label: "Cliente", Icon: UserCircle, color: "var(--text-muted)" },
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRol, setFilterRol] = useState<string>("all");

  // ── Modal de Crear ──
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState("");
  const [showCreatePwd, setShowCreatePwd] = useState(false);
  const [newUser, setNewUser] = useState({ nombre: "", email: "", rol: "mesero", password: "" });

  // ── Modal de Editar ──
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [editData, setEditData] = useState({ nombre: "", email: "", rol: "" });
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // ── Modal de Cambiar Contraseña ──
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdUser, setPwdUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);

  // ── Modal de Confirmar Eliminación ──
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUser, setDeleteUser] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Feedback ──
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUsuarios(ID_RESTAURANTE);
      setUsuarios(data || []);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ═══════════════════════════════════════════
  // CREAR USUARIO (con Supabase Auth)
  // ═══════════════════════════════════════════
  const handleCreate = async () => {
    setCreateError("");

    if (!newUser.nombre.trim()) { setCreateError("El nombre es obligatorio."); return; }
    if (!newUser.email.trim()) { setCreateError("El email es obligatorio."); return; }
    if (!isValidEmail(newUser.email)) { setCreateError("Ingresa un email válido (ej: usuario@gmail.com)."); return; }
    if (!newUser.password.trim()) { setCreateError("La contraseña es obligatoria."); return; }
    if (newUser.password.length < 6) { setCreateError("La contraseña debe tener al menos 6 caracteres."); return; }

    setSaving(true);
    try {
      await crearUsuarioAuth({
        id_restaurante: ID_RESTAURANTE,
        nombre: newUser.nombre.trim(),
        email: newUser.email.trim().toLowerCase(),
        rol: newUser.rol,
        password: newUser.password,
      });
      setShowCreateModal(false);
      setNewUser({ nombre: "", email: "", rol: "mesero", password: "" });
      showFeedback("success", `✅ Usuario "${newUser.nombre}" creado exitosamente.`);
      loadUsers();
    } catch (err: any) {
      setCreateError(err.message || "Error al crear usuario.");
    } finally {
      setSaving(false);
    }
  };

  // ═══════════════════════════════════════════
  // EDITAR USUARIO
  // ═══════════════════════════════════════════
  const openEditModal = (user: any) => {
    setEditUser(user);
    setEditData({ nombre: user.nombre, email: user.email || "", rol: user.rol });
    setEditError("");
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    setEditError("");
    if (!editData.nombre.trim()) { setEditError("El nombre es obligatorio."); return; }
    if (editData.email && !isValidEmail(editData.email)) { setEditError("Ingresa un email válido."); return; }

    setEditSaving(true);
    try {
      await actualizarUsuario(editUser.id, {
        nombre: editData.nombre.trim(),
        email: editData.email.trim().toLowerCase() || null,
        rol: editData.rol,
      });
      setShowEditModal(false);
      showFeedback("success", `✅ Usuario "${editData.nombre}" actualizado.`);
      loadUsers();
    } catch (err: any) {
      setEditError(err.message || "Error al actualizar usuario.");
    } finally {
      setEditSaving(false);
    }
  };

  // ═══════════════════════════════════════════
  // CAMBIAR CONTRASEÑA
  // ═══════════════════════════════════════════
  const openPwdModal = (user: any) => {
    setPwdUser(user);
    setNewPassword("");
    setPwdError("");
    setShowPwd(false);
    setShowPwdModal(true);
  };

  const handleChangePassword = async () => {
    setPwdError("");
    if (!newPassword.trim()) { setPwdError("Ingresa la nueva contraseña."); return; }
    if (newPassword.length < 6) { setPwdError("Mínimo 6 caracteres."); return; }

    setPwdSaving(true);
    try {
      await cambiarPasswordAuth(pwdUser.id, newPassword);
      setShowPwdModal(false);
      showFeedback("success", `🔑 Contraseña de "${pwdUser.nombre}" actualizada.`);
    } catch (err: any) {
      setPwdError(err.message || "Error al cambiar contraseña.");
    } finally {
      setPwdSaving(false);
    }
  };

  // ═══════════════════════════════════════════
  // ACTIVAR / DESACTIVAR
  // ═══════════════════════════════════════════
  const handleToggleActive = async (user: any) => {
    try {
      await actualizarUsuario(user.id, { activo: !user.activo });
      setUsuarios((prev) => prev.map((u) => u.id === user.id ? { ...u, activo: !u.activo } : u));
      showFeedback("success", user.activo ? `⏸️ ${user.nombre} desactivado.` : `▶️ ${user.nombre} activado.`);
    } catch (err) {
      console.error("Error toggling user:", err);
    }
  };

  // ═══════════════════════════════════════════
  // ELIMINAR PERMANENTEMENTE
  // ═══════════════════════════════════════════
  const openDeleteModal = (user: any) => {
    setDeleteUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await eliminarUsuario(deleteUser.id);
      setShowDeleteModal(false);
      showFeedback("success", `🗑️ Usuario "${deleteUser.nombre}" eliminado permanentemente.`);
      loadUsers();
    } catch (err: any) {
      showFeedback("error", err.message || "Error al eliminar usuario.");
    } finally {
      setDeleting(false);
    }
  };

  // ═══════════════════════════════════════════
  // FILTRADO
  // ═══════════════════════════════════════════
  const filteredUsers = usuarios.filter((u) => {
    const matchSearch = u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (u.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchRol = filterRol === "all" || u.rol === filterRol;
    return matchSearch && matchRol;
  });

  const rolCounts = usuarios.reduce((acc: Record<string, number>, u) => {
    acc[u.rol] = (acc[u.rol] || 0) + 1;
    return acc;
  }, {});

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 16 }} />)}
        </div>
        <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Feedback Toast ── */}
      {feedback && (
        <div
          className="animate-fade-in"
          style={{
            position: "fixed", top: 20, right: 20, zIndex: 1000,
            padding: "14px 20px", borderRadius: 12,
            background: feedback.type === "success" ? "rgba(74,222,128,0.12)" : "rgba(226,114,91,0.12)",
            border: `1px solid ${feedback.type === "success" ? "rgba(74,222,128,0.3)" : "rgba(226,114,91,0.3)"}`,
            color: feedback.type === "success" ? "var(--success)" : "var(--secondary)",
            fontSize: 13, fontWeight: 500,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-noto-serif), serif", fontSize: 24, fontWeight: 400, color: "var(--text)", margin: "0 0 4px" }}>
            Gestión de <em style={{ color: "var(--primary)" }}>Usuarios</em>
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>{usuarios.length} usuarios registrados</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowCreateModal(true); setCreateError(""); setNewUser({ nombre: "", email: "", rol: "mesero", password: "" }); }} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> Nuevo usuario
        </button>
      </div>

      {/* ── Role Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        {Object.entries(roleConfig).filter(([k]) => k !== "cliente").map(([key, cfg]) => {
          const Icon = cfg.Icon;
          return (
            <div key={key}
              className="card-flat"
              onClick={() => setFilterRol(filterRol === key ? "all" : key)}
              style={{ padding: "16px 20px", cursor: "pointer", borderLeft: filterRol === key ? `3px solid ${cfg.color}` : "3px solid transparent", transition: "all 0.2s" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>{cfg.label}</p>
                  <p style={{ fontSize: 28, fontWeight: 700, color: cfg.color, margin: "4px 0 0" }}>{rolCounts[key] || 0}</p>
                </div>
                <Icon size={24} color={cfg.color} style={{ opacity: 0.4 }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Search ── */}
      <div style={{ position: "relative", maxWidth: 400 }}>
        <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input type="text" placeholder="Buscar usuarios..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input" style={{ paddingLeft: 36 }} />
      </div>

      {/* ── Users Table ── */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const cfg = roleConfig[user.rol] || roleConfig.cliente;
              const RoleIcon = cfg.Icon;
              return (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${cfg.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <RoleIcon size={14} color={cfg.color} />
                      </div>
                      <span style={{ fontWeight: 500, color: "var(--text)" }}>{user.nombre}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{user.email || "—"}</td>
                  <td>
                    <span className="badge" style={{ background: `${cfg.color}15`, color: cfg.color }}>
                      <Shield size={10} /> {cfg.label}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.activo ? "badge-ready" : "badge-cancelled"}`}>
                      {user.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      {/* Editar */}
                      <button onClick={() => openEditModal(user)} className="btn btn-ghost btn-sm" title="Editar usuario" style={{ padding: "4px 8px" }}>
                        <Pencil size={14} color="var(--primary)" />
                      </button>
                      {/* Cambiar contraseña */}
                      {user.auth_id && (
                        <button onClick={() => openPwdModal(user)} className="btn btn-ghost btn-sm" title="Cambiar contraseña" style={{ padding: "4px 8px" }}>
                          <Key size={14} color="var(--tertiary)" />
                        </button>
                      )}
                      {/* Toggle activo */}
                      <button onClick={() => handleToggleActive(user)} className="btn btn-ghost btn-sm" title={user.activo ? "Desactivar" : "Activar"} style={{ padding: "4px 8px" }}>
                        {user.activo ? <ToggleRight size={16} color="var(--success)" /> : <ToggleLeft size={16} color="var(--text-muted)" />}
                      </button>
                      {/* Eliminar */}
                      <button onClick={() => openDeleteModal(user)} className="btn btn-ghost btn-sm" title="Eliminar permanentemente" style={{ padding: "4px 8px" }}>
                        <Trash2 size={14} color="var(--secondary)" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredUsers.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No se encontraron usuarios</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ═══════════════════════════════════════════
          MODAL: CREAR USUARIO
          ═══════════════════════════════════════════ */}
      {showCreateModal && (
        <>
          <div className="overlay" onClick={() => setShowCreateModal(false)} />
          <div className="modal" style={{ background: "var(--bg-elevated)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 440, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Plus size={18} color="var(--primary)" /> Nuevo Usuario
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color="var(--text-muted)" /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Nombre */}
              <div>
                <p className="label" style={{ marginBottom: 6 }}>Nombre completo *</p>
                <input className="input" placeholder="Nombre del empleado" value={newUser.nombre} onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })} />
              </div>

              {/* Email */}
              <div>
                <p className="label" style={{ marginBottom: 6 }}>Correo electrónico *</p>
                <div style={{ position: "relative" }}>
                  <Mail size={14} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    className="input"
                    placeholder="usuario@gmail.com"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    style={{ paddingLeft: 36 }}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <p className="label" style={{ marginBottom: 6 }}>Contraseña * <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400 }}>(mínimo 6 caracteres)</span></p>
                <div style={{ position: "relative" }}>
                  <Lock size={14} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    className="input"
                    placeholder="••••••••"
                    type={showCreatePwd ? "text" : "password"}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    style={{ paddingLeft: 36, paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePwd(!showCreatePwd)}
                    style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
                  >
                    {showCreatePwd ? <EyeOff size={14} color="var(--text-muted)" /> : <Eye size={14} color="var(--text-muted)" />}
                  </button>
                </div>
              </div>

              {/* Rol */}
              <div>
                <p className="label" style={{ marginBottom: 8 }}>Seleccionar rol *</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {Object.entries(roleConfig).filter(([k]) => k !== "cliente").map(([key, cfg]) => {
                    const RoleIcon = cfg.Icon;
                    return (
                      <button key={key} type="button" onClick={() => setNewUser({ ...newUser, rol: key })}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: newUser.rol === key ? `${cfg.color}15` : "var(--surface)", border: newUser.rol === key ? `1px solid ${cfg.color}` : "1px solid var(--border)", borderRadius: "var(--radius-md)", cursor: "pointer", transition: "all 0.15s" }}>
                        <RoleIcon size={16} color={newUser.rol === key ? cfg.color : "var(--text-muted)"} />
                        <span style={{ fontSize: 12, fontWeight: 500, color: newUser.rol === key ? cfg.color : "var(--text-secondary)" }}>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error */}
              {createError && (
                <p className="animate-fade-in" style={{ fontSize: 12, color: "var(--secondary)", margin: 0, padding: "8px 12px", background: "rgba(226,114,91,0.08)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(226,114,91,0.2)" }}>
                  {createError}
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={handleCreate} className="btn btn-primary" disabled={saving} style={{ flex: 1, opacity: saving ? 0.6 : 1 }}>
                {saving ? "Creando..." : "Crear usuario"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════
          MODAL: EDITAR USUARIO
          ═══════════════════════════════════════════ */}
      {showEditModal && editUser && (
        <>
          <div className="overlay" onClick={() => setShowEditModal(false)} />
          <div className="modal" style={{ background: "var(--bg-elevated)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 440, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Pencil size={18} color="var(--primary)" /> Editar Usuario
              </h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color="var(--text-muted)" /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Nombre */}
              <div>
                <p className="label" style={{ marginBottom: 6 }}>Nombre</p>
                <input className="input" value={editData.nombre} onChange={(e) => setEditData({ ...editData, nombre: e.target.value })} />
              </div>

              {/* Email */}
              <div>
                <p className="label" style={{ marginBottom: 6 }}>Correo electrónico</p>
                <div style={{ position: "relative" }}>
                  <Mail size={14} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input className="input" type="email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} style={{ paddingLeft: 36 }} />
                </div>
              </div>

              {/* Rol */}
              <div>
                <p className="label" style={{ marginBottom: 8 }}>Rol</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {Object.entries(roleConfig).filter(([k]) => k !== "cliente").map(([key, cfg]) => {
                    const RoleIcon = cfg.Icon;
                    return (
                      <button key={key} type="button" onClick={() => setEditData({ ...editData, rol: key })}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: editData.rol === key ? `${cfg.color}15` : "var(--surface)", border: editData.rol === key ? `1px solid ${cfg.color}` : "1px solid var(--border)", borderRadius: "var(--radius-md)", cursor: "pointer", transition: "all 0.15s" }}>
                        <RoleIcon size={16} color={editData.rol === key ? cfg.color : "var(--text-muted)"} />
                        <span style={{ fontSize: 12, fontWeight: 500, color: editData.rol === key ? cfg.color : "var(--text-secondary)" }}>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error */}
              {editError && (
                <p className="animate-fade-in" style={{ fontSize: 12, color: "var(--secondary)", margin: 0, padding: "8px 12px", background: "rgba(226,114,91,0.08)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(226,114,91,0.2)" }}>
                  {editError}
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={handleEdit} className="btn btn-primary" disabled={editSaving} style={{ flex: 1, opacity: editSaving ? 0.6 : 1 }}>
                {editSaving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════
          MODAL: CAMBIAR CONTRASEÑA
          ═══════════════════════════════════════════ */}
      {showPwdModal && pwdUser && (
        <>
          <div className="overlay" onClick={() => setShowPwdModal(false)} />
          <div className="modal" style={{ background: "var(--bg-elevated)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 400, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Key size={18} color="var(--tertiary)" /> Cambiar Contraseña
              </h3>
              <button onClick={() => setShowPwdModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color="var(--text-muted)" /></button>
            </div>

            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 16px" }}>
              Cambiar contraseña de <strong style={{ color: "var(--text)" }}>{pwdUser.nombre}</strong> ({pwdUser.email})
            </p>

            <div style={{ position: "relative" }}>
              <Lock size={14} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                className="input"
                placeholder="Nueva contraseña (mín. 6 caracteres)"
                type={showPwd ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ paddingLeft: 36, paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
              >
                {showPwd ? <EyeOff size={14} color="var(--text-muted)" /> : <Eye size={14} color="var(--text-muted)" />}
              </button>
            </div>

            {pwdError && (
              <p className="animate-fade-in" style={{ fontSize: 12, color: "var(--secondary)", margin: "12px 0 0", padding: "8px 12px", background: "rgba(226,114,91,0.08)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(226,114,91,0.2)" }}>
                {pwdError}
              </p>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowPwdModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={handleChangePassword} className="btn btn-primary" disabled={pwdSaving} style={{ flex: 1, opacity: pwdSaving ? 0.6 : 1 }}>
                {pwdSaving ? "Actualizando..." : "Cambiar contraseña"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════
          MODAL: CONFIRMAR ELIMINACIÓN
          ═══════════════════════════════════════════ */}
      {showDeleteModal && deleteUser && (
        <>
          <div className="overlay" onClick={() => setShowDeleteModal(false)} />
          <div className="modal" style={{ background: "var(--bg-elevated)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 420, border: "1px solid var(--border)" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(226,114,91,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <AlertTriangle size={28} color="var(--secondary)" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", margin: "0 0 8px" }}>¿Eliminar usuario?</h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                Estás a punto de eliminar <strong style={{ color: "var(--text)" }}>permanentemente</strong> a:
              </p>
            </div>

            <div style={{ padding: "14px 16px", background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)", marginBottom: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>{deleteUser.nombre}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>{deleteUser.email || "Sin email"} · {roleConfig[deleteUser.rol]?.label || deleteUser.rol}</p>
            </div>

            <p style={{ fontSize: 11, color: "var(--secondary)", margin: "0 0 16px", padding: "8px 12px", background: "rgba(226,114,91,0.06)", borderRadius: 8, border: "1px solid rgba(226,114,91,0.15)", lineHeight: 1.5 }}>
              ⚠️ Esta acción es <strong>irreversible</strong>. Se eliminará de la base de datos y del sistema de autenticación. No podrá volver a iniciar sesión.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button
                onClick={handleDeleteConfirm}
                className="btn btn-sm"
                disabled={deleting}
                style={{
                  flex: 1, padding: "12px",
                  background: "rgba(226,114,91,0.15)", color: "var(--secondary)",
                  border: "1px solid rgba(226,114,91,0.3)", borderRadius: 12,
                  fontWeight: 600, cursor: "pointer",
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
