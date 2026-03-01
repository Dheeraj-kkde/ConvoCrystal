import { useState, useEffect, useCallback } from "react";
import { ArrowRight, X } from "lucide-react";
import { useTheme } from "./ThemeContext";

interface OnboardingStep {
  title: string;
  description: string;
  targetSelector: string; // data-onboarding attribute value
  popoverPosition: "bottom" | "right" | "left" | "top";
  padding?: number; // extra padding around the spotlight
}

const steps: OnboardingStep[] = [
  {
    title: "Upload your transcripts",
    description:
      "Drag & drop meeting recordings in VTT, SRT, TXT, DOCX, or JSON. ConvoCrystal will automatically parse speakers, timestamps, and content.",
    targetSelector: "upload",
    popoverPosition: "right",
    padding: 8,
  },
  {
    title: "Chat with your meetings",
    description:
      "Ask questions about any transcript. The AI analyzes context, extracts insights, and provides citation-backed answers with confidence scores.",
    targetSelector: "chat",
    popoverPosition: "bottom",
    padding: 6,
  },
  {
    title: "Confidence scoring",
    description:
      "Every AI response includes a confidence score with sub-metrics for Faithfulness, Relevance, and Precision — so you always know how reliable each answer is.",
    targetSelector: "scoring",
    popoverPosition: "left",
    padding: 8,
  },
  {
    title: "AI-powered refinement",
    description:
      "Select any text in the editor and use AI to refine, expand, shorten, or rephrase. Watch changes stream in real-time with accept/reject controls.",
    targetSelector: "refine",
    popoverPosition: "bottom",
    padding: 6,
  },
  {
    title: "Export anywhere",
    description:
      "Export your polished transcripts and analysis to PDF, DOCX, Notion, or Markdown with one click. Formatting and structure are preserved automatically.",
    targetSelector: "export",
    popoverPosition: "bottom",
    padding: 6,
  },
  {
    title: "Version history & control",
    description:
      "Every document edit is tracked. Browse your revision timeline, compare changes side-by-side, and restore any previous version of your document instantly.",
    targetSelector: "versions",
    popoverPosition: "bottom",
    padding: 6,
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface OnboardingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingOverlay({ isOpen, onClose }: OnboardingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const { isDark, colors } = useTheme();

  const measureTarget = useCallback((stepIndex: number) => {
    const step = steps[stepIndex];
    if (!step) return;
    const el = document.querySelector(`[data-onboarding="${step.targetSelector}"]`);
    if (el) {
      // Scroll element into view if it's inside a scrollable container
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      // Delay measurement slightly to allow scroll to settle
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          const pad = step.padding ?? 6;
          setTargetRect({
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
          });
        });
      });
    } else {
      // Fallback: center of screen
      setTargetRect({
        top: window.innerHeight / 2 - 30,
        left: window.innerWidth / 2 - 60,
        width: 120,
        height: 60,
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setTimeout(() => {
        setVisible(true);
        measureTarget(0);
      }, 80);
    } else {
      setVisible(false);
      setTargetRect(null);
    }
  }, [isOpen, measureTarget]);

  // Re-measure on step change or window resize
  useEffect(() => {
    if (!isOpen) return;
    measureTarget(currentStep);

    const handleResize = () => measureTarget(currentStep);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, currentStep, measureTarget]);

  if (!isOpen || !targetRect) return null;

  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      onClose();
    }
  };

  // Calculate popover position relative to the spotlight rect
  const popoverStyle: React.CSSProperties = { position: "fixed" };
  const GAP = 16;

  if (step.popoverPosition === "right") {
    popoverStyle.top = targetRect.top;
    popoverStyle.left = targetRect.left + targetRect.width + GAP;
    // Ensure it doesn't go off-screen
    if ((popoverStyle.left as number) + 288 > window.innerWidth) {
      // Flip to left
      popoverStyle.left = undefined;
      popoverStyle.right = window.innerWidth - targetRect.left + GAP;
    }
  } else if (step.popoverPosition === "bottom") {
    popoverStyle.top = targetRect.top + targetRect.height + GAP;
    popoverStyle.left = targetRect.left;
    // Clamp right edge
    if (targetRect.left + 288 > window.innerWidth) {
      popoverStyle.left = window.innerWidth - 288 - 16;
    }
  } else if (step.popoverPosition === "left") {
    popoverStyle.top = targetRect.top;
    popoverStyle.right = window.innerWidth - targetRect.left + GAP;
    // If popover goes off left edge, flip to bottom
    if ((window.innerWidth - targetRect.left + GAP + 288) > window.innerWidth) {
      popoverStyle.right = undefined;
      popoverStyle.top = targetRect.top + targetRect.height + GAP;
      popoverStyle.left = Math.max(16, targetRect.left - 144);
    }
  } else if (step.popoverPosition === "top") {
    popoverStyle.top = targetRect.top - GAP;
    popoverStyle.left = targetRect.left;
    popoverStyle.transform = "translateY(-100%)";
  }

  const panelBg = isDark ? "#1A1D2E" : "#FFFFFF";
  const panelBorder = isDark ? "#2A2D42" : "#E2E0DB";
  const titleColor = isDark ? "#E8EAF6" : "#1A1916";
  const descColor = isDark ? "#9BA3C8" : "#57554F";
  const mutedColor = isDark ? "#5C6490" : "#928F87";
  const dotInactive = isDark ? "#2A2D42" : "#E2E0DB";

  return (
    <div
      className={`fixed inset-0 z-[200] transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* SVG overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.left}
              y={targetRect.top}
              width={targetRect.width}
              height={targetRect.height}
              rx="10"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Spotlight border ring */}
      <div
        className="fixed rounded-xl transition-all duration-500 ease-out"
        style={{
          top: targetRect.top,
          left: targetRect.left,
          width: targetRect.width,
          height: targetRect.height,
          border: "2px solid rgba(99,102,241,0.5)",
          boxShadow: "0 0 30px rgba(99,102,241,0.25), inset 0 0 20px rgba(99,102,241,0.08)",
          pointerEvents: "none",
        }}
      />

      {/* Click-through overlay to dismiss */}
      <div className="absolute inset-0" onClick={onClose} style={{ pointerEvents: "auto" }} />

      {/* Popover card */}
      <div
        className="w-72 z-[201]"
        style={{ ...popoverStyle, pointerEvents: "auto" }}
      >
        <div
          className="rounded-xl p-4 shadow-2xl"
          style={{
            backgroundColor: panelBg,
            border: `1px solid ${panelBorder}`,
            animation: "fadeSlideIn 0.3s ease-out",
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <h3
              className="text-[13px]"
              style={{ fontWeight: 600, color: titleColor }}
            >
              {step.title}
            </h3>
            <button
              onClick={onClose}
              className="p-0.5 rounded hover:bg-white/10 transition-colors"
              style={{ color: mutedColor }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p
            className="text-[11px] leading-relaxed mb-4"
            style={{ color: descColor }}
          >
            {step.description}
          </p>

          <div className="flex items-center justify-between">
            {/* Step counter */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: i === currentStep ? 16 : 6,
                    backgroundColor:
                      i === currentStep
                        ? "#6366F1"
                        : i < currentStep
                        ? "rgba(99,102,241,0.4)"
                        : dotInactive,
                  }}
                />
              ))}
              <span
                className="text-[9px] font-mono ml-1"
                style={{ color: mutedColor }}
              >
                {currentStep + 1}/{steps.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="text-[10px] hover:opacity-80 transition-opacity"
                style={{ color: mutedColor }}
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-3 py-1 rounded-md bg-[#6366F1] text-white text-[10px] hover:bg-[#818CF8] transition-colors"
                style={{ fontWeight: 500 }}
              >
                {currentStep < steps.length - 1 ? "Next" : "Get Started"}
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}