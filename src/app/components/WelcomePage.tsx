import { useState } from "react";
import {
  Upload,
  MessageSquare,
  Sparkles,
  FileText,
  Download,
  Shield,
  ArrowRight,
  Play,
  ChevronRight,
  BarChart3,
  Zap,
  Users,
} from "lucide-react";
import { useTheme } from "./ThemeContext";
import { useUser } from "./UserContext";
import { CrystalLogo } from "./Logo";

interface WelcomePageProps {
  onStartUpload?: () => void;
  onStartTour?: () => void;
}

const features = [
  {
    icon: Upload,
    title: "Upload Transcripts",
    description: "Drag & drop meeting recordings in VTT, SRT, TXT, DOCX, or JSON. We'll parse speakers, timestamps, and content automatically.",
    color: "#6366F1",
    step: "1",
  },
  {
    icon: MessageSquare,
    title: "Chat with Your Meetings",
    description: "Ask questions about any transcript. Get citation-backed answers with confidence scores so you know how reliable each insight is.",
    color: "#06B6D4",
    step: "2",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Refinement",
    description: "Select text in the editor and let AI refine, expand, shorten, or rephrase. Watch changes stream in real-time with accept/reject.",
    color: "#8B5CF6",
    step: "3",
  },
  {
    icon: Download,
    title: "Export Anywhere",
    description: "Export polished transcripts and analysis to PDF, DOCX, Notion, or Markdown. Formatting and structure are always preserved.",
    color: "#10B981",
    step: "4",
  },
];

const quickStats = [
  { icon: BarChart3, label: "Confidence Scoring", desc: "Every AI response rated for accuracy" },
  { icon: Shield, label: "Version History", desc: "Track every edit, restore any version" },
  { icon: Users, label: "Speaker Detection", desc: "Auto-identify and label speakers" },
  { icon: Zap, label: "Real-time AI", desc: "Stream refinements as they happen" },
];

export function WelcomePage({ onStartUpload, onStartTour }: WelcomePageProps) {
  const { isDark, colors } = useTheme();
  const { setHasCompletedWelcome } = useUser();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const cardBg = isDark ? "#111320" : "#FFFFFF";
  const cardBorder = colors.border;
  const heroBg = isDark
    ? "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 60%)"
    : "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%)";

  const handleGetStarted = () => {
    setHasCompletedWelcome(true);
    if (onStartUpload) onStartUpload();
  };

  const handleTakeTour = () => {
    setHasCompletedWelcome(true);
    if (onStartTour) onStartTour();
  };

  return (
    <div
      className="h-full overflow-y-auto"
      style={{
        backgroundColor: colors.bgBase,
        scrollbarWidth: "thin",
        scrollbarColor: `${colors.border} transparent`,
      }}
    >
      {/* Hero Section */}
      <div className="relative" style={{ background: heroBg }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8 text-center">
          {/* Animated logo */}
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                boxShadow: "0 8px 32px rgba(99,102,241,0.3)",
              }}
            >
              <CrystalLogo size={44} />
            </div>
          </div>

          <h1
            className="text-[28px] sm:text-[36px] mb-3"
            style={{ fontWeight: 700, color: colors.textPrimary }}
          >
            Welcome to Convo<span style={{ color: "#6366F1" }}>Crystal</span>
          </h1>
          <p
            className="text-[15px] max-w-lg mx-auto mb-8"
            style={{ color: colors.textSecondary, lineHeight: 1.6 }}
          >
            Transform your meeting transcripts into actionable insights.
            Upload a recording, chat with AI, and export polished documents — all in one place.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <button
              onClick={handleGetStarted}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-[13px] transition-all hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, #6366F1, #818CF8)",
                boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
                fontWeight: 600,
              }}
            >
              <Upload className="w-4 h-4" />
              Upload Your First Transcript
            </button>
            <button
              onClick={handleTakeTour}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] transition-all"
              style={{
                border: `1px solid ${cardBorder}`,
                color: colors.textSecondary,
                fontWeight: 500,
              }}
            >
              <Play className="w-4 h-4" style={{ color: colors.indigo }} />
              Take the Product Tour
            </button>
          </div>

          <p className="text-[11px]" style={{ color: colors.textMuted }}>
            No credit card required · Free to start · 5 transcripts included
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="text-center mb-6">
          <h2 className="text-[18px] mb-1" style={{ fontWeight: 600, color: colors.textPrimary }}>
            How It Works
          </h2>
          <p className="text-[13px]" style={{ color: colors.textSecondary }}>
            Four steps from raw recording to polished document
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {features.map((feature, i) => (
            <div
              key={i}
              className="rounded-xl p-5 transition-all duration-200 cursor-default"
              style={{
                backgroundColor: hoveredFeature === i ? (isDark ? "#181B2E" : "#F7F6F3") : cardBg,
                border: `1px solid ${hoveredFeature === i ? `${feature.color}40` : cardBorder}`,
              }}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <div className="flex items-start gap-4">
                {/* Step number + icon */}
                <div className="relative shrink-0">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${feature.color}12` }}
                  >
                    <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                  </div>
                  <div
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white"
                    style={{ backgroundColor: feature.color, fontWeight: 700 }}
                  >
                    {feature.step}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] mb-1" style={{ fontWeight: 600, color: colors.textPrimary }}>
                    {feature.title}
                  </h3>
                  <p className="text-[12px]" style={{ color: colors.textSecondary, lineHeight: 1.5 }}>
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Confidence Scoring Highlight */}
        <div
          className="rounded-xl p-6 mb-10"
          style={{
            backgroundColor: isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.04)",
            border: `1px solid ${isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.12)"}`,
          }}
        >
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
              }}
            >
              <BarChart3 className="w-7 h-7" style={{ color: colors.indigo }} />
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] mb-2" style={{ fontWeight: 600, color: colors.textPrimary }}>
                AI Confidence Scoring
              </h3>
              <p className="text-[12px] mb-4" style={{ color: colors.textSecondary, lineHeight: 1.6 }}>
                Every AI-generated response comes with a transparency score breaking down{" "}
                <span style={{ color: "#10B981", fontWeight: 500 }}>Faithfulness</span>,{" "}
                <span style={{ color: "#06B6D4", fontWeight: 500 }}>Relevance</span>, and{" "}
                <span style={{ color: "#8B5CF6", fontWeight: 500 }}>Precision</span>{" "}
                — so you always know exactly how reliable each answer is.
              </p>

              {/* Sample score visual */}
              <div className="flex flex-wrap gap-6">
                {[
                  { label: "Faithfulness", score: 96, color: "#10B981" },
                  { label: "Relevance", score: 91, color: "#06B6D4" },
                  { label: "Precision", score: 88, color: "#8B5CF6" },
                ].map((metric) => (
                  <div key={metric.label} className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full" style={{ backgroundColor: `${metric.color}20` }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${metric.score}%`, backgroundColor: metric.color }}
                      />
                    </div>
                    <span className="text-[10px] font-mono" style={{ color: metric.color }}>
                      {metric.label} {metric.score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Capabilities Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {quickStats.map((stat, i) => (
            <div
              key={i}
              className="rounded-lg p-3 text-center"
              style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <stat.icon className="w-5 h-5 mx-auto mb-2" style={{ color: colors.indigo }} />
              <div className="text-[11px] mb-0.5" style={{ fontWeight: 600, color: colors.textPrimary }}>
                {stat.label}
              </div>
              <div className="text-[10px]" style={{ color: colors.textMuted }}>
                {stat.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Where Things Are */}
        <div
          className="rounded-xl p-6 mb-8"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <h3 className="text-[15px] mb-4" style={{ fontWeight: 600, color: colors.textPrimary }}>
            Find Your Way Around
          </h3>
          <div className="space-y-3">
            {[
              { area: "Sidebar (left)", desc: "Browse your transcript library, switch workspaces, and navigate between Overview, Documents, and Settings.", icon: "◧" },
              { area: "Chat Panel (center-left)", desc: "Ask AI questions about your transcripts. Each answer includes confidence scores with sub-metrics you can expand.", icon: "💬" },
              { area: "Editor Panel (center-right)", desc: "View and refine your polished documents. Use AI Refine to improve text, then Commit and Export.", icon: "📝" },
              { area: "Top Bar", desc: "Search everything, upload new transcripts, view version history, toggle theme, and access your profile.", icon: "▔" },
              { area: "Overview Dashboard", desc: "See all your stats at a glance — document counts, conversation highlights, confidence trends, and activity.", icon: "📊" },
              { area: "Documents Page", desc: "A complete library of everything you've uploaded and exported, with status, format, and version tracking.", icon: "📁" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? "#181B2E" : "#F7F6F3")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <span className="text-[16px] shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <div className="text-[12px]" style={{ fontWeight: 600, color: colors.textPrimary }}>
                    {item.area}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: colors.textSecondary, lineHeight: 1.5 }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pb-8">
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-[13px] transition-all hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #6366F1, #818CF8)",
              boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
              fontWeight: 600,
            }}
          >
            Get Started Now
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[10px] mt-2" style={{ color: colors.textMuted }}>
            You can always replay the product tour from the <span style={{ fontWeight: 500 }}>?</span> button in the top bar
          </p>
        </div>
      </div>
    </div>
  );
}