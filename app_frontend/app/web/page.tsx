"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrecio } from "@/lib/utils";
import { getRestaurante, getWebConfig, getWebCombos, getWebOfertas } from "@/lib/api";
import {
  Wine, Phone, Clock, Star,
  MessageCircle, CheckCircle2,
  X, Loader2, Zap,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   PÁGINA WEB PÚBLICA — El Mijano (CONEXIÓN REAL VIVA)
   Auto-refresca cada 30s para reflejar cambios del admin
   ═══════════════════════════════════════════════════════════ */

export default function WebPublica() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [combos, setCombos] = useState<any[]>([]);
  const [ofertas, setOfertas] = useState<any[]>([]);

  // Modal Reserva
  const [showReserva, setShowReserva] = useState(false);
  const [reservaData, setReservaData] = useState({ nombre: "", telefono: "", fecha: "", hora: "", personas: "2", notas: "" });
  const [reservaEnviada, setReservaEnviada] = useState(false);

  const loadPublicData = useCallback(async () => {
    try {
      const restauranteData = await getRestaurante("el-mijano");
      const restaurantId = restauranteData?.id;

      if (restaurantId) {
        const [configRes, combosRes, ofertasRes] = await Promise.allSettled([
          getWebConfig(restaurantId),
          getWebCombos(restaurantId),
          getWebOfertas(restaurantId),
        ]);
        if (configRes.status === "fulfilled" && configRes.value) setConfig(configRes.value);
        if (combosRes.status === "fulfilled") setCombos(combosRes.value || []);
        if (ofertasRes.status === "fulfilled") setOfertas(ofertasRes.value || []);
      }
    } catch (err) {
      console.error("Error cargando web pública:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPublicData();
    const interval = setInterval(loadPublicData, 30000);
    return () => clearInterval(interval);
  }, [loadPublicData]);

  const enviarReserva = () => {
    if (!reservaData.nombre || !reservaData.telefono || !reservaData.fecha || !config?.whatsapp) return;
    const msg = `🍷 *Reserva El Mijano*\n\n👤 ${reservaData.nombre}\n📞 ${reservaData.telefono}\n📅 ${reservaData.fecha} a las ${reservaData.hora}\n👥 ${reservaData.personas} personas\n📝 ${reservaData.notas || "Sin notas"}\n\n¡Gracias por reservar!`;
    window.open(`https://wa.me/${config.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
    setReservaEnviada(true);
    setTimeout(() => { setShowReserva(false); setReservaEnviada(false); }, 3000);
  };

  const enviarComboWhatsapp = (combo: any) => {
    if (!config?.whatsapp) return;
    const msg = `🍷 Hola, me interesa el combo *${combo.nombre}* (${formatPrecio(combo.precio)}).\n\n¿Podrían darme más información?`;
    window.open(`https://wa.me/${config.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading) return (
    <div style={{ background: "var(--bg)", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 className="spin-icon" color="var(--primary)" size={48} />
    </div>
  );

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(12,11,14,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)", padding: "0 24px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wine size={14} color="var(--text-inverse)" />
          </div>
          <span style={{ fontFamily: "var(--font-noto-serif), serif", fontStyle: "italic", fontSize: 18, color: "var(--primary)", letterSpacing: "0.04em" }}>El Mijano</span>
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {ofertas.length > 0 && <a href="#ofertas" style={{ fontSize: 12, color: "var(--text-secondary)", textDecoration: "none" }}>Ofertas</a>}
          {combos.length > 0 && <a href="#combos" style={{ fontSize: 12, color: "var(--text-secondary)", textDecoration: "none" }}>Combos</a>}
          <button onClick={() => setShowReserva(true)} className="btn btn-primary btn-sm">Reservar</button>
        </div>
      </nav>

      {/* ═══ HERO con imagen de fondo ═══ */}
      <section style={{
        minHeight: "92vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "120px 24px", position: "relative",
        backgroundImage: "url('/assets/placeholder-dish.png')",
        backgroundSize: "cover", backgroundPosition: "center",
      }}>
        {/* Dark gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(12,11,14,0.82) 0%, rgba(12,11,14,0.55) 45%, rgba(12,11,14,0.85) 100%)",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 20, opacity: 0.9 }}>
            Restaurante Premium — Trujillo
          </p>
          <h1 style={{ fontFamily: "var(--font-noto-serif), serif", fontSize: "clamp(40px, 8vw, 72px)", fontWeight: 400, margin: "0 0 20px", textShadow: "0 2px 40px rgba(0,0,0,0.5)" }}>
            Sabor que inspira,<br /><em style={{ color: "var(--primary)" }}>momentos que perduran</em>
          </h1>
          <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 600, margin: "0 auto 40px", textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
            Descubre una experiencia culinaria única. Lo más premium de Trujillo ahora a tu alcance.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => setShowReserva(true)} className="btn btn-primary btn-lg">Reservar Mesa</button>
            <a href="#combos" className="btn btn-secondary btn-lg" style={{ textDecoration: "none" }}>Ver Ofertas</a>
          </div>
        </div>
      </section>

      {/* ═══ OFERTAS DINÁMICAS CON IMÁGENES ═══ */}
      {ofertas.length > 0 && (
        <section id="ofertas" style={{ padding: "80px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--secondary)", marginBottom: 12 }}>Promociones</p>
              <h2 style={{ fontFamily: "var(--font-noto-serif), serif", fontSize: "clamp(28px, 5vw, 40px)", margin: 0 }}>
                Ofertas <em style={{ color: "var(--secondary)" }}>Especiales</em>
              </h2>
              <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: 15 }}>Promociones exclusivas que no te puedes perder</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
              {ofertas.map((oferta) => (
                <div key={oferta.id} style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 20,
                  overflow: "hidden",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}>
                  {/* Oferta image */}
                  {oferta.imagen_url ? (
                    <div style={{ height: 180, overflow: "hidden", position: "relative" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={oferta.imagen_url} alt={oferta.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.5) 100%)" }} />
                      {oferta.descuento && (
                        <span style={{
                          position: "absolute", top: 12, right: 12,
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "5px 14px", background: "rgba(226,114,91,0.9)",
                          borderRadius: 20, fontSize: 13, fontWeight: 700, color: "#fff",
                        }}>
                          <Zap size={12} /> {oferta.descuento}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: "20px 24px 0 24px" }}>
                      {oferta.descuento && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "5px 14px", background: "rgba(226,114,91,0.15)",
                          borderRadius: 20, fontSize: 13, fontWeight: 700, color: "var(--secondary)",
                        }}>
                          <Zap size={12} /> {oferta.descuento}
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px", color: "var(--text)" }}>{oferta.titulo}</h3>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{oferta.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ COMBOS DINÁMICOS CON IMÁGENES ═══ */}
      <section id="combos" style={{ padding: "80px 24px", background: "var(--bg-elevated)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 12 }}>Lo mejor para ti</p>
            <h2 style={{ fontFamily: "var(--font-noto-serif), serif", fontSize: "clamp(28px, 5vw, 40px)", margin: 0 }}>
              Combos y <em style={{ color: "var(--primary)" }}>Paquetes</em>
            </h2>
            <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: 15 }}>Las mejores ofertas para compartir</p>
          </div>

          {combos.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)" }}>Pronto tendremos nuevos combos disponibles.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
              {combos.map((combo) => (
                <div key={combo.id} style={{
                  border: "1px solid var(--border)", background: "var(--surface)",
                  overflow: "hidden", borderRadius: 20,
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}>
                  {/* Combo image */}
                  <div style={{ height: 200, overflow: "hidden", position: "relative" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={combo.imagen_url || "/assets/placeholder-dish.png"} alt={combo.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.4) 100%)" }} />
                    {combo.popular && (
                      <span style={{ position: "absolute", top: 12, left: 12, padding: "4px 12px", background: "rgba(197,160,89,0.9)", borderRadius: 12, fontSize: 10, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        <Star size={10} /> Popular
                      </span>
                    )}
                    {combo.precio_original && (
                      <span style={{ position: "absolute", top: 12, right: 12, padding: "4px 10px", background: "rgba(226,114,91,0.9)", borderRadius: 12, fontSize: 11, fontWeight: 700, color: "#fff" }}>
                        -{Math.round((1 - combo.precio / combo.precio_original) * 100)}%
                      </span>
                    )}
                  </div>
                  <div style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 6px" }}>{combo.nombre}</h3>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.5 }}>{combo.descripcion}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
                      {(combo.incluye || []).map((i: string, index: number) => (
                        <div key={index} style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)" }}>
                          <CheckCircle2 size={14} color="var(--success)" /> {i}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                      <div>
                        {combo.precio_original && (
                          <span style={{ fontSize: 14, color: "var(--text-muted)", textDecoration: "line-through", marginRight: 8 }}>{formatPrecio(combo.precio_original)}</span>
                        )}
                        <span style={{ fontSize: 26, fontWeight: 700, color: "var(--primary)" }}>{formatPrecio(combo.precio)}</span>
                      </div>
                      <button onClick={() => enviarComboWhatsapp(combo)} className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <MessageCircle size={14} /> Consultar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding: "60px 24px", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 40 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Wine size={12} color="var(--text-inverse)" />
              </div>
              <span style={{ fontFamily: "var(--font-noto-serif), serif", fontStyle: "italic", fontSize: 16, color: "var(--primary)" }}>El Mijano</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{config?.direccion || "Trujillo, Perú"}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", marginBottom: 16 }}>Contacto</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
              {config?.telefono && <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)" }}><Phone size={14} color="var(--primary)" /> {config.telefono}</span>}
              {config?.whatsapp && <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)" }}><MessageCircle size={14} color="var(--success)" /> WhatsApp: {config.whatsapp}</span>}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", marginBottom: 16 }}>Horarios</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
              {config?.horario_semana && <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)" }}><Clock size={14} color="var(--primary)" /> Lun - Vie: {config.horario_semana}</span>}
              {config?.horario_finde && <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)" }}><Clock size={14} color="var(--tertiary)" /> Sab - Dom: {config.horario_finde}</span>}
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1100, margin: "40px auto 0", paddingTop: 24, borderTop: "1px solid var(--border)", textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em" }}>© 2026 Restaurante — Trujillo, Perú. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* ═══ MODAL RESERVA ═══ */}
      {showReserva && (
        <>
          <div className="overlay" onClick={() => setShowReserva(false)} />
          <div className="modal" style={{ background: "var(--bg-elevated)", borderRadius: 24, padding: 32, width: "90%", maxWidth: 440, border: "1px solid var(--border)" }}>
            {reservaEnviada ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <CheckCircle2 color="var(--success)" size={48} style={{ margin: "0 auto 16px" }} />
                <h3 style={{ fontSize: 20, margin: "0 0 8px" }}>¡Solicitud enviada!</h3>
                <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>Te redirigiremos a WhatsApp.</p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <h3 style={{ fontSize: 22, fontFamily: "var(--font-noto-serif), serif", margin: 0 }}>
                    Haz tu <em style={{ color: "var(--primary)" }}>reserva</em>
                  </h3>
                  <button onClick={() => setShowReserva(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    <X size={18} color="var(--text-muted)" />
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <input className="input" placeholder="Nombre completo" value={reservaData.nombre} onChange={(e) => setReservaData({...reservaData, nombre: e.target.value})} />
                  <input className="input" placeholder="Teléfono" value={reservaData.telefono} onChange={(e) => setReservaData({...reservaData, telefono: e.target.value})} />
                  <input className="input" placeholder="Fecha" type="date" value={reservaData.fecha} onChange={(e) => setReservaData({...reservaData, fecha: e.target.value})} />
                  <select className="input" value={reservaData.personas} onChange={(e) => setReservaData({...reservaData, personas: e.target.value})}>
                    <option value="2">2 Personas</option>
                    <option value="4">4 Personas</option>
                    <option value="6">6 Personas</option>
                    <option value="8">8+ Personas</option>
                  </select>
                </div>
                <button onClick={enviarReserva} className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <MessageCircle size={16} /> Enviar vía WhatsApp
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
