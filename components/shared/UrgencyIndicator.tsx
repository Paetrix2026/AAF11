import { AlertCircle, Clock, Bell, CheckCircle2 } from "lucide-react";

interface UrgencyIndicatorProps {
  urgency: "immediate" | "24_hours" | "48_hours" | "monitor";
}

const URGENCY_CONFIG = {
  immediate: { label: "Immediate", color: "text-red-600", bg: "bg-red-50", border: "border-red-100", icon: AlertCircle },
  "24_hours": { label: "24 Hours", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100", icon: Clock },
  "48_hours": { label: "48 Hours", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", icon: Bell },
  monitor: { label: "Monitor", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", icon: CheckCircle2 },
};

export function UrgencyIndicator({ urgency }: UrgencyIndicatorProps) {
  const config = URGENCY_CONFIG[urgency];
  if (!config) return null;
  const Icon = config.icon;
  
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 ${config.bg} border ${config.border} ${config.color} font-bold text-[10px] uppercase tracking-wider rounded-xl shadow-sm shadow-black/5`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </div>
  );
}
