"use client";

import {
  type ReactNode,
  type MouseEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

type ModalSize = "sm" | "md" | "lg" | "xl";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  accentColor?: string;
  size?: ModalSize;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  /** Disable default padding (useful when child provides its own). */
  noPadding?: boolean;
};

const SIZE_MAP: Record<ModalSize, string> = {
  sm: "var(--modal-sm, 400px)",
  md: "var(--modal-md, 520px)",
  lg: "var(--modal-lg, 640px)",
  xl: "var(--modal-xl, 780px)",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  accentColor = "var(--primary)",
  size = "md",
  closeOnBackdrop = true,
  closeOnEsc = true,
  children,
  footer,
  noPadding = false,
}: ModalProps) {
  const reduce = useReducedMotion();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeOnEsc, onClose]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => dialogRef.current?.focus(), 60);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
    };
  }, [open]);

  const handleBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (!closeOnBackdrop) return;
    if (e.target === e.currentTarget) onClose();
  };

  const spring = reduce
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 320, damping: 28, mass: 0.9 };

  const dialog = (
    <AnimatePresence>
      {open && (
        <div
          className="premium-modal-root"
          onMouseDown={handleBackdrop}
          role="presentation"
        >
          <motion.div
            className="premium-modal-backdrop"
            initial={reduce ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2, ease: "easeOut" }}
            aria-hidden="true"
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="premium-modal-dialog"
            style={
              {
                "--modal-max-width": SIZE_MAP[size],
                "--modal-accent": accentColor,
              } as React.CSSProperties
            }
            initial={
              reduce
                ? { opacity: 1, scale: 1, y: 0 }
                : { opacity: 0, scale: 0.94, y: 12 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 8 }
            }
            transition={spring}
          >
            <div className="premium-modal-glow" aria-hidden="true" />
            <header className="premium-modal-header">
              <div className="premium-modal-title-group">
                {icon && (
                  <span
                    className="premium-modal-icon"
                    style={{ color: accentColor }}
                    aria-hidden="true"
                  >
                    {icon}
                  </span>
                )}
                <div className="premium-modal-title-text">
                  <h3 id={titleId} className="premium-modal-title">
                    {title}
                  </h3>
                  {description && (
                    <p className="premium-modal-description">{description}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="premium-modal-close"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </header>
            <div
              className={
                noPadding
                  ? "premium-modal-body premium-modal-body--flush"
                  : "premium-modal-body"
              }
            >
              {children}
            </div>
            {footer && <footer className="premium-modal-footer">{footer}</footer>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(dialog, document.body);
}

type ModalFooterProps = {
  children: ReactNode;
};

export function ModalFooter({ children }: ModalFooterProps) {
  return <div className="premium-modal-footer-inner">{children}</div>;
}
