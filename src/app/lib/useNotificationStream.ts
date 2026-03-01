/**
 * Notification stream adapter — dual-mode (WebSocket or client-side simulation).
 *
 * When VITE_WS_URL is set, connects via useWebSocket for real server-pushed
 * notification events. Otherwise, simulates periodic push notifications
 * client-side for demo/prototype use.
 *
 * Automatically adds incoming notifications to the store and fires toasts.
 */
import { useEffect, useRef, useCallback } from "react";
import { useWebSocket } from "./useWebSocket";
import {
  useNotificationStore,
  type Notification,
  type NotificationIconType,
  type NotificationVariant,
} from "../stores/notificationStore";
import { useToastStore } from "../stores/toastStore";

// ─── Types ───────────────────────────────────────────────────────

interface WSNotificationMessage {
  type: "notification";
  iconType: NotificationIconType;
  color: string;
  title: string;
  body: string;
  unread: boolean;
  toastVariant: NotificationVariant;
}

// ─── Simulated notification pool ─────────────────────────────────

const SIMULATED_POOL: Omit<Notification, "id" | "createdAt" | "dismissed">[] = [
  {
    iconType: "check-circle",
    color: "#10B981",
    title: "Transcript ready",
    body: "Design Critique v2.3 has finished processing with 91% confidence.",
    unread: true,
    toastVariant: "success",
  },
  {
    iconType: "sparkles",
    color: "#5C6CF5",
    title: "New insight detected",
    body: "AI found 3 recurring themes across your last 5 transcripts.",
    unread: true,
    toastVariant: "info",
  },
  {
    iconType: "alert-triangle",
    color: "#F59E0B",
    title: "Storage approaching limit",
    body: "You've used 82% of your workspace storage. Consider archiving old files.",
    unread: true,
    toastVariant: "warning",
  },
  {
    iconType: "message-square",
    color: "#5C6CF5",
    title: "Collaboration update",
    body: "Alex Rivera commented on the Q4 Strategy Review analysis.",
    unread: true,
    toastVariant: "info",
  },
  {
    iconType: "zap",
    color: "#10B981",
    title: "Batch processing complete",
    body: "All 3 queued transcripts have been analyzed successfully.",
    unread: true,
    toastVariant: "success",
  },
  {
    iconType: "download",
    color: "#00C9D6",
    title: "Export ready",
    body: "Your PDF export of Board Meeting — Feb is ready for download.",
    unread: true,
    toastVariant: "success",
  },
  {
    iconType: "x-circle",
    color: "#F43F5E",
    title: "Processing error",
    body: "Audio quality too low for All-Hands — January. Try a cleaner recording.",
    unread: true,
    toastVariant: "error",
  },
];

// ─── Hook ────────────────────────────────────────────────────────

const HAS_WS = !!import.meta.env.VITE_WS_URL;

/**
 * Hook that manages the notification stream.
 * Call once at a layout level (e.g., MainLayout).
 *
 * @param enabled - Whether to enable the simulated stream (default: true)
 * @param intervalMs - Average ms between simulated notifications (default: 45000)
 */
export function useNotificationStream({
  enabled = true,
  intervalMs = 45_000,
}: { enabled?: boolean; intervalMs?: number } = {}) {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const addToast = useToastStore((s) => s.addToast);
  const simIndexRef = useRef(0);

  // ─── Real WS handler ────────────────────────────────────────────
  const handleWSMessage = useCallback(
    (msg: WSNotificationMessage) => {
      if (msg.type !== "notification") return;
      addNotification({
        iconType: msg.iconType,
        color: msg.color,
        title: msg.title,
        body: msg.body,
        unread: msg.unread,
        toastVariant: msg.toastVariant,
      });
      addToast({
        variant: msg.toastVariant,
        title: msg.title,
        message: msg.body,
      });
    },
    [addNotification, addToast]
  );

  useWebSocket<WSNotificationMessage>({
    url: HAS_WS ? "/ws/notifications" : null,
    onMessage: handleWSMessage,
    autoConnect: HAS_WS,
  });

  // ─── Simulated periodic push (no-op when WS is live) ───────────
  useEffect(() => {
    if (HAS_WS || !enabled) return;

    // Push one simulated notification periodically
    const schedule = () => {
      const jitter = intervalMs * 0.4 * (Math.random() - 0.5);
      return intervalMs + jitter;
    };

    let timeoutId: ReturnType<typeof setTimeout>;

    const pushOne = () => {
      const pool = SIMULATED_POOL;
      const item = pool[simIndexRef.current % pool.length];
      simIndexRef.current++;

      addNotification(item);
      addToast({
        variant: item.toastVariant,
        title: item.title,
        message: item.body,
      });

      timeoutId = setTimeout(pushOne, schedule());
    };

    // First push after initial delay
    timeoutId = setTimeout(pushOne, schedule());

    return () => clearTimeout(timeoutId);
  }, [enabled, intervalMs, addNotification, addToast]);

  return { isSimulated: !HAS_WS };
}