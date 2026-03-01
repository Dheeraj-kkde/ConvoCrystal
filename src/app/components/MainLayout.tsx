import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileTabBar } from "./MobileTabBar";
import { UploadFlow } from "./UploadFlow";
import { VersionControl } from "./VersionControl";
import { OnboardingOverlay } from "./OnboardingOverlay";
import { NewUserTour } from "./NewUserTour";
import { WelcomePage } from "./WelcomePage";
import { ProgressTracker } from "./ProgressTracker";
import { ErrorBoundary } from "./ErrorBoundary";
import { CommandPalette } from "./CommandPalette";
import { useTheme } from "./ThemeContext";
import { useToast } from "./ToastSystem";
import { useUser } from "./UserContext";
import { useHotkeys } from "../lib/useHotkeys";
import { useNotificationStream } from "../lib/useNotificationStream";
import { useNotificationPruner } from "../stores/notificationStore";

export function MainLayout() {
  const { isDark, toggle, colors } = useTheme();
  const { addToast } = useToast();
  const { isNewUser, hasCompletedWelcome } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Modals
  const [showUpload, setShowUpload] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNewUserTour, setShowNewUserTour] = useState(false);

  // Start notification stream (simulated in demo, real WS when VITE_WS_URL set)
  useNotificationStream({ enabled: true, intervalMs: 60_000 });

  // Prune notifications older than 7 days — on mount and every hour
  useNotificationPruner();

  // Transition flash when switching user modes
  const [modeFlash, setModeFlash] = useState(false);
  useEffect(() => {
    setModeFlash(true);
    const t = setTimeout(() => setModeFlash(false), 600);
    return () => clearTimeout(t);
  }, [isNewUser]);

  // Responsive
  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Auto-collapse sidebar on tablet
  useEffect(() => {
    if (isTablet) setSidebarCollapsed(true);
  }, [isTablet]);

  // Mobile tab → route mapping
  const [mobileTab, setMobileTab] = useState("chat");
  useEffect(() => {
    const path = location.pathname;
    if (path === "/overview") setMobileTab("overview");
    else if (path === "/documents") setMobileTab("documents");
    else if (path === "/settings") setMobileTab("settings");
    else setMobileTab("chat");
  }, [location.pathname]);

  const handleMobileTab = (tab: string) => {
    setMobileTab(tab);
    if (tab === "overview") navigate("/overview");
    else if (tab === "documents") navigate("/documents");
    else if (tab === "settings") navigate("/settings");
    else navigate("/");
  };

  // Sidebar navigation
  const handleSidebarNavigate = (section: string) => {
    const lower = section.toLowerCase();
    if (lower === "overview") navigate("/overview");
    else if (lower === "documents" || lower === "library") navigate("/documents");
    else if (lower === "settings") navigate("/settings");
    else navigate("/");
  };

  // Hotkeys
  useHotkeys([
    { key: "u", ctrl: true, handler: () => setShowUpload(true) },
    { key: "h", ctrl: true, handler: () => setShowVersions(true) },
    { key: "t", ctrl: true, handler: () => toggle() },
  ]);

  // Show new-user welcome page if they haven't completed it
  if (isNewUser && !hasCompletedWelcome) {
    return (
      <div className="h-screen w-screen overflow-auto" style={{ backgroundColor: colors.bgBase }}>
        <TopBar
          onUpload={() => setShowUpload(true)}
          onVersions={() => setShowVersions(true)}
          onOnboarding={() => setShowOnboarding(true)}
        />
        <WelcomePage
          onStartUpload={() => setShowUpload(true)}
          onStartTour={() => setShowNewUserTour(true)}
        />
        <UploadFlow isOpen={showUpload} onClose={() => setShowUpload(false)} />
        <NewUserTour isOpen={showNewUserTour} onClose={() => setShowNewUserTour(false)} />
        <CommandPalette onUpload={() => setShowUpload(true)} onVersions={() => setShowVersions(true)} />
      </div>
    );
  }

  // ─── Desktop Layout ────────────────────────────────────────────
  if (!isMobile) {
    return (
      <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ backgroundColor: colors.bgBase }}>
        {/* Mode flash overlay */}
        <AnimatePresence>
          {modeFlash && (
            <motion.div
              className="fixed inset-0 z-[9999] pointer-events-none"
              style={{ backgroundColor: colors.crystal }}
              initial={{ opacity: 0.12 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          )}
        </AnimatePresence>

        <TopBar
          onUpload={() => setShowUpload(true)}
          onVersions={() => setShowVersions(true)}
          onOnboarding={() => setShowOnboarding(true)}
        />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            onNavigate={handleSidebarNavigate}
            onUpload={() => setShowUpload(true)}
          />
          <ErrorBoundary>
            <main className="flex-1 overflow-auto">
              <Outlet />
            </main>
          </ErrorBoundary>
        </div>

        {/* New-user progress tracker */}
        {isNewUser && <ProgressTracker />}

        {/* Modals */}
        <UploadFlow isOpen={showUpload} onClose={() => setShowUpload(false)} />
        <VersionControl isOpen={showVersions} onClose={() => setShowVersions(false)} />
        <OnboardingOverlay isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
        <NewUserTour isOpen={showNewUserTour} onClose={() => setShowNewUserTour(false)} />
        <CommandPalette onUpload={() => setShowUpload(true)} onVersions={() => setShowVersions(true)} />
      </div>
    );
  }

  // ─── Mobile Layout ─────────────────────────────────────────────
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ backgroundColor: colors.bgBase }}>
      <AnimatePresence>
        {modeFlash && (
          <motion.div
            className="fixed inset-0 z-[9999] pointer-events-none"
            style={{ backgroundColor: colors.crystal }}
            initial={{ opacity: 0.12 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      <TopBar
        onUpload={() => setShowUpload(true)}
        onVersions={() => setShowVersions(true)}
        onOnboarding={() => setShowOnboarding(true)}
      />

      <ErrorBoundary>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </ErrorBoundary>

      {isNewUser && <ProgressTracker />}

      <MobileTabBar activeTab={mobileTab} onTabChange={handleMobileTab} />

      {/* Modals */}
      <UploadFlow isOpen={showUpload} onClose={() => setShowUpload(false)} />
      <VersionControl isOpen={showVersions} onClose={() => setShowVersions(false)} />
      <OnboardingOverlay isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
      <NewUserTour isOpen={showNewUserTour} onClose={() => setShowNewUserTour(false)} />
      <CommandPalette onUpload={() => setShowUpload(true)} onVersions={() => setShowVersions(true)} />
    </div>
  );
}