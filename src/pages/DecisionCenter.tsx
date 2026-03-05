import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, IndianRupee, Factory, Shield, Brain, ChevronDown, ChevronRight,
  CheckCircle2, Clock, AlertTriangle, XCircle, Send, AtSign, Paperclip,
  ThumbsUp, ThumbsDown, RotateCcw, FileCheck, User, MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock data
const applicationData = {
  company: "ABC Industries Pvt Ltd",
  cin: "U28920MH2015PTC123456",
  loanAmount: 25,
  sector: "Manufacturing",
  aiRiskScore: 62,
  aiRecommendation: "Conditional Approval",
  pan: "AADCA1234B",
  gstin: "27AADCA1234B1ZK",
  promoter: "Rajiv Mehta",
  yearsInBusiness: 12,
  employees: 450,
  turnover: "₹180 Cr",
};

const camSummary = {
  overview: "ABC Industries Pvt Ltd is a mid-size manufacturing company specializing in auto components with 12 years of operations. The company has a diversified client base across OEMs and Tier-1 suppliers.",
  financials: [
    { label: "Revenue (FY25)", value: "₹180 Cr", trend: "up" },
    { label: "EBITDA Margin", value: "14.2%", trend: "stable" },
    { label: "DSCR", value: "1.35x", trend: "down" },
    { label: "Debt/Equity", value: "1.1x", trend: "stable" },
    { label: "Net Worth", value: "₹85 Cr", trend: "up" },
    { label: "CIBIL Score", value: "728", trend: "stable" },
  ],
  risks: [
    "DSCR below comfortable threshold of 1.5x",
    "High concentration risk — 40% revenue from single client",
    "Working capital cycle stretched to 95 days",
    "Promoter has personal guarantee exposure of ₹15 Cr in another entity",
  ],
  litigation: [
    "2 pending cases — aggregate claim value ₹8.5 Cr",
    "Labour dispute case in NCLT — hearing scheduled March 2026",
    "No criminal proceedings against directors",
  ],
  sectorOutlook: "Auto component sector showing recovery with 8% growth forecast. However, EV transition poses medium-term disruption risk. Raw material costs stabilizing after volatile FY24.",
  aiExplanation: "The AI model flagged this application for conditional approval due to: (1) DSCR of 1.35x is marginally below threshold, (2) client concentration risk, and (3) pending litigation. However, strong promoter track record, improving margins, and adequate collateral coverage (1.4x) provide mitigating factors.",
};

const approvalStages = [
  { role: "Credit Analyst", user: "Priya Sharma", status: "completed", timestamp: "Mar 4, 2026 — 12:10 PM", decision: "Recommended for Review" },
  { role: "Senior Credit Officer", user: "Amit Desai", status: "completed", timestamp: "Mar 4, 2026 — 2:05 PM", decision: "Approved with conditions" },
  { role: "Risk Committee", user: "Dr. Meera Iyer", status: "in_progress", timestamp: "Mar 5, 2026 — 10:30 AM", decision: "Under Review" },
  { role: "Final Approval", user: "Credit Committee", status: "pending", timestamp: "—", decision: "Pending" },
];

const auditTrail = [
  { time: "12:10 PM", event: "Analyst submitted application for credit appraisal", user: "Priya Sharma" },
  { time: "12:45 PM", event: "AI generated CAM report — Risk Score: 62", user: "System" },
  { time: "1:15 PM", event: "Document verification completed — Integrity Score: 87/100", user: "System" },
  { time: "1:30 PM", event: "Risk score updated after manual review", user: "Amit Desai" },
  { time: "2:05 PM", event: "Senior Credit Officer approved with conditions", user: "Amit Desai" },
  { time: "2:30 PM", event: "Forwarded to Risk Committee for review", user: "Amit Desai" },
  { time: "10:30 AM", event: "Risk Committee review initiated", user: "Dr. Meera Iyer" },
];

const existingComments = [
  { user: "Priya Sharma", role: "Credit Analyst", time: "12:15 PM", text: "Application looks strong overall. DSCR is slightly below threshold but improving trend noted. Recommending for senior review." },
  { user: "Amit Desai", role: "Sr. Credit Officer", time: "2:00 PM", text: "@RiskHead please review the litigation case details before committee. The ₹8.5 Cr exposure needs assessment against collateral." },
  { user: "Dr. Meera Iyer", role: "Risk Head", time: "10:35 AM", text: "Reviewing litigation exposure now. The NCLT case appears procedural — will confirm with legal team." },
];

const policyAlerts = [
  { severity: "warning", message: "Loan exceeds 60% of sector exposure limit for Manufacturing" },
  { severity: "warning", message: "Promoter has cross-guarantee exposure in related entity" },
  { severity: "info", message: "DSCR 1.35x is below recommended 1.5x threshold" },
  { severity: "error", message: "Client concentration risk: 40% revenue from single source" },
];

const decisionReasons = [
  "Strong collateral coverage (1.4x)",
  "Sector risk manageable — recovery trend",
  "Promoter track record strong (12 years)",
  "Litigation risk within acceptable limits",
  "Financial inconsistencies need monitoring",
  "DSCR improvement expected in FY26",
  "Working capital cycle needs restructuring",
  "Litigation risk too high",
];

export default function DecisionCenter() {
  const [decision, setDecision] = useState("");
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [newComment, setNewComment] = useState("");
  const [riskAdjustment, setRiskAdjustment] = useState([0]);
  const [approvedAmount, setApprovedAmount] = useState("22");
  const [interestRate, setInterestRate] = useState("11.5");
  const adjustedScore = Math.max(0, Math.min(100, applicationData.aiRiskScore + riskAdjustment[0]));

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const getRiskColor = (score: number) =>
    score <= 40 ? "text-risk-low" : score <= 65 ? "text-risk-medium" : "text-risk-high";

  const getRiskBg = (score: number) =>
    score <= 40 ? "bg-risk-low" : score <= 65 ? "bg-risk-medium" : "bg-risk-high";

  const getRiskLabel = (score: number) =>
    score <= 40 ? "Low Risk" : score <= 65 ? "Medium Risk" : "High Risk";

  const stageIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="h-5 w-5 text-risk-low" />;
    if (status === "in_progress") return <Clock className="h-5 w-5 text-risk-medium animate-pulse" />;
    return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Credit Committee Decision Center</h1>
            <p className="text-sm text-muted-foreground mt-1">Review AI recommendations and make final credit decisions</p>
          </div>
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs border-risk-medium/30 text-risk-medium bg-risk-medium/10">
            <Clock className="h-3.5 w-3.5" /> Pending Committee Decision
          </Badge>
        </div>
      </motion.div>

      {/* Policy Alerts */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {policyAlerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                alert.severity === "error"
                  ? "bg-risk-high/10 text-risk-high border border-risk-high/20"
                  : alert.severity === "warning"
                  ? "bg-risk-medium/10 text-risk-medium border border-risk-medium/20"
                  : "bg-primary/10 text-primary border border-primary/20"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {alert.message}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Three Panel Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Panel - Application Summary */}
        <motion.div
          className="xl:col-span-3 space-y-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Application Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-lg font-bold text-foreground">{applicationData.company}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">CIN: {applicationData.cin}</p>
              </div>
              <Separator />
              <div className="space-y-3">
                <InfoRow icon={<IndianRupee className="h-3.5 w-3.5" />} label="Loan Requested" value={`₹${applicationData.loanAmount} Cr`} />
                <InfoRow icon={<Factory className="h-3.5 w-3.5" />} label="Sector" value={applicationData.sector} />
                <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Promoter" value={applicationData.promoter} />
                <InfoRow icon={<FileCheck className="h-3.5 w-3.5" />} label="Years in Business" value={`${applicationData.yearsInBusiness} years`} />
                <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="Turnover" value={applicationData.turnover} />
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">AI Risk Score</span>
                  <span className={`text-xl font-bold ${getRiskColor(applicationData.aiRiskScore)}`}>
                    {applicationData.aiRiskScore}
                  </span>
                </div>
                <Progress value={applicationData.aiRiskScore} className="h-2" />
                <p className={`text-[10px] font-semibold ${getRiskColor(applicationData.aiRiskScore)}`}>
                  {getRiskLabel(applicationData.aiRiskScore)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-risk-medium/10 border border-risk-medium/20">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-risk-medium" />
                  <span className="text-xs font-semibold text-risk-medium">AI Recommendation</span>
                </div>
                <p className="text-sm font-bold text-foreground mt-1">{applicationData.aiRecommendation}</p>
              </div>
            </CardContent>
          </Card>

          {/* Approval Workflow */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Approval Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {approvalStages.map((stage, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      {stageIcon(stage.status)}
                      {i < approvalStages.length - 1 && (
                        <div className={`w-0.5 h-full min-h-[40px] ${stage.status === "completed" ? "bg-risk-low/40" : "bg-border"}`} />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-xs font-semibold text-foreground">{stage.role}</p>
                      <p className="text-[10px] text-muted-foreground">{stage.user}</p>
                      <p className="text-[10px] text-muted-foreground">{stage.timestamp}</p>
                      <Badge
                        variant="outline"
                        className={`mt-1 text-[9px] ${
                          stage.status === "completed"
                            ? "border-risk-low/30 text-risk-low"
                            : stage.status === "in_progress"
                            ? "border-risk-medium/30 text-risk-medium"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {stage.decision}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Center Panel - CAM Summary */}
        <motion.div
          className="xl:col-span-5 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">CAM Summary</CardTitle>
              <CardDescription className="text-xs">Key highlights from Credit Appraisal Memo</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" defaultValue={["overview", "financials", "risks"]}>
                <AccordionItem value="overview">
                  <AccordionTrigger className="text-xs font-semibold py-3">Company Overview</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-xs text-muted-foreground leading-relaxed">{camSummary.overview}</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="financials">
                  <AccordionTrigger className="text-xs font-semibold py-3">Financial Highlights</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-2">
                      {camSummary.financials.map((f, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-[10px] text-muted-foreground">{f.label}</p>
                          <p className="text-sm font-bold text-foreground">{f.value}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="risks">
                  <AccordionTrigger className="text-xs font-semibold py-3">Key Risks</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2">
                      {camSummary.risks.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <AlertTriangle className="h-3.5 w-3.5 text-risk-medium shrink-0 mt-0.5" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="litigation">
                  <AccordionTrigger className="text-xs font-semibold py-3">Litigation Findings</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2">
                      {camSummary.litigation.map((l, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Shield className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          {l}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sector">
                  <AccordionTrigger className="text-xs font-semibold py-3">Sector Outlook</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-xs text-muted-foreground leading-relaxed">{camSummary.sectorOutlook}</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="ai-explanation">
                  <AccordionTrigger className="text-xs font-semibold py-3">AI Risk Explanation</AccordionTrigger>
                  <AccordionContent>
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold text-primary">AI Analysis</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{camSummary.aiExplanation}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Decision Explanation */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Decision Explanation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-3">
                <p className="text-xs font-semibold text-foreground">Why was this decision recommended?</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  AI recommended conditional approval due to litigation risk and DSCR concerns.
                </p>
                <Separator />
                <p className="text-xs font-semibold text-foreground">Committee rationale:</p>
                <ul className="space-y-1.5">
                  {["Collateral value exceeds loan exposure (1.4x coverage)", "Industry outlook improving — 8% growth forecast", "Promoter reputation strong with 12-year track record", "Litigation exposure manageable at ₹8.5 Cr against ₹85 Cr net worth"].map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-risk-low shrink-0 mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Audit Trail */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Decision Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {auditTrail.map((entry, i) => (
                  <div key={i} className="flex gap-3 group">
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
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Panel - Decision Controls */}
        <motion.div
          className="xl:col-span-4 space-y-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          {/* Manual Decision */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Manual Decision Controls</CardTitle>
              <CardDescription className="text-xs">Override or confirm AI recommendation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "approve", label: "Approve", icon: ThumbsUp, color: "border-risk-low/40 bg-risk-low/10 text-risk-low hover:bg-risk-low/20" },
                  { value: "conditional", label: "Conditional", icon: AlertTriangle, color: "border-risk-medium/40 bg-risk-medium/10 text-risk-medium hover:bg-risk-medium/20" },
                  { value: "reject", label: "Reject", icon: ThumbsDown, color: "border-risk-high/40 bg-risk-high/10 text-risk-high hover:bg-risk-high/20" },
                  { value: "re-review", label: "Re-Review", icon: RotateCcw, color: "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDecision(opt.value)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-all ${
                      decision === opt.value ? `${opt.color} ring-2 ring-offset-1 ring-offset-background` : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                    } ${decision === opt.value ? `ring-current` : ""}`}
                  >
                    <opt.icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-medium text-foreground mb-2 block">Decision Reasons (Required)</label>
                <div className="flex flex-wrap gap-1.5">
                  {decisionReasons.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => toggleReason(reason)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all border ${
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

              <div>
                <label className="text-xs font-medium text-foreground mb-2 block">Additional Comments</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Enter detailed decision rationale..."
                  className="text-xs min-h-[80px] resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Risk Override */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Risk Override Simulation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">AI Risk Score</p>
                  <p className={`text-lg font-bold ${getRiskColor(applicationData.aiRiskScore)}`}>{applicationData.aiRiskScore}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Adjusted Score</p>
                  <p className={`text-lg font-bold ${getRiskColor(adjustedScore)}`}>{adjustedScore}</p>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Manual Adjustment ({riskAdjustment[0] > 0 ? "+" : ""}{riskAdjustment[0]})</label>
                <Slider value={riskAdjustment} onValueChange={setRiskAdjustment} min={-30} max={30} step={1} className="py-2" />
              </div>
              {riskAdjustment[0] !== 0 && (
                <div className="p-2 rounded-lg bg-risk-medium/10 border border-risk-medium/20">
                  <p className="text-[10px] font-semibold text-risk-medium flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Manual Adjustment Applied
                  </p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Approved Amount (₹ Cr)</label>
                  <Input value={approvedAmount} onChange={(e) => setApprovedAmount(e.target.value)} className="text-xs h-8" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Interest Rate (%)</label>
                  <Input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="text-xs h-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Final Decision Card */}
          <AnimatePresence>
            {decision && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <Card className={`border-2 ${
                  decision === "approve" ? "border-risk-low/40 bg-risk-low/5" :
                  decision === "conditional" ? "border-risk-medium/40 bg-risk-medium/5" :
                  decision === "reject" ? "border-risk-high/40 bg-risk-high/5" :
                  "border-primary/40 bg-primary/5"
                }`}>
                  <CardContent className="pt-5 space-y-3">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Final Decision</p>
                      <p className={`text-xl font-bold mt-1 ${
                        decision === "approve" ? "text-risk-low" :
                        decision === "conditional" ? "text-risk-medium" :
                        decision === "reject" ? "text-risk-high" :
                        "text-primary"
                      }`}>
                        {decision === "approve" ? "APPROVED" : decision === "conditional" ? "CONDITIONAL APPROVAL" : decision === "reject" ? "REJECTED" : "SENT FOR RE-REVIEW"}
                      </p>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Loan Amount</p>
                        <p className="text-sm font-bold text-foreground">₹{approvedAmount} Cr</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Interest Rate</p>
                        <p className="text-sm font-bold text-foreground">{interestRate}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Risk Premium</p>
                        <p className="text-sm font-bold text-foreground">1.2%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Confidence</p>
                        <p className="text-sm font-bold text-risk-low">High</p>
                      </div>
                    </div>
                    <Button className="w-full gap-2 text-xs" size="sm">
                      <Send className="h-3.5 w-3.5" /> Submit Decision
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Comments Thread */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" /> Committee Discussion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ScrollArea className="max-h-[250px]">
                <div className="space-y-3 pr-2">
                  {existingComments.map((c, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                            {c.user.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <span className="text-[10px] font-semibold text-foreground">{c.user}</span>
                          <Badge variant="outline" className="text-[8px] px-1.5 py-0">{c.role}</Badge>
                        </div>
                        <span className="text-[9px] text-muted-foreground">{c.time}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{c.text}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment... Use @mention"
                  className="text-xs h-8 flex-1"
                />
                <Button size="sm" variant="outline" className="h-8 px-2">
                  <Paperclip className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" className="h-8 px-3 text-xs">Send</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}
