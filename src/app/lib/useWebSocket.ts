/**
 * Shared WebSocket manager with exponential backoff reconnect.
 *
 * Used by Chat (token streaming) and Upload (processing stages).
 * In this prototype, provides a mock interface that can be swapped
 * for real WS connections by setting VITE_WS_URL.
 */
import { useRef, useEffect, useCallback, useState } from "react";

export type WSStatus = "connecting" | "connected" | "reconnecting" | "offline";

interface UseWebSocketOptions<T> {
  /** WebSocket URL path, e.g. "/ws/chat/session123" */
  url: string | null;
  /** Called on every parsed message */
  onMessage: (msg: T) => void;
  /** Called when status changes */
  onStatusChange?: (status: WSStatus) => void;
  /** Max reconnection attempts before giving up */
  maxAttempts?: number;
  /** Whether to auto-connect on mount */
  autoConnect?: boolean;
}

export function useWebSocket<T = unknown>({
  url,
  onMessage,
  onStatusChange,
  maxAttempts = 5,
  autoConnect = true,
}: UseWebSocketOptions<T>) {
  const wsRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const [status, setStatus] = useState<WSStatus>("offline");

  const updateStatus = useCallback(
    (s: WSStatus) => {
      setStatus(s);
      if (onStatusChange) onStatusChange(s);
    },
    [onStatusChange]
  );

  const connect = useCallback(() => {
    if (!url) return;
    const wsBase = import.meta.env.VITE_WS_URL || `ws://${window.location.host}`;
    updateStatus("connecting");

    try {
      const ws = new WebSocket(`${wsBase}${url}`);

      ws.onopen = () => {
        attemptRef.current = 0;
        updateStatus("connected");
      };

      ws.onmessage = (e) => {
        try {
          onMessage(JSON.parse(e.data));
        } catch {
          // Non-JSON message — ignore
        }
      };

      ws.onclose = (e) => {
        if (e.code === 1000) {
          updateStatus("offline");
          return;
        }
        if (attemptRef.current < maxAttempts) {
          updateStatus("reconnecting");
          const delay = Math.min(1000 * 2 ** attemptRef.current, 30000);
          setTimeout(connect, delay);
          attemptRef.current++;
        } else {
          updateStatus("offline");
        }
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch {
      updateStatus("offline");
    }
  }, [url, onMessage, updateStatus, maxAttempts]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, "client disconnect");
      wsRef.current = null;
    }
    attemptRef.current = 0;
    updateStatus("offline");
  }, [updateStatus]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    if (autoConnect && url) connect();
    return () => disconnect();
  }, [url, autoConnect, connect, disconnect]);

  return { status, connect, disconnect, send, wsRef };
}
