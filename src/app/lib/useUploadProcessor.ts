/**
 * Upload processing stage adapter — dual-mode (WebSocket or simulation).
 *
 * When VITE_WS_URL is set, listens to WS for server-sent processing stage
 * updates (queued → parsing → extracting → analyzing → scoring → indexing → complete).
 * Otherwise simulates stages client-side with realistic timing.
 */
import { useRef, useCallback, useState } from "react";
import { useWebSocket, type WSStatus } from "./useWebSocket";

// ─── Types ───────────────────────────────────────────────────────

export type ProcessingStage = "queued" | "parsing" | "extracting" | "analyzing" | "scoring" | "indexing";

interface ProcessorCallbacks {
  onStageAdvance: (stageIndex: number) => void;
  onComplete: () => void;
  onError: (message: string) => void;
}

type WSInbound =
  | { type: "stage"; index: number; name: ProcessingStage }
  | { type: "complete" }
  | { type: "error"; message: string };

// ─── Hook ────────────────────────────────────────────────────────

const HAS_WS = !!import.meta.env.VITE_WS_URL;
const STAGE_COUNT = 6;

export function useUploadProcessor(uploadId: string | null) {
  const callbacksRef = useRef<ProcessorCallbacks | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [wsStatus, setWsStatus] = useState<WSStatus>("connected");

  // ─── Real WS path ──────────────────────────────────────────────

  const handleWSMessage = useCallback((msg: WSInbound) => {
    const cb = callbacksRef.current;
    if (!cb) return;
    switch (msg.type) {
      case "stage":
        cb.onStageAdvance(msg.index);
        break;
      case "complete":
        cb.onComplete();
        break;
      case "error":
        cb.onError(msg.message);
        break;
    }
  }, []);

  useWebSocket<WSInbound>({
    url: HAS_WS && uploadId ? `/ws/upload/${uploadId}` : null,
    onMessage: handleWSMessage,
    onStatusChange: setWsStatus,
    autoConnect: HAS_WS && !!uploadId,
  });

  // ─── Simulated path ───────────────────────────────────────────

  const startSimulation = useCallback((callbacks: ProcessorCallbacks) => {
    // Clear any existing timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    let currentStage = 0;

    function advanceStage() {
      if (currentStage < STAGE_COUNT) {
        callbacks.onStageAdvance(currentStage + 1);
        currentStage++;
        const delay = 800 + Math.random() * 800;
        timersRef.current.push(setTimeout(advanceStage, delay));
      } else {
        const completeDelay = 400 + Math.random() * 200;
        timersRef.current.push(setTimeout(() => callbacks.onComplete(), completeDelay));
      }
    }

    // Start after a brief queue delay
    timersRef.current.push(setTimeout(advanceStage, 600));
  }, []);

  // ─── Public API ────────────────────────────────────────────────

  const start = useCallback(
    (callbacks: ProcessorCallbacks) => {
      callbacksRef.current = callbacks;

      if (!HAS_WS) {
        startSimulation(callbacks);
      }
      // If HAS_WS, server drives stages via onMessage
    },
    [startSimulation]
  );

  const cancel = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    callbacksRef.current = null;
  }, []);

  return {
    start,
    cancel,
    wsStatus: HAS_WS ? wsStatus : ("connected" as WSStatus),
    isSimulated: !HAS_WS,
  };
}