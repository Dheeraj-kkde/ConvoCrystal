import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import {
  Search,
  FileText,
  Settings,
  LayoutDashboard,
  FolderOpen,
  Upload,
  History,
  Sun,
  Moon,
  ArrowRight,
  Hash,
  MessageSquare,
  Sparkles,
  Command,
} from "lucide-react";
import { useTheme } from "./ThemeContext";
import { useHotkeys } from "../lib/useHotkeys";

// ─── Types ───────────────────────────────────────────────────────

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  category: "navigation" | "document" | "action" | "chat";
  keywords: string[];
  onSelect: () => void;
}

interface CommandPaletteProps {
  onUpload?: () => void;
  onVersions?: () => void;
}

// ─── Fuzzy match ─────────────────────────────────────────────────

function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

function fuzzyScore(text: string, query: string): number {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  // exact substring match gets highest score
  if (lower.includes(q)) return 100 - lower.indexOf(q);
  // starts-with gets high score
  if (lower.startsWith(q)) return 90;
  // otherwise score by consecutive matches
  let score = 0;
  let qi = 0;
  let consecutive = 0;
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) {
      qi++;
      consecutive++;
      score += consecutive * 2;
    } else {
      consecutive = 0;
    }
  }
  return qi === q.length ? score : -1;
}

// ─── Component ───────────────────────────────────────────────────

export function CommandPalette({ onUpload, onVersions }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { isDark, toggle, colors } = useTheme();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ⌘K to toggle
  useHotkeys(
    [
      {
        key: "mod+k",
        handler: () => setOpen((prev) => !prev),
      },
    ],
    []
  );

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Build command items
  const buildCommands = useCallback((): CommandItem[] => {
    const close = () => setOpen(false);
    const items: CommandItem[] = [
      // Navigation
      {
        id: "nav-dashboard",
        label: "Go to Dashboard",
        description: "Main workspace with chat & editor",
        icon: LayoutDashboard,
        category: "navigation",
        keywords: ["dashboard", "home", "main", "workspace", "chat"],
        onSelect: () => { navigate("/"); close(); },
      },
      {
        id: "nav-overview",
        label: "Go to Overview",
        description: "Analytics & insights dashboard",
        icon: Hash,
        category: "navigation",
        keywords: ["overview", "analytics", "insights", "stats"],
        onSelect: () => { navigate("/overview"); close(); },
      },
      {
        id: "nav-documents",
        label: "Go to Documents",
        description: "Browse all transcripts & files",
        icon: FolderOpen,
        category: "navigation",
        keywords: ["documents", "files", "transcripts", "library"],
        onSelect: () => { navigate("/documents"); close(); },
      },
      {
        id: "nav-settings",
        label: "Go to Settings",
        description: "Preferences, API keys, theme",
        icon: Settings,
        category: "navigation",
        keywords: ["settings", "preferences", "config", "api", "theme"],
        onSelect: () => { navigate("/settings"); close(); },
      },
      // Actions
      {
        id: "action-theme",
        label: isDark ? "Switch to Light Mode" : "Switch to Dark Mode",
        description: "Toggle theme appearance",
        icon: isDark ? Sun : Moon,
        category: "action",
        keywords: ["theme", "dark", "light", "toggle", "mode", "appearance"],
        onSelect: () => { toggle(); close(); },
      },
      {
        id: "action-upload",
        label: "Upload Transcript",
        description: "Upload audio, video, or text files",
        icon: Upload,
        category: "action",
        keywords: ["upload", "import", "transcript", "file", "audio", "video"],
        onSelect: () => { onUpload?.(); close(); },
      },
      {
        id: "action-versions",
        label: "View Version History",
        description: "Browse document revisions",
        icon: History,
        category: "action",
        keywords: ["version", "history", "revisions", "changes"],
        onSelect: () => { onVersions?.(); close(); },
      },
      // Mock documents
      {
        id: "doc-q3",
        label: "Q3 Earnings Call Transcript",
        description: "Oct 15, 2025 - 94% confidence",
        icon: FileText,
        category: "document",
        keywords: ["q3", "earnings", "call", "transcript", "finance"],
        onSelect: () => { navigate("/"); close(); },
      },
      {
        id: "doc-product",
        label: "Product Sync Notes",
        description: "Oct 12, 2025 - 89% confidence",
        icon: FileText,
        category: "document",
        keywords: ["product", "sync", "notes", "meeting"],
        onSelect: () => { navigate("/"); close(); },
      },
      {
        id: "doc-onboarding",
        label: "Client Onboarding Session",
        description: "Oct 8, 2025 - 62% confidence",
        icon: FileText,
        category: "document",
        keywords: ["client", "onboarding", "session"],
        onSelect: () => { navigate("/"); close(); },
      },
      {
        id: "doc-design",
        label: "Design Review Meeting",
        description: "Oct 5, 2025 - 91% confidence",
        icon: FileText,
        category: "document",
        keywords: ["design", "review", "meeting", "ux", "ui"],
        onSelect: () => { navigate("/"); close(); },
      },
      {
        id: "doc-standup",
        label: "Weekly Engineering Standup",
        description: "Oct 1, 2025 - 97% confidence",
        icon: FileText,
        category: "document",
        keywords: ["weekly", "engineering", "standup", "dev"],
        onSelect: () => { navigate("/"); close(); },
      },
      // Mock chats
      {
        id: "chat-summary",
        label: "Summarize Q3 action items",
        description: "Recent AI conversation",
        icon: MessageSquare,
        category: "chat",
        keywords: ["summarize", "q3", "action", "items", "chat", "ai"],
        onSelect: () => { navigate("/"); close(); },
      },
      {
        id: "chat-compare",
        label: "Compare meeting outcomes",
        description: "Recent AI conversation",
        icon: Sparkles,
        category: "chat",
        keywords: ["compare", "meeting", "outcomes", "analysis", "ai"],
        onSelect: () => { navigate("/"); close(); },
      },
    ];
    return items;
  }, [isDark, navigate, toggle, onUpload, onVersions]);

  const commands = buildCommands();

  // Filter & sort
  const filtered = query.trim()
    ? commands
        .map((cmd) => {
          const labelScore = fuzzyScore(cmd.label, query);
          const descScore = cmd.description ? fuzzyScore(cmd.description, query) * 0.5 : -1;
          const kwScore = Math.max(
            ...cmd.keywords.map((kw) => fuzzyScore(kw, query) * 0.7),
            -1
          );
          const best = Math.max(labelScore, descScore, kwScore);
          return { cmd, score: best };
        })
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((r) => r.cmd)
    : commands;

  // Group by category
  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const categoryLabels: Record<string, string> = {
    navigation: "Navigation",
    action: "Actions",
    document: "Documents",
    chat: "Conversations",
  };

  const categoryOrder = ["navigation", "action", "document", "chat"];
  const orderedGroups = categoryOrder.filter((c) => grouped[c]);

  // Flat list for keyboard nav
  const flatItems = orderedGroups.flatMap((c) => grouped[c]);

  // Clamp selection
  useEffect(() => {
    if (selectedIndex >= flatItems.length) {
      setSelectedIndex(Math.max(0, flatItems.length - 1));
    }
  }, [flatItems.length, selectedIndex]);

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatItems[selectedIndex]) flatItems[selectedIndex].onSelect();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  // Reset selection on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  let flatIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => setOpen(false)}
          />

          {/* Palette */}
          <motion.div
            className="relative w-full max-w-[560px] mx-4 rounded-xl shadow-2xl overflow-hidden"
            style={{
              backgroundColor: colors.bgPanel,
              border: `1px solid ${colors.border}`,
              boxShadow: `0 0 0 1px ${colors.border}, 0 16px 70px rgba(0,0,0,0.5)`,
            }}
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: `1px solid ${colors.border}` }}
            >
              <Search className="w-4 h-4 shrink-0" style={{ color: colors.textMuted }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent outline-none text-[14px]"
                style={{ color: colors.textPrimary }}
              />
              <kbd
                className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono"
                style={{
                  color: colors.textMuted,
                  backgroundColor: colors.bgRaised,
                  border: `1px solid ${colors.border}`,
                }}
              >
                esc
              </kbd>
            </div>

            {/* Results */}
            <div
              ref={listRef}
              className="max-h-[360px] overflow-y-auto py-2"
              style={{ scrollbarWidth: "thin", scrollbarColor: `${colors.border} transparent` }}
            >
              {flatItems.length === 0 ? (
                <div className="flex flex-col items-center py-10">
                  <Search className="w-6 h-6 mb-2" style={{ color: colors.textMuted, opacity: 0.3 }} />
                  <p className="text-[13px]" style={{ color: colors.textMuted }}>
                    No results for &ldquo;{query}&rdquo;
                  </p>
                </div>
              ) : (
                orderedGroups.map((cat) => (
                  <div key={cat} className="mb-1">
                    <div
                      className="px-4 py-1.5 text-[10px] uppercase tracking-wider"
                      style={{ color: colors.textMuted, fontWeight: 600 }}
                    >
                      {categoryLabels[cat]}
                    </div>
                    {grouped[cat].map((item) => {
                      flatIndex++;
                      const idx = flatIndex;
                      const isSelected = idx === selectedIndex;
                      return (
                        <button
                          key={item.id}
                          data-index={idx}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                          style={{
                            backgroundColor: isSelected ? `${colors.crystal}12` : "transparent",
                          }}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          onClick={() => item.onSelect()}
                        >
                          <div
                            className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: isSelected
                                ? `${colors.crystal}20`
                                : `${colors.bgRaised}`,
                            }}
                          >
                            <item.icon
                              className="w-3.5 h-3.5"
                              style={{
                                color: isSelected ? colors.crystalLight : colors.textMuted,
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span
                              className="text-[13px] block truncate"
                              style={{
                                color: isSelected ? colors.textPrimary : colors.textSecondary,
                                fontWeight: 500,
                              }}
                            >
                              {item.label}
                            </span>
                            {item.description && (
                              <span
                                className="text-[11px] block truncate mt-0.5"
                                style={{ color: colors.textMuted }}
                              >
                                {item.description}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <ArrowRight
                              className="w-3.5 h-3.5 shrink-0"
                              style={{ color: colors.crystalLight }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderTop: `1px solid ${colors.border}` }}
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: colors.textMuted }}>
                  <kbd
                    className="px-1 py-0.5 rounded"
                    style={{ backgroundColor: colors.bgRaised, border: `1px solid ${colors.border}` }}
                  >
                    &uarr;&darr;
                  </kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: colors.textMuted }}>
                  <kbd
                    className="px-1 py-0.5 rounded"
                    style={{ backgroundColor: colors.bgRaised, border: `1px solid ${colors.border}` }}
                  >
                    &crarr;
                  </kbd>
                  select
                </span>
              </div>
              <span className="flex items-center gap-1 text-[10px]" style={{ color: colors.textMuted }}>
                <Command className="w-3 h-3" />
                K to toggle
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
