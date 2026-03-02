import { useTheme } from "./ThemeContext";

// ─── 5-Tier Confidence Gradient (Design System §1) ──────────────

export type ConfidenceTier = "critical" | "low" | "medium" | "good" | "excellent";

interface TierConfig {
  tier: ConfidenceTier;
  color: string;
  label: string;
  bgDark: string;
  bgLight: string;
}

const TIERS: TierConfig[] = [
  { tier: "excellent", color: "#10B981", label: "Excellent", bgDark: "#10B98118", bgLight: "#ECFDF5" },
  { tier: "good",      color: "#84CC16", label: "Good",      bgDark: "#84CC1618", bgLight: "#F0FDF4" },
  { tier: "medium",    color: "#EAB308", label: "Medium",    bgDark: "#EAB30818", bgLight: "#FEFCE8" },
  { tier: "low",       color: "#F97316", label: "Low",       bgDark: "#F9731618", bgLight: "#FFF7ED" },
  { tier: "critical",  color: "#EF4444", label: "Critical",  bgDark: "#EF444418", bgLight: "#FEF2F2" },
];

/**
 * Returns the 5-tier confidence config for a given score.
 * ≥95% Excellent, ≥85% Good, ≥75% Medium, ≥65% Low, <65% Critical
 */
export function getConfidenceTier(score: number): TierConfig {
  if (score >= 95) return TIERS[0]; // excellent
  if (score >= 85) return TIERS[1]; // good
  if (score >= 75) return TIERS[2]; // medium
  if (score >= 65) return TIERS[3]; // low
  return TIERS[4]; // critical
}

/** Just the color for a score — convenience export */
export function getConfidenceColor(score: number): string {
  return getConfidenceTier(score).color;
}

// ─── Badge Component ─────────────────────────────────────────────

interface ConfidenceBadgeProps {
  score: number;
  /** Show as inline pill only (no sub-scores) */
  compact?: boolean;
  /** Show the tier label next to the percentage */
  showLabel?: boolean;
}

/**
 * Reusable confidence score badge — 5-tier gradient.
 * Excellent (95%+), Good (85-94%), Medium (75-84%), Low (65-74%), Critical (<65%).
 */
export function ConfidenceBadge({ score, compact = true, showLabel = false }: ConfidenceBadgeProps) {
  const { isDark } = useTheme();
  const tier = getConfidenceTier(score);
  const bg = isDark ? tier.bgDark : tier.bgLight;

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono"
        style={{ backgroundColor: bg, color: tier.color }}
      >
        <span
          className="w-[6px] h-[6px] rounded-full shrink-0"
          style={{ backgroundColor: tier.color }}
        />
        {score}%
        {showLabel && <span className="opacity-75">{tier.label}</span>}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono"
      style={{ backgroundColor: bg, color: tier.color }}
    >
      <span
        className="w-[6px] h-[6px] rounded-full shrink-0"
        style={{ backgroundColor: tier.color }}
      />
      {score}%
      {showLabel && <span className="opacity-75">{tier.label}</span>}
    </span>
  );
}

// ─── Confidence Panel (full sub-scores) ──────────────────────────

interface ConfidencePanelProps {
  confidence: {
    overall: number;
    faithfulness: number;
    relevance: number;
    precision: number;
  };
  dataOnboarding?: string;
}

/**
 * Full confidence panel with sub-scores (Faithfulness, Relevance, Precision).
 * Uses the 5-tier gradient for each individual score.
 */
export function ConfidencePanel({ confidence, dataOnboarding }: ConfidencePanelProps) {
  const { colors, isDark } = useTheme();
  const overallTier = getConfidenceTier(confidence.overall);
  const overallBg = isDark ? overallTier.bgDark : overallTier.bgLight;

  const subScores = [
    { label: "Faith", value: confidence.faithfulness },
    { label: "Relev", value: confidence.relevance },
    { label: "Prec", value: confidence.precision },
  ];
  const trackBg = isDark ? "#2A2D42" : "#D9D6D0";

  return (
    <div
      className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap"
      {...(dataOnboarding ? { "data-onboarding": dataOnboarding } : {})}
    >
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono"
        style={{ backgroundColor: overallBg, color: overallTier.color }}
      >
        <span
          className="w-[6px] h-[6px] rounded-full shrink-0"
          style={{ backgroundColor: overallTier.color }}
        />
        {confidence.overall}%
      </span>
      {subScores.map((s) => {
        const sTier = getConfidenceTier(s.value);
        return (
          <div key={s.label} className="flex items-center gap-1 sm:gap-1.5">
            <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>
              {s.label}
            </span>
            <div
              className="w-8 sm:w-12 h-1 rounded-full overflow-hidden"
              style={{ backgroundColor: trackBg }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${s.value}%`,
                  backgroundColor: sTier.color,
                }}
              />
            </div>
            <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>
              {s.value}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
