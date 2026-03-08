import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, AlertTriangle, ThumbsDown, Send, CheckCircle2, Loader2, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useApplicationStore } from "@/store/useApplicationStore";
import {
  submitCreditOfficerDecision,
  getDecisionState,
  type CreditOfficerDecision,
} from "@/services/decisionEngine";

export function CreditOfficerDecisionPanel() {
  const { selectedApplication } = useApplicationStore();
  const { toast } = useToast();
  const [decision, setDecision] = useState<CreditOfficerDecision | "">("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingDecision, setExistingDecision] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedApplication) return;
    const isUUID = /^[0-9a-f]{8}-/i.test(selectedApplication.id);
    if (!isUUID) return;

    getDecisionState(selectedApplication.id).then((state) => {
      if (state.credit_officer_decision) {
        setExistingDecision(state.credit_officer_decision);
        setSubmitted(true);
      } else {
        setExistingDecision(null);
        setSubmitted(false);
        setDecision("");
      }
    });
  }, [selectedApplication]);

  if (!selectedApplication) return null;

  const app = selectedApplication;
  const isUUID = /^[0-9a-f]{8}-/i.test(app.id);

  const handleSubmit = async () => {
    if (!decision) {
      toast({ title: "Select a Decision", description: "Choose Approve, Conditional, or Reject.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      if (isUUID) {
        await submitCreditOfficerDecision(app.id, decision, app.company);
      }
      setSubmitted(true);
      setExistingDecision(decision);
      toast({ title: "Decision Submitted", description: `Recommendation: ${decision}. Manager has been notified.` });
    } catch (e) {
      toast({ title: "Error", description: "Failed to submit decision.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const decisionLabel = (d: string) =>
    d === "approve" ? "Approve" : d === "conditional" ? "Conditional Approval" : "Reject";

  const options = [
    { value: "approve" as const, label: "Approve", icon: ThumbsUp, color: "border-risk-low/40 bg-risk-low/10 text-risk-low hover:bg-risk-low/20" },
    { value: "conditional" as const, label: "Conditional", icon: AlertTriangle, color: "border-risk-medium/40 bg-risk-medium/10 text-risk-medium hover:bg-risk-medium/20" },
    { value: "reject" as const, label: "Reject", icon: ThumbsDown, color: "border-risk-high/40 bg-risk-high/10 text-risk-high hover:bg-risk-high/20" },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Credit Officer Decision
            </CardTitle>
            <CardDescription className="text-xs mt-1">Submit your recommendation for manager review</CardDescription>
          </div>
          {submitted && existingDecision && (
            <Badge variant="outline" className={`text-[10px] ${
              existingDecision === "approve" ? "border-risk-low/30 text-risk-low bg-risk-low/10" :
              existingDecision === "conditional" ? "border-risk-medium/30 text-risk-medium bg-risk-medium/10" :
              "border-risk-high/30 text-risk-high bg-risk-high/10"
            }`}>
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {decisionLabel(existingDecision)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { if (!submitted) { setDecision(opt.value); } }}
              disabled={submitted}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-all disabled:opacity-60 ${
                (decision === opt.value || existingDecision === opt.value)
                  ? `${opt.color} ring-2 ring-offset-1 ring-offset-background ring-current`
                  : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
              }`}
            >
              <opt.icon className="h-5 w-5" />
              {opt.label}
            </button>
          ))}
        </div>

        {!submitted && (
          <>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add rationale for your recommendation..."
              className="text-xs min-h-[60px] resize-none"
            />
            <AnimatePresence>
              {decision && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}>
                  <Button
                    className="w-full gap-2 text-xs"
                    size="sm"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    {submitting ? "Submitting..." : "Submit to Manager"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {submitted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
            <p className="text-xs text-muted-foreground">Decision submitted. Waiting for Manager review.</p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
