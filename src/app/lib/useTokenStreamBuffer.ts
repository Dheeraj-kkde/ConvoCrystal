/**
 * rAF-batched token streaming buffer.
 * Prevents per-token React re-renders during fast WebSocket streaming.
 * Batches tokens every ~16ms (one animation frame) for smooth 60fps rendering.
 */
import { useRef, useCallback } from "react";

export function useTokenStreamBuffer(onFlush: (text: string) => void) {
  const bufferRef = useRef<string[]>([]);
  const rafRef = useRef<number>(0);

  const push = useCallback(
    (token: string) => {
      bufferRef.current.push(token);
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          onFlush(bufferRef.current.join(""));
          bufferRef.current = [];
          rafRef.current = 0;
        });
      }
    },
    [onFlush]
  );

  /** Flush any remaining tokens synchronously on stream end */
  const flush = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    if (bufferRef.current.length) {
      onFlush(bufferRef.current.join(""));
      bufferRef.current = [];
    }
    rafRef.current = 0;
  }, [onFlush]);

  const reset = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    bufferRef.current = [];
    rafRef.current = 0;
  }, []);

  return { push, flush, reset };
}
