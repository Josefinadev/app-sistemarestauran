"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

/**
 * CursorGlow — Soft premium flashlight that follows the cursor.
 *
 * Uses `mix-blend-mode: screen` to brighten the area underneath rather
 * than dimming the rest of the page. Disabled on touch devices, in
 * reduced-motion mode, and when the cursor leaves the window.
 */
export function CursorGlow() {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);

  // Snappy spring: the glow lags a tiny bit behind the cursor for a
  // cinematic "trailing light" feel. Damping is high so it settles
  // quickly (no jitter when stopping).
  const sx = useSpring(x, { stiffness: 220, damping: 26, mass: 0.55 });
  const sy = useSpring(y, { stiffness: 220, damping: 26, mass: 0.55 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Skip on touch devices / coarse pointers — there is no cursor.
    const isCoarse = window.matchMedia?.("(pointer: coarse)")?.matches;
    if (isCoarse) return;
    if (reduce) return;
    setEnabled(true);

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        x.set(e.clientX);
        y.set(e.clientY);
        if (!visible) setVisible(true);
      });
    };
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="cursor-glow"
      style={{
        x: sx,
        y: sy,
        translateX: "-50%",
        translateY: "-50%",
        opacity: visible ? 1 : 0,
      }}
      transition={{ opacity: { duration: 0.25, ease: "easeOut" } }}
    />
  );
}
