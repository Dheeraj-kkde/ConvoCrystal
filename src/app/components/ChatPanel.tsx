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
  MessageSquarePlus,
} from "lucide-react";
import { useTheme } from "./ThemeContext";
import { ConfidencePanel } from "./ConfidenceBadge";
import { useToast } from "./ToastSystem";

const stageSteps = [
  { label: "Extracting context", done: true },
  { label: "Analyzing semantics", done: true },
  { label: "Generating response", done: false, active: true },
];

type MessageType = {
  id: number;
  role: "user" | "ai";
  text: string;
  confidence?: { overall: number; faithfulness: number; relevance: number; precision: number };
  citations?: Array<{ num: number; speaker: string; time: string }>;
};

const initialMessages: MessageType[] = [
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

export function ChatPanel() {
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(true);
  const [visibleChars, setVisibleChars] = useState(0);
  const [hoveredMessage, setHoveredMessage] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<MessageType[]>(initialMessages);
  const [sessionName, setSessionName] = useState("Q4 Strategy Review");
  const [sessionDuration, setSessionDuration] = useState("47:23");
  const [showStreamingBlock, setShowStreamingBlock] = useState(true);
  const [showCompletedBlock, setShowCompletedBlock] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isDark, colors } = useTheme();
  const { addToast } = useToast();

  // Handler: New Session
  const handleNewSession = () => {
    setChatMessages([]);
    setInputValue("");
    setIsStreaming(false);
    setVisibleChars(0);
    setShowStreamingBlock(false);
    setShowCompletedBlock(false);
    setSessionName("New Session");
    setSessionDuration("00:00");
    addToast({ variant: "info", title: "New session started", message: "Previous conversation archived. Ready for a fresh start." });
  };

  // Handler: Clear chat
  const handleClear = () => {
    if (chatMessages.length === 0 && !showStreamingBlock && !showCompletedBlock) {
      addToast({ variant: "warning", title: "Nothing to clear", message: "The conversation is already empty." });
      return;
    }
    setChatMessages([]);
    setInputValue("");
    setIsStreaming(false);
    setVisibleChars(0);
    setShowStreamingBlock(false);
    setShowCompletedBlock(false);
    addToast({ variant: "success", title: "Chat cleared", message: "All messages have been removed from the current session." });
  };

  // Handler: Export chat
  const handleExportChat = () => {
    const allMessages = [...chatMessages];
    // Add the streaming/completed message if visible
    if (showCompletedBlock || (showStreamingBlock && !isStreaming)) {
      allMessages.push({ id: 999, role: "ai", text: streamingText });
    }
    if (allMessages.length === 0) {
      addToast({ variant: "warning", title: "Nothing to export", message: "Start a conversation first before exporting." });
      return;
    }

    let markdown = `# ${sessionName}\n`;
    markdown += `_Session duration: ${sessionDuration}_\n`;
    markdown += `_Exported: ${new Date().toLocaleString()}_\n\n---\n\n`;

    allMessages.forEach((msg) => {
      if (msg.role === "user") {
        markdown += `**You:**\n${msg.text}\n\n`;
      } else {
        markdown += `**ConvoCrystal AI:**\n${msg.text}\n`;
        if (msg.confidence) {
          markdown += `\n> Confidence: ${msg.confidence.overall}% (Faithfulness: ${msg.confidence.faithfulness}%, Relevance: ${msg.confidence.relevance}%, Precision: ${msg.confidence.precision}%)\n`;
        }
        if (msg.citations) {
          markdown += `\n> Citations: ${msg.citations.map((c) => `[${c.num}] ${c.speaker} @ ${c.time}`).join(", ")}\n`;
        }
        markdown += "\n";
      }
    });

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sessionName.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-").toLowerCase()}-chat.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast({ variant: "success", title: "Chat exported", message: `Saved as Markdown (${allMessages.length} messages).` });
  };

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
  const citationBg = isDark ? "rgba(92,108,245,0.1)" : "rgba(92,108,245,0.08)";
  const citationText = colors.crystalLight;
  const citationBorder = isDark ? "rgba(42,45,66,0.6)" : "rgba(217,214,208,0.6)";
  const scrollbarColor = isDark ? `${colors.border} transparent` : `${colors.border} transparent`;
  const dividerColor = colors.border;
  const streamBorderColor = isDark ? "rgba(92,108,245,0.3)" : "rgba(92,108,245,0.2)";
  const stageArrowColor = colors.border;
  const stageDotBorder = colors.border;
  const inputBg = isDark ? colors.bgPanel : "#FFFFFF";
  const inputBorder = colors.border;
  const promptBorder = colors.border;
  const promptText = colors.textSecondary;
  const promptHoverBorder = colors.crystal;
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
          <span className="text-[12px] truncate" style={{ color: colors.textSecondary }}>{sessionName}</span>
          <span className="text-[10px] font-mono shrink-0 hidden sm:inline" style={{ color: colors.textMuted }}>{sessionDuration}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded transition-colors" style={{ color: colors.textMuted }} title="New session" onClick={handleNewSession}>
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded transition-colors" style={{ color: colors.textMuted }} title="Clear" onClick={handleClear}>
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded transition-colors" style={{ color: colors.textMuted }} title="Export chat" onClick={handleExportChat}>
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-4" style={{ scrollbarWidth: "thin", scrollbarColor }}>
        {/* Empty state */}
        {chatMessages.length === 0 && !showStreamingBlock && !showCompletedBlock && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
            <MessageSquarePlus className="w-10 h-10" style={{ color: colors.crystal, opacity: 0.5 }} />
            <p className="text-[13px]" style={{ color: colors.textMuted }}>No messages yet</p>
            <p className="text-[11px] text-center max-w-[200px]" style={{ color: colors.textMuted, opacity: 0.7 }}>
              Type a question below or pick a suggested prompt to get started.
            </p>
          </div>
        )}

        {chatMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="relative group max-w-[88%] sm:max-w-[72%]"
              style={
                msg.role === "user"
                  ? {
                      backgroundColor: colors.crystalMuted,
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
                  <button className="p-1 rounded transition-colors" style={{ color: hoverActionsIcon }} title="Copy">
                    <Copy className="w-3 h-3" />
                  </button>
                  <button className="p-1 rounded transition-colors" style={{ color: hoverActionsIcon }} title="Push to editor">
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                  <button className="p-1 rounded transition-colors" style={{ color: hoverActionsIcon }} title="Cite">
                    <Quote className="w-3 h-3" />
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
        {showStreamingBlock && isStreaming && (
          <div className="flex justify-start">
            <div className="max-w-[92%] sm:max-w-[72%]">
              {/* Stage indicator */}
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 px-2 flex-wrap">
                {stageSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    {step.done ? (
                      <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                    ) : step.active ? (
                      <Loader2 className="w-3 h-3 animate-spin" style={{ color: colors.crystal }} />
                    ) : (
                      <div className="w-3 h-3 rounded-full" style={{ border: `1px solid ${stageDotBorder}` }} />
                    )}
                    <span
                      className={`text-[9px] font-mono ${
                        step.done ? "text-[#10B981]" : ""
                      }`}
                      style={step.active ? { color: colors.crystal } : !step.done ? { color: colors.textMuted } : undefined}
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
                  borderLeft: `2px solid ${colors.ice}`,
                }}
              >
                <div className="text-[13px] leading-relaxed whitespace-pre-wrap">
                  {renderText(displayedStreaming, aiBubbleText)}
                  {isStreaming && (
                    <span className="inline-block w-0.5 h-3.5 ml-0.5 animate-pulse" style={{ backgroundColor: colors.crystal }} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Completed streaming */}
        {showCompletedBlock && !isStreaming && (
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
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about this transcript..."
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
                className="p-1.5 rounded-md transition-colors"
                style={{ backgroundColor: colors.rose }}
              >
                <Square className="w-3 h-3 text-white" />
              </button>
            ) : (
              <button
                className="p-1.5 rounded-md transition-colors disabled:opacity-30"
                disabled={!inputValue.trim()}
                style={{
                  backgroundColor: colors.crystal,
                  boxShadow: inputValue.trim() ? "var(--shadow-crystal)" : "none",
                }}
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