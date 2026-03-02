/**
 * Chat stream adapter — dual-mode (WebSocket or client-side simulation).
 *
 * When VITE_WS_URL is set, connects via useWebSocket for real server-sent
 * token streaming. Otherwise, simulates orchestrator stages + token stream
 * client-side for demo/prototype use.
 *
 * Consumer interface is identical either way: call `send()` with a prompt,
 * receive callbacks for stage changes, tokens, and completion.
 */
import { useRef, useCallback, useState } from "react";
import { useWebSocket, type WSStatus } from "./useWebSocket";

// ─── Types ───────────────────────────────────────────────────────

export type OrchestratorStage = "extracting" | "analyzing" | "retrieving" | "generating";

interface StreamCallbacks {
  onStage: (stage: OrchestratorStage) => void;
  onToken: (token: string) => void;
  onDone: (meta: { confidence?: StreamConfidence; citations?: StreamCitation[] }) => void;
  onError: (error: string) => void;
}

export interface StreamConfidence {
  overall: number;
  faithfulness: number;
  relevance: number;
  precision: number;
}

export interface StreamCitation {
  num: number;
  speaker: string;
  time: string;
}

/** Wire protocol messages from WS server */
type WSInbound =
  | { type: "stage"; stage: OrchestratorStage }
  | { type: "token"; delta: string }
  | { type: "done"; confidence?: StreamConfidence; citations?: StreamCitation[] }
  | { type: "error"; message: string };

// ─── Mock responses for simulation mode ──────────────────────────

const MOCK_TEXTS = [
  "Based on the transcript analysis, here are the key findings:\n\n**1. Strategic Alignment** — The team showed strong consensus on the Q1 priorities, with market expansion receiving unanimous support.\n\n**2. Resource Allocation** — Engineering capacity was identified as the primary bottleneck, with a proposal to redistribute mobile team resources.\n\n**3. Risk Assessment** — Two medium-priority risks were flagged around timeline feasibility and revenue impact during the pricing transition.",
  "Here are the extracted action items from the Q4 Strategy Review, organized by owner:\n\n**Sarah Chen (VP Product)**\n• Complete APAC localization feasibility review — Due: Friday, Dec 6\n• Present go/no-go recommendation for accelerated launch\n\n**Marcus Webb (CFO)**\n• Model revenue impact of usage-based pricing transition — Due: End of week\n• Prepare grandfather clause terms for legal review",
  "The sentiment analysis reveals an overall positive tone (72%) with notable tension points:\n\n**Positive themes** — Strategic alignment, proactive planning, consensus on priorities\n\n**Tension points** — Mobile team resource reallocation (raised by Alex Rivera), timeline feasibility concerns (raised by David Park)\n\n**Resolution confidence** — 68% of flagged concerns had concrete follow-up actions assigned",
];

const MOCK_CONFIDENCE: StreamConfidence = { overall: 89, faithfulness: 92, relevance: 86, precision: 88 };
const MOCK_CITATIONS: StreamCitation[] = [
  { num: 1, speaker: "Sarah Chen", time: "14:32" },
  { num: 2, speaker: "Marcus Webb", time: "22:15" },
];

// ─── Hook ────────────────────────────────────────────────────────

const HAS_WS = !!import.meta.env.VITE_WS_URL;

export function useChatStream(sessionId: string) {
  const callbacksRef = useRef<StreamCallbacks | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mockIndexRef = useRef(0);
  const [wsStatus, setWsStatus] = useState<WSStatus>("connected");

  // ─── Real WS path ──────────────────────────────────────────────

  const handleWSMessage = useCallback((msg: WSInbound) => {
    const cb = callbacksRef.current;
    if (!cb) return;
    switch (msg.type) {
      case "stage":
        cb.onStage(msg.stage);
        break;
      case "token":
        cb.onToken(msg.delta);
        break;
      case "done":
        cb.onDone({ confidence: msg.confidence, citations: msg.citations });
        break;
      case "error":
        cb.onError(msg.message);
        break;
    }
  }, []);

  const ws = useWebSocket<WSInbound>({
    url: HAS_WS ? `/ws/chat/${sessionId}` : null,
    onMessage: handleWSMessage,
    onStatusChange: setWsStatus,
    autoConnect: HAS_WS,
  });

  // ─── Simulated path (used when no WS server) ──────────────────

  const simulateStream = useCallback((text: string, signal: AbortSignal) => {
    const cb = callbacksRef.current;
    if (!cb) return;

    const stages: OrchestratorStage[] = ["extracting", "analyzing", "retrieving", "generating"];
    let stageIdx = 0;
    let charIdx = 0;

    function nextStage() {
      if (signal.aborted) return;
      if (stageIdx < stages.length) {
        cb!.onStage(stages[stageIdx]);
        stageIdx++;
        setTimeout(nextStage, 500 + Math.random() * 400);
      } else {
        streamTokens();
      }
    }

    function streamTokens() {
      if (signal.aborted) return;
      if (charIdx < text.length) {
        const chunkSize = Math.floor(Math.random() * 3) + 1;
        cb!.onToken(text.slice(charIdx, charIdx + chunkSize));
        charIdx += chunkSize;
        setTimeout(streamTokens, 10 + Math.random() * 20);
      } else {
        cb!.onDone({ confidence: MOCK_CONFIDENCE, citations: MOCK_CITATIONS });
      }
    }

    nextStage();
  }, []);

  // ─── Public API ────────────────────────────────────────────────

  const send = useCallback(
    (prompt: string, callbacks: StreamCallbacks) => {
      callbacksRef.current = callbacks;

      if (HAS_WS) {
        // Real WS: send prompt, server streams back via onMessage
        ws.send({ type: "chat", prompt, sessionId });
      } else {
        // Simulation mode
        const controller = new AbortController();
        abortRef.current = controller;

        const text = MOCK_TEXTS[mockIndexRef.current % MOCK_TEXTS.length];
        mockIndexRef.current++;

        simulateStream(text, controller.signal);

        controller.signal.addEventListener("abort", () => {
          callbacksRef.current = null;
        });
      }
    },
    [ws, sessionId, simulateStream]
  );

  const interrupt = useCallback(() => {
    if (HAS_WS) {
      ws.send({ type: "interrupt" });
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    callbacksRef.current = null;
  }, [ws]);

  return {
    send,
    interrupt,
    /** "connected" in simulation mode, real WS status when connected */
    wsStatus: HAS_WS ? wsStatus : ("connected" as WSStatus),
    isSimulated: !HAS_WS,
  };
}
