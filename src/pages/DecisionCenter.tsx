import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, IndianRupee, Factory, Shield, Brain, ChevronRight,
  CheckCircle2, Clock, AlertTriangle, XCircle, Send,
  ThumbsUp, ThumbsDown, RotateCcw, FileCheck, User, MessageSquare, Loader2,
  Gavel, Eye, Activity, TrendingDown, Scale, Zap, ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { RiskBadge } from "@/components/ui/risk-badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useApplicationStore } from "@/store/useApplicationStore";
import { ActiveApplicationBanner, NoApplicationSelected } from "@/components/ActiveApplicationBanner";
import { CreditOfficerDecisionPanel } from "@/components/decisions/CreditOfficerDecisionPanel";
import { supabase } from "@/integrations/supabase/client";
import { getDecisionState, submitManagerDecision, type ManagerDecision, type DecisionState } from "@/services/decisionEngine";
import { useAuth } from "@/contexts/AuthContext";

const decisionReasons = [
  "Strong collateral coverage",
  "Sector risk manageable — recovery trend",
  "Promoter track record strong",
  "Litigation risk within acceptable limits",
  "Financial inconsistencies need monitoring",
  "DSCR improvement expected",
  "Working capital cycle needs restructuring",
  "Litigation risk too high",
  "Revenue decline detected",
  "High debt-equity ratio",
];

// ─── Root ────────────────────────────────────────────────────────
export default function DecisionCenter() {
  const { profile } = useAuth();
  const userRole = profile?.role || "credit_officer";

  if (userRole === "manager" || userRole === "admin") {
    return <ManagerDecisionCenter />;
  }
  return <CreditOfficerDecisionCenter />;
}

// ─── Credit Officer Decision Center ──────────────────────────────
function CreditOfficerDecisionCenter() {
  const { selectedApplication, setSelectedApplication } = useApplicationStore();
  const [decisionState, setDecisionState] = useState<DecisionState>({ credit_officer_decision: null, manager_decision: null, final_status: null });
  const [viewMode, setViewMode] = useState<"table" | "detail">(selectedApplication ? "detail" : "table");
  const [coApps, setCoApps] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedApplication) setViewMode("detail");
  }, [selectedApplication]);

  // Fetch all applications with CAM status for CO table
  useEffect(() => {
    const fetchApps = async () => {
      const { data: apps } = await supabase
        .from("applications")
        .select("id, company_name, sector, loan_amount, risk_score, status, credit_officer_decision, recommendation")
        .order("updated_at", { ascending: false });
      if (!apps) { setCoApps([]); return; }
      // Check CAM status for each
      const { data: cams } = await supabase.from("cam_reports").select("application_id");
      const camAppIds = new Set((cams || []).map(c => c.application_id));
      setCoApps(apps.map(a => ({ ...a, has_cam: camAppIds.has(a.id) })));
    };
    fetchApps();
    const channel = supabase
      .channel("co_decision_apps")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, () => fetchApps())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!selectedApplication) return;
    const isUUID = /^[0-9a-f]{8}-/i.test(selectedApplication.id);
    if (!isUUID) return;
    getDecisionState(selectedApplication.id).then(setDecisionState);
  }, [selectedApplication]);

  if (viewMode === "table" && !selectedApplication) {
    return <CreditOfficerAppTable applications={coApps} onSelectApp={(app) => {
      const mapped = {
        id: app.id, company: app.company_name, cin: "", sector: app.sector,
        loanAmount: Number(app.loan_amount), riskScore: app.risk_score ?? 50,
        riskCategory: (app.risk_score ?? 50) <= 40 ? "Low" as const : (app.risk_score ?? 50) <= 65 ? "Medium" as const : "High" as const,
        status: app.status, defaultProbability: 0, recommendation: app.recommendation || "Under Review",
        financials: { revenue: "—", outstandingDebt: "—", dscr: 0, debtEquity: 0, relatedPartyTransactions: "—", gstMismatch: false, gstMismatchAmount: "—", interestCoverage: 0, currentRatio: 0 },
        fiveCsScores: [], documents: [], validations: [], integrityScore: 0,
        researchFindings: [], explainableAI: [], pipeline: [], comments: [],
      };
      setSelectedApplication(mapped);
      setViewMode("detail");
    }} />;
  }

  if (!selectedApplication) return <NoApplicationSelected />;
  const app = selectedApplication;

  return (
    <div className="space-y-6">
      <ActiveApplicationBanner />
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Credit Officer — Decision Center</h1>
            <p className="text-sm text-muted-foreground mt-1">{app.company} — Submit your recommendation</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => { setViewMode("table"); }}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Queue
          </Button>
        </div>
      </motion.div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <motion.div className="xl:col-span-4 space-y-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <ApplicationSummaryCard app={app} />
          <DecisionTimeline decisionState={decisionState} />
        </motion.div>
        <motion.div className="xl:col-span-4 space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <CAMSummaryCard app={app} />
        </motion.div>
        <motion.div className="xl:col-span-4 space-y-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <CreditOfficerDecisionPanel />
        </motion.div>
      </div>
    </div>
  );
}

// ─── Credit Officer Application Table ────────────────────────────
function CreditOfficerAppTable({ applications, onSelectApp }: { applications: any[]; onSelectApp: (app: any) => void }) {
  const navigate = useNavigate();
  const coDecisionLabel = (d: string | null) => d === "approve" ? "Approve" : d === "conditional" ? "Conditional" : d === "reject" ? "Reject" : "Pending";
  const coDecisionColor = (d: string | null) =>
    d === "approve" ? "border-risk-low/30 text-risk-low bg-risk-low/10" :
    d === "conditional" ? "border-risk-medium/30 text-risk-medium bg-risk-medium/10" :
    d === "reject" ? "border-risk-high/30 text-risk-high bg-risk-high/10" :
    "border-border text-muted-foreground";

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              Credit Officer — Decision Center
            </h1>
            <p className="text-sm text-muted-foreground mt-1 ml-[52px]">Review applications, generate CAM, and submit recommendations</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs border-primary/30 text-primary bg-primary/10">
              <Activity className="h-3 w-3" /> {applications.length} Applications
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* KPI Strip */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: applications.length, icon: FileCheck, color: "text-primary" },
          { label: "CAM Generated", value: applications.filter(a => a.has_cam).length, icon: FileCheck, color: "text-risk-low" },
          { label: "Decision Pending", value: applications.filter(a => !a.credit_officer_decision).length, icon: Clock, color: "text-risk-medium" },
          { label: "Sent to Manager", value: applications.filter(a => a.status === "Manager Review").length, icon: Send, color: "text-chart-4" },
        ].map((kpi, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg bg-muted/30 flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                <p className="text-xl font-bold text-foreground">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {applications.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-12 text-center">
          <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No applications yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create a new application to start the credit appraisal workflow.</p>
          <Button onClick={() => navigate("/applications")} className="gap-2">
            <FileCheck className="h-4 w-4" /> Create Application
          </Button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Application Pipeline</h3>
            <p className="text-[10px] text-muted-foreground">Click Review to open decision workspace</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Company</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Sector</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Loan Amount</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Risk Score</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">CAM Status</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Recommendation</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Status</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <p className="font-semibold text-foreground text-sm">{app.company_name}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{app.sector}</TableCell>
                  <TableCell className="text-foreground font-medium text-sm">₹{Number(app.loan_amount).toLocaleString()} Cr</TableCell>
                  <TableCell><RiskBadge score={app.risk_score ?? 50} label={`${app.risk_score ?? 50}`} size="md" /></TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${app.has_cam ? "border-risk-low/30 text-risk-low bg-risk-low/10" : "border-border text-muted-foreground"}`}>
                      {app.has_cam ? "✓ Generated" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${coDecisionColor(app.credit_officer_decision)}`}>
                      {coDecisionLabel(app.credit_officer_decision)}
                    </Badge>
                  </TableCell>
                  <TableCell><StatusBadge status={app.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" className="gap-1.5 text-xs h-8" onClick={() => onSelectApp(app)}>
                      <Eye className="h-3.5 w-3.5" /> Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}
    </div>
  );
}

// ─── Manager Decision Center ─────────────────────────────────────
function ManagerDecisionCenter() {
  const { selectedApplication } = useApplicationStore();
  const [viewMode, setViewMode] = useState<"queue" | "review">("queue");
  const [managerReviewApps, setManagerReviewApps] = useState<any[]>([]);

  useEffect(() => {
    if (selectedApplication) setViewMode("review");
  }, [selectedApplication]);

  useEffect(() => {
    const fetchApps = async () => {
      const { data } = await supabase
        .from("applications")
        .select("id, company_name, sector, loan_amount, risk_score, status, credit_officer_decision")
        .eq("status", "Manager Review")
        .order("updated_at", { ascending: false });
      setManagerReviewApps(data || []);
    };
    fetchApps();
    const channel = supabase
      .channel("manager_review_queue")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, () => fetchApps())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (viewMode === "queue" && !selectedApplication) {
    return <ManagerReviewQueue applications={managerReviewApps} onSwitchToReview={() => setViewMode("review")} />;
  }
  return <ManagerReviewPanel onBackToQueue={() => setViewMode("queue")} />;
}

// ─── Risk Gauge SVG ──────────────────────────────────────────────
function RiskGauge({ score, size = 140 }: { score: number; size?: number }) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const startAngle = -135;
  const endAngle = 135;
  const totalAngle = endAngle - startAngle;
  const needleAngle = startAngle + (clampedScore / 100) * totalAngle;
  const r = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2 + 8;

  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const arcPath = (start: number, end: number) => {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const needleEnd = polarToCartesian(needleAngle);
  const color = clampedScore <= 40 ? "hsl(var(--risk-low))" : clampedScore <= 65 ? "hsl(var(--risk-medium))" : "hsl(var(--risk-high))";
  const label = clampedScore <= 40 ? "Low Risk" : clampedScore <= 65 ? "Medium Risk" : "High Risk";

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.75}`}>
        {/* Background arc */}
        <path d={arcPath(startAngle, -45)} fill="none" stroke="hsl(var(--risk-low))" strokeWidth="8" strokeLinecap="round" opacity="0.25" />
        <path d={arcPath(-45, 45)} fill="none" stroke="hsl(var(--risk-medium))" strokeWidth="8" strokeLinecap="round" opacity="0.25" />
        <path d={arcPath(45, endAngle)} fill="none" stroke="hsl(var(--risk-high))" strokeWidth="8" strokeLinecap="round" opacity="0.25" />
        {/* Active arc */}
        <path d={arcPath(startAngle, needleAngle)} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleEnd.x} y2={needleEnd.y} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="4" fill={color} />
        {/* Score text */}
        <text x={cx} y={cy - 16} textAnchor="middle" fontSize="22" fontWeight="800" fill={color}>{clampedScore}</text>
        {/* Labels */}
        <text x={cx - r + 6} y={cy + 20} textAnchor="start" fontSize="8" fill="hsl(var(--muted-foreground))">Low</text>
        <text x={cx} y={cy + 20} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">Med</text>
        <text x={cx + r - 6} y={cy + 20} textAnchor="end" fontSize="8" fill="hsl(var(--muted-foreground))">High</text>
      </svg>
      <Badge variant="outline" className={`text-[10px] mt-1 ${
        clampedScore <= 40 ? "border-risk-low/30 text-risk-low bg-risk-low/10" :
        clampedScore <= 65 ? "border-risk-medium/30 text-risk-medium bg-risk-medium/10" :
        "border-risk-high/30 text-risk-high bg-risk-high/10"
      }`}>{label}</Badge>
    </div>
  );
}

// ─── Manager Review Queue (enhanced with risk highlights) ────────
function ManagerReviewQueue({
  applications,
  onSwitchToReview,
}: {
  applications: { id: string; company_name: string; sector: string; loan_amount: number; risk_score: number | null; status: string; credit_officer_decision: string | null }[];
  onSwitchToReview: () => void;
}) {
  const { setSelectedApplication } = useApplicationStore();

  const handleReview = async (app: typeof applications[0]) => {
    const mapped = {
      id: app.id, company: app.company_name, cin: "", sector: app.sector,
      loanAmount: Number(app.loan_amount),
      riskScore: app.risk_score ?? 50,
      riskCategory: (app.risk_score ?? 50) <= 40 ? "Low" as const : (app.risk_score ?? 50) <= 65 ? "Medium" as const : "High" as const,
      status: app.status, defaultProbability: 0, recommendation: "Under Review",
      financials: { revenue: "—", outstandingDebt: "—", dscr: 0, debtEquity: 0, relatedPartyTransactions: "—", gstMismatch: false, gstMismatchAmount: "—", interestCoverage: 0, currentRatio: 0 },
      fiveCsScores: [], documents: [], validations: [], integrityScore: 0,
      researchFindings: [], explainableAI: [], pipeline: [], comments: [],
    };
    const { data: fullApp } = await supabase.from("applications").select("*").eq("id", app.id).maybeSingle();
    if (fullApp) {
      mapped.cin = fullApp.cin || "";
      mapped.recommendation = fullApp.recommendation || "Under Review";
      mapped.riskScore = fullApp.risk_score ?? 50;
      mapped.riskCategory = (fullApp.risk_score ?? 50) <= 40 ? "Low" : (fullApp.risk_score ?? 50) <= 65 ? "Medium" : "High";
      mapped.defaultProbability = fullApp.default_probability ? Number(fullApp.default_probability) : 0;
    }
    setSelectedApplication(mapped);
    onSwitchToReview();
  };

  const coDecisionLabel = (d: string | null) => d === "approve" ? "Approve" : d === "conditional" ? "Conditional" : d === "reject" ? "Reject" : "—";
  const coDecisionColor = (d: string | null) =>
    d === "approve" ? "border-risk-low/30 text-risk-low bg-risk-low/10" :
    d === "conditional" ? "border-risk-medium/30 text-risk-medium bg-risk-medium/10" :
    d === "reject" ? "border-risk-high/30 text-risk-high bg-risk-high/10" :
    "border-border text-muted-foreground";

  const riskPriorityLabel = (score: number | null) => {
    const s = score ?? 50;
    if (s > 65) return { label: "Immediate Review", icon: "🔴", color: "bg-risk-high/8 border-l-4 border-l-risk-high" };
    if (s > 40) return { label: "Pending Decision", icon: "🟡", color: "bg-risk-medium/8 border-l-4 border-l-risk-medium" };
    return { label: "Ready for Approval", icon: "🟢", color: "bg-risk-low/8 border-l-4 border-l-risk-low" };
  };

  // Sort: high risk first
  const sorted = [...applications].sort((a, b) => (b.risk_score ?? 50) - (a.risk_score ?? 50));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Gavel className="h-5 w-5 text-primary" />
              </div>
              Manager Decision Center
            </h1>
            <p className="text-sm text-muted-foreground mt-1 ml-[52px]">Corporate Credit Approval Console — Applications awaiting final decision</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs border-risk-high/30 text-risk-high bg-risk-high/10">
              {sorted.filter(a => (a.risk_score ?? 50) > 65).length} High Risk
            </Badge>
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs border-primary/30 text-primary bg-primary/10">
              <Activity className="h-3 w-3" />
              {applications.length} Pending
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* KPI Strip */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Pending", value: applications.length, icon: Clock, color: "text-primary" },
          { label: "High Risk", value: sorted.filter(a => (a.risk_score ?? 50) > 65).length, icon: AlertTriangle, color: "text-risk-high" },
          { label: "Medium Risk", value: sorted.filter(a => { const s = a.risk_score ?? 50; return s > 40 && s <= 65; }).length, icon: TrendingDown, color: "text-risk-medium" },
          { label: "Low Risk", value: sorted.filter(a => (a.risk_score ?? 50) <= 40).length, icon: CheckCircle2, color: "text-risk-low" },
        ].map((kpi, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg bg-muted/30 flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                <p className="text-xl font-bold text-foreground">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {applications.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-risk-low mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">All caught up!</h3>
          <p className="text-sm text-muted-foreground">No applications pending your review.</p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Approval Queue</h3>
            <p className="text-[10px] text-muted-foreground">Sorted by risk priority</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold w-8">Priority</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Company</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Sector</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Loan Amount</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Risk Score</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">CO Decision</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Priority Tag</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((app) => {
                const priority = riskPriorityLabel(app.risk_score);
                return (
                  <TableRow key={app.id} className={`hover:bg-muted/30 transition-colors ${priority.color}`}>
                    <TableCell className="text-lg">{priority.icon}</TableCell>
                    <TableCell>
                      <p className="font-semibold text-foreground text-sm">{app.company_name}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{app.sector}</TableCell>
                    <TableCell className="text-foreground font-medium text-sm">₹{Number(app.loan_amount).toLocaleString()} Cr</TableCell>
                    <TableCell><RiskBadge score={app.risk_score ?? 50} label={`${app.risk_score ?? 50}`} size="md" /></TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${coDecisionColor(app.credit_officer_decision)}`}>
                        {coDecisionLabel(app.credit_officer_decision)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-semibold ${
                        (app.risk_score ?? 50) > 65 ? "text-risk-high" : (app.risk_score ?? 50) > 40 ? "text-risk-medium" : "text-risk-low"
                      }`}>{priority.label}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" className="gap-1.5 text-xs h-8" onClick={() => handleReview(app)}>
                        <Eye className="h-3.5 w-3.5" /> Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </motion.div>
      )}
    </div>
  );
}

// ─── Manager Review Panel (Professional Banking UI) ──────────────
function ManagerReviewPanel({ onBackToQueue }: { onBackToQueue: () => void }) {
  const { selectedApplication, clearSelectedApplication } = useApplicationStore();
  const [decision, setDecision] = useState("");
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [newComment, setNewComment] = useState("");
  const [riskAdjustment, setRiskAdjustment] = useState([0]);
  const [approvedAmount, setApprovedAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showImpactSummary, setShowImpactSummary] = useState(false);
  const [comments, setComments] = useState<{ user: string; role: string; time: string; text: string; author?: string }[]>([]);
  const [auditTrail, setAuditTrail] = useState<{ time: string; event: string; user: string }[]>([]);
  const [decisionState, setDecisionState] = useState<DecisionState>({ credit_officer_decision: null, manager_decision: null, final_status: null });
  const { toast } = useToast();

  useEffect(() => {
    if (!selectedApplication) return;
    setApprovedAmount(String(selectedApplication.loanAmount));
    setInterestRate(selectedApplication.interestRate?.replace("%", "") || "11.5");
    setComments((selectedApplication.comments || []).map(c => ({ ...c, user: (c as any).author || (c as any).user || "Unknown" })));
    setDecision("");
    setSubmitted(false);
    setShowImpactSummary(false);
    setRiskAdjustment([0]);
    setSelectedReasons([]);

    const loadData = async () => {
      const isUUID = /^[0-9a-f]{8}-/i.test(selectedApplication.id);
      if (!isUUID) {
        setAuditTrail([
          { time: "12:10 PM", event: "Application submitted for credit appraisal", user: "Credit Analyst" },
          { time: "12:45 PM", event: `AI Risk Score: ${selectedApplication.riskScore} — ${selectedApplication.riskCategory}`, user: "System" },
        ]);
        return;
      }
      try {
        const ds = await getDecisionState(selectedApplication.id);
        setDecisionState(ds);
        if (ds.manager_decision) {
          setSubmitted(true);
          setShowImpactSummary(true);
          setDecision(ds.manager_decision === "approve" ? "approve" : ds.manager_decision === "reject" ? "reject" : "re-review");
        }
        const { data } = await supabase.from("audit_logs").select("*").eq("application_id", selectedApplication.id).order("created_at", { ascending: false }).limit(10);
        if (data && data.length > 0) {
          setAuditTrail(data.map(d => ({
            time: new Date(d.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
            event: d.event_description, user: d.user_name || "System",
          })));
        } else {
          setAuditTrail([{ time: "—", event: "Application created", user: "System" }]);
        }
      } catch {
        setAuditTrail([]);
      }
    };
    loadData();
  }, [selectedApplication]);

  if (!selectedApplication) return <NoApplicationSelected />;

  const app = selectedApplication;
  const aiRiskScore = app.riskScore;
  const adjustedScore = Math.max(0, Math.min(100, aiRiskScore + riskAdjustment[0]));

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) => prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]);
  };

  const policyAlerts = [
    ...(app.financials.dscr < 1.5 ? [{ severity: "info", message: `DSCR ${app.financials.dscr}x is below recommended 1.5x threshold` }] : []),
    ...(app.financials.debtEquity > 1.5 ? [{ severity: "warning", message: `High debt-equity ratio: ${app.financials.debtEquity}x` }] : []),
    ...(app.financials.gstMismatch ? [{ severity: "error", message: `GST mismatch detected: ${app.financials.gstMismatchAmount}` }] : []),
    ...(app.riskScore > 65 ? [{ severity: "error", message: `High risk score: ${app.riskScore} — requires committee review` }] : []),
  ];

  const handleAttemptSubmit = () => {
    if (!decision) {
      toast({ title: "Select a Decision", description: "Please choose Approve, Reject, or Send for Review.", variant: "destructive" });
      return;
    }
    if (selectedReasons.length === 0) {
      toast({ title: "Reasons Required", description: "Please select at least one decision reason.", variant: "destructive" });
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmDecision = async () => {
    setShowConfirmDialog(false);
    setSubmitting(true);

    const mgrDecisionMap: Record<string, ManagerDecision> = {
      approve: "approve", reject: "reject", conditional: "review", "re-review": "review"
    };
    const mgrDecision = mgrDecisionMap[decision] || "review";

    const isUUID = /^[0-9a-f]{8}-/i.test(app.id);
    if (isUUID) {
      try {
        await submitManagerDecision(app.id, mgrDecision, app.company);
        await supabase.from("applications").update({
          suggested_limit: `₹${approvedAmount} Cr`,
          interest_rate: `${interestRate}%`,
          recommendation: decision === "approve" ? "Approved" : decision === "reject" ? "Rejected" : "Under Review",
        }).eq("id", app.id);
        const ds = await getDecisionState(app.id);
        setDecisionState(ds);
      } catch (e) {
        console.error("Error saving decision:", e);
      }
    }

    const decisionLabels: Record<string, string> = {
      approve: "Approved", reject: "Rejected", conditional: "Under Review", "re-review": "Sent for Re-Review"
    };
    const decisionLabel = decisionLabels[decision] || decision;
    const timeStr = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    setAuditTrail(prev => [{ time: timeStr, event: `Manager decision: ${decisionLabel} — ₹${approvedAmount} Cr at ${interestRate}%`, user: "Credit Manager" }, ...prev]);

    setSubmitting(false);
    setSubmitted(true);
    setShowImpactSummary(true);
    toast({ title: "Decision Submitted", description: `Final: ${decisionState.final_status || decisionLabel}` });
  };

  const handleSendComment = () => {
    if (!newComment.trim()) return;
    setComments(prev => [...prev, { user: "Credit Manager", role: "Manager", time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }), text: newComment }]);
    setNewComment("");
    toast({ title: "Comment Posted" });
  };

  const handleBackToQueue = () => {
    clearSelectedApplication();
    onBackToQueue();
  };

  const decisionLabelMap: Record<string, string> = {
    approve: "Approve Loan", reject: "Reject Application", conditional: "Conditional Approval", "re-review": "Send for Review"
  };

  return (
    <div className="space-y-5">
      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5 text-primary" />
              Confirm Decision
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to <strong className="text-foreground">{decisionLabelMap[decision] || decision}</strong> for <strong className="text-foreground">{app.company}</strong>?
              <br /><br />
              <span className="text-xs">Loan Amount: ₹{approvedAmount} Cr · Interest Rate: {interestRate}%</span>
              <br />
              <span className="text-xs text-muted-foreground">This action will update the application status and notify the Credit Officer.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDecision} className={
              decision === "approve" ? "bg-risk-low hover:bg-risk-low/90" :
              decision === "reject" ? "bg-risk-high hover:bg-risk-high/90" : ""
            }>
              Confirm {decisionLabelMap[decision]}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Summary Header Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleBackToQueue}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-xl font-bold text-foreground">{app.company}</h1>
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/10">
                      {app.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Factory className="h-3 w-3" /> {app.sector}</span>
                    <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" /> ₹{app.loanAmount} Cr</span>
                    <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Risk: {aiRiskScore}</span>
                    <span className="flex items-center gap-1"><Scale className="h-3 w-3" /> {getRiskLabel(aiRiskScore)}</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className={`gap-1.5 px-3 py-1.5 text-xs ${
                submitted
                  ? decision === "approve" ? "border-risk-low/30 text-risk-low bg-risk-low/10" : decision === "reject" ? "border-risk-high/30 text-risk-high bg-risk-high/10" : "border-risk-medium/30 text-risk-medium bg-risk-medium/10"
                  : "border-risk-medium/30 text-risk-medium bg-risk-medium/10 animate-pulse"
              }`}>
                {submitted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                {submitted ? "Decision Finalized" : "🟡 Pending Manager Decision"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Policy Alerts */}
      {policyAlerts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {policyAlerts.map((alert, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                alert.severity === "error" ? "bg-risk-high/10 text-risk-high border border-risk-high/20" :
                alert.severity === "warning" ? "bg-risk-medium/10 text-risk-medium border border-risk-medium/20" :
                "bg-primary/10 text-primary border border-primary/20"
              }`}>
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {alert.message}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Impact Summary (shown after decision) */}
      <AnimatePresence>
        {showImpactSummary && submitted && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
            <Card className={`border-2 ${
              decision === "approve" ? "border-risk-low/40 bg-risk-low/5" :
              decision === "reject" ? "border-risk-high/40 bg-risk-high/5" :
              "border-risk-medium/40 bg-risk-medium/5"
            }`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                      decision === "approve" ? "bg-risk-low/20" : decision === "reject" ? "bg-risk-high/20" : "bg-risk-medium/20"
                    }`}>
                      {decision === "approve" ? <CheckCircle2 className="h-6 w-6 text-risk-low" /> :
                       decision === "reject" ? <XCircle className="h-6 w-6 text-risk-high" /> :
                       <RotateCcw className="h-6 w-6 text-risk-medium" />}
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Decision Impact</p>
                      <p className={`text-lg font-bold ${
                        decision === "approve" ? "text-risk-low" : decision === "reject" ? "text-risk-high" : "text-risk-medium"
                      }`}>
                        {decisionState.final_status || (decision === "approve" ? "Loan Approved" : decision === "reject" ? "Application Rejected" : "Under Review")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-center">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Approved Amount</p>
                      <p className="text-sm font-bold text-foreground">₹{approvedAmount} Cr</p>
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Interest Rate</p>
                      <p className="text-sm font-bold text-foreground">{interestRate}%</p>
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Risk Premium</p>
                      <p className="text-sm font-bold text-foreground">{(Number(interestRate) - 8.5).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Three-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* LEFT — Company Overview + Financials */}
        <motion.div className="xl:col-span-3 space-y-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <ApplicationSummaryCard app={app} />

          {/* Financial Ratios */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-primary" /> Key Financial Ratios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Debt-to-Equity", value: app.financials?.debtEquity ? `${app.financials.debtEquity}x` : "—", warn: (app.financials?.debtEquity || 0) > 1.5 },
                { label: "Interest Coverage", value: app.financials?.interestCoverage ? `${app.financials.interestCoverage}x` : "—", warn: (app.financials?.interestCoverage || 0) < 2 },
                { label: "DSCR", value: app.financials?.dscr ? `${app.financials.dscr}x` : "—", warn: (app.financials?.dscr || 0) < 1.5 },
                { label: "Current Ratio", value: app.financials?.currentRatio ? `${app.financials.currentRatio}x` : "—", warn: (app.financials?.currentRatio || 0) < 1.2 },
              ].map((r, i) => (
                <div key={i} className={`flex items-center justify-between p-2.5 rounded-lg border ${r.warn ? "bg-risk-high/5 border-risk-high/20" : "bg-muted/20 border-border/50"}`}>
                  <span className="text-xs text-muted-foreground">{r.label}</span>
                  <div className="flex items-center gap-1.5">
                    {r.warn && <AlertTriangle className="h-3 w-3 text-risk-high" />}
                    <span className={`text-xs font-bold ${r.warn ? "text-risk-high" : "text-foreground"}`}>{r.value}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* CO Recommendation */}
          <Card className={`border-2 ${
            decisionState.credit_officer_decision === "approve" ? "border-risk-low/30 bg-risk-low/5" :
            decisionState.credit_officer_decision === "reject" ? "border-risk-high/30 bg-risk-high/5" :
            decisionState.credit_officer_decision === "conditional" ? "border-risk-medium/30 bg-risk-medium/5" :
            "border-border/50"
          }`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> CO Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {decisionState.credit_officer_decision ? (
                <div className="text-center py-3">
                  <Badge className={`text-sm px-4 py-1.5 ${
                    decisionState.credit_officer_decision === "approve" ? "bg-risk-low/15 text-risk-low border-risk-low/30" :
                    decisionState.credit_officer_decision === "reject" ? "bg-risk-high/15 text-risk-high border-risk-high/30" :
                    "bg-risk-medium/15 text-risk-medium border-risk-medium/30"
                  }`} variant="outline">
                    {decisionState.credit_officer_decision === "approve" ? "✓ Approve" :
                     decisionState.credit_officer_decision === "reject" ? "✗ Reject" : "⚠ Conditional"}
                  </Badge>
                </div>
              ) : (
                <div className="text-center py-3">
                  <Clock className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Awaiting CO decision</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* CENTER — AI Risk Intelligence */}
        <motion.div className="xl:col-span-5 space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          {/* Risk Gauge + Score */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" /> AI Risk Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <RiskGauge score={aiRiskScore} />
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-[10px] text-muted-foreground">Default Probability</p>
                      <p className="text-sm font-bold text-foreground">{(app.defaultProbability * 100).toFixed(1)}%</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-[10px] text-muted-foreground">CIBIL Score</p>
                      <p className="text-sm font-bold text-foreground">{app.cibilScore || "—"}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-risk-medium/10 border border-risk-medium/20">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-risk-medium" />
                      <span className="text-[10px] font-semibold text-risk-medium uppercase tracking-wider">AI Recommendation</span>
                    </div>
                    <p className="text-sm font-bold text-foreground mt-1">{app.recommendation}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Explainable AI + Early Warnings */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Risk Factors & Early Warnings</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" defaultValue={["risks", "warnings"]}>
                <AccordionItem value="risks">
                  <AccordionTrigger className="text-xs font-semibold py-2">Top Risk Drivers</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {(app.explainableAI || []).map((item: any, i: number) => (
                        <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border ${
                          item.severity === "high" ? "bg-risk-high/5 border-risk-high/20" :
                          item.severity === "medium" ? "bg-risk-medium/5 border-risk-medium/20" :
                          "bg-risk-low/5 border-risk-low/20"
                        }`}>
                          <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                            item.severity === "high" ? "bg-risk-high" : item.severity === "medium" ? "bg-risk-medium" : "bg-risk-low"
                          }`} />
                          <p className="text-xs text-muted-foreground">{item.text}</p>
                        </div>
                      ))}
                      {(!app.explainableAI || app.explainableAI.length === 0) && (
                        <p className="text-xs text-muted-foreground text-center py-3">No risk factors available</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="warnings">
                  <AccordionTrigger className="text-xs font-semibold py-2">Early Warning Signals</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {app.financials?.gstMismatch && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-risk-high/5 border border-risk-high/20">
                          <AlertTriangle className="h-3.5 w-3.5 text-risk-high shrink-0" />
                          <p className="text-xs text-risk-high">⚠ GST mismatch detected: {app.financials.gstMismatchAmount}</p>
                        </div>
                      )}
                      {(app.researchFindings || []).filter((r: any) => r.sentiment === "negative").map((r: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-risk-medium/5 border border-risk-medium/20">
                          <AlertTriangle className="h-3.5 w-3.5 text-risk-medium shrink-0" />
                          <p className="text-xs text-risk-medium">⚠ {r.title}</p>
                        </div>
                      ))}
                      {!app.financials?.gstMismatch && !(app.researchFindings || []).some((r: any) => r.sentiment === "negative") && (
                        <p className="text-xs text-risk-low text-center py-3">✓ No early warning signals detected</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* CAM Summary */}
          <CAMSummaryCard app={app} />

          {/* Decision Timeline + Audit Trail */}
          <DecisionTimeline decisionState={decisionState} />

          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Audit Trail</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-0">
                  {auditTrail.map((entry, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                        {i < auditTrail.length - 1 && <div className="w-0.5 flex-1 bg-border" />}
                      </div>
                      <div className="pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground">{entry.time}</span>
                          <span className="text-[10px] text-primary font-medium">{entry.user}</span>
                        </div>
                        <p className="text-xs text-foreground">{entry.event}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* RIGHT — Decision Panel */}
        <motion.div className="xl:col-span-4 space-y-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          {/* Decision Buttons */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Gavel className="h-4 w-4 text-primary" /> Manager Decision
              </CardTitle>
              <CardDescription className="text-xs">Make the final credit decision</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {[
                  { value: "approve", label: "Approve Loan", icon: ThumbsUp, color: "border-risk-low/40 bg-risk-low/10 text-risk-low hover:bg-risk-low/20", desc: "Approve the credit facility" },
                  { value: "reject", label: "Reject Application", icon: ThumbsDown, color: "border-risk-high/40 bg-risk-high/10 text-risk-high hover:bg-risk-high/20", desc: "Decline the application" },
                  { value: "re-review", label: "Send for Review", icon: RotateCcw, color: "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20", desc: "Return to Credit Officer" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setDecision(opt.value); setSubmitted(false); setShowImpactSummary(false); }}
                    disabled={submitted}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-lg border text-left transition-all disabled:opacity-50 ${
                      decision === opt.value ? `${opt.color} ring-2 ring-offset-1 ring-offset-background ring-current` : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <opt.icon className="h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">{opt.label}</p>
                      <p className="text-[10px] opacity-70">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <Separator />

              <div>
                <label className="text-xs font-medium text-foreground mb-2 block">Decision Reasons</label>
                <div className="flex flex-wrap gap-1.5">
                  {decisionReasons.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => toggleReason(reason)}
                      disabled={submitted}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all border disabled:opacity-50 ${
                        selectedReasons.includes(reason)
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50"
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Override + Loan Terms */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Loan Terms & Risk Adjustment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">AI Score</p>
                  <p className={`text-lg font-bold ${getRiskColor(aiRiskScore)}`}>{aiRiskScore}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Adjusted</p>
                  <p className={`text-lg font-bold ${getRiskColor(adjustedScore)}`}>{adjustedScore}</p>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Adjustment ({riskAdjustment[0] > 0 ? "+" : ""}{riskAdjustment[0]})</label>
                <Slider value={riskAdjustment} onValueChange={setRiskAdjustment} min={-30} max={30} step={1} className="py-2" disabled={submitted} />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Amount (₹ Cr)</label>
                  <Input value={approvedAmount} onChange={(e) => setApprovedAmount(e.target.value)} className="text-xs h-8" disabled={submitted} />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Rate (%)</label>
                  <Input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="text-xs h-8" disabled={submitted} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manager Comments */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" /> Manager Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add your decision rationale and notes..."
                className="text-xs min-h-[80px] resize-none"
                disabled={submitted}
              />
              <ScrollArea className="max-h-[150px]">
                <div className="space-y-2">
                  {comments.map((c, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                            {c.author?.split(" ").map((n: string) => n[0]).join("") || c.user?.split(" ").map((n: string) => n[0]).join("") || "?"}
                          </div>
                          <span className="text-[10px] font-semibold text-foreground">{(c as any).author || c.user}</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground">{c.time}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{c.text}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add comment..." className="text-xs h-8 flex-1" onKeyDown={(e) => e.key === "Enter" && handleSendComment()} />
                <Button size="sm" className="h-8 px-3 text-xs" onClick={handleSendComment}>Post</Button>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <AnimatePresence>
            {decision && !submitted && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <Button
                  className={`w-full gap-2 h-12 text-sm font-semibold ${
                    decision === "approve" ? "bg-risk-low hover:bg-risk-low/90 text-white" :
                    decision === "reject" ? "bg-risk-high hover:bg-risk-high/90 text-white" : ""
                  }`}
                  onClick={handleAttemptSubmit}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {submitting ? "Processing..." : decisionLabelMap[decision] || "Submit Decision"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Shared Components ───────────────────────────────────────────

function getRiskColor(score: number) {
  return score <= 40 ? "text-risk-low" : score <= 65 ? "text-risk-medium" : "text-risk-high";
}
function getRiskLabel(score: number) {
  return score <= 40 ? "Low Risk" : score <= 65 ? "Medium Risk" : "High Risk";
}

function ApplicationSummaryCard({ app }: { app: any }) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" /> Company Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-lg font-bold text-foreground">{app.company}</p>
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">CIN: {app.cin}</p>
        </div>
        <Separator />
        <div className="space-y-3">
          <InfoRow icon={<IndianRupee className="h-3.5 w-3.5" />} label="Loan Requested" value={`₹${app.loanAmount} Cr`} />
          <InfoRow icon={<Factory className="h-3.5 w-3.5" />} label="Sector" value={app.sector} />
          <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Promoter" value={app.promoterGroup || "—"} />
          <InfoRow icon={<FileCheck className="h-3.5 w-3.5" />} label="Incorporated" value={app.incorporationYear || "—"} />
          <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="CIBIL Score" value={String(app.cibilScore || "—")} />
        </div>
      </CardContent>
    </Card>
  );
}

function CAMSummaryCard({ app }: { app: any }) {
  const [camData, setCamData] = useState<any>(null);
  const [loadingCam, setLoadingCam] = useState(false);

  useEffect(() => {
    const isUUID = /^[0-9a-f]{8}-/i.test(app.id);
    if (!isUUID) return;
    setLoadingCam(true);
    supabase
      .from("cam_reports")
      .select("*")
      .eq("application_id", app.id)
      .order("created_at", { ascending: false })
      .maybeSingle()
      .then(({ data }) => { setCamData(data); setLoadingCam(false); })
      .then(undefined, () => setLoadingCam(false));
  }, [app.id]);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">CAM Summary</CardTitle>
        <CardDescription className="text-xs">
          {camData ? "From saved Credit Appraisal Memo" : "Credit Appraisal Memo highlights"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadingCam ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : camData ? (
          <Accordion type="multiple" defaultValue={["overview", "financials", "risk", "recommendation"]}>
            {camData.company_overview && (
              <AccordionItem value="overview">
                <AccordionTrigger className="text-xs font-semibold py-2">Company Overview</AccordionTrigger>
                <AccordionContent>
                  <p className="text-xs text-muted-foreground whitespace-pre-line">{camData.company_overview}</p>
                </AccordionContent>
              </AccordionItem>
            )}
            {camData.financial_analysis && (
              <AccordionItem value="financials">
                <AccordionTrigger className="text-xs font-semibold py-2">Financial Analysis</AccordionTrigger>
                <AccordionContent>
                  <p className="text-xs text-muted-foreground whitespace-pre-line">{camData.financial_analysis}</p>
                </AccordionContent>
              </AccordionItem>
            )}
            {camData.risk_analysis && (
              <AccordionItem value="risk">
                <AccordionTrigger className="text-xs font-semibold py-2">Risk Analysis</AccordionTrigger>
                <AccordionContent>
                  <p className="text-xs text-muted-foreground whitespace-pre-line">{camData.risk_analysis}</p>
                </AccordionContent>
              </AccordionItem>
            )}
            <AccordionItem value="recommendation">
              <AccordionTrigger className="text-xs font-semibold py-2">Loan Recommendation</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["Recommendation", camData.recommendation || "—"],
                    ["Suggested Limit", camData.suggested_loan_limit || "—"],
                    ["Interest Rate", camData.interest_rate || "—"],
                  ].map(([label, value], i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                      <p className="text-sm font-bold text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <Accordion type="multiple" defaultValue={["financials", "fivec"]}>
            <AccordionItem value="financials">
              <AccordionTrigger className="text-xs font-semibold py-2">Financial Highlights</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["Revenue", app.financials?.revenue || "—"],
                    ["Outstanding Debt", app.financials?.outstandingDebt || "—"],
                    ["DSCR", app.financials?.dscr ? `${app.financials.dscr}x` : "—"],
                    ["Debt/Equity", app.financials?.debtEquity ? `${app.financials.debtEquity}x` : "—"],
                    ["Interest Coverage", app.financials?.interestCoverage ? `${app.financials.interestCoverage}x` : "—"],
                    ["Current Ratio", app.financials?.currentRatio ? `${app.financials.currentRatio}x` : "—"],
                  ].map(([label, value], i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                      <p className="text-sm font-bold text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="fivec">
              <AccordionTrigger className="text-xs font-semibold py-2">Five Cs Evaluation</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {(app.fiveCsScores || []).map((c: any) => (
                    <div key={c.name} className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                      <span className="text-xs font-medium text-foreground">{c.name}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${c.score >= 70 ? "bg-risk-low" : c.score >= 50 ? "bg-risk-medium" : "bg-risk-high"}`} style={{ width: `${c.score}%` }} />
                        </div>
                        <span className="text-xs font-bold text-foreground w-6 text-right">{c.score}</span>
                      </div>
                    </div>
                  ))}
                  {(!app.fiveCsScores || app.fiveCsScores.length === 0) && (
                    <p className="text-xs text-muted-foreground text-center py-3">No evaluation data</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
            <div className="mt-3 p-3 rounded-lg bg-risk-medium/10 border border-risk-medium/20 text-center">
              <p className="text-[10px] text-risk-medium font-medium">⚠ No CAM report saved yet. Generate one from the CAM Generator page.</p>
            </div>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

function DecisionTimeline({ decisionState }: { decisionState: DecisionState }) {
  const coLabel = decisionState.credit_officer_decision === "approve" ? "Approve" :
    decisionState.credit_officer_decision === "conditional" ? "Conditional Approval" :
    decisionState.credit_officer_decision === "reject" ? "Reject" : null;

  const mgrLabel = decisionState.manager_decision === "approve" ? "Approve" :
    decisionState.manager_decision === "reject" ? "Reject" :
    decisionState.manager_decision === "review" ? "Send for Review" : null;

  const finalStatusColor = decisionState.final_status === "Approved" ? "text-risk-low bg-risk-low/10 border-risk-low/30" :
    decisionState.final_status === "Approved with Conditions" ? "text-risk-medium bg-risk-medium/10 border-risk-medium/30" :
    decisionState.final_status === "Rejected" ? "text-risk-high bg-risk-high/10 border-risk-high/30" :
    decisionState.final_status === "Under Review" ? "text-primary bg-primary/10 border-primary/30" :
    "text-muted-foreground bg-muted/10 border-border";

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Gavel className="h-4 w-4 text-primary" /> Decision Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${coLabel ? "bg-primary/10" : "bg-muted/30"}`}>
            <Shield className={`h-4 w-4 ${coLabel ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground">Credit Officer</p>
            <p className={`text-xs font-semibold ${coLabel ? "text-foreground" : "text-muted-foreground"}`}>{coLabel || "Pending"}</p>
          </div>
          {coLabel && <CheckCircle2 className="h-4 w-4 text-risk-low" />}
        </div>
        <div className="ml-4 w-0.5 h-4 bg-border" />
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${mgrLabel ? "bg-primary/10" : "bg-muted/30"}`}>
            <Gavel className={`h-4 w-4 ${mgrLabel ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground">Manager</p>
            <p className={`text-xs font-semibold ${mgrLabel ? "text-foreground" : "text-muted-foreground"}`}>{mgrLabel || "Pending"}</p>
          </div>
          {mgrLabel && <CheckCircle2 className="h-4 w-4 text-risk-low" />}
        </div>
        {decisionState.final_status && (
          <>
            <div className="ml-4 w-0.5 h-4 bg-border" />
            <div className={`p-3 rounded-lg border text-center ${finalStatusColor}`}>
              <p className="text-[10px] uppercase tracking-widest mb-1">Final Status</p>
              <p className="text-sm font-bold">{decisionState.final_status}</p>
            </div>
          </>
        )}
        {!coLabel && !mgrLabel && <p className="text-[10px] text-muted-foreground text-center py-2">No decisions recorded yet</p>}
      </CardContent>
    </Card>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-xs">{label}</span></div>
      <span className="text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}
