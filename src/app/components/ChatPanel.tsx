import { useState, useEffect, useRef } from "react";
import {
  Send,
  Square,
  RotateCcw,
  Download,
  Plus,
  Copy,
  ArrowUpRight,
  Quote,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Pin,
} from "lucide-react";
import { useTheme } from "./ThemeContext";

const stageSteps = [
  { label: "Extracting context", done: true },
  { label: "Analyzing semantics", done: true },
  { label: "Generating response", done: false, active: true },
];

const messages: Array<{
  id: number;
  role: "user" | "ai";
  text: string;
  confidence?: { overall: number; faithfulness: number; relevance: number; precision: number };
  citations?: Array<{ num: number; speaker: string; time: string }>;
}> = [
  {
    id: 1,
    role: "user",
    text: "What were the key decisions made in the Q4 strategy meeting?",
  },
  {
    id: 2,
    role: "ai",
    text: "Based on the transcript analysis, three key decisions were reached during the Q4 Strategy Review:\n\n**1. Market Expansion Timeline** — The team agreed to accelerate the APAC launch from Q2 to late Q1, contingent on completing the localization sprint by January 15th. Sarah Chen (VP Product) will own the go/no-go checkpoint.\n\n**2. Pricing Model Revision** — The consensus was to move from per-seat to usage-based pricing for enterprise tier, with a 90-day grandfather clause for existing customers. Finance will model the revenue impact by end of week.\n\n**3. Engineering Headcount** — Approved hiring 4 additional backend engineers focused on the real-time pipeline, with a budget reallocation from the deferred mobile initiative.",
    confidence: { overall: 91, faithfulness: 94, relevance: 88, precision: 92 },
    citations: [
      { num: 1, speaker: "Sarah Chen", time: "14:32" },
      { num: 2, speaker: "Marcus Webb", time: "22:15" },
      { num: 3, speaker: "David Park", time: "31:47" },
    ],
  },
  {
    id: 3,
    role: "user",
    text: "Were there any disagreements or unresolved points?",
  },
  {
    id: 4,
    role: "ai",
    text: "Yes, two notable points of contention emerged:\n\n**Timeline Risk for APAC** — David Park raised concerns about the accelerated timeline, noting that the localization team is already at capacity. He suggested a phased rollout starting with Japan only. This was acknowledged but not formally resolved — Sarah committed to a feasibility review by Friday.\n\n**Mobile Deprioritization** — Alex Rivera (Head of Mobile) pushed back on deferring the mobile roadmap, arguing that 38% of trial signups come from mobile. The group agreed to revisit in the January planning cycle, but no firm commitment was made.",
    confidence: { overall: 87, faithfulness: 90, relevance: 85, precision: 86 },
    citations: [
      { num: 1, speaker: "David Park", time: "18:05" },
      { num: 2, speaker: "Alex Rivera", time: "35:22" },
    ],
  },
  {
    id: 5,
    role: "user",
    text: "Summarize the action items with owners and deadlines.",
  },
];

const streamingText =
  "Here are the extracted action items from the Q4 Strategy Review, organized by owner:\n\n**Sarah Chen (VP Product)**\n• Complete APAC localization feasibility review — Due: Friday, Dec 6\n• Present go/no-go recommendation for accelerated launch\n\n**Marcus Webb (CFO)**\n• Model revenue impact of usage-based pricing transition — Due: End of week";

const suggestedPrompts = [
  "What risks were identified?",
  "Generate a follow-up email draft",
  "Compare with last quarter's decisions",
  "Who spoke the most?",
  "Extract sentiment analysis",
];

function ConfidencePanel({ confidence, dataOnboarding }: {
  confidence: { overall: number; faithfulness: number; relevance: number; precision: number };
  dataOnboarding?: string;
}) {
  const { colors, isDark } = useTheme();
  const color = confidence.overall >= 85 ? "#10B981" : confidence.overall >= 65 ? "#F59E0B" : "#F43F5E";
  const subScores = [
    { label: "Faith", value: confidence.faithfulness },
    { label: "Relev", value: confidence.relevance },
    { label: "Prec", value: confidence.precision },
  ];
  const trackBg = isDark ? "#2A2D42" : "#D9D6D0";

  return (
    <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap" {...(dataOnboarding ? { "data-onboarding": dataOnboarding } : {})}>
      <span
        className="px-2 py-0.5 rounded-full text-[10px] font-mono"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {confidence.overall}%
      </span>
      {subScores.map((s) => (
        <div key={s.label} className="flex items-center gap-1 sm:gap-1.5">
          <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>{s.label}</span>
          <div className="w-8 sm:w-12 h-1 rounded-full overflow-hidden" style={{ backgroundColor: trackBg }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${s.value}%`,
                backgroundColor: s.value >= 85 ? "#10B981" : s.value >= 65 ? "#F59E0B" : "#F43F5E",
              }}
            />
          </div>
          <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>{s.value}%</span>
        </div>
      ))}
    </div>
  );
}

export function ChatPanel() {
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(true);
  const [visibleChars, setVisibleChars] = useState(0);
  const [hoveredMessage, setHoveredMessage] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isDark, colors } = useTheme();

  useEffect(() => {
    if (isStreaming && visibleChars < streamingText.length) {
      const speed = Math.random() * 20 + 10;
      const timer = setTimeout(() => setVisibleChars((c) => c + 1), speed);
      return () => clearTimeout(timer);
    }
    if (visibleChars >= streamingText.length) {
      setIsStreaming(false);
    }
  }, [isStreaming, visibleChars]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleChars]);

  const displayedStreaming = streamingText.slice(0, visibleChars);

  // Theme-derived colors
  const aiBubbleBg = isDark ? colors.bgPanel : "#FFFFFF";
  const aiBubbleBorder = colors.border;
  const aiBubbleText = colors.textPrimary;
  const hoverActionsBg = isDark ? colors.bgPanel : "#FFFFFF";
  const hoverActionsIcon = colors.textSecondary;
  const citationBg = isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.08)";
  const citationText = "#818CF8";
  const citationBorder = isDark ? "rgba(42,45,66,0.6)" : "rgba(217,214,208,0.6)";
  const scrollbarColor = isDark ? `${colors.border} transparent` : `${colors.border} transparent`;
  const dividerColor = colors.border;
  const streamBorderColor = isDark ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.2)";
  const stageArrowColor = colors.border;
  const stageDotBorder = colors.border;
  const inputBg = isDark ? colors.bgPanel : "#FFFFFF";
  const inputBorder = colors.border;
  const promptBorder = colors.border;
  const promptText = colors.textSecondary;
  const promptHoverBorder = "#6366F1";
  const promptHoverText = colors.textPrimary;

  const renderText = (text: string, textColor: string) =>
    text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} style={{ fontWeight: 600, color: textColor }}>
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );

  return (
    <div className="flex flex-col h-full transition-colors duration-300"
      style={{ backgroundColor: colors.bgBase }}>
      {/* Header */}
      <div className="h-12 px-3 sm:px-4 flex items-center justify-between shrink-0"
        style={{ borderBottom: `1px solid ${colors.border}` }}
        data-onboarding="chat">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[11px] font-mono hidden sm:inline" style={{ color: colors.textMuted }}>Connected</span>
          </div>
          <div className="w-px h-3 hidden sm:block" style={{ backgroundColor: dividerColor }} />
          <span className="text-[12px] truncate" style={{ color: colors.textSecondary }}>Q4 Strategy Review</span>
          <span className="text-[10px] font-mono shrink-0 hidden sm:inline" style={{ color: colors.textMuted }}>47:23</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded hover:bg-[#6366F1]/10 transition-colors" title="New session">
            <Plus className="w-3.5 h-3.5" style={{ color: colors.textMuted }} />
          </button>
          <button className="p-1.5 rounded hover:bg-[#6366F1]/10 transition-colors" title="Clear">
            <RotateCcw className="w-3.5 h-3.5" style={{ color: colors.textMuted }} />
          </button>
          <button className="p-1.5 rounded hover:bg-[#6366F1]/10 transition-colors" title="Export chat">
            <Download className="w-3.5 h-3.5" style={{ color: colors.textMuted }} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-4" style={{ scrollbarWidth: "thin", scrollbarColor }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="relative group max-w-[88%] sm:max-w-[72%]"
              style={
                msg.role === "user"
                  ? {
                      backgroundColor: "#6366F1",
                      color: "#FFFFFF",
                      borderRadius: "12px 12px 4px 12px",
                      padding: "10px 14px",
                    }
                  : {
                      backgroundColor: aiBubbleBg,
                      color: aiBubbleText,
                      borderRadius: "12px 12px 12px 4px",
                      padding: "10px 14px",
                      border: `1px solid ${aiBubbleBorder}`,
                    }
              }
              onMouseEnter={() => setHoveredMessage(msg.id)}
              onMouseLeave={() => setHoveredMessage(null)}
            >
              {/* Hover actions for AI messages */}
              {msg.role === "ai" && hoveredMessage === msg.id && (
                <div
                  className="absolute -top-2 right-2 flex items-center gap-1 rounded-md p-0.5 shadow-lg z-10 animate-[fadeIn_0.15s_ease-out]"
                  style={{ backgroundColor: hoverActionsBg, border: `1px solid ${colors.border}` }}
                >
                  <button className="p-1 rounded hover:bg-[#6366F1]/15 transition-colors" title="Copy">
                    <Copy className="w-3 h-3" style={{ color: hoverActionsIcon }} />
                  </button>
                  <button className="p-1 rounded hover:bg-[#6366F1]/15 transition-colors" title="Push to editor">
                    <ArrowUpRight className="w-3 h-3" style={{ color: hoverActionsIcon }} />
                  </button>
                  <button className="p-1 rounded hover:bg-[#6366F1]/15 transition-colors" title="Cite">
                    <Quote className="w-3 h-3" style={{ color: hoverActionsIcon }} />
                  </button>
                </div>
              )}

              <div className="text-[13px] leading-relaxed whitespace-pre-wrap">
                {renderText(msg.text, msg.role === "user" ? "#FFFFFF" : aiBubbleText)}
              </div>

              {/* Citations */}
              {msg.citations && (
                <div className="flex flex-wrap gap-1.5 mt-2 pt-2" style={{ borderTop: `1px solid ${citationBorder}` }}>
                  {msg.citations.map((c) => (
                    <span
                      key={c.num}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono cursor-pointer transition-colors hover:opacity-80"
                      style={{ backgroundColor: citationBg, color: citationText }}
                    >
                      [{c.num}] {c.speaker} · {c.time}
                    </span>
                  ))}
                </div>
              )}

              {/* Confidence */}
              {msg.confidence && <ConfidencePanel confidence={msg.confidence} dataOnboarding={msg.id === 2 ? "scoring" : undefined} />}
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="max-w-[92%] sm:max-w-[72%]">
              {/* Stage indicator */}
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 px-2 flex-wrap">
                {stageSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    {step.done ? (
                      <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                    ) : step.active ? (
                      <Loader2 className="w-3 h-3 text-[#6366F1] animate-spin" />
                    ) : (
                      <div className="w-3 h-3 rounded-full" style={{ border: `1px solid ${stageDotBorder}` }} />
                    )}
                    <span
                      className={`text-[9px] font-mono ${
                        step.done ? "text-[#10B981]" : step.active ? "text-[#6366F1]" : ""
                      }`}
                      style={!step.done && !step.active ? { color: colors.textMuted } : undefined}
                    >
                      {step.label}
                    </span>
                    {i < stageSteps.length - 1 && (
                      <ArrowRight className="w-2.5 h-2.5" style={{ color: stageArrowColor }} />
                    )}
                  </div>
                ))}
              </div>

              <div
                className="rounded-xl rounded-bl-sm px-3.5 py-2.5"
                style={{
                  backgroundColor: aiBubbleBg,
                  color: aiBubbleText,
                  borderTop: `1px solid ${streamBorderColor}`,
                  borderRight: `1px solid ${streamBorderColor}`,
                  borderBottom: `1px solid ${streamBorderColor}`,
                  borderLeft: "2px solid #06B6D4",
                }}
              >
                <div className="text-[13px] leading-relaxed whitespace-pre-wrap">
                  {renderText(displayedStreaming, aiBubbleText)}
                  {isStreaming && (
                    <span className="inline-block w-0.5 h-3.5 bg-[#6366F1] ml-0.5 animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Completed streaming */}
        {!isStreaming && (
          <div className="flex justify-start">
            <div
              className="max-w-[88%] sm:max-w-[72%] rounded-xl rounded-bl-sm px-3.5 py-2.5"
              style={{
                backgroundColor: aiBubbleBg,
                color: aiBubbleText,
                border: `1px solid ${aiBubbleBorder}`,
              }}
            >
              <div className="text-[13px] leading-relaxed whitespace-pre-wrap">
                {renderText(streamingText, aiBubbleText)}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      <div className="px-3 sm:px-4 pb-2 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              className="shrink-0 px-3 py-1 rounded-full text-[11px] transition-all duration-160 whitespace-nowrap"
              style={{ color: promptText, border: `1px solid ${promptBorder}` }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = promptHoverBorder;
                e.currentTarget.style.color = promptHoverText;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = promptBorder;
                e.currentTarget.style.color = promptText;
              }}
              onClick={() => setInputValue(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Composer */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 shrink-0">
        <div
          className="relative flex items-end gap-2 rounded-xl px-3 py-2 transition-colors"
          style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}` }}
        >
          <button className="p-1 rounded hover:bg-[#6366F1]/10 transition-colors shrink-0 mb-0.5" title="Pin context">
            <Pin className="w-3.5 h-3.5" style={{ color: colors.textMuted }} />
          </button>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about this transcript…"
            className="flex-1 bg-transparent text-[13px] outline-none resize-none min-h-[20px] max-h-[80px]"
            style={{ color: colors.textPrimary }}
            rows={1}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 80) + "px";
            }}
          />
          <div className="flex items-center gap-1.5 shrink-0 mb-0.5">
            <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>
              {inputValue.length > 0 ? `${inputValue.length} chars` : ""}
            </span>
            {isStreaming ? (
              <button
                onClick={() => setIsStreaming(false)}
                className="p-1.5 rounded-md bg-[#F43F5E] hover:bg-[#F43F5E]/80 transition-colors"
              >
                <Square className="w-3 h-3 text-white" />
              </button>
            ) : (
              <button
                className="p-1.5 rounded-md bg-[#6366F1] hover:bg-[#818CF8] transition-colors disabled:opacity-30"
                disabled={!inputValue.trim()}
                style={{ boxShadow: inputValue.trim() ? "0 0 8px rgba(99,102,241,0.15)" : "none" }}
              >
                <Send className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}