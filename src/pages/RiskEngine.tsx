import { motion } from "framer-motion";
import { Info, Brain } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useApplicationStore } from "@/store/useApplicationStore";
import { ActiveApplicationBanner, NoApplicationSelected } from "@/components/ActiveApplicationBanner";

export default function RiskEngine() {
  const { selectedApplication } = useApplicationStore();

  if (!selectedApplication) return <NoApplicationSelected />;

  const fiveCsScores = selectedApplication.fiveCsScores;
  const overallScore = fiveCsScores.reduce((sum, c) => sum + c.contribution, 0);

  return (
    <div className="space-y-6">
      <ActiveApplicationBanner />

      <div>
        <h1 className="text-2xl font-bold text-foreground">Risk Scoring Engine</h1>
        <p className="text-sm text-muted-foreground mt-1">{selectedApplication.company} — Five Cs Analysis with Explainable AI</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Risk Score", value: selectedApplication.riskScore, color: selectedApplication.riskScore <= 40 ? "text-risk-low" : selectedApplication.riskScore <= 65 ? "text-risk-medium" : "text-risk-high" },
          { label: "Risk Category", value: selectedApplication.riskCategory, color: "text-foreground" },
          { label: "Default Probability", value: `${(selectedApplication.defaultProbability * 100).toFixed(0)}%`, color: "text-foreground" },
          { label: "CIBIL Score", value: selectedApplication.cibilScore, color: "text-foreground" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-4"
          >
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Overall Score & Five Cs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="relative">
          <svg className="w-48 h-48 -rotate-90">
            <circle cx="96" cy="96" r="80" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
            <circle cx="96" cy="96" r="80" fill="none"
              stroke={overallScore <= 40 ? "hsl(var(--risk-high))" : overallScore <= 65 ? "hsl(var(--risk-medium))" : "hsl(var(--risk-low))"}
              strokeWidth="12" strokeLinecap="round"
              strokeDasharray={`${(overallScore / 100) * 502} 502`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${overallScore <= 40 ? "text-risk-high" : overallScore <= 65 ? "text-risk-medium" : "text-risk-low"}`}>
              {overallScore.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">Five Cs Score</span>
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
                      <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs"><p className="text-xs">{c.explanation}</p></TooltipContent>
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

      {/* Explainable AI */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Explainable AI — "Why this score?"</h3>
        </div>
        <div className="space-y-3">
          {selectedApplication.explainableAI.map((item, i) => (
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

      {/* Financial Ratios */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Financial Ratios</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Revenue", value: selectedApplication.financials.revenue },
            { label: "DSCR", value: `${selectedApplication.financials.dscr}x` },
            { label: "Debt/Equity", value: `${selectedApplication.financials.debtEquity}x` },
            { label: "Interest Coverage", value: `${selectedApplication.financials.interestCoverage}x` },
            { label: "Current Ratio", value: `${selectedApplication.financials.currentRatio}x` },
            { label: "Outstanding Debt", value: selectedApplication.financials.outstandingDebt },
            { label: "CIBIL Score", value: selectedApplication.cibilScore.toString() },
            { label: "Default Prob", value: `${(selectedApplication.defaultProbability * 100).toFixed(0)}%` },
          ].map(r => (
            <div key={r.label} className="p-3 bg-muted/20 rounded-lg text-center">
              <p className="text-lg font-bold text-foreground">{r.value}</p>
              <p className="text-[10px] text-muted-foreground">{r.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
