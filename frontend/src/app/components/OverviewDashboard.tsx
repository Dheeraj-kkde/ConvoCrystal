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
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "./ThemeContext";
import { useUser } from "./UserContext";

// ─── Motion presets ──────────────────────────────────────────────

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeSlideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

// ─── Mock data ───────────────────────────────────────────────────

const populatedStats = [
  { label: "Total Documents", value: "24", numValue: 24, change: "+3 this week", icon: FileText, color: "#5C6CF5" },
  { label: "Uploaded", value: "18", numValue: 18, change: "+2 this week", icon: Upload, color: "#10B981" },
  { label: "Exported", value: "12", numValue: 12, change: "+5 this week", icon: Download, color: "#00C9D6" },
  { label: "AI Conversations", value: "47", numValue: 47, change: "+8 this week", icon: MessageSquare, color: "#00C9D6" },
];

const emptyStats = [
  { label: "Total Documents", value: "0", numValue: 0, change: "Upload to start", icon: FileText, color: "#5C6CF5" },
  { label: "Uploaded", value: "0", numValue: 0, change: "—", icon: Upload, color: "#10B981" },
  { label: "Exported", value: "0", numValue: 0, change: "—", icon: Download, color: "#00C9D6" },
  { label: "AI Conversations", value: "0", numValue: 0, change: "—", icon: MessageSquare, color: "#00C9D6" },
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
  { name: "Jane Doe", sessions: 18, initials: "JD", color: "#5C6CF5" },
  { name: "Alex Rivera", sessions: 12, initials: "AR", color: "#00C9D6" },
  { name: "Sarah Chen", sessions: 9, initials: "SC", color: "#00C9D6" },
  { name: "Marcus Webb", sessions: 7, initials: "MW", color: "#10B981" },
];

const confidenceOverview = [
  { transcript: "Q4 Strategy Review", overall: 94, faithfulness: 96, relevance: 92, precision: 94, date: "2h ago" },
  { transcript: "Product Sync — Sprint 14", overall: 88, faithfulness: 90, relevance: 87, precision: 86, date: "5h ago" },
  { transcript: "Customer Discovery — Acme", overall: 91, faithfulness: 93, relevance: 90, precision: 89, date: "1d ago" },
  { transcript: "Board Meeting — Feb", overall: 76, faithfulness: 80, relevance: 74, precision: 73, date: "2d ago" },
  { transcript: "1:1 — Engineering Lead", overall: 97, faithfulness: 98, relevance: 96, precision: 97, date: "3d ago" },
];

// ─── Animated Confidence Bar ─────────────────────────────────────

function AnimatedConfidenceBar({ score, color, width = "w-16", delay = 0 }: { score: number; color: string; width?: string; delay?: number }) {
  return (
    <div className={`${width} h-1.5 rounded-full`} style={{ backgroundColor: `${color}20` }}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: "0%" }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

function ConfidenceDot({ score }: { score: number }) {
  const color = score >= 85 ? "#10B981" : score >= 65 ? "#F59E0B" : "#F43F5E";
  return (
    <div className="flex items-center gap-1.5">
      <motion.div
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
        animate={{ scale: [1, 1.4, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="text-[10px] font-mono" style={{ color }}>{score}%</span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

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

  const avgConfidence = Math.round(
    confidenceOverview.reduce((sum, c) => sum + c.overall, 0) / confidenceOverview.length
  );

  return (
    <div
      className="h-full overflow-y-scroll"
      style={{
        backgroundColor: colors.bgBase,
        scrollbarGutter: "stable",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Header */}
        <motion.div
          className="mb-4 sm:mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
        >
          <h1 className="text-[18px] sm:text-[20px] mb-1" style={{ fontWeight: 600, color: colors.textPrimary }}>
            Dashboard
          </h1>
          <p className="text-[13px]" style={{ color: colors.textSecondary }}>
            {isNewUser
              ? "Welcome! Upload your first transcript to get started."
              : "Overview of your transcripts, conversations, and activity"}
          </p>
        </motion.div>

        {/* Stats Grid — staggered entrance */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={fadeSlideUp}
              whileHover={{
                y: -4,
                boxShadow: `0 8px 24px ${stat.color}18`,
                borderColor: `${stat.color}40`,
                transition: { type: "spring", stiffness: 400, damping: 22 },
              }}
              whileTap={{ scale: 0.98 }}
              className="rounded-xl p-4 transition-colors cursor-default"
              style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <motion.div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}15` }}
                  whileHover={{ scale: 1.15, rotate: 8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </motion.div>
                {!isNewUser && (
                  <motion.div
                    className="flex items-center gap-0.5 text-[10px]"
                    style={{ color: "#10B981" }}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                  >
                    <TrendingUp className="w-3 h-3" />
                    <span>{stat.change}</span>
                  </motion.div>
                )}
              </div>
              <motion.div
                className="text-[22px]"
                style={{ fontWeight: 600, color: isNewUser ? colors.textMuted : colors.textPrimary }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 200, damping: 15 }}
              >
                {stat.value}
              </motion.div>
              <div className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* New User: Getting Started — staggered */}
        <AnimatePresence>
          {isNewUser && (
            <motion.div
              className="rounded-xl p-6 mb-6"
              style={{
                backgroundColor: isDark ? "rgba(92,108,245,0.06)" : "rgba(92,108,245,0.04)",
                border: `1px solid ${isDark ? "rgba(92,108,245,0.15)" : "rgba(92,108,245,0.12)"}`,
              }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
            >
              <h3 className="text-[15px] mb-3" style={{ fontWeight: 600, color: colors.textPrimary }}>
                Getting Started
              </h3>
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {[
                  { step: "1", title: "Upload a Transcript", desc: "Drop an audio, video, or text file to begin", icon: Upload, color: "#5C6CF5" },
                  { step: "2", title: "Chat with AI", desc: "Ask questions and get citation-backed answers", icon: MessageSquare, color: "#00C9D6" },
                  { step: "3", title: "Export Results", desc: "Download polished documents in any format", icon: Download, color: "#10B981" },
                ].map((item) => (
                  <motion.div
                    key={item.step}
                    variants={scaleIn}
                    whileHover={{
                      y: -3,
                      boxShadow: `0 6px 20px ${item.color}15`,
                      transition: { type: "spring", stiffness: 400, damping: 20 },
                    }}
                    className="flex items-start gap-3 p-3 rounded-lg cursor-default"
                    style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
                  >
                    <div className="relative shrink-0">
                      <motion.div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${item.color}12` }}
                        animate={{ rotate: [0, 3, -3, 0] }}
                        transition={{ duration: 4, repeat: Infinity, delay: Number(item.step) * 0.5 }}
                      >
                        <item.icon className="w-5 h-5" style={{ color: item.color }} />
                      </motion.div>
                      <motion.div
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white"
                        style={{ backgroundColor: item.color, fontWeight: 700 }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + Number(item.step) * 0.15, type: "spring", stiffness: 500, damping: 15 }}
                      >
                        {item.step}
                      </motion.div>
                    </div>
                    <div>
                      <div className="text-[12px]" style={{ fontWeight: 600, color: colors.textPrimary }}>{item.title}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>{item.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confidence Scoring Overview */}
        <motion.div
          className="rounded-xl overflow-hidden mb-6"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 200, damping: 22 }}
        >
          <div className="px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2" style={{ borderBottom: `1px solid ${cardBorder}` }}>
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <BarChart3 className="w-4 h-4" style={{ color: colors.crystal }} />
              </motion.div>
              <span className="text-[13px]" style={{ fontWeight: 600, color: colors.textPrimary }}>
                Confidence Scoring
              </span>
            </div>
            {!isNewUser && (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <span className="text-[10px]" style={{ color: colors.textMuted }}>Average:</span>
                <motion.span
                  className="text-[12px] font-mono px-2 py-0.5 rounded"
                  style={{
                    fontWeight: 600,
                    color: avgConfidence >= 85 ? "#10B981" : avgConfidence >= 65 ? "#F59E0B" : "#F43F5E",
                    backgroundColor: avgConfidence >= 85 ? "rgba(16,185,129,0.1)" : avgConfidence >= 65 ? "rgba(245,158,11,0.1)" : "rgba(244,63,94,0.1)",
                  }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 300, damping: 15 }}
                >
                  {avgConfidence}%
                </motion.span>
              </motion.div>
            )}
          </div>

          {isNewUser ? (
            <motion.div
              className="px-6 py-10 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <BarChart3 className="w-10 h-10 mx-auto mb-3" style={{ color: colors.textMuted }} />
              </motion.div>
              <div className="text-[13px] mb-1" style={{ fontWeight: 500, color: colors.textSecondary }}>
                No confidence data yet
              </div>
              <p className="text-[11px] max-w-sm mx-auto mb-4" style={{ color: colors.textMuted, lineHeight: 1.5 }}>
                When you chat with AI about your transcripts, each response will include confidence scores
                measuring <span style={{ color: "#10B981" }}>Faithfulness</span>,{" "}
                <span style={{ color: "#00C9D6" }}>Relevance</span>, and{" "}
                <span style={{ color: "#5C6CF5" }}>Precision</span>.
              </p>
              <div className="flex justify-center gap-6">
                {[
                  { label: "Faithfulness", color: "#10B981" },
                  { label: "Relevance", color: "#00C9D6" },
                  { label: "Precision", color: "#5C6CF5" },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-1.5">
                    <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: `${m.color}15` }}>
                      <div className="h-full rounded-full" style={{ width: "0%", backgroundColor: m.color }} />
                    </div>
                    <span className="text-[9px] font-mono" style={{ color: `${m.color}60` }}>— %</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div>
              {/* Score legend */}
              <div className="px-4 py-2 flex items-center gap-3 sm:gap-6 flex-wrap" style={{ borderBottom: `1px solid ${isDark ? "rgba(42,45,66,0.4)" : "rgba(226,224,219,0.4)"}` }}>
                {[
                  { label: "Faithfulness", color: "#10B981" },
                  { label: "Relevance", color: "#00C9D6" },
                  { label: "Precision", color: "#5C6CF5" },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-1.5">
                    <motion.div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: m.color }}
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: m.label === "Faithfulness" ? 0 : m.label === "Relevance" ? 0.3 : 0.6 }}
                    />
                    <span className="text-[10px]" style={{ color: colors.textMuted }}>{m.label}</span>
                  </div>
                ))}
              </div>

              {/* Score rows */}
              {confidenceOverview.map((c, rowIdx) => (
                <div key={c.transcript}>
                  <motion.button
                    className="w-full text-left px-4 py-3 flex items-center gap-4 transition-colors"
                    onClick={() => setExpandedScore(expandedScore === c.transcript ? null : c.transcript)}
                    whileHover={{ backgroundColor: cardHover }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + rowIdx * 0.06, duration: 0.3 }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] truncate" style={{ fontWeight: 500, color: colors.textPrimary }}>
                        {c.transcript}
                      </div>
                      <div className="text-[10px] font-mono" style={{ color: colors.textMuted }}>{c.date}</div>
                    </div>

                    {/* Mini score bars — animated fill */}
                    <div className="hidden sm:flex items-center gap-3 shrink-0">
                      <AnimatedConfidenceBar score={c.faithfulness} color="#10B981" delay={0.4 + rowIdx * 0.1} />
                      <AnimatedConfidenceBar score={c.relevance} color="#00C9D6" delay={0.45 + rowIdx * 0.1} />
                      <AnimatedConfidenceBar score={c.precision} color="#5C6CF5" delay={0.5 + rowIdx * 0.1} />
                    </div>

                    {/* Overall score */}
                    <motion.div
                      className="text-[11px] font-mono px-2 py-0.5 rounded shrink-0"
                      style={{
                        fontWeight: 600,
                        color: c.overall >= 85 ? "#10B981" : c.overall >= 65 ? "#F59E0B" : "#F43F5E",
                        backgroundColor: c.overall >= 85 ? "rgba(16,185,129,0.1)" : c.overall >= 65 ? "rgba(245,158,11,0.1)" : "rgba(244,63,94,0.1)",
                      }}
                      whileHover={{ scale: 1.1 }}
                    >
                      {c.overall}%
                    </motion.div>
                  </motion.button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {expandedScore === c.transcript && (
                      <motion.div
                        className="px-4 sm:px-6 py-3 grid grid-cols-1 sm:grid-cols-3 gap-4"
                        style={{ backgroundColor: isDark ? "#0F1018" : "#F7F6F3", borderTop: `1px solid ${isDark ? "rgba(42,45,66,0.3)" : "rgba(226,224,219,0.3)"}` }}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                      >
                        {[
                          { label: "Faithfulness", score: c.faithfulness, color: "#10B981", desc: "How accurately the AI represents the source" },
                          { label: "Relevance", score: c.relevance, color: "#00C9D6", desc: "How well the answer addresses the question" },
                          { label: "Precision", score: c.precision, color: "#5C6CF5", desc: "Specificity and exactness of the response" },
                        ].map((m, mIdx) => (
                          <motion.div
                            key={m.label}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: mIdx * 0.08, type: "spring", stiffness: 300, damping: 20 }}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                              <span className="text-[11px]" style={{ fontWeight: 500, color: colors.textPrimary }}>{m.label}</span>
                            </div>
                            <div className="w-full h-2 rounded-full mb-1" style={{ backgroundColor: `${m.color}15` }}>
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: m.color }}
                                initial={{ width: "0%" }}
                                animate={{ width: `${m.score}%` }}
                                transition={{ duration: 0.6, delay: 0.1 + mIdx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px]" style={{ color: colors.textMuted }}>{m.desc}</span>
                              <span className="text-[10px] font-mono" style={{ fontWeight: 600, color: m.color }}>{m.score}%</span>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Two column layout — staggered */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Important Chats — 2 cols */}
          <motion.div
            className="lg:col-span-2 rounded-xl overflow-hidden"
            style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
            variants={fadeSlideUp}
          >
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${cardBorder}` }}>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 8, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <MessageSquare className="w-4 h-4" style={{ color: colors.crystal }} />
                </motion.div>
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
                      backgroundColor: chatFilter === "all" ? `${colors.crystal}15` : "transparent",
                      color: chatFilter === "all" ? colors.crystal : colors.textMuted,
                    }}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setChatFilter("starred")}
                    className="px-2.5 py-1 text-[10px] transition-colors"
                    style={{
                      borderLeft: `1px solid ${cardBorder}`,
                      backgroundColor: chatFilter === "starred" ? `${colors.crystal}15` : "transparent",
                      color: chatFilter === "starred" ? colors.crystal : colors.textMuted,
                    }}
                  >
                    <Star className="w-3 h-3 inline-block mr-1" />
                    Starred
                  </button>
                </div>
              )}
            </div>

            {isNewUser ? (
              <motion.div
                className="px-6 py-12 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <MessageSquare className="w-10 h-10 mx-auto mb-3" style={{ color: colors.textMuted }} />
                </motion.div>
                <div className="text-[13px] mb-1" style={{ fontWeight: 500, color: colors.textSecondary }}>
                  No conversations yet
                </div>
                <p className="text-[11px] max-w-xs mx-auto" style={{ color: colors.textMuted, lineHeight: 1.5 }}>
                  Upload a transcript and start chatting with AI to see your important conversations and their confidence scores here.
                </p>
              </motion.div>
            ) : (
              <div className="divide-y" style={{ borderColor: `${cardBorder}50` }}>
                {filteredChats.map((chat, chatIdx) => (
                  <motion.button
                    key={chat.id}
                    className="w-full text-left px-4 py-3 transition-colors group"
                    style={{ borderColor: isDark ? "rgba(42,45,66,0.5)" : "rgba(226,224,219,0.5)" }}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + chatIdx * 0.07, type: "spring", stiffness: 260, damping: 22 }}
                    whileHover={{ backgroundColor: cardHover, x: 2 }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {chat.starred && (
                            <motion.span
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: chatIdx * 0.4 }}
                            >
                              <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                            </motion.span>
                          )}
                          <span className="text-[12px] truncate" style={{ fontWeight: 500, color: colors.textPrimary }}>
                            {chat.title}
                          </span>
                        </div>
                        <p className="text-[11px] line-clamp-2" style={{ color: colors.textSecondary }}>
                          {chat.preview}
                        </p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <ConfidenceDot score={chat.confidence} />
                          <div className="hidden sm:flex items-center gap-2">
                            <AnimatedConfidenceBar score={chat.subScores.faithfulness} color="#10B981" width="w-10" delay={0.3 + chatIdx * 0.05} />
                            <AnimatedConfidenceBar score={chat.subScores.relevance} color="#00C9D6" width="w-10" delay={0.35 + chatIdx * 0.05} />
                            <AnimatedConfidenceBar score={chat.subScores.precision} color="#5C6CF5" width="w-10" delay={0.4 + chatIdx * 0.05} />
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
                      <motion.div
                        className="shrink-0"
                        initial={{ opacity: 0, x: -4 }}
                        whileHover={{ x: 2 }}
                      >
                        <ArrowUpRight
                          className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: colors.crystal }}
                        />
                      </motion.div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Right column */}
          <motion.div className="flex flex-col gap-4" variants={fadeSlideUp}>
            {/* Recent Activity */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Clock className="w-4 h-4" style={{ color: colors.crystal }} />
                </motion.div>
                <span className="text-[13px]" style={{ fontWeight: 600, color: colors.textPrimary }}>
                  Recent Activity
                </span>
              </div>

              {isNewUser ? (
                <div className="px-4 py-8 text-center">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: colors.textMuted }} />
                  </motion.div>
                  <div className="text-[11px]" style={{ color: colors.textMuted }}>
                    Your activity will appear here
                  </div>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: `${cardBorder}50` }}>
                  {recentActivity.map((item, i) => (
                    <motion.div
                      key={i}
                      className="px-4 py-2.5 flex items-center gap-3"
                      style={{ borderColor: isDark ? "rgba(42,45,66,0.5)" : "rgba(226,224,219,0.5)" }}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.06, type: "spring", stiffness: 260, damping: 22 }}
                      whileHover={{ x: 3, backgroundColor: cardHover }}
                    >
                      <motion.div
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${colors.crystal}12` }}
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <item.icon className="w-3 h-3" style={{ color: colors.crystal }} />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] truncate" style={{ color: colors.textPrimary }}>
                          <span style={{ color: colors.textMuted }}>{item.action}</span>{" "}
                          {item.target}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.format && (
                            <span
                              className="text-[9px] font-mono px-1 py-0.5 rounded"
                              style={{ backgroundColor: `${colors.crystal}12`, color: colors.crystal }}
                            >
                              {item.format}
                            </span>
                          )}
                          <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>
                            {item.time}
                          </span>
                        </div>
                      </div>
                    </motion.div>
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
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <BarChart3 className="w-4 h-4" style={{ color: colors.crystal }} />
                </motion.div>
                <span className="text-[13px]" style={{ fontWeight: 600, color: colors.textPrimary }}>
                  Top Speakers
                </span>
              </div>

              {isNewUser ? (
                <div className="px-4 py-8 text-center">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Users className="w-8 h-8 mx-auto mb-2" style={{ color: colors.textMuted }} />
                  </motion.div>
                  <div className="text-[11px]" style={{ color: colors.textMuted }}>
                    Speakers detected from your transcripts
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {topSpeakers.map((speaker, spIdx) => (
                    <motion.div
                      key={speaker.name}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + spIdx * 0.08, type: "spring", stiffness: 260, damping: 22 }}
                    >
                      <motion.div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] shrink-0"
                        style={{ backgroundColor: speaker.color }}
                        whileHover={{ scale: 1.15 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        {speaker.initials}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px]" style={{ fontWeight: 500, color: colors.textPrimary }}>
                          {speaker.name}
                        </div>
                        <div className="w-full h-1.5 rounded-full mt-1" style={{ backgroundColor: `${colors.border}` }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: speaker.color }}
                            initial={{ width: "0%" }}
                            animate={{ width: `${(speaker.sessions / 18) * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.6 + spIdx * 0.12, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] font-mono shrink-0" style={{ color: colors.textMuted }}>
                        {speaker.sessions} sessions
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}