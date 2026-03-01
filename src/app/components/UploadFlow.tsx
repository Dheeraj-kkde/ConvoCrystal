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

  const selectedFile = {
    name: "Q4-strategy-review-recording.vtt",
    size: "4.2 MB",
    format: "VTT",
    sha: "a3f8c1d",
  };

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

  const handleShowError = useCallback(() => {
    setState("error");
  }, []);

  if (!isOpen) return null;

  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference - (uploadProgress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-[640px] max-h-[90vh] bg-[#0B0C10] border border-[#2A2D42] rounded-2xl overflow-hidden shadow-2xl mx-3 sm:mx-4"
        style={{ animation: "modalSlideUp 0.28s ease-out" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#2A2D42]">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#6366F1]" />
            <span className="text-[13px] text-[#E8EAF6]" style={{ fontWeight: 600 }}>Upload Transcript</span>
            <span className="text-[9px] font-mono text-[#5C6490] px-1.5 py-0.5 rounded bg-[#1A1D2E] border border-[#2A2D42]">
              {state === "idle" ? "Ready" : state === "validation" ? "Validating" : state === "uploading" ? "Uploading" : state === "processing" ? "Processing" : state === "complete" ? "Done" : "Error"}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#F43F5E]/15 hover:text-[#F43F5E] text-[#5C6490] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 min-h-[360px] flex flex-col items-center justify-center">
          {/* State 1: Idle Drop Zone */}
          {state === "idle" && (
            <div
              className={`w-full rounded-xl p-10 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                dragOver ? "bg-[#6366F1]/[0.04] border-[#6366F1]" : "bg-transparent"
              }`}
              style={{
                border: dragOver ? "1.5px solid #6366F1" : "1.5px dashed #2A2D42",
                backgroundImage: dragOver ? undefined : `repeating-linear-gradient(90deg, #2A2D42 0, #2A2D42 2px, transparent 2px, transparent 6px)`,
                backgroundSize: dragOver ? undefined : "auto 1px",
                backgroundPosition: `${dashOffset}px 0, ${dashOffset}px 100%, 0 ${dashOffset}px, 100% ${dashOffset}px`,
                backgroundRepeat: "no-repeat",
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(); }}
              onClick={handleFileSelect}
            >
              <div className={`mb-4 transition-transform duration-200 ${dragOver ? "scale-110" : ""}`}>
                <CloudUpload className="w-12 h-12 text-[#5C6490]" />
              </div>
              <h3 className="text-[#E8EAF6] text-[16px] mb-2" style={{ fontWeight: 600 }}>Drop your transcript here</h3>
              <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4">
                {formatChips.map((f) => (
                  <span key={f} className="px-2 py-0.5 rounded-full text-[9px] font-mono text-[#06B6D4] bg-[#06B6D4]/10 border border-[#06B6D4]/20 hover:bg-[#06B6D4]/20 transition-colors cursor-default">
                    {f}
                  </span>
                ))}
              </div>
              <button className="text-[12px] text-[#6366F1] hover:text-[#818CF8] transition-colors mb-2">
                or browse files
              </button>
              <button className="text-[11px] text-[#5C6490] hover:text-[#9BA3C8] border border-[#2A2D42] rounded-md px-3 py-1 transition-colors">
                Try a sample transcript
              </button>
            </div>
          )}

          {/* State 2: Validation */}
          {state === "validation" && (
            <div className="w-full max-w-md" style={{ animation: "slideUp 0.2s ease-out" }}>
              {/* File card */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1D2E] border border-[#2A2D42] mb-6">
                <div className="w-10 h-10 rounded-lg bg-[#6366F1]/15 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#6366F1]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-[#E8EAF6] truncate" style={{ fontWeight: 500 }}>{selectedFile.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20">{selectedFile.format}</span>
                    <span className="text-[10px] font-mono text-[#5C6490]">{selectedFile.size}</span>
                    <span className="text-[9px] font-mono text-[#5C6490]">SHA: {selectedFile.sha}</span>
                  </div>
                </div>
              </div>

              {/* Validation steps */}
              <div className="space-y-3">
                {validationSteps.map((step, i) => (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center">
                      {i < validationProgress ? (
                        <Check className="w-4 h-4 text-[#10B981]" />
                      ) : i === validationProgress ? (
                        <Loader2 className="w-4 h-4 text-[#6366F1] animate-spin" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border border-[#2A2D42]" />
                      )}
                    </div>
                    <span className={`text-[12px] ${
                      i < validationProgress ? "text-[#10B981]" : i === validationProgress ? "text-[#E8EAF6]" : "text-[#5C6490]"
                    }`}>
                      {step.label} {i < validationProgress ? "✓" : i === validationProgress ? "..." : ""}
                    </span>
                  </div>
                ))}
              </div>

              <button onClick={handleReset} className="mt-6 text-[11px] text-[#5C6490] hover:text-[#F43F5E] transition-colors">
                Cancel
              </button>
            </div>
          )}

          {/* State 3: Upload Progress */}
          {state === "uploading" && (
            <div className="flex flex-col items-center" style={{ animation: "slideUp 0.2s ease-out" }}>
              <div className="text-[12px] text-[#9BA3C8] mb-4" style={{ fontWeight: 500 }}>{selectedFile.name}</div>

              {/* Progress ring */}
              <div className="relative w-28 h-28 mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#2A2D42" strokeWidth="3" />
                  <circle
                    cx="50" cy="50" r="44" fill="none"
                    stroke="#6366F1" strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-100"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[20px] font-mono text-[#E8EAF6]" style={{ fontWeight: 500 }}>{Math.round(uploadProgress)}%</span>
                  <span className="text-[9px] font-mono text-[#5C6490]">{(uploadProgress * 0.042).toFixed(1)} / 4.2 MB</span>
                </div>
              </div>

              <div className="text-[10px] font-mono text-[#5C6490] mb-4">
                Est. {Math.max(1, Math.round((100 - uploadProgress) / 15))}s remaining · {elapsedTime}s elapsed
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaused(!paused)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#2A2D42] text-[11px] text-[#9BA3C8] hover:bg-[#6366F1]/10 transition-colors"
                >
                  {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                  {paused ? "Resume" : "Pause"}
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#2A2D42] text-[11px] text-[#F43F5E] hover:bg-[#F43F5E]/10 transition-colors"
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
                <div className="text-[13px] text-[#E8EAF6] mb-1" style={{ fontWeight: 600 }}>Processing transcript...</div>
                <div className="text-[10px] font-mono text-[#5C6490]">{elapsedTime}s elapsed</div>
              </div>

              {/* Vertical timeline */}
              <div className="space-y-0">
                {processingSteps.map((step, i) => (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                        i < processingStep
                          ? "bg-[#10B981]/15"
                          : i === processingStep
                          ? "bg-[#6366F1]/15"
                          : "bg-[#2A2D42]/30"
                      }`}>
                        {i < processingStep ? (
                          <Check className="w-3 h-3 text-[#10B981]" />
                        ) : i === processingStep ? (
                          <Loader2 className="w-3 h-3 text-[#6366F1] animate-spin" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-[#2A2D42]" />
                        )}
                      </div>
                      {i < processingSteps.length - 1 && (
                        <div className={`w-px h-6 transition-colors duration-300 ${
                          i < processingStep ? "bg-[#10B981]/30" : "bg-[#2A2D42]"
                        }`} />
                      )}
                    </div>
                    <div className="pb-6">
                      <span className={`text-[12px] transition-colors duration-300 ${
                        i < processingStep
                          ? "text-[#10B981]"
                          : i === processingStep
                          ? "text-[#E8EAF6]"
                          : "text-[#5C6490]"
                      }`} style={{ fontWeight: i === processingStep ? 500 : 400 }}>
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
              <h3 className="text-[#E8EAF6] text-[16px] mb-2" style={{ fontWeight: 600 }}>Upload Complete</h3>

              <div className="flex items-center gap-4 mb-6 text-[10px] font-mono text-[#5C6490]">
                <span>Q4 Strategy Review</span>
                <span>47:23 duration</span>
                <span>6 speakers</span>
              </div>

              <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg bg-[#6366F1] text-white text-[12px] hover:bg-[#818CF8] transition-colors mb-3"
                style={{ fontWeight: 500, boxShadow: "0 0 16px rgba(99,102,241,0.2)" }}
              >
                <span className="flex items-center gap-2">
                  View Analysis <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
              <button onClick={handleReset} className="text-[11px] text-[#5C6490] hover:text-[#9BA3C8] transition-colors">
                Upload Another
              </button>
            </div>
          )}

          {/* Error State */}
          {state === "error" && (
            <div className="w-full max-w-md" style={{ animation: "slideUp 0.2s ease-out" }}>
              <div className="p-4 rounded-lg border border-[#F43F5E]/30 bg-[#F43F5E]/[0.05]">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#F43F5E] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[13px] text-[#F43F5E] mb-1" style={{ fontWeight: 600 }}>Upload Failed</div>
                    <div className="text-[12px] text-[#9BA3C8] mb-3 leading-relaxed">
                      The file format could not be recognized. Please ensure your transcript is in a supported format (VTT, SRT, TXT, DOCX, or JSON).
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleReset}
                        className="px-3 py-1.5 rounded-md bg-[#F43F5E]/15 text-[#F43F5E] text-[11px] hover:bg-[#F43F5E]/25 transition-colors"
                      >
                        Try Again
                      </button>
                      <button className="px-3 py-1.5 rounded-md border border-[#2A2D42] text-[11px] text-[#5C6490] hover:text-[#9BA3C8] transition-colors">
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
        <div className="px-5 py-2.5 border-t border-[#2A2D42] flex items-center gap-1.5 sm:gap-2 bg-[#0B0C10]/80 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <span className="text-[9px] font-mono text-[#5C6490] mr-1 sm:mr-2 shrink-0">Demo:</span>
          {(["idle", "validation", "uploading", "processing", "complete", "error"] as UploadState[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                setState(s);
                if (s === "uploading") { setUploadProgress(35); setPaused(false); }
                if (s === "processing") { setProcessingStep(2); }
                if (s === "idle") handleReset();
              }}
              className={`px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-mono transition-colors shrink-0 ${
                state === s ? "bg-[#6366F1]/20 text-[#6366F1]" : "text-[#5C6490] hover:text-[#9BA3C8]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}