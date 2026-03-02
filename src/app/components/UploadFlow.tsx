import { useState, useEffect, useCallback, useRef } from "react";
import {
  CloudUpload, X, FileText, Check, Loader2, Pause, Play,
  AlertCircle, ArrowRight, Upload,
} from "lucide-react";
import { useToast } from "./ToastSystem";
import { useTheme } from "./ThemeContext";
import { validateFile, type DetectedFormat, type ValidationResult } from "../lib/useFileValidation";
import { useBeforeUnloadGuard } from "../lib/useBeforeUnloadGuard";

// ─── FSM Types (Architecture Doc M1 — 8-state discriminated union) ─

type ValidationPhase = "format_check" | "size_check" | "mime_sniff";
type ProcessingStage = "queued" | "parsing" | "extracting" | "analyzing" | "scoring" | "indexing";

type UploadFSM =
  | { status: "idle" }
  | { status: "selecting"; dragActive: boolean }
  | { status: "validating"; file: File; phase: ValidationPhase }
  | { status: "uploading"; file: File; progress: number; uploadId: string; bytesUploaded: number }
  | { status: "processing"; transcriptId: string; stage: ProcessingStage; stageIndex: number }
  | { status: "complete"; transcriptId: string; analysisId: string; confidenceScore: number }
  | { status: "failed"; error: string; retryCount: number }
  | { status: "cancelled" };

const INITIAL_STATE: UploadFSM = { status: "idle" };

const formatChips = ["VTT", "SRT", "TXT", "DOCX", "JSON"];
const processingSteps: { label: string; key: ProcessingStage }[] = [
  { label: "Queued", key: "queued" },
  { label: "Parsing", key: "parsing" },
  { label: "Extracting", key: "extracting" },
  { label: "Analyzing", key: "analyzing" },
  { label: "Scoring", key: "scoring" },
  { label: "Indexing", key: "indexing" },
];

interface FileInfo {
  name: string;
  sizeMB: number;
  format: DetectedFormat;
  sha: string;
}

interface UploadFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadFlow({ isOpen, onClose }: UploadFlowProps) {
  const [fsm, setFsm] = useState<UploadFSM>(INITIAL_STATE);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [dashOffset, setDashOffset] = useState(0);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validationPhase, setValidationPhase] = useState(0); // 0=format, 1=size, 2=hash, 3=done
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addToast } = useToast();
  const { isDark, colors } = useTheme();

  // Derived convenience booleans
  const state = fsm.status;
  const isDragActive = fsm.status === "selecting" && fsm.dragActive;

  // Shorthand aliases for colors used throughout the template
  const modalBg = colors.bgBase;
  const panelBg = colors.bgPanel;
  const borderColor = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const textMuted = colors.textMuted;

  // Guard against accidental tab close during upload/processing
  useBeforeUnloadGuard(state === "uploading" || state === "processing");

  // Dash animation for idle state
  useEffect(() => {
    if (state === "idle" || state === "selecting") {
      const interval = setInterval(() => setDashOffset((prev) => (prev + 0.5) % 100), 50);
      return () => clearInterval(interval);
    }
  }, [state]);

  // Elapsed time counter
  useEffect(() => {
    if (state === "processing" || state === "uploading") {
      const timer = setInterval(() => setElapsedTime((t) => t + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [state]);

  // Processing stages (simulated WS events — replace with useWebSocket in production)
  useEffect(() => {
    if (state === "processing" && processingStep < processingSteps.length) {
      const timer = setTimeout(() => setProcessingStep((s) => s + 1), 1200);
      return () => clearTimeout(timer);
    }
    if (state === "processing" && processingStep >= processingSteps.length) {
      const timer = setTimeout(() => {
        setFsm({ status: "complete", transcriptId: `tr_${Date.now()}`, analysisId: `an_${Date.now()}`, confidenceScore: 91 });
        addToast({ variant: "success", title: "Upload complete", message: `${fileInfo?.name || "Transcript"} is ready for analysis.` });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state, processingStep, addToast, fileInfo]);

  // ─── Real file validation pipeline ─────────────────────────────

  const processFile = useCallback(async (file: File) => {
    setFsm({ status: "validating", file, phase: "format_check" });
    setValidationPhase(0);
    setUploadProgress(0);
    setProcessingStep(0);
    setElapsedTime(0);
    setErrorMessage("");
    setPaused(false);

    // Phase 1: Format detection
    setValidationPhase(0);
    await new Promise((r) => setTimeout(r, 400)); // brief visual pause

    const result = await validateFile(file);
    setValidationResult(result);
    setFileInfo({
      name: file.name,
      sizeMB: result.fileSizeMB,
      format: result.format,
      sha: result.sha256Prefix || "n/a",
    });

    // Phase 2: Size check
    setValidationPhase(1);
    await new Promise((r) => setTimeout(r, 400));

    // Phase 3: Hash/dedup
    setValidationPhase(2);
    await new Promise((r) => setTimeout(r, 400));

    setValidationPhase(3);

    if (!result.valid) {
      await new Promise((r) => setTimeout(r, 300));
      setFsm({ status: "failed", error: result.error || "Validation failed.", retryCount: 0 });
      setErrorMessage(result.error || "Validation failed.");
      addToast({ variant: "error", title: "Validation failed", message: result.error || "File could not be validated." });
      return;
    }

    // Auto-advance to upload
    await new Promise((r) => setTimeout(r, 400));
    setFsm({ status: "uploading", file, progress: 0, uploadId: `up_${Date.now()}`, bytesUploaded: 0 });

    // Simulated chunked upload (replace with real XHR in production)
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        const next = Math.min(100, p + Math.random() * 4 + 1);
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => setFsm({ status: "processing", transcriptId: `tr_${Date.now()}`, stage: "queued", stageIndex: 0 }), 300);
        }
        return next;
      });
    }, 80);
    uploadIntervalRef.current = interval;
  }, [addToast]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setFsm(INITIAL_STATE);
    const files = e.dataTransfer.files;
    if (files.length > 0) processFile(files[0]);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) processFile(files[0]);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  }, [processFile]);

  const handleBrowse = useCallback(() => {
    if (fileInputRef.current) fileInputRef.current.click();
  }, []);

  // Sample transcript for first-value experience
  const handleSampleTranscript = useCallback(() => {
    const sampleContent = "WEBVTT\n\n00:00:01.000 --> 00:00:04.500\nSarah Chen: Let's kick off the Q4 strategy review.\n\n00:00:05.000 --> 00:00:12.000\nMarcus Webb: I've prepared the financial overview. Revenue is up 12% QoQ.\n\n00:00:13.000 --> 00:00:20.000\nDavid Park: The engineering pipeline looks solid, but we need to discuss APAC priorities.\n";
    const blob = new Blob([sampleContent], { type: "text/vtt" });
    const file = new File([blob], "sample-q4-strategy-review.vtt", { type: "text/vtt" });
    processFile(file);
  }, [processFile]);

  const handlePauseResume = useCallback(() => {
    if (paused) {
      // Resume upload simulation
      const interval = setInterval(() => {
        setUploadProgress((p) => {
          const next = Math.min(100, p + Math.random() * 4 + 1);
          if (next >= 100) {
            clearInterval(interval);
            setTimeout(() => setFsm({ status: "processing", transcriptId: `tr_${Date.now()}`, stage: "queued", stageIndex: 0 }), 300);
          }
          return next;
        });
      }, 80);
      uploadIntervalRef.current = interval;
    } else {
      if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
    }
    setPaused(!paused);
  }, [paused]);

  const handleReset = useCallback(() => {
    if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
    setFsm(INITIAL_STATE);
    setUploadProgress(0);
    setProcessingStep(0);
    setElapsedTime(0);
    setPaused(false);
    setFileInfo(null);
    setValidationResult(null);
    setValidationPhase(0);
    setErrorMessage("");
  }, []);

  const handleCancel = useCallback(() => {
    if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
    setFsm({ status: "cancelled" });
    addToast({ variant: "info", title: "Upload cancelled", message: "The upload has been cancelled." });
  }, [addToast]);

  if (!isOpen) return null;

  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference - (uploadProgress / 100) * circumference;

  const validationSteps = [
    { label: "Format Check", key: "format" },
    { label: "Size Check", key: "size" },
    { label: "Content Hash", key: "content" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden"
        accept=".vtt,.srt,.txt,.docx,.json" onChange={handleFileInput} />

      <div className="relative w-full max-w-[640px] max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl mx-3 sm:mx-4 overflow-y-auto"
        style={{ backgroundColor: modalBg, border: `1px solid ${borderColor}`, animation: "modalSlideUp 0.28s ease-out" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4" style={{ color: colors.crystal }} />
            <span className="text-[13px]" style={{ fontWeight: 600, color: textPrimary }}>Upload Transcript</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{ color: textMuted, backgroundColor: panelBg, border: `1px solid ${borderColor}` }}>
              {state === "idle" || state === "selecting" ? "Ready" : state === "validating" ? "Validating" : state === "uploading" ? "Uploading" : state === "processing" ? "Processing" : state === "complete" ? "Done" : state === "cancelled" ? "Cancelled" : "Error"}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#F43F5E]/15 transition-colors" style={{ color: textMuted }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 min-h-[280px] sm:min-h-[360px] flex flex-col items-center justify-center">
          {/* IDLE: Drop Zone */}
          {(state === "idle" || state === "selecting") && (
            <div
              className="w-full rounded-xl p-10 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer"
              style={{
                border: isDragActive ? `1.5px solid ${colors.crystal}` : `1.5px dashed ${borderColor}`,
                backgroundColor: isDragActive ? `${colors.crystal}04` : "transparent",
              }}
              onDragOver={(e) => { e.preventDefault(); setFsm({ status: "selecting", dragActive: true }); }}
              onDragLeave={() => setFsm({ status: "selecting", dragActive: false })}
              onDragEnter={(e) => { e.preventDefault(); setFsm({ status: "selecting", dragActive: true }); }}
              onDrop={handleFileDrop}
              onClick={handleBrowse}
            >
              <div className={`mb-4 transition-transform duration-200 ${isDragActive ? "scale-110" : ""}`}>
                <CloudUpload className="w-12 h-12" style={{ color: textMuted }} />
              </div>
              <h3 className="text-[16px] mb-2" style={{ fontWeight: 600, color: textPrimary }}>Drop your transcript here</h3>
              <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4">
                {formatChips.map((f) => (
                  <span key={f} className="px-2 py-0.5 rounded-full text-[9px] font-mono"
                    style={{ color: colors.ice, backgroundColor: `${colors.ice}10`, border: `1px solid ${colors.ice}20` }}>{f}</span>
                ))}
              </div>
              <button className="text-[12px] transition-colors mb-2" style={{ color: colors.crystal }}
                onClick={(e) => { e.stopPropagation(); handleBrowse(); }}>
                or browse files
              </button>
              <button className="text-[11px] rounded-md px-3 py-1 transition-colors"
                style={{ color: textMuted, border: `1px solid ${borderColor}` }}
                onClick={(e) => { e.stopPropagation(); handleSampleTranscript(); }}>
                Try a sample transcript
              </button>
            </div>
          )}

          {/* VALIDATING: Real file validation pipeline */}
          {state === "validating" && fileInfo && (
            <div className="w-full max-w-md" style={{ animation: "slideUp 0.2s ease-out" }}>
              <div className="flex items-center gap-3 p-3 rounded-lg mb-6" style={{ backgroundColor: panelBg, border: `1px solid ${borderColor}` }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${colors.crystal}15` }}>
                  <FileText className="w-5 h-5" style={{ color: colors.crystal }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] truncate" style={{ fontWeight: 500, color: textPrimary }}>{fileInfo.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${colors.ice}10`, color: colors.ice, border: `1px solid ${colors.ice}20` }}>{fileInfo.format.toUpperCase()}</span>
                    <span className="text-[10px] font-mono" style={{ color: textMuted }}>{fileInfo.sizeMB.toFixed(1)} MB</span>
                    <span className="text-[9px] font-mono" style={{ color: textMuted }}>SHA: {fileInfo.sha}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {validationSteps.map((step, i) => (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center">
                      {i < validationPhase ? (
                        <Check className="w-4 h-4 text-[#10B981]" />
                      ) : i === validationPhase ? (
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: colors.crystal }} />
                      ) : (
                        <div className="w-3 h-3 rounded-full" style={{ border: `1px solid ${borderColor}` }} />
                      )}
                    </div>
                    <span className="text-[12px]" style={{
                      color: i < validationPhase ? "#10B981" : i === validationPhase ? textPrimary : textMuted,
                    }}>
                      {step.label} {i < validationPhase ? "✓" : i === validationPhase ? "..." : ""}
                    </span>
                  </div>
                ))}
              </div>
              <button onClick={handleReset} className="mt-6 text-[11px] transition-colors" style={{ color: textMuted }}>Cancel</button>
            </div>
          )}

          {/* UPLOADING: Progress ring */}
          {state === "uploading" && fileInfo && (
            <div className="flex flex-col items-center" style={{ animation: "slideUp 0.2s ease-out" }}>
              <div className="text-[12px] mb-4" style={{ fontWeight: 500, color: textSecondary }}>{fileInfo.name}</div>
              <div className="relative w-28 h-28 mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke={borderColor} strokeWidth="3" />
                  <circle cx="50" cy="50" r="44" fill="none" stroke={colors.crystal} strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-100" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[20px] font-mono" style={{ fontWeight: 500, color: textPrimary }}>{Math.round(uploadProgress)}%</span>
                  <span className="text-[9px] font-mono" style={{ color: textMuted }}>{(uploadProgress / 100 * fileInfo.sizeMB).toFixed(1)} / {fileInfo.sizeMB.toFixed(1)} MB</span>
                </div>
              </div>
              <div className="text-[10px] font-mono mb-4" style={{ color: textMuted }}>
                Est. {Math.max(1, Math.round((100 - uploadProgress) / 15))}s remaining · {elapsedTime}s elapsed
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handlePauseResume}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-colors"
                  style={{ border: `1px solid ${borderColor}`, color: textSecondary }}>
                  {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                  {paused ? "Resume" : "Pause"}
                </button>
                <button onClick={handleCancel}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-colors"
                  style={{ border: `1px solid ${borderColor}`, color: colors.rose }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* PROCESSING */}
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
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
                        style={{ backgroundColor: i < processingStep ? "#10B98115" : i === processingStep ? `${colors.crystal}15` : `${borderColor}30` }}>
                        {i < processingStep ? <Check className="w-3 h-3 text-[#10B981]" />
                          : i === processingStep ? <Loader2 className="w-3 h-3 animate-spin" style={{ color: colors.crystal }} />
                          : <div className="w-2 h-2 rounded-full" style={{ backgroundColor: borderColor }} />}
                      </div>
                      {i < processingSteps.length - 1 && (
                        <div className="w-px h-6 transition-colors duration-300"
                          style={{ backgroundColor: i < processingStep ? "#10B98130" : borderColor }} />
                      )}
                    </div>
                    <div className="pb-6">
                      <span className="text-[12px] transition-colors duration-300" style={{
                        fontWeight: i === processingStep ? 500 : 400,
                        color: i < processingStep ? "#10B981" : i === processingStep ? textPrimary : textMuted,
                      }}>
                        {step.label}{i < processingStep && " ✓"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COMPLETE */}
          {state === "complete" && fileInfo && (
            <div className="flex flex-col items-center" style={{ animation: "scaleIn 0.3s ease-out" }}>
              <div className="w-16 h-16 rounded-full bg-[#10B981]/15 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-[#10B981]" />
              </div>
              <h3 className="text-[16px] mb-2" style={{ fontWeight: 600, color: textPrimary }}>Upload Complete</h3>
              <div className="flex items-center gap-4 mb-6 text-[10px] font-mono" style={{ color: textMuted }}>
                <span>{fileInfo.name}</span>
                <span>{fileInfo.sizeMB.toFixed(1)} MB</span>
                <span>{fileInfo.format.toUpperCase()}</span>
              </div>
              <button onClick={onClose}
                className="px-5 py-2 rounded-lg text-white text-[12px] transition-colors mb-3"
                style={{ fontWeight: 500, backgroundColor: colors.crystal }}>
                <span className="flex items-center gap-2">View Analysis <ArrowRight className="w-3.5 h-3.5" /></span>
              </button>
              <button onClick={handleReset} className="text-[11px] transition-colors" style={{ color: textMuted }}>Upload Another</button>
            </div>
          )}

          {/* ERROR */}
          {(state === "failed") && (
            <div className="w-full max-w-md" style={{ animation: "slideUp 0.2s ease-out" }}>
              <div className="p-4 rounded-lg" style={{ border: `1px solid ${colors.rose}30`, backgroundColor: `${colors.rose}05` }}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: colors.rose }} />
                  <div>
                    <div className="text-[13px] mb-1" style={{ fontWeight: 600, color: colors.rose }}>Upload Failed</div>
                    <div className="text-[12px] mb-3 leading-relaxed" style={{ color: textSecondary }}>
                      {errorMessage || "An unexpected error occurred. Please try again."}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleReset}
                        className="px-3 py-1.5 rounded-md text-[11px] transition-colors"
                        style={{ backgroundColor: `${colors.rose}15`, color: colors.rose }}>
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CANCELLED */}
          {state === "cancelled" && (
            <div className="flex flex-col items-center" style={{ animation: "slideUp 0.2s ease-out" }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${colors.amber}15` }}>
                <X className="w-8 h-8" style={{ color: colors.amber }} />
              </div>
              <h3 className="text-[16px] mb-2" style={{ fontWeight: 600, color: textPrimary }}>Upload Cancelled</h3>
              <p className="text-[12px] mb-6" style={{ color: textSecondary }}>The upload was cancelled. You can start over or close this dialog.</p>
              <div className="flex items-center gap-2">
                <button onClick={handleReset}
                  className="px-4 py-2 rounded-lg text-white text-[12px] transition-colors"
                  style={{ fontWeight: 500, backgroundColor: colors.crystal }}>
                  Start Over
                </button>
                <button onClick={onClose} className="text-[11px] transition-colors" style={{ color: textMuted }}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}