"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, Check, Loader2, Star, Eye, EyeOff, CreditCard, AlertCircle, CheckCircle, Calendar, QrCode, Users, Zap, ShieldCheck, Moon, Sun } from "lucide-react";
import { crearPreferenciaPagoRegistro } from "@/lib/api";
import { ImageUploadInput } from "@/components/ImageUploadInput";
import { resetRestauranteBranding } from "@/lib/branding";

const P = "#C5A059";
const PD = "#A8863D";
const BGL = "#FFFDF7";
const BGC = "#F9F5EC";
const TD = "#1A1410";
const TG = "#6B6257";
const BD = "#E8DFD0";
const PRECIO = 60;

function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let t0: number | null = null;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setValue(Math.floor(e * target));
      if (p < 1) requestAnimationFrame(step); else setValue(target);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return value;
}

function StatCard({ icon, label, target, suffix = "", desc, dark }: any) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const count = useCountUp(target, 1800, inView);
  const bg = dark ? "#1A1A1C" : "#FFFFFF";
  const br = dark ? "#2A2118" : BD;
  const tm = dark ? "#F0E6D0" : TD;
  const tg = dark ? "#9B9386" : TG;
  return (
    <motion.div ref={ref} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }}
      style={{ flex:1, display:"flex", alignItems:"center", gap:16, padding:"24px 28px", background:bg, borderRadius:16, border:`1px solid ${br}` }}>
      <div style={{ width:52, height:52, borderRadius:"50%", border:`2px solid ${P}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, background: dark ? "rgba(197,160,89,0.08)" : "#FFF5E0" }}>{icon}</div>
      <div>
        <p style={{ fontSize:11, color:tg, margin:"0 0 2px", fontWeight:500 }}>{label}</p>
        <p style={{ fontSize:30, fontWeight:900, color:tm, margin:"0 0 2px", lineHeight:1, letterSpacing:"-0.02em" }}>{suffix}{count.toLocaleString()}</p>
        <p style={{ fontSize:11, color: desc.includes("+") || desc.includes("↑") ? "#16a34a" : tg, margin:0, fontWeight: desc.includes("+") || desc.includes("↑") ? 700 : 400 }}>{desc}</p>
      </div>
    </motion.div>
  );
}

function NavLink({ href, label, dark }: { href: string; label: string; dark: boolean }) {
  const [hov, setHov] = useState(false);
  const tg = dark ? "#9B9386" : TG;
  return (
    <a href={href} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ color: hov ? P : tg, textDecoration: "none", fontSize: 15, fontWeight: 500, position: "relative", padding: "4px 0", transition: "color 200ms ease", display: "inline-block" }}>
      {label}
      <motion.span
        animate={{ scaleX: hov ? 1 : 0, opacity: hov ? 1 : 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        style={{ position: "absolute", bottom: -2, left: 0, right: 0, height: 2, background: P, borderRadius: 1, transformOrigin: "left", display: "block" }}
      />
    </a>
  );
}

function FeatureCard({ icon, title, desc, delay, dark }: any) {
  const bg = dark ? "#1A1A1C" : "#FFFFFF";
  const br = dark ? "#2A2118" : BD;
  const tm = dark ? "#F0E6D0" : TD;
  const tg = dark ? "#9B9386" : TG;
  return (
    <motion.div initial={{ opacity:0, y:28 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5, delay }}
      whileHover={{ y:-8, boxShadow:`0 20px 48px rgba(197,160,89,0.18)`, borderColor:`rgba(197,160,89,0.5)` }}
      style={{ display:"flex", alignItems:"flex-start", gap:20, padding:"28px", background:bg, border:`1px solid ${br}`, borderRadius:20, cursor:"default" }}>
      <motion.div whileHover={{ scale:1.12 }} transition={{ type:"spring", stiffness:400 }}
        style={{ width:72, height:72, borderRadius:"50%", background: dark ? "rgba(197,160,89,0.1)" : "#FFF5E0", border:`2px solid ${dark ? "rgba(197,160,89,0.25)" : "#F0DEB0"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        {icon}
      </motion.div>
      <div style={{ flex:1 }}>
        <h3 style={{ fontSize:18, fontWeight:800, color:tm, margin:"0 0 10px", letterSpacing:"-0.01em" }}>{title}</h3>
        <p style={{ fontSize:14, color:tg, lineHeight:1.7, margin:"0 0 14px" }}>{desc}</p>
        <motion.span whileHover={{ x:4 }} style={{ color:P, fontSize:18, fontWeight:700, display:"inline-block" }}>→</motion.span>
      </div>
    </motion.div>
  );
}

export default function SaaSLandingPage() {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [pagoMsg, setPagoMsg] = useState<{ type: "success"|"error"|"pending"; text: string }|null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [form, setForm] = useState({ nombre:"", slug:"", propietario_nombre:"", propietario_email:"", propietario_password:"", color_primario:"#C5A059", color_secundario:"#E2725B", logo_url:"", hero_banner_url:"", latitud:-12.046374, longitud:-77.042793, radio_permitido_metros:100 });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const imgX = useSpring(useTransform(mouseX, [-500,500], [-10,10]), { stiffness:60, damping:20 });
  const imgY = useSpring(useTransform(mouseY, [-400,400], [-6,6]), { stiffness:60, damping:20 });

  useEffect(() => { resetRestauranteBranding(); }, []);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const s = new URLSearchParams(window.location.search).get("pago");
    if (s === "fallido") setPagoMsg({ type:"error", text:"El pago no se pudo completar." });
    else if (s === "pendiente") setPagoMsg({ type:"pending", text:"Tu pago esta pendiente." });
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - r.left - r.width/2);
    mouseY.set(e.clientY - r.top - r.height/2);
  }, [mouseX, mouseY]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { const pref = await crearPreferenciaPagoRegistro(form); window.location.href = pref.sandbox_init_point; }
    catch (err: any) { alert(err.message || "Error."); setLoading(false); }
  };

  const bg = dark ? "#0C0B0E" : BGL;
  const bgCream = dark ? "#111014" : BGC;
  const bgCard = dark ? "#1A1A1C" : "#FFFFFF";
  const tm = dark ? "#F0E6D0" : TD;
  const tg = dark ? "#9B9386" : TG;
  const br = dark ? "#2A2118" : BD;

  const hi = { hidden:{ opacity:0, y:30 }, show:{ opacity:1, y:0, transition:{ duration:0.65, ease:[0.22,1,0.36,1] as any } } };

  return (
    <div style={{ background:bg, color:tm, minHeight:"100vh", fontFamily:"var(--font-manrope), system-ui, sans-serif" }}>
      {pagoMsg && (
        <div style={{ position:"fixed", top:90, left:"50%", transform:"translateX(-50%)", zIndex:1001, padding:"14px 20px", borderRadius:14, display:"flex", alignItems:"center", gap:10, background: pagoMsg.type==="error" ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)", border:`1px solid ${pagoMsg.type==="error" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`, color: pagoMsg.type==="error" ? "#dc2626" : "#16a34a", fontSize:14 }}>
          {pagoMsg.type==="error" ? <AlertCircle size={18}/> : <CheckCircle size={18}/>}
          <span>{pagoMsg.text}</span>
          <button onClick={() => setPagoMsg(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"inherit", marginLeft:6, fontSize:18 }}>x</button>
        </div>
      )}

      {/* ════ FLOATING GLASSMORPHISM NAVBAR ════ */}
      <div style={{
        position: "fixed",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 40px)",
        maxWidth: 1240,
        zIndex: 200,
        pointerEvents: "none",
      }}>
        <motion.nav
          initial={{ y: -110, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{
            pointerEvents: "all",
            height: scrolled ? 72 : 88,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            background: scrolled
              ? (dark ? "rgba(15,14,18,0.84)" : "rgba(255,253,247,0.82)")
              : "transparent",
            backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
            WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
            borderRadius: scrolled ? 18 : 20,
            border: scrolled
              ? `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(197,160,89,0.18)"}`
              : "1px solid transparent",
            boxShadow: scrolled
              ? (dark
                ? "0 8px 40px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.04) inset"
                : "0 8px 40px rgba(197,160,89,0.13), 0 2px 0 rgba(255,255,255,0.9) inset")
              : "none",
            transition: "height 300ms cubic-bezier(0.4,0,0.2,1), background 300ms ease, backdrop-filter 300ms ease, border 300ms ease, box-shadow 300ms ease, border-radius 300ms ease",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <motion.img src="/assets/Ordely.png" alt="Ordely"
              style={{ height: scrolled ? 56 : 68, width: "auto", objectFit: "contain", transition: "height 300ms ease" }}
              whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400 }} />
            <motion.span
              style={{ fontSize: 22, fontWeight: 800, color: scrolled ? tm : tm, letterSpacing: "-0.02em", transition: "color 300ms ease" }}>
              Ordely
            </motion.span>
          </div>

          {/* Links + actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <NavLink href="#features" label="Caracteristicas" dark={dark} />
            <NavLink href="#pricing" label="Precios" dark={dark} />

            <motion.button onClick={() => router.push("/login")}
              style={{ background: "none", border: "none", cursor: "pointer", color: tg, fontSize: 15, fontWeight: 600, padding: "8px 14px", letterSpacing: "0.02em", transition: "color 200ms ease" }}
              whileHover={{ color: P }} transition={{ duration: 0.2 }}>
              INGRESAR
            </motion.button>

            <motion.button onClick={() => setDark(!dark)}
              style={{
                width: 36, height: 36, borderRadius: 9,
                background: scrolled ? (dark ? "rgba(255,255,255,0.06)" : "rgba(197,160,89,0.08)") : "rgba(255,255,255,0.15)",
                border: `1px solid ${scrolled ? br : "rgba(197,160,89,0.25)"}`,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: tg,
                transition: "all 300ms ease",
              }}
              whileHover={{ borderColor: P, color: P, scale: 1.05 }}
              transition={{ duration: 0.2 }}>
              {dark ? <Sun size={15} color={P} /> : <Moon size={15} />}
            </motion.button>
          </div>
        </motion.nav>
      </div>

      {/* HERO */}
      <section style={{ padding:"116px 6% 60px", position:"relative", overflow:"hidden", background:bg }} onMouseMove={onMouseMove}>
        <div style={{ position:"absolute", bottom:-40, left:-40, width:320, height:320, pointerEvents:"none", opacity: dark ? 0.1 : 0.32 }}>
          <svg viewBox="0 0 320 320" fill="none">{[60,100,140,180,220,260,300].map((r,i)=>(<circle key={i} cx="0" cy="320" r={r} stroke={P} strokeWidth="0.8" fill="none" opacity={0.7-i*0.08}/>))}</svg>
        </div>
        <motion.div style={{ display:"grid", gridTemplateColumns:"1fr 1.25fr", gap:24, alignItems:"center", maxWidth:1240, margin:"0 auto", position:"relative", zIndex:1 }}
          variants={{ hidden:{}, show:{ transition:{ staggerChildren:0.11 } } }} initial="hidden" animate="show">
          <div>
            <motion.div variants={hi} style={{ display:"inline-block", marginBottom:16, fontSize:11, fontWeight:700, letterSpacing:"0.12em", color:P, textTransform:"uppercase" as const }}>
              Arquitectura Multi-Tenant de Nueva Generacion
            </motion.div>
            <motion.h1 variants={hi} style={{ fontSize:"clamp(38px,5vw,64px)", fontWeight:900, lineHeight:1.03, letterSpacing:"-0.03em", color:tm, margin:"0 0 20px" }}>
              El sistema operativo<br/>para tu Imperio<br/>Gastronomico.
            </motion.h1>
            <motion.p variants={hi} style={{ fontSize:16, color:tg, lineHeight:1.75, margin:"0 0 36px", maxWidth:420 }}>
              Desde menus digitales inteligentes hasta gestion operativa en tiempo real. Todo lo que necesitas para escalar tu restaurante en una sola plataforma.
            </motion.p>
            <motion.div variants={hi} style={{ display:"flex", gap:14, flexWrap:"wrap" as const }}>
              <motion.button onClick={() => setShowModal(true)} style={{ background:P, color:"#fff", border:"none", borderRadius:10, padding:"14px 28px", fontSize:14, fontWeight:700, cursor:"pointer", letterSpacing:"0.04em", display:"flex", alignItems:"center", gap:8 }} whileHover={{ background:PD, scale:1.03 }} whileTap={{ scale:0.97 }} transition={{ type:"spring", stiffness:400, damping:20 }}>
                REGISTRA TU RESTAURANTE <ArrowRight size={16}/>
              </motion.button>
              <motion.button style={{ background:"transparent", color:tm, border:`1.5px solid ${br}`, borderRadius:10, padding:"14px 24px", fontSize:14, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }} whileHover={{ borderColor:P, scale:1.03 }} whileTap={{ scale:0.97 }} transition={{ type:"spring", stiffness:400, damping:20 }}>
                <Calendar size={16} color={P}/> AGENDAR DEMO
              </motion.button>
            </motion.div>
          </div>
          <motion.div initial={{ opacity:0, x:60 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.9, delay:0.2, ease:[0.22,1,0.36,1] as any }} style={{ x:imgX, y:imgY, display:"flex", justifyContent:"center" }}>
            <motion.img src="/assets/img_web.png" alt="Ordely Dashboard"
              animate={{ y:[0,-10,0] }} transition={{ duration:4.5, repeat:Infinity, ease:"easeInOut" }}
              style={{ width:"130%", maxWidth:780, height:"auto", display:"block", filter:"drop-shadow(0 28px 60px rgba(197,160,89,0.22)) drop-shadow(0 8px 20px rgba(0,0,0,0.07))", marginLeft:"-18%" }}/>
          </motion.div>
        </motion.div>
      </section>

      {/* STATS */}
      <section style={{ padding:"0 6% 64px", background:bg }}>
        <div style={{ display:"flex", gap:14, maxWidth:1240, margin:"0 auto", flexWrap:"wrap" }}>
          <StatCard dark={dark} label="Pedidos en Vivo" target={128} desc="● ahora mismo"
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="12" y2="15"/></svg>}/>
          <StatCard dark={dark} label="Mesas Activas" target={24} desc="● de 36"
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2"><line x1="2" y1="6" x2="22" y2="6"/><line x1="12" y1="6" x2="12" y2="20"/><line x1="4" y1="20" x2="20" y2="20"/></svg>}/>
          <StatCard dark={dark} label="Locales Conectados" target={12} desc="● activos"
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}/>
          <StatCard dark={dark} label="Ventas de Hoy" target={2450} suffix="S/" desc="↑ 18% vs ayer"
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>}/>
        </div>
      </section>

      {/* FEATURES 2x2 */}
      <section id="features" style={{ padding:"20px 6% 80px", background:bgCard, borderTop:`1px solid ${br}`, borderBottom:`1px solid ${br}` }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, maxWidth:1240, margin:"0 auto" }}>
          <FeatureCard dark={dark} delay={0} icon={<QrCode size={34} color={P}/>} title="Menu Digital Inteligente" desc="Pedidos desde la mesa con validacion de geolocalizacion. Reduce tiempos y mejora la experiencia del cliente."/>
          <FeatureCard dark={dark} delay={0.1} icon={<Users size={34} color={P}/>} title="Control Total Multi-Tenant" desc="Gestiona multiples locales, roles (Cocinero, Mesero, Cajero) y analiticas avanzadas en un panel unificado."/>
          <FeatureCard dark={dark} delay={0.2} icon={<Zap size={34} color={P}/>} title="Real-Time de Verdad" desc="La cocina recibe pedidos al instante. Sincronizacion perfecta entre todos los dispositivos del staff."/>
          <FeatureCard dark={dark} delay={0.3} icon={<ShieldCheck size={34} color={P}/>} title="Precio Simple y Transparente" desc="Sin planes complicados. Paga mensualmente y ten acceso completo."/>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding:"100px 6%", background:bgCream, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:-80, top:"50%", transform:"translateY(-50%)", opacity: dark ? 0.08 : 0.28, pointerEvents:"none" }}>
          <svg width="420" height="420" viewBox="0 0 420 420">{[60,100,140,180,220,260,300,340,380].map((r,i)=>(<circle key={i} cx="420" cy="210" r={r} stroke={P} strokeWidth="1.2" fill="none" opacity={0.9-i*0.08}/>))}</svg>
        </div>
        <div style={{ position:"absolute", left:40, bottom:40, opacity: dark ? 0.07 : 0.18, pointerEvents:"none" }}>
          <svg width="110" height="110" viewBox="0 0 110 110">{Array.from({length:6}).flatMap((_,row)=>Array.from({length:6}).map((_,col)=>(<circle key={`${row}-${col}`} cx={col*20+10} cy={row*20+10} r={2.5} fill={P}/>)))}</svg>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 0.45fr", gap:48, alignItems:"center", maxWidth:1240, margin:"0 auto", position:"relative", zIndex:1 }}>
          <motion.div initial={{ opacity:0, x:-30 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.7 }}
            style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <div style={{ width:88, height:88, borderRadius:"50%", background: dark ? "rgba(197,160,89,0.1)" : "#FFF5E0", border:`2px solid ${dark ? "rgba(197,160,89,0.3)" : "#F0DEB0"}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <img src="/assets/Ordely.png" alt="Ordely" style={{ width:54, height:54, objectFit:"contain" }}/>
            </div>
            <div>
              <h2 style={{ fontSize:52, fontWeight:900, color:tm, margin:0, letterSpacing:"-0.03em", lineHeight:1 }}>Todo Incluido</h2>
              <motion.div initial={{ width:0 }} whileInView={{ width:48 }} viewport={{ once:true }} transition={{ duration:0.6, delay:0.3 }}
                style={{ height:3, background:P, borderRadius:2, margin:"16px 0 20px" }}/>
              <p style={{ fontSize:15, color:tg, lineHeight:1.75, margin:0 }}>Una sola plataforma.<br/>Todo lo que tu restaurante necesita<br/>para crecer sin limites.</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity:0, y:40 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.7, delay:0.15 }}
            animate={{ boxShadow:["0 8px 40px rgba(197,160,89,0.1)","0 8px 56px rgba(197,160,89,0.26)","0 8px 40px rgba(197,160,89,0.1)"] } as any}
            style={{ background:bgCard, border:`1px solid ${br}`, borderRadius:24, padding:"38px 34px" }}>
            <div style={{ background:P, borderRadius:10, padding:"10px 0", textAlign:"center", marginBottom:24 }}>
              <span style={{ fontSize:15, fontWeight:700, color:"#fff" }}>Plan Ordely</span>
            </div>
            <div style={{ textAlign:"center", marginBottom:24 }}>
              <span style={{ fontSize:72, fontWeight:900, color:P, letterSpacing:"-0.04em", lineHeight:1 }}>S/60</span>
              <span style={{ fontSize:18, color:tg }}> /mes</span>
            </div>
            <div style={{ height:1, background:br, margin:"0 0 24px" }}/>
            <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:24 }}>
              {["Menu Digital con QR","Gestion de Pedidos en Tiempo Real","Panel de Administracion Completo","Roles: Mesero, Cocinero, Cajero","Web Publica Personalizada","Soporte Tecnico"].map((f,i)=>(
                <motion.div key={f} initial={{ opacity:0, x:-10 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ delay:i*0.06 }}
                  style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <motion.div initial={{ scale:0 }} whileInView={{ scale:1 }} viewport={{ once:true }} transition={{ delay:i*0.06+0.2, type:"spring", stiffness:400 }}
                    style={{ width:21, height:21, borderRadius:"50%", background:P, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Check size={11} color="#fff" strokeWidth={3}/>
                  </motion.div>
                  <span style={{ fontSize:14, color:tm, fontWeight:500 }}>{f}</span>
                </motion.div>
              ))}
            </div>
            <div style={{ background: dark ? "rgba(197,160,89,0.08)" : "#FFFBF0", border:`1px solid ${dark ? "rgba(197,160,89,0.2)" : "#F0DEB0"}`, borderRadius:12, padding:"13px 16px", display:"flex", alignItems:"center", gap:12, marginBottom:22 }}>
              <Star size={20} fill={P} color={P}/>
              <div>
                <p style={{ fontSize:13, fontWeight:700, color:tm, margin:0, lineHeight:1.3 }}>Paga tu primer mes y activa</p>
                <p style={{ fontSize:13, color:tg, margin:0, lineHeight:1.3 }}>tu restaurante al instante</p>
              </div>
            </div>
            <motion.button onClick={() => setShowModal(true)} style={{ width:"100%", padding:"16px 0", background:P, color:"#fff", border:"none", borderRadius:12, fontSize:16, fontWeight:700, cursor:"pointer" }}
              whileHover={{ background:PD, scale:1.02 }} whileTap={{ scale:0.98 }} transition={{ type:"spring", stiffness:400, damping:20 }}>
              Empezar ahora
            </motion.button>
          </motion.div>
          <div/>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding:"28px 6%", borderTop:`1px solid ${br}`, textAlign:"center", background:bg }}>
        <p style={{ color:tg, fontSize:13, margin:0 }}>© 2026 Ordely Platform. Potenciado por Multi-Tenant SDK.</p>
      </footer>

      {/* MODAL */}
      {showModal && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", backdropFilter:"blur(8px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} transition={{ type:"spring", stiffness:300, damping:30 }}
            style={{ background:bgCard, width:"100%", maxWidth:760, maxHeight:"92vh", overflowY:"auto", borderRadius:28, padding:"40px 44px", border:`1px solid ${br}`, position:"relative", boxShadow:"0 24px 64px rgba(0,0,0,0.2)" }}>
            <button onClick={() => setShowModal(false)} style={{ position:"absolute", top:20, right:20, background:"none", border:`1px solid ${br}`, borderRadius:8, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:tg, fontSize:18 }}>x</button>
            <h2 style={{ fontSize:28, fontWeight:800, color:tm, margin:"0 0 6px", letterSpacing:"-0.02em" }}>Registra tu Restaurante</h2>
            <p style={{ color:tg, margin:"0 0 24px", fontSize:14 }}>Completa los datos y realiza el pago del primer mes.</p>
            <div style={{ background: dark ? "rgba(197,160,89,0.1)" : "#FFFBF0", border:`1px solid ${dark ? "rgba(197,160,89,0.3)" : "#F0DEB0"}`, borderRadius:14, padding:"14px 20px", marginBottom:24, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}><CreditCard size={18} color={P}/><span style={{ color:tg, fontSize:14 }}>Pago del primer mes</span></div>
              <span style={{ fontSize:22, fontWeight:800, color:P }}>S/{PRECIO}</span>
            </div>
            <form onSubmit={handleRegister} style={{ display:"flex", flexDirection:"column", gap:13 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <input required style={{ height:50, borderRadius:12, background: dark ? "rgba(255,255,255,0.04)" : "#F9F5EC", border:`1px solid ${br}`, color:tm, padding:"0 16px", fontSize:14, outline:"none" }} placeholder="Nombre del Restaurante" value={form.nombre} onChange={e => setForm({...form, nombre:e.target.value})}/>
                <input required style={{ height:50, borderRadius:12, background: dark ? "rgba(255,255,255,0.04)" : "#F9F5EC", border:`1px solid ${br}`, color:tm, padding:"0 16px", fontSize:14, outline:"none" }} placeholder="Slug (ej: mi-restaurante)" value={form.slug} onChange={e => setForm({...form, slug:e.target.value.toLowerCase().replace(/\s+/g,"-")})}/>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div><p style={{ fontSize:11, fontWeight:600, color:tg, margin:"0 0 5px", textTransform:"uppercase" as const }}>Color principal</p><input type="color" style={{ width:"100%", height:50, borderRadius:12, background: dark ? "rgba(255,255,255,0.04)" : "#F9F5EC", border:`1px solid ${br}`, padding:6 }} value={form.color_primario} onChange={e => setForm({...form, color_primario:e.target.value})}/></div>
                <div><p style={{ fontSize:11, fontWeight:600, color:tg, margin:"0 0 5px", textTransform:"uppercase" as const }}>Color secundario</p><input type="color" style={{ width:"100%", height:50, borderRadius:12, background: dark ? "rgba(255,255,255,0.04)" : "#F9F5EC", border:`1px solid ${br}`, padding:6 }} value={form.color_secundario} onChange={e => setForm({...form, color_secundario:e.target.value})}/></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <ImageUploadInput label="Logo del restaurante" value={form.logo_url} onChange={url => setForm({...form, logo_url:url})} height={110}/>
                <ImageUploadInput label="Hero banner" value={form.hero_banner_url} onChange={url => setForm({...form, hero_banner_url:url})} height={110} hint="Imagen portada y menu"/>
              </div>
              <div style={{ background: dark ? "rgba(255,255,255,0.02)" : "#F9F5EC", padding:"16px 18px", borderRadius:14, border:`1px solid ${br}` }}>
                <p style={{ fontSize:11, fontWeight:600, color:tg, margin:"0 0 10px", textTransform:"uppercase" as const }}>Configuracion Geografica</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                  <div><label style={{ fontSize:10, color:tg, display:"block", marginBottom:4 }}>LATITUD</label><input required type="number" step="any" style={{ width:"100%", height:44, borderRadius:10, background: dark ? "rgba(255,255,255,0.04)" : "#fff", border:`1px solid ${br}`, color:tm, padding:"0 12px", fontSize:13, outline:"none" }} value={Number.isNaN(form.latitud) ? "" : form.latitud} onChange={e => setForm({...form, latitud:parseFloat(e.target.value)})}/></div>
                  <div><label style={{ fontSize:10, color:tg, display:"block", marginBottom:4 }}>LONGITUD</label><input required type="number" step="any" style={{ width:"100%", height:44, borderRadius:10, background: dark ? "rgba(255,255,255,0.04)" : "#fff", border:`1px solid ${br}`, color:tm, padding:"0 12px", fontSize:13, outline:"none" }} value={Number.isNaN(form.longitud) ? "" : form.longitud} onChange={e => setForm({...form, longitud:parseFloat(e.target.value)})}/></div>
                  <div><label style={{ fontSize:10, color:tg, display:"block", marginBottom:4 }}>RADIO (m)</label><input required type="number" min="10" style={{ width:"100%", height:44, borderRadius:10, background: dark ? "rgba(255,255,255,0.04)" : "#fff", border:`1px solid ${br}`, color:tm, padding:"0 12px", fontSize:13, outline:"none" }} value={Number.isNaN(form.radio_permitido_metros) ? "" : form.radio_permitido_metros} onChange={e => setForm({...form, radio_permitido_metros:parseInt(e.target.value)})}/></div>
                </div>
                <p style={{ fontSize:11, color:tg, margin:"8px 0 0" }}>Solo clientes dentro del radio podran hacer pedidos.</p>
              </div>
              <hr style={{ border:0, borderTop:`1px solid ${br}` }}/>
              <input required style={{ height:50, borderRadius:12, background: dark ? "rgba(255,255,255,0.04)" : "#F9F5EC", border:`1px solid ${br}`, color:tm, padding:"0 16px", fontSize:14, outline:"none" }} placeholder="Nombre del Dueno" value={form.propietario_nombre} onChange={e => setForm({...form, propietario_nombre:e.target.value})}/>
              <input required type="email" style={{ height:50, borderRadius:12, background: dark ? "rgba(255,255,255,0.04)" : "#F9F5EC", border:`1px solid ${br}`, color:tm, padding:"0 16px", fontSize:14, outline:"none" }} placeholder="Email de acceso" value={form.propietario_email} onChange={e => setForm({...form, propietario_email:e.target.value})}/>
              <div style={{ position:"relative" }}>
                <input required type={showPwd ? "text" : "password"} style={{ width:"100%", height:50, borderRadius:12, background: dark ? "rgba(255,255,255,0.04)" : "#F9F5EC", border:`1px solid ${br}`, color:tm, padding:"0 48px 0 16px", fontSize:14, outline:"none" }} placeholder="Contrasena segura" value={form.propietario_password} onChange={e => setForm({...form, propietario_password:e.target.value})}/>
                <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:tg, display:"flex" }}>
                  {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              <motion.button disabled={loading} type="submit" style={{ height:56, borderRadius:14, marginTop:6, width:"100%", background:P, color:"#fff", border:"none", fontSize:16, fontWeight:700, cursor: loading ? "wait" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, opacity: loading ? 0.7 : 1 }}
                whileHover={{ background:PD }} whileTap={{ scale:0.98 }}>
                {loading ? <Loader2 className="spin-icon" size={20}/> : <><CreditCard size={18}/> Pagar S/{PRECIO} y Crear Restaurante</>}
              </motion.button>
              <p style={{ textAlign:"center", fontSize:12, color:tg, margin:"4px 0 0" }}>Seras redirigido a Mercado Pago de forma segura</p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

