import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  score?: number;
  label?: string;
  size?: "sm" | "md";
}

export function RiskBadge({ score, label, size = "sm" }: RiskBadgeProps) {
  const level = score !== undefined
    ? score <= 40 ? "low" : score <= 65 ? "medium" : "high"
    : label === "Positive" ? "low" : label === "Neutral" ? "medium" : "high";

  const styles = {
    low: "risk-badge-low",
    medium: "risk-badge-medium",
    high: "risk-badge-high",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
  };

  return (
    <span className={cn("rounded-full font-semibold inline-flex items-center", styles[level], sizeStyles[size])}>
      {label || (score !== undefined ? `${score}` : "")}
    </span>
  );
}
