/**
 * Route guard that redirects unauthenticated users to /login.
 *
 * Currently wired to a simple mock auth check (always allows access)
 * since the AuthStore isn't connected to a real backend yet.
 * Swap the `isAuthenticated` check to read from a real auth store/token
 * when the backend is connected.
 */
import { Navigate, useLocation, Outlet } from "react-router";
import { useTheme } from "../stores/themeStore";

// ─── Mock Auth State ─────────────────────────────────────────────
// Replace with real auth store when backend is connected.
// For now, always authenticated to avoid blocking the prototype.
const MOCK_AUTH = true;

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

function useAuthStatus(): AuthStatus {
  // TODO: Replace with real auth check (silent refresh, token validation)
  if (MOCK_AUTH) return "authenticated";
  return "unauthenticated";
}

// ─── Splash Loader (shown during auth check) ────────────────────

function SplashLoader() {
  const { colors } = useTheme();
  return (
    <div
      className="h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: colors.bgBase }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
        style={{ backgroundColor: colors.crystal }}
      >
        <span className="text-white text-[10px] font-mono" style={{ fontWeight: 700 }}>CC</span>
      </div>
      <div
        className="w-5 h-5 border-2 rounded-full animate-spin"
        style={{
          borderColor: `${colors.crystal}30`,
          borderTopColor: colors.crystal,
        }}
      />
    </div>
  );
}

// ─── Protected Route Component ───────────────────────────────────

export function ProtectedRoute() {
  const status = useAuthStatus();
  const location = useLocation();

  if (status === "checking") {
    return <SplashLoader />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" state={{ returnUrl: location.pathname }} replace />;
  }

  return <Outlet />;
}
