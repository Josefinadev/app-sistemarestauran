"use client";

import { useState, useEffect, useCallback } from "react";
import { getUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } from "@/lib/api";
import {
  Users, Plus, X, Crown, Flame, UtensilsCrossed, Wallet, UserCircle,
  Search, Shield, Trash2, ToggleLeft, ToggleRight, Mail,
} from "lucide-react";

const ID_RESTAURANTE = "a0000000-0000-0000-0000-000000000001";

const roleConfig: Record<string, { label: string; Icon: any; color: string }> = {
  admin: { label: "Admin", Icon: Crown, color: "var(--primary)" },
  cocina: { label: "Cocina", Icon: Flame, color: "var(--secondary)" },
  mesero: { label: "Mesero", Icon: UtensilsCrossed, color: "var(--tertiary)" },
  caja: { label: "Cajero", Icon: Wallet, color: "var(--success)" },
  cliente: { label: "Cliente", Icon: UserCircle, color: "var(--text-muted)" },
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRol, setFilterRol] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newUser, setNewUser] = useState({ nombre: "", email: "", rol: "mesero" });

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

  const handleCreate = async () => {
    if (!newUser.nombre || !newUser.rol) return;
    setSaving(true);
    try {
      await crearUsuario({ id_restaurante: ID_RESTAURANTE, ...newUser });
      setShowModal(false);
      setNewUser({ nombre: "", email: "", rol: "mesero" });
      loadUsers();
    } catch (err) {
      console.error("Error creating user:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user: any) => {
    try {
      await actualizarUsuario(user.id, { activo: !user.activo });
      setUsuarios((prev) => prev.map((u) => u.id === user.id ? { ...u, activo: !u.activo } : u));
    } catch (err) {
      console.error("Error toggling user:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await eliminarUsuario(id);
      loadUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
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
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-noto-serif), serif", fontSize: 24, fontWeight: 400, color: "var(--text)", margin: "0 0 4px" }}>
            Gestión de <em style={{ color: "var(--primary)" }}>Usuarios</em>
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>{usuarios.length} usuarios registrados</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> Nuevo usuario
        </button>
      </div>

      {/* Role Cards */}
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

      {/* Search */}
      <div style={{ position: "relative", maxWidth: 400 }}>
        <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input type="text" placeholder="Buscar usuarios..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input" style={{ paddingLeft: 36 }} />
      </div>

      {/* Users Table */}
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
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => handleToggleActive(user)} className="btn btn-ghost btn-sm" style={{ padding: "4px 10px" }}>
                        {user.activo ? <ToggleRight size={16} color="var(--success)" /> : <ToggleLeft size={16} color="var(--text-muted)" />}
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="btn btn-ghost btn-sm" style={{ padding: "4px 10px" }}>
                        <Trash2 size={14} color="var(--text-muted)" />
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

      {/* Create Modal */}
      {showModal && (
        <>
          <div className="overlay" onClick={() => setShowModal(false)} />
          <div className="modal" style={{ background: "var(--bg-elevated)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 420, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", margin: 0 }}>Nuevo Usuario</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color="var(--text-muted)" /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input className="input" placeholder="Nombre completo" value={newUser.nombre} onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })} />
              <div style={{ position: "relative" }}>
                <Mail size={14} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input className="input" placeholder="Email (opcional)" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} style={{ paddingLeft: 36 }} />
              </div>
              <div>
                <p className="label" style={{ marginBottom: 8 }}>Seleccionar rol</p>
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
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={handleCreate} className="btn btn-primary" disabled={saving} style={{ flex: 1, opacity: saving ? 0.6 : 1 }}>{saving ? "Guardando..." : "Crear"}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
