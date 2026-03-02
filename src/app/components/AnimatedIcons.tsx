/**
 * Crystal Design System — Animated Icon & Motion Primitives
 *
 * Reusable Motion wrappers for icons, containers, and transitions.
 * Uses motion tokens from theme.css for consistent timing.
 */
import { type ReactNode, type ComponentType } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";

// ─── Motion Presets ──────────────────────────────────────────────

export const springPreset = { type: "spring" as const, stiffness: 400, damping: 25 };
export const gentleSpring = { type: "spring" as const, stiffness: 200, damping: 20 };
export const snappySpring = { type: "spring" as const, stiffness: 500, damping: 30 };

// ─── Stagger Container ──────────────────────────────────────────

const staggerParent: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export function StaggerContainer({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial="hidden"
      animate="visible"
      transition={{ delayChildren: delay }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={staggerChild}>
      {children}
    </motion.div>
  );
}

// ─── Animated Icon Wrapper ───────────────────────────────────────

interface AnimatedIconProps {
  icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  className?: string;
  style?: React.CSSProperties;
  /** Hover effect type */
  hover?: "scale" | "glow" | "bounce" | "rotate" | "none";
  /** Entrance animation */
  entrance?: "pop" | "slide-up" | "fade" | "none";
  /** Continuous animation */
  continuous?: "breathe" | "float" | "pulse" | "spin-slow" | "none";
}

export function AnimatedIcon({
  icon: Icon,
  className = "",
  style,
  hover = "scale",
  entrance = "none",
  continuous = "none",
}: AnimatedIconProps) {
  const hoverAnim =
    hover === "scale"
      ? { scale: 1.15 }
      : hover === "glow"
      ? { scale: 1.1, filter: "drop-shadow(0 0 6px rgba(92,108,245,0.4))" }
      : hover === "bounce"
      ? { y: -2, scale: 1.05 }
      : hover === "rotate"
      ? { rotate: 15, scale: 1.05 }
      : {};

  const entranceAnim =
    entrance === "pop"
      ? { initial: { scale: 0.5, opacity: 0 }, animate: { scale: 1, opacity: 1 } }
      : entrance === "slide-up"
      ? { initial: { y: 8, opacity: 0 }, animate: { y: 0, opacity: 1 } }
      : entrance === "fade"
      ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
      : {};

  const continuousClass =
    continuous === "breathe"
      ? "animate-breathe"
      : continuous === "float"
      ? "animate-float"
      : continuous === "pulse"
      ? "animate-crystal-pulse"
      : continuous === "spin-slow"
      ? "animate-spin-slow"
      : "";

  return (
    <motion.span
      className={`inline-flex items-center justify-center ${continuousClass}`}
      {...entranceAnim}
      whileHover={hoverAnim}
      whileTap={{ scale: 0.92 }}
      transition={springPreset}
    >
      <Icon className={className} style={style} />
    </motion.span>
  );
}

// ─── Page Transition Wrapper ─────────────────────────────────────

const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  enter: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 24, duration: 0.35 },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15, ease: [0.4, 0, 1, 1] },
  },
};

export function PageTransition({
  children,
  className = "",
  routeKey,
}: {
  children: ReactNode;
  className?: string;
  routeKey: string;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={routeKey}
        className={className}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Fade In / Out wrapper ───────────────────────────────────────

export function FadeIn({
  children,
  className = "",
  delay = 0,
  duration = 0.3,
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}) {
  const offset = 12;
  const initial =
    direction === "up"
      ? { opacity: 0, y: offset }
      : direction === "down"
      ? { opacity: 0, y: -offset }
      : direction === "left"
      ? { opacity: 0, x: offset }
      : direction === "right"
      ? { opacity: 0, x: -offset }
      : { opacity: 0 };

  return (
    <motion.div
      className={className}
      initial={initial}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay, ease: [0, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ─── Presence Wrapper (enter + exit) ─────────────────────────────

export function PresenceWrapper({
  children,
  isVisible,
  className = "",
}: {
  children: ReactNode;
  isVisible: boolean;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={className}
          initial={{ opacity: 0, scale: 0.95, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 4 }}
          transition={gentleSpring}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Hover Lift Card ─────────────────────────────────────────────

export function HoverLiftCard({
  children,
  className = "",
  style,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      whileHover={{
        y: -2,
        boxShadow: "var(--shadow-crystal)",
        transition: { type: "spring", stiffness: 400, damping: 25 },
      }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

// ─── Ripple Button ───────────────────────────────────────────────

export function RippleButton({
  children,
  className = "",
  style,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      className={`relative overflow-hidden ${className}`}
      style={style}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={snappySpring}
    >
      {children}
    </motion.button>
  );
}

// ─── Slide Indicator (for active tab/nav) ────────────────────────

export function SlideIndicator({
  layoutId,
  className = "",
  style,
}: {
  layoutId: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      layoutId={layoutId}
      className={className}
      style={style}
      transition={springPreset}
    />
  );
}

// ─── Number Counter ──────────────────────────────────────────────

export function CountUp({
  value,
  className = "",
  style,
  duration = 1.2,
}: {
  value: number;
  className?: string;
  style?: React.CSSProperties;
  duration?: number;
}) {
  return (
    <motion.span
      className={className}
      style={style}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <motion.span
        key={value}
        initial={{ opacity: 0.3 }}
        animate={{ opacity: 1 }}
        transition={{ duration: duration * 0.3 }}
      >
        {value}
      </motion.span>
    </motion.span>
  );
}

// ─── Typing Dots ─────────────────────────────────────────────────

export function TypingDots({ color = "#5C6CF5" }: { color?: string }) {
  return (
    <span className="inline-flex items-center gap-[3px] ml-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-[5px] h-[5px] rounded-full"
          style={{ backgroundColor: color }}
          animate={{
            y: [0, -4, 0],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

// ─── Crystal Shimmer Line ────────────────────────────────────────

export function ShimmerLine({ className = "" }: { className?: string }) {
  return (
    <div className={`overflow-hidden rounded-full ${className}`}>
      <motion.div
        className="h-full w-full rounded-full"
        style={{
          background: "linear-gradient(90deg, transparent 25%, rgba(92,108,245,0.15) 50%, transparent 75%)",
          backgroundSize: "200% 100%",
        }}
        animate={{ backgroundPosition: ["200% center", "-200% center"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
