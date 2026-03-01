import { useState, useEffect, useRef, useCallback, useReducer } from "react";
import {
  Send, Square, RotateCcw, Download, Plus, Copy, ArrowUpRight,
  Quote, CheckCircle2, Loader2, ArrowRight, MessageSquarePlus, Wifi, WifiOff,
} from "lucide-react";
import { useTheme } from "./ThemeContext";
import { ConfidencePanel } from "./ConfidenceBadge";
import { useToast } from "./ToastSystem";
import { useTokenStreamBuffer } from "../lib/useTokenStreamBuffer";
import { useChatStream, type OrchestratorStage } from "../lib/useChatStream";
import { useHotkeys } from "../lib/useHotkeys";

// ─── Types ───────────────────────────────────────────────────────

type MessageStatus = "pending" | "orchestrating" | "streaming" | "done" | "error" | "interrupted";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streamingContent?: string;
  status: MessageStatus;
  stage?: OrchestratorStage;
  confidence?: { overall: number; faithfulness: number; relevance: number; precision: number };
  citations?: Array<{ num: number; speaker: string; time: string }>;
  timestamp: number;
}

// ─── Message Store Reducer ───────────────────────────────────────

type MsgAction =
  | { type: "ADD_USER"; content: string }
  | { type: "ADD_ASSISTANT_PENDING"; id: string }
  | { type: "SET_STAGE"; id: string; stage: OrchestratorStage }
  | { type: "STREAM_TOKEN"; id: string; delta: string }
  | { type: "COMPLETE"; id: string; confidence: ChatMessage["confidence"]; citations: ChatMessage["citations"] }
  | { type: "ERROR"; id: string }
  | { type: "INTERRUPT"; id: string }
  | { type: "CLEAR" };

function messageReducer(state: ChatMessage[], action: MsgAction): ChatMessage[] {
  switch (action.type) {
    case "ADD_USER":
      return [...state, { id: `usr_${Date.now()}`, role: "user", content: action.content, status: "done", timestamp: Date.now() }];
    case "ADD_ASSISTANT_PENDING":
      return [...state, { id: action.id, role: "assistant", content: "", streamingContent: "", status: "pending", timestamp: Date.now() }];
    case "SET_STAGE":
      return state.map((m) => m.id === action.id ? { ...m, stage: action.stage, status: "orchestrating" } : m);
    case "STREAM_TOKEN":
      return state.map((m) => m.id === action.id ? { ...m, streamingContent: (m.streamingContent || "") + action.delta, status: "streaming" } : m);
    case "COMPLETE":
      return state.map((m) => m.id === action.id ? { ...m, content: m.streamingContent || m.content, streamingContent: undefined, status: "done", stage: undefined, confidence: action.confidence, citations: action.citations } : m);
    case "ERROR":
      return state.map((m) => m.id === action.id ? { ...m, status: "error" } : m);
    case "INTERRUPT":
      return state.map((m) => m.id === action.id ? { ...m, content: m.streamingContent || m.content, streamingContent: undefined, status: "interrupted", stage: undefined } : m);
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

// ─── Seed messages ───────────────────────────────────────────────

const seedMessages: ChatMessage[] = [
  { id: "seed_1", role: "user", content: "What were the key decisions made in the Q4 strategy meeting?", status: "done", timestamp: Date.now() - 60000 },
  {
    id: "seed_2", role: "assistant", status: "done", timestamp: Date.now() - 55000,
    content: "Based on the transcript analysis, three key decisions were reached during the Q4 Strategy Review:\n\n**1. Market Expansion Timeline** — The team agreed to accelerate the APAC launch from Q2 to late Q1, contingent on completing the localization sprint by January 15th. Sarah Chen (VP Product) will own the go/no-go checkpoint.\n\n**2. Pricing Model Revision** — The consensus was to move from per-seat to usage-based pricing for enterprise tier, with a 90-day grandfather clause for existing customers. Finance will model the revenue impact by end of week.\n\n**3. Engineering Headcount** — Approved hiring 4 additional backend engineers focused on the real-time pipeline, with a budget reallocation from the deferred mobile initiative.",
    confidence: { overall: 91, faithfulness: 94, relevance: 88, precision: 92 },
    citations: [{ num: 1, speaker: "Sarah Chen", time: "14:32" }, { num: 2, speaker: "Marcus Webb", time: "22:15" }, { num: 3, speaker: "David Park", time: "31:47" }],
  },
];

const suggestedPrompts = [
  "What risks were identified?",
  "Generate a follow-up email draft",
  "Compare with last quarter's decisions",
  "Who spoke the most?",
  "Extract sentiment analysis",
];

// ─── Component ───────────────────────────────────────────────────

export function ChatPanel() {
  const [messages, dispatch] = useReducer(messageReducer, seedMessages);
  const [inputValue, setInputValue] = useState("");
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const activeIdRef = useRef<string | null>(null);
  const { isDark, colors } = useTheme();
  const { addToast } = useToast();

  // ─── Chat stream (WS when available, simulation otherwise) ─────
  const chatStream = useChatStream("session_q4_strategy");
  const wsStatus = chatStream.wsStatus;

  const activeStreamId = messages.find((m) => m.status === "pending" || m.status === "orchestrating" || m.status === "streaming")?.id;
  const isStreaming = !!activeStreamId;

  // Keep a stable ref for the active stream id
  useEffect(() => { activeIdRef.current = activeStreamId || null; }, [activeStreamId]);

  // ─── Token stream buffer (rAF batched) ─────────────────────────

  const flushCallback = useCallback((delta: string) => {
    const id = activeIdRef.current;
    if (id) dispatch({ type: "STREAM_TOKEN", id, delta });
  }, []);

  const { push: pushToken, flush: flushTokens, reset: resetBuffer } = useTokenStreamBuffer(flushCallback);

  // ─── Auto-scroll ───────────────────────────────────────────────

  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  }, []);

  // ─── Send message via useChatStream ────────────────────────────

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || isStreaming) return;
    setInputValue("");

    dispatch({ type: "ADD_USER", content: text });

    const assistantId = `ast_${Date.now()}`;
    dispatch({ type: "ADD_ASSISTANT_PENDING", id: assistantId });

    chatStream.send(text, {
      onStage: (stage) => dispatch({ type: "SET_STAGE", id: assistantId, stage }),
      onToken: (token) => pushToken(token),
      onDone: (meta) => {
        flushTokens();
        dispatch({ type: "COMPLETE", id: assistantId, confidence: meta.confidence, citations: meta.citations });
      },
      onError: (errorMsg) => {
        flushTokens();
        dispatch({ type: "ERROR", id: assistantId });
        addToast({ variant: "error", title: "Stream error", message: errorMsg });
      },
    });
  }, [inputValue, isStreaming, chatStream, pushToken, flushTokens, addToast]);

  // ─── Interrupt ─────────────────────────────────────────────────

  const handleInterrupt = useCallback(() => {
    chatStream.interrupt();
    flushTokens();
    const id = activeIdRef.current;
    if (id) dispatch({ type: "INTERRUPT", id });
    resetBuffer();
    addToast({ variant: "info", title: "Response interrupted", message: "Partial response kept." });
  }, [chatStream, flushTokens, resetBuffer, addToast]);

  // ─── Session / Clear / Export ──────────────────────────────────

  const handleNewSession = useCallback(() => {
    chatStream.interrupt();
    resetBuffer();
    dispatch({ type: "CLEAR" });
    setInputValue("");
    addToast({ variant: "info", title: "New session started" });
  }, [chatStream, resetBuffer, addToast]);

  const handleClear = useCallback(() => {
    if (messages.length === 0) { addToast({ variant: "warning", title: "Nothing to clear" }); return; }
    chatStream.interrupt();
    resetBuffer();
    dispatch({ type: "CLEAR" });
    addToast({ variant: "success", title: "Chat cleared" });
  }, [messages.length, chatStream, resetBuffer, addToast]);

  const handleExportChat = useCallback(() => {
    if (messages.length === 0) { addToast({ variant: "warning", title: "Nothing to export" }); return; }
    let md = "# Q4 Strategy Review — Chat\n\n";
    messages.forEach((msg) => {
      if (msg.role === "user") md += `**You:**\n${msg.content}\n\n`;
      else { md += `**ConvoCrystal AI:**\n${msg.content}\n`; if (msg.confidence) md += `\n> Confidence: ${msg.confidence.overall}%\n`; md += "\n"; }
    });
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "convocrystal-chat.md";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    addToast({ variant: "success", title: "Chat exported", message: `${messages.length} messages.` });
  }, [messages, addToast]);

  // ─── Keyboard shortcuts ────────────────────────────────────────

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  // Ctrl+/ focuses the chat input (global AI suggest)
  useHotkeys([
    { key: "mod+/", handler: () => { if (inputRef.current) inputRef.current.focus(); } },
    { key: "mod+shift+e", handler: () => handleExportChat(), ignoreInputs: true },
  ], [handleExportChat]);

  // ─── Theme vars ────────────────────────────────────────────────

  const aiBubbleBg = isDark ? colors.bgPanel : "#FFFFFF";
  const aiBubbleBorder = colors.border;
  const aiBubbleText = colors.textPrimary;
  const citationBg = isDark ? "rgba(92,108,245,0.1)" : "rgba(92,108,245,0.08)";
  const citationText = colors.crystalLight;
  const citationBorder = isDark ? "rgba(42,45,66,0.6)" : "rgba(217,214,208,0.6)";
  const scrollbarColor = `${colors.border} transparent`;
  const inputBg = isDark ? colors.bgPanel : "#FFFFFF";
  const inputBorder = colors.border;
  const promptBorder = colors.border;
  const promptText = colors.textSecondary;
  const promptHoverBorder = colors.crystal;
  const promptHoverText = colors.textPrimary;

  const renderText = (text: string, textColor: string) =>
    text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i} style={{ fontWeight: 600, color: textColor }}>{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>
    );

  const stageLabels: Record<OrchestratorStage, string> = { extracting: "Extracting context", analyzing: "Analyzing semantics", retrieving: "Retrieving embeddings", generating: "Generating response" };
  const stageOrder: OrchestratorStage[] = ["extracting", "analyzing", "retrieving", "generating"];

  return (
    <div className="flex flex-col h-full transition-colors duration-300" style={{ backgroundColor: colors.bgBase }}>
      {/* Header */}
      <div className="h-12 px-3 sm:px-4 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${colors.border}` }} data-onboarding="chat">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            {wsStatus === "connected" ? (
              <><div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" /><span className="text-[11px] font-mono hidden sm:inline" style={{ color: colors.textMuted }}>Connected</span></>
            ) : wsStatus === "reconnecting" ? (
              <><Wifi className="w-3 h-3 animate-pulse" style={{ color: colors.amber }} /><span className="text-[11px] font-mono hidden sm:inline" style={{ color: colors.amber }}>Reconnecting</span></>
            ) : (
              <><WifiOff className="w-3 h-3" style={{ color: colors.rose }} /><span className="text-[11px] font-mono hidden sm:inline" style={{ color: colors.rose }}>Offline</span></>
            )}
          </div>
          <div className="w-px h-3 hidden sm:block" style={{ backgroundColor: colors.border }} />
          <span className="text-[12px] truncate" style={{ color: colors.textSecondary }}>Q4 Strategy Review</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded transition-colors" style={{ color: colors.textMuted }} title="New session" onClick={handleNewSession}><Plus className="w-3.5 h-3.5" /></button>
          <button className="p-1.5 rounded transition-colors" style={{ color: colors.textMuted }} title="Clear" onClick={handleClear}><RotateCcw className="w-3.5 h-3.5" /></button>
          <button className="p-1.5 rounded transition-colors" style={{ color: colors.textMuted }} title="Export chat" onClick={handleExportChat}><Download className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-4" style={{ scrollbarWidth: "thin", scrollbarColor }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
            <MessageSquarePlus className="w-10 h-10" style={{ color: colors.crystal, opacity: 0.5 }} />
            <p className="text-[13px]" style={{ color: colors.textMuted }}>No messages yet</p>
            <p className="text-[11px] text-center max-w-[200px]" style={{ color: colors.textMuted, opacity: 0.7 }}>Type a question below or pick a suggested prompt.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="relative group max-w-[88%] sm:max-w-[72%]"
              style={msg.role === "user"
                ? { backgroundColor: colors.crystalMuted, color: "#FFFFFF", borderRadius: "12px 12px 4px 12px", padding: "10px 14px" }
                : { backgroundColor: aiBubbleBg, color: aiBubbleText, borderRadius: "12px 12px 12px 4px", padding: "10px 14px", border: `1px solid ${aiBubbleBorder}`, borderLeft: msg.status === "streaming" ? `2px solid ${colors.ice}` : undefined }
              }
              onMouseEnter={() => setHoveredMessage(msg.id)} onMouseLeave={() => setHoveredMessage(null)}>

              {/* Hover actions */}
              {msg.role === "assistant" && msg.status === "done" && hoveredMessage === msg.id && (
                <div className="absolute -top-2 right-2 flex items-center gap-1 rounded-md p-0.5 shadow-lg z-10" style={{ backgroundColor: aiBubbleBg, border: `1px solid ${colors.border}` }}>
                  <button className="p-1 rounded transition-colors" style={{ color: colors.textSecondary }} title="Copy" onClick={() => { navigator.clipboard.writeText(msg.content); addToast({ variant: "success", title: "Copied" }); }}><Copy className="w-3 h-3" /></button>
                  <button className="p-1 rounded transition-colors" style={{ color: colors.textSecondary }} title="Push to editor"><ArrowUpRight className="w-3 h-3" /></button>
                  <button className="p-1 rounded transition-colors" style={{ color: colors.textSecondary }} title="Cite"><Quote className="w-3 h-3" /></button>
                </div>
              )}

              {/* Orchestrator stages */}
              {msg.role === "assistant" && (msg.status === "orchestrating" || msg.status === "pending") && (
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  {stageOrder.map((s, i) => {
                    const curIdx = msg.stage ? stageOrder.indexOf(msg.stage) : -1;
                    const done = i < curIdx; const active = i === curIdx;
                    return (
                      <div key={s} className="flex items-center gap-1.5">
                        {done ? <CheckCircle2 className="w-3 h-3 text-[#10B981]" /> : active ? <Loader2 className="w-3 h-3 animate-spin" style={{ color: colors.crystal }} /> : <div className="w-3 h-3 rounded-full" style={{ border: `1px solid ${colors.border}` }} />}
                        <span className="text-[9px] font-mono" style={{ color: done ? "#10B981" : active ? colors.crystal : colors.textMuted }}>{stageLabels[s]}</span>
                        {i < stageOrder.length - 1 && <ArrowRight className="w-2.5 h-2.5" style={{ color: colors.border }} />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Content */}
              <div className="text-[13px] leading-relaxed whitespace-pre-wrap">
                {msg.status === "streaming" || msg.status === "orchestrating" || msg.status === "pending"
                  ? <>{renderText(msg.streamingContent || "", aiBubbleText)}{msg.status === "streaming" && <span className="inline-block w-0.5 h-3.5 ml-0.5 animate-pulse" style={{ backgroundColor: colors.crystal }} />}{msg.status === "pending" && <span className="inline-flex gap-1 ml-1"><span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: colors.crystal, animationDelay: "0ms" }} /><span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: colors.crystal, animationDelay: "150ms" }} /><span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: colors.crystal, animationDelay: "300ms" }} /></span>}</>
                  : renderText(msg.content, msg.role === "user" ? "#FFFFFF" : aiBubbleText)}
              </div>

              {msg.status === "interrupted" && <div className="mt-2 flex items-center gap-1.5 text-[10px]" style={{ color: colors.amber }}><span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: `${colors.amber}10` }}>Interrupted — partial response</span></div>}
              {msg.citations && msg.status === "done" && <div className="flex flex-wrap gap-1.5 mt-2 pt-2" style={{ borderTop: `1px solid ${citationBorder}` }}>{msg.citations.map((c) => <span key={c.num} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono cursor-pointer hover:opacity-80" style={{ backgroundColor: citationBg, color: citationText }}>[{c.num}] {c.speaker} · {c.time}</span>)}</div>}
              {msg.confidence && msg.status === "done" && <ConfidencePanel confidence={msg.confidence} />}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      <div className="px-3 sm:px-4 pb-2 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {suggestedPrompts.map((prompt) => (
            <button key={prompt} className="shrink-0 px-3 py-1 rounded-full text-[11px] transition-all duration-160 whitespace-nowrap"
              style={{ color: promptText, border: `1px solid ${promptBorder}` }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = promptHoverBorder; e.currentTarget.style.color = promptHoverText; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = promptBorder; e.currentTarget.style.color = promptText; }}
              onClick={() => setInputValue(prompt)}>{prompt}</button>
          ))}
        </div>
      </div>

      {/* Input Composer */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 shrink-0">
        <div className="relative flex items-end gap-2 rounded-xl px-3 py-2 transition-colors" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}` }}>
          <textarea ref={inputRef} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Ask about this transcript..."
            className="flex-1 bg-transparent text-[13px] outline-none resize-none min-h-[20px] max-h-[80px]"
            style={{ color: colors.textPrimary }} rows={1}
            onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 80) + "px"; }} />
          <div className="flex items-center gap-1.5 shrink-0 mb-0.5">
            <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>{inputValue.length > 0 ? `${inputValue.length}` : ""}</span>
            {isStreaming ? (
              <button onClick={handleInterrupt} className="p-1.5 rounded-md transition-colors" style={{ backgroundColor: colors.rose }} title="Stop generating (Esc)"><Square className="w-3 h-3 text-white" /></button>
            ) : (
              <button onClick={handleSend} className="p-1.5 rounded-md transition-colors disabled:opacity-30" disabled={!inputValue.trim()} style={{ backgroundColor: colors.crystal, boxShadow: inputValue.trim() ? "var(--shadow-crystal)" : "none" }}><Send className="w-3 h-3 text-white" /></button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
