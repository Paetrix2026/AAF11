interface UrgencyIndicatorProps {
  urgency: "immediate" | "24_hours" | "48_hours" | "monitor";
}

const URGENCY_CONFIG = {
  immediate: { label: "Immediate Action Required", color: "var(--risk-critical)", icon: "🚨" },
  "24_hours": { label: "Act Within 24 Hours", color: "var(--risk-high)", icon: "⚠️" },
  "48_hours": { label: "Act Within 48 Hours", color: "var(--risk-moderate)", icon: "🔔" },
  monitor: { label: "Monitor — No Immediate Action", color: "var(--risk-safe)", icon: "✓" },
};

export function UrgencyIndicator({ urgency }: UrgencyIndicatorProps) {
  const config = URGENCY_CONFIG[urgency];
  if (!config) return null;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.375rem 0.75rem",
        background: `${config.color}10`,
        border: `1px solid ${config.color}30`,
        borderLeft: `3px solid ${config.color}`,
        color: config.color,
        fontFamily: "var(--font-body)",
        fontSize: "0.875rem",
      }}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
}
