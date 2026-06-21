"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useInView, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, Check, Loader2, Star, Eye, EyeOff, CreditCard, AlertCircle, CheckCircle, QrCode, Users, Zap, ShieldCheck, Moon, Sun, Menu, X, LogIn, ChevronRight } from "lucide-react";
import { crearPreferenciaPagoRegistro } from "@/lib/api";
import { ImageUploadInput } from "@/components/ImageUploadInput";
import { resetRestauranteBranding } from "@/lib/branding";

/* ══ TOKENS ══ */
const P = "#C5A059";
const PD = "#A8863D";
const BGL = "#FFFDF7";
const BGC = "#F9F5EC";
const TD = "#1A1410";
const TG = "#6B6257";
const BD = "#E8DFD0";
const PRECIO = 60;
const ease = [0.22, 1, 0.36, 1] as any;

/* ══ COUNT-UP ══ */
function useCountUp(target: number, duration = 1800, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let t0: number | null = null;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step); else setVal(target);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return val;
}

/* ══ NAV LINK ══ */
function NavLink({ href, label, dark, onClick }: { href: string; label: string; dark: boolean; onClick?: () => void }) {
  const [hov, setHov] = useState(false);
  const tg = dark ? "#9B9386" : TG;
  return (
    <a href={href} onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ color: hov ? P : tg, textDecoration: "none", fontSize: 15, fontWeight: 500, position: "relative", padding: "4px 0", transition: "color 200ms ease", display: "inline-block" }}>
      {label}
      <motion.span animate={{ scaleX: hov ? 1 : 0, opacity: hov ? 1 : 0 }} transition={{ duration: 0.22, ease: "easeOut" }}
        style={{ position: "absolute", bottom: -2, left: 0, right: 0, height: 2, background: P, borderRadius: 1, transformOrigin: "left", display: "block" }} />
    </a>
  );
}

/* ══ STAT CARD with expand animation ══ */
function StatCard({ icon, label, target, suffix = "", desc, extra, dark }: any) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const count = useCountUp(target, 1800, inView);
  const [hov, setHov] = useState(false);
  const bg = dark ? "#1A1A1C" : "#FFFFFF";
  const br = dark ? "#2A2118" : BD;
  const tm = dark ? "#F0E6D0" : TD;
  const tg = dark ? "#9B9386" : TG;
  const isUp = desc.includes("+") || desc.includes("↑");
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, ease }}
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      animate={{ scale: hov ? 1.04 : 1, y: hov ? -6 : 0, boxShadow: hov ? "0 20px 48px rgba(197,160,89,0.22), 0 4px 12px rgba(0,0,0,0.06)" : "0 2px 8px rgba(0,0,0,0.04)" }}
      style={{ flex: 1, minWidth: 180, display: "flex", alignItems: "center", gap: 14, padding: "20px 22px", background: bg, borderRadius: 16, border: `1px solid ${hov ? `rgba(197,160,89,0.45)` : br}`, cursor: "default", transition: "border-color 0.3s" }}>
      <motion.div animate={{ scale: hov ? 1.1 : 1 }} transition={{ type: "spring", stiffness: 300 }}
        style={{ width: 48, height: 48, borderRadius: "50%", border: `2px solid ${hov ? P : `rgba(197,160,89,0.4)`}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: dark ? "rgba(197,160,89,0.08)" : "#FFF5E0", transition: "border-color 0.3s" }}>
        {icon}
      </motion.div>
      <div style={{ flex: 1 }}>
        <motion.p animate={{ color: hov ? P : tg }} transition={{ duration: 0.2 }} style={{ fontSize: 11, margin: "0 0 2px", fontWeight: 500 }}>{label}</motion.p>
        <p style={{ fontSize: 28, fontWeight: 900, color: tm, margin: "0 0 2px", lineHeight: 1, letterSpacing: "-0.02em" }}>{suffix}{count.toLocaleString()}</p>
        <AnimatePresence>
          {hov && extra && (
            <motion.p initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: "auto", marginTop: 4 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} transition={{ duration: 0.25, ease: "easeOut" }}
              style={{ fontSize: 11, color: P, fontWeight: 600, overflow: "hidden" }}>{extra}</motion.p>
          )}
        </AnimatePresence>
        <p style={{ fontSize: 11, color: isUp ? "#16a34a" : tg, margin: 0, fontWeight: isUp ? 700 : 400 }}>{desc}</p>
      </div>
    </motion.div>
  );
}

/* ══ FEATURE CARD — no default hover state ══ */
function FeatureCard({ icon, title, desc, delay, dark, dir = "up" }: any) {
  const bg = dark ? "#1A1A1C" : "rgba(255,255,255,0.92)";
  const br = dark ? "#2A2118" : BD;
  const tm = dark ? "#F0E6D0" : TD;
  const tg = dark ? "#9B9386" : TG;
  const init = dir === "left" ? { opacity: 0, x: -40 } : dir === "right" ? { opacity: 0, x: 40 } : { opacity: 0, y: 30 };
  return (
    <motion.div initial={init} whileInView={{ opacity: 1, x: 0, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.65, delay, ease }}
      whileHover={{ y: -7, boxShadow: `0 20px 44px rgba(197,160,89,0.16), 0 4px 12px rgba(0,0,0,0.06)`, borderColor: `rgba(197,160,89,0.5)` }}
      style={{ display: "flex", alignItems: "flex-start", gap: 18, padding: "26px 24px", background: bg, border: `1px solid ${br}`, borderRadius: 18, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", cursor: "default" }}>
      <motion.div whileHover={{ scale: 1.12, rotate: 5 }} transition={{ type: "spring", stiffness: 400 }}
        style={{ width: 64, height: 64, borderRadius: "50%", background: dark ? "rgba(197,160,89,0.1)" : "#FFF5E0", border: `2px solid ${dark ? "rgba(197,160,89,0.25)" : "#F0DEB0"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </motion.div>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: tm, margin: "0 0 8px", letterSpacing: "-0.01em" }}>{title}</h3>
        <p style={{ fontSize: 14, color: tg, lineHeight: 1.7, margin: "0 0 12px" }}>{desc}</p>
        <motion.span whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400 }} style={{ color: P, fontSize: 18, fontWeight: 700, display: "inline-block", cursor: "pointer" }}>→</motion.span>
      </div>
    </motion.div>
  );
}

/* ══ MOBILE MENU ══ */
function MobileMenu({ dark, open, onClose, onLogin }: { dark: boolean; open: boolean; onClose: () => void; onLogin: () => void }) {
  const bg = dark ? "rgba(15,14,18,0.98)" : "rgba(255,253,247,0.98)";
  const tm = dark ? "#F0E6D0" : TD;
  const tg = dark ? "#9B9386" : TG;
  const br = dark ? "#2A2118" : BD;
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 290, backdropFilter: "blur(4px)" }} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 280, damping: 30 }}
            style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(320px, 85vw)", background: bg, zIndex: 300, display: "flex", flexDirection: "column", padding: "24px", boxShadow: "-8px 0 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <img src="/assets/Ordely.png" alt="Ordely" style={{ height: 40, objectFit: "contain" }} />
                <span style={{ fontSize: 20, fontWeight: 900, color: P, letterSpacing: "-0.02em" }}>Ordely</span>
              </div>
              <motion.button onClick={onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                style={{ width: 36, height: 36, borderRadius: 9, border: `1px solid ${br}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: tg }}>
                <X size={18} />
              </motion.button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
              {[["#features", "Caracteristicas"], ["#pricing", "Precios"]].map(([href, label], i) => (
                <motion.a key={label} href={href} onClick={onClose} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 + 0.1, ease }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", color: tm, textDecoration: "none", fontSize: 17, fontWeight: 600, borderBottom: `1px solid ${br}` }}>
                  {label} <ChevronRight size={16} color={tg} />
                </motion.a>
              ))}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.24, ease }} style={{ marginTop: 24 }}>
                <motion.button onClick={onLogin} whileHover={{ scale: 1.02, background: PD }} whileTap={{ scale: 0.97 }}
                  style={{ width: "100%", padding: "14px 0", background: P, color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <LogIn size={18} /> INGRESAR
                </motion.button>
              </motion.div>
            </div>
            <p style={{ fontSize: 11, color: tg, textAlign: "center", marginTop: 24 }}>© 2026 Ordely Platform</p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ══ LOGIN ONBOARDING ══ */
function LoginOnboarding({ dark, onDone }: { dark: boolean; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2200);
    return () => clearTimeout(timer);
  }, [onDone]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
      style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20, background: dark ? "#0C0B0E" : BGL }}>
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.1 }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <motion.img src="/assets/Ordely.png" alt="Ordely"
          animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: 96, height: 96, objectFit: "contain" }} />
        <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ fontSize: 32, fontWeight: 900, color: P, letterSpacing: "-0.02em" }}>Ordely</motion.span>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ fontSize: 15, color: TG, textAlign: "center" }}>Bienvenido de vuelta 👋</motion.p>
      </motion.div>
      <motion.div initial={{ width: 0 }} animate={{ width: 200 }} transition={{ delay: 0.7, duration: 1.2, ease: "easeInOut" }}
        style={{ height: 3, background: `linear-gradient(90deg, ${P}, ${PD})`, borderRadius: 2 }} />
    </motion.div>
  );
}

/* ══ MAIN ══ */
export default function SaaSLandingPage() {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [pagoMsg, setPagoMsg] = useState<{ type: "success"|"error"|"pending"; text: string }|null>(null);
  const [showReg, setShowReg] = useState(false);
  const [showOnboard, setShowOnboard] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [form, setForm] = useState({ nombre:"", slug:"", propietario_nombre:"", propietario_email:"", propietario_password:"", color_primario:"#C5A059", color_secundario:"#E2725B", logo_url:"", hero_banner_url:"", latitud:-12.046374, longitud:-77.042793, radio_permitido_metros:100 });

  /* Parallax */
  const { scrollY } = useScroll();
  const bgParallax = useTransform(scrollY, [0, 1200], ["0%", "-18%"]);
  const heroImgY = useSpring(useTransform(scrollY, [0, 600], [0, 40]), { stiffness: 60, damping: 20 });
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const imgTiltX = useSpring(useTransform(mouseX, [-500, 500], [-8, 8]), { stiffness: 55, damping: 18 });
  const imgTiltY = useSpring(useTransform(mouseY, [-400, 400], [-5, 5]), { stiffness: 55, damping: 18 });

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
    mouseX.set(e.clientX - r.left - r.width / 2);
    mouseY.set(e.clientY - r.top - r.height / 2);
  }, [mouseX, mouseY]);

  const handleLogin = () => { setShowOnboard(true); };
  const handleOnboardDone = () => { setShowOnboard(false); router.push("/login"); };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { const pref = await crearPreferenciaPagoRegistro(form); window.location.href = pref.sandbox_init_point; }
    catch (err: any) { alert(err.message || "Error."); setLoading(false); }
  };

  /* Tokens */
  const bg = dark ? "#0C0B0E" : BGL;
  const bgCard = dark ? "#1A1A1C" : "#FFFFFF";
  const bgCream = dark ? "#111014" : BGC;
  const tm = dark ? "#F0E6D0" : TD;
  const tg = dark ? "#9B9386" : TG;
  const br = dark ? "#2A2118" : BD;

  const hi = { hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease } } };

  return (
    <div style={{ background: bg, color: tm, minHeight: "100vh", fontFamily: "var(--font-manrope), system-ui, sans-serif", overflowX: "hidden" }}>

      {/* Login onboarding overlay */}
      <AnimatePresence>{showOnboard && <LoginOnboarding dark={dark} onDone={handleOnboardDone} />}</AnimatePresence>

      {/* Mobile menu */}
      <MobileMenu dark={dark} open={mobileOpen} onClose={() => setMobileOpen(false)} onLogin={handleLogin} />

      {/* Pago notification */}
      {pagoMsg && (
        <div style={{ position:"fixed", top:90, left:"50%", transform:"translateX(-50%)", zIndex:1001, padding:"14px 20px", borderRadius:14, display:"flex", alignItems:"center", gap:10, background: pagoMsg.type==="error" ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)", border:`1px solid ${pagoMsg.type==="error" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`, color: pagoMsg.type==="error" ? "#dc2626" : "#16a34a", fontSize:14 }}>
          {pagoMsg.type==="error" ? <AlertCircle size={18}/> : <CheckCircle size={18}/>}
          <span>{pagoMsg.text}</span>
          <button onClick={() => setPagoMsg(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"inherit", marginLeft:6 }}>×</button>
        </div>
      )}

      {/* ══ NAVBAR ══ */}
      <motion.nav initial={{ y:-80, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ duration:0.7, ease }}
        style={{ position:"fixed", top:0, left:0, right:0, zIndex:200, height: scrolled ? 68 : 84,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 clamp(20px,5%,80px)",
          background: scrolled ? (dark ? "rgba(12,11,14,0.88)" : "rgba(255,253,247,0.86)") : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          borderBottom: scrolled ? `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(197,160,89,0.14)"}` : "1px solid transparent",
          boxShadow: scrolled ? (dark ? "0 4px 28px rgba(0,0,0,0.45)" : "0 4px 28px rgba(197,160,89,0.1)") : "none",
          transition:"height 300ms cubic-bezier(0.4,0,0.2,1), background 300ms ease, border-bottom 300ms ease, box-shadow 300ms ease" }}>

        {/* Logo */}
        <motion.div style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }} whileHover={{ scale:1.02 }} onClick={() => window.scrollTo({top:0,behavior:"smooth"})}>
          <motion.img src="/assets/Ordely.png" alt="Ordely"
            style={{ height: scrolled ? 46 : 56, width:"auto", objectFit:"contain", transition:"height 300ms ease" }}
            whileHover={{ scale:1.05 }} />
          <span style={{ fontSize:26, fontWeight:900, color:P, letterSpacing:"-0.02em", transition:"font-size 300ms ease" }}>Ordely</span>
        </motion.div>

        {/* Desktop nav */}
        <div className="nav-desktop" style={{ display:"flex", alignItems:"center", gap:24 }}>
          <NavLink href="#features" label="Caracteristicas" dark={dark} />
          <NavLink href="#pricing" label="Precios" dark={dark} />
          <motion.button onClick={handleLogin}
            style={{ background:P, color:"#fff", border:"none", borderRadius:10, padding:"9px 22px", fontSize:14, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, letterSpacing:"0.02em" }}
            whileHover={{ background:PD, scale:1.03 }} whileTap={{ scale:0.97 }} transition={{ type:"spring", stiffness:400, damping:20 }}>
            <LogIn size={15}/> INGRESAR
          </motion.button>
          <motion.button onClick={() => setDark(!dark)}
            style={{ width:34, height:34, borderRadius:8, background:"transparent", border:`1px solid ${br}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:tg, transition:"all 300ms ease" }}
            whileHover={{ borderColor:P, color:P, scale:1.05 }} transition={{ duration:0.2 }}>
            {dark ? <Sun size={14} color={P}/> : <Moon size={14}/>}
          </motion.button>
        </div>

        {/* Mobile hamburger */}
        <motion.button className="nav-mobile" onClick={() => setMobileOpen(true)}
          style={{ width:38, height:38, borderRadius:9, border:`1px solid ${br}`, background:"transparent", cursor:"pointer", display:"none", alignItems:"center", justifyContent:"center", color:tm }}
          whileHover={{ borderColor:P }} whileTap={{ scale:0.93 }}>
          <Menu size={20}/>
        </motion.button>
      </motion.nav>

      {/* ══ HERO ══ */}
      <section style={{ padding:"100px 6% 60px", position:"relative", overflow:"hidden", background:bg }} onMouseMove={onMouseMove}>
        <div style={{ position:"absolute", bottom:-40, left:-40, width:300, height:300, pointerEvents:"none", opacity: dark ? 0.1 : 0.3 }}>
          <svg viewBox="0 0 300 300" fill="none">{[60,100,140,180,220,260].map((r,i)=>(<circle key={i} cx="0" cy="300" r={r} stroke={P} strokeWidth="0.8" fill="none" opacity={0.7-i*0.09}/>))}</svg>
        </div>
        <motion.div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:32, alignItems:"center", maxWidth:1300, margin:"0 auto", position:"relative", zIndex:1 }}
          variants={{ hidden:{}, show:{ transition:{ staggerChildren:0.1 } } }} initial="hidden" animate="show">
          <div style={{ minWidth:0 }}>
            <motion.div variants={hi} style={{ display:"inline-block", marginBottom:14, fontSize:11, fontWeight:700, letterSpacing:"0.12em", color:P, textTransform:"uppercase" as const }}>
              Arquitectura Multi-Tenant de Nueva Generacion
            </motion.div>
            <motion.h1 variants={hi} style={{ fontSize:"clamp(34px,4.5vw,64px)", fontWeight:900, lineHeight:1.03, letterSpacing:"-0.03em", color:tm, margin:"0 0 18px" }}>
              El sistema operativo<br/>para tu Imperio<br/>Gastronomico.
            </motion.h1>
            <motion.p variants={hi} style={{ fontSize:"clamp(14px,1.5vw,16px)", color:tg, lineHeight:1.75, margin:"0 0 34px", maxWidth:440 }}>
              Desde menus digitales inteligentes hasta gestion operativa en tiempo real. Todo lo que necesitas para escalar tu restaurante en una sola plataforma.
            </motion.p>
            <motion.div variants={hi}>
              <motion.button onClick={() => setShowReg(true)}
                style={{ background:P, color:"#fff", border:"none", borderRadius:10, padding:"14px 28px", fontSize:"clamp(12px,1.4vw,14px)", fontWeight:700, cursor:"pointer", letterSpacing:"0.04em", display:"inline-flex", alignItems:"center", gap:8 }}
                whileHover={{ background:PD, scale:1.03 }} whileTap={{ scale:0.97 }} transition={{ type:"spring", stiffness:400, damping:20 }}>
                REGISTRA TU RESTAURANTE <ArrowRight size={16}/>
              </motion.button>
            </motion.div>
          </div>
          <motion.div initial={{ opacity:0, x:50 }} animate={{ opacity:1, x:0 }} transition={{ duration:1.0, delay:0.25, ease }}
            style={{ x:imgTiltX, y:imgTiltY, display:"flex", justifyContent:"center", minWidth:0 }}>
            <motion.img src="/assets/image_web.png" alt="Ordely Dashboard"
              style={{ width:"115%", maxWidth:820, height:"auto", display:"block", filter:"drop-shadow(0 28px 60px rgba(197,160,89,0.22)) drop-shadow(0 8px 20px rgba(0,0,0,0.07))" } as any}
              animate={{ y:[0,-12,0] }} transition={{ duration:5, repeat:Infinity, ease:"easeInOut" }}/>
          </motion.div>
        </motion.div>
      </section>

      {/* ══ STATS + FEATURES — restaurant.jpg parallax background ══ */}
      <div style={{ position:"relative", overflow:"hidden" }}>
        {/* Parallax background */}
        <motion.div style={{ position:"absolute", inset:"-20%", backgroundImage:"url(/assets/restaurant.jpg)", backgroundSize:"cover", backgroundPosition:"center", y: bgParallax, opacity: dark ? 0.07 : 0.12, filter:"blur(1px)" } as any} />
        <div style={{ position:"absolute", inset:0, background: dark ? "rgba(12,11,14,0.88)" : "rgba(249,245,236,0.88)" }} />

        {/* STATS */}
        <section style={{ padding:"0 6% 56px", paddingTop:56, position:"relative" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(190px, 1fr))", gap:14, maxWidth:1240, margin:"0 auto" }}>
            <StatCard dark={dark} label="Pedidos en Vivo" target={128} desc="● ahora mismo" extra="Actualizado en tiempo real"
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="12" y2="15"/></svg>}/>
            <StatCard dark={dark} label="Mesas Activas" target={24} desc="● de 36" extra="Capacidad al 67%"
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2"><line x1="2" y1="6" x2="22" y2="6"/><line x1="12" y1="6" x2="12" y2="20"/><line x1="4" y1="20" x2="20" y2="20"/></svg>}/>
            <StatCard dark={dark} label="Locales Conectados" target={12} desc="● activos" extra="3 paises distintos"
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}/>
            <StatCard dark={dark} label="Ventas de Hoy" target={2450} suffix="S/" desc="↑ 18% vs ayer" extra="Record esta semana"
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>}/>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" style={{ padding:"0 6% 80px", position:"relative" }}>
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6, ease }} style={{ textAlign:"center", marginBottom:40 }}>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", color:P, textTransform:"uppercase" as const, margin:"0 0 10px" }}>Caracteristicas</p>
            <h2 style={{ fontSize:"clamp(26px,3.5vw,40px)", fontWeight:900, color: dark ? "#F0E6D0" : TD, margin:0, letterSpacing:"-0.02em" }}>Todo lo que necesitas para crecer</h2>
          </motion.div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:16, maxWidth:1240, margin:"0 auto" }}>
            <FeatureCard dark={dark} delay={0} dir="left" icon={<QrCode size={30} color={P}/>} title="Menu Digital Inteligente" desc="Pedidos desde la mesa con validacion de geolocalizacion. Reduce tiempos y mejora la experiencia del cliente."/>
            <FeatureCard dark={dark} delay={0.08} dir="up" icon={<Users size={30} color={P}/>} title="Control Total Multi-Tenant" desc="Gestiona multiples locales, roles (Cocinero, Mesero, Cajero) y analiticas avanzadas en un panel unificado."/>
            <FeatureCard dark={dark} delay={0.16} dir="up" icon={<Zap size={30} color={P}/>} title="Real-Time de Verdad" desc="La cocina recibe pedidos al instante. Sincronizacion perfecta entre todos los dispositivos del staff."/>
            <FeatureCard dark={dark} delay={0.24} dir="right" icon={<ShieldCheck size={30} color={P}/>} title="Precio Simple y Transparente" desc="Sin planes complicados. Paga mensualmente y ten acceso completo."/>
          </div>
        </section>
      </div>

      {/* ══ PRICING ══ */}
      <section id="pricing" style={{ padding:"80px 6%", background:bgCream, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:-60, top:"50%", transform:"translateY(-50%)", opacity: dark ? 0.06 : 0.22, pointerEvents:"none" }}>
          <svg width="380" height="380" viewBox="0 0 380 380">{[60,100,140,180,220,260,300,340].map((r,i)=>(<circle key={i} cx="380" cy="190" r={r} stroke={P} strokeWidth="1.1" fill="none" opacity={0.9-i*0.09}/>))}</svg>
        </div>
        <div style={{ position:"absolute", left:32, bottom:32, opacity: dark ? 0.06 : 0.16, pointerEvents:"none" }}>
          <svg width="100" height="100" viewBox="0 0 100 100">{Array.from({length:5}).flatMap((_,r)=>Array.from({length:5}).map((_,c)=>(<circle key={`${r}-${c}`} cx={c*22+11} cy={r*22+11} r={2.5} fill={P}/>)))}</svg>
        </div>

        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }} style={{ textAlign:"center", marginBottom:48 }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", color:P, textTransform:"uppercase" as const, margin:"0 0 10px" }}>Planes</p>
          <h2 style={{ fontSize:"clamp(26px,3.5vw,40px)", fontWeight:900, color:tm, margin:0, letterSpacing:"-0.02em" }}>Simple y Transparente</h2>
        </motion.div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:40, alignItems:"start", maxWidth:1000, margin:"0 auto", position:"relative", zIndex:1 }}>

          {/* Left col */}
          <motion.div initial={{ opacity:0, x:-30 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.7, ease }} style={{ display:"flex", flexDirection:"column", gap:24 }}>
            <motion.div whileHover={{ scale:1.06, rotate:3 }} transition={{ type:"spring", stiffness:300 }}
              style={{ width:80, height:80, borderRadius:"50%", background: dark ? "rgba(197,160,89,0.1)" : "#FFF5E0", border:`2px solid ${dark ? "rgba(197,160,89,0.3)" : "#F0DEB0"}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <img src="/assets/Ordely.png" alt="Ordely" style={{ width:50, height:50, objectFit:"contain" }}/>
            </motion.div>
            <div>
              <h2 style={{ fontSize:"clamp(34px,4vw,52px)", fontWeight:900, color:tm, margin:0, letterSpacing:"-0.03em", lineHeight:1.05 }}>Todo<br/>Incluido</h2>
              <motion.div initial={{ width:0 }} whileInView={{ width:44 }} viewport={{ once:true }} transition={{ duration:0.7, delay:0.3 }} style={{ height:3, background:P, borderRadius:2, margin:"14px 0 18px" }}/>
              <p style={{ fontSize:15, color:tg, lineHeight:1.75, margin:0 }}>Una sola plataforma.<br/>Todo lo que tu restaurante necesita<br/>para crecer sin limites.</p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {["Sin contrato permanente","Activacion inmediata","Soporte humano incluido"].map((f,i)=>(
                <motion.div key={f} initial={{ opacity:0, x:-15 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ delay:i*0.08+0.2, ease }}
                  style={{ display:"flex", alignItems:"center", gap:10, fontSize:13, color:tg }}>
                  <CheckCircle size={15} color={P}/> {f}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right col — Plan card */}
          <motion.div initial={{ opacity:0, y:40 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.7, delay:0.15, ease }}
            animate={{ boxShadow:["0 8px 40px rgba(197,160,89,0.1)","0 12px 56px rgba(197,160,89,0.25)","0 8px 40px rgba(197,160,89,0.1)"] } as any}
            style={{ background:bgCard, border:`1px solid ${br}`, borderRadius:24, overflow:"hidden" }}>
            {/* Card header */}
            <div style={{ background:`linear-gradient(135deg, ${P}, ${PD})`, padding:"16px 32px", textAlign:"center" }}>
              <p style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.75)", margin:"0 0 2px", textTransform:"uppercase" as const, letterSpacing:"0.1em" }}>Plan Ordely</p>
              <div style={{ display:"flex", alignItems:"baseline", justifyContent:"center", gap:6 }}>
                <span style={{ fontSize:64, fontWeight:900, color:"#fff", letterSpacing:"-0.04em", lineHeight:1 }}>S/60</span>
                <span style={{ fontSize:18, color:"rgba(255,255,255,0.7)", fontWeight:400 }}>/mes</span>
              </div>
            </div>
            {/* Features list */}
            <div style={{ padding:"28px 32px" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:13, marginBottom:24 }}>
                {["Menu Digital con QR","Gestion de Pedidos en Tiempo Real","Panel de Administracion Completo","Roles: Mesero, Cocinero, Cajero","Web Publica Personalizada","Soporte Tecnico"].map((f,i)=>(
                  <motion.div key={f} initial={{ opacity:0, x:-10 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ delay:i*0.06 }}
                    style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <motion.div initial={{ scale:0 }} whileInView={{ scale:1 }} viewport={{ once:true }} transition={{ delay:i*0.06+0.2, type:"spring", stiffness:400 }}
                      style={{ width:20, height:20, borderRadius:"50%", background:P, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Check size={11} color="#fff" strokeWidth={3}/>
                    </motion.div>
                    <span style={{ fontSize:14, color:tm, fontWeight:500 }}>{f}</span>
                  </motion.div>
                ))}
              </div>
              <div style={{ background: dark ? "rgba(197,160,89,0.08)" : "#FFFBF0", border:`1px solid ${dark ? "rgba(197,160,89,0.2)" : "#F0DEB0"}`, borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                <Star size={18} fill={P} color={P}/>
                <p style={{ fontSize:13, color:tm, margin:0, lineHeight:1.4 }}><strong>Paga tu primer mes</strong><br/><span style={{ color:tg }}>y activa tu restaurante al instante</span></p>
              </div>
              <motion.button onClick={() => setShowReg(true)} whileHover={{ background:PD, scale:1.02 }} whileTap={{ scale:0.98 }} transition={{ type:"spring", stiffness:400, damping:20 }}
                style={{ width:"100%", padding:"15px 0", background:P, color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:700, cursor:"pointer" }}>
                Empezar ahora
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ padding:"24px 6%", borderTop:`1px solid ${br}`, textAlign:"center", background:bg }}>
        <p style={{ color:tg, fontSize:13, margin:0 }}>© 2026 Ordely Platform. Potenciado por Multi-Tenant SDK.</p>
      </footer>

      {/* ══ REGISTRATION MODAL ══ */}
      <AnimatePresence>
        {showReg && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", backdropFilter:"blur(8px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:10 }} transition={{ type:"spring", stiffness:300, damping:30 }}
              style={{ background:bgCard, width:"100%", maxWidth:760, maxHeight:"92vh", overflowY:"auto", borderRadius:28, padding:"40px 44px", border:`1px solid ${br}`, position:"relative", boxShadow:"0 24px 64px rgba(0,0,0,0.2)" }}>
              <button onClick={() => setShowReg(false)} style={{ position:"absolute", top:20, right:20, background:"none", border:`1px solid ${br}`, borderRadius:8, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:tg, fontSize:18 }}>×</button>
              <h2 style={{ fontSize:28, fontWeight:800, color:tm, margin:"0 0 6px", letterSpacing:"-0.02em" }}>Registra tu Restaurante</h2>
              <p style={{ color:tg, margin:"0 0 24px", fontSize:14 }}>Completa los datos y realiza el pago del primer mes.</p>
              <div style={{ background: dark ? "rgba(197,160,89,0.1)" : "#FFFBF0", border:`1px solid ${dark ? "rgba(197,160,89,0.3)" : "#F0DEB0"}`, borderRadius:14, padding:"14px 20px", marginBottom:24, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}><CreditCard size={18} color={P}/><span style={{ color:tg, fontSize:14 }}>Pago del primer mes</span></div>
                <span style={{ fontSize:22, fontWeight:800, color:P }}>S/{PRECIO}</span>
              </div>
              <form onSubmit={handleRegister} style={{ display:"flex", flexDirection:"column", gap:13 }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px,1fr))", gap:12 }}>
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
                    <div><label style={{ fontSize:10, color:tg, display:"block", marginBottom:4 }}>LATITUD</label><input required type="number" step="any" style={{ width:"100%", height:44, borderRadius:10, background: dark ? "rgba(255,255,255,0.04)" : "#fff", border:`1px solid ${br}`, color:tm, padding:"0 12px", fontSize:13, outline:"none" }} value={Number.isNaN(form.latitud)?"":form.latitud} onChange={e => setForm({...form, latitud:parseFloat(e.target.value)})}/></div>
                    <div><label style={{ fontSize:10, color:tg, display:"block", marginBottom:4 }}>LONGITUD</label><input required type="number" step="any" style={{ width:"100%", height:44, borderRadius:10, background: dark ? "rgba(255,255,255,0.04)" : "#fff", border:`1px solid ${br}`, color:tm, padding:"0 12px", fontSize:13, outline:"none" }} value={Number.isNaN(form.longitud)?"":form.longitud} onChange={e => setForm({...form, longitud:parseFloat(e.target.value)})}/></div>
                    <div><label style={{ fontSize:10, color:tg, display:"block", marginBottom:4 }}>RADIO (m)</label><input required type="number" min="10" style={{ width:"100%", height:44, borderRadius:10, background: dark ? "rgba(255,255,255,0.04)" : "#fff", border:`1px solid ${br}`, color:tm, padding:"0 12px", fontSize:13, outline:"none" }} value={Number.isNaN(form.radio_permitido_metros)?"":form.radio_permitido_metros} onChange={e => setForm({...form, radio_permitido_metros:parseInt(e.target.value)})}/></div>
                  </div>
                </div>
                <hr style={{ border:0, borderTop:`1px solid ${br}` }}/>
                <input required style={{ height:50, borderRadius:12, background: dark ? "rgba(255,255,255,0.04)" : "#F9F5EC", border:`1px solid ${br}`, color:tm, padding:"0 16px", fontSize:14, outline:"none" }} placeholder="Nombre del Dueno" value={form.propietario_nombre} onChange={e => setForm({...form, propietario_nombre:e.target.value})}/>
                <input required type="email" style={{ height:50, borderRadius:12, background: dark ? "rgba(255,255,255,0.04)" : "#F9F5EC", border:`1px solid ${br}`, color:tm, padding:"0 16px", fontSize:14, outline:"none" }} placeholder="Email de acceso" value={form.propietario_email} onChange={e => setForm({...form, propietario_email:e.target.value})}/>
                <div style={{ position:"relative" }}>
                  <input required type={showPwd?"text":"password"} style={{ width:"100%", height:50, borderRadius:12, background: dark ? "rgba(255,255,255,0.04)" : "#F9F5EC", border:`1px solid ${br}`, color:tm, padding:"0 48px 0 16px", fontSize:14, outline:"none" }} placeholder="Contrasena segura" value={form.propietario_password} onChange={e => setForm({...form, propietario_password:e.target.value})}/>
                  <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:tg, display:"flex" }}>{showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                </div>
                <motion.button disabled={loading} type="submit" whileHover={{ background:PD }} whileTap={{ scale:0.98 }}
                  style={{ height:54, borderRadius:14, marginTop:6, width:"100%", background:P, color:"#fff", border:"none", fontSize:16, fontWeight:700, cursor: loading?"wait":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, opacity: loading?0.7:1 }}>
                  {loading ? <Loader2 className="spin-icon" size={20}/> : <><CreditCard size={18}/> Pagar S/{PRECIO} y Crear Restaurante</>}
                </motion.button>
                <p style={{ textAlign:"center", fontSize:12, color:tg, margin:"4px 0 0" }}>Seras redirigido a Mercado Pago de forma segura</p>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ RESPONSIVE CSS ══ */}
      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .nav-mobile { display: none !important; }
          .nav-desktop { display: flex !important; }
        }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}

