import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, AlertTriangle, TrendingUp, IndianRupee, XCircle, Eye, Gavel, Shield, AlertCircle } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { monthlyTrend } from "@/lib/mock-data";
import { useRealtimeApplications } from "@/hooks/useRealtimeApplications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";

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

function PortfolioRiskHeatmap({ applications }: { applications: { sector: string; risk_score: number | null }[] }) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  // Build heatmap from live data
  const sectorMap: Record<string, { low: number; medium: number; high: number; exposure: number }> = {};
  applications.forEach(a => {
    if (!sectorMap[a.sector]) sectorMap[a.sector] = { low: 0, medium: 0, high: 0, exposure: 0 };
    const s = a.risk_score ?? 50;
    if (s <= 40) sectorMap[a.sector].low++;
    else if (s <= 65) sectorMap[a.sector].medium++;
    else sectorMap[a.sector].high++;
  });

  const heatmapData = Object.entries(sectorMap).map(([sector, data]) => ({ sector, ...data }));

  if (heatmapData.length === 0) return <p className="text-xs text-muted-foreground text-center py-4">No data available</p>;

  const totalApps = applications.length;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="space-y-3">
        <div className="grid gap-1" style={{ gridTemplateColumns: `140px repeat(3, 1fr)` }}>
          <div />
          {riskLevels.map(l => (
            <div key={l} className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-semibold py-1">
              {l}
            </div>
          ))}
          {heatmapData.map(row => (
            <>
              <div key={`label-${row.sector}`} className="text-xs text-muted-foreground flex items-center truncate pr-2">{row.sector}</div>
              {riskLevels.map(level => {
                const count = row[level];
                const key = `${row.sector}-${level}`;
                return (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>
                      <motion.div
                        onMouseEnter={() => setHoveredCell(key)}
                        onMouseLeave={() => setHoveredCell(null)}
                        whileHover={{ scale: 1.05 }}
                        className="rounded-md flex items-center justify-center p-2 cursor-default transition-all"
                        style={{ backgroundColor: getCellColor(level, count), color: getCellTextColor(level, count) }}
                      >
                        <span className="text-xs font-bold">{count}</span>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      {row.sector} — {level} risk: {count} apps
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </>
          ))}
        </div>
        <div className="text-xs font-semibold text-foreground">Total: {totalApps} applications</div>
      </div>
    </TooltipProvider>
  );
}

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { applications, loading, hasLiveData, kpis, riskBreakdown, sectorExposure } = useRealtimeApplications();

  const isEmpty = !loading && applications.length === 0;

  const riskData = riskBreakdown;
  const sectorData = sectorExposure.length > 0 ? sectorExposure : [];

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
          <KpiCard title="Awaiting Approval" value={kpis.pendingReview} icon={Gavel} trend={{ value: 12, positive: true }} index={0} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate("/risk-engine")}>
          <KpiCard title="High Risk" value={kpis.highRisk} icon={AlertTriangle} variant="risk-high" trend={{ value: 8, positive: false }} index={1} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer">
          <KpiCard title="Avg Risk Score" value={kpis.avgRiskScore} icon={TrendingUp} variant="risk-medium" index={2} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate("/applications")}>
          <KpiCard title="Total Exposure" value={kpis.totalExposure > 0 ? `₹${kpis.totalExposure.toLocaleString()} Cr` : "₹0"} icon={IndianRupee} variant="risk-low" trend={{ value: 15, positive: true }} index={3} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer">
          <KpiCard title="Rejected" value={kpis.rejected} icon={XCircle} variant="risk-high" index={4} />
        </motion.div>
      </div>

      {isEmpty ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No applications found</h3>
          <p className="text-sm text-muted-foreground mb-6">Create a new loan application to begin the credit analysis workflow.</p>
          <Button onClick={() => navigate("/applications")} className="gap-2">
            <FileText className="h-4 w-4" /> Create New Application
          </Button>
        </motion.div>
      ) : (
        <>
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

          {sectorData.length > 0 && (
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
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Portfolio Risk Heatmap</h3>
              <p className="text-[10px] text-muted-foreground">Sector × Risk Level Concentration</p>
            </div>
            <PortfolioRiskHeatmap applications={applications} />
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
                  {applications.slice(0, 8).map((app) => (
                    <tr key={app.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <p className="font-medium text-foreground">{app.company_name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{app.cin || "—"}</p>
                      </td>
                      <td className="p-3 text-muted-foreground">{app.sector}</td>
                      <td className="p-3"><RiskBadge score={app.risk_score ?? 50} label={`${app.risk_score ?? 50}`} size="md" /></td>
                      <td className="p-3"><StatusBadge status={app.status} /></td>
                      <td className="p-3 text-foreground font-medium">₹{Number(app.loan_amount).toLocaleString()} Cr</td>
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
        </>
      )}
    </div>
  );
}
