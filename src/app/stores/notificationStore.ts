import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMemo, useEffect } from "react";

// ─── Types ───────────────────────────────────────────────────────

export type NotificationVariant = "success" | "warning" | "error" | "info";

export type NotificationIconType =
  | "check-circle"
  | "sparkles"
  | "alert-triangle"
  | "file-text"
  | "x-circle"
  | "upload"
  | "download"
  | "message-square"
  | "zap";

export interface Notification {
  id: string;
  iconType: NotificationIconType;
  color: string;
  title: string;
  body: string;
  unread: boolean;
  toastVariant: NotificationVariant;
  /** Unix ms timestamp — used for sorting & relative time display */
  createdAt: number;
  /** Set to true when user swipe-dismisses */
  dismissed: boolean;
}

// ─── Constants ────────────────────────────────────────────────────

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_NOTIFICATIONS = 50;

// ─── Seed data (initial notifications that ship with the demo) ───

const now = Date.now();

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: "seed-1",
    iconType: "check-circle",
    color: "#10B981",
    title: "Processing complete",
    body: "Q3 Earnings Call transcript has been analyzed with 94% confidence.",
    unread: true,
    toastVariant: "success",
    createdAt: now - 2 * 60_000,
    dismissed: false,
  },
  {
    id: "seed-2",
    iconType: "sparkles",
    color: "#5C6CF5",
    title: "AI summary ready",
    body: "Your requested summary for Product Sync Notes is ready to review.",
    unread: true,
    toastVariant: "info",
    createdAt: now - 15 * 60_000,
    dismissed: false,
  },
  {
    id: "seed-3",
    iconType: "alert-triangle",
    color: "#F59E0B",
    title: "Low confidence detected",
    body: "Client Onboarding transcript scored 62%. Consider re-uploading.",
    unread: false,
    toastVariant: "warning",
    createdAt: now - 60 * 60_000,
    dismissed: false,
  },
  {
    id: "seed-4",
    iconType: "file-text",
    color: "#00C9D6",
    title: "Export completed",
    body: "DOCX export of Design Review has been downloaded.",
    unread: false,
    toastVariant: "success",
    createdAt: now - 3 * 60 * 60_000,
    dismissed: false,
  },
  {
    id: "seed-5",
    iconType: "x-circle",
    color: "#F43F5E",
    title: "Upload failed",
    body: "team-standup.mp3 exceeded the 200MB file size limit.",
    unread: false,
    toastVariant: "error",
    createdAt: now - 5 * 60 * 60_000,
    dismissed: false,
  },
];

// ─── Store ───────────────────────────────────────────────────────

export interface NotificationState {
  notifications: Notification[];
  addNotification: (n: Omit<Notification, "id" | "createdAt" | "dismissed">) => Notification;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
  /** Drop notifications older than MAX_AGE_MS */
  pruneOld: () => void;
  /** Number of unread, non-dismissed notifications */
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: SEED_NOTIFICATIONS,

      addNotification: (n) => {
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
        const notification: Notification = {
          ...n,
          id,
          createdAt: Date.now(),
          dismissed: false,
        };
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
        }));
        return notification;
      },

      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, unread: false } : n
          ),
        })),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, unread: false })),
        })),

      dismiss: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, dismissed: true } : n
          ),
        })),

      clearAll: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, dismissed: true })),
        })),

      pruneOld: () =>
        set((state) => ({
          notifications: state.notifications.filter(
            (n) => Date.now() - n.createdAt < MAX_AGE_MS
          ),
        })),

      unreadCount: () => {
        const { notifications } = get();
        return notifications.filter((n) => n.unread && !n.dismissed).length;
      },
    }),
    {
      name: "cc-notifications",
      version: 2,
      // Only persist the notifications array
      partialize: (state) => ({ notifications: state.notifications }),
      merge: (persisted, current) => {
        const p = persisted as Partial<NotificationState> | undefined;
        if (!p || !Array.isArray(p.notifications)) return current;

        const cutoff = Date.now() - MAX_AGE_MS;

        // Sanitize each persisted notification:
        //  - strip the defunct `time: string` field from v1 data
        //  - back-fill `createdAt` if missing (estimate from index position)
        //  - back-fill `dismissed` if missing
        //  - drop notifications older than MAX_AGE_MS (7 days)
        const cleaned: Notification[] = p.notifications
          .map((raw: Record<string, unknown>, idx: number) => {
            // Destructure known legacy keys so they don't leak through spread
            const { time: _legacyTime, ...rest } = raw;

            return {
              ...rest,
              createdAt:
                typeof rest.createdAt === "number"
                  ? rest.createdAt
                  : Date.now() - idx * 60_000, // rough fallback: 1 min per item
              dismissed:
                typeof rest.dismissed === "boolean" ? rest.dismissed : false,
            } as Notification;
          })
          .filter((n) => n.createdAt >= cutoff);

        return {
          ...current,
          notifications: cleaned,
        };
      },
      // Handle version bumps: wipe stale storage when schema changes drastically
      migrate: (persisted: unknown, version: number) => {
        if (version < 2) {
          // v0/v1 → v2: the merge function handles field-level cleanup,
          // so we just pass the data through and let merge sanitize it.
          return persisted;
        }
        return persisted;
      },
    }
  )
);

// ─── Convenience Hooks ───────────────────────────────────────────

/** Returns visible (non-dismissed) notifications sorted by createdAt descending */
export function useNotifications() {
  const notifications = useNotificationStore((s) => s.notifications);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const dismiss = useNotificationStore((s) => s.dismiss);
  const clearAll = useNotificationStore((s) => s.clearAll);

  const visible = useMemo(
    () => notifications.filter((n: Notification) => !n.dismissed),
    [notifications]
  );
  const unreadCount = useMemo(
    () => notifications.filter((n: Notification) => n.unread && !n.dismissed).length,
    [notifications]
  );

  return {
    notifications: visible,
    addNotification,
    markRead,
    markAllRead,
    dismiss,
    clearAll,
    unreadCount,
  };
}

// ─── Periodic Pruner ─────────────────────────────────────────────

const PRUNE_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Mount once (e.g. in MainLayout) to run `pruneOld()` on startup
 * and then every hour. Silently removes notifications older than 7 days
 * so localStorage doesn't grow unbounded.
 */
export function useNotificationPruner(): void {
  const pruneOld = useNotificationStore((s) => s.pruneOld);

  useEffect(() => {
    // Prune immediately on mount (covers long-sleeping tabs / cold starts)
    pruneOld();

    const id = setInterval(pruneOld, PRUNE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [pruneOld]);
}