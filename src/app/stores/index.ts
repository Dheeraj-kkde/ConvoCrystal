// ─── Barrel Exports ──────────────────────────────────────────────
// Import stores directly for fine-grained selectors, or use the
// convenience hooks (useTheme, useUser, useToast) for the common case.

export { useThemeStore, useTheme, darkColors, lightColors } from "./themeStore";
export type { ThemeColors, ThemeState } from "./themeStore";

export { useUserStore, useUser, ONBOARDING_STEPS } from "./userStore";
export type { OnboardingStep, UserState } from "./userStore";

export { useToastStore, useToast } from "./toastStore";
export type { Toast, ToastVariant, ToastState } from "./toastStore";

export { useAuthStore, useAuth, generateCodeVerifier, generateCodeChallenge, generateOAuthState } from "./authStore";
export type { AuthStatus, AuthUser } from "./authStore";

export { useNotificationStore, useNotifications } from "./notificationStore";
export type { Notification, NotificationVariant, NotificationIconType, NotificationState } from "./notificationStore";