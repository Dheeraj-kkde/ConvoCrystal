import { useState, useCallback } from "react";
import {
  X, History, ChevronDown, RotateCcw, AlertTriangle, Loader2,
  GitBranch, Check,
} from "lucide-react";
import { useTheme } from "./ThemeContext";
import { useToast } from "./ToastSystem";
import {
  useCommitsQuery,
  useDiffQuery,
  useRestoreMutation,
  type CommitNode,
  type DiffLine,
  type DiffResult,
} from "../lib/queries";

// ─── Local types ─────────────────────────────────────────────────

type RestoreState = "idle" | "confirming" | "restoring" | "restored";

// ─── Commit Graph SVG ────────────────────────────────────────────

function CommitGraphSVG({ commits: nodes, selectedId }: { commits: CommitNode[]; selectedId: string }) {
  const rowH = 56;
  const svgH = nodes.length * rowH;
  const mainX = 12;
  const branchX = 28;

  return (
    <svg width="40" height={svgH} className="absolute left-3 top-0 shrink-0" style={{ pointerEvents: "none" }}>
      {nodes.map((node, i) => {
        const y = i * rowH + rowH / 2;
        const isMain = node.branch === "main";
        const cx = isMain ? mainX : branchX;
        const prevNode = i > 0 ? nodes[i - 1] : null;
        const prevIsMain = prevNode ? prevNode.branch === "main" : true;
        const prevX = prevIsMain ? mainX : branchX;
        const prevY = (i - 1) * rowH + rowH / 2;
        const isSelected = node.id === selectedId;
        const isMerge = node.description.toLowerCase().includes("merge");

        return (
          <g key={node.id}>
            {i > 0 && (
              <line x1={prevX} y1={prevY} x2={cx} y2={y}
                stroke={isMain ? "rgba(92,108,245,0.3)" : "rgba(0,201,214,0.3)"}
                strokeWidth={1.5} />
            )}
            {!isMain && i > 0 && prevIsMain && (
              <line x1={mainX} y1={prevY} x2={branchX} y2={y}
                stroke="rgba(0,201,214,0.25)" strokeWidth={1} strokeDasharray="3 2" />
            )}
            {isMerge && (
              <line x1={branchX} y1={y - 4} x2={mainX} y2={y}
                stroke="rgba(0,201,214,0.3)" strokeWidth={1} />
            )}
            <circle cx={cx} cy={y} r={isSelected ? 5 : 4}
              fill={node.source === "ai" ? "#5C6CF5" : node.isLatest ? "#10B981" : "#5C6CF5"}
              stroke={isSelected ? "#FFFFFF" : "none"} strokeWidth={isSelected ? 1.5 : 0}
              opacity={isSelected ? 1 : 0.8} />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────

interface VersionControlProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VersionControl({ isOpen, onClose }: VersionControlProps) {
  const [selectedVersion, setSelectedVersion] = useState<string>("1");
  const [diffMode, setDiffMode] = useState<"split" | "unified">("unified");
  const [restoreState, setRestoreState] = useState<RestoreState>("idle");
  const [restoreNote, setRestoreNote] = useState("");
  const [currentBranch] = useState("main");
  const { isDark, colors } = useTheme();
  const { addToast } = useToast();

  // Hardcoded document ID — will be dynamic when routing supports doc params
  const documentId = "doc_q4_strategy";

  // React Query — cached commit graph & diff
  const { data: commits = [], isLoading: commitsLoading } = useCommitsQuery(documentId);
  const selectedCommit = commits.find((v) => v.id === selectedVersion);
  const { data: diffData } = useDiffQuery(
    documentId,
    selectedCommit ? selectedCommit.hash : null
  );
  const diffLines = diffData ? diffData.lines : [];
  const diffPath = diffData ? diffData.path : "analysis/q4-strategy-review.md";

  // Restore mutation via react-query
  const restoreMutation = useRestoreMutation(documentId);

  const selected = selectedCommit;

  // ─── Restore flow (matches architecture spec) ──────────────────

  const handleRestoreBegin = useCallback(() => {
    setRestoreNote(`Restore to ${selected?.hash}: ${selected?.description}`);
    setRestoreState("confirming");
  }, [selected]);

  const handleRestoreConfirm = useCallback(async () => {
    if (!selected) return;
    setRestoreState("restoring");
    try {
      const result = await restoreMutation.mutateAsync({
        commitHash: selected.hash,
        note: restoreNote,
      });
      setRestoreState("restored");
      addToast({
        variant: "success",
        title: "Version restored",
        message: `Restored to ${selected.hash}. Backup saved to branch "${result.backupBranch}".`,
      });
      setTimeout(() => setRestoreState("idle"), 2000);
    } catch {
      setRestoreState("idle");
      addToast({ variant: "error", title: "Restore failed", message: "Please try again." });
    }
  }, [selected, restoreNote, restoreMutation, addToast]);

  if (!isOpen) return null;

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

  const diffStats = { added: diffLines.filter((l) => l.type === "added").length, removed: diffLines.filter((l) => l.type === "removed").length };

  return (
    <div className="fixed inset-0 z-[100] flex">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full h-full flex flex-col m-2 sm:m-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: bg, border: `1px solid ${borderColor}`, animation: "modalSlideUp 0.28s ease-out" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-3 shrink-0" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <History className="w-4 h-4 shrink-0" style={{ color: colors.crystal }} />
            <span className="text-[13px] shrink-0" style={{ fontWeight: 600, color: textPrimary }}>Version History</span>
            <span className="text-[12px] truncate hidden sm:inline" style={{ color: textSecondary }}>Q4 Strategy Review</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px]"
              style={{ border: `1px solid ${borderColor}`, color: textSecondary }}>
              <GitBranch className="w-3 h-3" />
              {currentBranch}
            </div>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-[#F43F5E]/15 transition-colors" style={{ color: textMuted }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Timeline with SVG graph */}
          <div className="md:w-80 flex flex-col shrink-0 overflow-hidden max-h-[35vh] md:max-h-none">
            <div className="px-4 py-2 shrink-0 flex items-center justify-between" style={{ borderBottom: `1px solid ${borderColor}` }}>
              <span className="text-[9px] font-mono tracking-wider" style={{ color: textMuted }}>COMMIT HISTORY</span>
              <span className="text-[9px] font-mono" style={{ color: textMuted }}>{commits.length} commits</span>
            </div>
            <div className="flex-1 overflow-y-auto relative" style={{ scrollbarWidth: "thin", scrollbarColor: `${borderColor} transparent` }}>
              <CommitGraphSVG commits={commits} selectedId={selectedVersion} />
              {commits.map((version) => {
                const isSelected = selectedVersion === version.id;
                return (
                  <button key={version.id} onClick={() => setSelectedVersion(version.id)}
                    className="w-full text-left pl-12 pr-3 py-3 transition-colors relative"
                    style={{ borderBottom: `1px solid ${isDark ? "rgba(42,45,66,0.5)" : "rgba(217,214,208,0.5)"}`, backgroundColor: isSelected ? selectedBg : "transparent" }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = hoverBg; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"; }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: hashBg, color: hashText, border: `1px solid ${hashBorder}` }}>{version.hash}</span>
                      {version.isLatest && <span className="text-[8px] font-mono px-1 py-0.5 rounded" style={{ backgroundColor: `${colors.crystal}15`, color: colors.crystal }}>HEAD</span>}
                      {version.branch !== "main" && <span className="text-[8px] font-mono px-1 py-0.5 rounded" style={{ backgroundColor: `${colors.ice}10`, color: colors.ice }}>{version.branch}</span>}
                    </div>
                    <div className="text-[11px] mb-1" style={{ fontWeight: 500, color: textPrimary }}>{version.description}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white"
                          style={{ backgroundColor: version.source === "ai" ? colors.crystal : colors.ice }}>{version.initials}</div>
                        <span className="text-[9px]" style={{ color: textMuted }}>{version.author}</span>
                      </div>
                      <span className="text-[9px] font-mono" style={{ color: textMuted }}>{version.time}</span>
                      {(version.additions > 0 || version.deletions > 0) && (
                        <span className="text-[9px] font-mono">
                          <span className="text-[#10B981]">+{version.additions}</span>{" "}
                          <span className="text-[#F43F5E]">-{version.deletions}</span>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden md:block w-px shrink-0" style={{ backgroundColor: borderColor }} />
          <div className="md:hidden h-px shrink-0" style={{ backgroundColor: borderColor }} />

          {/* Right: Diff view */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 sm:px-4 py-2 shrink-0"
              style={{ borderBottom: `1px solid ${borderColor}` }}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono" style={{ color: textMuted }}>
                  Comparing <span style={{ color: textSecondary }}>{selected?.hash || "..."}</span> to parent
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${colors.emerald}10`, color: colors.emerald }}>+{diffStats.added}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${colors.rose}10`, color: colors.rose }}>-{diffStats.removed}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-md overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
                  {(["split", "unified"] as const).map((mode) => (
                    <button key={mode} onClick={() => setDiffMode(mode)}
                      className="px-2.5 py-1 text-[9px] font-mono transition-colors"
                      style={{
                        backgroundColor: diffMode === mode ? "rgba(92,108,245,0.15)" : "transparent",
                        color: diffMode === mode ? colors.crystal : textMuted,
                        borderLeft: mode === "unified" ? `1px solid ${borderColor}` : undefined,
                      }}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
                <button onClick={handleRestoreBegin} disabled={selected?.isLatest || restoreState === "restoring"}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md text-white text-[10px] transition-colors disabled:opacity-50"
                  style={{ fontWeight: 500, backgroundColor: colors.crystal }}>
                  {restoreState === "restoring" ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                  {restoreState === "restoring" ? "Restoring..." : restoreState === "restored" ? "Restored ✓" : "Restore"}
                </button>
              </div>
            </div>

            <div className="px-4 py-1.5 shrink-0" style={{ borderBottom: `1px solid ${borderColor}`, backgroundColor: diffHeaderBg }}>
              <span className="text-[10px] font-mono" style={{ color: textSecondary }}>{diffPath}</span>
            </div>

            {/* Diff content */}
            <div className="flex-1 overflow-y-auto font-mono text-[11px]"
              style={{ scrollbarWidth: "thin", scrollbarColor: `${borderColor} transparent`, backgroundColor: diffBg }}>
              {diffMode === "unified" ? (
                diffLines.map((line, i) => (
                  <div key={i} className="flex" style={{
                    backgroundColor: line.type === "removed" ? removedBg : line.type === "added" ? addedBg : "transparent",
                  }}>
                    <div className="w-10 text-right pr-2 py-0.5 select-none shrink-0" style={{ color: lineNumColor, borderRight: `1px solid ${lineNumBorder}` }}>{line.numOld ?? ""}</div>
                    <div className="w-10 text-right pr-2 py-0.5 select-none shrink-0" style={{ color: lineNumColor, borderRight: `1px solid ${lineNumBorder}` }}>{line.numNew ?? ""}</div>
                    <div className="w-5 text-center py-0.5 select-none shrink-0" style={{ color: line.type === "removed" ? "#F43F5E" : line.type === "added" ? "#10B981" : "transparent" }}>
                      {line.type === "removed" ? "−" : line.type === "added" ? "+" : " "}
                    </div>
                    <div className="flex-1 py-0.5 pl-2" style={{ color: line.type === "removed" ? removedText : line.type === "added" ? addedText : contextTextColor }}>
                      {line.text || "\u00A0"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-full">
                  <div className="flex-1 overflow-y-auto" style={{ borderRight: `1px solid ${borderColor}` }}>
                    {diffLines.filter((l) => l.type !== "added").map((line, i) => (
                      <div key={i} className="flex" style={{ backgroundColor: line.type === "removed" ? removedBg : "transparent" }}>
                        <div className="w-10 text-right pr-2 py-0.5 select-none shrink-0" style={{ color: lineNumColor, borderRight: `1px solid ${lineNumBorder}` }}>{line.numOld ?? ""}</div>
                        <div className="w-5 text-center py-0.5 select-none shrink-0" style={{ color: line.type === "removed" ? "#F43F5E" : "transparent" }}>{line.type === "removed" ? "−" : " "}</div>
                        <div className="flex-1 py-0.5 pl-2" style={{ color: line.type === "removed" ? removedText : contextTextColor }}>{line.text || "\u00A0"}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {diffLines.filter((l) => l.type !== "removed").map((line, i) => (
                      <div key={i} className="flex" style={{ backgroundColor: line.type === "added" ? addedBg : "transparent" }}>
                        <div className="w-10 text-right pr-2 py-0.5 select-none shrink-0" style={{ color: lineNumColor, borderRight: `1px solid ${lineNumBorder}` }}>{line.numNew ?? ""}</div>
                        <div className="w-5 text-center py-0.5 select-none shrink-0" style={{ color: line.type === "added" ? "#10B981" : "transparent" }}>{line.type === "added" ? "+" : " "}</div>
                        <div className="flex-1 py-0.5 pl-2" style={{ color: line.type === "added" ? addedText : contextTextColor }}>{line.text || "\u00A0"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Restore info banner */}
            <div className="px-4 py-2 shrink-0" style={{ borderTop: `1px solid ${borderColor}`, backgroundColor: restoreBannerBg }}>
              <div className="flex items-center gap-2 text-[10px] text-[#F59E0B]">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Restoring will auto-backup current state to a new branch before applying changes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Restore Confirmation Dialog */}
      {restoreState === "confirming" && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRestoreState("idle")} />
          <div className="relative w-full max-w-md rounded-xl p-6 shadow-2xl mx-4"
            style={{ backgroundColor: dialogBg, border: `1px solid ${borderColor}`, animation: "scaleIn 0.2s ease-out" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#F59E0B]/15 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div>
                <h3 className="text-[14px]" style={{ fontWeight: 600, color: textPrimary }}>Restore to this version?</h3>
                <p className="text-[11px] mt-0.5" style={{ color: textMuted }}>
                  Current state saved to <span className="font-mono" style={{ color: textSecondary }}>backup/{selected?.hash}</span>
                </p>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-[10px] font-mono mb-1.5 block tracking-wider" style={{ color: textMuted }}>VERSION NOTE</label>
              <input value={restoreNote} onChange={(e) => setRestoreNote(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-[12px] outline-none transition-colors"
                style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}`, color: textPrimary }} />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setRestoreState("idle")}
                className="px-4 py-1.5 rounded-md text-[11px] transition-colors"
                style={{ border: `1px solid ${borderColor}`, color: textSecondary }}>Cancel</button>
              <button onClick={handleRestoreConfirm}
                className="px-4 py-1.5 rounded-md text-white text-[11px] transition-colors"
                style={{ fontWeight: 500, backgroundColor: colors.crystal }}>Confirm Restore</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}