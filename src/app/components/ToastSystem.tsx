import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

type ToastVariant = "success" | "warning" | "error" | "info";

interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  cta?: { label: string; onClick: () => void };
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  addToast: () => {},
  removeToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const variantConfig: Record<ToastVariant, { icon: typeof CheckCircle2; color: string; borderColor: string; bgTint: string }> = {
  success: { icon: CheckCircle2, color: "#10B981", borderColor: "#10B981", bgTint: "rgba(16,185,129,0.08)" },
  warning: { icon: AlertTriangle, color: "#F59E0B", borderColor: "#F59E0B", bgTint: "rgba(245,158,11,0.08)" },
  error: { icon: XCircle, color: "#F43F5E", borderColor: "#F43F5E", bgTint: "rgba(244,63,94,0.08)" },
  info: { icon: Info, color: "#6366F1", borderColor: "#6366F1", bgTint: "rgba(99,102,241,0.08)" },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const config = variantConfig[toast.variant];
  const Icon = config.icon;
  const [exiting, setExiting] = useState(false);

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
      className={`w-80 rounded-lg border border-[#2A2D42] shadow-2xl overflow-hidden transition-all duration-300 ${
        exiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"
      }`}
      style={{
        background: "#1A1D2E",
        borderLeft: `3px solid ${config.borderColor}`,
        animation: exiting ? undefined : "slideInRight 0.3s ease-out",
      }}
    >
      <div className="flex items-start gap-3 p-3">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: config.bgTint }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] text-[#E8EAF6]" style={{ fontWeight: 600 }}>{toast.title}</div>
          {toast.message && (
            <div className="text-[11px] text-[#9BA3C8] mt-0.5 leading-relaxed">{toast.message}</div>
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
          <X className="w-3 h-3 text-[#5C6490]" />
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-14 right-4 z-[9999] flex flex-col gap-2 pointer-events-auto">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
