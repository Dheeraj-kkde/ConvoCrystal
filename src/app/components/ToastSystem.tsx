/**
 * Re-exports the useToast hook from the store, plus renders the
 * toast UI (ToastContainer). Kept for backward-compatible imports.
 */
import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { useTheme } from "../stores/themeStore";
import { useToastStore } from "../stores/toastStore";
import type { Toast, ToastVariant } from "../stores/toastStore";

// Re-export hook so existing `import { useToast } from "./ToastSystem"` works
export { useToast, useToastStore } from "../stores/toastStore";
export type { Toast, ToastVariant } from "../stores/toastStore";

// ─── UI Components ───────────────────────────────────────────────

const variantConfig: Record<ToastVariant, { icon: typeof CheckCircle2; color: string }> = {
  success: { icon: CheckCircle2, color: "#10B981" },
  warning: { icon: AlertTriangle, color: "#F59E0B" },
  error: { icon: XCircle, color: "#F43F5E" },
  info: { icon: Info, color: "#5C6CF5" },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const config = variantConfig[toast.variant];
  const Icon = config.icon;
  const [exiting, setExiting] = useState(false);
  const { isDark, colors } = useTheme();

  const bg = isDark ? colors.bgPanel : "#FFFFFF";
  const borderColor = isDark ? colors.border : "#E2E0DB";
  const titleColor = isDark ? colors.textPrimary : "#1A1916";
  const messageColor = isDark ? colors.textSecondary : "#57554F";
  const closeColor = isDark ? colors.textMuted : "#928F87";

  useEffect(() => {
    const dur = toast.duration || 5000;
    const exitTimer = setTimeout(() => setExiting(true), dur - 300);
    const removeTimer = setTimeout(() => onRemove(toast.id), dur);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className={`w-80 rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ${
        exiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"
      }`}
      style={{
        background: bg,
        border: `1px solid ${borderColor}`,
        borderLeft: `3px solid ${config.color}`,
        animation: exiting ? undefined : "slideInRight 0.3s ease-out",
      }}
    >
      <div className="flex items-start gap-3 p-3">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: `${config.color}10` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px]" style={{ fontWeight: 600, color: titleColor }}>{toast.title}</div>
          {toast.message && (
            <div className="text-[11px] mt-0.5 leading-relaxed" style={{ color: messageColor }}>{toast.message}</div>
          )}
          {toast.cta && (
            <button
              onClick={toast.cta.onClick}
              className="text-[10px] mt-1.5 hover:underline transition-colors"
              style={{ color: config.color }}
            >
              {toast.cta.label}
            </button>
          )}
        </div>
        <button
          onClick={() => { setExiting(true); setTimeout(() => onRemove(toast.id), 300); }}
          className="p-0.5 rounded hover:bg-white/5 transition-colors shrink-0"
        >
          <X className="w-3 h-3" style={{ color: closeColor }} />
        </button>
      </div>
    </div>
  );
}

/**
 * Renders the toast stack. Drop this anywhere in your tree — no provider wrapping needed.
 */
export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  const handleRemove = useCallback((id: string) => {
    removeToast(id);
  }, [removeToast]);

  return (
    <div className="fixed top-14 right-4 z-[9999] flex flex-col gap-2 pointer-events-auto">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={handleRemove} />
      ))}
    </div>
  );
}
