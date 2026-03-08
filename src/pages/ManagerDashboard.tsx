import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, AlertTriangle, TrendingUp, IndianRupee, XCircle, Eye, Gavel, Shield } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { recentApplications, monthlyTrend } from "@/lib/mock-data";
import { useRealtimeApplications } from "@/hooks/useRealtimeApplications";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";

const heatmapData = [
  { sector: "Steel & Metals", low: 2, medium: 4, high: 3, exposure: 950 },
  { sector: "IT Services", low: 5, medium: 2, high: 0, exposure: 680 },
  { sector: "Petrochemicals", low: 3, medium: 3, high: 2, exposure: 1200 },
  { sector: "Infrastructure", low: 1, medium: 2, high: 4, exposure: 780 },
  { sector: "NBFC", low: 4, medium: 3, high: 1, exposure: 560 },
  { sector: "Housing Finance", low: 6, medium: 1, high: 0, exposure: 900 },
  { sector: "Mining", low: 1, medium: 1, high: 3, exposure: 420 },
  { sector: "Pharma", low: 4, medium: 2, high: 1, exposure: 350 },
];

const riskLevels = ["low", "medium", "high"] as const;

function getCellColor(level: typeof riskLevels[number], count: number) {
  const intensity = Math.min(count / 6, 1);
  if (level === "low") return `hsla(var(--risk-low) / ${0.15 + intensity * 0.7})`;
  if (level === "medium") return `hsla(var(--risk-medium) / ${0.15 + intensity * 0.7})`;
  return `hsla(var(--risk-high) / ${0.15 + intensity * 0.7})`;
}

function getCellTextColor(level: typeof riskLevels[number], count: number) {
  if (count === 0) return "hsl(var(--muted-foreground))";
  const intensity = Math.min(count / 6, 1);
  if (intensity > 0.5) return "hsl(0 0% 100%)";
  if (level === "low") return "hsl(var(--risk-low))";
  if (level === "medium") return "hsl(var(--risk-medium))";
  return "hsl(var(--risk-high))";
}

function PortfolioRiskHeatmap() {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const totalExposure = heatmapData.reduce((s, d) => s + d.exposure, 0);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="space-y-3">
        <div className="grid grid-cols-[140px_1fr_1fr_1fr_80px] gap-1.5 items-center">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sector</div>
          {riskLevels.map(level => (
            <div key={level} className="text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: `hsl(var(--risk-${level}))` }}>
              {level} Risk
            </div>
          ))}
          <div className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Exposure</div>
        </div>

        {heatmapData.map((row, ri) => (
          <motion.div key={row.sector} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: ri * 0.04 }}
            className="grid grid-cols-[140px_1fr_1fr_1fr_80px] gap-1.5 items-center"
          >
            <div className="text-xs font-medium text-foreground truncate">{row.sector}</div>
            {riskLevels.map(level => {
              const count = row[level];
              const cellKey = `${row.sector}-${level}`;
              return (
                <Tooltip key={level}>
                  <TooltipTrigger asChild>
                    <motion.div whileHover={{ scale: 1.08 }} onMouseEnter={() => setHoveredCell(cellKey)} onMouseLeave={() => setHoveredCell(null)}
                      className="relative h-10 rounded-md flex items-center justify-center cursor-pointer transition-shadow"
                      style={{ backgroundColor: getCellColor(level, count), boxShadow: hoveredCell === cellKey ? `0 0 12px ${getCellColor(level, count)}` : "none" }}
                    >
                      <span className="text-sm font-bold" style={{ color: getCellTextColor(level, count) }}>{count}</span>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-semibold">{row.sector}</p>
                    <p>{count} {level}-risk accounts</p>
                    <p className="text-muted-foreground">₹{row.exposure} Cr total exposure</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
            <div className="text-right text-xs font-medium text-muted-foreground">₹{row.exposure} Cr</div>
          </motion.div>
        ))}

        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-4">
            {riskLevels.map(level => (
              <div key={level} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getCellColor(level, 4) }} />
                <span className="text-[10px] text-muted-foreground capitalize">{level}</span>
              </div>
            ))}
            <span className="text-[10px] text-muted-foreground ml-2">Darker = Higher concentration</span>
          </div>
          <div className="text-xs font-semibold text-foreground">Total: ₹{totalExposure.toLocaleString()} Cr</div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { hasLiveData, kpis, riskBreakdown, sectorExposure: liveSectorExposure } = useRealtimeApplications();

  const mockAwaitingApproval = recentApplications.filter(a => a.status === "Under Review" || a.status === "Pending").length;
  const mockHighRisk = recentApplications.filter(a => a.riskScore > 65).length;

  const awaitingApproval = hasLiveData ? kpis.pendingReview + mockAwaitingApproval : mockAwaitingApproval;
  const highRisk = hasLiveData ? kpis.highRisk + mockHighRisk : mockHighRisk;
  const avgRiskScore = hasLiveData ? kpis.avgRiskScore : 62;
  const approvedValue = hasLiveData ? kpis.totalExposure : 2847;
  const rejected = hasLiveData ? kpis.rejected : 8;

  const riskData = hasLiveData ? riskBreakdown : [
    { name: "Low Risk", value: 42, fill: "hsl(var(--risk-low))" },
    { name: "Medium Risk", value: 35, fill: "hsl(var(--risk-medium))" },
    { name: "High Risk", value: 23, fill: "hsl(var(--risk-high))" },
  ];

  const sectorData = hasLiveData && liveSectorExposure.length > 0 ? liveSectorExposure : [
    { name: "Steel & Metals", value: 28, fill: "hsl(var(--primary))" },
    { name: "IT Services", value: 18, fill: "hsl(var(--risk-low))" },
    { name: "Petrochemicals", value: 15, fill: "hsl(var(--risk-medium))" },
    { name: "Infrastructure", value: 14, fill: "hsl(var(--chart-4))" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manager Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Portfolio monitoring and decision oversight</p>
        </div>
        {hasLiveData && (
          <Badge variant="outline" className="gap-1.5 text-xs border-risk-low/30 text-risk-low animate-pulse">
            <Activity className="h-3 w-3" /> Real-time
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate("/decision-center")}>
          <KpiCard title="Awaiting Approval" value={awaitingApproval} icon={Gavel} trend={{ value: 12, positive: true }} index={0} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate("/risk-engine")}>
          <KpiCard title="High Risk" value={highRisk} icon={AlertTriangle} variant="risk-high" trend={{ value: 8, positive: false }} index={1} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer">
          <KpiCard title="Avg Risk Score" value={avgRiskScore} icon={TrendingUp} variant="risk-medium" index={2} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate("/applications")}>
          <KpiCard title="Approved Value" value={`₹${approvedValue.toLocaleString()} Cr`} icon={IndianRupee} variant="risk-low" trend={{ value: 15, positive: true }} index={3} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer">
          <KpiCard title="Rejected" value={rejected} icon={XCircle} variant="risk-high" index={4} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Approval Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <RechartsTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))", fontSize: 12 }} />
              <Bar dataKey="approved" fill="hsl(var(--risk-low))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejected" fill="hsl(var(--risk-high))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" fill="hsl(var(--risk-medium))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={riskData} innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                {riskData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <RechartsTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Sector Exposure</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={sectorData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
            <RechartsTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))", fontSize: 12 }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {sectorData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Portfolio Risk Heatmap</h3>
          <p className="text-[10px] text-muted-foreground">Sector × Risk Level Concentration</p>
        </div>
        <PortfolioRiskHeatmap />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground">Loan Approval Queue</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Company</th>
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sector</th>
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Risk Score</th>
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Status</th>
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Loan (₹ Cr)</th>
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentApplications.map((app) => (
                <tr key={app.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <p className="font-medium text-foreground">{app.company}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{app.cin}</p>
                  </td>
                  <td className="p-3 text-muted-foreground">{app.sector}</td>
                  <td className="p-3"><RiskBadge score={app.riskScore} label={`${app.riskScore}`} size="md" /></td>
                  <td className="p-3"><StatusBadge status={app.status} /></td>
                  <td className="p-3 text-foreground font-medium">₹{app.loanAmount} Cr</td>
                  <td className="p-3">
                    <button onClick={() => navigate("/decision-center")} className="flex items-center gap-1 text-primary hover:text-primary/80 text-xs font-medium transition-colors">
                      <Eye className="h-3.5 w-3.5" /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
