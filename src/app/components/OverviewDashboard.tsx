import { useState } from "react";
import {
  FileText,
  Upload,
  Download,
  MessageSquare,
  TrendingUp,
  Clock,
  Star,
  BarChart3,
  ArrowUpRight,
  Sparkles,
  Users,
  Zap,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useTheme } from "./ThemeContext";
import { useUser } from "./UserContext";

// Mock data for returning user
const populatedStats = [
  { label: "Total Documents", value: "24", change: "+3 this week", icon: FileText, color: "#6366F1" },
  { label: "Uploaded", value: "18", change: "+2 this week", icon: Upload, color: "#10B981" },
  { label: "Exported", value: "12", change: "+5 this week", icon: Download, color: "#8B5CF6" },
  { label: "AI Conversations", value: "47", change: "+8 this week", icon: MessageSquare, color: "#06B6D4" },
];

const emptyStats = [
  { label: "Total Documents", value: "0", change: "Upload to start", icon: FileText, color: "#6366F1" },
  { label: "Uploaded", value: "0", change: "—", icon: Upload, color: "#10B981" },
  { label: "Exported", value: "0", change: "—", icon: Download, color: "#8B5CF6" },
  { label: "AI Conversations", value: "0", change: "—", icon: MessageSquare, color: "#06B6D4" },
];

const importantChats = [
  {
    id: 1,
    title: "Q4 Strategy Review — Key Decisions",
    preview: "Identified 3 critical action items for APAC expansion. Marcus flagged pricing model risks...",
    time: "2h ago",
    starred: true,
    confidence: 94,
    subScores: { faithfulness: 96, relevance: 92, precision: 94 },
    speakers: 6,
  },
  {
    id: 2,
    title: "Product Sync — Sprint 14 Blockers",
    preview: "Engineering blocked on API migration. Design team needs final sign-off on v2.3 components...",
    time: "5h ago",
    starred: true,
    confidence: 88,
    subScores: { faithfulness: 90, relevance: 87, precision: 86 },
    speakers: 4,
  },
  {
    id: 3,
    title: "Customer Discovery — Acme Corp",
    preview: "Key insight: Acme needs real-time collaboration features. Willing to pay premium for SSO...",
    time: "1d ago",
    starred: false,
    confidence: 91,
    subScores: { faithfulness: 93, relevance: 90, precision: 89 },
    speakers: 3,
  },
  {
    id: 4,
    title: "Board Meeting — February Review",
    preview: "Revenue up 23% QoQ. Board approved Series B timeline. Need to revisit hiring plan...",
    time: "2d ago",
    starred: true,
    confidence: 76,
    subScores: { faithfulness: 80, relevance: 74, precision: 73 },
    speakers: 8,
  },
];

const recentActivity = [
  { action: "Exported", target: "Q4 Strategy Review — Analysis", format: "PDF", time: "12 min ago", icon: Download },
  { action: "AI Refined", target: "Action items with suggested owners", format: null, time: "15 min ago", icon: Sparkles },
  { action: "Uploaded", target: "Design Critique — v2.3.mp4", format: "Video", time: "47 min ago", icon: Upload },
  { action: "Exported", target: "Product Sync — Sprint 14 Summary", format: "DOCX", time: "2h ago", icon: Download },
  { action: "Committed", target: "Risk assessment section added", format: null, time: "2h ago", icon: Zap },
  { action: "Uploaded", target: "1:1 — Engineering Lead.m4a", format: "Audio", time: "3h ago", icon: Upload },
];

const topSpeakers = [
  { name: "Jane Doe", sessions: 18, initials: "JD", color: "#6366F1" },
  { name: "Alex Rivera", sessions: 12, initials: "AR", color: "#8B5CF6" },
  { name: "Sarah Chen", sessions: 9, initials: "SC", color: "#06B6D4" },
  { name: "Marcus Webb", sessions: 7, initials: "MW", color: "#10B981" },
];

// Confidence scoring data for the overview
const confidenceOverview = [
  { transcript: "Q4 Strategy Review", overall: 94, faithfulness: 96, relevance: 92, precision: 94, date: "2h ago" },
  { transcript: "Product Sync — Sprint 14", overall: 88, faithfulness: 90, relevance: 87, precision: 86, date: "5h ago" },
  { transcript: "Customer Discovery — Acme", overall: 91, faithfulness: 93, relevance: 90, precision: 89, date: "1d ago" },
  { transcript: "Board Meeting — Feb", overall: 76, faithfulness: 80, relevance: 74, precision: 73, date: "2d ago" },
  { transcript: "1:1 — Engineering Lead", overall: 97, faithfulness: 98, relevance: 96, precision: 97, date: "3d ago" },
];

function ConfidenceBar({ score, color, width = "w-16" }: { score: number; color: string; width?: string }) {
  return (
    <div className={`${width} h-1.5 rounded-full`} style={{ backgroundColor: `${color}20` }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
    </div>
  );
}

function ConfidenceDot({ score }: { score: number }) {
  const color = score >= 85 ? "#10B981" : score >= 65 ? "#F59E0B" : "#F43F5E";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] font-mono" style={{ color }}>{score}%</span>
    </div>
  );
}

export function OverviewDashboard() {
  const { isDark, colors } = useTheme();
  const { isNewUser } = useUser();
  const [chatFilter, setChatFilter] = useState<"all" | "starred">("all");
  const [expandedScore, setExpandedScore] = useState<string | null>(null);

  const cardBg = isDark ? "#111320" : "#FFFFFF";
  const cardBorder = colors.border;
  const cardHover = isDark ? "#181B2E" : "#F7F6F3";

  const stats = isNewUser ? emptyStats : populatedStats;
  const filteredChats = chatFilter === "starred"
    ? importantChats.filter((c) => c.starred)
    : importantChats;

  // Calculate average confidence for populated state
  const avgConfidence = Math.round(
    confidenceOverview.reduce((sum, c) => sum + c.overall, 0) / confidenceOverview.length
  );

  return (
    <div
      className="h-full overflow-y-auto"
      style={{
        backgroundColor: colors.bgBase,
        scrollbarWidth: "thin",
        scrollbarColor: `${colors.border} transparent`,
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-[18px] sm:text-[20px] mb-1" style={{ fontWeight: 600, color: colors.textPrimary }}>
            Dashboard
          </h1>
          <p className="text-[13px]" style={{ color: colors.textSecondary }}>
            {isNewUser
              ? "Welcome! Upload your first transcript to get started."
              : "Overview of your transcripts, conversations, and activity"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-4 transition-colors"
              style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                {!isNewUser && (
                  <div className="flex items-center gap-0.5 text-[10px]" style={{ color: "#10B981" }}>
                    <TrendingUp className="w-3 h-3" />
                    <span>{stat.change}</span>
                  </div>
                )}
              </div>
              <div className="text-[22px]" style={{ fontWeight: 600, color: isNewUser ? colors.textMuted : colors.textPrimary }}>
                {stat.value}
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* New User: Getting Started */}
        {isNewUser && (
          <div
            className="rounded-xl p-6 mb-6"
            style={{
              backgroundColor: isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.04)",
              border: `1px solid ${isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.12)"}`,
            }}
          >
            <h3 className="text-[15px] mb-3" style={{ fontWeight: 600, color: colors.textPrimary }}>
              Getting Started
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { step: "1", title: "Upload a Transcript", desc: "Drop an audio, video, or text file to begin", icon: Upload, color: "#6366F1", done: false },
                { step: "2", title: "Chat with AI", desc: "Ask questions and get citation-backed answers", icon: MessageSquare, color: "#06B6D4", done: false },
                { step: "3", title: "Export Results", desc: "Download polished documents in any format", icon: Download, color: "#10B981", done: false },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
                >
                  <div className="relative shrink-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${item.color}12` }}
                    >
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <div
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white"
                      style={{ backgroundColor: item.color, fontWeight: 700 }}
                    >
                      {item.step}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px]" style={{ fontWeight: 600, color: colors.textPrimary }}>{item.title}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confidence Scoring Overview — always visible (with data or empty) */}
        <div
          className="rounded-xl overflow-hidden mb-6"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <div className="px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2" style={{ borderBottom: `1px solid ${cardBorder}` }}>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" style={{ color: colors.indigo }} />
              <span className="text-[13px]" style={{ fontWeight: 600, color: colors.textPrimary }}>
                Confidence Scoring
              </span>
            </div>
            {!isNewUser && (
              <div className="flex items-center gap-2">
                <span className="text-[10px]" style={{ color: colors.textMuted }}>Average:</span>
                <span
                  className="text-[12px] font-mono px-2 py-0.5 rounded"
                  style={{
                    fontWeight: 600,
                    color: avgConfidence >= 85 ? "#10B981" : avgConfidence >= 65 ? "#F59E0B" : "#F43F5E",
                    backgroundColor: avgConfidence >= 85 ? "rgba(16,185,129,0.1)" : avgConfidence >= 65 ? "rgba(245,158,11,0.1)" : "rgba(244,63,94,0.1)",
                  }}
                >
                  {avgConfidence}%
                </span>
              </div>
            )}
          </div>

          {isNewUser ? (
            <div className="px-6 py-10 text-center">
              <BarChart3 className="w-10 h-10 mx-auto mb-3" style={{ color: colors.textMuted }} />
              <div className="text-[13px] mb-1" style={{ fontWeight: 500, color: colors.textSecondary }}>
                No confidence data yet
              </div>
              <p className="text-[11px] max-w-sm mx-auto mb-4" style={{ color: colors.textMuted, lineHeight: 1.5 }}>
                When you chat with AI about your transcripts, each response will include confidence scores
                measuring <span style={{ color: "#10B981" }}>Faithfulness</span>,{" "}
                <span style={{ color: "#06B6D4" }}>Relevance</span>, and{" "}
                <span style={{ color: "#8B5CF6" }}>Precision</span>.
              </p>
              {/* Preview bars */}
              <div className="flex justify-center gap-6">
                {[
                  { label: "Faithfulness", color: "#10B981" },
                  { label: "Relevance", color: "#06B6D4" },
                  { label: "Precision", color: "#8B5CF6" },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-1.5">
                    <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: `${m.color}15` }}>
                      <div className="h-full rounded-full" style={{ width: "0%", backgroundColor: m.color }} />
                    </div>
                    <span className="text-[9px] font-mono" style={{ color: `${m.color}60` }}>— %</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {/* Score legend */}
              <div className="px-4 py-2 flex items-center gap-3 sm:gap-6 flex-wrap" style={{ borderBottom: `1px solid ${isDark ? "rgba(42,45,66,0.4)" : "rgba(226,224,219,0.4)"}` }}>
                {[
                  { label: "Faithfulness", color: "#10B981" },
                  { label: "Relevance", color: "#06B6D4" },
                  { label: "Precision", color: "#8B5CF6" },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                    <span className="text-[10px]" style={{ color: colors.textMuted }}>{m.label}</span>
                  </div>
                ))}
              </div>

              {/* Score rows */}
              {confidenceOverview.map((c) => (
                <div key={c.transcript}>
                  <button
                    className="w-full text-left px-4 py-3 flex items-center gap-4 transition-colors"
                    onClick={() => setExpandedScore(expandedScore === c.transcript ? null : c.transcript)}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = cardHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] truncate" style={{ fontWeight: 500, color: colors.textPrimary }}>
                        {c.transcript}
                      </div>
                      <div className="text-[10px] font-mono" style={{ color: colors.textMuted }}>{c.date}</div>
                    </div>

                    {/* Mini score bars */}
                    <div className="hidden sm:flex items-center gap-3 shrink-0">
                      <ConfidenceBar score={c.faithfulness} color="#10B981" />
                      <ConfidenceBar score={c.relevance} color="#06B6D4" />
                      <ConfidenceBar score={c.precision} color="#8B5CF6" />
                    </div>

                    {/* Overall score */}
                    <div
                      className="text-[11px] font-mono px-2 py-0.5 rounded shrink-0"
                      style={{
                        fontWeight: 600,
                        color: c.overall >= 85 ? "#10B981" : c.overall >= 65 ? "#F59E0B" : "#F43F5E",
                        backgroundColor: c.overall >= 85 ? "rgba(16,185,129,0.1)" : c.overall >= 65 ? "rgba(245,158,11,0.1)" : "rgba(244,63,94,0.1)",
                      }}
                    >
                      {c.overall}%
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {expandedScore === c.transcript && (
                    <div
                      className="px-4 sm:px-6 py-3 grid grid-cols-1 sm:grid-cols-3 gap-4"
                      style={{ backgroundColor: isDark ? "#0F1018" : "#F7F6F3", borderTop: `1px solid ${isDark ? "rgba(42,45,66,0.3)" : "rgba(226,224,219,0.3)"}` }}
                    >
                      {[
                        { label: "Faithfulness", score: c.faithfulness, color: "#10B981", desc: "How accurately the AI represents the source" },
                        { label: "Relevance", score: c.relevance, color: "#06B6D4", desc: "How well the answer addresses the question" },
                        { label: "Precision", score: c.precision, color: "#8B5CF6", desc: "Specificity and exactness of the response" },
                      ].map((m) => (
                        <div key={m.label}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                            <span className="text-[11px]" style={{ fontWeight: 500, color: colors.textPrimary }}>{m.label}</span>
                          </div>
                          <div className="w-full h-2 rounded-full mb-1" style={{ backgroundColor: `${m.color}15` }}>
                            <div className="h-full rounded-full" style={{ width: `${m.score}%`, backgroundColor: m.color }} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px]" style={{ color: colors.textMuted }}>{m.desc}</span>
                            <span className="text-[10px] font-mono" style={{ fontWeight: 600, color: m.color }}>{m.score}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Important Chats — 2 cols */}
          <div
            className="lg:col-span-2 rounded-xl overflow-hidden"
            style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${cardBorder}` }}>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" style={{ color: colors.indigo }} />
                <span className="text-[13px]" style={{ fontWeight: 600, color: colors.textPrimary }}>
                  Important Conversations
                </span>
              </div>
              {!isNewUser && (
                <div className="flex rounded-md overflow-hidden" style={{ border: `1px solid ${cardBorder}` }}>
                  <button
                    onClick={() => setChatFilter("all")}
                    className="px-2.5 py-1 text-[10px] transition-colors"
                    style={{
                      backgroundColor: chatFilter === "all" ? `${colors.indigo}15` : "transparent",
                      color: chatFilter === "all" ? colors.indigo : colors.textMuted,
                    }}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setChatFilter("starred")}
                    className="px-2.5 py-1 text-[10px] transition-colors"
                    style={{
                      borderLeft: `1px solid ${cardBorder}`,
                      backgroundColor: chatFilter === "starred" ? `${colors.indigo}15` : "transparent",
                      color: chatFilter === "starred" ? colors.indigo : colors.textMuted,
                    }}
                  >
                    <Star className="w-3 h-3 inline-block mr-1" />
                    Starred
                  </button>
                </div>
              )}
            </div>

            {isNewUser ? (
              <div className="px-6 py-12 text-center">
                <MessageSquare className="w-10 h-10 mx-auto mb-3" style={{ color: colors.textMuted }} />
                <div className="text-[13px] mb-1" style={{ fontWeight: 500, color: colors.textSecondary }}>
                  No conversations yet
                </div>
                <p className="text-[11px] max-w-xs mx-auto" style={{ color: colors.textMuted, lineHeight: 1.5 }}>
                  Upload a transcript and start chatting with AI to see your important conversations and their confidence scores here.
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: `${cardBorder}50` }}>
                {filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    className="w-full text-left px-4 py-3 transition-colors group"
                    style={{ borderColor: isDark ? "rgba(42,45,66,0.5)" : "rgba(226,224,219,0.5)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = cardHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {chat.starred && <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />}
                          <span className="text-[12px] truncate" style={{ fontWeight: 500, color: colors.textPrimary }}>
                            {chat.title}
                          </span>
                        </div>
                        <p className="text-[11px] line-clamp-2" style={{ color: colors.textSecondary }}>
                          {chat.preview}
                        </p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <ConfidenceDot score={chat.confidence} />
                          {/* Sub-scores inline - hidden on mobile */}
                          <div className="hidden sm:flex items-center gap-2">
                            <ConfidenceBar score={chat.subScores.faithfulness} color="#10B981" width="w-10" />
                            <ConfidenceBar score={chat.subScores.relevance} color="#06B6D4" width="w-10" />
                            <ConfidenceBar score={chat.subScores.precision} color="#8B5CF6" width="w-10" />
                          </div>
                          <div className="flex items-center gap-1 text-[10px]" style={{ color: colors.textMuted }}>
                            <Users className="w-3 h-3" />
                            {chat.speakers}
                          </div>
                          <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
                            {chat.time}
                          </span>
                        </div>
                      </div>
                      <ArrowUpRight
                        className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: colors.indigo }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {/* Recent Activity */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                <Clock className="w-4 h-4" style={{ color: colors.indigo }} />
                <span className="text-[13px]" style={{ fontWeight: 600, color: colors.textPrimary }}>
                  Recent Activity
                </span>
              </div>

              {isNewUser ? (
                <div className="px-4 py-8 text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: colors.textMuted }} />
                  <div className="text-[11px]" style={{ color: colors.textMuted }}>
                    Your activity will appear here
                  </div>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: `${cardBorder}50` }}>
                  {recentActivity.map((item, i) => (
                    <div
                      key={i}
                      className="px-4 py-2.5 flex items-center gap-3"
                      style={{ borderColor: isDark ? "rgba(42,45,66,0.5)" : "rgba(226,224,219,0.5)" }}
                    >
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${colors.indigo}12` }}
                      >
                        <item.icon className="w-3 h-3" style={{ color: colors.indigo }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] truncate" style={{ color: colors.textPrimary }}>
                          <span style={{ color: colors.textMuted }}>{item.action}</span>{" "}
                          {item.target}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.format && (
                            <span
                              className="text-[9px] font-mono px-1 py-0.5 rounded"
                              style={{ backgroundColor: `${colors.indigo}12`, color: colors.indigo }}
                            >
                              {item.format}
                            </span>
                          )}
                          <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>
                            {item.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Speakers */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                <BarChart3 className="w-4 h-4" style={{ color: colors.indigo }} />
                <span className="text-[13px]" style={{ fontWeight: 600, color: colors.textPrimary }}>
                  Top Speakers
                </span>
              </div>

              {isNewUser ? (
                <div className="px-4 py-8 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2" style={{ color: colors.textMuted }} />
                  <div className="text-[11px]" style={{ color: colors.textMuted }}>
                    Speakers detected from your transcripts
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {topSpeakers.map((speaker) => (
                    <div key={speaker.name} className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] shrink-0"
                        style={{ backgroundColor: speaker.color }}
                      >
                        {speaker.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px]" style={{ fontWeight: 500, color: colors.textPrimary }}>
                          {speaker.name}
                        </div>
                        <div className="w-full h-1.5 rounded-full mt-1" style={{ backgroundColor: `${colors.border}` }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(speaker.sessions / 18) * 100}%`,
                              backgroundColor: speaker.color,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] font-mono shrink-0" style={{ color: colors.textMuted }}>
                        {speaker.sessions} sessions
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}