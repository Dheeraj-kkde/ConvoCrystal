import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

// ─── Types ───────────────────────────────────────────────────────

export type ToastVariant = "success" | "warning" | "error" | "info";

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  cta?: { label: string; onClick: () => void };
  duration?: number;
}

// ─── Store ───────────────────────────────────────────────────────

export interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

/**
 * Transient store — toasts are ephemeral so no persist middleware.
 */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    set((state) => ({ toasts: [...state.toasts.slice(-2), { ...toast, id }] }));
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

// ─── Convenience Hook ────────────────────────────────────────────

/**
 * Drop-in replacement for the old Context-based useToast().
 * Returns { addToast, removeToast }.
 */
export function useToast() {
  return useToastStore(
    useShallow((s) => ({ addToast: s.addToast, removeToast: s.removeToast }))
  );
}
