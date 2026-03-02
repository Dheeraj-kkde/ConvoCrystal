import { useState, useRef, useCallback, useEffect } from "react";
import {
  Bold, Italic, Underline, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Sparkles, GitCommit, ChevronDown,
  X, Check, FileText, Save,
} from "lucide-react";
import { useTheme } from "./ThemeContext";
import { useToast } from "./ToastSystem";
import { useBeforeUnloadGuard } from "../lib/useBeforeUnloadGuard";
import { useHotkeys } from "../lib/useHotkeys";

// ─── Section data model ──────────────────────────────────────────

interface EditorSection {
  id: string;
  label: string;
  content: string;
  refinement?: {
    status: "streaming" | "preview";
    original: string;
    refined: string;
  };
}

const initialSections: EditorSection[] = [
  {
    id: "summary", label: "SUMMARY",
    content: "The Q4 Strategy Review covered three major areas: market expansion timeline, pricing model revisions, and engineering resource allocation. Six stakeholders participated in a 47-minute session that resulted in three firm decisions and two items requiring follow-up analysis. The overall tone was aligned and action-oriented, with notable pushback from the mobile team on resource reallocation.",
  },
  {
    id: "decisions", label: "KEY DECISIONS",
    content: "1. APAC Launch Acceleration — Timeline moved from Q2 to late Q1 2026, pending localization feasibility review by Dec 6. Owner: Sarah Chen.\n\n2. Usage-Based Pricing — Enterprise tier transitions from per-seat to usage-based model. 90-day grandfather clause for existing customers. Finance to model impact by EOW.\n\n3. Engineering Headcount — 4 backend engineers approved for real-time pipeline team, funded by deferred mobile budget.",
  },
  {
    id: "actions", label: "ACTION ITEMS",
    content: "Sarah Chen — Complete APAC feasibility review (Due: Dec 6)\nMarcus Webb — Model usage-based pricing revenue impact (Due: Dec 8)\nDavid Park — Draft phased rollout proposal for Japan-first approach (Due: Dec 10)\nAlex Rivera — Prepare mobile metrics brief for January planning (Due: Jan 3)",
  },
  {
    id: "questions", label: "OPEN QUESTIONS",
    content: "• Can the localization team realistically support the accelerated APAC timeline given current capacity?\n• What is the projected revenue impact of the 90-day grandfather clause on Q1 targets?\n• Should mobile deprioritization be time-boxed to one quarter or left open-ended?\n• Is a Japan-only phased rollout significantly less risky than the full APAC launch?",
  },
  {
    id: "risks", label: "RISKS FLAGGED",
    content: "High — Localization team capacity may block accelerated APAC timeline (raised by David Park)\nMedium — Usage-based pricing transition could cause short-term revenue dip during migration window\nMedium — Mobile deprioritization may impact trial conversion if not revisited within one quarter\nLow — Engineering hiring timeline may slip if backend candidates remain scarce in current market",
  },
];

const toolbarButtons = [
  { icon: Bold, label: "Bold", cmd: "bold" },
  { icon: Italic, label: "Italic", cmd: "italic" },
  { icon: Underline, label: "Underline", cmd: "underline" },
  null,
  { icon: Heading1, label: "H1", cmd: "h1" },
  { icon: Heading2, label: "H2", cmd: "h2" },
  { icon: Heading3, label: "H3", cmd: "h3" },
  null,
  { icon: List, label: "UL", cmd: "insertUnorderedList" },
  { icon: ListOrdered, label: "OL", cmd: "insertOrderedList" },
  { icon: Quote, label: "Quote", cmd: "quote" },
];

const refinementActions = ["Refine", "Expand", "Shorten", "Formalize", "Simplify"];

// Mock refined responses per action
const MOCK_REFINED: Record<string, string> = {
  Refine: "**Sarah Chen (VP Product)**\n• Complete APAC localization feasibility review — Due: Friday, Dec 6\n• Present go/no-go recommendation for accelerated launch at Monday standup\n\n**Marcus Webb (CFO)**\n• Model revenue impact of usage-based pricing transition — Due: End of week (Dec 8)\n• Prepare grandfather clause terms for legal review\n\n**David Park (Eng Lead)**\n• Draft phased rollout proposal for Japan-first — Due: Dec 10\n\n**Alex Rivera (Head of Mobile)**\n• Prepare mobile metrics brief for January planning — Due: Jan 3",
  Expand: "The following action items have been expanded with additional context drawn from the transcript discussion...",
  Shorten: "• S. Chen — APAC review by Dec 6\n• M. Webb — Pricing model by Dec 8\n• D. Park — Rollout proposal by Dec 10\n• A. Rivera — Mobile brief by Jan 3",
  Formalize: "ACTION ITEM 1: Sarah Chen shall complete the APAC localization feasibility assessment no later than December 6, 2025...",
  Simplify: "Sarah needs to check if APAC launch can happen faster (by Dec 6). Marcus is looking at how pricing changes affect money (by Dec 8)...",
};

export function EditorPanel() {
  const [sections, setSections] = useState<EditorSection[]>(initialSections);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeToolbar, setActiveToolbar] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [commitVersion, setCommitVersion] = useState({ major: 3, minor: 2 });
  const [commitStatus, setCommitStatus] = useState<"saved" | "committing" | "dirty">("saved");
  const [docTitle, setDocTitle] = useState("Q4 Strategy Review — Analysis");
  const editableRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const { isDark, colors } = useTheme();
  const { addToast } = useToast();

  // Guard unsaved changes
  useBeforeUnloadGuard(isDirty);

  // Close export menu on outside click
  useEffect(() => {
    if (!showExportMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showExportMenu]);

  // ─── Keyboard shortcuts (Ctrl+S save, Ctrl+/ AI suggest) ──────

  const handleQuickSave = useCallback(() => {
    if (!isDirty) return;
    setIsDirty(false);
    setLastSaved(new Date());
    setCommitStatus("saved");
    addToast({ variant: "success", title: "Draft saved" });
    // In production: POST /api/v1/documents/{id}/autosave
  }, [isDirty, addToast]);

  const handleAISuggest = useCallback(() => {
    const target = sections.find((s) => !s.refinement);
    if (target) {
      setSelectedSection(target.id);
      addToast({ variant: "info", title: "AI Refine", message: "Pick a refinement action from the popover." });
    }
  }, [sections, addToast]);

  useHotkeys(
    [
      { key: "mod+s", handler: () => handleQuickSave() },
      { key: "mod+/", handler: () => handleAISuggest() },
    ],
    [handleQuickSave, handleAISuggest]
  );

  // ─── Auto-save every 30s when dirty ────────────────────────────

  useEffect(() => {
    if (!isDirty) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      setLastSaved(new Date());
      setIsDirty(false);
      setCommitStatus("saved");
      // In production: POST /api/v1/documents/{id}/autosave
    }, 30000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [isDirty, sections]);

  // ─── Content edit handler ──────────────────────────────────────

  const handleContentChange = useCallback((sectionId: string) => {
    const el = editableRefs.current[sectionId];
    if (!el) return;
    const newContent = el.innerText;
    setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, content: newContent } : s));
    setIsDirty(true);
    setCommitStatus("dirty");
  }, []);

  // ─── Toolbar formatting ────────────────────────────────────────

  const handleFormat = useCallback((cmd: string) => {
    if (cmd === "h1" || cmd === "h2" || cmd === "h3") {
      document.execCommand("formatBlock", false, cmd === "h1" ? "h1" : cmd === "h2" ? "h2" : "h3");
    } else if (cmd === "quote") {
      document.execCommand("formatBlock", false, "blockquote");
    } else {
      document.execCommand(cmd, false);
    }
    setActiveToolbar(activeToolbar === cmd ? null : cmd);
    setIsDirty(true);
    setCommitStatus("dirty");
  }, [activeToolbar]);

  // ─── Inline refinement with streaming simulation ───────────────

  const handleRefinement = useCallback((sectionId: string, action: string) => {
    setSelectedSection(null);

    setSections((prev) => prev.map((s) => {
      if (s.id !== sectionId) return s;
      return { ...s, refinement: { status: "streaming", original: s.content, refined: "" } };
    }));

    // Simulate streaming refined text
    const targetText = MOCK_REFINED[action] || MOCK_REFINED.Refine;
    let charIdx = 0;

    function streamChunk() {
      charIdx += Math.floor(Math.random() * 4) + 2;
      const chunk = targetText.slice(0, Math.min(charIdx, targetText.length));
      setSections((prev) => prev.map((s) => {
        if (s.id !== sectionId || !s.refinement) return s;
        return { ...s, refinement: { ...s.refinement, refined: chunk } };
      }));
      if (charIdx < targetText.length) {
        setTimeout(streamChunk, 15 + Math.random() * 25);
      } else {
        // Stream complete — enter preview
        setSections((prev) => prev.map((s) => {
          if (s.id !== sectionId || !s.refinement) return s;
          return { ...s, refinement: { ...s.refinement, status: "preview", refined: targetText } };
        }));
      }
    }
    setTimeout(streamChunk, 600);
  }, []);

  const handleAcceptRefinement = useCallback((sectionId: string) => {
    setSections((prev) => prev.map((s) => {
      if (s.id !== sectionId || !s.refinement) return s;
      return { ...s, content: s.refinement.refined, refinement: undefined };
    }));
    setIsDirty(true);
    setCommitStatus("dirty");
    addToast({ variant: "success", title: "Refinement accepted" });
  }, [addToast]);

  const handleRejectRefinement = useCallback((sectionId: string) => {
    setSections((prev) => prev.map((s) => {
      if (s.id !== sectionId || !s.refinement) return s;
      return { ...s, refinement: undefined };
    }));
    addToast({ variant: "info", title: "Refinement rejected", message: "Original text restored." });
  }, [addToast]);

  // ─── Commit ────────────────────────────────────────────────────

  const handleCommit = useCallback(() => {
    setCommitStatus("committing");
    setTimeout(() => {
      const newMinor = commitVersion.minor + 1;
      setCommitVersion({ major: commitVersion.major, minor: newMinor });
      setCommitStatus("saved");
      setIsDirty(false);
      setLastSaved(new Date());
      addToast({ variant: "success", title: "Version committed", message: `Snapshot v${commitVersion.major}.${newMinor} saved.` });
    }, 800);
  }, [commitVersion, addToast]);

  // ─── Export ────────────────────────────────────────────────────

  const handleExport = useCallback((format: string) => {
    setShowExportMenu(false);
    let content = "";
    if (format === "Markdown") {
      content += `# ${docTitle}\n\n`;
      sections.forEach((s) => { content += `## ${s.label}\n\n${s.content}\n\n`; });
    } else {
      content += `${docTitle}\n${"=".repeat(docTitle.length)}\n\n`;
      sections.forEach((s) => { content += `${s.label}\n${"-".repeat(s.label.length)}\n${s.content}\n\n`; });
    }
    if (format === "Clipboard") {
      navigator.clipboard.writeText(content);
      addToast({ variant: "success", title: "Copied to clipboard" });
      return;
    }
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `q4-strategy-review.${format === "Markdown" ? "md" : "txt"}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    addToast({ variant: "success", title: `Exported as ${format}`, message: `${sections.length} sections.` });
  }, [sections, docTitle, addToast]);

  // ─── Theme ─────────────────────────────────────────────────────

  const separatorColor = colors.border;
  const sectionBg = isDark ? "rgba(26,29,46,0.4)" : "rgba(238,236,234,0.5)";
  const selectedBg = isDark ? "rgba(245,158,11,0.06)" : "rgba(217,119,6,0.04)";
  const selectedBorder = isDark ? "rgba(245,158,11,0.15)" : "rgba(217,119,6,0.12)";
  const streamingBg = isDark ? "rgba(92,108,245,0.05)" : "rgba(92,108,245,0.04)";
  const dimmedText = isDark ? "rgba(232,234,246,0.35)" : "rgba(26,25,22,0.35)";
  const dropdownBg = isDark ? colors.bgPanel : "#FFFFFF";
  const inactiveToolbar = colors.textMuted;

  const wordCount = sections.reduce((sum, s) => sum + s.content.split(/\s+/).filter(Boolean).length, 0);

  return (
    <div className="flex flex-col h-full transition-colors duration-300" style={{ backgroundColor: colors.bgBase }}>
      {/* Top bar */}
      <div className="px-2 sm:px-3 flex items-center gap-1.5 sm:gap-2 shrink-0 h-11"
        style={{ borderBottom: `1px solid ${colors.border}` }}>
        <input value={docTitle} onChange={(e) => { setDocTitle(e.target.value); setIsDirty(true); }}
          className="bg-transparent text-[12px] sm:text-[13px] outline-none min-w-0 flex-1 border-b border-transparent transition-colors"
          style={{ fontWeight: 600, color: colors.textPrimary }} />
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all duration-160"
            style={{ border: `1px solid ${isDark ? "rgba(92,108,245,0.4)" : "rgba(92,108,245,0.3)"}`, color: colors.crystal }}
            data-onboarding="refine"
            onClick={() => {
              // Select the first section that doesn't have an active refinement
              const target = sections.find((s) => !s.refinement);
              if (target) {
                setSelectedSection(target.id);
                addToast({ variant: "info", title: "Select text to refine", message: "Click a refinement action on the popover." });
              }
            }}>
            <Sparkles className="w-3.5 h-3.5" /><span className="text-[11px]">AI Refine</span>
          </button>
          <div className="w-px h-4" style={{ backgroundColor: separatorColor }} />
          {isDirty && (
            <button className="p-1.5 rounded-md transition-colors" title="Save now"
              style={{ color: colors.amber }}
              onClick={() => { setIsDirty(false); setLastSaved(new Date()); setCommitStatus("saved"); addToast({ variant: "success", title: "Draft saved" }); }}>
              <Save className="w-3.5 h-3.5" />
            </button>
          )}
          <button className="p-1.5 rounded-md transition-colors" style={{ color: inactiveToolbar }} title="Commit" onClick={handleCommit}>
            <GitCommit className="w-3.5 h-3.5" />
          </button>
          <div className="relative" data-onboarding="export" ref={exportMenuRef}>
            <button onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1 px-2 py-1 rounded-md transition-colors"
              style={{ color: colors.textPrimary, backgroundColor: isDark ? "rgba(92,108,245,0.12)" : "rgba(92,108,245,0.08)",
                border: `1px solid ${isDark ? "rgba(92,108,245,0.25)" : "rgba(92,108,245,0.2)"}` }}>
              <FileText className="w-3.5 h-3.5" /><span className="text-[11px]">Export</span><ChevronDown className="w-2.5 h-2.5" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 w-36 rounded-lg py-1 shadow-xl z-[100]"
                style={{ backgroundColor: dropdownBg, border: `1px solid ${colors.border}` }}>
                {["PDF", "DOCX", "Markdown", "Clipboard"].map((f) => (
                  <button key={f} className="w-full text-left px-3 py-1.5 text-[11px] transition-colors"
                    style={{ color: colors.textSecondary }} onClick={() => handleExport(f)}>{f}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Formatting toolbar */}
      <div className="px-3 flex items-center gap-0.5 shrink-0 h-9 overflow-x-auto scrollbar-none"
        style={{ borderBottom: `1px solid ${colors.border}` }}>
        {toolbarButtons.map((btn, i) =>
          btn === null ? (
            <div key={`sep-${i}`} className="w-px h-3.5 mx-0.5 shrink-0" style={{ backgroundColor: separatorColor }} />
          ) : (
            <button key={btn.label} onClick={() => handleFormat(btn.cmd)}
              className="p-1 rounded shrink-0 transition-all duration-160"
              style={activeToolbar === btn.cmd ? { backgroundColor: colors.bgRaised, color: colors.textPrimary } : { color: inactiveToolbar }}
              title={btn.label}>
              <btn.icon className="w-3.5 h-3.5" />
            </button>
          )
        )}
      </div>

      {/* Editor Content — contentEditable sections */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {sections.map((section) => (
          <div key={section.id} className="relative">
            <div className="text-[10px] font-mono tracking-[0.15em] mb-2" style={{ color: colors.textMuted }}>{section.label}</div>

            {/* Refinement streaming/preview */}
            {section.refinement ? (
              <div>
                <div className="rounded-lg p-3 border-l-2" style={{ backgroundColor: streamingBg, borderLeftColor: colors.crystal }}>
                  <div className="text-[13px] leading-relaxed whitespace-pre-wrap mb-3"
                    style={{ color: dimmedText, textDecoration: "line-through", textDecorationColor: isDark ? "rgba(92,100,144,0.2)" : "rgba(140,137,128,0.2)" }}>
                    {section.refinement.original}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-px" style={{ backgroundColor: "rgba(92,108,245,0.2)" }} />
                    <span className="text-[9px] font-mono" style={{ color: colors.crystal }}>
                      {section.refinement.status === "streaming" ? "AI Streaming..." : "AI Replacement — Review"}
                    </span>
                    <div className="flex-1 h-px" style={{ backgroundColor: "rgba(92,108,245,0.2)" }} />
                  </div>
                  <div className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: colors.textPrimary }}>
                    {section.refinement.refined}
                    {section.refinement.status === "streaming" && (
                      <span className="inline-block w-0.5 h-3.5 ml-0.5 animate-pulse" style={{ backgroundColor: colors.crystal }} />
                    )}
                  </div>
                </div>
                {section.refinement.status === "preview" && (
                  <div className="flex items-center gap-2 mt-2 justify-end">
                    <button onClick={() => handleAcceptRefinement(section.id)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/25 transition-colors text-[11px]">
                      <Check className="w-3 h-3" /> Accept
                    </button>
                    <button onClick={() => handleRejectRefinement(section.id)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#F43F5E]/15 text-[#F43F5E] hover:bg-[#F43F5E]/25 transition-colors text-[11px]">
                      <X className="w-3 h-3" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                {/* Refinement popover for selected section */}
                {selectedSection === section.id && (
                  <div className="absolute -top-12 left-0 sm:left-1/2 sm:-translate-x-1/2 z-20 flex items-center gap-0.5 rounded-lg p-1 shadow-xl max-w-[calc(100vw-2rem)] overflow-x-auto scrollbar-none"
                    style={{ backgroundColor: dropdownBg, border: `1px solid ${colors.border}` }}>
                    {refinementActions.map((action) => (
                      <button key={action} onClick={() => handleRefinement(section.id, action)}
                        className="px-2.5 py-1 rounded-md text-[10px] transition-colors whitespace-nowrap hover:opacity-80"
                        style={{ color: colors.textSecondary }}>{action}</button>
                    ))}
                    <button onClick={() => setSelectedSection(null)}
                      className="p-1 rounded-md hover:bg-[#F43F5E]/15 transition-colors ml-1" style={{ color: colors.textMuted }}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Editable section */}
                <div
                  ref={(el) => { editableRefs.current[section.id] = el; }}
                  contentEditable
                  suppressContentEditableWarning
                  className="text-[13px] leading-relaxed whitespace-pre-wrap rounded-lg p-3 outline-none transition-all focus:ring-1"
                  style={{
                    backgroundColor: selectedSection === section.id ? selectedBg : sectionBg,
                    color: colors.textPrimary,
                    border: selectedSection === section.id ? `1px solid ${selectedBorder}` : "1px solid transparent",
                  }}
                  onInput={() => handleContentChange(section.id)}
                  onClick={() => setSelectedSection(section.id)}
                  onBlur={() => { if (selectedSection === section.id) setSelectedSection(null); }}
                  dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, "<br>") }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer status */}
      <div className="h-6 px-4 flex items-center justify-between shrink-0" style={{ borderTop: `1px solid ${colors.border}` }}>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>{sections.length} sections</span>
          <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>{wordCount.toLocaleString()} words</span>
          <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>~{Math.ceil(wordCount / 250)} min read</span>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && <span className="text-[9px] font-mono" style={{ color: colors.amber }}>Unsaved</span>}
          <span className="text-[9px] font-mono" style={{
            color: commitStatus === "committing" ? colors.amber : commitStatus === "saved" ? "#10B981" : colors.amber
          }}>
            {commitStatus === "committing" ? "Committing..." : commitStatus === "saved" ? "Saved" : "Modified"}
          </span>
          <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>v{commitVersion.major}.{commitVersion.minor}</span>
          {lastSaved && <span className="text-[9px] font-mono hidden sm:inline" style={{ color: colors.textMuted }}>
            {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>}
        </div>
      </div>
    </div>
  );
}