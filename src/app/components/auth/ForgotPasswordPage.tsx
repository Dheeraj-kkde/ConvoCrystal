import { useState } from "react";
import { Loader2, ArrowLeft, Eye, EyeOff, Check } from "lucide-react";
import { useNavigate } from "react-router";
import { useTheme } from "../../stores/themeStore";
import { useAuth } from "../../stores/authStore";

const strengthLevels = [
  { label: "Weak", color: "#F43F5E", width: 25 },
  { label: "Fair", color: "#F59E0B", width: 50 },
  { label: "Good", color: "#00C9D6", width: 75 },
  { label: "Strong", color: "#10B981", width: 100 },
];

function getPasswordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4) - 1;
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { colors, isDark } = useTheme();
  const { login } = useAuth();
  const [view, setView] = useState<"request" | "sent" | "reset">("request");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = password.length > 0 ? getPasswordStrength(password) : -1;

  const bgPage = isDark ? colors.bgBase : "#F7F6F3";
  const cardBg = isDark ? colors.bgPanel : "#FFFFFF";
  const cardBorder = isDark ? colors.border : "#D0D0E0";
  const textH = colors.textPrimary;
  const textSub = colors.textSecondary;
  const textMuted = colors.textMuted;
  const inputBg = isDark ? colors.inputBg : "#FFFFFF";
  const inputBorder = isDark ? colors.border : "#D0D0E0";

  const handleRequest = () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: "Please enter a valid email" });
      return;
    }
    setErrors({});
    setLoading(true);
    setTimeout(() => { setLoading(false); setView("sent"); }, 1200);
  };

  const handleReset = async () => {
    const newErrors: Record<string, string> = {};
    if (!password || password.length < 8) newErrors.password = "Must be at least 8 characters";
    if (password !== confirmPassword) newErrors.confirm = "Passwords do not match";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setLoading(true);
    try {
      // In production: POST /api/v1/auth/reset-password with token + new password
      // Then auto-login with new credentials
      await login(email, password);
      navigate("/", { replace: true });
    } catch {
      // If auto-login fails, redirect to login page
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

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

      <div className="w-full max-w-[400px] rounded-xl sm:rounded-2xl px-5 py-6 sm:p-8 shadow-sm" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
        {/* Request view */}
        {view === "request" && (
          <>
            <button onClick={() => navigate("/login")} className="flex items-center gap-1 text-[11px] sm:text-[12px] transition-colors mb-4 sm:mb-5" style={{ color: textMuted }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back to login
            </button>
            <h1 className="text-[20px] sm:text-[22px] mb-1" style={{ fontWeight: 700, color: textH }}>Reset your password</h1>
            <p className="text-[12px] sm:text-[13px] mb-5 sm:mb-6" style={{ color: textMuted }}>Enter your email and we'll send you a reset link</p>

            <div className="mb-3 sm:mb-4">
              <label className="text-[11px] sm:text-[12px] mb-1 sm:mb-1.5 block" style={{ fontWeight: 500, color: textSub }}>Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full border rounded-md px-3 py-2 text-[13px] outline-none transition-all"
                style={{ backgroundColor: inputBg, borderColor: errors.email ? colors.rose : inputBorder, color: textH }}
              />
              {errors.email && <p className="text-[10px] mt-1" style={{ color: colors.rose }}>{errors.email}</p>}
            </div>

            <button onClick={handleRequest} disabled={loading}
              className="w-full py-2 sm:py-2.5 rounded-md text-white text-[13px] disabled:opacity-70 transition-all flex items-center justify-center gap-2 hover:opacity-90"
              style={{ fontWeight: 600, backgroundColor: colors.crystal }}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send reset link
            </button>
          </>
        )}

        {/* Sent confirmation — generic message (never reveals if account exists) */}
        {view === "sent" && (
          <div className="text-center py-2 sm:py-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${colors.emerald}15` }}>
              <Check className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: colors.emerald }} />
            </div>
            <h2 className="text-[18px] sm:text-[20px] mb-2" style={{ fontWeight: 700, color: textH }}>Check your inbox</h2>
            <p className="text-[12px] sm:text-[13px] mb-1" style={{ color: textMuted }}>If an account exists for <span style={{ fontWeight: 500, color: textH }}>{email}</span>,</p>
            <p className="text-[12px] sm:text-[13px] mb-5 sm:mb-6" style={{ color: textMuted }}>you'll receive a password reset link shortly.</p>

            <button onClick={() => setView("reset")} className="w-full py-2 sm:py-2.5 rounded-md text-white text-[13px] transition-all mb-3 hover:opacity-90" style={{ fontWeight: 600, backgroundColor: colors.crystal }}>
              I have my reset code
            </button>
            <button onClick={() => navigate("/login")} className="text-[12px] transition-colors" style={{ color: textMuted }}>
              Return to login
            </button>
          </div>
        )}

        {/* Reset view */}
        {view === "reset" && (
          <>
            <h1 className="text-[20px] sm:text-[22px] mb-1" style={{ fontWeight: 700, color: textH }}>Set new password</h1>
            <p className="text-[12px] sm:text-[13px] mb-5 sm:mb-6" style={{ color: textMuted }}>Choose a strong password for your account</p>

            <div className="mb-3 sm:mb-4">
              <label className="text-[11px] sm:text-[12px] mb-1 sm:mb-1.5 block" style={{ fontWeight: 500, color: textSub }}>New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full border rounded-md px-3 py-2 pr-9 text-[13px] outline-none transition-all"
                  style={{ backgroundColor: inputBg, borderColor: errors.password ? colors.rose : inputBorder, color: textH }}
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: textMuted }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[10px] mt-1" style={{ color: colors.rose }}>{errors.password}</p>}
              {strength >= 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? colors.bgRaised : "#D9D6D0" }}>
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${strengthLevels[strength].width}%`, backgroundColor: strengthLevels[strength].color }} />
                  </div>
                  <span className="text-[10px]" style={{ color: strengthLevels[strength].color }}>{strengthLevels[strength].label}</span>
                </div>
              )}
            </div>

            <div className="mb-3 sm:mb-4">
              <label className="text-[11px] sm:text-[12px] mb-1 sm:mb-1.5 block" style={{ fontWeight: 500, color: textSub }}>Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full border rounded-md px-3 py-2 text-[13px] outline-none transition-all"
                style={{ backgroundColor: inputBg, borderColor: errors.confirm ? colors.rose : inputBorder, color: textH }}
              />
              {errors.confirm && <p className="text-[10px] mt-1" style={{ color: colors.rose }}>{errors.confirm}</p>}
            </div>

            <button onClick={handleReset} disabled={loading}
              className="w-full py-2 sm:py-2.5 rounded-md text-white text-[13px] disabled:opacity-70 transition-all flex items-center justify-center gap-2 hover:opacity-90"
              style={{ fontWeight: 600, backgroundColor: colors.crystal }}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Set new password
            </button>
          </>
        )}
      </div>
    </div>
  );
}