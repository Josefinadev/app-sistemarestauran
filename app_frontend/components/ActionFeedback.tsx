"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Trash2, AlertTriangle } from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   SuccessOverlay — Animated feedback overlay for actions
   Shows a centered animated checkmark/icon for 1.5s
   ═══════════════════════════════════════════════════════════ */

export type OverlayType = "success" | "delete" | "warning";

let _setOverlay: ((v: { type: OverlayType; message?: string } | null) => void) | null = null;

export function showActionOverlay(type: OverlayType = "success", message?: string) {
  _setOverlay?.({ type, message });
}

export function SuccessOverlay() {
  const [overlay, setOverlay] = useState<{ type: OverlayType; message?: string } | null>(null);

  useEffect(() => {
    _setOverlay = setOverlay;
    return () => { _setOverlay = null; };
  }, []);

  useEffect(() => {
    if (!overlay) return;
    const t = setTimeout(() => setOverlay(null), 1600);
    return () => clearTimeout(t);
  }, [overlay]);

  const colors = {
    success: { bg: "rgba(22,163,74,0.08)", ring: "#16a34a", icon: "#16a34a" },
    delete:  { bg: "rgba(226,114,91,0.08)", ring: "#E2725B", icon: "#E2725B" },
    warning: { bg: "rgba(217,119,6,0.08)",  ring: "#D97706", icon: "#D97706" },
  };

  const icons = {
    success: <Check size={44} strokeWidth={3} color={overlay ? colors[overlay.type].icon : "#16a34a"} />,
    delete:  <Trash2 size={38} strokeWidth={2.5} color="#E2725B" />,
    warning: <AlertTriangle size={38} strokeWidth={2.5} color="#D97706" />,
  };

  return (
    <AnimatePresence>
      {overlay && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed", inset: 0, zIndex: 99999,
            display: "flex", alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
              padding: "32px 40px", borderRadius: 24,
              background: "var(--bg-elevated, #FFFFFF)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.06)",
              border: `1.5px solid ${colors[overlay.type].ring}30`,
              minWidth: 180,
            }}
          >
            {/* Animated ring */}
            <div style={{ position: "relative" }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: colors[overlay.type].bg,
                  border: `2.5px solid ${colors[overlay.type].ring}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.12, type: "spring", stiffness: 500, damping: 22 }}
                >
                  {icons[overlay.type]}
                </motion.div>
              </motion.div>
              {/* Pulse ring */}
              <motion.div
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  border: `2px solid ${colors[overlay.type].ring}`,
                }}
              />
            </div>
            {overlay.message && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={{
                  fontSize: 14, fontWeight: 600,
                  color: "var(--text, #1A1410)",
                  margin: 0, textAlign: "center",
                  maxWidth: 200, lineHeight: 1.4,
                }}
              >
                {overlay.message}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════
   ConfirmDeleteModal — Premium confirmation dialog
   ═══════════════════════════════════════════════════════════ */

type ConfirmDeleteProps = {
  open: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  type?: "danger" | "warning";
};

export function ConfirmDeleteModal({
  open, title = "¿Confirmar eliminación?", message,
  onConfirm, onCancel, confirmLabel = "Eliminar", type = "danger",
}: ConfirmDeleteProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  const dangerColor = type === "danger" ? "#E2725B" : "#D97706";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onCancel}
          style={{
            position: "fixed", inset: 0, zIndex: 9998,
            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-elevated, #FFFFFF)",
              borderRadius: 20, padding: "32px 36px",
              width: "100%", maxWidth: 400,
              boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
              border: "1px solid var(--border, #E8DFD0)",
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 16, textAlign: "center",
            }}
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.08, type: "spring", stiffness: 400, damping: 20 }}
              style={{
                width: 64, height: 64, borderRadius: "50%",
                background: `${dangerColor}14`,
                border: `2px solid ${dangerColor}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {type === "danger"
                ? <Trash2 size={28} color={dangerColor} />
                : <AlertTriangle size={28} color={dangerColor} />}
            </motion.div>

            <div>
              <h3 style={{
                fontSize: 18, fontWeight: 800, color: "var(--text, #1A1410)",
                margin: "0 0 8px", letterSpacing: "-0.01em",
              }}>
                {title}
              </h3>
              <p style={{
                fontSize: 14, color: "var(--text-muted, #6B6257)",
                margin: 0, lineHeight: 1.55,
              }}>
                {message}
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 4 }}>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={onCancel}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12,
                  border: "1.5px solid var(--border, #E8DFD0)",
                  background: "transparent",
                  color: "var(--text-muted, #6B6257)",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, filter: "brightness(1.1)" }}
                whileTap={{ scale: 0.96 }}
                onClick={onConfirm}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12,
                  border: "none", background: dangerColor,
                  color: "#fff", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
