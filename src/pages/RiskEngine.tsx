import { motion } from "framer-motion";
import { fiveCsScores } from "@/lib/mock-data";
import { Info, Brain } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const overallScore = fiveCsScores.reduce((sum, c) => sum + c.contribution, 0);

export default function RiskEngine() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Risk Scoring Engine</h1>
        <p className="text-sm text-muted-foreground mt-1">Tata Steel Ltd — Five Cs Analysis with Explainable AI</p>
      </div>

      {/* Overall Score */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="relative">
          <svg className="w-48 h-48 -rotate-90">
            <circle cx="96" cy="96" r="80" fill="none" stroke="hsl(222, 30%, 16%)" strokeWidth="12" />
            <circle cx="96" cy="96" r="80" fill="none"
              stroke={overallScore <= 40 ? "hsl(142, 71%, 45%)" : overallScore <= 65 ? "hsl(38, 92%, 50%)" : "hsl(0, 72%, 51%)"}
              strokeWidth="12" strokeLinecap="round"
              strokeDasharray={`${(overallScore / 100) * 502} 502`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${overallScore <= 40 ? "text-risk-low" : overallScore <= 65 ? "text-risk-medium" : "text-risk-high"}`}>
              {overallScore.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">Overall Risk</span>
          </div>
        </div>

        <div className="flex-1 space-y-4 w-full">
          {fiveCsScores.map((c, i) => (
            <motion.div key={c.name} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{c.name}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs bg-popover border-border text-popover-foreground">
                        <p className="text-xs">{c.explanation}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Score: <strong className="text-foreground">{c.score}</strong></span>
                  <span>Weight: {c.weight}%</span>
                  <span>Contrib: <strong className="text-foreground">{c.contribution.toFixed(1)}</strong></span>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${c.score}%` }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  className={`h-full rounded-full ${c.score >= 70 ? "bg-risk-low" : c.score >= 50 ? "bg-risk-medium" : "bg-risk-high"}`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Explainable AI Panel */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Explainable AI — "Why this score?"</h3>
        </div>
        <div className="space-y-3">
          {[
            { severity: "high", text: "High litigation exposure found — 2 pending cases worth ₹12 Cr aggregate claim in e-Courts data." },
            { severity: "medium", text: "Revenue mismatch detected — GSTR-2A vs 3B discrepancy of ₹23.5 Cr indicates potential circular trading." },
            { severity: "high", text: "Factory operating at 40% capacity utilization (manual input) — significantly below industry average of 72%." },
            { severity: "low", text: "Strong promoter track record — 25+ years, clean CIBIL history, increased personal stake by 2%." },
            { severity: "medium", text: "Steel sector facing global demand softening — CRISIL outlook neutral but raw material cost volatility persists." },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                item.severity === "high" ? "bg-risk-high/5 border-risk-high/20" :
                item.severity === "medium" ? "bg-risk-medium/5 border-risk-medium/20" :
                "bg-risk-low/5 border-risk-low/20"
              }`}
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                item.severity === "high" ? "bg-risk-high" : item.severity === "medium" ? "bg-risk-medium" : "bg-risk-low"
              }`} />
              <p className="text-sm text-foreground">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
