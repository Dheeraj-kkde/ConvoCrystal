import { useState } from "react";
import { Loader2, ArrowLeft, Eye, EyeOff, Check } from "lucide-react";
import { useNavigate } from "react-router";

const strengthLevels = [
  { label: "Weak", color: "#F43F5E", width: 25 },
  { label: "Fair", color: "#F59E0B", width: 50 },
  { label: "Good", color: "#06B6D4", width: 75 },
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
  const [view, setView] = useState<"request" | "sent" | "reset">("request");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = password.length > 0 ? getPasswordStrength(password) : -1;

  const handleRequest = () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: "Please enter a valid email" });
      return;
    }
    setErrors({});
    setLoading(true);
    setTimeout(() => { setLoading(false); setView("sent"); }, 1200);
  };

  const handleReset = () => {
    const newErrors: Record<string, string> = {};
    if (!password || password.length < 8) newErrors.password = "Must be at least 8 characters";
    if (password !== confirmPassword) newErrors.confirm = "Passwords do not match";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate("/login"); }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-3 sm:px-4 py-6" style={{ background: "#F7F6F3" }}>
      {/* Wordmark */}
      <div className="mb-6 sm:mb-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#6366F1] flex items-center justify-center">
            <span className="text-white text-[9px] sm:text-[10px] font-mono" style={{ fontWeight: 700 }}>CC</span>
          </div>
        </div>
        <span className="text-[16px] sm:text-[18px] text-[#1A1916]" style={{ fontWeight: 600 }}>
          Convo<span className="text-[#6366F1]">Crystal</span>
        </span>
      </div>

      <div className="w-full max-w-[400px] bg-white rounded-xl sm:rounded-2xl border border-[#D0D0E0] px-5 py-6 sm:p-8 shadow-sm">
        {/* Request view */}
        {view === "request" && (
          <>
            <button onClick={() => navigate("/login")} className="flex items-center gap-1 text-[11px] sm:text-[12px] text-[#8C8980] hover:text-[#504E49] transition-colors mb-4 sm:mb-5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to login
            </button>
            <h1 className="text-[20px] sm:text-[22px] text-[#1A1916] mb-1" style={{ fontWeight: 700 }}>Reset your password</h1>
            <p className="text-[12px] sm:text-[13px] text-[#8C8980] mb-5 sm:mb-6">Enter your email and we'll send you a reset link</p>

            <div className="mb-3 sm:mb-4">
              <label className="text-[11px] sm:text-[12px] text-[#504E49] mb-1 sm:mb-1.5 block" style={{ fontWeight: 500 }}>Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-white border rounded-md px-3 py-2 text-[13px] text-[#1A1916] placeholder-[#B8B5AE] outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1] transition-all"
                style={{ borderColor: errors.email ? "#F43F5E" : "#D0D0E0" }}
              />
              {errors.email && <p className="text-[10px] text-[#F43F5E] mt-1">{errors.email}</p>}
            </div>

            <button onClick={handleRequest} disabled={loading}
              className="w-full py-2 sm:py-2.5 rounded-md bg-[#6366F1] text-white text-[13px] hover:bg-[#818CF8] disabled:opacity-70 transition-all flex items-center justify-center gap-2"
              style={{ fontWeight: 600 }}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send reset link
            </button>
          </>
        )}

        {/* Sent confirmation */}
        {view === "sent" && (
          <div className="text-center py-2 sm:py-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#10B981]/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 sm:w-7 sm:h-7 text-[#10B981]" />
            </div>
            <h2 className="text-[18px] sm:text-[20px] text-[#1A1916] mb-2" style={{ fontWeight: 700 }}>Check your inbox</h2>
            <p className="text-[12px] sm:text-[13px] text-[#8C8980] mb-1">If an account exists for <span className="text-[#1A1916]" style={{ fontWeight: 500 }}>{email}</span>,</p>
            <p className="text-[12px] sm:text-[13px] text-[#8C8980] mb-5 sm:mb-6">you'll receive a password reset link shortly.</p>

            <button onClick={() => setView("reset")} className="w-full py-2 sm:py-2.5 rounded-md bg-[#6366F1] text-white text-[13px] hover:bg-[#818CF8] transition-all mb-3" style={{ fontWeight: 600 }}>
              I have my reset code
            </button>
            <button onClick={() => navigate("/login")} className="text-[12px] text-[#8C8980] hover:text-[#504E49] transition-colors">
              Return to login
            </button>
          </div>
        )}

        {/* Reset view */}
        {view === "reset" && (
          <>
            <h1 className="text-[20px] sm:text-[22px] text-[#1A1916] mb-1" style={{ fontWeight: 700 }}>Set new password</h1>
            <p className="text-[12px] sm:text-[13px] text-[#8C8980] mb-5 sm:mb-6">Choose a strong password for your account</p>

            <div className="mb-3 sm:mb-4">
              <label className="text-[11px] sm:text-[12px] text-[#504E49] mb-1 sm:mb-1.5 block" style={{ fontWeight: 500 }}>New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-white border rounded-md px-3 py-2 pr-9 text-[13px] text-[#1A1916] placeholder-[#B8B5AE] outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1] transition-all"
                  style={{ borderColor: errors.password ? "#F43F5E" : "#D0D0E0" }}
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C8980]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[10px] text-[#F43F5E] mt-1">{errors.password}</p>}
              {strength >= 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-[#D9D6D0] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${strengthLevels[strength].width}%`, backgroundColor: strengthLevels[strength].color }} />
                  </div>
                  <span className="text-[10px]" style={{ color: strengthLevels[strength].color }}>{strengthLevels[strength].label}</span>
                </div>
              )}
            </div>

            <div className="mb-3 sm:mb-4">
              <label className="text-[11px] sm:text-[12px] text-[#504E49] mb-1 sm:mb-1.5 block" style={{ fontWeight: 500 }}>Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full bg-white border rounded-md px-3 py-2 text-[13px] text-[#1A1916] placeholder-[#B8B5AE] outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1] transition-all"
                style={{ borderColor: errors.confirm ? "#F43F5E" : "#D0D0E0" }}
              />
              {errors.confirm && <p className="text-[10px] text-[#F43F5E] mt-1">{errors.confirm}</p>}
            </div>

            <button onClick={handleReset} disabled={loading}
              className="w-full py-2 sm:py-2.5 rounded-md bg-[#6366F1] text-white text-[13px] hover:bg-[#818CF8] disabled:opacity-70 transition-all flex items-center justify-center gap-2"
              style={{ fontWeight: 600 }}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Set new password
            </button>
          </>
        )}
      </div>
    </div>
  );
}