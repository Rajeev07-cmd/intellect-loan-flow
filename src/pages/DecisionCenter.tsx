import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, IndianRupee, Factory, Shield, Brain, ChevronRight,
  CheckCircle2, Clock, AlertTriangle, XCircle, Send, Paperclip,
  ThumbsUp, ThumbsDown, RotateCcw, FileCheck, User, MessageSquare, Loader2,
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
import { useToast } from "@/hooks/use-toast";
import { useApplicationStore } from "@/store/useApplicationStore";
import { ActiveApplicationBanner, NoApplicationSelected } from "@/components/ActiveApplicationBanner";
import { logAuditEvent } from "@/services/auditLog";
import { createNotification } from "@/services/notifications";
import { updateWorkflowStatus } from "@/services/workflowStatus";
import { supabase } from "@/integrations/supabase/client";
import { getDecisionState, submitManagerDecision, type ManagerDecision, type DecisionState } from "@/services/decisionEngine";

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

export default function DecisionCenter() {
  const { selectedApplication } = useApplicationStore();
  const [decision, setDecision] = useState("");
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [newComment, setNewComment] = useState("");
  const [riskAdjustment, setRiskAdjustment] = useState([0]);
  const [approvedAmount, setApprovedAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [comments, setComments] = useState<{ user: string; role: string; time: string; text: string; author?: string }[]>([]);
  const [auditTrail, setAuditTrail] = useState<{ time: string; event: string; user: string }[]>([]);
  const [decisionState, setDecisionState] = useState<DecisionState>({ credit_officer_decision: null, manager_decision: null, final_status: null });
  const { toast } = useToast();

  // Initialize from selected application
  useEffect(() => {
    if (!selectedApplication) return;
    setApprovedAmount(String(selectedApplication.loanAmount));
    setInterestRate(selectedApplication.interestRate?.replace("%", "") || "11.5");
    setComments((selectedApplication.comments || []).map(c => ({ ...c, user: (c as any).author || (c as any).user || "Unknown" })));
    setDecision("");
    setSubmitted(false);
    setRiskAdjustment([0]);
    setSelectedReasons([]);

    // Load audit trail and decision state
    const loadData = async () => {
      const isUUID = /^[0-9a-f]{8}-/i.test(selectedApplication.id);
      if (!isUUID) {
        setAuditTrail([
          { time: "12:10 PM", event: "Application submitted for credit appraisal", user: "Credit Analyst" },
          { time: "12:45 PM", event: `AI Risk Score: ${selectedApplication.riskScore} — ${selectedApplication.riskCategory}`, user: "System" },
          { time: "1:15 PM", event: `Document Integrity Score: ${selectedApplication.integrityScore}/100`, user: "System" },
        ]);
        return;
      }
      try {
        // Load decision state
        const ds = await getDecisionState(selectedApplication.id);
        setDecisionState(ds);
        if (ds.manager_decision) {
          setSubmitted(true);
          setDecision(ds.manager_decision === "approve" ? "approve" : ds.manager_decision === "reject" ? "reject" : "re-review");
        }

        const { data } = await supabase
          .from("audit_logs")
          .select("*")
          .eq("application_id", selectedApplication.id)
          .order("created_at", { ascending: false })
          .limit(10);
        if (data && data.length > 0) {
          setAuditTrail(data.map(d => ({
            time: new Date(d.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
            event: d.event_description,
            user: d.user_name || "System",
          })));
        } else {
          setAuditTrail([
            { time: "—", event: "Application created", user: "System" },
          ]);
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
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const getRiskColor = (score: number) =>
    score <= 40 ? "text-risk-low" : score <= 65 ? "text-risk-medium" : "text-risk-high";
  const getRiskLabel = (score: number) =>
    score <= 40 ? "Low Risk" : score <= 65 ? "Medium Risk" : "High Risk";

  const policyAlerts = [
    ...(app.financials.dscr < 1.5 ? [{ severity: "info", message: `DSCR ${app.financials.dscr}x is below recommended 1.5x threshold` }] : []),
    ...(app.financials.debtEquity > 1.5 ? [{ severity: "warning", message: `High debt-equity ratio: ${app.financials.debtEquity}x` }] : []),
    ...(app.financials.gstMismatch ? [{ severity: "error", message: `GST mismatch detected: ${app.financials.gstMismatchAmount}` }] : []),
    ...(app.riskScore > 65 ? [{ severity: "error", message: `High risk score: ${app.riskScore} — requires committee review` }] : []),
  ];

  const handleSubmitDecision = async () => {
    if (!decision) {
      toast({ title: "Select a Decision", description: "Please choose Approve, Reject, or Re-Review.", variant: "destructive" });
      return;
    }
    if (selectedReasons.length === 0) {
      toast({ title: "Reasons Required", description: "Please select at least one decision reason.", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    const mgrDecisionMap: Record<string, ManagerDecision> = {
      approve: "approve", reject: "reject", conditional: "review", "re-review": "review"
    };
    const mgrDecision = mgrDecisionMap[decision] || "review";

    const isUUID = /^[0-9a-f]{8}-/i.test(app.id);
    if (isUUID) {
      try {
        await submitManagerDecision(app.id, mgrDecision, app.company);

        // Also update loan terms
        await supabase.from("applications").update({
          suggested_limit: `₹${approvedAmount} Cr`,
          interest_rate: `${interestRate}%`,
          recommendation: decision === "approve" ? "Approved" : decision === "reject" ? "Rejected" : "Under Review",
        }).eq("id", app.id);

        // Refresh decision state
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

    // Update local audit trail
    const timeStr = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    setAuditTrail(prev => [
      { time: timeStr, event: `Manager decision: ${decisionLabel} — ₹${approvedAmount} Cr at ${interestRate}%`, user: "Credit Manager" },
      ...prev,
    ]);

    setSubmitting(false);
    setSubmitted(true);
    toast({ title: "Decision Submitted", description: `Final decision: ${decisionState.final_status || decisionLabel}. Loan amount: ₹${approvedAmount} Cr.` });
  };

  const handleSendComment = () => {
    if (!newComment.trim()) return;
    setComments(prev => [...prev, {
      user: "Credit Manager",
      role: "Manager",
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      text: newComment,
    }]);
    setNewComment("");
    toast({ title: "Comment Posted" });
  };

  const stageIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="h-5 w-5 text-risk-low" />;
    if (status === "active" || status === "in_progress") return <Clock className="h-5 w-5 text-risk-medium animate-pulse" />;
    return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />;
  };

  // Build approval stages from pipeline
  const approvalStages = app.pipeline.map(p => ({
    role: p.stage,
    user: "—",
    status: p.status === "completed" ? "completed" : p.status === "active" ? "in_progress" : "pending",
    timestamp: p.date || "—",
    decision: p.status === "completed" ? "Completed" : p.status === "active" ? "In Progress" : "Pending",
  }));

  return (
    <div className="space-y-6">
      <ActiveApplicationBanner />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Credit Committee Decision Center</h1>
            <p className="text-sm text-muted-foreground mt-1">{app.company} — Review AI recommendations and make final credit decisions</p>
          </div>
          <Badge variant="outline" className={`gap-1.5 px-3 py-1.5 text-xs ${
            submitted
              ? decision === "approve" ? "border-risk-low/30 text-risk-low bg-risk-low/10" : decision === "reject" ? "border-risk-high/30 text-risk-high bg-risk-high/10" : "border-risk-medium/30 text-risk-medium bg-risk-medium/10"
              : "border-risk-medium/30 text-risk-medium bg-risk-medium/10"
          }`}>
            {submitted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
            {submitted ? "Decision Submitted" : "Pending Committee Decision"}
          </Badge>
        </div>
      </motion.div>

      {/* Policy Alerts */}
      {policyAlerts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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

      {/* Three Panel Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Panel — Summary */}
        <motion.div className="xl:col-span-3 space-y-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Application Summary
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
                <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Promoter" value={app.promoterGroup} />
                <InfoRow icon={<FileCheck className="h-3.5 w-3.5" />} label="Incorporated" value={app.incorporationYear} />
                <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="CIBIL Score" value={String(app.cibilScore)} />
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">AI Risk Score</span>
                  <span className={`text-xl font-bold ${getRiskColor(aiRiskScore)}`}>{aiRiskScore}</span>
                </div>
                <Progress value={aiRiskScore} className="h-2" />
                <p className={`text-[10px] font-semibold ${getRiskColor(aiRiskScore)}`}>{getRiskLabel(aiRiskScore)}</p>
              </div>
              <div className="p-3 rounded-lg bg-risk-medium/10 border border-risk-medium/20">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-risk-medium" />
                  <span className="text-xs font-semibold text-risk-medium">AI Recommendation</span>
                </div>
                <p className="text-sm font-bold text-foreground mt-1">{app.recommendation}</p>
              </div>
            </CardContent>
          </Card>

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
                      <p className="text-[10px] text-muted-foreground">{stage.timestamp}</p>
                      <Badge variant="outline" className={`mt-1 text-[9px] ${
                        stage.status === "completed" ? "border-risk-low/30 text-risk-low" :
                        stage.status === "in_progress" ? "border-risk-medium/30 text-risk-medium" :
                        "border-border text-muted-foreground"
                      }`}>{stage.decision}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Center Panel — CAM Summary */}
        <motion.div className="xl:col-span-5 space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">CAM Summary & Risk Analysis</CardTitle>
              <CardDescription className="text-xs">Key highlights from Credit Appraisal Memo</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" defaultValue={["financials", "risks", "fivec"]}>
                <AccordionItem value="financials">
                  <AccordionTrigger className="text-xs font-semibold py-3">Financial Highlights</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ["Revenue", app.financials.revenue],
                        ["Outstanding Debt", app.financials.outstandingDebt],
                        ["DSCR", `${app.financials.dscr}x`],
                        ["Debt/Equity", `${app.financials.debtEquity}x`],
                        ["Interest Coverage", `${app.financials.interestCoverage}x`],
                        ["Current Ratio", `${app.financials.currentRatio}x`],
                      ].map(([label, value], i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-[10px] text-muted-foreground">{label}</p>
                          <p className="text-sm font-bold text-foreground">{value}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="risks">
                  <AccordionTrigger className="text-xs font-semibold py-3">Key Risk Factors (Explainable AI)</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {app.explainableAI.map((item, i) => (
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
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="fivec">
                  <AccordionTrigger className="text-xs font-semibold py-3">Five Cs Evaluation</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {app.fiveCsScores.map(c => (
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
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Audit Trail */}
          <Card className="border-border/50">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Decision Audit Trail</CardTitle></CardHeader>
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

        {/* Right Panel — Decision Controls */}
        <motion.div className="xl:col-span-4 space-y-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
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
                    onClick={() => { setDecision(opt.value); setSubmitted(false); }}
                    disabled={submitted}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-all disabled:opacity-50 ${
                      decision === opt.value ? `${opt.color} ring-2 ring-offset-1 ring-offset-background ring-current` : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                    }`}
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

              <div>
                <label className="text-xs font-medium text-foreground mb-2 block">Additional Comments</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Enter detailed decision rationale..."
                  className="text-xs min-h-[80px] resize-none"
                  disabled={submitted}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Risk Override Simulation</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">AI Risk Score</p>
                  <p className={`text-lg font-bold ${getRiskColor(aiRiskScore)}`}>{aiRiskScore}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Adjusted Score</p>
                  <p className={`text-lg font-bold ${getRiskColor(adjustedScore)}`}>{adjustedScore}</p>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Manual Adjustment ({riskAdjustment[0] > 0 ? "+" : ""}{riskAdjustment[0]})</label>
                <Slider value={riskAdjustment} onValueChange={setRiskAdjustment} min={-30} max={30} step={1} className="py-2" disabled={submitted} />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Approved Amount (₹ Cr)</label>
                  <Input value={approvedAmount} onChange={(e) => setApprovedAmount(e.target.value)} className="text-xs h-8" disabled={submitted} />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Interest Rate (%)</label>
                  <Input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="text-xs h-8" disabled={submitted} />
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
                        decision === "reject" ? "text-risk-high" : "text-primary"
                      }`}>
                        {decision === "approve" ? "APPROVED" : decision === "conditional" ? "CONDITIONAL APPROVAL" : decision === "reject" ? "REJECTED" : "SENT FOR RE-REVIEW"}
                      </p>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div><p className="text-[10px] text-muted-foreground">Loan Amount</p><p className="text-sm font-bold text-foreground">₹{approvedAmount} Cr</p></div>
                      <div><p className="text-[10px] text-muted-foreground">Interest Rate</p><p className="text-sm font-bold text-foreground">{interestRate}%</p></div>
                    </div>
                    <Button
                      className="w-full gap-2 text-xs"
                      size="sm"
                      onClick={handleSubmitDecision}
                      disabled={submitting || submitted}
                    >
                      {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : submitted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                      {submitting ? "Submitting..." : submitted ? "Decision Submitted" : "Submit Decision"}
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
                  {comments.map((c, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                            {c.author?.split(" ").map((n: string) => n[0]).join("") || c.user?.split(" ").map((n: string) => n[0]).join("") || "?"}
                          </div>
                          <span className="text-[10px] font-semibold text-foreground">{(c as any).author || c.user}</span>
                          <Badge variant="outline" className="text-[8px] px-1.5 py-0">{c.role}</Badge>
                        </div>
                        <span className="text-[9px] text-muted-foreground">{c.time}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{c.text}</p>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No comments yet</p>
                  )}
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="text-xs h-8 flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
                />
                <Button size="sm" className="h-8 px-3 text-xs" onClick={handleSendComment}>Send</Button>
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
      <div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-xs">{label}</span></div>
      <span className="text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}
