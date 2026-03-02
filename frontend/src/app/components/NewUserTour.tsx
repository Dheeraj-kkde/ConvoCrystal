import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  ArrowLeft,
  X,
  Upload,
  MessageSquare,
  Sparkles,
  Download,
  BarChart3,
  History,
  Layout,
  PanelLeft,
  Search,
  Rocket,
} from "lucide-react";
import { useTheme } from "./ThemeContext";
import { useUser } from "./UserContext";
import { CrystalLogo } from "./Logo";

interface NewUserTourProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TourSlide {
  title: string;
  subtitle: string;
  description: string;
  icon: typeof Upload;
  color: string;
  illustration: "workspace" | "chat" | "confidence" | "editor" | "export" | "welcome" | "done";
  tips?: string[];
}

const slides: TourSlide[] = [
  {
    title: "Welcome to ConvoCrystal",
    subtitle: "Your AI-powered meeting assistant",
    description: "ConvoCrystal transforms raw meeting transcripts into polished, searchable documents with AI-powered insights. Let's take a quick tour of the interface.",
    icon: Rocket,
    color: "#5C6CF5",
    illustration: "welcome",
    tips: ["Takes about 1 minute", "You can replay this anytime from the ? button"],
  },
  {
    title: "The Workspace Layout",
    subtitle: "Everything at a glance",
    description: "Your workspace has three main areas: the Sidebar on the left for navigation and your transcript library, the Chat Panel in the center for AI conversations, and the Editor Panel on the right for document refinement.",
    icon: Layout,
    color: "#5C6CF5",
    illustration: "workspace",
    tips: [
      "Sidebar: Navigate between Library, Overview, Documents, and Settings",
      "Chat: Ask AI questions about your transcripts",
      "Editor: Refine and polish your documents",
    ],
  },
  {
    title: "Upload Your Transcripts",
    subtitle: "Step 1 of your workflow",
    description: "Click the Upload button in the sidebar or top bar to import meeting recordings. We support VTT, SRT, TXT, DOCX, and JSON formats. ConvoCrystal automatically detects speakers, timestamps, and content structure.",
    icon: Upload,
    color: "#5C6CF5",
    illustration: "chat",
    tips: [
      "Drag & drop files directly into the app",
      "Supports audio/video + text formats",
      "Speaker detection is automatic",
    ],
  },
  {
    title: "Chat with Your Meetings",
    subtitle: "AI-powered conversation analysis",
    description: "Once a transcript is loaded, ask the AI anything about it. Get citation-backed answers that reference specific moments in the meeting. Ask follow-up questions to dive deeper into any topic.",
    icon: MessageSquare,
    color: "#00C9D6",
    illustration: "chat",
    tips: [
      "\"What were the key decisions made?\"",
      "\"Summarize what Sarah said about pricing\"",
      "\"List all action items with owners\"",
    ],
  },
  {
    title: "AI Confidence Scoring",
    subtitle: "Transparency you can trust",
    description: "Every AI response includes a confidence score broken down into three sub-metrics: Faithfulness (accuracy to source), Relevance (how well it answers your question), and Precision (specificity of the response).",
    icon: BarChart3,
    color: "#10B981",
    illustration: "confidence",
    tips: [
      "Green (85%+): High confidence answer",
      "Yellow (65-84%): Moderate — verify key claims",
      "Red (<65%): Low — treat as a starting point",
    ],
  },
  {
    title: "Refine with AI",
    subtitle: "Polish your documents",
    description: "Select any text in the editor and click AI Refine to improve, expand, shorten, or rephrase it. Changes stream in real-time, and you can accept or reject each suggestion. Commit changes when you're ready.",
    icon: Sparkles,
    color: "#00C9D6",
    illustration: "editor",
    tips: [
      "Select text → Click 'AI Refine' in the toolbar",
      "Watch streaming changes in real-time",
      "Accept/reject individual suggestions",
    ],
  },
  {
    title: "Export & Version History",
    subtitle: "Share your work, track changes",
    description: "Export polished documents to PDF, DOCX, Markdown, or Notion. Every edit is tracked in Version History — browse the timeline, compare changes, and restore any previous version instantly.",
    icon: Download,
    color: "#10B981",
    illustration: "export",
    tips: [
      "One-click export to PDF, DOCX, MD, Notion",
      "Full revision timeline with diffs",
      "Restore any previous version",
    ],
  },
  {
    title: "You're All Set!",
    subtitle: "Start with your first upload",
    description: "You now know everything you need to get started. Upload a transcript, chat with AI, refine your documents, and export. Check your progress in the Getting Started tracker at the bottom-right.",
    icon: Rocket,
    color: "#5C6CF5",
    illustration: "done",
    tips: [
      "Track your progress with the Getting Started widget",
      "Explore Overview Dashboard for stats & scores",
      "Visit Settings to customize your experience",
    ],
  },
];

// Conceptual illustration components (no DOM element dependency)
function SlideIllustration({ type, color, isDark }: { type: string; color: string; isDark: boolean }) {
  const bg = isDark ? "#0F1018" : "#F7F6F3";
  const panelBg = isDark ? "#1A1D2E" : "#FFFFFF";
  const border = isDark ? "#2A2D42" : "#E2E0DB";

  switch (type) {
    case "welcome":
      return (
        <div className="flex justify-center py-6">
          <motion.div
            className="w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #5C6CF5, #3A4AE8)",
              boxShadow: "0 12px 40px rgba(92,108,245,0.35)",
            }}
            animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <CrystalLogo size={56} />
          </motion.div>
        </div>
      );

    case "workspace":
      return (
        <div className="rounded-lg overflow-hidden" style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
          {/* Mini topbar */}
          <div className="h-6 px-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${border}` }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#5C6CF5" }} />
            <div className="w-16 h-1.5 rounded-full" style={{ backgroundColor: border }} />
            <div className="flex-1" />
            <div className="w-8 h-1.5 rounded-full" style={{ backgroundColor: border }} />
          </div>
          <div className="flex h-28">
            {/* Mini sidebar */}
            <div className="w-14 p-1.5 space-y-1.5 shrink-0" style={{ borderRight: `1px solid ${border}` }}>
              <div className="text-[6px] text-center" style={{ color: "#5C6CF5", fontWeight: 600 }}>Sidebar</div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-2 rounded" style={{ backgroundColor: `${color}12` }} />
              ))}
            </div>
            {/* Mini chat */}
            <div className="flex-1 p-2 space-y-1.5" style={{ borderRight: `1px solid ${border}` }}>
              <div className="text-[6px] text-center" style={{ color: "#00C9D6", fontWeight: 600 }}>Chat Panel</div>
              <div className="h-3 rounded w-3/4" style={{ backgroundColor: `#00C9D6${isDark ? "15" : "10"}` }} />
              <div className="h-3 rounded w-full" style={{ backgroundColor: `${border}60` }} />
              <div className="h-3 rounded w-2/3" style={{ backgroundColor: `#00C9D6${isDark ? "15" : "10"}` }} />
            </div>
            {/* Mini editor */}
            <div className="flex-1 p-2 space-y-1.5">
              <div className="text-[6px] text-center" style={{ color: "#00C9D6", fontWeight: 600 }}>Editor Panel</div>
              <div className="h-2 rounded w-full" style={{ backgroundColor: `${border}60` }} />
              <div className="h-2 rounded w-5/6" style={{ backgroundColor: `${border}60` }} />
              <div className="h-2 rounded w-3/4" style={{ backgroundColor: `${border}60` }} />
              <div className="h-2 rounded w-full" style={{ backgroundColor: `${border}60` }} />
            </div>
          </div>
        </div>
      );

    case "confidence":
      return (
        <div className="space-y-3 px-2 py-3">
          {[
            { label: "Faithfulness", score: 96, color: "#10B981" },
            { label: "Relevance", score: 91, color: "#00C9D6" },
            { label: "Precision", score: 88, color: "#5C6CF5" },
          ].map((m) => (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="text-[10px]" style={{ fontWeight: 500, color: isDark ? "#E8EAF6" : "#1A1916" }}>{m.label}</span>
                </div>
                <span className="text-[10px] font-mono" style={{ fontWeight: 600, color: m.color }}>{m.score}%</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ backgroundColor: `${m.color}15` }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: m.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${m.score}%` }}
                  transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                />
              </div>
            </div>
          ))}
          <div className="text-center pt-1">
            <span
              className="text-[11px] font-mono px-3 py-1 rounded-md"
              style={{ fontWeight: 600, color: "#10B981", backgroundColor: "rgba(16,185,129,0.1)" }}
            >
              Overall: 92%
            </span>
          </div>
        </div>
      );

    case "chat":
      return (
        <div className="space-y-2 px-2 py-3">
          {/* User message */}
          <div className="flex justify-end">
            <div className="px-3 py-1.5 rounded-lg text-[9px] max-w-[75%]" style={{ backgroundColor: `${color}15`, color }}>
              What were the key decisions?
            </div>
          </div>
          {/* AI response */}
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-lg text-[9px] max-w-[85%]" style={{ backgroundColor: panelBg, border: `1px solid ${border}`, color: isDark ? "#E8EAF6" : "#1A1916" }}>
              Based on the Q4 Strategy Review transcript, here are 3 key decisions:
              <br />
              <span className="text-[8px]" style={{ color: isDark ? "#9BA3C8" : "#57554F" }}>
                1. APAC expansion approved for Q1...
              </span>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[7px] px-1 py-0.5 rounded" style={{ backgroundColor: "rgba(16,185,129,0.1)", color: "#10B981" }}>94% confident</span>
                <span className="text-[7px]" style={{ color: isDark ? "#5C6490" : "#928F87" }}>3 citations</span>
              </div>
            </div>
          </div>
        </div>
      );

    case "editor":
      return (
        <div className="px-2 py-3 space-y-2">
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-2 py-1 rounded" style={{ backgroundColor: panelBg, border: `1px solid ${border}` }}>
            <div className="w-10 h-2 rounded" style={{ backgroundColor: `#00C9D6${isDark ? "30" : "20"}` }} />
            <div className="w-8 h-2 rounded" style={{ backgroundColor: `${border}60` }} />
            <div className="flex-1" />
            <div className="px-1.5 py-0.5 rounded text-[7px]" style={{ backgroundColor: "#5C6CF5", color: "white" }}>AI Refine</div>
          </div>
          {/* Text with highlight */}
          <div className="space-y-1 px-1">
            <div className="h-2 rounded w-full" style={{ backgroundColor: `${border}50` }} />
            <div className="h-2 rounded w-full" style={{ backgroundColor: "rgba(92,108,245,0.15)", border: "1px solid rgba(92,108,245,0.3)" }} />
            <div className="h-2 rounded w-4/5" style={{ backgroundColor: `${border}50` }} />
            <div className="h-2 rounded w-full" style={{ backgroundColor: `${border}50` }} />
          </div>
          <div className="flex items-center gap-2 justify-center">
            <span className="text-[7px] px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(16,185,129,0.1)", color: "#10B981" }}>Accept</span>
            <span className="text-[7px] px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(244,63,94,0.1)", color: "#F43F5E" }}>Reject</span>
          </div>
        </div>
      );

    case "export":
      return (
        <div className="px-2 py-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "PDF", color: "#F43F5E" },
              { label: "DOCX", color: "#3B82F6" },
              { label: "Markdown", color: "#10B981" },
              { label: "Notion", color: isDark ? "#FFFFFF" : "#000000" },
            ].map((fmt) => (
              <div
                key={fmt.label}
                className="flex items-center gap-2 px-2 py-2 rounded-lg"
                style={{ backgroundColor: panelBg, border: `1px solid ${border}` }}
              >
                <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: `${fmt.color}15` }}>
                  <Download className="w-2.5 h-2.5" style={{ color: fmt.color }} />
                </div>
                <span className="text-[9px]" style={{ fontWeight: 500, color: isDark ? "#E8EAF6" : "#1A1916" }}>{fmt.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 justify-center pt-1">
            <History className="w-3 h-3" style={{ color: "#F59E0B" }} />
            <span className="text-[8px]" style={{ color: isDark ? "#9BA3C8" : "#57554F" }}>
              Full version history with diffs
            </span>
          </div>
        </div>
      );

    case "done":
      return (
        <div className="flex flex-col items-center py-6 gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Rocket className="w-12 h-12" style={{ color: "#5C6CF5" }} />
          </motion.div>
          <div className="flex items-center gap-2">
            {[
              { label: "Upload", color: "#5C6CF5" },
              { label: "Chat", color: "#00C9D6" },
              { label: "Refine", color: "#00C9D6" },
              { label: "Export", color: "#10B981" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                className="px-2 py-1 rounded-md text-[8px]"
                style={{ backgroundColor: `${s.color}12`, color: s.color, fontWeight: 600 }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.15 }}
              >
                {s.label}
              </motion.div>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}

export function NewUserTour({ isOpen, onClose }: NewUserTourProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0); // -1 = back, 1 = forward
  const { isDark, colors } = useTheme();
  const { completeStep, setHasCompletedWelcome } = useUser();

  if (!isOpen) return null;

  const slide = slides[currentSlide];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide((s) => s + 1);
    } else {
      // Finish tour — mark welcome as completed
      setHasCompletedWelcome(true);
      setCurrentSlide(0);
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide((s) => s - 1);
    }
  };

  const handleSkip = () => {
    setHasCompletedWelcome(true);
    setCurrentSlide(0);
    onClose();
  };

  const panelBg = isDark ? "#1A1D2E" : "#FFFFFF";
  const panelBorder = isDark ? "#2A2D42" : "#E2E0DB";
  const mutedColor = isDark ? "#5C6490" : "#928F87";

  const slideVariants = {
    enter: (d: number) => ({
      x: d > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (d: number) => ({
      x: d > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={handleSkip}
      />

      {/* Modal */}
      <motion.div
        className="relative w-[420px] max-w-[95vw] max-h-[85vh] rounded-2xl overflow-hidden overflow-y-auto shadow-2xl"
        style={{ backgroundColor: panelBg, border: `1px solid ${panelBorder}` }}
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Close */}
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 p-1.5 rounded-lg z-10 transition-colors"
          style={{ color: mutedColor }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Slide header accent */}
        <div
          className="h-1"
          style={{
            background: `linear-gradient(90deg, ${slide.color}, ${slide.color}60)`,
          }}
        />

        {/* Content */}
        <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Icon + title */}
              <div className="px-6 pt-5 pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${slide.color}12` }}
                  >
                    <slide.icon className="w-5 h-5" style={{ color: slide.color }} />
                  </div>
                  <div>
                    <h2 className="text-[16px]" style={{ fontWeight: 600, color: colors.textPrimary }}>
                      {slide.title}
                    </h2>
                    <p className="text-[11px]" style={{ color: slide.color }}>{slide.subtitle}</p>
                  </div>
                </div>
                <p className="text-[12px]" style={{ color: colors.textSecondary, lineHeight: 1.6 }}>
                  {slide.description}
                </p>
              </div>

              {/* Illustration */}
              <div className="px-6 py-2">
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ backgroundColor: isDark ? "#0F1018" : "#F7F6F3", border: `1px solid ${panelBorder}` }}
                >
                  <SlideIllustration type={slide.illustration} color={slide.color} isDark={isDark} />
                </div>
              </div>

              {/* Tips */}
              {slide.tips && (
                <div className="px-6 pb-3">
                  <div className="space-y-1.5">
                    {slide.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: slide.color }} />
                        <span className="text-[10px]" style={{ color: colors.textMuted, lineHeight: 1.5 }}>
                          {tip}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 flex items-center justify-between"
          style={{ borderTop: `1px solid ${panelBorder}` }}
        >
          {/* Progress dots */}
          <div className="flex items-center gap-1">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > currentSlide ? 1 : -1); setCurrentSlide(i); }}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === currentSlide ? 18 : 6,
                  backgroundColor:
                    i === currentSlide
                      ? slide.color
                      : i < currentSlide
                      ? `${slide.color}50`
                      : isDark ? "#2A2D42" : "#E2E0DB",
                }}
              />
            ))}
            <span className="text-[9px] font-mono ml-2" style={{ color: mutedColor }}>
              {currentSlide + 1}/{slides.length}
            </span>
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-2">
            {currentSlide > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] transition-colors"
                style={{ border: `1px solid ${panelBorder}`, color: colors.textSecondary }}
              >
                <ArrowLeft className="w-3 h-3" />
                Back
              </button>
            )}
            {currentSlide === 0 && (
              <button
                onClick={handleSkip}
                className="text-[10px] hover:opacity-80 transition-opacity px-2"
                style={{ color: mutedColor }}
              >
                Skip Tour
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-md text-white text-[10px] transition-colors hover:brightness-110"
              style={{ backgroundColor: slide.color, fontWeight: 500 }}
            >
              {currentSlide < slides.length - 1 ? "Next" : "Get Started"}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}