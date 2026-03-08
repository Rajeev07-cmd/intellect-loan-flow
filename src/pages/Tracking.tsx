import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, Clock, MessageSquare, Send, FileText,
  FolderUp, SearchCheck, BarChart3, BookOpen, UserCheck, ShieldCheck,
  Building2, IndianRupee, Layers, Activity, ChevronRight, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useApplicationStore } from "@/store/useApplicationStore";
import { ActiveApplicationBanner, NoApplicationSelected } from "@/components/ActiveApplicationBanner";
import { supabase } from "@/integrations/supabase/client";

const STAGES = [
  { key: "Application Created", label: "Application", icon: FileText, description: "Loan application submitted and registered in the system." },
  { key: "Documents Uploaded", label: "Documents", icon: FolderUp, description: "Required financial documents and certificates uploaded." },
  { key: "Verification Completed", label: "Verification", icon: SearchCheck, description: "Document authenticity and data integrity verified." },
  { key: "Risk Analysis Completed", label: "Risk Analysis", icon: BarChart3, description: "AI-powered risk scoring and credit assessment completed." },
  { key: "CAM Generated", label: "CAM Report", icon: BookOpen, description: "Credit Appraisal Memo generated with recommendations." },
  { key: "Manager Review", label: "Manager Review", icon: UserCheck, description: "Senior manager reviewing application for final decision." },
  { key: "Approved", label: "Decision", icon: ShieldCheck, description: "Final credit decision issued." },
];

function getStageIndex(currentStage: string): number {
  const idx = STAGES.findIndex(s => s.key === currentStage);
  return idx >= 0 ? idx : 0;
}

interface StageDetail {
  date?: string;
  riskScore?: number;
  riskCategory?: string;
  recommendation?: string;
}

export default function Tracking() {
  const { selectedApplication } = useApplicationStore();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(selectedApplication?.comments || []);
  const [currentStage, setCurrentStage] = useState("Application Created");
  const [stageHistory, setStageHistory] = useState<Record<string, string>>({});
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkflow = useCallback(async () => {
    if (!selectedApplication) return;
    try {
      const { data, error } = await supabase
        .from("workflow_status")
        .select("current_stage, stage_history, updated_at")
        .eq("application_id", selectedApplication.id)
        .maybeSingle();

      if (!error && data) {
        setCurrentStage(data.current_stage);
        const history: Record<string, string> = {};
        if (Array.isArray(data.stage_history)) {
          (data.stage_history as { stage: string; date: string }[]).forEach(h => {
            history[h.stage] = h.date;
          });
        }
        setStageHistory(history);
      }
    } catch (err) {
      console.error("Error fetching workflow:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedApplication]);

  useEffect(() => {
    fetchWorkflow();
    if (!selectedApplication) return;

    const channel = supabase
      .channel("workflow_tracking_" + selectedApplication.id)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "workflow_status",
        filter: `application_id=eq.${selectedApplication.id}`,
      }, () => fetchWorkflow())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchWorkflow, selectedApplication]);

  if (!selectedApplication) return <NoApplicationSelected />;

  const activeIdx = getStageIndex(currentStage);
  const totalStages = STAGES.length;
  const progressPercent = Math.round(((activeIdx + 1) / totalStages) * 100);

  const getStepStatus = (idx: number) => {
    if (idx < activeIdx) return "completed";
    if (idx === activeIdx) return "active";
    return "pending";
  };

  const getStageDetail = (idx: number): StageDetail => {
    const stage = STAGES[idx];
    return {
      date: stageHistory[stage.key] || (idx <= activeIdx ? new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : undefined),
      riskScore: stage.key === "Risk Analysis Completed" && idx <= activeIdx ? selectedApplication.riskScore : undefined,
      riskCategory: stage.key === "Risk Analysis Completed" && idx <= activeIdx ? selectedApplication.riskCategory : undefined,
      recommendation: stage.key === "Approved" && idx <= activeIdx ? selectedApplication.recommendation : undefined,
    };
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments(prev => [
      { author: "Credit Officer", role: "Analyst", time: "Just now", text: newComment },
      ...prev,
    ]);
    setNewComment("");
    toast({ title: "Comment Added", description: "Your note has been posted." });
  };

  return (
    <div className="space-y-6">
      <ActiveApplicationBanner />

      <div>
        <h1 className="text-2xl font-bold text-foreground">Application Tracking</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time workflow progress for {selectedApplication.company}</p>
      </div>

      {/* Company Info Card */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Building2, label: "Company", value: selectedApplication.company },
            { icon: IndianRupee, label: "Loan Amount", value: `₹${selectedApplication.loanAmount} Cr` },
            { icon: Layers, label: "Sector", value: selectedApplication.sector },
            { icon: Activity, label: "Current Stage", value: STAGES[activeIdx]?.label || currentStage },
          ].map((info, i) => (
            <motion.div key={info.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <info.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{info.label}</p>
                <p className="text-sm font-semibold text-foreground">{info.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Overall Progress */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Overall Progress</h3>
          <motion.span
            key={progressPercent}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-sm font-bold text-primary"
          >
            {progressPercent}%
          </motion.span>
        </div>
        <div className="relative h-3 rounded-full bg-muted/50 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-primary to-chart-1"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-primary/30"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ filter: "blur(6px)" }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          {activeIdx + 1} of {totalStages} stages completed • {currentStage === "Approved" || currentStage === "Rejected" ? "Process complete" : "In progress"}
        </p>
      </motion.div>

      {/* Workflow Timeline */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 md:p-8">
        <h3 className="text-sm font-semibold text-foreground mb-8">Approval Pipeline</h3>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading workflow...</span>
          </div>
        ) : (
          <>
            {/* Desktop horizontal timeline */}
            <div className="hidden md:block">
              <div className="relative">
                {/* Track */}
                <div className="absolute top-6 left-[7%] right-[7%] h-1 bg-border/40 rounded-full" />
                <motion.div
                  className="absolute top-6 left-[7%] h-1 rounded-full bg-gradient-to-r from-risk-low via-primary to-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((activeIdx / (totalStages - 1)) * 86, 86)}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                />

                <div className="relative flex justify-between">
                  {STAGES.map((stage, i) => {
                    const status = getStepStatus(i);
                    const isSelected = selectedStep === i;
                    const Icon = stage.icon;

                    return (
                      <motion.button
                        key={stage.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + i * 0.07 }}
                        onClick={() => setSelectedStep(isSelected ? null : i)}
                        className="flex flex-col items-center text-center group relative"
                        style={{ width: `${100 / totalStages}%` }}
                      >
                        {/* Node */}
                        <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 cursor-pointer
                          ${status === "completed"
                            ? "bg-risk-low/20 border-risk-low text-risk-low shadow-md shadow-risk-low/20"
                            : status === "active"
                            ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/30"
                            : "bg-card border-border/60 text-muted-foreground hover:border-muted-foreground/50"
                          }
                          ${isSelected ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background" : ""}
                        `}>
                          {status === "completed" ? (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                              <CheckCircle2 className="h-5 w-5" />
                            </motion.div>
                          ) : status === "active" ? (
                            <>
                              <motion.div
                                className="absolute inset-0 rounded-full border-2 border-primary/40"
                                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                              />
                              <Icon className="h-5 w-5" />
                            </>
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>

                        {/* Label */}
                        <p className={`text-[11px] font-medium mt-3 max-w-[85px] leading-tight transition-colors
                          ${status === "active" ? "text-primary" : status === "completed" ? "text-foreground" : "text-muted-foreground"}
                        `}>
                          {stage.label}
                        </p>
                        {status !== "pending" && stageHistory[stage.key] && (
                          <p className="text-[9px] text-muted-foreground mt-0.5">{stageHistory[stage.key]}</p>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Mobile vertical timeline */}
            <div className="md:hidden space-y-1">
              {STAGES.map((stage, i) => {
                const status = getStepStatus(i);
                const isSelected = selectedStep === i;
                const Icon = stage.icon;
                const isLast = i === totalStages - 1;

                return (
                  <motion.div key={stage.key} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                    <button
                      onClick={() => setSelectedStep(isSelected ? null : i)}
                      className="flex items-start gap-4 w-full text-left py-3 group"
                    >
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shrink-0
                          ${status === "completed" ? "bg-risk-low/20 border-risk-low text-risk-low"
                            : status === "active" ? "bg-primary/20 border-primary text-primary"
                            : "bg-card border-border/60 text-muted-foreground"
                          }
                          ${isSelected ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background" : ""}
                        `}>
                          {status === "completed" ? <CheckCircle2 className="h-4 w-4" /> :
                           status === "active" ? (
                            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                              <Icon className="h-4 w-4" />
                            </motion.div>
                           ) : <Icon className="h-4 w-4" />}
                        </div>
                        {!isLast && (
                          <div className={`w-0.5 h-6 mt-1 rounded-full ${status === "completed" ? "bg-risk-low/40" : "bg-border/40"}`} />
                        )}
                      </div>
                      <div className="pt-1.5">
                        <p className={`text-sm font-medium ${status === "active" ? "text-primary" : status === "completed" ? "text-foreground" : "text-muted-foreground"}`}>
                          {stage.label}
                        </p>
                        {stageHistory[stage.key] && <p className="text-[10px] text-muted-foreground">{stageHistory[stage.key]}</p>}
                      </div>
                      <ChevronRight className={`h-4 w-4 ml-auto mt-2 text-muted-foreground/40 transition-transform ${isSelected ? "rotate-90" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {isSelected && (
                        <StepDetailPanel idx={i} status={status} stage={STAGES[i]} detail={getStageDetail(i)} />
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Desktop detail panel */}
            <AnimatePresence>
              {selectedStep !== null && (
                <div className="hidden md:block mt-6">
                  <StepDetailPanel idx={selectedStep} status={getStepStatus(selectedStep)} stage={STAGES[selectedStep]} detail={getStageDetail(selectedStep)} />
                </div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>

      {/* Comments */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Internal Notes & Comments</h3>
        </div>

        <div className="flex gap-2 mb-4">
          <Input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a comment or note..."
            className="text-sm flex-1 rounded-xl"
            onKeyDown={e => e.key === "Enter" && handleAddComment()}
          />
          <Button size="sm" className="gap-2 rounded-xl" onClick={handleAddComment}>
            <Send className="h-3.5 w-3.5" /> Send
          </Button>
        </div>

        <div className="space-y-3">
          {comments.map((c, i) => (
            <motion.div key={`${c.author}-${i}`} initial={i === 0 ? { opacity: 0, y: -10 } : {}} animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 p-3.5 bg-muted/20 rounded-xl border border-border/20"
            >
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                {c.author.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-foreground">{c.author}</span>
                  <span className="text-[10px] text-muted-foreground">• {c.role}</span>
                  <span className="text-[10px] text-muted-foreground">• {c.time}</span>
                </div>
                <p className="text-sm text-muted-foreground">{c.text}</p>
              </div>
            </motion.div>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Add the first note above.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function StepDetailPanel({ idx, status, stage, detail }: {
  idx: number;
  status: string;
  stage: typeof STAGES[number];
  detail: StageDetail;
}) {
  const Icon = stage.icon;
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="p-4 rounded-xl bg-muted/30 border border-border/30 mt-2">
        <div className="flex items-center gap-3 mb-3">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center
            ${status === "completed" ? "bg-risk-low/15 text-risk-low" : status === "active" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{stage.label}</p>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full
              ${status === "completed" ? "bg-risk-low/15 text-risk-low" : status === "active" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
              {status === "completed" ? "Completed" : status === "active" ? "In Progress" : "Pending"}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3">{stage.description}</p>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {detail.date && (
            <div>
              <p className="text-muted-foreground/70">Date</p>
              <p className="font-medium text-foreground">{detail.date}</p>
            </div>
          )}
          {detail.riskScore !== undefined && (
            <div>
              <p className="text-muted-foreground/70">AI Risk Score</p>
              <p className="font-medium text-foreground">{detail.riskScore}</p>
            </div>
          )}
          {detail.riskCategory && (
            <div>
              <p className="text-muted-foreground/70">Risk Category</p>
              <p className="font-medium text-foreground">{detail.riskCategory}</p>
            </div>
          )}
          {detail.recommendation && (
            <div>
              <p className="text-muted-foreground/70">Recommendation</p>
              <p className="font-medium text-foreground">{detail.recommendation}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
