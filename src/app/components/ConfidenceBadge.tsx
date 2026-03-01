import { useTheme } from "./ThemeContext";

interface ConfidenceBadgeProps {
  score: number;
  /** Show as inline pill only (no sub-scores) */
  compact?: boolean;
}

/**
 * Reusable confidence score badge.
 * Green (85%+), Yellow (65-84%), Red (<65%).
 */
export function ConfidenceBadge({ score, compact = true }: ConfidenceBadgeProps) {
  const color =
    score >= 85
      ? "#10B981"
      : score >= 65
      ? "#F59E0B"
      : "#F43F5E";

  if (compact) {
    return (
      <span
        className="px-1.5 py-0.5 rounded text-[10px] font-mono"
        style={{ backgroundColor: `${color}10`, color }}
      >
        {score}%
      </span>
    );
  }

  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-mono"
      style={{ backgroundColor: `${color}15`, color }}
    >
      {score}%
    </span>
  );
}

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
 * Used in ChatPanel, OverviewDashboard, and Settings AI section.
 */
export function ConfidencePanel({ confidence, dataOnboarding }: ConfidencePanelProps) {
  const { colors, isDark } = useTheme();
  const color =
    confidence.overall >= 85
      ? "#10B981"
      : confidence.overall >= 65
      ? "#F59E0B"
      : "#F43F5E";

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
        className="px-2 py-0.5 rounded-full text-[10px] font-mono"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {confidence.overall}%
      </span>
      {subScores.map((s) => (
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
                backgroundColor:
                  s.value >= 85 ? "#10B981" : s.value >= 65 ? "#F59E0B" : "#F43F5E",
              }}
            />
          </div>
          <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>
            {s.value}%
          </span>
        </div>
      ))}
    </div>
  );
}
