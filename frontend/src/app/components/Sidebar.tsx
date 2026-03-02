import { useState } from "react";
import {
  Library,
  FolderOpen,
  Clock,
  Settings,
  ChevronDown,
  ChevronRight,
  FileText,
  Search,
  PanelLeftClose,
  PanelLeft,
  Plus,
  LayoutDashboard,
  Files,
  Upload,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "./ThemeContext";
import { useUser } from "./UserContext";
import { ConfidenceBadge } from "./ConfidenceBadge";

const transcripts = [
  { id: 1, name: "Q4 Strategy Review", confidence: 94, date: "2h ago", speakers: 6 },
  { id: 2, name: "Product Sync — Sprint 14", confidence: 88, date: "5h ago", speakers: 4 },
  { id: 3, name: "Customer Discovery — Acme", confidence: 91, date: "1d ago", speakers: 3 },
  { id: 4, name: "Board Meeting — Feb", confidence: 76, date: "2d ago", speakers: 8 },
  { id: 5, name: "1:1 — Engineering Lead", confidence: 97, date: "3d ago", speakers: 2 },
  { id: 6, name: "Design Critique — v2.3", confidence: 85, date: "4d ago", speakers: 5 },
];

const navSections = [
  { icon: LayoutDashboard, label: "Overview", count: null },
  { icon: Library, label: "Library", count: 24 },
  { icon: Files, label: "Documents", count: 12 },
  { icon: FolderOpen, label: "Workspaces", count: 3 },
  { icon: Clock, label: "Recent", count: null },
  { icon: Settings, label: "Settings", count: null },
];

function ConfidenceBadgeInline({ score }: { score: number }) {
  // Use the shared component
  return <ConfidenceBadge score={score} />;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: (section: string) => void;
  onUpload?: () => void;
}

export function Sidebar({ collapsed, onToggle, onNavigate, onUpload }: SidebarProps) {
  const { isDark, colors } = useTheme();
  const { isNewUser } = useUser();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Library: true,
    Workspaces: false,
    Recent: true,
    Settings: false,
  });
  const [activeItem, setActiveItem] = useState("Library");
  const [activeTranscript, setActiveTranscript] = useState(1);

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // Sidebar-specific surface (slightly different from main bg)
  const sidebarBg = isDark ? "#0F1018" : "#F0EEEB";
  const searchBg = isDark ? "#1A1D2E" : "#FFFFFF";
  const hoverBg = isDark ? "#1A1D2E" : "#E2E0DB";

  if (collapsed) {
    return (
      <div className="w-14 h-full flex flex-col items-center py-4 gap-1 transition-colors duration-300"
        style={{ backgroundColor: sidebarBg, borderRight: `1px solid ${colors.border}` }}>
        <button
          onClick={onToggle}
          className="p-2 rounded-md transition-colors duration-160"
          style={{ color: colors.textSecondary }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverNeutral}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          title="Expand sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Upload icon */}
        <button
          onClick={onUpload}
          className="p-2 rounded-md transition-colors duration-160 mb-1"
          style={{
            color: colors.textSecondary,
            border: `1px solid ${isDark ? "rgba(232,234,246,0.15)" : "rgba(26,25,22,0.15)"}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.hoverNeutral;
            e.currentTarget.style.borderColor = isDark ? "rgba(232,234,246,0.25)" : "rgba(26,25,22,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = isDark ? "rgba(232,234,246,0.15)" : "rgba(26,25,22,0.15)";
          }}
          title="Upload Transcript"
        >
          <Upload className="w-4 h-4" />
        </button>

        {navSections.map((section) => (
          <button
            key={section.label}
            onClick={() => { setActiveItem(section.label); onNavigate?.(section.label); onToggle(); }}
            className="p-2.5 rounded-md transition-all duration-160 relative group"
            style={{
              color: activeItem === section.label ? colors.textPrimary : colors.textMuted,
              backgroundColor: activeItem === section.label ? colors.hoverNeutral : "transparent",
            }}
            onMouseEnter={(e) => { if (activeItem !== section.label) e.currentTarget.style.backgroundColor = colors.hoverNeutral; }}
            onMouseLeave={(e) => { if (activeItem !== section.label) e.currentTarget.style.backgroundColor = "transparent"; }}
            title={section.label}
          >
            {activeItem === section.label && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r" style={{ backgroundColor: colors.crystalLight }} />
            )}
            <section.icon className="w-4 h-4" />
          </button>
        ))}
        <div className="flex-1" />
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px]" style={{ backgroundColor: colors.crystalMuted }}>
          JD
        </div>
      </div>
    );
  }

  return (
    <div className="w-60 h-full flex flex-col transition-colors duration-300"
      style={{ backgroundColor: sidebarBg, borderRight: `1px solid ${colors.border}` }}>
      {/* Brand + Collapse */}
      <div className="px-4 h-12 flex items-center justify-between shrink-0"
        style={{ borderBottom: `1px solid ${colors.border}` }}>
        <div className="flex items-center gap-2">
          <span className="text-[13px]" style={{ fontWeight: 600, color: colors.textPrimary }}>
            Transcript Library
          </span>
        </div>
        <button onClick={onToggle} className="p-1.5 rounded transition-colors duration-160"
          style={{ color: colors.textMuted }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverNeutral}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <PanelLeftClose className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 shrink-0" style={{ borderBottom: `1px solid ${colors.border}` }}>
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md"
          style={{ backgroundColor: searchBg, border: `1px solid ${colors.border}` }}>
          <Search className="w-3.5 h-3.5" style={{ color: colors.textMuted }} />
          <input
            className="bg-transparent text-[12px] outline-none w-full"
            placeholder="Search transcripts..."
            style={{ color: colors.textSecondary }}
          />
          <span className="text-[10px] font-mono px-1 rounded" style={{ color: colors.textMuted, border: `1px solid ${colors.border}` }}>⌘K</span>
        </div>
      </div>

      {/* New Upload */}
      <div className="px-3 py-2 shrink-0">
        <button className="w-full flex items-center justify-center gap-2 py-1.5 rounded-md transition-colors text-[12px]"
          style={{
            color: colors.textPrimary,
            backgroundColor: "transparent",
            border: `1px solid ${isDark ? "rgba(232,234,246,0.15)" : "rgba(26,25,22,0.15)"}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.hoverNeutral;
            e.currentTarget.style.borderColor = isDark ? "rgba(232,234,246,0.25)" : "rgba(26,25,22,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = isDark ? "rgba(232,234,246,0.15)" : "rgba(26,25,22,0.15)";
          }}
          data-onboarding="upload"
          onClick={onUpload}
        >
          <Plus className="w-3.5 h-3.5" />
          Upload Transcript
        </button>
      </div>

      {/* Nav Sections */}
      <div className="flex-1 overflow-y-auto px-2 py-1 scrollbar-none">
        {navSections.map((section) => (
          <div key={section.label} className="mb-1">
            <button
              onClick={() => { setActiveItem(section.label); toggleSection(section.label); onNavigate?.(section.label); }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] transition-all duration-160 relative group"
              style={{
                color: activeItem === section.label ? colors.textPrimary : colors.textSecondary,
                backgroundColor: activeItem === section.label ? colors.hoverNeutral : "transparent",
              }}
              onMouseEnter={(e) => { if (activeItem !== section.label) e.currentTarget.style.backgroundColor = colors.hoverNeutral; }}
              onMouseLeave={(e) => { if (activeItem !== section.label) e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              {activeItem === section.label && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r"
                  style={{ backgroundColor: colors.crystalLight }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
              )}
              <motion.span
                className="inline-flex"
                whileHover={{ scale: 1.12 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <section.icon className="w-3.5 h-3.5 shrink-0" />
              </motion.span>
              <span className="flex-1 text-left">{section.label}</span>
              {section.count !== null && (
                <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
                  {isNewUser ? 0 : section.count}
                </span>
              )}
              {expandedSections[section.label] ? (
                <motion.span
                  animate={{ rotate: expandedSections[section.label] ? 0 : -90 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="inline-flex"
                >
                  <ChevronDown className="w-3 h-3" style={{ color: colors.textMuted }} />
                </motion.span>
              ) : (
                <ChevronRight className="w-3 h-3" style={{ color: colors.textMuted }} />
              )}
            </button>

            {/* Transcript List under Library */}
            {section.label === "Library" && (
              <AnimatePresence initial={false}>
                {expandedSections.Library && (
                  <motion.div
                    className="ml-2 mt-1 space-y-0.5 overflow-hidden"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  >
                    {isNewUser ? (
                      <div className="px-2 py-3 text-center">
                        <FileText className="w-4 h-4 mx-auto mb-1" style={{ color: colors.textMuted }} />
                        <div className="text-[10px]" style={{ color: colors.textMuted }}>
                          No transcripts yet
                        </div>
                        <div className="text-[9px] mt-0.5" style={{ color: `${colors.textMuted}80` }}>
                          Upload one to get started
                        </div>
                      </div>
                    ) : (
                      transcripts.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setActiveTranscript(t.id)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-all duration-160 group"
                          style={{
                            color: activeTranscript === t.id ? colors.textPrimary : colors.textSecondary,
                            backgroundColor: activeTranscript === t.id ? colors.hoverNeutral : "transparent",
                          }}
                          onMouseEnter={(e) => { if (activeTranscript !== t.id) e.currentTarget.style.backgroundColor = `${hoverBg}`; }}
                          onMouseLeave={(e) => { if (activeTranscript !== t.id) e.currentTarget.style.backgroundColor = activeTranscript === t.id ? colors.hoverNeutral : "transparent"; }}
                        >
                          <FileText className="w-3 h-3 shrink-0" style={{ color: colors.textMuted }} />
                          <span className="flex-1 text-left truncate">{t.name}</span>
                          <ConfidenceBadgeInline score={t.confidence} />
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Recent items */}
            {section.label === "Recent" && (
              <AnimatePresence initial={false}>
                {expandedSections.Recent && (
                  <motion.div
                    className="ml-2 mt-1 space-y-0.5 overflow-hidden"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  >
                    {isNewUser ? (
                      <div className="px-2 py-2 text-center">
                        <div className="text-[10px]" style={{ color: colors.textMuted }}>
                          No recent activity
                        </div>
                      </div>
                    ) : (
                      transcripts.slice(0, 3).map((t) => (
                        <button
                          key={`recent-${t.id}`}
                          className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-[11px] transition-all duration-160"
                          style={{ color: colors.textMuted }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hoverBg; e.currentTarget.style.color = colors.textSecondary; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = colors.textMuted; }}
                        >
                          <Clock className="w-3 h-3 shrink-0" />
                          <span className="flex-1 text-left truncate">{t.name}</span>
                          <span className="text-[9px] font-mono">{t.date}</span>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        ))}
      </div>

      {/* User */}
      <div className="px-3 py-3 flex items-center gap-2 shrink-0"
        style={{ borderTop: `1px solid ${colors.border}` }}>
        <motion.div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px]"
          style={{ backgroundColor: colors.crystalMuted }}
          whileHover={{ scale: 1.08 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          JD
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] truncate" style={{ color: colors.textPrimary }}>Jane Doe</div>
          <div className="text-[9px] font-mono" style={{ color: colors.textMuted }}>Pro Plan</div>
        </div>
        <motion.div
          className="w-2 h-2 rounded-full bg-[#10B981]"
          title="Online"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}