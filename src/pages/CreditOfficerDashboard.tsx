import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText, FileCheck, Shield, BookOpen, Clock, ChevronRight,
  Building2, Brain, IndianRupee, Activity, AlertCircle,
} from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { useApplicationStore } from "@/store/useApplicationStore";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRealtimeApplications, DbApp } from "@/hooks/useRealtimeApplications";
import { supabase } from "@/integrations/supabase/client";
import { AIProcessingIndicator } from "@/components/ui/processing-status";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip,
  PieChart, Pie, Cell,
} from "recharts";

const weeklyTrend = [
  { day: "Mon", apps: 3 }, { day: "Tue", apps: 5 }, { day: "Wed", apps: 4 },
  { day: "Thu", apps: 7 }, { day: "Fri", apps: 6 }, { day: "Sat", apps: 2 }, { day: "Sun", apps: 1 },
];

interface AuditActivity {
  icon: typeof FileCheck;
  text: string;
  time: string;
  color: string;
}

function EmptyState({ onNavigate }: { onNavigate: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-12 text-center">
      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">No applications found</h3>
      <p className="text-sm text-muted-foreground mb-6">Create a new loan application to begin the credit analysis workflow.</p>
      <Button onClick={onNavigate} className="gap-2">
        <FileText className="h-4 w-4" /> Create New Application
      </Button>
    </motion.div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getActivityIcon(eventType: string) {
  if (eventType.includes("Document")) return { icon: FileCheck, color: "text-risk-low" };
  if (eventType.includes("Risk") || eventType.includes("High")) return { icon: Shield, color: "text-risk-high" };
  if (eventType.includes("CAM")) return { icon: BookOpen, color: "text-primary" };
  if (eventType.includes("Decision") || eventType.includes("Manager")) return { icon: Brain, color: "text-chart-4" };
  return { icon: FileText, color: "text-muted-foreground" };
}

export default function CreditOfficerDashboard() {
  const navigate = useNavigate();
  const { setSelectedApplication } = useApplicationStore();
  const { applications, loading, hasLiveData, kpis, riskBreakdown } = useRealtimeApplications();
  const [activityFeed, setActivityFeed] = useState<AuditActivity[]>([]);

  // Fetch recent audit logs for activity feed
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const { data } = await supabase
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);
        if (data && data.length > 0) {
          setActivityFeed(data.map(d => {
            const { icon, color } = getActivityIcon(d.event_type);
            return { icon, text: d.event_description, time: getTimeAgo(d.created_at), color };
          }));
        }
      } catch { /* empty */ }
    };
    fetchActivity();
  }, []);

  const handleSelectApp = (app: DbApp) => {
    setSelectedApplication({
      id: app.id,
      company: app.company_name,
      cin: app.cin || "",
      sector: app.sector,
      loanAmount: Number(app.loan_amount),
      riskScore: app.risk_score ?? 50,
      riskCategory: (app.risk_category as "Low" | "Medium" | "High") || "Medium",
      status: app.status,
      defaultProbability: Number(app.default_probability ?? 0.25),
      recommendation: app.recommendation || "Under Review",
    });
    navigate("/document-verification");
  };

  const isEmpty = !loading && applications.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Credit analysis workspace — {kpis.total} active applications</p>
        </div>
        <div className="flex items-center gap-2">
          {hasLiveData && (
            <Badge variant="outline" className="gap-1.5 text-xs border-risk-low/30 text-risk-low animate-pulse">
              <Activity className="h-3 w-3" /> Real-time
            </Badge>
          )}
          <Button size="sm" className="gap-2" onClick={() => navigate("/applications")}>
            <FileText className="h-4 w-4" /> View All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate("/applications")}>
          <KpiCard title="Total Applications" value={kpis.total} icon={FileText} trend={{ value: 12, positive: true }} index={0} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate("/applications")}>
          <KpiCard title="Pending Review" value={kpis.pendingReview} icon={Clock} variant="risk-medium" trend={{ value: 5, positive: false }} index={1} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate("/applications")}>
          <KpiCard title="Approved" value={kpis.approved} icon={FileCheck} variant="risk-low" index={2} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate("/risk-engine")}>
          <KpiCard title="High Risk Queue" value={kpis.highRisk} icon={Shield} variant="risk-high" trend={{ value: 8, positive: false }} index={3} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer">
          <KpiCard title="Total Exposure" value={kpis.totalExposure > 0 ? `₹${kpis.totalExposure.toLocaleString()} Cr` : "₹0"} icon={IndianRupee} variant="risk-low" index={4} />
        </motion.div>
      </div>

      {isEmpty ? (
        <EmptyState onNavigate={() => navigate("/applications")} />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                    <RechartsTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))", fontSize: 12 }} />
                    <Area type="monotone" dataKey="apps" stroke="hsl(var(--primary))" fill="url(#colorApps)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Risk Distribution</h3>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={riskBreakdown} innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                      {riskBreakdown.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {riskBreakdown.map(r => (
                  <div key={r.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.fill }} />
                    <span className="text-[10px] text-muted-foreground">{r.name} ({r.value})</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: "New Application", icon: FileCheck, path: "/applications", desc: "Create credit application" },
                  { label: "Verify Documents", icon: FileCheck, path: "/document-verification", desc: "Review pending docs" },
                  { label: "Run Risk Analysis", icon: Shield, path: "/risk-engine", desc: "ML-powered scoring" },
                  { label: "Generate CAM", icon: BookOpen, path: "/cam-generator", desc: "Credit appraisal memo" },
                  { label: "Decision Center", icon: Brain, path: "/decision-center", desc: "Committee review" },
                ].map((action) => (
                  <motion.button key={action.path} whileHover={{ x: 4 }} onClick={() => navigate(action.path)}
                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group"
                  >
                    <div className="p-2 rounded-lg bg-primary/10"><action.icon className="h-4 w-4 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{action.label}</p>
                      <p className="text-[10px] text-muted-foreground">{action.desc}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
                <span className="text-[10px] text-muted-foreground">From audit logs</span>
              </div>
              <div className="space-y-3">
                {activityFeed.length > 0 ? activityFeed.map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border/20"
                  >
                    <div className={`p-1.5 rounded-lg bg-muted/50 ${item.color}`}><item.icon className="h-3.5 w-3.5" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground">{item.text}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.time}</p>
                    </div>
                  </motion.div>
                )) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No recent activity. Create an application to get started.</p>
                )}
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Pipeline Overview</h3>
              <span className="text-[10px] text-muted-foreground">Application stages</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { stage: "Draft", count: applications.filter(a => a.status === "Application Created").length, color: "bg-muted-foreground" },
                { stage: "Data Ingestion", count: applications.filter(a => a.status === "Documents Uploaded").length, color: "bg-primary" },
                { stage: "AI Research", count: applications.filter(a => a.status === "Verification Completed").length, color: "bg-chart-4" },
                { stage: "Risk Scoring", count: applications.filter(a => a.status === "Risk Analysis Completed").length, color: "bg-risk-medium" },
                { stage: "Committee Review", count: applications.filter(a => ["Under Review", "Manager Review", "Pending"].includes(a.status)).length, color: "bg-risk-medium" },
                { stage: "Approved", count: kpis.approved, color: "bg-risk-low" },
                { stage: "Rejected", count: kpis.rejected, color: "bg-risk-high" },
              ].map((item, i) => (
                <motion.div key={item.stage} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 0.04 }}
                  className="p-3 rounded-xl bg-muted/20 border border-border/20 text-center"
                >
                  <div className={`w-2 h-2 rounded-full ${item.color} mx-auto mb-2`} />
                  <p className="text-lg font-bold text-foreground">{item.count}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{item.stage}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

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
                  </tr>
                </thead>
                <tbody>
                  {applications.slice(0, 6).map((app) => (
                    <tr key={app.id} className="border-b border-border/30 hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => handleSelectApp(app)}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{app.company_name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{app.cin || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">{app.sector}</td>
                      <td className="p-3"><RiskBadge score={app.risk_score ?? 50} label={`${app.risk_score ?? 50}`} size="md" /></td>
                      <td className="p-3"><StatusBadge status={app.status} /></td>
                      <td className="p-3 text-foreground font-medium">₹{Number(app.loan_amount).toLocaleString()} Cr</td>
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
