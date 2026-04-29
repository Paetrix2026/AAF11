"use client";

import { motion } from "framer-motion";

interface RiskBadgeProps {
  level: "critical" | "high" | "moderate" | "low" | "safe";
  pulse?: boolean;
  size?: "sm" | "md";
}

const RISK_COLORS: Record<string, string> = {
  critical: "var(--risk-critical)",
  high: "var(--risk-high)",
  moderate: "var(--risk-moderate)",
  low: "var(--risk-low)",
  safe: "var(--risk-safe)",
};

const RISK_LABELS: Record<string, string> = {
  critical: "CRITICAL",
  high: "HIGH",
  moderate: "MODERATE",
  low: "LOW",
  safe: "SAFE",
};

export function RiskBadge({ level, pulse = false, size = "md" }: RiskBadgeProps) {
  const color = RISK_COLORS[level] ?? "var(--text-muted)";
  const label = RISK_LABELS[level] ?? level.toUpperCase();
  const padding = size === "sm" ? "0.2rem 0.5rem" : "0.25rem 0.625rem";
  const fontSize = size === "sm" ? "0.625rem" : "0.6875rem";

  const badge = (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.375rem",
        padding,
        background: `${color}15`,
        border: `1px solid ${color}40`,
        color,
        fontFamily: "var(--font-display)",
        fontSize,
        letterSpacing: "0.1em",
        borderRadius: "2px",
      }}
    >
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, flexShrink: 0 }} />
      {label}
    </span>
  );

  if (pulse) {
    return (
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        style={{ display: "inline-flex" }}
      >
        {badge}
      </motion.div>
    );
  }

  return badge;
}
