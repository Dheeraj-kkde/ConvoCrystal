import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";

// ─── Types ───────────────────────────────────────────────────────

export type OnboardingStep = "upload" | "chat" | "refine" | "export" | "versions";

export const ONBOARDING_STEPS: {
  key: OnboardingStep;
  label: string;
  description: string;
}[] = [
  { key: "upload", label: "Upload a Transcript", description: "Import your first meeting recording" },
  { key: "chat", label: "Ask AI a Question", description: "Chat with AI about a transcript" },
  { key: "refine", label: "Refine with AI", description: "Use AI to improve document text" },
  { key: "export", label: "Export a Document", description: "Download or share your work" },
  { key: "versions", label: "View Version History", description: "Explore your edit timeline" },
];

// ─── Store ───────────────────────────────────────────────────────

export interface UserState {
  isNewUser: boolean;
  hasCompletedWelcome: boolean;
  completedSteps: Set<OnboardingStep>;

  toggleUserMode: () => void;
  setHasCompletedWelcome: (v: boolean) => void;
  completeStep: (step: OnboardingStep) => void;
  resetProgress: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isNewUser: false,
      hasCompletedWelcome: false,
      completedSteps: new Set<OnboardingStep>(),

      toggleUserMode: () =>
        set((state) => {
          const nextIsNew = !state.isNewUser;
          if (nextIsNew) {
            return {
              isNewUser: true,
              hasCompletedWelcome: false,
              completedSteps: new Set<OnboardingStep>(),
            };
          }
          return { isNewUser: false };
        }),

      setHasCompletedWelcome: (v: boolean) => set({ hasCompletedWelcome: v }),

      completeStep: (step: OnboardingStep) =>
        set((state) => {
          const next = new Set(state.completedSteps);
          next.add(step);
          return { completedSteps: next };
        }),

      resetProgress: () =>
        set({
          completedSteps: new Set<OnboardingStep>(),
          hasCompletedWelcome: false,
        }),
    }),
    {
      name: "cc-user",
      // Custom storage to handle Set serialization
      storage: {
        getItem: (name) => {
          const raw = localStorage.getItem(name);
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          // Reconstruct the Set from the persisted array
          if (parsed && parsed.state && Array.isArray(parsed.state.completedSteps)) {
            parsed.state.completedSteps = new Set(parsed.state.completedSteps);
          }
          return parsed;
        },
        setItem: (name, value) => {
          // Serialize Set to array for JSON storage
          const toSerialize = {
            ...value,
            state: {
              ...value.state,
              completedSteps: Array.from(value.state.completedSteps || []),
            },
          };
          localStorage.setItem(name, JSON.stringify(toSerialize));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
      partialize: (state) => ({
        isNewUser: state.isNewUser,
        hasCompletedWelcome: state.hasCompletedWelcome,
        completedSteps: state.completedSteps,
      }),
    }
  )
);

// ─── Convenience Hook ────────────────────────────────────────────

/**
 * Drop-in replacement for the old Context-based useUser().
 * Returns the same shape: state + actions + derived values.
 */
export function useUser() {
  const {
    isNewUser,
    hasCompletedWelcome,
    completedSteps,
    toggleUserMode,
    setHasCompletedWelcome,
    completeStep,
    resetProgress,
  } = useUserStore(
    useShallow((s) => ({
      isNewUser: s.isNewUser,
      hasCompletedWelcome: s.hasCompletedWelcome,
      completedSteps: s.completedSteps,
      toggleUserMode: s.toggleUserMode,
      setHasCompletedWelcome: s.setHasCompletedWelcome,
      completeStep: s.completeStep,
      resetProgress: s.resetProgress,
    }))
  );

  const progressPercent = useMemo(
    () => Math.round((completedSteps.size / ONBOARDING_STEPS.length) * 100),
    [completedSteps]
  );

  const nextStep = useMemo(
    () => ONBOARDING_STEPS.find((s) => !completedSteps.has(s.key))?.key ?? null,
    [completedSteps]
  );

  return {
    isNewUser,
    toggleUserMode,
    hasCompletedWelcome,
    setHasCompletedWelcome,
    completedSteps,
    completeStep,
    resetProgress,
    onboardingSteps: ONBOARDING_STEPS,
    progressPercent,
    nextStep,
  };
}
