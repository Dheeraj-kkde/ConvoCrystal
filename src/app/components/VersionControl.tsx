import { useState } from "react";
import {
  X,
  History,
  ChevronDown,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "./ThemeContext";

interface EditVersion {
  id: string;
  hash: string;
  description: string;
  author: string;
  initials: string;
  time: string;
  additions: number;
  deletions: number;
  isLatest?: boolean;
  source?: "user" | "ai";
}

const versions: EditVersion[] = [
  {
    id: "1",
    hash: "a3f8c1d",
    description: "Refine action items with AI-suggested owners",
    author: "Jane Doe",
    initials: "JD",
    time: "12 min ago",
    additions: 24,
    deletions: 8,
    isLatest: true,
    source: "user",
  },
  {
    id: "2",
    hash: "b7e2f09",
    description: "Add risk assessment section from chat analysis",
    author: "Jane Doe",
    initials: "JD",
    time: "47 min ago",
    additions: 42,
    deletions: 3,
    source: "user",
  },
  {
    id: "3",
    hash: "c1d4a82",
    description: "Merge feature/expanded-summary into main",
    author: "Jane Doe",
    initials: "JD",
    time: "2h ago",
    additions: 0,
    deletions: 0,
    source: "user",
  },
  {
    id: "4",
    hash: "d9f3b15",
    description: "Expand summary with participant context",
    author: "Alex R.",
    initials: "AR",
    time: "2h ago",
    additions: 31,
    deletions: 12,
    source: "ai",
  },
  {
    id: "5",
    hash: "e5a7c28",
    description: "Extract key decisions from transcript",
    author: "Jane Doe",
    initials: "JD",
    time: "3h ago",
    additions: 56,
    deletions: 0,
    source: "user",
  },
  {
    id: "6",
    hash: "f2b8d41",
    description: "Initial analysis generation",
    author: "ConvoCrystal AI",
    initials: "CC",
    time: "3h ago",
    additions: 128,
    deletions: 0,
    source: "ai",
  },
];

const diffLines = [
  { type: "context", numOld: 14, numNew: 14, text: "## Action Items" },
  { type: "context", numOld: 15, numNew: 15, text: "" },
  { type: "removed", numOld: 16, numNew: null, text: "- Sarah Chen — Complete APAC feasibility review (Due: Dec 6)" },
  { type: "removed", numOld: 17, numNew: null, text: "- Marcus Webb — Model usage-based pricing (Due: Dec 8)" },
  { type: "removed", numOld: 18, numNew: null, text: "- David Park — Draft phased rollout proposal (Due: Dec 10)" },
  { type: "added", numOld: null, numNew: 16, text: "**Sarah Chen (VP Product)**" },
  { type: "added", numOld: null, numNew: 17, text: "- Complete APAC localization feasibility review — Due: Friday, Dec 6" },
  { type: "added", numOld: null, numNew: 18, text: "- Present go/no-go recommendation at Monday standup" },
  { type: "added", numOld: null, numNew: 19, text: "" },
  { type: "added", numOld: null, numNew: 20, text: "**Marcus Webb (CFO)**" },
  { type: "added", numOld: null, numNew: 21, text: "- Model revenue impact of usage-based pricing — Due: End of week" },
  { type: "added", numOld: null, numNew: 22, text: "- Prepare grandfather clause terms for legal review" },
  { type: "added", numOld: null, numNew: 23, text: "" },
  { type: "added", numOld: null, numNew: 24, text: "**David Park (Eng Lead)**" },
  { type: "added", numOld: null, numNew: 25, text: "- Draft phased rollout proposal for Japan-first — Due: Dec 10" },
  { type: "context", numOld: 19, numNew: 26, text: "" },
  { type: "context", numOld: 20, numNew: 27, text: "## Open Questions" },
];

interface VersionControlProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VersionControl({ isOpen, onClose }: VersionControlProps) {
  const [selectedVersion, setSelectedVersion] = useState<string>("1");
  const [diffMode, setDiffMode] = useState<"split" | "unified">("unified");
  const [showRestore, setShowRestore] = useState(false);
  const { isDark, colors } = useTheme();

  if (!isOpen) return null;

  const selected = versions.find((v) => v.id === selectedVersion);

  // Theme colors
  const bg = isDark ? "#0B0C10" : "#F7F6F3";
  const panelBg = isDark ? "#1A1D2E" : "#FFFFFF";
  const borderColor = isDark ? "#2A2D42" : "#E2E0DB";
  const textPrimary = isDark ? "#E8EAF6" : "#1A1916";
  const textSecondary = isDark ? "#9BA3C8" : "#57554F";
  const textMuted = isDark ? "#5C6490" : "#928F87";
  const hashBg = isDark ? "#1A1D2E" : "#EDEBE8";
  const hashBorder = isDark ? "#2A2D42" : "#D9D6D0";
  const hashText = isDark ? "#9BA3C8" : "#57554F";
  const selectedBg = isDark ? "rgba(92,108,245,0.1)" : "rgba(92,108,245,0.08)";
  const hoverBg = isDark ? "#1A1D2E" : "#F0EFEC";
  const diffBg = isDark ? "#0B0C10" : "#FAFAF8";
  const diffHeaderBg = isDark ? "rgba(26,29,46,0.5)" : "rgba(237,235,232,0.5)";
  const lineNumColor = isDark ? "rgba(92,100,144,0.5)" : "rgba(146,143,135,0.5)";
  const lineNumBorder = isDark ? "rgba(42,45,66,0.3)" : "rgba(217,214,208,0.5)";
  const contextTextColor = isDark ? "#9BA3C8" : "#57554F";
  const removedBg = isDark ? "rgba(244,63,94,0.06)" : "rgba(244,63,94,0.08)";
  const removedText = isDark ? "rgba(244,63,94,0.8)" : "#DC2626";
  const addedBg = isDark ? "rgba(16,185,129,0.06)" : "rgba(16,185,129,0.08)";
  const addedText = isDark ? "rgba(16,185,129,0.8)" : "#059669";
  const restoreBannerBg = isDark ? "rgba(26,29,46,0.5)" : "rgba(237,235,232,0.5)";
  const dialogBg = isDark ? "#1A1D2E" : "#FFFFFF";
  const inputBg = isDark ? "#0B0C10" : "#F7F6F3";

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Full screen modal */}
      <div
        className="relative w-full h-full flex flex-col m-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          backgroundColor: bg,
          border: `1px solid ${borderColor}`,
          animation: "modalSlideUp 0.28s ease-out",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 sm:px-5 py-3 shrink-0"
          style={{ borderBottom: `1px solid ${borderColor}` }}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <History className="w-4 h-4 shrink-0" style={{ color: colors.crystal }} />
            <span className="text-[13px] shrink-0" style={{ fontWeight: 600, color: textPrimary }}>
              Version History
            </span>
            <span className="text-[12px] truncate hidden sm:inline" style={{ color: textSecondary }}>
              Q4 Strategy Review — Analysis
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Document version label */}
            <div className="relative">
              <button
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition-colors"
                style={{
                  border: `1px solid ${borderColor}`,
                  color: textSecondary,
                }}
              >
                <History className="w-3 h-3" />
                main
                <ChevronDown className="w-2.5 h-2.5" />
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-[#F43F5E]/15 hover:text-[#F43F5E] transition-colors"
              style={{ color: textMuted }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Version timeline */}
          <div
            className="md:w-80 flex flex-col shrink-0 overflow-hidden max-h-[180px] md:max-h-none"
            style={{ borderRight: undefined }}
          >
            <div className="px-4 py-2 shrink-0" style={{ borderBottom: `1px solid ${borderColor}` }}>
              <span className="text-[9px] font-mono tracking-wider" style={{ color: textMuted }}>
                EDIT HISTORY
              </span>
            </div>
            <div
              className="flex-1 overflow-y-auto"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: `${borderColor} transparent`,
                borderBottom: undefined,
              }}
            >
              {versions.map((version, i) => {
                const isSelected = selectedVersion === version.id;
                const dotColor =
                  version.source === "ai"
                    ? colors.crystal
                    : version.isLatest
                    ? "#10B981"
                    : colors.crystal;

                return (
                  <button
                    key={version.id}
                    onClick={() => setSelectedVersion(version.id)}
                    className="w-full text-left px-3 py-3 transition-colors relative"
                    style={{
                      borderBottom: `1px solid ${isDark ? "rgba(42,45,66,0.5)" : "rgba(217,214,208,0.5)"}`,
                      backgroundColor: isSelected ? selectedBg : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = hoverBg;
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {/* Simple timeline */}
                    <div className="absolute left-3 top-0 bottom-0 w-6 flex flex-col items-center">
                      {i > 0 && (
                        <div
                          className="w-px flex-1"
                          style={{ backgroundColor: isDark ? "rgba(92,108,245,0.2)" : "rgba(92,108,245,0.15)" }}
                        />
                      )}
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: dotColor }}
                      />
                      {i < versions.length - 1 && (
                        <div
                          className="w-px flex-1"
                          style={{ backgroundColor: isDark ? "rgba(92,108,245,0.2)" : "rgba(92,108,245,0.15)" }}
                        />
                      )}
                    </div>

                    <div className="ml-8">
                      {/* Hash + HEAD badge */}
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: hashBg,
                            color: hashText,
                            border: `1px solid ${hashBorder}`,
                          }}
                        >
                          {version.hash}
                        </span>
                        {version.isLatest && (
                          <span className="text-[8px] font-mono px-1 py-0.5 rounded" style={{ backgroundColor: `${colors.crystal}15`, color: colors.crystal }}>
                            HEAD
                          </span>
                        )}
                      </div>
                      {/* Description */}
                      <div className="text-[11px] mb-1" style={{ fontWeight: 500, color: textPrimary }}>
                        {version.description}
                      </div>
                      {/* Author, time, changes */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white"
                            style={{
                              backgroundColor: version.source === "ai" ? colors.crystal : colors.ice,
                            }}
                          >
                            {version.initials}
                          </div>
                          <span className="text-[9px]" style={{ color: textMuted }}>
                            {version.author}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono" style={{ color: textMuted }}>
                          {version.time}
                        </span>
                        {(version.additions > 0 || version.deletions > 0) && (
                          <span className="text-[9px] font-mono">
                            <span className="text-[#10B981]">+{version.additions}</span>{" "}
                            <span className="text-[#F43F5E]">-{version.deletions}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Separator for md+ */}
          <div className="hidden md:block w-px shrink-0" style={{ backgroundColor: borderColor }} />
          {/* Separator for mobile */}
          <div className="md:hidden h-px shrink-0" style={{ backgroundColor: borderColor }} />

          {/* Right: Diff view */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Diff header */}
            <div
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 sm:px-4 py-2 shrink-0"
              style={{ borderBottom: `1px solid ${borderColor}` }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono" style={{ color: textMuted }}>
                  Comparing{" "}
                  <span style={{ color: textSecondary }}>{selected?.hash || "..."}</span> to parent
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-md overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
                  <button
                    onClick={() => setDiffMode("split")}
                    className="px-2.5 py-1 text-[9px] font-mono transition-colors"
                    style={{
                      backgroundColor: diffMode === "split" ? "rgba(92,108,245,0.15)" : "transparent",
                      color: diffMode === "split" ? colors.crystal : textMuted,
                    }}
                  >
                    Split
                  </button>
                  <button
                    onClick={() => setDiffMode("unified")}
                    className="px-2.5 py-1 text-[9px] font-mono transition-colors"
                    style={{
                      borderLeft: `1px solid ${borderColor}`,
                      backgroundColor: diffMode === "unified" ? "rgba(92,108,245,0.15)" : "transparent",
                      color: diffMode === "unified" ? colors.crystal : textMuted,
                    }}
                  >
                    Unified
                  </button>
                </div>
                <button
                  onClick={() => setShowRestore(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md text-white text-[10px] transition-colors"
                  style={{ fontWeight: 500, backgroundColor: colors.crystal }}
                >
                  <RotateCcw className="w-3 h-3" />
                  Restore
                </button>
              </div>
            </div>

            {/* Document path */}
            <div className="px-4 py-1.5 shrink-0" style={{ borderBottom: `1px solid ${borderColor}`, backgroundColor: diffHeaderBg }}>
              <span className="text-[10px] font-mono" style={{ color: textSecondary }}>
                analysis/q4-strategy-review.md
              </span>
            </div>

            {/* Diff content */}
            <div
              className="flex-1 overflow-y-auto font-mono text-[11px]"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: `${borderColor} transparent`,
                backgroundColor: diffBg,
              }}
            >
              {diffMode === "unified" ? (
                /* Unified diff view */
                diffLines.map((line, i) => (
                  <div
                    key={i}
                    className="flex"
                    style={{
                      backgroundColor:
                        line.type === "removed"
                          ? removedBg
                          : line.type === "added"
                          ? addedBg
                          : "transparent",
                    }}
                  >
                    {/* Line numbers */}
                    <div
                      className="w-10 text-right pr-2 py-0.5 select-none shrink-0"
                      style={{ color: lineNumColor, borderRight: `1px solid ${lineNumBorder}` }}
                    >
                      {line.numOld ?? ""}
                    </div>
                    <div
                      className="w-10 text-right pr-2 py-0.5 select-none shrink-0"
                      style={{ color: lineNumColor, borderRight: `1px solid ${lineNumBorder}` }}
                    >
                      {line.numNew ?? ""}
                    </div>
                    {/* Symbol */}
                    <div
                      className="w-5 text-center py-0.5 select-none shrink-0"
                      style={{
                        color:
                          line.type === "removed"
                            ? "#F43F5E"
                            : line.type === "added"
                            ? "#10B981"
                            : "transparent",
                      }}
                    >
                      {line.type === "removed" ? "−" : line.type === "added" ? "+" : " "}
                    </div>
                    {/* Content */}
                    <div
                      className="flex-1 py-0.5 pl-2"
                      style={{
                        color:
                          line.type === "removed"
                            ? removedText
                            : line.type === "added"
                            ? addedText
                            : contextTextColor,
                      }}
                    >
                      {line.text || "\u00A0"}
                    </div>
                  </div>
                ))
              ) : (
                /* Split diff view */
                <div className="flex h-full">
                  {/* Old version */}
                  <div className="flex-1 overflow-y-auto" style={{ borderRight: `1px solid ${borderColor}` }}>
                    {diffLines
                      .filter((l) => l.type !== "added")
                      .map((line, i) => (
                        <div
                          key={i}
                          className="flex"
                          style={{
                            backgroundColor: line.type === "removed" ? removedBg : "transparent",
                          }}
                        >
                          <div
                            className="w-10 text-right pr-2 py-0.5 select-none shrink-0"
                            style={{ color: lineNumColor, borderRight: `1px solid ${lineNumBorder}` }}
                          >
                            {line.numOld ?? ""}
                          </div>
                          <div
                            className="w-5 text-center py-0.5 select-none shrink-0"
                            style={{ color: line.type === "removed" ? "#F43F5E" : "transparent" }}
                          >
                            {line.type === "removed" ? "−" : " "}
                          </div>
                          <div
                            className="flex-1 py-0.5 pl-2"
                            style={{ color: line.type === "removed" ? removedText : contextTextColor }}
                          >
                            {line.text || "\u00A0"}
                          </div>
                        </div>
                      ))}
                  </div>
                  {/* New version */}
                  <div className="flex-1 overflow-y-auto">
                    {diffLines
                      .filter((l) => l.type !== "removed")
                      .map((line, i) => (
                        <div
                          key={i}
                          className="flex"
                          style={{
                            backgroundColor: line.type === "added" ? addedBg : "transparent",
                          }}
                        >
                          <div
                            className="w-10 text-right pr-2 py-0.5 select-none shrink-0"
                            style={{ color: lineNumColor, borderRight: `1px solid ${lineNumBorder}` }}
                          >
                            {line.numNew ?? ""}
                          </div>
                          <div
                            className="w-5 text-center py-0.5 select-none shrink-0"
                            style={{ color: line.type === "added" ? "#10B981" : "transparent" }}
                          >
                            {line.type === "added" ? "+" : " "}
                          </div>
                          <div
                            className="flex-1 py-0.5 pl-2"
                            style={{ color: line.type === "added" ? addedText : contextTextColor }}
                          >
                            {line.text || "\u00A0"}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Restore info banner */}
            <div
              className="px-4 py-2 shrink-0"
              style={{ borderTop: `1px solid ${borderColor}`, backgroundColor: restoreBannerBg }}
            >
              <div className="flex items-center gap-2 text-[10px] text-[#F59E0B]">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Restoring will auto-backup current state to a new version before applying changes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Restore Confirmation Dialog */}
      {showRestore && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRestore(false)} />
          <div
            className="relative w-full max-w-md rounded-xl p-6 shadow-2xl mx-4"
            style={{
              backgroundColor: dialogBg,
              border: `1px solid ${borderColor}`,
              animation: "scaleIn 0.2s ease-out",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#F59E0B]/15 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div>
                <h3 className="text-[14px]" style={{ fontWeight: 600, color: textPrimary }}>
                  Restore to this version?
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: textMuted }}>
                  Your current document will be saved as version{" "}
                  <span className="font-mono" style={{ color: textSecondary }}>
                    backup/{selected?.hash}
                  </span>{" "}
                  before restoring
                </p>
              </div>
            </div>
            <div className="mb-4">
              <label
                className="text-[10px] font-mono mb-1.5 block tracking-wider"
                style={{ color: textMuted }}
              >
                VERSION NOTE
              </label>
              <input
                defaultValue={`Restore to ${selected?.hash}: ${selected?.description}`}
                className="w-full rounded-md px-3 py-2 text-[12px] outline-none transition-colors"
                style={{
                  backgroundColor: inputBg,
                  border: `1px solid ${borderColor}`,
                  color: textPrimary,
                }}
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowRestore(false)}
                className="px-4 py-1.5 rounded-md text-[11px] transition-colors"
                style={{ border: `1px solid ${borderColor}`, color: textSecondary }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowRestore(false)}
                className="px-4 py-1.5 rounded-md text-white text-[11px] transition-colors"
                style={{ fontWeight: 500, backgroundColor: colors.crystal }}
              >
                Confirm Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}