import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  Bell,
  Search,
  Sun,
  Moon,
  Upload,
  History,
  HelpCircle,
  UserPlus,
  UserCheck,
  X,
  ArrowLeft,
  WifiOff,
} from "lucide-react";
import { useTheme } from "./ThemeContext";
import { useNavigate } from "react-router";
import { CrystalLogo } from "./Logo";
import { useUser } from "./UserContext";
import { useToast } from "./ToastSystem";
import { useOnlineStatus } from "../lib/useOnlineStatus";
import { useNotifications } from "../stores/notificationStore";
import { SwipeableNotificationItem, ICON_MAP } from "./SwipeableNotificationItem";
import { formatRelativeTime, useRelativeTimeTick } from "../lib/useRelativeTime";
import type { Notification } from "../stores/notificationStore";

interface TopBarProps {
  onUpload?: () => void;
  onVersions?: () => void;
  onOnboarding?: () => void;
}

export function TopBar({ onUpload, onVersions, onOnboarding }: TopBarProps) {
  const { isDark, toggle, colors } = useTheme();
  const { isNewUser, toggleUserMode } = useUser();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  // Notification store
  const {
    notifications,
    markRead,
    markAllRead,
    dismiss,
    unreadCount,
  } = useNotifications();

  // Drive live-updating relative timestamps for notification lists
  const newestCreatedAt = notifications.length > 0 ? notifications[0].createdAt : undefined;
  useRelativeTimeTick(newestCreatedAt);

  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileNotifsOpen, setMobileNotifsOpen] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const prevOnlineRef = useRef(isOnline);

  // ⌘K now handled by CommandPalette globally

  // "Back online" toast when connectivity is restored after being offline
  useEffect(() => {
    const wasOffline = !prevOnlineRef.current;
    prevOnlineRef.current = isOnline;
    if (wasOffline && isOnline) {
      addToast({
        variant: "success",
        title: "Back online",
        message: "Your connection has been restored. All features are available again.",
      });
    }
  }, [isOnline, addToast]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Close search on Escape
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setSearchOpen(false); setSearchValue(""); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  // Close mobile notifs on Escape
  useEffect(() => {
    if (!mobileNotifsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNotifsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNotifsOpen]);

  // Close notifications on outside click
  useEffect(() => {
    if (!notificationsOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [notificationsOpen]);

  // Close workspace on outside click
  useEffect(() => {
    if (!showWorkspace) return;
    const handleClick = (e: MouseEvent) => {
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) {
        setShowWorkspace(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showWorkspace]);

  // Handlers for notification actions
  const handleNotifTap = useCallback((n: Notification) => {
    markRead(n.id);
    addToast({
      variant: n.toastVariant,
      title: n.title,
      message: n.body,
      cta: n.toastVariant === "warning"
        ? { label: "View document \u2192", onClick: () => {} }
        : undefined,
    });
    setMobileNotifsOpen(false);
    setNotificationsOpen(false);
  }, [markRead, addToast]);

  const handleMarkAllRead = useCallback(() => {
    markAllRead();
    addToast({ variant: "info", title: "All caught up!", message: "All notifications marked as read." });
    setMobileNotifsOpen(false);
    setNotificationsOpen(false);
  }, [markAllRead, addToast]);

  // Mock search results
  const recentSearches = ["Q3 Earnings Call", "Product roadmap meeting", "Client onboarding"];
  const filteredResults = searchOpen && searchValue.trim()
    ? [
        { type: "document", title: "Q3 Earnings Call Transcript", date: "Oct 15, 2025" },
        { type: "document", title: "Product Sync Notes", date: "Oct 12, 2025" },
        { type: "chat", title: "Summarize action items from Q3 call", date: "Oct 15, 2025" },
      ].filter((r) => r.title.toLowerCase().includes(searchValue.toLowerCase()))
    : [];

  return (
    <>
      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="fixed inset-0 z-[200] flex flex-col"
            style={{ backgroundColor: colors.bgBase }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Search header */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 shrink-0"
              style={{ borderBottom: `1px solid ${colors.border}` }}
            >
              <button
                onClick={() => { setSearchOpen(false); setSearchValue(""); }}
                className="p-1.5 rounded-md transition-colors"
                style={{ color: colors.textMuted }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div
                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ backgroundColor: colors.bgPanel, border: `1px solid ${colors.border}` }}
              >
                <Search className="w-4 h-4 shrink-0" style={{ color: colors.textMuted }} />
                <input
                  ref={searchInputRef}
                  className="bg-transparent text-[14px] outline-none flex-1 w-full"
                  placeholder="Search documents, chats..."
                  style={{ color: colors.textPrimary }}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
                {searchValue && (
                  <button onClick={() => setSearchValue("")} className="p-0.5" style={{ color: colors.textMuted }}>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Search content */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {!searchValue.trim() ? (
                <>
                  <p className="text-[11px] uppercase tracking-wider mb-3" style={{ color: colors.textMuted, fontWeight: 600 }}>
                    Recent Searches
                  </p>
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => setSearchValue(term)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg mb-1 transition-colors hover:opacity-80"
                      style={{ color: colors.textSecondary }}
                    >
                      <Search className="w-3.5 h-3.5 shrink-0" style={{ color: colors.textMuted }} />
                      <span className="text-[13px]">{term}</span>
                    </button>
                  ))}
                  <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.border}` }}>
                    <p className="text-[11px] uppercase tracking-wider mb-3" style={{ color: colors.textMuted, fontWeight: 600 }}>
                      Quick Actions
                    </p>
                    {[
                      { icon: Upload, label: "Upload a transcript", action: onUpload },
                      { icon: History, label: "View version history", action: onVersions },
                    ].filter((a) => a.action).map((item) => (
                      <button
                        key={item.label}
                        onClick={() => { item.action?.(); setSearchOpen(false); }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg mb-1 transition-colors hover:opacity-80"
                        style={{ color: colors.textSecondary }}
                      >
                        <item.icon className="w-3.5 h-3.5 shrink-0" style={{ color: colors.crystal }} />
                        <span className="text-[13px]">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : filteredResults.length > 0 ? (
                <>
                  <p className="text-[11px] uppercase tracking-wider mb-3" style={{ color: colors.textMuted, fontWeight: 600 }}>
                    Results
                  </p>
                  {filteredResults.map((result, i) => (
                    <button
                      key={i}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-start gap-3 w-full px-3 py-3 rounded-lg mb-1 transition-colors hover:opacity-80 text-left"
                      style={{ backgroundColor: `${colors.bgPanel}80` }}
                    >
                      <div
                        className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: `${colors.crystal}15` }}
                      >
                        <Search className="w-3.5 h-3.5" style={{ color: colors.crystal }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] truncate" style={{ color: colors.textPrimary, fontWeight: 500 }}>
                          {result.title}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
                          {result.type === "document" ? "Document" : "Chat"} &middot; {result.date}
                        </p>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Search className="w-8 h-8 mb-3" style={{ color: colors.textMuted, opacity: 0.4 }} />
                  <p className="text-[13px]" style={{ color: colors.textMuted }}>
                    No results for &ldquo;{searchValue}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Notifications Overlay — with swipe-to-dismiss */}
      <AnimatePresence>
        {mobileNotifsOpen && (
          <motion.div
            className="fixed inset-0 z-[200] flex flex-col"
            style={{ backgroundColor: colors.bgBase }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 shrink-0"
              style={{ borderBottom: `1px solid ${colors.border}` }}
            >
              <button
                onClick={() => setMobileNotifsOpen(false)}
                className="p-1.5 rounded-md transition-colors"
                style={{ color: colors.textMuted }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="text-[14px]" style={{ fontWeight: 600, color: colors.textPrimary }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${colors.crystal}20`,
                    color: colors.crystal,
                    fontWeight: 600,
                  }}
                >
                  {unreadCount}
                </span>
              )}
              <div className="flex-1" />
              <button
                className="text-[11px] px-2.5 py-1 rounded-md transition-colors"
                style={{ color: colors.crystalLight }}
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
            </div>

            {/* Swipe hint */}
            {notifications.length > 0 && (
              <div className="px-4 py-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
                <p className="text-[10px]" style={{ color: colors.textMuted, opacity: 0.6 }}>
                  Swipe left to dismiss &middot; Tap to view
                </p>
              </div>
            )}

            {/* Notification items with swipe-to-dismiss */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Bell className="w-8 h-8 mb-3" style={{ color: colors.textMuted, opacity: 0.3 }} />
                  <p className="text-[13px]" style={{ color: colors.textMuted }}>No notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <SwipeableNotificationItem
                    key={n.id}
                    notification={n}
                    onTap={handleNotifTap}
                    onDismiss={dismiss}
                    onMarkRead={markRead}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="h-12 px-4 flex items-center justify-between shrink-0 z-50 transition-colors duration-300"
        style={{ backgroundColor: colors.bgBase, borderBottom: `1px solid ${colors.border}` }}
      >
        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <CrystalLogo size={24} />
            <span className="text-[14px] hidden sm:inline" style={{ fontWeight: 600, color: colors.textPrimary }}>
              Convo<span style={{ color: colors.crystal }}>Crystal</span>
            </span>
          </div>

          <div className="w-px h-4 hidden sm:block" style={{ backgroundColor: colors.border }} />

          {/* Workspace switcher */}
          <div className="relative hidden sm:block" ref={workspaceRef}>
            <button
              onClick={() => setShowWorkspace(!showWorkspace)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors"
              style={{ color: colors.textSecondary }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverNeutral}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: isDark ? "rgba(143,155,255,0.15)" : "rgba(92,108,245,0.12)" }}>
                <span className="text-[8px]" style={{ color: colors.crystalLight }}>A</span>
              </div>
              Acme Corp
              <ChevronDown className="w-3 h-3" style={{ color: colors.textMuted }} />
            </button>
            {showWorkspace && (
              <div className="absolute left-0 top-full mt-1 w-48 rounded-lg py-1 shadow-xl z-50"
                style={{ backgroundColor: colors.bgPanel, border: `1px solid ${colors.border}` }}>
                {["Acme Corp", "Personal", "Design Team"].map((ws) => (
                  <button
                    key={ws}
                    className="w-full text-left px-3 py-1.5 text-[11px] transition-colors"
                    style={{ color: colors.textSecondary }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverNeutral}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    onClick={() => setShowWorkspace(false)}
                  >
                    {ws}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: colors.textMuted }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverNeutral}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            title="Search (⌘K)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Onboarding */}
          {onOnboarding && (
            <button
              onClick={onOnboarding}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: colors.textMuted }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverNeutral}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              title="Product tour"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: colors.textMuted }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverNeutral}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <Sun className="w-4 h-4" style={{ color: colors.textMuted }} />
            ) : (
              <Moon className="w-4 h-4" style={{ color: colors.textMuted }} />
            )}
          </button>

          <div className="w-px h-4 mx-0.5 sm:mx-1 hidden sm:block" style={{ backgroundColor: colors.border }} />

          {/* Notifications — mobile bell */}
          <button
            className="relative p-1.5 rounded-md transition-colors sm:hidden"
            style={{ color: colors.textMuted }}
            onClick={() => setMobileNotifsOpen(true)}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full flex items-center justify-center text-[9px] text-white px-0.5 border-2" style={{ backgroundColor: colors.crystal, fontWeight: 700, borderColor: colors.bgBase }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </div>
            )}
          </button>

          {/* Notifications — desktop dropdown */}
          <div ref={notifRef} className="relative hidden sm:block">
            <button
              className="relative p-1.5 rounded-md transition-colors"
              style={{ color: notificationsOpen ? colors.crystal : colors.textMuted }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverNeutral}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full flex items-center justify-center text-[9px] text-white px-0.5 border-2" style={{ backgroundColor: colors.crystal, fontWeight: 700, borderColor: colors.bgBase }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </div>
              )}
            </button>

            {/* Notification dropdown */}
            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  className="absolute right-0 top-full mt-2 w-80 rounded-lg shadow-2xl overflow-hidden z-[200]"
                  style={{ backgroundColor: isDark ? colors.bgPanel : "#FFFFFF", border: `1px solid ${colors.border}` }}
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px]" style={{ fontWeight: 600, color: colors.textPrimary }}>Notifications</span>
                      {unreadCount > 0 && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: `${colors.crystal}20`, color: colors.crystal, fontWeight: 600 }}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <button
                      className="text-[10px] px-2 py-0.5 rounded-md transition-colors"
                      style={{ color: colors.crystalLight }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverNeutral}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                      onClick={handleMarkAllRead}
                    >
                      Mark all read
                    </button>
                  </div>

                  {/* Notification items */}
                  <div className="max-h-72 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: `${colors.border} transparent` }}>
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Bell className="w-6 h-6 mb-2" style={{ color: colors.textMuted, opacity: 0.3 }} />
                        <p className="text-[11px]" style={{ color: colors.textMuted }}>No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const Icon = ICON_MAP[notif.iconType];
                        return (
                          <button
                            key={notif.id}
                            className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#5C6CF5]/5"
                            style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: notif.unread ? `${colors.crystal}05` : "transparent" }}
                            onClick={() => handleNotifTap(notif)}
                          >
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                              style={{ backgroundColor: `${notif.color}12` }}
                            >
                              {Icon && <Icon className="w-3.5 h-3.5" style={{ color: notif.color }} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] truncate" style={{ fontWeight: 600, color: colors.textPrimary }}>{notif.title}</span>
                                {notif.unread && (
                                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: colors.crystal }} />
                                )}
                              </div>
                              <p className="text-[10px] mt-0.5 line-clamp-2" style={{ color: colors.textMuted }}>{notif.body}</p>
                              <span className="text-[9px] font-mono mt-1 block" style={{ color: colors.textMuted, opacity: 0.7 }}>{formatRelativeTime(notif.createdAt)}</span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2.5 text-center" style={{ borderTop: `1px solid ${colors.border}` }}>
                    <button
                      className="text-[10px] transition-colors hover:underline"
                      style={{ color: colors.crystalLight }}
                      onClick={() => {
                        addToast({
                          variant: "success",
                          title: "Toast system demo",
                          message: "All 4 variants work: success, warning, error, and info. Click any notification to fire one!",
                          cta: { label: "Learn more \u2192", onClick: () => {} },
                        });
                        setNotificationsOpen(false);
                      }}
                    >
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Auth links */}
          <button
            onClick={() => navigate("/login")}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono transition-colors"
            style={{ color: colors.textMuted }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverNeutral}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            Auth Demo
          </button>

          {/* New/Returning user toggle */}
          <motion.button
            onClick={toggleUserMode}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono transition-colors"
            style={{
              color: isNewUser ? "#F59E0B" : colors.crystal,
              backgroundColor: isNewUser ? "rgba(245,158,11,0.1)" : `${colors.crystal}10`,
            }}
            title={isNewUser ? "Viewing as New User \u2014 click to switch" : "Viewing as Returning User \u2014 click to switch"}
            whileTap={{ scale: 0.92 }}
            layout
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={isNewUser ? "new" : "return"}
                className="flex items-center gap-1"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {isNewUser ? <UserPlus className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                {isNewUser ? "New User" : "Returning"}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          {/* User avatar */}
          <button className="flex items-center gap-2 ml-1">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px]" style={{ backgroundColor: colors.crystalMuted }}>
              JD
            </div>
          </button>
        </div>
      </div>

      {/* Offline banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            className="flex items-center justify-center gap-2 px-4 py-1.5 text-[11px] shrink-0 z-50"
            style={{
              backgroundColor: isDark ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.1)",
              color: colors.amber,
              borderBottom: `1px solid ${isDark ? "rgba(245,158,11,0.2)" : "rgba(245,158,11,0.15)"}`,
              fontWeight: 500,
            }}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>You&apos;re offline &mdash; some features may be unavailable until connectivity is restored.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}