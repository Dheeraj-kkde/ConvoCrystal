/**
 * Live-updating relative time formatting.
 *
 * - `formatRelativeTime(ts)` — pure function that returns e.g. "Just now", "3 min ago", "2 hrs ago"
 * - `useRelativeTimeTick()` — hook that forces a re-render on a cadence that matches
 *   the granularity of the timestamps being displayed (every 15s for the first minute,
 *   every 30s up to an hour, every 60s after that). Call once per list/container, not per item.
 */
import { useState, useEffect, useRef } from "react";

// ─── Formatter ───────────────────────────────────────────────────

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelativeTime(createdAt: number): string {
  const diff = Date.now() - createdAt;

  if (diff < 0) return "Just now"; // clock skew guard

  if (diff < 30 * SECOND) return "Just now";
  if (diff < MINUTE) return `${Math.floor(diff / SECOND)}s ago`;
  if (diff < HOUR) {
    const mins = Math.floor(diff / MINUTE);
    return mins === 1 ? "1 min ago" : `${mins} min ago`;
  }
  if (diff < DAY) {
    const hrs = Math.floor(diff / HOUR);
    return hrs === 1 ? "1 hr ago" : `${hrs} hrs ago`;
  }
  if (diff < 7 * DAY) {
    const days = Math.floor(diff / DAY);
    return days === 1 ? "Yesterday" : `${days} days ago`;
  }

  // Fallback: short date
  const d = new Date(createdAt);
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  return `${month} ${day}`;
}

// ─── Tick hook ───────────────────────────────────────────────────

/**
 * Forces a re-render at a sensible cadence so that `formatRelativeTime`
 * values stay fresh. Call once per container that renders a list of
 * timestamps — each item just calls `formatRelativeTime(ts)` during render.
 *
 * The tick interval adapts based on the freshest timestamp provided:
 *   - Any item < 1 min old  → tick every 15s
 *   - Any item < 1 hr old   → tick every 30s
 *   - Otherwise              → tick every 60s
 *
 * @param newestCreatedAt The `createdAt` of the most recent item in the list.
 *   Pass `undefined` or `0` if the list is empty (disables ticking).
 */
export function useRelativeTimeTick(newestCreatedAt: number | undefined): void {
  const [, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!newestCreatedAt) return;

    const pickInterval = () => {
      const age = Date.now() - newestCreatedAt;
      if (age < MINUTE) return 15_000; // 15s
      if (age < HOUR) return 30_000; // 30s
      return 60_000; // 60s
    };

    // Clear any previous interval
    if (intervalRef.current) clearInterval(intervalRef.current);

    const ms = pickInterval();
    intervalRef.current = setInterval(() => {
      setTick((t) => t + 1);
    }, ms);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [newestCreatedAt]);
}
