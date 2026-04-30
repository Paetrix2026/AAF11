import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  if (!date) return "just now";
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function getRiskColor(risk: string): string {
  if (!risk) return "var(--text-muted)";
  switch (risk.toLowerCase()) {
    case "critical":
      return "var(--risk-critical)";
    case "high":
      return "var(--risk-high)";
    case "moderate":
      return "var(--risk-moderate)";
    case "low":
      return "var(--risk-low)";
    case "safe":
      return "var(--risk-safe)";
    default:
      return "var(--text-muted)";
  }
}

export function getStatusColor(status: string): string {
  if (!status) return "var(--text-muted)";
  switch (status.toLowerCase()) {
    case "critical":
      return "var(--risk-critical)";
    case "active":
      return "var(--risk-moderate)";
    case "stable":
      return "var(--risk-safe)";
    default:
      return "var(--text-muted)";
  }
}

export function translateEffectiveness(score: number): string {
  if (score >= 0.85) return `${Math.round(score * 100)}% effective — no change needed`;
  if (score >= 0.7) return `${Math.round(score * 100)}% effective — monitoring recommended`;
  if (score >= 0.5) return "Your medication may be losing effectiveness";
  return "Your medication needs urgent review";
}

export function translateUrgency(urgency: string): string {
  switch (urgency) {
    case "immediate":
      return "⚠️ Please contact your doctor today";
    case "24_hours":
      return "Schedule a doctor visit within 24 hours";
    case "48_hours":
      return "Schedule a doctor visit within 48 hours";
    case "monitor":
      return "Continue monitoring — no immediate action needed";
    default:
      return urgency;
  }
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
