import { useNavigate } from "react-router";
import { useTheme } from "./ThemeContext";
import { CrystalLogo } from "./Logo";
import { ArrowLeft, Home } from "lucide-react";

export function NotFoundPage() {
  const navigate = useNavigate();
  const { colors, isDark } = useTheme();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: colors.bgBase }}
    >
      <CrystalLogo size={48} className="mb-6 opacity-60" />

      <div
        className="text-[64px] font-mono mb-2"
        style={{ fontWeight: 700, color: colors.crystal, opacity: 0.3 }}
      >
        404
      </div>

      <h1
        className="text-[20px] sm:text-[24px] mb-2 text-center"
        style={{ fontWeight: 600, color: colors.textPrimary }}
      >
        Page not found
      </h1>

      <p
        className="text-[13px] text-center max-w-sm mb-8"
        style={{ color: colors.textMuted }}
      >
        The page you're looking for doesn't exist or may have been moved.
        Let's get you back on track.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] transition-colors"
          style={{
            color: colors.textSecondary,
            border: `1px solid ${colors.border}`,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = colors.hoverNeutral)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>

        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] text-white transition-opacity hover:opacity-90"
          style={{
            fontWeight: 500,
            backgroundColor: colors.crystal,
          }}
        >
          <Home className="w-4 h-4" />
          Dashboard
        </button>
      </div>
    </div>
  );
}
