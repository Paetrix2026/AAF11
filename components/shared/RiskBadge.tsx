"use client";

import { Badge } from "@/components/ui/badge";

interface RiskBadgeProps {
  level: "critical" | "high" | "moderate" | "low" | "safe";
  pulse?: boolean;
  size?: "sm" | "md";
}

export function RiskBadge({ level, size = "md" }: RiskBadgeProps) {
  let variant: "default" | "destructive" | "secondary" | "outline" = "default";
  
  switch (level) {
    case "critical":
    case "high":
      variant = "destructive";
      break;
    case "moderate":
      variant = "secondary";
      break;
    case "low":
    case "safe":
      variant = "outline";
      break;
  }
  
  return (
    <Badge variant={variant} className={size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"}>
      {level.toUpperCase()}
    </Badge>
  );
}
