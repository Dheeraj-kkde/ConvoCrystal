/**
 * Shared API client — foundation for all data fetching.
 *
 * In production, replace the mock adapter with real Axios calls to FastAPI.
 * The normalized AppError shape is used by all modules for consistent error handling.
 */

// ─── Normalized Error Type ───────────────────────────────────────

export interface AppError {
  code: string;
  message: string;
  status: number;
  retryable: boolean;
  context?: Record<string, unknown>;
}

export function toAppError(err: unknown): AppError {
  if (err && typeof err === "object" && "code" in err) return err as AppError;
  if (err instanceof Error) {
    return {
      code: "UNKNOWN",
      message: err.message,
      status: 0,
      retryable: false,
    };
  }
  return { code: "UNKNOWN", message: String(err), status: 0, retryable: false };
}

// ─── Auth Token Store (in-memory only — never localStorage) ──────

let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

// ─── Base Fetch Wrapper ──────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  withCredentials?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, withCredentials = true, ...rest } = opts;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest", // CSRF header
    ...(rest.headers as Record<string, string>),
  };

  if (_accessToken) {
    headers["Authorization"] = `Bearer ${_accessToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: withCredentials ? "include" : "same-origin",
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const appError: AppError = {
      code: errorBody.code || `HTTP_${response.status}`,
      message: errorBody.message || response.statusText,
      status: response.status,
      retryable: response.status >= 500 || response.status === 429,
      context: errorBody,
    };
    throw appError;
  }

  // Handle 204 No Content
  if (response.status === 204) return undefined as T;

  return response.json();
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "POST", body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "DELETE" }),
};
