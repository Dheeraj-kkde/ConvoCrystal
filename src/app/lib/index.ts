// ─── Shared Library Barrel ───────────────────────────────────────
// Infrastructure hooks and utilities shared across all modules.

export { api, setAccessToken, getAccessToken, toAppError } from "./api";
export type { AppError } from "./api";

export { useWebSocket } from "./useWebSocket";
export type { WSStatus } from "./useWebSocket";

export { useBeforeUnloadGuard } from "./useBeforeUnloadGuard";
export { useOnlineStatus } from "./useOnlineStatus";
export { useTokenStreamBuffer } from "./useTokenStreamBuffer";
export { validateFile, detectFormat } from "./useFileValidation";
export type { DetectedFormat, ValidationResult } from "./useFileValidation";

export { useHotkeys } from "./useHotkeys";
export { useChatStream } from "./useChatStream";
export type { OrchestratorStage, StreamConfidence, StreamCitation } from "./useChatStream";
export { useUploadProcessor } from "./useUploadProcessor";
export type { ProcessingStage } from "./useUploadProcessor";

export { useDocumentsQuery, useCommitsQuery, useDiffQuery, useRestoreMutation, useDeleteDocumentMutation } from "./queries";
export type { DocumentItem, CommitNode, DiffLine, DiffResult } from "./queries";

export { useNotificationStream } from "./useNotificationStream";

export { formatRelativeTime, useRelativeTimeTick } from "./useRelativeTime";