import { useState, useEffect, useCallback } from "react";
import { Eye, EyeOff, Loader2, Timer } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { useTheme } from "../../stores/themeStore";
import { useAuth, generateCodeVerifier, generateCodeChallenge, generateOAuthState } from "../../stores/authStore";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { colors, isDark } = useTheme();
  const { status, login, rateLimitUntil, clearRateLimit } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  const returnUrl = (location.state as { returnUrl?: string } | undefined)?.returnUrl || "/";

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated") navigate(returnUrl, { replace: true });
  }, [status, navigate, returnUrl]);

  // ─── Rate limit countdown timer ────────────────────────────────
  useEffect(() => {
    if (!rateLimitUntil) {
      setRateLimitCountdown(0);
      return;
    }
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((rateLimitUntil - Date.now()) / 1000));
      setRateLimitCountdown(remaining);
      if (remaining <= 0) clearRateLimit();
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [rateLimitUntil, clearRateLimit]);

  const isRateLimited = rateLimitCountdown > 0;

  // ─── Form submission → authStore.login ─────────────────────────
  const handleSubmit = useCallback(async () => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Please enter a valid email";
    if (!password) newErrors.password = "Password is required";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setLoading(true);

    try {
      await login(email, password);
      // Success — ProtectedRoute will redirect via status change
      navigate(returnUrl, { replace: true });
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error && error.status === 429) {
        // Rate limited — countdown is handled via rateLimitUntil state
        setErrors({ root: "Too many attempts. Please wait before trying again." });
      } else if (error && error.status === 401) {
        // Generic error — never reveal which field is wrong (prevents user enumeration)
        setErrors({ root: "Invalid credentials. Please try again." });
      } else {
        setErrors({ root: "An unexpected error occurred. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, login, navigate, returnUrl]);

  // ─── PKCE OAuth ────────────────────────────────────────────────
  const handleOAuth = useCallback(async (provider: "google" | "github") => {
    try {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      const state = generateOAuthState();
      sessionStorage.setItem("oauth_verifier", verifier);
      sessionStorage.setItem("oauth_state", state);
      // In production: redirect to /api/v1/auth/oauth/{provider}
      // For demo: show toast-like feedback
      setErrors({ root: `OAuth ${provider} flow initiated (PKCE). In production this would redirect to the provider.` });
    } catch {
      setErrors({ root: "OAuth initialization failed. Please try again." });
    }
  }, []);

  // ─── Theme tokens ──────────────────────────────────────────────
  const bgPage = isDark ? colors.bgBase : "#F7F6F3";
  const cardBg = isDark ? colors.bgPanel : "#FFFFFF";
  const cardBorder = isDark ? colors.border : "#D0D0E0";
  const textH = colors.textPrimary;
  const textSub = colors.textSecondary;
  const textMuted = colors.textMuted;
  const inputBg = isDark ? colors.inputBg : "#FFFFFF";
  const inputBorder = isDark ? colors.border : "#D0D0E0";
  const dividerColor = isDark ? colors.border : "#D9D6D0";
  const oauthBtnBg = isDark ? colors.bgRaised : "#FFFFFF";
  const oauthBtnBorder = isDark ? colors.border : "#D0D0E0";
  const oauthHover = isDark ? colors.hoverNeutral : "#F7F6F3";
  const githubFill = isDark ? "#E8EAF6" : "#1A1916";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-3 sm:px-4 py-6" style={{ background: bgPage }}>
      {/* Wordmark */}
      <div className="mb-6 sm:mb-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.crystal }}>
            <span className="text-white text-[9px] sm:text-[10px] font-mono" style={{ fontWeight: 700 }}>CC</span>
          </div>
        </div>
        <span className="text-[16px] sm:text-[18px]" style={{ fontWeight: 600, color: textH }}>
          Convo<span style={{ color: colors.crystal }}>Crystal</span>
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-[400px] rounded-xl sm:rounded-2xl px-5 py-6 sm:p-8 shadow-sm" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
        <h1 className="text-[20px] sm:text-[24px] mb-1" style={{ fontWeight: 700, color: textH }}>Welcome back</h1>
        <p className="text-[12px] sm:text-[13px] mb-5 sm:mb-6" style={{ color: textMuted }}>Sign in to continue analyzing your meetings</p>

        {/* Root-level error / rate limit banner */}
        {errors.root && (
          <div className="mb-4 px-3 py-2 rounded-md text-[12px]" style={{ backgroundColor: isRateLimited ? `${colors.amber}12` : `${colors.rose}10`, color: isRateLimited ? colors.amber : colors.rose }}>
            {errors.root}
          </div>
        )}

        {/* Rate limit countdown */}
        {isRateLimited && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-md" style={{ backgroundColor: `${colors.amber}10`, border: `1px solid ${colors.amber}25` }}>
            <Timer className="w-4 h-4 shrink-0" style={{ color: colors.amber }} />
            <div>
              <div className="text-[11px]" style={{ fontWeight: 600, color: colors.amber }}>Rate limited</div>
              <div className="text-[10px]" style={{ color: textMuted }}>Try again in {rateLimitCountdown}s</div>
            </div>
            <div className="ml-auto w-8 h-8 rounded-full flex items-center justify-center font-mono text-[14px]" style={{ fontWeight: 700, color: colors.amber, backgroundColor: `${colors.amber}10` }}>
              {rateLimitCountdown}
            </div>
          </div>
        )}

        {/* Email */}
        <div className="mb-3 sm:mb-4">
          <label className="text-[11px] sm:text-[12px] mb-1 sm:mb-1.5 block" style={{ fontWeight: 500, color: textSub }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => {
              if (email && !/\S+@\S+\.\S+/.test(email)) setErrors((e) => ({ ...e, email: "Please enter a valid email" }));
              else setErrors((e) => { const { email: _, ...rest } = e; return rest; });
            }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            placeholder="you@company.com"
            disabled={isRateLimited}
            className="w-full border rounded-md px-3 py-2 text-[13px] outline-none transition-all disabled:opacity-50"
            style={{ backgroundColor: inputBg, borderColor: errors.email ? colors.rose : inputBorder, color: textH }}
          />
          {errors.email && <p className="text-[10px] mt-1" style={{ color: colors.rose }}>{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[12px]" style={{ fontWeight: 500, color: textSub }}>Password</label>
            <button onClick={() => navigate("/forgot-password")} className="text-[11px] hover:opacity-80 transition-colors" style={{ color: colors.crystal }}>
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => {
                if (!password) setErrors((e) => ({ ...e, password: "Password is required" }));
                else setErrors((e) => { const { password: _, ...rest } = e; return rest; });
              }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              placeholder="Enter your password"
              disabled={isRateLimited}
              className="w-full border rounded-md px-3 py-2 pr-9 text-[13px] outline-none transition-all disabled:opacity-50"
              style={{ backgroundColor: inputBg, borderColor: errors.password ? colors.rose : inputBorder, color: textH }}
            />
            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors" style={{ color: textMuted }}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-[10px] mt-1" style={{ color: colors.rose }}>{errors.password}</p>}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || isRateLimited}
          className="w-full py-2 sm:py-2.5 rounded-md text-white text-[13px] disabled:opacity-70 transition-all flex items-center justify-center gap-2 hover:opacity-90"
          style={{ fontWeight: 600, backgroundColor: colors.crystal }}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isRateLimited ? `Wait ${rateLimitCountdown}s` : "Sign In"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4 sm:my-5">
          <div className="flex-1 h-px" style={{ backgroundColor: dividerColor }} />
          <span className="text-[11px]" style={{ color: textMuted }}>or continue with</span>
          <div className="flex-1 h-px" style={{ backgroundColor: dividerColor }} />
        </div>

        {/* OAuth (PKCE) */}
        <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => handleOAuth("google")}
            disabled={isRateLimited}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md border text-[12px] transition-colors disabled:opacity-50"
            style={{ fontWeight: 500, borderColor: oauthBtnBorder, backgroundColor: oauthBtnBg, color: textH }}
            onMouseEnter={(e) => { if (!isRateLimited) e.currentTarget.style.backgroundColor = oauthHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = oauthBtnBg; }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button
            onClick={() => handleOAuth("github")}
            disabled={isRateLimited}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md border text-[12px] transition-colors disabled:opacity-50"
            style={{ fontWeight: 500, borderColor: oauthBtnBorder, backgroundColor: oauthBtnBg, color: textH }}
            onMouseEnter={(e) => { if (!isRateLimited) e.currentTarget.style.backgroundColor = oauthHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = oauthBtnBg; }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill={githubFill}>
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            GitHub
          </button>
        </div>

        {/* Register link */}
        <p className="text-center text-[11px] sm:text-[12px] mt-4 sm:mt-5" style={{ color: textMuted }}>
          Don't have an account?{" "}
          <button onClick={() => navigate("/register")} className="hover:opacity-80 transition-colors" style={{ fontWeight: 500, color: colors.crystal }}>
            Register
          </button>
        </p>
      </div>
    </div>
  );
}
