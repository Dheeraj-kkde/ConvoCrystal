import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface ThemeColors {
  bgBase: string;
  bgPanel: string;
  bgRaised: string;
  indigo: string;
  indigoLight: string;
  teal: string;
  violet: string;
  emerald: string;
  amber: string;
  rose: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  inputBg: string;
}

const darkColors: ThemeColors = {
  bgBase: "#0B0C10",
  bgPanel: "#1A1D2E",
  bgRaised: "#222640",
  indigo: "#6366F1",
  indigoLight: "#818CF8",
  teal: "#06B6D4",
  violet: "#8B5CF6",
  emerald: "#10B981",
  amber: "#F59E0B",
  rose: "#F43F5E",
  textPrimary: "#E8EAF6",
  textSecondary: "#9BA3C8",
  textMuted: "#5C6490",
  border: "#2A2D42",
  inputBg: "#1A1D2E",
};

const lightColors: ThemeColors = {
  bgBase: "#F9F8F6",
  bgPanel: "#FFFFFF",
  bgRaised: "#F0EEEB",
  indigo: "#6366F1",
  indigoLight: "#818CF8",
  teal: "#0891B2",
  violet: "#7C3AED",
  emerald: "#059669",
  amber: "#D97706",
  rose: "#E11D48",
  textPrimary: "#1A1916",
  textSecondary: "#57554F",
  textMuted: "#928F87",
  border: "#E2E0DB",
  inputBg: "#FFFFFF",
};

interface ThemeContextType {
  isDark: boolean;
  toggle: () => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  toggle: () => {},
  colors: darkColors,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  const toggle = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, toggle, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}