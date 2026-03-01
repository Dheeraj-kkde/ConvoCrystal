/**
 * Auth store — JWT + refresh token simulation with:
 * - In-memory access token (never localStorage)
 * - Silent refresh scheduling
 * - Rate-limit countdown
 * - PKCE OAuth helpers
 * - BroadcastChannel session sync
 */
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

// ─── Types ───────────────────────────────────────────────────────

export type AuthStatus = "uninitialised" | "checking" | "authenticated" | "unauthenticated";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  expiresAt: number | null;
  rateLimitUntil: number | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  silentRefresh: () => Promise<void>;
  setRateLimit: (retryAfterMs: number) => void;
  clearRateLimit: () => void;
  setAuthenticated: (user: AuthUser, token: string, expiresIn: number) => void;
}

// ─── PKCE Helpers ────────────────────────────────────────────────

export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(36)).join("").slice(0, 43);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generateOAuthState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── BroadcastChannel Session Sync ───────────────────────────────

let authChannel: BroadcastChannel | null = null;
try {
  authChannel = new BroadcastChannel("cc-auth");
} catch {
  // BroadcastChannel not supported in all environments
}

// ─── Mock responses (replace with real API) ──────────────────────

const MOCK_USER: AuthUser = {
  id: "usr_001",
  name: "Jane Doe",
  email: "jane@convocrystal.io",
  avatar: undefined,
};

function mockDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Store ───────────────────────────────────────────────────────

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "uninitialised",
  user: null,
  accessToken: null,
  expiresAt: null,
  rateLimitUntil: null,

  setAuthenticated: (user, token, expiresIn) => {
    set({
      status: "authenticated",
      user,
      accessToken: token,
      expiresAt: Date.now() + expiresIn * 1000,
    });

    // Schedule silent refresh 60s before expiry
    if (refreshTimer) clearTimeout(refreshTimer);
    const delay = Math.max((expiresIn - 60) * 1000, 5000);
    refreshTimer = setTimeout(() => {
      get().silentRefresh();
    }, delay);
  },

  login: async (email: string, _password: string) => {
    // Simulate network call
    await mockDelay(1200);

    // Simulate rate limiting (1 in 10 chance for demo)
    if (Math.random() < 0.05) {
      const retryAfter = 30000;
      set({ rateLimitUntil: Date.now() + retryAfter });
      throw { status: 429, headers: { "retry-after": "30" } };
    }

    // Generic error — never reveal which field is wrong
    if (!email.includes("@")) {
      throw { status: 401, message: "Invalid credentials. Please try again." };
    }

    // Success: mock token
    const token = "eyJ" + btoa(JSON.stringify({ sub: MOCK_USER.id, exp: Date.now() + 900000 }));
    get().setAuthenticated(MOCK_USER, token, 900); // 15 min

    // Broadcast to other tabs
    if (authChannel) {
      authChannel.postMessage({ type: "auth:login", user: MOCK_USER });
    }
  },

  logout: () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    set({
      status: "unauthenticated",
      user: null,
      accessToken: null,
      expiresAt: null,
    });

    // Broadcast logout to all tabs
    if (authChannel) {
      authChannel.postMessage({ type: "auth:logout" });
    }
  },

  silentRefresh: async () => {
    set((s) => (s.status === "uninitialised" ? { status: "checking" } : {}));
    try {
      await mockDelay(400);
      // Mock: always succeed refresh
      const token = "eyJ" + btoa(JSON.stringify({ sub: MOCK_USER.id, exp: Date.now() + 900000 }));
      get().setAuthenticated(MOCK_USER, token, 900);
    } catch {
      set({ status: "unauthenticated", user: null, accessToken: null, expiresAt: null });
    }
  },

  setRateLimit: (retryAfterMs) => {
    set({ rateLimitUntil: Date.now() + retryAfterMs });
  },

  clearRateLimit: () => {
    set({ rateLimitUntil: null });
  },
}));

// ─── BroadcastChannel Listener ───────────────────────────────────

if (authChannel) {
  authChannel.onmessage = (e) => {
    const data = e.data;
    if (data && data.type === "auth:logout") {
      // Another tab logged out — clear our state too
      if (refreshTimer) clearTimeout(refreshTimer);
      useAuthStore.setState({
        status: "unauthenticated",
        user: null,
        accessToken: null,
        expiresAt: null,
      });
    }
  };
}

// ─── Convenience Hook ────────────────────────────────────────────

export function useAuth() {
  return useAuthStore(
    useShallow((s) => ({
      status: s.status,
      user: s.user,
      accessToken: s.accessToken,
      rateLimitUntil: s.rateLimitUntil,
      login: s.login,
      logout: s.logout,
      silentRefresh: s.silentRefresh,
      setRateLimit: s.setRateLimit,
      clearRateLimit: s.clearRateLimit,
    }))
  );
}
