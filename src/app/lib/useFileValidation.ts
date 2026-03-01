/**
 * File validation pipeline with magic-byte sniffing and format detection.
 * Runs format detection → size check → MIME sniff in sequence.
 */

export type DetectedFormat = "vtt" | "srt" | "txt" | "docx" | "json" | "unknown";

export interface ValidationResult {
  valid: boolean;
  format: DetectedFormat;
  error?: string;
  fileSizeMB: number;
  sha256Prefix?: string;
}

const MAX_FILE_SIZE_MB = 50;
const ALLOWED_EXTENSIONS = ["vtt", "srt", "txt", "docx", "json"];

/** Read first N bytes of a file */
async function readSlice(file: File, start: number, end: number): Promise<Uint8Array> {
  const slice = file.slice(start, end);
  const buffer = await slice.arrayBuffer();
  return new Uint8Array(buffer);
}

/** Read first N chars as text */
async function readTextSlice(file: File, bytes: number): Promise<string> {
  const slice = file.slice(0, bytes);
  return slice.text();
}

/** Compute SHA-256 prefix for dedup */
async function hashPrefix(file: File): Promise<string> {
  const slice = file.slice(0, 65536); // first 64KB
  const buffer = await slice.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .slice(0, 4)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Detect format via magic-byte sniffing + extension fallback.
 * Matches the architecture spec's detectFormat function.
 */
export async function detectFormat(file: File): Promise<DetectedFormat> {
  try {
    // Read first 8 bytes for magic byte detection
    const bytes = await readSlice(file, 0, 8);

    // DOCX: PK zip magic bytes [0x50, 0x4B]
    if (bytes[0] === 0x50 && bytes[1] === 0x4b) return "docx";

    // Read as text for VTT/SRT/JSON detection
    const header = await readTextSlice(file, 256);

    if (/^WEBVTT/i.test(header)) return "vtt";
    if (/^\d+\s*\r?\n\d{2}:\d{2}:\d{2}/.test(header)) return "srt";

    // JSON transcript schema detection
    const trimmed = header.trimStart();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const fullText = await file.text();
        const parsed = JSON.parse(fullText);
        if (parsed && (parsed.transcripts || parsed.segments || parsed.results)) {
          return "json";
        }
        return "json"; // Valid JSON, assume transcript
      } catch {
        // Invalid JSON, fall through
      }
    }

    // Extension-based fallback
    const ext = file.name.split(".").pop();
    const lower = ext ? ext.toLowerCase() : "";
    const extMap: Record<string, DetectedFormat> = {
      txt: "txt",
      vtt: "vtt",
      srt: "srt",
      docx: "docx",
      json: "json",
    };
    return extMap[lower] || "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Full validation pipeline: format → size → hash.
 */
export async function validateFile(file: File): Promise<ValidationResult> {
  const fileSizeMB = file.size / (1024 * 1024);

  // 1. Format detection
  const format = await detectFormat(file);
  if (format === "unknown") {
    return {
      valid: false,
      format,
      fileSizeMB,
      error: `Unsupported format. Accepted: ${ALLOWED_EXTENSIONS.join(", ").toUpperCase()}`,
    };
  }

  // 2. Size check
  if (fileSizeMB > MAX_FILE_SIZE_MB) {
    return {
      valid: false,
      format,
      fileSizeMB,
      error: `File too large (${fileSizeMB.toFixed(1)} MB). Maximum: ${MAX_FILE_SIZE_MB} MB`,
    };
  }

  // 3. Hash prefix for dedup
  let sha256Prefix: string | undefined;
  try {
    sha256Prefix = await hashPrefix(file);
  } catch {
    // SubtleCrypto may not be available in all contexts
  }

  return { valid: true, format, fileSizeMB, sha256Prefix };
}
