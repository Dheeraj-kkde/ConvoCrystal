import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Upload,
  MessageSquare,
  Sparkles,
  Download,
  History,
  Trophy,
  X,
} from "lucide-react";
import { useTheme } from "./ThemeContext";
import { useUser, type OnboardingStep } from "./UserContext";

const stepIcons: Record<OnboardingStep, typeof Upload> = {
  upload: Upload,
  chat: MessageSquare,
  refine: Sparkles,
  export: Download,
  versions: History,
};

const stepColors: Record<OnboardingStep, string> = {
  upload: "#6366F1",
  chat: "#06B6D4",
  refine: "#8B5CF6",
  export: "#10B981",
  versions: "#F59E0B",
};

export function ProgressTracker() {
  const { isDark, colors } = useTheme();
  const { isNewUser, completedSteps, completeStep, onboardingSteps, progressPercent, nextStep } = useUser();
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Only show for new users who haven't dismissed it
  if (!isNewUser || dismissed) return null;

  // All steps done? Show celebration briefly then hide
  const allDone = completedSteps.size === onboardingSteps.length;

  const panelBg = isDark ? "#1A1D2E" : "#FFFFFF";
  const panelBorder = isDark ? "#2A2D42" : "#E2E0DB";

  return (
    <motion.div
      className="fixed bottom-20 right-4 z-[90] md:bottom-6"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.8 }}
    >
      <AnimatePresence mode="wait">
        {expanded ? (
          <motion.div
            key="expanded"
            className="w-72 rounded-xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: panelBg, border: `1px solid ${panelBorder}` }}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.25 }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: `1px solid ${panelBorder}` }}
            >
              <div>
                <div className="text-[12px]" style={{ fontWeight: 600, color: colors.textPrimary }}>
                  Getting Started
                </div>
                <div className="text-[10px]" style={{ color: colors.textMuted }}>
                  {completedSteps.size}/{onboardingSteps.length} steps completed
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setExpanded(false)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                  style={{ color: colors.textMuted }}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                  style={{ color: colors.textMuted }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="px-4 pt-3 pb-1">
              <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: `${colors.indigo}15` }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: allDone ? "#10B981" : colors.indigo }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Steps list */}
            <div className="px-3 py-2 space-y-0.5">
              {onboardingSteps.map((step) => {
                const Icon = stepIcons[step.key];
                const color = stepColors[step.key];
                const done = completedSteps.has(step.key);
                const isNext = step.key === nextStep && !done;

                return (
                  <motion.button
                    key={step.key}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors"
                    style={{
                      backgroundColor: isNext ? `${color}08` : "transparent",
                      border: isNext ? `1px solid ${color}20` : "1px solid transparent",
                    }}
                    onClick={() => {
                      if (!done) completeStep(step.key);
                    }}
                    whileTap={done ? {} : { scale: 0.97 }}
                    layout
                  >
                    {/* Checkbox/Icon */}
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                      style={{
                        backgroundColor: done ? `${color}20` : `${color}08`,
                        border: done ? "none" : `1px dashed ${color}40`,
                      }}
                    >
                      {done ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        >
                          <Check className="w-3.5 h-3.5" style={{ color }} />
                        </motion.div>
                      ) : (
                        <Icon className="w-3.5 h-3.5" style={{ color: `${color}80` }} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[11px]"
                        style={{
                          fontWeight: 500,
                          color: done ? colors.textMuted : colors.textPrimary,
                          textDecoration: done ? "line-through" : "none",
                        }}
                      >
                        {step.label}
                      </div>
                      <div className="text-[9px]" style={{ color: colors.textMuted }}>
                        {step.description}
                      </div>
                    </div>

                    {isNext && (
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor: `${color}15`, color, fontWeight: 600 }}
                      >
                        NEXT
                      </span>
                    )}
                    {done && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full shrink-0" style={{ color: colors.textMuted }}>
                        Done
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Footer */}
            {allDone && (
              <motion.div
                className="px-4 py-3 text-center"
                style={{ borderTop: `1px solid ${panelBorder}` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Trophy className="w-6 h-6 mx-auto mb-1" style={{ color: "#F59E0B" }} />
                <div className="text-[11px]" style={{ fontWeight: 600, color: colors.textPrimary }}>
                  All done! You're a pro.
                </div>
                <div className="text-[9px]" style={{ color: colors.textMuted }}>
                  You've explored all the key features
                </div>
              </motion.div>
            )}

            {/* Try it hint */}
            {!allDone && (
              <div
                className="px-4 py-2 text-center text-[9px]"
                style={{ borderTop: `1px solid ${panelBorder}`, color: colors.textMuted }}
              >
                Click each step to mark it as done, or complete the actions in the app
              </div>
            )}
          </motion.div>
        ) : (
          /* Collapsed pill */
          <motion.button
            key="collapsed"
            onClick={() => setExpanded(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg"
            style={{ backgroundColor: panelBg, border: `1px solid ${panelBorder}` }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {/* Mini progress ring */}
            <div className="relative w-7 h-7">
              <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
                <circle
                  cx="14"
                  cy="14"
                  r="11"
                  fill="none"
                  stroke={isDark ? "#2A2D42" : "#E2E0DB"}
                  strokeWidth="2.5"
                />
                <motion.circle
                  cx="14"
                  cy="14"
                  r="11"
                  fill="none"
                  stroke={allDone ? "#10B981" : colors.indigo}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 11}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 11 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 11 * (1 - progressPercent / 100) }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center text-[8px] font-mono"
                style={{ fontWeight: 600, color: colors.textPrimary }}
              >
                {completedSteps.size}/{onboardingSteps.length}
              </span>
            </div>

            <div className="text-left">
              <div className="text-[10px]" style={{ fontWeight: 600, color: colors.textPrimary }}>
                {allDone ? "Setup Complete!" : "Getting Started"}
              </div>
              <div className="text-[9px]" style={{ color: colors.textMuted }}>
                {allDone ? "You're all set" : `${progressPercent}% complete`}
              </div>
            </div>

            <ChevronUp className="w-3 h-3" style={{ color: colors.textMuted }} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
