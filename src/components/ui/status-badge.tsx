import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, string> = {
  "Approved": "bg-risk-low/15 text-risk-low border border-risk-low/20",
  "Approved with Conditions": "bg-risk-medium/15 text-risk-medium border border-risk-medium/20",
  "Rejected": "bg-risk-high/15 text-risk-high border border-risk-high/20",
  "Under Review": "bg-primary/15 text-primary border border-primary/20",
  "Manager Review": "bg-chart-4/15 text-chart-4 border border-chart-4/20",
  "Pending": "bg-risk-medium/15 text-risk-medium border border-risk-medium/20",
  "High Risk": "bg-risk-high/15 text-risk-high border border-risk-high/20",
  "Draft": "bg-muted text-muted-foreground border border-border",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-semibold", statusConfig[status] || statusConfig["Draft"])}>
      {status}
    </span>
  );
}
