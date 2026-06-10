import { useRouter } from "next/navigation";
import { AlertCircle, Users } from "lucide-react";

interface NoUsuariosAsignadosProps {
  rolLabel: string;
  rol: "cocina" | "mesero" | "caja";
}

export function NoUsuariosAsignados({ rolLabel, rol }: NoUsuariosAsignadosProps) {
  const router = useRouter();

  const handleAsignar = () => {
    router.push("/dashboard/admin/usuarios");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "40px 20px",
        gap: 24,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            background: "rgba(251,191,36,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AlertCircle size={40} color="var(--warning)" />
        </div>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: 0, marginBottom: 8 }}>
            No hay personas asignadas
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0, maxWidth: 400 }}>
            Actualmente no tienes designado a nadie para el rol <strong>{rolLabel}</strong>. Asigna personal para continuar.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={handleAsignar}
          className="btn btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <Users size={16} />
          Ir al módulo de usuarios
        </button>
      </div>
    </div>
  );
}
