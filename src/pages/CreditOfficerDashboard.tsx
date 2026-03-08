import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Upload, FileText, FileCheck, Shield, BookOpen, Clock, ChevronRight,
  Building2, TrendingUp, AlertTriangle, Brain, IndianRupee, Activity,
  ArrowUpRight, ArrowDownRight, Loader2, BarChart3, Zap,
} from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { companyApplications } from "@/lib/company-data";
import { useApplicationStore } from "@/store/useApplicationStore";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip,
  PieChart, Pie, Cell,
} from "recharts";

const weeklyTrend = [
  { day: "Mon", apps: 3 }, { day: "Tue", apps: 5 }, { day: "Wed", apps: 4 },
  { day: "Thu", apps: 7 }, { day: "Fri", apps: 6 }, { day: "Sat", apps: 2 }, { day: "Sun", apps: 1 },
];

const riskBreakdown = [
  { name: "Low", value: 0, fill: "hsl(var(--risk-low))" },
  { name: "Medium", value: 0, fill: "hsl(var(--risk-medium))" },
  { name: "High", value: 0, fill: "hsl(var(--risk-high))" },
];

const activityFeed = [
  { icon: FileCheck, text: "Tata Steel documents verified", time: "12 min ago", color: "text-risk-low" },
  { icon: Shield, text: "Adani Ports flagged as High Risk (72)", time: "45 min ago", color: "text-risk-high" },
  { icon: BookOpen, text: "CAM generated for Infosys Ltd", time: "1 hr ago", color: "text-primary" },
  { icon: Brain, text: "ML model retrained with latest data", time: "2 hrs ago", color: "text-chart-4" },
  { icon: AlertTriangle, text: "Bajaj Finance DSCR dropped below 1.5x", time: "3 hrs ago", color: "text-risk-medium" },
];

export default function CreditOfficerDashboard() {
  const navigate = useNavigate();
  const { setSelectedApplication } = useApplicationStore();

  const apps = companyApplications;
  const pending = apps.filter(a => a.status === "Under Review" || a.status === "Pending");
  const docsPending = apps.reduce((sum, a) => sum + a.documents.filter(d => d.status === "pending").length, 0);
  const riskQueue = apps.filter(a => a.riskScore > 50).length;
  const totalLoanValue = apps.reduce((sum, a) => sum + a.loanAmount, 0);

  // Compute risk breakdown
  const riskData = [
    { name: "Low", value: apps.filter(a => a.riskScore <= 40).length, fill: "hsl(var(--risk-low))" },
    { name: "Medium", value: apps.filter(a => a.riskScore > 40 && a.riskScore <= 65).length, fill: "hsl(var(--risk-medium))" },
    { name: "High", value: apps.filter(a => a.riskScore > 65).length, fill: "hsl(var(--risk-high))" },
  ];

  const handleSelectApp = (app: typeof companyApplications[0]) => {
    setSelectedApplication(app);
    navigate("/document-verification");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Credit analysis workspace — {apps.length} active applications</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 text-xs border-primary/30 text-primary">
            <Activity className="h-3 w-3" /> Live
          </Badge>
          <Button size="sm" className="gap-2" onClick={() => navigate("/applications")}>
            <FileText className="h-4 w-4" /> View All
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate("/applications")}>
          <KpiCard title="Total Applications" value={apps.length} icon={FileText} trend={{ value: 12, positive: true }} index={0} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate("/applications")}>
          <KpiCard title="Pending Review" value={pending.length} icon={Clock} variant="risk-medium" trend={{ value: 5, positive: false }} index={1} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate("/applications")}>
          <KpiCard title="Docs Pending" value={docsPending} icon={FileCheck} index={2} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate("/risk-engine")}>
          <KpiCard title="High Risk Queue" value={riskQueue} icon={Shield} variant="risk-high" trend={{ value: 8, positive: false }} index={3} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer">
          <KpiCard title="Total Exposure" value={`₹${totalLoanValue.toLocaleString()} Cr`} icon={IndianRupee} variant="risk-low" index={4} />
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Weekly Application Trend</h3>
            <Badge variant="outline" className="text-[10px]">Last 7 days</Badge>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <RechartsTooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    color: "hsl(var(--popover-foreground))",
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="apps" stroke="hsl(var(--primary))" fill="url(#colorApps)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Risk Breakdown Donut */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Risk Distribution</h3>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskData} innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                  {riskData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    color: "hsl(var(--popover-foreground))",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {riskData.map(r => (
              <div key={r.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.fill }} />
                <span className="text-[10px] text-muted-foreground">{r.name} ({r.value})</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: "New Application", icon: Upload, path: "/applications", desc: "Create credit application" },
              { label: "Verify Documents", icon: FileCheck, path: "/document-verification", desc: "Review pending docs" },
              { label: "Run Risk Analysis", icon: Shield, path: "/risk-engine", desc: "ML-powered scoring" },
              { label: "Generate CAM", icon: BookOpen, path: "/cam-generator", desc: "Credit appraisal memo" },
              { label: "Decision Center", icon: Brain, path: "/decision-center", desc: "Committee review" },
            ].map((action, i) => (
              <motion.button
                key={action.path}
                whileHover={{ x: 4 }}
                onClick={() => navigate(action.path)}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <action.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{action.label}</p>
                  <p className="text-[10px] text-muted-foreground">{action.desc}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
            <span className="text-[10px] text-muted-foreground">Auto-refreshing</span>
          </div>
          <div className="space-y-3">
            {activityFeed.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border/20"
              >
                <div className={`p-1.5 rounded-lg bg-muted/50 ${item.color}`}>
                  <item.icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground">{item.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Application Pipeline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Pipeline Overview</h3>
          <span className="text-[10px] text-muted-foreground">Application stages</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { stage: "Draft", count: 2, color: "bg-muted-foreground" },
            { stage: "Data Ingestion", count: 3, color: "bg-primary" },
            { stage: "AI Research", count: 2, color: "bg-chart-4" },
            { stage: "Risk Scoring", count: 2, color: "bg-risk-medium" },
            { stage: "Committee Review", count: 3, color: "bg-risk-medium" },
            { stage: "Approved", count: 3, color: "bg-risk-low" },
            { stage: "Rejected", count: 1, color: "bg-risk-high" },
          ].map((item, i) => (
            <motion.div
              key={item.stage}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.04 }}
              className="p-3 rounded-xl bg-muted/20 border border-border/20 text-center"
            >
              <div className={`w-2 h-2 rounded-full ${item.color} mx-auto mb-2`} />
              <p className="text-lg font-bold text-foreground">{item.count}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{item.stage}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Applications Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Recent Applications</h3>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/applications")}>
            View All <ChevronRight className="h-3.5 w-3.5" />
          </Button>
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
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Stage</th>
              </tr>
            </thead>
            <tbody>
              {apps.slice(0, 6).map((app, i) => {
                const activeStage = app.pipeline.find(s => s.status === "active");
                return (
                  <tr key={app.id} className="border-b border-border/30 hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => handleSelectApp(app)}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{app.company}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{app.cin}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{app.sector}</td>
                    <td className="p-3"><RiskBadge score={app.riskScore} label={`${app.riskScore}`} size="md" /></td>
                    <td className="p-3"><StatusBadge status={app.status} /></td>
                    <td className="p-3 text-foreground font-medium">₹{app.loanAmount} Cr</td>
                    <td className="p-3">
                      <span className="text-[10px] text-muted-foreground">{activeStage?.stage || "Completed"}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
