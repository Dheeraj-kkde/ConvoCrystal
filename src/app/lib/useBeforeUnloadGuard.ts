/**
 * Attaches a beforeunload warning when a module has unsaved state.
 * Automatically cleaned up on unmount.
 */
import { useEffect } from "react";

export function useBeforeUnloadGuard(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore this string, but it's required for the spec
      e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [active]);
}
