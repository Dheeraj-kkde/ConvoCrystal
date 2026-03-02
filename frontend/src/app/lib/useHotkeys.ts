/**
 * Lightweight global keyboard shortcut hook.
 * Registers shortcuts on the document and cleans up on unmount.
 *
 * Supports modifier combos: "mod+s" (Ctrl on Win/Linux, Cmd on Mac),
 * "ctrl+shift+z", "alt+/", etc.
 */
import { useEffect, useRef } from "react";

type Handler = (e: KeyboardEvent) => void;

interface ShortcutDef {
  /** Key combo: "mod+s", "ctrl+shift+z", "alt+k", "escape" */
  key: string;
  /** Handler — receives the original KeyboardEvent */
  handler: Handler;
  /** Prevent default browser action? Default true */
  preventDefault?: boolean;
  /** Only fire when no input/textarea is focused? Default false */
  ignoreInputs?: boolean;
}

const isMac =
  typeof navigator !== "undefined" && /mac|iphone|ipad/i.test(navigator.userAgent);

function parseCombo(combo: string) {
  const parts = combo.toLowerCase().split("+").map((p) => p.trim());
  return {
    ctrl: parts.includes("ctrl") || parts.includes("control"),
    meta: parts.includes("meta") || parts.includes("cmd"),
    mod: parts.includes("mod"), // platform-aware: Cmd on Mac, Ctrl elsewhere
    shift: parts.includes("shift"),
    alt: parts.includes("alt") || parts.includes("option"),
    key: parts.filter(
      (p) =>
        !["ctrl", "control", "meta", "cmd", "mod", "shift", "alt", "option"].includes(p)
    )[0] || "",
  };
}

function matchesEvent(combo: ReturnType<typeof parseCombo>, e: KeyboardEvent): boolean {
  const wantCtrl = combo.ctrl || (combo.mod && !isMac);
  const wantMeta = combo.meta || (combo.mod && isMac);

  if (wantCtrl !== e.ctrlKey) return false;
  if (wantMeta !== e.metaKey) return false;
  if (combo.shift !== e.shiftKey) return false;
  if (combo.alt !== e.altKey) return false;

  // Normalize key
  const actual = e.key.toLowerCase();
  const expected = combo.key;

  // Handle special names
  if (expected === "escape" && actual === "escape") return true;
  if (expected === "enter" && actual === "enter") return true;
  if (expected === "/" && (actual === "/" || e.code === "Slash")) return true;
  if (expected === "\\" && (actual === "\\" || e.code === "Backslash")) return true;
  if (expected === "," && actual === ",") return true;
  if (expected === "." && actual === ".") return true;
  if (expected === "k" && actual === "k") return true;

  return actual === expected;
}

function isInputElement(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    el.isContentEditable
  );
}

/**
 * Register one or more keyboard shortcuts.
 * Shortcuts are stable if the deps array doesn't change.
 */
export function useHotkeys(shortcuts: ShortcutDef[], deps: unknown[] = []) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      for (const def of shortcutsRef.current) {
        const combo = parseCombo(def.key);
        if (!matchesEvent(combo, e)) continue;
        if (def.ignoreInputs && isInputElement(e.target)) continue;
        if (def.preventDefault !== false) e.preventDefault();
        def.handler(e);
        return; // First match wins
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}