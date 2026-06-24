"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getUsuarios, actualizarUsuario, eliminarUsuario } from "@/lib/api";
import { crearUsuarioAuth, cambiarPasswordAuth } from "@/lib/api";
import { useAuth } from "@/lib/store";
import {
  Users, Plus, Crown, Flame, UtensilsCrossed, Wallet, UserCircle,
  Search, Trash2, Mail, Pencil, Lock, Eye, EyeOff,
  AlertTriangle, Key, UserPlus, ShieldCheck, AlertCircle, ToggleLeft, ToggleRight, Shield,
  ChefHat, CreditCard, User,
} from "lucide-react";
import { Modal, ModalFooter } from "@/components/Modal";
import { toast } from "@/lib/toast";
import { showActionOverlay, ConfirmDeleteModal } from "@/components/ActionFeedback";
import { sanitize, validate } from "@/lib/inputValidation";

/* ═══════════════════════════════════════════════════════════
   VIEW — Gestión de Usuarios (Wine Design)
   ═══════════════════════════════════════════════════════════ */

const roleConfig: Record<string, { label: string; Icon: any; color: string; iconBg: string; description: string }> = {
  admin: { label: "Admin", Icon: Crown, color: "var(--primary)", iconBg: "rgba(197,160,89,0.1)", description: "Acceso completo al sistema" },
  cocina: { label: "Cocina", Icon: ChefHat, color: "#16a34a", iconBg: "rgba(22,163,74,0.1)", description: "Gestiona pedidos y cocina" },
  mesero: { label: "Mesero", Icon: User, color: "var(--tertiary)", iconBg: "rgba(74,108,247,0.1)", description: "Toma pedidos y atiende mesas" },
  caja: { label: "Cajero", Icon: CreditCard, color: "#9333ea", iconBg: "rgba(147,51,234,0.1)", description: "Procesa pagos y cierra caja" },
  cliente: { label: "Cliente", Icon: UserCircle, color: "var(--text-muted)", iconBg: "rgba(155,147,134,0.1)", description: "Usuario cliente" },
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

const ITEMS_PER_PAGE = 8;

export default function UsuariosPage() {
  const { restaurante } = useAuth();
  const restauranteId = restaurante?.id;

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRol, setFilterRol] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState("");
  const [showCreatePwd, setShowCreatePwd] = useState(false);
  const [newUser, setNewUser] = useState({ nombre: "", email: "", rol: "mesero", password: "" });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [editData, setEditData] = useState({ nombre: "", email: "", rol: "" });
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdUser, setPwdUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUser, setDeleteUser] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!restauranteId) return;
    try {
      setLoading(true);
      const data = await getUsuarios(restauranteId);
      setUsuarios(data || []);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  }, [restauranteId]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterRol]);

  const createErrors = useMemo(() => ({
    nombre: validate(newUser.nombre, "text", { required: true }),
    email: validate(newUser.email, "email", { required: true }),
    password: newUser.password.length === 0 ? "La contraseña es obligatoria" : newUser.password.length < 6 ? "Mínimo 6 caracteres" : null,
  }), [newUser.nombre, newUser.email, newUser.password]);

  const isCreateFormValid = !createErrors.nombre && !createErrors.email && !createErrors.password;

  const handleCreate = async () => {
    if (!restauranteId) return;
    setCreateError("");
    if (!isCreateFormValid) return;
    setSaving(true);
    try {
      await crearUsuarioAuth({
        id_restaurante: restauranteId,
        nombre: newUser.nombre.trim(),
        email: newUser.email.trim().toLowerCase(),
        rol: newUser.rol,
        password: newUser.password,
      });
      setShowCreateModal(false);
      setNewUser({ nombre: "", email: "", rol: "mesero", password: "" });
      showActionOverlay("success", "Usuario creado");
      setSearchTerm(""); // Always reset search to show all users after creating
      setFilterRol("all");
      toast.success({ message: "Usuario creado", description: `${newUser.nombre} ya puede iniciar sesión.` });
      loadUsers();
    } catch (err: any) {
      setCreateError(err.message || "Error al crear usuario.");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (user: any) => {
    setEditUser(user);
    setEditData({ nombre: user.nombre, email: user.email || "", rol: user.rol });
    setEditError("");
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    setEditError("");
    if (!editData.nombre.trim()) { setEditError("El nombre es obligatorio."); return; }
    if (editData.email && !isValidEmail(editData.email)) { setEditError("Email inválido."); return; }
    setEditSaving(true);
    try {
      await actualizarUsuario(editUser.id, {
        nombre: editData.nombre.trim(),
        email: editData.email.trim().toLowerCase() || null,
        rol: editData.rol,
      });
      setShowEditModal(false);
      showActionOverlay("success", "Usuario actualizado"); toast.success({ message: "Usuario actualizado", description: editData.nombre });
      loadUsers();
    } catch (err: any) {
      setEditError(err.message || "Error al actualizar usuario.");
    } finally {
      setEditSaving(false);
    }
  };

  const openPwdModal = (user: any) => {
    setPwdUser(user);
    setNewPassword("");
    setPwdError("");
    setShowPwd(false);
    setShowPwdModal(true);
  };

  const handleChangePassword = async () => {
    setPwdError("");
    if (!newPassword.trim()) { setPwdError("Ingresa la contraseña."); return; }
    if (newPassword.length < 6) { setPwdError("Mínimo 6 caracteres."); return; }
    setPwdSaving(true);
    try {
      await cambiarPasswordAuth(pwdUser.id, newPassword);
      setShowPwdModal(false);
      toast.success({ message: "Contraseña actualizada", description: pwdUser.nombre });
    } catch (err: any) {
      setPwdError(err.message || "Error al cambiar contraseña.");
    } finally {
      setPwdSaving(false);
    }
  };

  const handleToggleActive = async (user: any) => {
    try {
      await actualizarUsuario(user.id, { activo: !user.activo });
      setUsuarios((prev) => prev.map((u) => u.id === user.id ? { ...u, activo: !u.activo } : u));
      toast.success({ message: user.activo ? "Usuario desactivado" : "Usuario activado", description: user.nombre, duration: 2500 });
    } catch (err) {
      toast.error({ message: "No se pudo cambiar el estado" });
    }
  };

  const openDeleteModal = (user: any) => { setDeleteUser(user); setShowDeleteModal(true); };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await eliminarUsuario(deleteUser.id);
      setShowDeleteModal(false);
      showActionOverlay("delete", "Usuario eliminado"); toast.success({ message: "Usuario eliminado", description: deleteUser.nombre });
      loadUsers();
    } catch (err: any) {
      toast.error({ message: "No se pudo eliminar", description: err.message });
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = usuarios.filter((u) => {
    const matchSearch = u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || (u.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchRol = filterRol === "all" || u.rol === filterRol;
    return matchSearch && matchRol;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const rolCounts = usuarios.reduce((acc: Record<string, number>, u) => {
    acc[u.rol] = (acc[u.rol] || 0) + 1;
    return acc;
  }, {});

  if (loading && !usuarios.length) {
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

      {/* Stat cards by role */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        {Object.entries(roleConfig).filter(([k]) => k !== "cliente").map(([key, cfg]) => {
          const Icon = cfg.Icon;
          const isActive = filterRol === key;
          return (
            <div
              key={key}
              className="dash-stat-card"
              onClick={() => setFilterRol(isActive ? "all" : key)}
              style={{ cursor: "pointer", outline: isActive ? `2px solid var(--primary)` : "none", outlineOffset: 2 }}
            >
              <div className="dash-stat-icon" style={{ background: cfg.iconBg }}>
                <Icon size={17} color={cfg.color} />
              </div>
              <div className="dash-stat-body">
                <p className="dash-stat-label">{cfg.label}</p>
                <p className="dash-stat-value" style={{ color: cfg.color }}>{rolCounts[key] || 0}</p>
                <p className="dash-stat-sub">Usuarios</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ position: "relative", maxWidth: 380 }}>
          <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input type="text" autoComplete="off" placeholder="Buscar por nombre o email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input" style={{ paddingLeft: 36 }} />
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => { setShowCreateModal(true); setCreateError(""); setNewUser({ nombre: "", email: "", rol: "mesero", password: "" }); }}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <Plus size={14} /> Crear usuario
        </button>
      </div>

      {/* User table */}
      <div className="card-flat" style={{ overflow: "hidden" }}>
        <div className="table-container" style={{ border: "none" }}>
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
              {paginatedUsers.map((user) => {
                const cfg = roleConfig[user.rol] || roleConfig.cliente;
                const RoleIcon = cfg.Icon;
                return (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: cfg.iconBg, border: `1.5px solid ${cfg.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: cfg.color, flexShrink: 0 }}>
                          {user.nombre?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>{user.nombre}</p>
                          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, textTransform: "capitalize" }}>{cfg.label}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{user.email || "—"}</td>
                    <td>
                      <span className="badge" style={{ background: cfg.iconBg, color: cfg.color, border: `1px solid ${cfg.color}20` }}>
                        <RoleIcon size={10} style={{ marginRight: 4 }} /> {cfg.label}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${user.activo ? "badge-ready" : "badge-cancelled"}`}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: user.activo ? "var(--success)" : "var(--secondary)", display: "inline-block", marginRight: 5 }} />
                        {user.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => openEditModal(user)} className="btn btn-ghost btn-sm" title="Editar" style={{ padding: "4px 8px" }}><Pencil size={14} color="var(--primary)" /></button>
                        {user.auth_id && <button onClick={() => openPwdModal(user)} className="btn btn-ghost btn-sm" title="Cambiar contraseña" style={{ padding: "4px 8px" }}><Key size={14} color="var(--tertiary)" /></button>}
                        <button onClick={() => handleToggleActive(user)} className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}>
                          {user.activo ? <ToggleRight size={16} color="var(--success)" /> : <ToggleLeft size={16} color="var(--text-muted)" />}
                        </button>
                        <button onClick={() => openDeleteModal(user)} className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}><Trash2 size={14} color="var(--secondary)" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedUsers.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: 13 }}>No hay usuarios con este filtro</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="table-pagination">
          <span className="table-pagination-info">
            Mostrando {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredUsers.length)} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} de {filteredUsers.length} usuarios
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
      </div>

      {/* ══ MODALS ══ */}
      {/* Create user modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear usuario"
        description="Crea una cuenta con acceso al panel."
        icon={<UserPlus size={18} />}
        accentColor="var(--primary)"
        size="md"
        footer={
          <ModalFooter>
            <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancelar</button>
            <button onClick={handleCreate} className="btn btn-primary" disabled={saving || !isCreateFormValid} style={{ opacity: saving || !isCreateFormValid ? 0.5 : 1 }}>
              {saving ? "Creando..." : "Crear usuario"}
            </button>
          </ModalFooter>
        }
      >
        <div className="premium-field">
          <label className="premium-field-label">Nombre</label>
          <input className={`input ${createErrors.nombre ? "input--invalid" : ""}`} placeholder="Ingresa el nombre completo" value={newUser.nombre} onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })} autoFocus />
          {createErrors.nombre && <span className="premium-field-error"><AlertCircle size={11} /> {createErrors.nombre}</span>}
        </div>
        <div className="premium-field">
          <label className="premium-field-label">Email</label>
          <div style={{ position: "relative" }}>
            <Mail size={14} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input className={`input ${createErrors.email ? "input--invalid" : ""}`} placeholder="ejemplo@correo.com" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: sanitize(e.target.value, "email") })} style={{ paddingLeft: 36 }} />
          </div>
          {createErrors.email && <span className="premium-field-error"><AlertCircle size={11} /> {createErrors.email}</span>}
        </div>
        <div className="premium-field">
          <label className="premium-field-label">Contraseña</label>
          <div style={{ position: "relative" }}>
            <Lock size={14} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input className={`input ${createErrors.password ? "input--invalid" : ""}`} placeholder="••••••••" type={showCreatePwd ? "text" : "password"} value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} style={{ paddingLeft: 36, paddingRight: 40 }} />
            <button type="button" onClick={() => setShowCreatePwd(!showCreatePwd)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              {showCreatePwd ? <EyeOff size={14} color="var(--text-muted)" /> : <Eye size={14} color="var(--text-muted)" />}
            </button>
          </div>
          {createErrors.password ? <span className="premium-field-error"><AlertCircle size={11} /> {createErrors.password}</span> : <span className="premium-field-hint">Mínimo 6 caracteres.</span>}
        </div>
        <div className="premium-field">
          <label className="premium-field-label">Rol</label>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 10px" }}>Selecciona el rol que tendrá el usuario en el sistema</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {Object.entries(roleConfig).filter(([k]) => k !== "cliente").map(([key, cfg]) => {
              const RoleIcon = cfg.Icon;
              const active = newUser.rol === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNewUser({ ...newUser, rol: key })}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                    background: active ? cfg.iconBg : "var(--surface)",
                    border: `1.5px solid ${active ? cfg.color : "var(--border)"}`,
                    borderRadius: "var(--radius-md)", cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: cfg.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <RoleIcon size={16} color={cfg.color} />
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: active ? cfg.color : "var(--text)", margin: 0 }}>{cfg.label}</p>
                    <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>{cfg.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        {createError && <p style={{ fontSize: 12, color: "var(--secondary)", margin: 0, padding: "8px 12px", background: "rgba(226,114,91,0.08)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(226,114,91,0.2)" }}>{createError}</p>}
      </Modal>

      {/* Edit user modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Editar usuario" description="Actualiza los datos del miembro del equipo." icon={<Pencil size={18} />} accentColor="var(--primary)" size="md"
        footer={<ModalFooter><button onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancelar</button><button onClick={handleEdit} className="btn btn-primary" disabled={editSaving} style={{ opacity: editSaving ? 0.6 : 1 }}>{editSaving ? "Guardando..." : "Guardar cambios"}</button></ModalFooter>}
      >
        <div className="premium-field"><label className="premium-field-label">Nombre</label><input className="input" value={editData.nombre} onChange={(e) => setEditData({ ...editData, nombre: e.target.value })} autoFocus /></div>
        <div className="premium-field"><label className="premium-field-label">Correo electrónico</label><input className="input" type="email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} /></div>
        <div className="premium-field">
          <label className="premium-field-label">Rol</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {Object.entries(roleConfig).filter(([k]) => k !== "cliente").map(([key, cfg]) => {
              const RoleIcon = cfg.Icon;
              const active = editData.rol === key;
              return (
                <button key={key} type="button" onClick={() => setEditData({ ...editData, rol: key })}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: active ? cfg.iconBg : "var(--surface)", border: `1.5px solid ${active ? cfg.color : "var(--border)"}`, borderRadius: "var(--radius-md)", cursor: "pointer", transition: "all 0.15s" }}>
                  <RoleIcon size={16} color={active ? cfg.color : "var(--text-muted)"} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: active ? cfg.color : "var(--text-secondary)" }}>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        {editError && <p style={{ fontSize: 12, color: "var(--secondary)", margin: 0, padding: "8px 12px", background: "rgba(226,114,91,0.08)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(226,114,91,0.2)" }}>{editError}</p>}
      </Modal>

      {/* Password modal */}
      <Modal open={showPwdModal} onClose={() => setShowPwdModal(false)} title="Nueva contraseña" description={pwdUser ? `Actualiza la contraseña de ${pwdUser.nombre}.` : undefined} icon={<ShieldCheck size={18} />} accentColor="var(--tertiary)" size="sm"
        footer={<ModalFooter><button onClick={() => setShowPwdModal(false)} className="btn btn-secondary">Cancelar</button><button onClick={handleChangePassword} className="btn btn-primary" disabled={pwdSaving} style={{ opacity: pwdSaving ? 0.6 : 1, background: "var(--tertiary)", borderColor: "var(--tertiary)" }}>{pwdSaving ? "Actualizando..." : "Actualizar"}</button></ModalFooter>}
      >
        <div className="premium-field">
          <label className="premium-field-label">Nueva contraseña</label>
          <div style={{ position: "relative" }}>
            <Lock size={14} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input className="input" placeholder="Nueva contraseña" type={showPwd ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ paddingLeft: 36, paddingRight: 40 }} autoFocus />
            <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              {showPwd ? <EyeOff size={14} color="var(--text-muted)" /> : <Eye size={14} color="var(--text-muted)" />}
            </button>
          </div>
          {pwdError && <span className="premium-field-error"><AlertCircle size={11} /> {pwdError}</span>}
          <span className="premium-field-hint">Mínimo 6 caracteres.</span>
        </div>
      </Modal>

      {/* Delete modal — replaced with premium ConfirmDeleteModal */}
      <ConfirmDeleteModal
        open={showDeleteModal}
        title="Eliminar usuario"
        message={`¿Estás seguro de que deseas eliminar a ${deleteUser?.nombre}? Esta acción no se puede deshacer.`}
        confirmLabel={deleting ? "Eliminando..." : "Eliminar"}
        type="danger"
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

