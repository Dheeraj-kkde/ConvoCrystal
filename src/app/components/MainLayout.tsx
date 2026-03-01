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
import { useTheme } from "./ThemeContext";
import { useToast } from "./ToastSystem";
import { useUser } from "./UserContext";

export function MainLayout() {
  const { colors } = useTheme();
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

  // Transition flash when switching user modes
  const [modeFlash, setModeFlash] = useState(false);
  useEffect(() => {
    setModeFlash(true);
    const timer = setTimeout(() => setModeFlash(false), 400);
    return () => clearTimeout(timer);
  }, [isNewUser]);

  // Mobile tab state derived from route
  const getMobileTab = () => {
    if (location.pathname === "/documents") return "documents";
    if (location.pathname === "/settings") return "settings";
    if (location.pathname === "/overview") return "overview";
    return "chat";
  };
  const [mobileTab, setMobileTab] = useState(getMobileTab);

  useEffect(() => {
    setMobileTab(getMobileTab());
  }, [location.pathname]);

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  useEffect(() => {
    if (isTablet) setSidebarCollapsed(true);
  }, [isTablet]);

  // Show onboarding on first visit (only for returning users)
  useEffect(() => {
    if (isNewUser) return;
    const seen = sessionStorage.getItem("cc-onboarding-seen");
    if (!seen && !isMobile && location.pathname === "/") {
      const timer = setTimeout(() => setShowOnboarding(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [isMobile, location.pathname, isNewUser]);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    sessionStorage.setItem("cc-onboarding-seen", "1");
    addToast({
      variant: "info",
      title: "Welcome to ConvoCrystal!",
      message: "Start by uploading a transcript or exploring the sample data.",
    });
  };

  const handleMobileTabChange = (tab: string) => {
    setMobileTab(tab);
    if (tab === "documents") navigate("/documents");
    else if (tab === "settings") navigate("/settings");
    else if (tab === "overview") navigate("/overview");
    else if (tab === "library") navigate("/");
    else if (tab === "chat") navigate("/");
    else if (tab === "editor") navigate("/");
  };

  const handleSidebarNav = (section: string) => {
    if (section === "Settings") navigate("/settings");
    else if (section === "Documents") navigate("/documents");
    else if (section === "Overview") navigate("/overview");
    else navigate("/");
  };

  // Should we show the welcome page?
  const showWelcome = isNewUser && !hasCompletedWelcome && location.pathname === "/";

  // Content key for AnimatePresence
  const contentKey = showWelcome ? "welcome" : `route-${location.pathname}`;

  const baseStyle = {
    backgroundColor: colors.bgBase,
    color: colors.textPrimary,
    transition: "background-color 0.3s ease, color 0.3s ease",
  };

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col overflow-hidden" style={baseStyle}>
        <TopBar
          onUpload={() => setShowUpload(true)}
          onVersions={() => setShowVersions(true)}
          onOnboarding={() => {
            if (isNewUser) setShowNewUserTour(true);
            else setShowOnboarding(true);
          }}
        />
        <div className="flex-1 overflow-hidden relative">
          {/* Mode transition flash */}
          <AnimatePresence>
            {modeFlash && (
              <motion.div
                key="mode-flash"
                className="absolute inset-0 z-50 pointer-events-none"
                style={{ backgroundColor: `${colors.indigo}08` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {showWelcome ? (
              <motion.div
                key="welcome-mobile"
                className="h-full"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <WelcomePage
                  onStartUpload={() => setShowUpload(true)}
                  onStartTour={() => setShowNewUserTour(true)}
                />
              </motion.div>
            ) : (
              <motion.div
                key={contentKey}
                className="h-full"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <Outlet context={{ isMobile, isTablet, sidebarCollapsed }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <MobileTabBar activeTab={mobileTab} onTabChange={handleMobileTabChange} />
        <UploadFlow isOpen={showUpload} onClose={() => setShowUpload(false)} />
        <VersionControl isOpen={showVersions} onClose={() => setShowVersions(false)} />
        <NewUserTour isOpen={showNewUserTour} onClose={() => setShowNewUserTour(false)} />
        <ProgressTracker />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={baseStyle}>
      <TopBar
        onUpload={() => setShowUpload(true)}
        onVersions={() => setShowVersions(true)}
        onOnboarding={() => {
          if (isNewUser) setShowNewUserTour(true);
          else setShowOnboarding(true);
        }}
      />
      <div className="flex-1 flex overflow-hidden">
        <div className="shrink-0 transition-all duration-200">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            onNavigate={handleSidebarNav}
          />
        </div>
        <div className="flex-1 overflow-hidden relative">
          {/* Mode transition flash */}
          <AnimatePresence>
            {modeFlash && (
              <motion.div
                key="mode-flash"
                className="absolute inset-0 z-50 pointer-events-none"
                style={{ backgroundColor: `${colors.indigo}08` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {showWelcome ? (
              <motion.div
                key="welcome"
                className="h-full"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <WelcomePage
                  onStartUpload={() => setShowUpload(true)}
                  onStartTour={() => setShowNewUserTour(true)}
                />
              </motion.div>
            ) : (
              <motion.div
                key={contentKey}
                className="h-full"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <Outlet context={{ isMobile, isTablet, sidebarCollapsed, setSidebarCollapsed }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modals & Overlays */}
      <UploadFlow isOpen={showUpload} onClose={() => setShowUpload(false)} />
      <VersionControl isOpen={showVersions} onClose={() => setShowVersions(false)} />
      <OnboardingOverlay isOpen={showOnboarding} onClose={handleCloseOnboarding} />
      <NewUserTour isOpen={showNewUserTour} onClose={() => setShowNewUserTour(false)} />
      <ProgressTracker />
    </div>
  );
}