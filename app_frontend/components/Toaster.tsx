"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, X, AlertCircle } from "lucide-react";
import { type Toast, useToastAutoDismiss, useToastStore } from "@/lib/toast";

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
} as const;

const ACCENTS = {
  success: { color: "var(--success)", label: "Éxito" },
  error: { color: "var(--error)", label: "Error" },
  info: { color: "var(--tertiary)", label: "Info" },
  warning: { color: "var(--secondary)", label: "Atención" },
} as const;

function ToastCard({ toast }: { toast: Toast }) {
  useToastAutoDismiss(toast);
  const reduce = useReducedMotion();
  const dismiss = useToastStore((s) => s.dismiss);
  const Icon = ICONS[toast.type];
  const accent = ACCENTS[toast.type];

  return (
    <motion.div
      layout
      initial={
        reduce
          ? { opacity: 0 }
          : { opacity: 0, x: 24, scale: 0.96, y: -4 }
      }
      animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
      exit={
        reduce
          ? { opacity: 0 }
          : { opacity: 0, x: 24, scale: 0.95, transition: { duration: 0.18 } }
      }
      transition={
        reduce
          ? { duration: 0 }
          : { type: "spring", stiffness: 380, damping: 30, mass: 0.85 }
      }
      className="toast-card"
      style={{ "--toast-accent": accent.color } as React.CSSProperties}
      role={toast.type === "error" ? "alert" : "status"}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
    >
      <span
        className="toast-icon"
        style={{ color: accent.color }}
        aria-hidden="true"
      >
        <Icon size={16} />
      </span>
      <div className="toast-body">
        <p className="toast-message">{toast.message}</p>
        {toast.description && (
          <p className="toast-description">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        className="toast-close"
        aria-label="Cerrar notificación"
      >
        <X size={13} />
      </button>
      <motion.span
        aria-hidden="true"
        className="toast-progress"
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{
          duration: reduce ? 0 : toast.duration / 1000,
          ease: "linear",
        }}
        style={{ background: accent.color }}
      />
    </motion.div>
  );
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="toaster" aria-live="polite" aria-atomic="false">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
