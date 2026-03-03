import { motion } from "framer-motion";
import { CheckCircle, Circle, ArrowRight, Clock, MessageSquare } from "lucide-react";

const pipeline = [
  { stage: "Draft", status: "completed", date: "Feb 15, 2026" },
  { stage: "Data Ingestion", status: "completed", date: "Feb 18, 2026" },
  { stage: "AI Research", status: "completed", date: "Feb 20, 2026" },
  { stage: "Risk Scoring", status: "completed", date: "Feb 22, 2026" },
  { stage: "Committee Review", status: "active", date: "In Progress" },
  { stage: "Final Decision", status: "pending", date: "—" },
];

const comments = [
  { author: "Rajesh Kumar", role: "Credit Manager", time: "2 hours ago", text: "GST mismatch flagged. Requesting clarification from CA firm." },
  { author: "Priya Sharma", role: "Risk Analyst", time: "5 hours ago", text: "Collateral valuation report is 6 months old. Needs fresh assessment." },
  { author: "Amit Patel", role: "Sr. Credit Officer", time: "1 day ago", text: "Factory visit completed. Capacity utilization is indeed low at ~40%." },
];

export default function Tracking() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Application Tracking</h1>
        <p className="text-sm text-muted-foreground mt-1">Tata Steel Ltd — APP-001</p>
      </div>

      {/* Pipeline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-6">Approval Pipeline</h3>
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {pipeline.map((step, i) => (
            <div key={step.stage} className="flex items-center">
              <div className="flex flex-col items-center gap-2 min-w-[100px]">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step.status === "completed" ? "bg-risk-low/20 text-risk-low" :
                  step.status === "active" ? "bg-primary/20 text-primary animate-pulse-glow" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {step.status === "completed" ? <CheckCircle className="h-5 w-5" /> :
                   step.status === "active" ? <Clock className="h-5 w-5" /> :
                   <Circle className="h-5 w-5" />}
                </div>
                <div className="text-center">
                  <p className={`text-xs font-medium ${step.status === "active" ? "text-primary" : step.status === "completed" ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.stage}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{step.date}</p>
                </div>
              </div>
              {i < pipeline.length - 1 && (
                <ArrowRight className={`h-4 w-4 mx-2 flex-shrink-0 ${step.status === "completed" ? "text-risk-low" : "text-muted-foreground/30"}`} />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Comments */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Internal Notes & Comments</h3>
        </div>
        <div className="space-y-4">
          {comments.map((c, i) => (
            <div key={i} className="flex gap-3 p-3 bg-muted/20 rounded-lg">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
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
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
