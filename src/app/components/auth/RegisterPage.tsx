import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, Mail, Check, Users } from "lucide-react";
import { useNavigate } from "react-router";
import { useTheme } from "../../stores/themeStore";

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

export function RegisterPage() {
  const navigate = useNavigate();
  const { colors, isDark } = useTheme();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resendCooldown, setResendCooldown] = useState(0);
  const [workspaceName, setWorkspaceName] = useState("");
  const [inviteEmails, setInviteEmails] = useState("");

  const strength = password.length > 0 ? getPasswordStrength(password) : -1;

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleStep1Submit = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Please enter a valid email";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 8) newErrors.password = "Must be at least 8 characters";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(2); setResendCooldown(60); }, 1000);
  };

  const bgPage = isDark ? colors.bgBase : "#F7F6F3";
  const cardBg = isDark ? colors.bgPanel : "#FFFFFF";
  const cardBorder = isDark ? colors.border : "#D0D0E0";
  const textH = colors.textPrimary;
  const textSub = colors.textSecondary;
  const textMuted = colors.textMuted;
  const inputBg = isDark ? colors.inputBg : "#FFFFFF";
  const inputBorder = isDark ? colors.border : "#D0D0E0";

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] transition-all`}
            style={{
              fontWeight: 600,
              backgroundColor: s < step ? colors.emerald : s === step ? colors.crystal : isDark ? colors.bgRaised : "#D9D6D0",
              color: s <= step ? "#FFFFFF" : textMuted,
            }}>
            {s < step ? <Check className="w-3.5 h-3.5" /> : s}
          </div>
          {s < 3 && <div className="w-8 h-px" style={{ backgroundColor: s < step ? colors.emerald : isDark ? colors.border : "#D9D6D0" }} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-3 sm:px-4 py-6" style={{ background: bgPage }}>
      {/* Wordmark */}
      <div className="mb-4 sm:mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.crystal }}>
            <span className="text-white text-[9px] sm:text-[10px] font-mono" style={{ fontWeight: 700 }}>CC</span>
          </div>
        </div>
        <span className="text-[16px] sm:text-[18px]" style={{ fontWeight: 600, color: textH }}>
          Convo<span style={{ color: colors.crystal }}>Crystal</span>
        </span>
      </div>

      <div className="w-full max-w-[420px] rounded-xl sm:rounded-2xl px-5 py-6 sm:p-8 shadow-sm" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
        {stepIndicator}

        {/* Step 1: Account Info */}
        {step === 1 && (
          <>
            <h1 className="text-[20px] sm:text-[22px] mb-1" style={{ fontWeight: 700, color: textH }}>Create your account</h1>
            <p className="text-[12px] sm:text-[13px] mb-5 sm:mb-6" style={{ color: textMuted }}>Start analyzing meetings in minutes</p>

            <div className="mb-3 sm:mb-4">
              <label className="text-[11px] sm:text-[12px] mb-1 sm:mb-1.5 block" style={{ fontWeight: 500, color: textSub }}>Full Name</label>
              <input
                value={name} onChange={(e) => setName(e.target.value)}
                onBlur={() => { if (!name.trim()) setErrors((e) => ({ ...e, name: "Name is required" })); else setErrors((e) => { const { name: _, ...r } = e; return r; }); }}
                placeholder="Jane Doe"
                className="w-full border rounded-md px-3 py-2 text-[13px] outline-none transition-all"
                style={{ backgroundColor: inputBg, borderColor: errors.name ? colors.rose : inputBorder, color: textH }}
              />
              {errors.name && <p className="text-[10px] mt-1" style={{ color: colors.rose }}>{errors.name}</p>}
            </div>

            <div className="mb-3 sm:mb-4">
              <label className="text-[11px] sm:text-[12px] mb-1 sm:mb-1.5 block" style={{ fontWeight: 500, color: textSub }}>Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                onBlur={() => { if (email && !/\S+@\S+\.\S+/.test(email)) setErrors((e) => ({ ...e, email: "Invalid email" })); else setErrors((e) => { const { email: _, ...r } = e; return r; }); }}
                placeholder="you@company.com"
                className="w-full border rounded-md px-3 py-2 text-[13px] outline-none transition-all"
                style={{ backgroundColor: inputBg, borderColor: errors.email ? colors.rose : inputBorder, color: textH }}
              />
              {errors.email && <p className="text-[10px] mt-1" style={{ color: colors.rose }}>{errors.email}</p>}
            </div>

            <div className="mb-3 sm:mb-4">
              <label className="text-[11px] sm:text-[12px] mb-1 sm:mb-1.5 block" style={{ fontWeight: 500, color: textSub }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => { if (password && password.length < 8) setErrors((e) => ({ ...e, password: "Must be at least 8 characters" })); else setErrors((e) => { const { password: _, ...r } = e; return r; }); }}
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

            <button onClick={handleStep1Submit} disabled={loading}
              className="w-full py-2 sm:py-2.5 rounded-md text-white text-[13px] disabled:opacity-70 transition-all flex items-center justify-center gap-2 hover:opacity-90"
              style={{ fontWeight: 600, backgroundColor: colors.crystal }}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Continue
            </button>

            <p className="text-center text-[11px] sm:text-[12px] mt-4 sm:mt-5" style={{ color: textMuted }}>
              Already have an account?{" "}
              <button onClick={() => navigate("/login")} className="hover:opacity-80" style={{ fontWeight: 500, color: colors.crystal }}>Sign in</button>
            </p>
          </>
        )}

        {/* Step 2: Email Verification */}
        {step === 2 && (
          <div className="text-center py-2 sm:py-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${colors.crystal}15` }}>
              <Mail className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: colors.crystal }} />
            </div>
            <h2 className="text-[18px] sm:text-[20px] mb-2" style={{ fontWeight: 700, color: textH }}>Check your email</h2>
            <p className="text-[12px] sm:text-[13px] mb-1" style={{ color: textMuted }}>We sent a verification link to</p>
            <p className="text-[12px] sm:text-[13px] mb-5 sm:mb-6" style={{ fontWeight: 500, color: textH }}>{email}</p>

            <button onClick={() => setStep(3)} className="w-full py-2 sm:py-2.5 rounded-md text-white text-[13px] transition-all mb-3 hover:opacity-90" style={{ fontWeight: 600, backgroundColor: colors.crystal }}>
              I've verified my email
            </button>

            <button
              onClick={() => setResendCooldown(60)}
              disabled={resendCooldown > 0}
              className="text-[12px] transition-colors"
              style={{ color: resendCooldown > 0 ? textMuted : colors.crystal }}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend verification email"}
            </button>
          </div>
        )}

        {/* Step 3: Workspace Setup */}
        {step === 3 && (
          <>
            <h2 className="text-[18px] sm:text-[20px] mb-1" style={{ fontWeight: 700, color: textH }}>Set up your workspace</h2>
            <p className="text-[12px] sm:text-[13px] mb-5 sm:mb-6" style={{ color: textMuted }}>You can always change this later</p>

            <div className="mb-3 sm:mb-4">
              <label className="text-[11px] sm:text-[12px] mb-1 sm:mb-1.5 block" style={{ fontWeight: 500, color: textSub }}>Workspace Name</label>
              <input
                value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Acme Corp"
                className="w-full border rounded-md px-3 py-2 text-[13px] outline-none transition-all"
                style={{ backgroundColor: inputBg, borderColor: inputBorder, color: textH }}
              />
            </div>

            <div className="mb-5 sm:mb-6">
              <label className="text-[12px] mb-1.5 flex items-center gap-1.5" style={{ fontWeight: 500, color: textSub }}>
                <Users className="w-3.5 h-3.5" /> Invite teammates <span style={{ color: textMuted }}>(optional)</span>
              </label>
              <textarea
                value={inviteEmails} onChange={(e) => setInviteEmails(e.target.value)}
                placeholder="teammate@company.com, another@company.com"
                rows={2}
                className="w-full border rounded-md px-3 py-2 text-[13px] outline-none resize-none transition-all"
                style={{ backgroundColor: inputBg, borderColor: inputBorder, color: textH }}
              />
            </div>

            <button onClick={() => navigate("/")}
              className="w-full py-2 sm:py-2.5 rounded-md text-white text-[13px] transition-all hover:opacity-90" style={{ fontWeight: 600, backgroundColor: colors.crystal }}>
              Launch ConvoCrystal
            </button>

            <button onClick={() => navigate("/")} className="w-full text-center mt-3 text-[11px] sm:text-[12px] transition-colors" style={{ color: textMuted }}>
              Skip for now
            </button>
          </>
        )}
      </div>
    </div>
  );
}