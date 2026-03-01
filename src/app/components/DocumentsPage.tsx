import { useState } from "react";
import {
  FileText,
  Upload,
  Download,
  Search,
  Filter,
  Grid3x3,
  List,
  MoreHorizontal,
  Eye,
  Trash2,
  ArrowUpDown,
  FileAudio,
  FileVideo,
  File,
  ChevronDown,
  Plus,
  FolderOpen,
} from "lucide-react";
import { useTheme } from "./ThemeContext";
import { useUser } from "./UserContext";

type DocStatus = "processed" | "processing" | "failed";
type DocDirection = "uploaded" | "exported";

interface Document {
  id: string;
  name: string;
  type: "transcript" | "analysis" | "summary" | "audio" | "video" | "pdf" | "docx";
  direction: DocDirection;
  status: DocStatus;
  format: string;
  size: string;
  date: string;
  confidence?: number;
  speakers?: number;
  versions: number;
}

const documents: Document[] = [
  { id: "1", name: "Q4 Strategy Review", type: "transcript", direction: "uploaded", status: "processed", format: "MP4", size: "248 MB", date: "2h ago", confidence: 94, speakers: 6, versions: 4 },
  { id: "2", name: "Q4 Strategy Review — Analysis", type: "analysis", direction: "exported", status: "processed", format: "PDF", size: "1.2 MB", date: "12 min ago", versions: 2 },
  { id: "3", name: "Product Sync — Sprint 14", type: "transcript", direction: "uploaded", status: "processed", format: "M4A", size: "86 MB", date: "5h ago", confidence: 88, speakers: 4, versions: 3 },
  { id: "4", name: "Product Sync — Summary", type: "summary", direction: "exported", status: "processed", format: "DOCX", size: "340 KB", date: "4h ago", versions: 1 },
  { id: "5", name: "Customer Discovery — Acme", type: "transcript", direction: "uploaded", status: "processed", format: "WAV", size: "420 MB", date: "1d ago", confidence: 91, speakers: 3, versions: 2 },
  { id: "6", name: "Board Meeting — Feb", type: "transcript", direction: "uploaded", status: "processed", format: "MP4", size: "1.8 GB", date: "2d ago", confidence: 76, speakers: 8, versions: 5 },
  { id: "7", name: "Board Meeting — Action Items", type: "analysis", direction: "exported", status: "processed", format: "PDF", size: "890 KB", date: "2d ago", versions: 1 },
  { id: "8", name: "1:1 — Engineering Lead", type: "transcript", direction: "uploaded", status: "processed", format: "M4A", size: "42 MB", date: "3d ago", confidence: 97, speakers: 2, versions: 1 },
  { id: "9", name: "Design Critique — v2.3", type: "transcript", direction: "uploaded", status: "processing", format: "MP4", size: "620 MB", date: "4h ago", speakers: 5, versions: 0 },
  { id: "10", name: "Weekly Standup — W9", type: "audio", direction: "uploaded", status: "failed", format: "OGG", size: "28 MB", date: "5d ago", versions: 0 },
  { id: "11", name: "Acme Discovery — Notes", type: "summary", direction: "exported", status: "processed", format: "MD", size: "24 KB", date: "1d ago", versions: 1 },
  { id: "12", name: "Sprint 14 — Full Transcript", type: "transcript", direction: "exported", status: "processed", format: "TXT", size: "156 KB", date: "5h ago", versions: 1 },
];

function getFileIcon(type: Document["type"]) {
  switch (type) {
    case "audio": return FileAudio;
    case "video": return FileVideo;
    default: return FileText;
  }
}

function StatusBadge({ status }: { status: DocStatus }) {
  const config = {
    processed: { label: "Ready", color: "#10B981", bg: "rgba(16,185,129,0.1)" },
    processing: { label: "Processing", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
    failed: { label: "Failed", color: "#F43F5E", bg: "rgba(244,63,94,0.1)" },
  };
  const c = config[status];
  return (
    <span
      className="text-[10px] font-mono px-1.5 py-0.5 rounded inline-flex items-center gap-1"
      style={{ color: c.color, backgroundColor: c.bg }}
    >
      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
      {c.label}
    </span>
  );
}

function DirectionBadge({ direction }: { direction: DocDirection }) {
  const isUpload = direction === "uploaded";
  return (
    <span
      className="text-[10px] font-mono px-1.5 py-0.5 rounded inline-flex items-center gap-1"
      style={{
        color: isUpload ? "#6366F1" : "#8B5CF6",
        backgroundColor: isUpload ? "rgba(99,102,241,0.1)" : "rgba(139,92,246,0.1)",
      }}
    >
      {isUpload ? <Upload className="w-3 h-3" /> : <Download className="w-3 h-3" />}
      {isUpload ? "Uploaded" : "Exported"}
    </span>
  );
}

export function DocumentsPage() {
  const { isDark, colors } = useTheme();
  const { isNewUser } = useUser();
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [filterDir, setFilterDir] = useState<"all" | "uploaded" | "exported">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"date" | "name" | "size">("date");
  const [showContextMenu, setShowContextMenu] = useState<string | null>(null);

  const cardBg = isDark ? "#111320" : "#FFFFFF";
  const cardBorder = colors.border;
  const hoverBg = isDark ? "#181B2E" : "#F7F6F3";

  const filtered = isNewUser ? [] : documents
    .filter((d) => filterDir === "all" || d.direction === filterDir)
    .filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const uploadCount = isNewUser ? 0 : documents.filter((d) => d.direction === "uploaded").length;
  const exportCount = isNewUser ? 0 : documents.filter((d) => d.direction === "exported").length;
  const totalCount = isNewUser ? 0 : documents.length;

  return (
    <div
      className="h-full overflow-y-auto"
      style={{
        backgroundColor: colors.bgBase,
        scrollbarWidth: "thin",
        scrollbarColor: `${colors.border} transparent`,
      }}
      onClick={() => setShowContextMenu(null)}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h1 className="text-[18px] sm:text-[20px] mb-1" style={{ fontWeight: 600, color: colors.textPrimary }}>
              Documents
            </h1>
            <p className="text-[12px] sm:text-[13px]" style={{ color: colors.textSecondary }}>
              {isNewUser
                ? "Your uploaded and exported documents will appear here"
                : `${uploadCount} uploaded · ${exportCount} exported · ${totalCount} total`}
            </p>
          </div>
        </div>

        {/* New user empty state */}
        {isNewUser ? (
          <div
            className="rounded-xl py-16 text-center"
            style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: `${colors.indigo}10` }}
            >
              <FolderOpen className="w-8 h-8" style={{ color: colors.indigo }} />
            </div>
            <h3 className="text-[16px] mb-2" style={{ fontWeight: 600, color: colors.textPrimary }}>
              No documents yet
            </h3>
            <p className="text-[12px] max-w-sm mx-auto mb-6" style={{ color: colors.textSecondary, lineHeight: 1.6 }}>
              Upload your first meeting transcript to get started. We support audio, video, and text files in VTT, SRT, TXT, DOCX, and JSON formats.
            </p>
            <button
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-white text-[12px] transition-all hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, #6366F1, #818CF8)",
                boxShadow: "0 4px 16px rgba(99,102,241,0.25)",
                fontWeight: 500,
              }}
            >
              <Upload className="w-4 h-4" />
              Upload Transcript
            </button>
            <div className="flex justify-center gap-8 mt-8">
              {[
                { label: "Uploaded", icon: Upload, desc: "Transcripts & recordings" },
                { label: "Exported", icon: Download, desc: "PDFs, DOCX, & more" },
                { label: "Managed", icon: FileText, desc: "Version tracked" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <item.icon className="w-5 h-5 mx-auto mb-1" style={{ color: colors.textMuted }} />
                  <div className="text-[11px]" style={{ fontWeight: 500, color: colors.textSecondary }}>{item.label}</div>
                  <div className="text-[9px]" style={{ color: colors.textMuted }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div
              className="flex flex-col gap-3 mb-4 p-3 rounded-xl"
              style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
            >
              {/* Search */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-md w-full sm:max-w-sm"
                style={{ backgroundColor: colors.bgBase, border: `1px solid ${cardBorder}` }}
              >
                <Search className="w-3.5 h-3.5 shrink-0" style={{ color: colors.textMuted }} />
                <input
                  className="bg-transparent text-[12px] outline-none w-full"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ color: colors.textPrimary }}
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Filter */}
                <div className="flex rounded-md overflow-hidden" style={{ border: `1px solid ${cardBorder}` }}>
                  {[
                    { key: "all" as const, label: "All" },
                    { key: "uploaded" as const, label: "Uploaded" },
                    { key: "exported" as const, label: "Exported" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFilterDir(f.key)}
                      className="px-2.5 py-1 text-[10px] transition-colors"
                      style={{
                        backgroundColor: filterDir === f.key ? `${colors.indigo}15` : "transparent",
                        color: filterDir === f.key ? colors.indigo : colors.textMuted,
                        borderLeft: f.key !== "all" ? `1px solid ${cardBorder}` : undefined,
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Sort */}
                <button
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-colors"
                  style={{ border: `1px solid ${cardBorder}`, color: colors.textMuted }}
                  onClick={() => setSortField(sortField === "date" ? "name" : sortField === "name" ? "size" : "date")}
                >
                  <ArrowUpDown className="w-3 h-3" />
                  {sortField === "date" ? "Date" : sortField === "name" ? "Name" : "Size"}
                </button>

                {/* View mode */}
                <div className="flex rounded-md overflow-hidden" style={{ border: `1px solid ${cardBorder}` }}>
                  <button
                    onClick={() => setViewMode("list")}
                    className="px-2 py-1 transition-colors"
                    style={{
                      backgroundColor: viewMode === "list" ? `${colors.indigo}15` : "transparent",
                      color: viewMode === "list" ? colors.indigo : colors.textMuted,
                    }}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className="px-2 py-1 transition-colors"
                    style={{
                      borderLeft: `1px solid ${cardBorder}`,
                      backgroundColor: viewMode === "grid" ? `${colors.indigo}15` : "transparent",
                      color: viewMode === "grid" ? colors.indigo : colors.textMuted,
                    }}
                  >
                    <Grid3x3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Document List */}
            {viewMode === "list" ? (
              <div
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
              >
                {/* Table header - hidden on mobile */}
                <div
                  className="hidden md:grid grid-cols-[1fr_100px_90px_80px_70px_80px_36px] gap-2 px-4 py-2 text-[9px] font-mono tracking-wider"
                  style={{ color: colors.textMuted, borderBottom: `1px solid ${cardBorder}` }}
                >
                  <span>NAME</span>
                  <span>DIRECTION</span>
                  <span>STATUS</span>
                  <span>FORMAT</span>
                  <span>SIZE</span>
                  <span>DATE</span>
                  <span></span>
                </div>

                {/* Rows - desktop table */}
                <div className="hidden md:block">
                  {filtered.map((doc) => {
                    const Icon = getFileIcon(doc.type);
                    return (
                      <div
                        key={doc.id}
                        className="grid grid-cols-[1fr_100px_90px_80px_70px_80px_36px] gap-2 px-4 py-2.5 items-center transition-colors relative"
                        style={{ borderBottom: `1px solid ${isDark ? "rgba(42,45,66,0.4)" : "rgba(226,224,219,0.4)"}` }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className="w-4 h-4 shrink-0" style={{ color: colors.indigo }} />
                          <span className="text-[12px] truncate" style={{ fontWeight: 500, color: colors.textPrimary }}>
                            {doc.name}
                          </span>
                          {doc.versions > 1 && (
                            <span
                              className="text-[9px] font-mono px-1 py-0.5 rounded shrink-0"
                              style={{ backgroundColor: `${colors.indigo}12`, color: colors.indigo }}
                            >
                              v{doc.versions}
                            </span>
                          )}
                        </div>
                        <DirectionBadge direction={doc.direction} />
                        <StatusBadge status={doc.status} />
                        <span
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: `${colors.border}40`, color: colors.textSecondary }}
                        >
                          {doc.format}
                        </span>
                        <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
                          {doc.size}
                        </span>
                        <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
                          {doc.date}
                        </span>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowContextMenu(showContextMenu === doc.id ? null : doc.id);
                            }}
                            className="p-1 rounded transition-colors hover:bg-[#6366F1]/10"
                            style={{ color: colors.textMuted }}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {showContextMenu === doc.id && (
                            <div
                              className="absolute right-0 top-full mt-1 w-36 rounded-lg py-1 shadow-xl z-50"
                              style={{ backgroundColor: isDark ? "#1A1D2E" : "#FFFFFF", border: `1px solid ${cardBorder}` }}
                            >
                              <button className="w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 hover:bg-[#6366F1]/10 transition-colors"
                                style={{ color: colors.textSecondary }}>
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>
                              <button className="w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 hover:bg-[#6366F1]/10 transition-colors"
                                style={{ color: colors.textSecondary }}>
                                <Download className="w-3.5 h-3.5" /> Download
                              </button>
                              <button className="w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 hover:bg-[#F43F5E]/10 transition-colors"
                                style={{ color: "#F43F5E" }}>
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Rows - mobile card layout */}
                <div className="md:hidden divide-y" style={{ borderColor: isDark ? "rgba(42,45,66,0.4)" : "rgba(226,224,219,0.4)" }}>
                  {filtered.map((doc) => {
                    const Icon = getFileIcon(doc.type);
                    return (
                      <div
                        key={doc.id}
                        className="px-4 py-3 transition-colors"
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                            style={{ backgroundColor: `${colors.indigo}12` }}
                          >
                            <Icon className="w-4 h-4" style={{ color: colors.indigo }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[12px] truncate" style={{ fontWeight: 500, color: colors.textPrimary }}>
                                {doc.name}
                              </span>
                              {doc.versions > 1 && (
                                <span
                                  className="text-[9px] font-mono px-1 py-0.5 rounded shrink-0"
                                  style={{ backgroundColor: `${colors.indigo}12`, color: colors.indigo }}
                                >
                                  v{doc.versions}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center flex-wrap gap-2 mb-1.5">
                              <DirectionBadge direction={doc.direction} />
                              <StatusBadge status={doc.status} />
                              <span
                                className="text-[9px] font-mono px-1 py-0.5 rounded"
                                style={{ backgroundColor: `${colors.border}40`, color: colors.textSecondary }}
                              >
                                {doc.format}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
                                {doc.size}
                              </span>
                              <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
                                {doc.date}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowContextMenu(showContextMenu === doc.id ? null : doc.id);
                            }}
                            className="p-1 rounded transition-colors hover:bg-[#6366F1]/10 shrink-0"
                            style={{ color: colors.textMuted }}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filtered.length === 0 && (
                  <div className="px-4 py-12 text-center">
                    <File className="w-8 h-8 mx-auto mb-2" style={{ color: colors.textMuted }} />
                    <div className="text-[13px]" style={{ color: colors.textSecondary }}>No documents found</div>
                    <div className="text-[11px] mt-1" style={{ color: colors.textMuted }}>Try adjusting your search or filters</div>
                  </div>
                )}
              </div>
            ) : (
              /* Grid View */
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filtered.map((doc) => {
                  const Icon = getFileIcon(doc.type);
                  return (
                    <div
                      key={doc.id}
                      className="rounded-xl p-4 transition-colors group relative"
                      style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = cardBg)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${colors.indigo}12` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: colors.indigo }} />
                        </div>
                        <div className="flex items-center gap-1">
                          <DirectionBadge direction={doc.direction} />
                        </div>
                      </div>
                      <div className="text-[12px] mb-1 truncate" style={{ fontWeight: 500, color: colors.textPrimary }}>
                        {doc.name}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <StatusBadge status={doc.status} />
                        <span
                          className="text-[9px] font-mono px-1 py-0.5 rounded"
                          style={{ backgroundColor: `${colors.border}40`, color: colors.textSecondary }}
                        >
                          {doc.format}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
                          {doc.size}
                        </span>
                        <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
                          {doc.date}
                        </span>
                      </div>
                      {doc.versions > 1 && (
                        <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${cardBorder}` }}>
                          <span className="text-[9px] font-mono" style={{ color: colors.indigo }}>
                            {doc.versions} versions
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}