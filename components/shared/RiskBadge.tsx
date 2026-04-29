"use client";

interface RiskBadgeProps {
  level: "critical" | "high" | "moderate" | "low" | "safe";
  size?: "sm" | "md";
}

const RISK_CONFIG = {
  critical: "bg-red-50 text-red-600 border-red-100",
  high: "bg-orange-50 text-orange-600 border-orange-100",
  moderate: "bg-yellow-50 text-yellow-600 border-yellow-100",
  low: "bg-blue-50 text-blue-600 border-blue-100",
  safe: "bg-emerald-50 text-emerald-600 border-emerald-100",
};

export function RiskBadge({ level, size = "md" }: RiskBadgeProps) {
  const config = RISK_CONFIG[level] || RISK_CONFIG.safe;
  
  return (
    <div className={`inline-flex items-center font-bold uppercase tracking-wider border rounded-xl transition-all ${config} ${
      size === "sm" ? "px-2 py-0.5 text-[8px]" : "px-3 py-1.5 text-[10px]"
    } shadow-sm shadow-black/5`}>
      <div className={`w-1.5 h-1.5 rounded-full mr-2 ${config.split(' ')[1].replace('text-', 'bg-')}`} />
      {level}
    </div>
  );
}
