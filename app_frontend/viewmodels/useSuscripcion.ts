import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/store";
import type { SuscripcionPlan, Restaurante } from "@/lib/database.types";

export function useSuscripcion() {
  const { restaurante, setRestaurante } = useAuth();
  
  const [planes, setPlanes] = useState<SuscripcionPlan[]>([]);
  const [suscripcionActual, setSuscripcionActual] = useState<any>(null);
  
  const [colorPrimario, setColorPrimario] = useState(restaurante?.color_primario || "#C5A059");
  const [colorSecundario, setColorSecundario] = useState(restaurante?.color_secundario || "#E2725B");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!restaurante?.id) return;
      setLoading(true);

      // Cargar planes
      const { data: planesData } = await supabase
        .from("suscripcion_plan")
        .select("*")
        .eq("activo", true)
        .order("precio_mensual", { ascending: true });

      if (planesData) setPlanes(planesData as SuscripcionPlan[]);

      // Cargar suscripcion actual
      const { data: subData } = await supabase
        .from("restaurante_suscripcion")
        .select("*, plan:suscripcion_plan(*)")
        .eq("id_restaurante", restaurante.id)
        .maybeSingle();
        
      if (subData) {
        setSuscripcionActual(subData);
      }
      
      setLoading(false);
    }
    loadData();
  }, [restaurante?.id]);

  const handleUpdateColors = async () => {
    if (!restaurante?.id) return;
    setSaving(true);
    
    const { error } = await (supabase
      .from("restaurante") as any)
      .update({ color_primario: colorPrimario, color_secundario: colorSecundario })
      .eq("id", restaurante.id);
      
    if (!error) {
      setRestaurante({ ...restaurante, color_primario: colorPrimario, color_secundario: colorSecundario });
      alert("Colores actualizados correctamente.");
    } else {
      alert("Error al actualizar colores.");
    }
    setSaving(false);
  };

  const handleCambiarPlan = async (planId: string) => {
    if (!restaurante?.id) return;
    
    // Aquí implementamos la lógica temporal para "solicitar" o "cambiar" plan localmente.
    // En el futuro, esto despachará un checkout de Stripe.
    setSaving(true);
    
    const { error } = await (supabase
      .from("restaurante_suscripcion") as any)
      .upsert({
        id_restaurante: restaurante.id,
        id_plan: planId,
        estado: 'activa',
      }, { onConflict: "id_restaurante" });

    if (!error) {
      alert("Suscripción actualizada.");
      // Recargar suscripcion
      const { data: subData } = await (supabase
        .from("restaurante_suscripcion") as any)
        .select("*, plan:suscripcion_plan(*)")
        .eq("id_restaurante", restaurante.id)
        .maybeSingle();
      if (subData) setSuscripcionActual(subData);
    } else {
      alert("Error al cambiar plan.");
    }
    setSaving(false);
  };

  return {
    planes,
    suscripcionActual,
    colorPrimario,
    setColorPrimario,
    colorSecundario,
    setColorSecundario,
    loading,
    saving,
    handleUpdateColors,
    handleCambiarPlan,
  };
}
