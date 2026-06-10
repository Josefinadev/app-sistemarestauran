"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getUsuarios, actualizarUsuario, eliminarUsuario } from "@/lib/api";
import { crearUsuarioAuth, cambiarPasswordAuth } from "@/lib/api";
import { useAuth } from "@/lib/store";
import {
  Users, Plus, Crown, Flame, UtensilsCrossed, Wallet, UserCircle,
  Search, Shield, Trash2, ToggleLeft, ToggleRight, Mail, Pencil,
  Lock, Eye, EyeOff, AlertTriangle, Key, UserPlus, ShieldCheck, AlertCircle,
} from "lucide-react";
import { Modal, ModalFooter } from "@/components/Modal";
import { toast } from "@/lib/toast";
import { sanitize, validate } from "@/lib/inputValidation";

/* ═══════════════════════════════════════════════════════════
   VIEW — Gestión de Usuarios (Admin del Restaurante)
   Permite crear, editar y eliminar personal (meseros, cocina, etc.)
   ═══════════════════════════════════════════════════════════ */

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
  const { restaurante } = useAuth();
  const restauranteId = restaurante?.id;

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

  // ═══════════════════════════════════════════
  // CREAR USUARIO (con Supabase Auth)
  // ═══════════════════════════════════════════
  const createErrors = useMemo(() => ({
    nombre: validate(newUser.nombre, "text", { required: true }),
    email: validate(newUser.email, "email", { required: true }),
    password: newUser.password.length === 0
      ? "La contraseña es obligatoria"
      : newUser.password.length < 6
        ? "Mínimo 6 caracteres"
        : null,
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
      toast.success({
        message: "Usuario creado",
        description: `${newUser.nombre} ya puede iniciar sesión.`,
      });
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
      toast.success({
        message: "Usuario actualizado",
        description: editData.nombre,
      });
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
      toast.success({
        message: "Contraseña actualizada",
        description: pwdUser.nombre,
      });
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
      toast.success({
        message: user.activo ? "Usuario desactivado" : "Usuario activado",
        description: user.nombre,
        duration: 2500,
      });
    } catch (err) {
      console.error("Error toggling user:", err);
      toast.error({ message: "No se pudo cambiar el estado" });
    }
  };

  const openDeleteModal = (user: any) => {
    setDeleteUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await eliminarUsuario(deleteUser.id);
      setShowDeleteModal(false);
      toast.success({
        message: "Usuario eliminado",
        description: deleteUser.nombre,
      });
      loadUsers();
    } catch (err: any) {
      toast.error({ message: "No se pudo eliminar", description: err.message });
    } finally {
      setDeleting(false);
    }
  };

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

      {/* Notifications are surfaced via the global Toaster. */}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-noto-serif), serif", fontSize: 24, fontWeight: 400, color: "var(--text)", margin: "0 0 4px" }}>
            Gestión de <em style={{ color: "var(--primary)" }}>Usuarios</em>
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>{usuarios.length} miembros registrados</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowCreateModal(true); setCreateError(""); setNewUser({ nombre: "", email: "", rol: "mesero", password: "" }); }} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> Nuevo usuario
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        {Object.entries(roleConfig).filter(([k]) => k !== "cliente").map(([key, cfg]) => {
          const Icon = cfg.Icon;
          return (
            <div key={key} className="card-flat" onClick={() => setFilterRol(filterRol === key ? "all" : key)} style={{ padding: "16px 20px", cursor: "pointer", borderLeft: filterRol === key ? `3px solid ${cfg.color}` : "3px solid transparent", transition: "all 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>{cfg.label}</p><p style={{ fontSize: 28, fontWeight: 700, color: cfg.color, margin: "4px 0 0" }}>{rolCounts[key] || 0}</p></div>
                <Icon size={24} color={cfg.color} style={{ opacity: 0.4 }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ position: "relative", maxWidth: 400 }}>
        <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input type="text" placeholder="Buscar usuarios..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input" style={{ paddingLeft: 36 }} />
      </div>

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
                  <td><span className="badge" style={{ background: `${cfg.color}15`, color: cfg.color }}><Shield size={10} /> {cfg.label}</span></td>
                  <td><span className={`badge ${user.activo ? "badge-ready" : "badge-cancelled"}`}>{user.activo ? "Activo" : "Inactivo"}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => openEditModal(user)} className="btn btn-ghost btn-sm" title="Editar" style={{ padding: "4px 8px" }}><Pencil size={14} color="var(--primary)" /></button>
                      {user.auth_id && <button onClick={() => openPwdModal(user)} className="btn btn-ghost btn-sm" title="Password" style={{ padding: "4px 8px" }}><Key size={14} color="var(--tertiary)" /></button>}
                      <button onClick={() => handleToggleActive(user)} className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}>{user.activo ? <ToggleRight size={16} color="var(--success)" /> : <ToggleLeft size={16} color="var(--text-muted)" />}</button>
                      <button onClick={() => openDeleteModal(user)} className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}><Trash2 size={14} color="var(--secondary)" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modals are unchanged in structure, just ensuring they use dynamic IDs */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nuevo usuario"
        description="Crea una cuenta con acceso al panel. Recibirá un email de confirmación."
        icon={<UserPlus size={18} />}
        accentColor="var(--primary)"
        size="md"
        footer={
          <ModalFooter>
            <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              className="btn btn-primary"
              disabled={saving || !isCreateFormValid}
              style={{ opacity: saving || !isCreateFormValid ? 0.5 : 1 }}
            >
              {saving ? "Creando..." : "Crear usuario"}
            </button>
          </ModalFooter>
        }
      >
        <div className="premium-field">
          <label className="premium-field-label">Nombre completo *</label>
          <input
            className={`input ${createErrors.nombre ? "input--invalid" : ""}`}
            placeholder="Nombre completo"
            value={newUser.nombre}
            onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
            autoFocus
          />
          {createErrors.nombre && (
            <span className="premium-field-error">
              <AlertCircle size={11} /> {createErrors.nombre}
            </span>
          )}
        </div>
        <div className="premium-field">
          <label className="premium-field-label">Correo electrónico *</label>
          <div style={{ position: "relative" }}>
            <Mail size={14} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              className={`input ${createErrors.email ? "input--invalid" : ""}`}
              placeholder="usuario@email.com"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: sanitize(e.target.value, "email") })}
              style={{ paddingLeft: 36 }}
            />
          </div>
          {createErrors.email && (
            <span className="premium-field-error">
              <AlertCircle size={11} /> {createErrors.email}
            </span>
          )}
        </div>
        <div className="premium-field">
          <label className="premium-field-label">Contraseña *</label>
          <div style={{ position: "relative" }}>
            <Lock size={14} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              className={`input ${createErrors.password ? "input--invalid" : ""}`}
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
          {createErrors.password ? (
            <span className="premium-field-error">
              <AlertCircle size={11} /> {createErrors.password}
            </span>
          ) : (
            <span className="premium-field-hint">Mínimo 6 caracteres.</span>
          )}
        </div>
        <div className="premium-field">
          <label className="premium-field-label">Seleccionar rol *</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
            {Object.entries(roleConfig).filter(([k]) => k !== "cliente").map(([key, cfg]) => {
              const RoleIcon = cfg.Icon;
              const active = newUser.rol === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNewUser({ ...newUser, rol: key })}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px",
                    background: active ? `${cfg.color}15` : "var(--surface)",
                    border: active ? `1px solid ${cfg.color}` : "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <RoleIcon size={16} color={active ? cfg.color : "var(--text-muted)"} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: active ? cfg.color : "var(--text-secondary)" }}>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        {createError && (
          <p style={{ fontSize: 12, color: "var(--secondary)", margin: 0, padding: "8px 12px", background: "rgba(226,114,91,0.08)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(226,114,91,0.2)" }}>
            {createError}
          </p>
        )}
      </Modal>

      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar usuario"
        description="Actualiza los datos del miembro del equipo."
        icon={<Pencil size={18} />}
        accentColor="var(--primary)"
        size="md"
        footer={
          <ModalFooter>
            <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleEdit}
              className="btn btn-primary"
              disabled={editSaving}
              style={{ opacity: editSaving ? 0.6 : 1 }}
            >
              {editSaving ? "Guardando..." : "Guardar cambios"}
            </button>
          </ModalFooter>
        }
      >
        <div className="premium-field">
          <label className="premium-field-label">Nombre</label>
          <input
            className="input"
            value={editData.nombre}
            onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
            autoFocus
          />
        </div>
        <div className="premium-field">
          <label className="premium-field-label">Correo electrónico</label>
          <input
            className="input"
            type="email"
            value={editData.email}
            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
          />
        </div>
        <div className="premium-field">
          <label className="premium-field-label">Rol</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
            {Object.entries(roleConfig).filter(([k]) => k !== "cliente").map(([key, cfg]) => {
              const RoleIcon = cfg.Icon;
              const active = editData.rol === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setEditData({ ...editData, rol: key })}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px",
                    background: active ? `${cfg.color}15` : "var(--surface)",
                    border: active ? `1px solid ${cfg.color}` : "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <RoleIcon size={16} color={active ? cfg.color : "var(--text-muted)"} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: active ? cfg.color : "var(--text-secondary)" }}>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        {editError && (
          <p style={{ fontSize: 12, color: "var(--secondary)", margin: 0, padding: "8px 12px", background: "rgba(226,114,91,0.08)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(226,114,91,0.2)" }}>
            {editError}
          </p>
        )}
      </Modal>

      <Modal
        open={showPwdModal}
        onClose={() => setShowPwdModal(false)}
        title="Nueva contraseña"
        description={pwdUser ? `Actualiza la contraseña de ${pwdUser.nombre}.` : undefined}
        icon={<ShieldCheck size={18} />}
        accentColor="var(--tertiary)"
        size="sm"
        footer={
          <ModalFooter>
            <button onClick={() => setShowPwdModal(false)} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleChangePassword}
              className="btn btn-primary"
              disabled={pwdSaving}
              style={{ opacity: pwdSaving ? 0.6 : 1, background: "var(--tertiary)", borderColor: "var(--tertiary)" }}
            >
              {pwdSaving ? "Actualizando..." : "Actualizar"}
            </button>
          </ModalFooter>
        }
      >
        <div className="premium-field">
          <label className="premium-field-label">Nueva contraseña</label>
          <div style={{ position: "relative" }}>
            <Lock size={14} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              className="input"
              placeholder="Nueva contraseña"
              type={showPwd ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ paddingLeft: 36, paddingRight: 40 }}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
            >
              {showPwd ? <EyeOff size={14} color="var(--text-muted)" /> : <Eye size={14} color="var(--text-muted)" />}
            </button>
          </div>
          <span className="premium-field-hint">Mínimo 8 caracteres. Comparte la nueva contraseña por un canal seguro.</span>
        </div>
        {pwdError && (
          <p style={{ fontSize: 12, color: "var(--secondary)", margin: 0, padding: "8px 12px", background: "rgba(226,114,91,0.08)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(226,114,91,0.2)" }}>
            {pwdError}
          </p>
        )}
      </Modal>

      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="¿Eliminar usuario?"
        description={deleteUser ? `Esta acción es permanente y no se puede deshacer.` : undefined}
        icon={<AlertTriangle size={18} />}
        accentColor="var(--secondary)"
        size="sm"
        footer={
          <ModalFooter>
            <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="btn btn-primary"
              disabled={deleting}
              style={{ opacity: deleting ? 0.6 : 1, background: "var(--secondary)", borderColor: "var(--secondary)" }}
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          </ModalFooter>
        }
      >
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          textAlign: "center", padding: "8px 0 4px", gap: 12,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: "rgba(226,114,91,0.12)",
            border: "1px solid rgba(226,114,91,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AlertTriangle size={32} color="var(--secondary)" />
          </div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
            Vas a eliminar permanentemente a <strong style={{ color: "var(--text)" }}>{deleteUser?.nombre}</strong>.
            <br />No podrá acceder al panel ni a sus pedidos asignados.
          </p>
        </div>
      </Modal>
    </div>
  );
}
