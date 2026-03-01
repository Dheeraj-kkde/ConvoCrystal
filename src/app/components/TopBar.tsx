import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { useTheme } from "./ThemeContext";
import { useNavigate } from "react-router";
import { CrystalLogo } from "./Logo";
import { useUser } from "./UserContext";

interface TopBarProps {
  onUpload?: () => void;
  onVersions?: () => void;
  onOnboarding?: () => void;
}

export function TopBar({ onUpload, onVersions, onOnboarding }: TopBarProps) {
  const { isDark, toggle, colors } = useTheme();
  const { isNewUser, toggleUserMode } = useUser();
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (showMobileSearch && mobileSearchRef.current) {
      mobileSearchRef.current.focus();
    }
  }, [showMobileSearch]);

  // Close mobile search on Escape
  useEffect(() => {
    if (!showMobileSearch) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowMobileSearch(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showMobileSearch]);

  // Mock search results
  const recentSearches = ["Q3 Earnings Call", "Product roadmap meeting", "Client onboarding"];
  const filteredResults = searchQuery.trim()
    ? [
        { type: "document", title: "Q3 Earnings Call Transcript", date: "Oct 15, 2025" },
        { type: "document", title: "Product Sync Notes", date: "Oct 12, 2025" },
        { type: "chat", title: "Summarize action items from Q3 call", date: "Oct 15, 2025" },
      ].filter((r) => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <>
      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {showMobileSearch && (
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
                onClick={() => { setShowMobileSearch(false); setSearchQuery(""); }}
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
                  ref={mobileSearchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-[14px] outline-none flex-1 w-full"
                  placeholder="Search documents, chats..."
                  style={{ color: colors.textPrimary }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="p-0.5" style={{ color: colors.textMuted }}>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Search content */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {!searchQuery.trim() ? (
                <>
                  <p className="text-[11px] uppercase tracking-wider mb-3" style={{ color: colors.textMuted, fontWeight: 600 }}>
                    Recent Searches
                  </p>
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => setSearchQuery(term)}
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
                        onClick={() => { item.action?.(); setShowMobileSearch(false); }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg mb-1 transition-colors hover:opacity-80"
                        style={{ color: colors.textSecondary }}
                      >
                        <item.icon className="w-3.5 h-3.5 shrink-0" style={{ color: colors.indigo }} />
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
                      onClick={() => setShowMobileSearch(false)}
                      className="flex items-start gap-3 w-full px-3 py-3 rounded-lg mb-1 transition-colors hover:opacity-80 text-left"
                      style={{ backgroundColor: `${colors.bgPanel}80` }}
                    >
                      <div
                        className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: `${colors.indigo}15` }}
                      >
                        <Search className="w-3.5 h-3.5" style={{ color: colors.indigo }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] truncate" style={{ color: colors.textPrimary, fontWeight: 500 }}>
                          {result.title}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
                          {result.type === "document" ? "Document" : "Chat"} · {result.date}
                        </p>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Search className="w-8 h-8 mb-3" style={{ color: colors.textMuted, opacity: 0.4 }} />
                  <p className="text-[13px]" style={{ color: colors.textMuted }}>
                    No results for "{searchQuery}"
                  </p>
                </div>
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
              Convo<span className="text-[#6366F1]">Crystal</span>
            </span>
          </div>

          <div className="w-px h-4 hidden sm:block" style={{ backgroundColor: colors.border }} />

          {/* Workspace switcher */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowWorkspace(!showWorkspace)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] hover:bg-[#6366F1]/10 transition-colors"
              style={{ color: colors.textSecondary }}
            >
              <div className="w-4 h-4 rounded bg-[#8B5CF6]/20 flex items-center justify-center">
                <span className="text-[8px] text-[#8B5CF6]">A</span>
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
                    className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-[#6366F1]/10 transition-colors"
                    style={{ color: colors.textSecondary }}
                    onClick={() => setShowWorkspace(false)}
                  >
                    {ws}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center - Search (desktop) */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg max-w-xs flex-1 mx-8 transition-colors duration-300"
          style={{ backgroundColor: colors.bgPanel, border: `1px solid ${colors.border}` }}
        >
          <Search className="w-3.5 h-3.5" style={{ color: colors.textMuted }} />
          <input
            className="bg-transparent text-[12px] placeholder-opacity-50 outline-none flex-1"
            placeholder="Search everything..."
            style={{ color: colors.textSecondary }}
          />
          <span className="text-[9px] font-mono px-1 rounded" style={{ color: colors.textMuted, border: `1px solid ${colors.border}` }}>
            ⌘K
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Mobile search trigger */}
          <button
            onClick={() => setShowMobileSearch(true)}
            className="md:hidden p-1.5 rounded-md hover:bg-[#6366F1]/10 transition-colors"
            title="Search"
          >
            <Search className="w-4 h-4" style={{ color: colors.textMuted }} />
          </button>

          {/* Upload */}
          {onUpload && (
            <button
              onClick={onUpload}
              className="p-1.5 rounded-md hover:bg-[#6366F1]/10 transition-colors"
              title="Upload transcript"
            >
              <Upload className="w-4 h-4" style={{ color: colors.textMuted }} />
            </button>
          )}

          {/* Version history - hide on very small screens */}
          {onVersions && (
            <button
              onClick={onVersions}
              className="hidden sm:block p-1.5 rounded-md hover:bg-[#6366F1]/10 transition-colors"
              title="Version history"
              data-onboarding="versions"
            >
              <History className="w-4 h-4" style={{ color: colors.textMuted }} />
            </button>
          )}

          {/* Onboarding */}
          {onOnboarding && (
            <button
              onClick={onOnboarding}
              className="p-1.5 rounded-md hover:bg-[#6366F1]/10 transition-colors"
              title="Product tour"
            >
              <HelpCircle className="w-4 h-4" style={{ color: colors.textMuted }} />
            </button>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="p-1.5 rounded-md hover:bg-[#6366F1]/10 transition-colors"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <Sun className="w-4 h-4" style={{ color: colors.textMuted }} />
            ) : (
              <Moon className="w-4 h-4" style={{ color: colors.textMuted }} />
            )}
          </button>

          <div className="w-px h-4 mx-0.5 sm:mx-1 hidden sm:block" style={{ backgroundColor: colors.border }} />

          {/* Notifications */}
          <button className="relative p-1.5 rounded-md hover:bg-[#6366F1]/10 transition-colors hidden sm:block">
            <Bell className="w-4 h-4" style={{ color: colors.textMuted }} />
            <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
          </button>

          {/* Auth links */}
          <button
            onClick={() => navigate("/login")}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono hover:bg-[#6366F1]/10 transition-colors"
            style={{ color: colors.textMuted }}
          >
            Auth Demo
          </button>

          {/* New/Returning user toggle */}
          <motion.button
            onClick={toggleUserMode}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono transition-colors"
            style={{
              color: isNewUser ? "#F59E0B" : colors.indigo,
              backgroundColor: isNewUser ? "rgba(245,158,11,0.1)" : `${colors.indigo}10`,
            }}
            title={isNewUser ? "Viewing as New User — click to switch" : "Viewing as Returning User — click to switch"}
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
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white text-[10px]">
              JD
            </div>
          </button>
        </div>
      </div>
    </>
  );
}