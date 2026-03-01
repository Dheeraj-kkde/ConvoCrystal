import { useState, useEffect, useCallback } from "react";
import {
  CloudUpload,
  X,
  FileText,
  Check,
  Loader2,
  Pause,
  Play,
  AlertCircle,
  ArrowRight,
  Upload,
} from "lucide-react";
import { useToast } from "./ToastSystem";
import { useTheme } from "./ThemeContext";

type UploadState = "idle" | "validation" | "uploading" | "processing" | "complete" | "error";

const formatChips = ["VTT", "SRT", "TXT", "DOCX", "JSON"];

const validationSteps = [
  { label: "Format Check", key: "format" },
  { label: "Size Check", key: "size" },
  { label: "Content Scan", key: "content" },
];

const processingSteps = [
  { label: "Queued", key: "queued" },
  { label: "Parsing", key: "parsing" },
  { label: "Extracting", key: "extracting" },
  { label: "Analyzing", key: "analyzing" },
  { label: "Scoring", key: "scoring" },
];

interface UploadFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadFlow({ isOpen, onClose }: UploadFlowProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [dashOffset, setDashOffset] = useState(0);
  const { addToast } = useToast();
  const { isDark, colors } = useTheme();

  const selectedFile = {
    name: "Q4-strategy-review-recording.vtt",
    size: "4.2 MB",
    format: "VTT",
    sha: "a3f8c1d",
  };

  // Theme-derived colors
  const modalBg = colors.bgBase;
  const panelBg = colors.bgPanel;
  const borderColor = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const textMuted = colors.textMuted;

  // Dash animation for idle state
  useEffect(() => {
    if (state === "idle") {
      const interval = setInterval(() => {
        setDashOffset((prev) => (prev + 0.5) % 100);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [state]);

  // Validation auto-progress
  useEffect(() => {
    if (state === "validation" && validationProgress < 3) {
      const timer = setTimeout(() => {
        setValidationProgress((p) => p + 1);
      }, 800);
      return () => clearTimeout(timer);
    }
    if (state === "validation" && validationProgress >= 3) {
      const timer = setTimeout(() => setState("uploading"), 500);
      return () => clearTimeout(timer);
    }
  }, [state, validationProgress]);

  // Upload progress
  useEffect(() => {
    if (state === "uploading" && !paused && uploadProgress < 100) {
      const timer = setInterval(() => {
        setUploadProgress((p) => Math.min(100, p + Math.random() * 3 + 1));
      }, 100);
      return () => clearInterval(timer);
    }
    if (state === "uploading" && uploadProgress >= 100) {
      const timer = setTimeout(() => setState("processing"), 300);
      return () => clearTimeout(timer);
    }
  }, [state, paused, uploadProgress]);

  // Processing stages
  useEffect(() => {
    if (state === "processing" && processingStep < 5) {
      const timer = setTimeout(() => {
        setProcessingStep((s) => s + 1);
      }, 1200);
      return () => clearTimeout(timer);
    }
    if (state === "processing" && processingStep >= 5) {
      const timer = setTimeout(() => {
        setState("complete");
        addToast({ variant: "success", title: "Upload complete", message: "Q4 Strategy Review is ready for analysis." });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state, processingStep, addToast]);

  // Elapsed time counter
  useEffect(() => {
    if (state === "processing" || state === "uploading") {
      const timer = setInterval(() => setElapsedTime((t) => t + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [state]);

  const handleFileSelect = useCallback(() => {
    setState("validation");
    setValidationProgress(0);
    setUploadProgress(0);
    setProcessingStep(0);
    setElapsedTime(0);
  }, []);

  const handleReset = useCallback(() => {
    setState("idle");
    setValidationProgress(0);
    setUploadProgress(0);
    setProcessingStep(0);
    setElapsedTime(0);
    setPaused(false);
  }, []);

  if (!isOpen) return null;

  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference - (uploadProgress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-[640px] max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl mx-3 sm:mx-4"
        style={{ backgroundColor: modalBg, border: `1px solid ${borderColor}`, animation: "modalSlideUp 0.28s ease-out" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4" style={{ color: colors.crystal }} />
            <span className="text-[13px]" style={{ fontWeight: 600, color: textPrimary }}>Upload Transcript</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{ color: textMuted, backgroundColor: panelBg, border: `1px solid ${borderColor}` }}>
              {state === "idle" ? "Ready" : state === "validation" ? "Validating" : state === "uploading" ? "Uploading" : state === "processing" ? "Processing" : state === "complete" ? "Done" : "Error"}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#F43F5E]/15 transition-colors" style={{ color: textMuted }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 min-h-[360px] flex flex-col items-center justify-center">
          {/* State 1: Idle Drop Zone */}
          {state === "idle" && (
            <div
              className={`w-full rounded-xl p-10 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer`}
              style={{
                border: dragOver ? `1.5px solid ${colors.crystal}` : `1.5px dashed ${borderColor}`,
                backgroundColor: dragOver ? `${colors.crystal}04` : "transparent",
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(); }}
              onClick={handleFileSelect}
            >
              <div className={`mb-4 transition-transform duration-200 ${dragOver ? "scale-110" : ""}`}>
                <CloudUpload className="w-12 h-12" style={{ color: textMuted }} />
              </div>
              <h3 className="text-[16px] mb-2" style={{ fontWeight: 600, color: textPrimary }}>Drop your transcript here</h3>
              <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4">
                {formatChips.map((f) => (
                  <span key={f} className="px-2 py-0.5 rounded-full text-[9px] font-mono transition-colors cursor-default"
                    style={{ color: colors.ice, backgroundColor: `${colors.ice}10`, border: `1px solid ${colors.ice}20` }}>
                    {f}
                  </span>
                ))}
              </div>
              <button className="text-[12px] transition-colors mb-2" style={{ color: colors.crystal }}>
                or browse files
              </button>
              <button className="text-[11px] rounded-md px-3 py-1 transition-colors"
                style={{ color: textMuted, border: `1px solid ${borderColor}` }}>
                Try a sample transcript
              </button>
            </div>
          )}

          {/* State 2: Validation */}
          {state === "validation" && (
            <div className="w-full max-w-md" style={{ animation: "slideUp 0.2s ease-out" }}>
              <div className="flex items-center gap-3 p-3 rounded-lg mb-6" style={{ backgroundColor: panelBg, border: `1px solid ${borderColor}` }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${colors.crystal}15` }}>
                  <FileText className="w-5 h-5" style={{ color: colors.crystal }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] truncate" style={{ fontWeight: 500, color: textPrimary }}>{selectedFile.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${colors.ice}10`, color: colors.ice, border: `1px solid ${colors.ice}20` }}>{selectedFile.format}</span>
                    <span className="text-[10px] font-mono" style={{ color: textMuted }}>{selectedFile.size}</span>
                    <span className="text-[9px] font-mono" style={{ color: textMuted }}>SHA: {selectedFile.sha}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {validationSteps.map((step, i) => (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center">
                      {i < validationProgress ? (
                        <Check className="w-4 h-4 text-[#10B981]" />
                      ) : i === validationProgress ? (
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: colors.crystal }} />
                      ) : (
                        <div className="w-3 h-3 rounded-full" style={{ border: `1px solid ${borderColor}` }} />
                      )}
                    </div>
                    <span className="text-[12px]" style={{
                      color: i < validationProgress ? "#10B981" : i === validationProgress ? textPrimary : textMuted,
                    }}>
                      {step.label} {i < validationProgress ? "✓" : i === validationProgress ? "..." : ""}
                    </span>
                  </div>
                ))}
              </div>

              <button onClick={handleReset} className="mt-6 text-[11px] transition-colors" style={{ color: textMuted }}>
                Cancel
              </button>
            </div>
          )}

          {/* State 3: Upload Progress */}
          {state === "uploading" && (
            <div className="flex flex-col items-center" style={{ animation: "slideUp 0.2s ease-out" }}>
              <div className="text-[12px] mb-4" style={{ fontWeight: 500, color: textSecondary }}>{selectedFile.name}</div>

              <div className="relative w-28 h-28 mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke={borderColor} strokeWidth="3" />
                  <circle
                    cx="50" cy="50" r="44" fill="none"
                    stroke={colors.crystal} strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-100"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[20px] font-mono" style={{ fontWeight: 500, color: textPrimary }}>{Math.round(uploadProgress)}%</span>
                  <span className="text-[9px] font-mono" style={{ color: textMuted }}>{(uploadProgress * 0.042).toFixed(1)} / 4.2 MB</span>
                </div>
              </div>

              <div className="text-[10px] font-mono mb-4" style={{ color: textMuted }}>
                Est. {Math.max(1, Math.round((100 - uploadProgress) / 15))}s remaining · {elapsedTime}s elapsed
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaused(!paused)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-colors"
                  style={{ border: `1px solid ${borderColor}`, color: textSecondary }}
                >
                  {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                  {paused ? "Resume" : "Pause"}
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-colors"
                  style={{ border: `1px solid ${borderColor}`, color: colors.rose }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* State 4: Processing Stages */}
          {state === "processing" && (
            <div className="w-full max-w-sm" style={{ animation: "slideUp 0.2s ease-out" }}>
              <div className="text-center mb-6">
                <div className="text-[13px] mb-1" style={{ fontWeight: 600, color: textPrimary }}>Processing transcript...</div>
                <div className="text-[10px] font-mono" style={{ color: textMuted }}>{elapsedTime}s elapsed</div>
              </div>

              <div className="space-y-0">
                {processingSteps.map((step, i) => (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300`}
                        style={{
                          backgroundColor: i < processingStep ? "#10B981" + "15" : i === processingStep ? `${colors.crystal}15` : `${borderColor}30`,
                        }}>
                        {i < processingStep ? (
                          <Check className="w-3 h-3 text-[#10B981]" />
                        ) : i === processingStep ? (
                          <Loader2 className="w-3 h-3 animate-spin" style={{ color: colors.crystal }} />
                        ) : (
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: borderColor }} />
                        )}
                      </div>
                      {i < processingSteps.length - 1 && (
                        <div className="w-px h-6 transition-colors duration-300"
                          style={{ backgroundColor: i < processingStep ? "#10B981" + "30" : borderColor }} />
                      )}
                    </div>
                    <div className="pb-6">
                      <span className="text-[12px] transition-colors duration-300" style={{
                        fontWeight: i === processingStep ? 500 : 400,
                        color: i < processingStep ? "#10B981" : i === processingStep ? textPrimary : textMuted,
                      }}>
                        {step.label}
                        {i < processingStep && " ✓"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* State 5: Complete */}
          {state === "complete" && (
            <div className="flex flex-col items-center" style={{ animation: "scaleIn 0.3s ease-out" }}>
              <div className="w-16 h-16 rounded-full bg-[#10B981]/15 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-[#10B981]" />
              </div>
              <h3 className="text-[16px] mb-2" style={{ fontWeight: 600, color: textPrimary }}>Upload Complete</h3>

              <div className="flex items-center gap-4 mb-6 text-[10px] font-mono" style={{ color: textMuted }}>
                <span>Q4 Strategy Review</span>
                <span>47:23 duration</span>
                <span>6 speakers</span>
              </div>

              <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg text-white text-[12px] transition-colors mb-3"
                style={{ fontWeight: 500, backgroundColor: colors.crystal, boxShadow: "var(--shadow-crystal)" }}
              >
                <span className="flex items-center gap-2">
                  View Analysis <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
              <button onClick={handleReset} className="text-[11px] transition-colors" style={{ color: textMuted }}>
                Upload Another
              </button>
            </div>
          )}

          {/* Error State */}
          {state === "error" && (
            <div className="w-full max-w-md" style={{ animation: "slideUp 0.2s ease-out" }}>
              <div className="p-4 rounded-lg" style={{ border: `1px solid ${colors.rose}30`, backgroundColor: `${colors.rose}05` }}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: colors.rose }} />
                  <div>
                    <div className="text-[13px] mb-1" style={{ fontWeight: 600, color: colors.rose }}>Upload Failed</div>
                    <div className="text-[12px] mb-3 leading-relaxed" style={{ color: textSecondary }}>
                      The file format could not be recognized. Please ensure your transcript is in a supported format (VTT, SRT, TXT, DOCX, or JSON).
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleReset}
                        className="px-3 py-1.5 rounded-md text-[11px] transition-colors"
                        style={{ backgroundColor: `${colors.rose}15`, color: colors.rose }}
                      >
                        Try Again
                      </button>
                      <button className="px-3 py-1.5 rounded-md text-[11px] transition-colors"
                        style={{ border: `1px solid ${borderColor}`, color: textMuted }}>
                        Contact Support
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with demo controls */}
        <div className="px-5 py-2.5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto"
          style={{ borderTop: `1px solid ${borderColor}`, backgroundColor: `${modalBg}CC`, scrollbarWidth: "none" }}>
          <span className="text-[9px] font-mono mr-1 sm:mr-2 shrink-0" style={{ color: textMuted }}>Demo:</span>
          {(["idle", "validation", "uploading", "processing", "complete", "error"] as UploadState[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                setState(s);
                if (s === "uploading") { setUploadProgress(35); setPaused(false); }
                if (s === "processing") { setProcessingStep(2); }
                if (s === "idle") handleReset();
              }}
              className="px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-mono transition-colors shrink-0"
              style={{
                backgroundColor: state === s ? `${colors.crystal}20` : "transparent",
                color: state === s ? colors.crystal : textMuted,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
