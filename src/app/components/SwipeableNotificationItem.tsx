/**
 * A mobile notification row with swipe-to-dismiss.
 * Swipe left to reveal a red "dismiss" zone, release to dismiss.
 * Uses raw touch events for smooth, predictable gesture handling.
 */
import { useRef, useState, useCallback } from "react";
import { motion } from "motion/react";
import {
  Trash2,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  FileText,
  XCircle,
  Upload,
  Download,
  MessageSquare,
  Zap,
} from "lucide-react";
import { useTheme } from "./ThemeContext";
import { formatRelativeTime } from "../lib/useRelativeTime";
import type { Notification, NotificationIconType } from "../stores/notificationStore";

// ─── Icon mapping ────────────────────────────────────────────────

const ICON_MAP: Record<NotificationIconType, typeof CheckCircle2> = {
  "check-circle": CheckCircle2,
  "sparkles": Sparkles,
  "alert-triangle": AlertTriangle,
  "file-text": FileText,
  "x-circle": XCircle,
  "upload": Upload,
  "download": Download,
  "message-square": MessageSquare,
  "zap": Zap,
};

export { ICON_MAP };

// ─── Thresholds ──────────────────────────────────────────────────

const DISMISS_THRESHOLD = -80; // px — past this, release triggers dismiss
const ELASTIC_FACTOR = 0.35; // past threshold, slow down to give "rubber band" feel

// ─── Component ───────────────────────────────────────────────────

interface SwipeableNotificationItemProps {
  notification: Notification;
  onTap: (n: Notification) => void;
  onDismiss: (id: string) => void;
  onMarkRead?: (id: string) => void;
}

export function SwipeableNotificationItem({
  notification,
  onTap,
  onDismiss,
  onMarkRead,
}: SwipeableNotificationItemProps) {
  const { colors } = useTheme();
  const Icon = ICON_MAP[notification.iconType] || CheckCircle2;

  const [offsetX, setOffsetX] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const touchRef = useRef<{
    startX: number;
    startY: number;
    startTime: number;
    moved: boolean;
    locked: boolean; // true once we decide horizontal vs vertical
    isHorizontal: boolean;
  } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (transitioning) return;
    const touch = e.touches[0];
    touchRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      moved: false,
      locked: false,
      isHorizontal: false,
    };
  }, [transitioning]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const ref = touchRef.current;
    if (!ref || transitioning) return;

    const touch = e.touches[0];
    const dx = touch.clientX - ref.startX;
    const dy = touch.clientY - ref.startY;

    // Lock direction after 10px of movement
    if (!ref.locked && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      ref.locked = true;
      ref.isHorizontal = Math.abs(dx) > Math.abs(dy);
    }

    if (!ref.locked || !ref.isHorizontal) return;

    ref.moved = true;
    // Only allow left swipe (negative dx)
    const clampedDx = Math.min(0, dx);

    // Apply elastic effect past threshold
    let finalX: number;
    if (clampedDx < DISMISS_THRESHOLD) {
      const over = clampedDx - DISMISS_THRESHOLD;
      finalX = DISMISS_THRESHOLD + over * ELASTIC_FACTOR;
    } else {
      finalX = clampedDx;
    }

    setOffsetX(finalX);
  }, [transitioning]);

  const handleTouchEnd = useCallback(() => {
    const ref = touchRef.current;
    if (!ref || transitioning) return;

    const wasTap = !ref.moved && (Date.now() - ref.startTime) < 300;

    if (wasTap) {
      touchRef.current = null;
      if (notification.unread && onMarkRead) {
        onMarkRead(notification.id);
      }
      onTap(notification);
      return;
    }

    if (offsetX <= DISMISS_THRESHOLD) {
      // Animate off-screen then dismiss
      setTransitioning(true);
      setOffsetX(-window.innerWidth);
      setTimeout(() => {
        setDismissed(true);
        onDismiss(notification.id);
      }, 250);
    } else {
      // Snap back
      setTransitioning(true);
      setOffsetX(0);
      setTimeout(() => setTransitioning(false), 200);
    }

    touchRef.current = null;
  }, [offsetX, transitioning, notification, onTap, onDismiss, onMarkRead]);

  if (dismissed) return null;

  const progress = Math.min(1, Math.abs(offsetX) / Math.abs(DISMISS_THRESHOLD));
  const bgOpacity = progress * 0.25;

  return (
    <div className="relative overflow-hidden" style={{ borderBottom: `1px solid ${colors.border}` }}>
      {/* Background dismiss zone — visible when swiped */}
      <div
        className="absolute inset-0 flex items-center justify-end pr-6"
        style={{ backgroundColor: `rgba(244, 63, 94, ${bgOpacity})` }}
      >
        <motion.div
          animate={{ scale: progress > 0.5 ? 1 : 0.6, opacity: progress > 0.3 ? 1 : 0.4 }}
          transition={{ duration: 0.15 }}
        >
          <Trash2 className="w-5 h-5" style={{ color: "#F43F5E" }} />
        </motion.div>
      </div>

      {/* Foreground — swipeable notification content */}
      <div
        className="relative flex items-start gap-3 px-4 py-3.5 text-left"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: transitioning ? "transform 0.25s ease-out" : "none",
          backgroundColor: notification.unread ? `${colors.crystal}05` : colors.bgBase,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: `${notification.color}15` }}
        >
          <Icon className="w-4 h-4" style={{ color: notification.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-[13px] truncate"
              style={{ fontWeight: 600, color: colors.textPrimary }}
            >
              {notification.title}
            </span>
            {notification.unread && (
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: colors.crystal }}
              />
            )}
          </div>
          <p className="text-[12px] mt-1 line-clamp-2" style={{ color: colors.textMuted }}>
            {notification.body}
          </p>
          <span
            className="text-[10px] font-mono mt-1.5 block"
            style={{ color: colors.textMuted, opacity: 0.7 }}
          >
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}