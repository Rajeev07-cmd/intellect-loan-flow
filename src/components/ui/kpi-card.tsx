import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  variant?: "default" | "risk-low" | "risk-medium" | "risk-high";
  index?: number;
}

export function KpiCard({ title, value, subtitle, icon: Icon, trend, variant = "default", index = 0 }: KpiCardProps) {
  const variantStyles = {
    default: "border-border/50",
    "risk-low": "border-risk-low/20",
    "risk-medium": "border-risk-medium/20",
    "risk-high": "border-risk-high/20",
  };

  const iconStyles = {
    default: "bg-primary/10 text-primary",
    "risk-low": "bg-risk-low/10 text-risk-low",
    "risk-medium": "bg-risk-medium/10 text-risk-medium",
    "risk-high": "bg-risk-high/10 text-risk-high",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn("glass-card p-5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300", variantStyles[variant])}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={cn("text-xs font-medium", trend.positive ? "text-risk-low" : "text-risk-high")}>
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}% vs last month
            </p>
          )}
        </div>
        <div className={cn("p-2.5 rounded-lg", iconStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
