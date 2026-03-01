import { useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Sparkles,
  GitCommit,
  ChevronDown,
  X,
  Check,
  FileText,
} from "lucide-react";
import { useTheme } from "./ThemeContext";

const toolbarButtons = [
  { icon: Bold, label: "Bold" },
  { icon: Italic, label: "Italic" },
  { icon: Underline, label: "Underline" },
  null, // separator
  { icon: Heading1, label: "H1" },
  { icon: Heading2, label: "H2" },
  { icon: Heading3, label: "H3" },
  null, // separator
  { icon: List, label: "UL" },
  { icon: ListOrdered, label: "OL" },
  { icon: Quote, label: "Quote" },
];

const sections = [
  {
    id: "summary",
    label: "SUMMARY",
    state: "normal" as const,
    content:
      "The Q4 Strategy Review covered three major areas: market expansion timeline, pricing model revisions, and engineering resource allocation. Six stakeholders participated in a 47-minute session that resulted in three firm decisions and two items requiring follow-up analysis. The overall tone was aligned and action-oriented, with notable pushback from the mobile team on resource reallocation.",
  },
  {
    id: "decisions",
    label: "KEY DECISIONS",
    state: "selected" as const,
    content:
      "1. **APAC Launch Acceleration** — Timeline moved from Q2 to late Q1 2026, pending localization feasibility review by Dec 6. Owner: Sarah Chen.\n\n2. **Usage-Based Pricing** — Enterprise tier transitions from per-seat to usage-based model. 90-day grandfather clause for existing customers. Finance to model impact by EOW.\n\n3. **Engineering Headcount** — 4 backend engineers approved for real-time pipeline team, funded by deferred mobile budget.",
  },
  {
    id: "actions",
    label: "ACTION ITEMS",
    state: "streaming" as const,
    originalContent:
      "Sarah Chen — Complete APAC feasibility review (Due: Dec 6)\nMarcus Webb — Model usage-based pricing revenue impact (Due: Dec 8)\nDavid Park — Draft phased rollout proposal for Japan-first approach (Due: Dec 10)\nAlex Rivera — Prepare mobile metrics brief for January planning (Due: Jan 3)",
    streamingContent:
      "**Sarah Chen (VP Product)**\n• Complete APAC localization feasibility review — Due: Friday, Dec 6\n• Present go/no-go recommendation for accelerated launch at Monday standup\n\n**Marcus Webb (CFO)**\n• Model revenue impact of usage-based pricing transition — Due: End of week (Dec 8)\n• Prepare grandfather clause terms for legal review",
  },
  {
    id: "questions",
    label: "OPEN QUESTIONS",
    state: "normal" as const,
    content:
      "• Can the localization team realistically support the accelerated APAC timeline given current capacity?\n• What is the projected revenue impact of the 90-day grandfather clause on Q1 targets?\n• Should mobile deprioritization be time-boxed to one quarter or left open-ended?\n• Is a Japan-only phased rollout significantly less risky than the full APAC launch?",
  },
  {
    id: "risks",
    label: "RISKS FLAGGED",
    state: "normal" as const,
    content:
      "**High** — Localization team capacity may block accelerated APAC timeline (raised by David Park)\n**Medium** — Usage-based pricing transition could cause short-term revenue dip during migration window\n**Medium** — Mobile deprioritization may impact trial conversion if not revisited within one quarter\n**Low** — Engineering hiring timeline may slip if backend candidates remain scarce in current market",
  },
];

const refinementActions = [
  "Refine",
  "Expand",
  "Shorten",
  "Formalize",
  "Simplify",
  "Rephrase",
];

export function EditorPanel() {
  const [showPopover, setShowPopover] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeToolbar, setActiveToolbar] = useState<string | null>("Bold");
  const { isDark, colors } = useTheme();

  const separatorColor = colors.border;
  const sectionBg = isDark ? "rgba(26,29,46,0.4)" : "rgba(238,236,234,0.5)";
  const selectedBg = isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.06)";
  const selectedBorder = isDark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.15)";
  const selectedHighlight = isDark ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.12)";
  const streamingBg = isDark ? "rgba(99,102,241,0.05)" : "rgba(99,102,241,0.04)";
  const dimmedText = isDark ? "rgba(232,234,246,0.35)" : "rgba(26,25,22,0.35)";
  const dropdownBg = isDark ? colors.bgPanel : "#FFFFFF";
  const scrollbarColor = isDark ? `${colors.border} transparent` : `${colors.border} transparent`;
  const inactiveToolbar = colors.textMuted;
  const hoverToolbar = colors.textSecondary;
  const popoverBg = isDark ? colors.bgPanel : "#FFFFFF";

  const renderText = (text: string) =>
    text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} style={{ fontWeight: 600, color: colors.textPrimary }}>
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );

  return (
    <div className="flex flex-col h-full transition-colors duration-300"
      style={{ backgroundColor: colors.bgBase }}>
      {/* Top bar: title + actions */}
      <div className="px-2 sm:px-3 flex items-center gap-1.5 sm:gap-2 shrink-0 h-11"
        style={{ borderBottom: `1px solid ${colors.border}` }}>
        {/* Document title */}
        <input
          defaultValue="Q4 Strategy Review — Analysis"
          className="bg-transparent text-[12px] sm:text-[13px] outline-none min-w-0 flex-1 border-b border-transparent focus:border-[#6366F1]/50 transition-colors"
          style={{ fontWeight: 600, color: colors.textPrimary }}
        />

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* AI Refine button */}
          <button
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#6366F1]/40 text-[#6366F1] hover:bg-[#6366F1]/10 transition-all duration-160"
            style={{ boxShadow: "0 0 8px rgba(99,102,241,0.1)" }}
            data-onboarding="refine"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[11px]">AI Refine</span>
          </button>

          <div className="w-px h-4" style={{ backgroundColor: separatorColor }} />

          {/* Commit */}
          <button
            className="p-1.5 rounded-md transition-colors"
            style={{ color: inactiveToolbar }}
            onMouseEnter={(e) => e.currentTarget.style.color = hoverToolbar}
            onMouseLeave={(e) => e.currentTarget.style.color = inactiveToolbar}
            title="Commit"
          >
            <GitCommit className="w-3.5 h-3.5" />
          </button>

          {/* Export */}
          <div className="relative" data-onboarding="export">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1 px-2 py-1 rounded-md transition-colors"
              style={{
                color: colors.textPrimary,
                backgroundColor: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
                border: `1px solid ${isDark ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.2)"}`,
              }}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="text-[11px]">Export</span>
              <ChevronDown className="w-2.5 h-2.5" />
            </button>
            {showExportMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-36 rounded-lg py-1 shadow-xl z-[100]"
                style={{ backgroundColor: dropdownBg, border: `1px solid ${colors.border}` }}
              >
                {["PDF", "DOCX", "Notion", "Markdown"].map((format) => (
                  <button
                    key={format}
                    className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-[#6366F1]/10 transition-colors"
                    style={{ color: colors.textSecondary }}
                    onClick={() => setShowExportMenu(false)}
                  >
                    {format}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Formatting toolbar */}
      <div className="px-3 flex items-center gap-0.5 shrink-0 h-9 overflow-x-auto"
        style={{ scrollbarWidth: "none", borderBottom: `1px solid ${colors.border}` }}>
        {toolbarButtons.map((btn, i) =>
          btn === null ? (
            <div key={`sep-${i}`} className="w-px h-3.5 mx-0.5 shrink-0" style={{ backgroundColor: separatorColor }} />
          ) : (
            <button
              key={btn.label}
              onClick={() => setActiveToolbar(activeToolbar === btn.label ? null : btn.label)}
              className={`p-1 rounded shrink-0 transition-all duration-160 ${
                activeToolbar === btn.label
                  ? "bg-[#6366F1] text-white"
                  : ""
              }`}
              style={
                activeToolbar !== btn.label
                  ? { color: inactiveToolbar }
                  : undefined
              }
              onMouseEnter={(e) => {
                if (activeToolbar !== btn.label) e.currentTarget.style.color = hoverToolbar;
              }}
              onMouseLeave={(e) => {
                if (activeToolbar !== btn.label) e.currentTarget.style.color = inactiveToolbar;
              }}
              title={btn.label}
            >
              <btn.icon className="w-3.5 h-3.5" />
            </button>
          )
        )}
      </div>

      {/* Editor Content */}
      <div
        className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor,
          boxShadow: isDark ? "inset 0 1px 3px rgba(0,0,0,0.1)" : "inset 0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        {sections.map((section) => (
          <div key={section.id} className="relative">
            {/* Section label */}
            <div className="text-[10px] font-mono tracking-[0.15em] mb-2" style={{ color: colors.textMuted }}>
              {section.label}
            </div>

            {/* Normal state */}
            {section.state === "normal" && (
              <div
                className="text-[13px] leading-relaxed whitespace-pre-wrap rounded-lg p-3"
                style={{ backgroundColor: sectionBg, color: colors.textPrimary }}
              >
                {renderText(section.content)}
              </div>
            )}

            {/* Selected state with popover */}
            {section.state === "selected" && (
              <div className="relative">
                {/* Popover */}
                {showPopover && (
                  <div
                    className="absolute -top-12 left-0 sm:left-1/2 sm:-translate-x-1/2 z-20 flex items-center gap-0.5 rounded-lg p-1 shadow-xl animate-[fadeSlideUp_0.12s_ease-out] max-w-[calc(100vw-2rem)] overflow-x-auto"
                    style={{ backgroundColor: popoverBg, border: `1px solid ${colors.border}`, scrollbarWidth: "none" }}
                  >
                    {refinementActions.map((action) => (
                      <button
                        key={action}
                        className="px-2.5 py-1 rounded-md text-[10px] hover:bg-[#6366F1]/15 transition-colors whitespace-nowrap"
                        style={{ color: colors.textSecondary }}
                      >
                        {action}
                      </button>
                    ))}
                    <button
                      onClick={() => setShowPopover(false)}
                      className="p-1 rounded-md hover:bg-[#F43F5E]/15 hover:text-[#F43F5E] transition-colors ml-1"
                      style={{ color: colors.textMuted }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div
                  className="text-[13px] leading-relaxed whitespace-pre-wrap rounded-lg p-3"
                  style={{
                    backgroundColor: selectedBg,
                    border: `1px solid ${selectedBorder}`,
                    color: colors.textPrimary,
                    boxShadow: `inset 0 0 0 1px ${isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.05)"}`,
                  }}
                >
                  <span className="rounded-sm px-0.5" style={{ backgroundColor: selectedHighlight }}>
                    {renderText(section.content)}
                  </span>
                </div>
              </div>
            )}

            {/* Streaming state */}
            {section.state === "streaming" && (
              <div>
                <div className="rounded-lg p-3 border-l-2 border-l-[#6366F1]" style={{ backgroundColor: streamingBg }}>
                  {/* Original text (dimmed) */}
                  <div
                    className="text-[13px] leading-relaxed whitespace-pre-wrap mb-3"
                    style={{
                      color: dimmedText,
                      textDecoration: "line-through",
                      textDecorationColor: isDark ? "rgba(92,100,144,0.2)" : "rgba(140,137,128,0.2)",
                    }}
                  >
                    {section.originalContent}
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-px" style={{ backgroundColor: "rgba(99,102,241,0.2)" }} />
                    <span className="text-[9px] font-mono text-[#6366F1]">AI Replacement</span>
                    <div className="flex-1 h-px" style={{ backgroundColor: "rgba(99,102,241,0.2)" }} />
                  </div>

                  {/* Streaming replacement */}
                  <div
                    className="text-[13px] leading-relaxed whitespace-pre-wrap"
                    style={{
                      color: colors.textPrimary,
                      textDecoration: "underline",
                      textDecorationColor: "rgba(99,102,241,0.3)",
                      textUnderlineOffset: "3px",
                    }}
                  >
                    {renderText(section.streamingContent || "")}
                    <span className="inline-block w-0.5 h-3.5 bg-[#6366F1] ml-0.5 animate-pulse" />
                  </div>
                </div>

                {/* Accept / Reject */}
                <div className="flex items-center gap-2 mt-2 justify-end">
                  <button className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/25 transition-colors text-[11px]">
                    <Check className="w-3 h-3" />
                    Accept
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#F43F5E]/15 text-[#F43F5E] hover:bg-[#F43F5E]/25 transition-colors text-[11px]">
                    <X className="w-3 h-3" />
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer status */}
      <div className="h-6 px-4 flex items-center justify-between shrink-0" style={{ borderTop: `1px solid ${colors.border}` }}>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>5 sections</span>
          <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>1,247 words</span>
          <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>~5 min read</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-[#10B981]">Saved</span>
          <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>v3.2</span>
        </div>
      </div>
    </div>
  );
}