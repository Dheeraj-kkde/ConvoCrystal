// ─── Shared Library Barrel ───────────────────────────────────────
// Infrastructure hooks and utilities shared across all modules.

export { api, setAccessToken, getAccessToken, toAppError } from "./api";
export type { AppError } from "./api";

export { useWebSocket } from "./useWebSocket";
export type { WSStatus } from "./useWebSocket";

export { useBeforeUnloadGuard } from "./useBeforeUnloadGuard";
export { useOnlineStatus } from "./useOnlineStatus";
