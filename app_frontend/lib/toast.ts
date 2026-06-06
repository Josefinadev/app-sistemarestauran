"use client";

import { create } from "zustand";
import { useEffect } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration: number;
};

type ToastStore = {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id" | "duration"> & { duration?: number }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

let counter = 0;
const nextId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `t-${Date.now()}-${++counter}`;

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  push: (input) => {
    const id = nextId();
    const toast: Toast = {
      id,
      type: input.type,
      message: input.message,
      description: input.description,
      duration: input.duration ?? 4000,
    };
    set((s) => ({ toasts: [...s.toasts, toast] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

type ToastInput =
  | string
  | { message: string; description?: string; duration?: number };

function emit(type: ToastType) {
  return (input: ToastInput) => {
    const opts = typeof input === "string" ? { message: input } : input;
    return useToastStore.getState().push({ type, ...opts });
  };
}

export const toast = {
  success: emit("success"),
  error: emit("error"),
  info: emit("info"),
  warning: emit("warning"),
};

/** Auto-dismiss a toast after its `duration`. */
export function useToastAutoDismiss(toast: Toast) {
  const dismiss = useToastStore((s) => s.dismiss);
  useEffect(() => {
    if (toast.duration <= 0) return;
    const t = window.setTimeout(() => dismiss(toast.id), toast.duration);
    return () => window.clearTimeout(t);
  }, [toast.id, toast.duration, dismiss]);
}
