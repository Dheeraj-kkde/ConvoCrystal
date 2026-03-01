import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type OnboardingStep = "upload" | "chat" | "refine" | "export" | "versions";

const ONBOARDING_STEPS: { key: OnboardingStep; label: string; description: string }[] = [
  { key: "upload", label: "Upload a Transcript", description: "Import your first meeting recording" },
  { key: "chat", label: "Ask AI a Question", description: "Chat with AI about a transcript" },
  { key: "refine", label: "Refine with AI", description: "Use AI to improve document text" },
  { key: "export", label: "Export a Document", description: "Download or share your work" },
  { key: "versions", label: "View Version History", description: "Explore your edit timeline" },
];

interface UserContextType {
  isNewUser: boolean;
  toggleUserMode: () => void;
  hasCompletedWelcome: boolean;
  setHasCompletedWelcome: (v: boolean) => void;
  // Progressive onboarding
  completedSteps: Set<OnboardingStep>;
  completeStep: (step: OnboardingStep) => void;
  resetProgress: () => void;
  onboardingSteps: typeof ONBOARDING_STEPS;
  progressPercent: number;
  nextStep: OnboardingStep | null;
}

const UserContext = createContext<UserContextType>({
  isNewUser: false,
  toggleUserMode: () => {},
  hasCompletedWelcome: false,
  setHasCompletedWelcome: () => {},
  completedSteps: new Set(),
  completeStep: () => {},
  resetProgress: () => {},
  onboardingSteps: ONBOARDING_STEPS,
  progressPercent: 0,
  nextStep: "upload",
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [isNewUser, setIsNewUser] = useState(false);
  const [hasCompletedWelcome, setHasCompletedWelcome] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<OnboardingStep>>(new Set());

  const toggleUserMode = useCallback(() => {
    setIsNewUser((prev) => {
      if (!prev) {
        setHasCompletedWelcome(false);
        setCompletedSteps(new Set());
      }
      return !prev;
    });
  }, []);

  const completeStep = useCallback((step: OnboardingStep) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(step);
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    setCompletedSteps(new Set());
    setHasCompletedWelcome(false);
  }, []);

  const progressPercent = Math.round((completedSteps.size / ONBOARDING_STEPS.length) * 100);

  const nextStep = ONBOARDING_STEPS.find((s) => !completedSteps.has(s.key))?.key ?? null;

  return (
    <UserContext.Provider
      value={{
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
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
