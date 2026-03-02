/**
 * Route guard wired to the Zustand authStore.
 * Attempts a silent refresh on mount; redirects to /login if unauthenticated.
 */
import { useEffect } from "react";
import { Navigate, useLocation, Outlet } from "react-router";
import { useTheme } from "../stores/themeStore";
import { useAuth } from "../stores/authStore";

function SplashLoader() {
  const { colors } = useTheme();
  return (
    <div className="h-screen flex flex-col items-center justify-center" style={{ backgroundColor: colors.bgBase }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: colors.crystal }}>
        <span className="text-white text-[10px] font-mono" style={{ fontWeight: 700 }}>CC</span>
      </div>
      <div className="w-5 h-5 border-2 rounded-full animate-spin"
        style={{ borderColor: `${colors.crystal}30`, borderTopColor: colors.crystal }} />
    </div>
  );
}

export function ProtectedRoute() {
  const { status, silentRefresh } = useAuth();
  const location = useLocation();

  // Attempt silent refresh on first mount
  useEffect(() => {
    if (status === "uninitialised") {
      silentRefresh();
    }
  }, [status, silentRefresh]);

  if (status === "uninitialised" || status === "checking") {
    return <SplashLoader />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" state={{ returnUrl: location.pathname }} replace />;
  }

  return <Outlet />;
}
