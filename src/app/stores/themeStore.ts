import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";

// ─── Color Tokens ────────────────────────────────────────────────

export interface ThemeColors {
  bgBase: string;
  bgPanel: string;
  bgRaised: string;
  crystal: string;
  crystalLight: string;
  crystalMuted: string;
  ice: string;
  emerald: string;
  amber: string;
  rose: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  inputBg: string;
  /** Warm subtle highlight for selections */
  warmHighlight: string;
  /** Neutral hover background */
  hoverNeutral: string;
  /** @deprecated Use `crystal` instead. Alias kept for gradual migration. */
  indigo: string;
}

export const darkColors: ThemeColors = {
  bgBase: "#0B0C10",
  bgPanel: "#1A1D2E",
  bgRaised: "#222640",
  crystal: "#5C6CF5",
  crystalLight: "#8F9BFF",
  crystalMuted: "#454FB0",
  ice: "#00C9D6",
  emerald: "#10B981",
  amber: "#F59E0B",
  rose: "#F43F5E",
  textPrimary: "#E8EAF6",
  textSecondary: "#9BA3C8",
  textMuted: "#5C6490",
  border: "#2A2D42",
  inputBg: "#1A1D2E",
  warmHighlight: "rgba(245,158,11,0.08)",
  hoverNeutral: "#1E2133",
  indigo: "#5C6CF5",
};

export const lightColors: ThemeColors = {
  bgBase: "#F9F8F6",
  bgPanel: "#FFFFFF",
  bgRaised: "#F0EEEB",
  crystal: "#5C6CF5",
  crystalLight: "#8F9BFF",
  crystalMuted: "#7B87E0",
  ice: "#00A3AD",
  emerald: "#059669",
  amber: "#D97706",
  rose: "#E11D48",
  textPrimary: "#1A1916",
  textSecondary: "#57554F",
  textMuted: "#928F87",
  border: "#E2E0DB",
  inputBg: "#FFFFFF",
  warmHighlight: "rgba(217,119,6,0.06)",
  hoverNeutral: "#EDECEA",
  indigo: "#5C6CF5",
};

// ─── Store ───────────────────────────────────────────────────────

export interface ThemeState {
  isDark: boolean;
  colors: ThemeColors;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: true,
      colors: darkColors,
      toggle: () =>
        set((state) => {
          const nextDark = !state.isDark;
          return { isDark: nextDark, colors: nextDark ? darkColors : lightColors };
        }),
    }),
    {
      name: "cc-theme",
      // Only persist the isDark flag; colors are derived on rehydration
      partialize: (state) => ({ isDark: state.isDark }),
      merge: (persisted, current) => {
        const p = persisted as Partial<ThemeState> | undefined;
        if (!p || typeof p.isDark === "undefined") return current;
        return {
          ...current,
          isDark: p.isDark,
          colors: p.isDark ? darkColors : lightColors,
        };
      },
    }
  )
);

// ─── DOM Side-Effects ────────────────────────────────────────────

function syncThemeToDom(isDark: boolean) {
  const root = document.documentElement;
  root.setAttribute("data-theme", isDark ? "dark" : "light");
  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

// Sync on every change
useThemeStore.subscribe((state) => syncThemeToDom(state.isDark));

// Initialize on first load
syncThemeToDom(useThemeStore.getState().isDark);

// ─── Convenience Hook ────────────────────────────────────────────

/**
 * Drop-in replacement for the old Context-based useTheme().
 * Returns { isDark, toggle, colors } — same shape as before.
 */
export function useTheme() {
  return useThemeStore(
    useShallow((s) => ({ isDark: s.isDark, toggle: s.toggle, colors: s.colors }))
  );
}
