import { useState, useEffect, useRef, useCallback } from "react";
import { ChatPanel } from "./ChatPanel";
import { EditorPanel } from "./EditorPanel";
import { useTheme } from "./ThemeContext";
import { PanelRight, X } from "lucide-react";

export function DashboardPage() {
  const { colors } = useTheme();

  const [resizing, setResizing] = useState(false);
  const [chatWidth, setChatWidth] = useState(50);
  const [showEditorDrawer, setShowEditorDrawer] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [drawerTranslateX, setDrawerTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(true);
    const startX = e.clientX;
    const startWidth = chatWidth;
    const container = e.currentTarget.parentElement;
    const containerWidth = container ? container.clientWidth : window.innerWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      const newPct = Math.min(75, Math.max(30, startWidth + (delta / containerWidth) * 100));
      setChatWidth(newPct);
    };

    const handleMouseUp = () => {
      setResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    setIsDragging(false);
    setDrawerTranslateX(0);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Only start dragging if horizontal movement exceeds vertical
    if (!isDragging && Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
      setIsDragging(true);
    }

    if (isDragging || (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY))) {
      // Only allow swiping to the right (closing direction)
      const clampedX = Math.max(0, deltaX);
      setDrawerTranslateX(clampedX);
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current) return;
    const elapsed = Date.now() - touchStartRef.current.time;
    const velocity = drawerTranslateX / Math.max(elapsed, 1);
    const drawerWidth = drawerRef.current?.offsetWidth || window.innerWidth;
    const threshold = drawerWidth * 0.3;

    // Close if swiped past threshold or fast enough flick
    if (drawerTranslateX > threshold || (velocity > 0.5 && drawerTranslateX > 50)) {
      setShowEditorDrawer(false);
    }
    setDrawerTranslateX(0);
    setIsDragging(false);
    touchStartRef.current = null;
  }, [drawerTranslateX]);

  // Edge swipe to open (from right edge)
  useEffect(() => {
    if (!isMobile && !isTablet) return;
    if (showEditorDrawer) return;

    let startX = 0;
    let startY = 0;
    const edgeThreshold = 30; // px from right edge

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch.clientX > window.innerWidth - edgeThreshold) {
        startX = touch.clientX;
        startY = touch.clientY;
      } else {
        startX = 0;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (startX === 0) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);
      if (deltaX < -60 && deltaY < 80) {
        setShowEditorDrawer(true);
      }
      startX = 0;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isMobile, isTablet, showEditorDrawer]);

  // Mobile: Full-width chat with floating editor button
  if (isMobile) {
    const drawerOpacity = isDragging
      ? Math.max(0, 0.5 * (1 - drawerTranslateX / (drawerRef.current?.offsetWidth || window.innerWidth)))
      : showEditorDrawer ? 0.5 : 0;

    return (
      <div className="flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 overflow-hidden">
          <ChatPanel />
        </div>
        {/* Floating editor toggle */}
        <button
          onClick={() => setShowEditorDrawer(true)}
          className="absolute bottom-4 right-4 w-11 h-11 rounded-full shadow-lg z-20 flex items-center justify-center transition-all active:scale-95"
          style={{
            backgroundColor: colors.indigo,
            boxShadow: `0 4px 16px rgba(99,102,241,0.35)`,
          }}
        >
          <PanelRight className="w-5 h-5 text-white" />
        </button>

        {/* Editor drawer overlay */}
        {showEditorDrawer && (
          <div
            className="absolute inset-0 z-30 transition-opacity duration-200"
            style={{ backgroundColor: `rgba(0,0,0,${drawerOpacity})` }}
            onClick={() => setShowEditorDrawer(false)}
          />
        )}
        <div
          ref={drawerRef}
          className="absolute inset-y-0 right-0 w-full z-40"
          style={{
            backgroundColor: colors.bgBase,
            borderLeft: `1px solid ${colors.border}`,
            transform: showEditorDrawer
              ? `translateX(${drawerTranslateX}px)`
              : "translateX(100%)",
            transition: isDragging ? "none" : "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Swipe handle indicator */}
          <div className="absolute top-1/2 -translate-y-1/2 left-1.5 w-1 h-8 rounded-full opacity-30"
            style={{ backgroundColor: colors.textMuted }}
          />
          <button
            onClick={() => setShowEditorDrawer(false)}
            className="absolute top-3 right-3 p-1.5 rounded-md z-50 transition-colors hover:bg-white/10"
            style={{ color: colors.textMuted }}
          >
            <X className="w-4 h-4" />
          </button>
          <EditorPanel />
        </div>
      </div>
    );
  }

  // Tablet: Full-width chat with slide-over editor
  if (isTablet) {
    const drawerOpacity = isDragging
      ? Math.max(0, 0.4 * (1 - drawerTranslateX / (drawerRef.current?.offsetWidth || 400)))
      : showEditorDrawer ? 0.4 : 0;

    return (
      <div className="flex h-full overflow-hidden relative">
        <div className="h-full overflow-hidden w-full" style={{ borderRight: `1px solid ${colors.border}` }}>
          <ChatPanel />
        </div>

        <button
          onClick={() => setShowEditorDrawer(true)}
          className="absolute top-2 right-2 p-2 rounded-md z-20 transition-all hover:scale-105"
          title="Open editor"
          style={{
            backgroundColor: colors.bgPanel,
            border: `1px solid ${colors.border}`,
            color: colors.textSecondary,
          }}
        >
          <PanelRight className="w-4 h-4" />
        </button>

        {showEditorDrawer && (
          <div
            className="absolute inset-0 z-30 transition-opacity duration-200"
            style={{ backgroundColor: `rgba(0,0,0,${drawerOpacity})` }}
            onClick={() => setShowEditorDrawer(false)}
          />
        )}

        <div
          ref={drawerRef}
          className="absolute top-0 right-0 bottom-0 w-[min(400px,85vw)] z-40"
          style={{
            backgroundColor: colors.bgBase,
            borderLeft: `1px solid ${colors.border}`,
            transform: showEditorDrawer
              ? `translateX(${drawerTranslateX}px)`
              : "translateX(100%)",
            transition: isDragging ? "none" : "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Swipe handle indicator */}
          <div className="absolute top-1/2 -translate-y-1/2 left-1.5 w-1 h-8 rounded-full opacity-30"
            style={{ backgroundColor: colors.textMuted }}
          />
          <button
            onClick={() => setShowEditorDrawer(false)}
            className="absolute top-3 right-3 p-1 rounded-md z-50 transition-colors hover:bg-white/10"
            style={{ color: colors.textMuted }}
          >
            <X className="w-4 h-4" />
          </button>
          <EditorPanel />
        </div>
      </div>
    );
  }

  // Desktop: Resizable split
  return (
    <div className="flex h-full overflow-hidden relative">
      <div
        className="h-full overflow-hidden"
        style={{
          width: `${chatWidth}%`,
          transition: resizing ? "none" : "width 0.2s ease",
          borderRight: `1px solid ${colors.border}`,
        }}
      >
        <ChatPanel />
      </div>

      {/* Resize handle */}
      <div
        className="w-1 h-full cursor-col-resize shrink-0 relative group z-10"
        style={{ transition: "background 0.15s" }}
        onMouseDown={handleMouseDown}
        onMouseEnter={(e) => (e.currentTarget.style.background = `${colors.indigo}30`)}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
        <div
          className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-1 h-8 rounded-full transition-colors"
          style={{ backgroundColor: colors.border }}
        />
      </div>

      <div
        className="h-full overflow-hidden"
        style={{
          width: `${100 - chatWidth}%`,
          transition: resizing ? "none" : "width 0.2s ease",
        }}
      >
        <EditorPanel />
      </div>
    </div>
  );
}