import { motion } from "framer-motion";
import { Info, Brain, TrendingUp, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useApplicationStore } from "@/store/useApplicationStore";
import { ActiveApplicationBanner, NoApplicationSelected } from "@/components/ActiveApplicationBanner";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
} from "recharts";

export default function RiskEngine() {
  const { selectedApplication } = useApplicationStore();

  if (!selectedApplication) return <NoApplicationSelected />;

  const fiveCsScores = selectedApplication.fiveCsScores;
  const overallScore = fiveCsScores.reduce((sum, c) => sum + c.contribution, 0);

  const radarData = fiveCsScores.map(c => ({
    subject: c.name,
    score: c.score,
    fullMark: 100,
  }));

  const riskFactorData = fiveCsScores.map(c => ({
    name: c.name,
    contribution: c.contribution,
    score: c.score,
  }));

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
            className="glass-card p-5"
          >
            <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Radar + Score Ring + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Five Cs Radar</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Score Ring */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-muted-foreground mb-6">Composite Score</h3>
          <div className="relative">
            <svg className="w-44 h-44 -rotate-90">
              <circle cx="88" cy="88" r="74" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
              <motion.circle
                cx="88" cy="88" r="74" fill="none"
                stroke={overallScore <= 40 ? "hsl(var(--risk-high))" : overallScore <= 65 ? "hsl(var(--risk-medium))" : "hsl(var(--risk-low))"}
                strokeWidth="10" strokeLinecap="round"
                initial={{ strokeDasharray: "0 465" }}
                animate={{ strokeDasharray: `${(overallScore / 100) * 465} 465` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${overallScore <= 40 ? "text-risk-high" : overallScore <= 65 ? "text-risk-medium" : "text-risk-low"}`}>
                {overallScore.toFixed(1)}
              </span>
              <span className="text-[10px] text-muted-foreground mt-1">out of 100</span>
            </div>
          </div>
          <span className={`mt-4 px-3 py-1 rounded-full text-xs font-semibold ${
            overallScore <= 40 ? "bg-risk-high/15 text-risk-high" : overallScore <= 65 ? "bg-risk-medium/15 text-risk-medium" : "bg-risk-low/15 text-risk-low"
          }`}>
            {overallScore <= 40 ? "High Risk" : overallScore <= 65 ? "Medium Risk" : "Low Risk"}
          </span>
        </motion.div>

        {/* Contribution Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Risk Factor Contribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskFactorData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" domain={[0, 25]} hide />
                <YAxis
                  type="category" dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  width={80} axisLine={false} tickLine={false}
                />
                <RechartsTooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, color: "hsl(var(--popover-foreground))", fontSize: 12 }}
                  formatter={(value: number) => [`${value.toFixed(1)}`, "Contribution"]}
                />
                <Bar dataKey="contribution" radius={[0, 6, 6, 0]} barSize={16}>
                  {riskFactorData.map((entry, i) => (
                    <Cell key={i} fill={entry.score >= 70 ? "hsl(var(--risk-low))" : entry.score >= 50 ? "hsl(var(--risk-medium))" : "hsl(var(--risk-high))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Five Cs Detail */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Five Cs Breakdown</h3>
        <div className="space-y-4">
          {fiveCsScores.map((c, i) => (
            <motion.div key={c.name} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
              <div className="flex items-center justify-between mb-1.5">
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
              className={`flex items-start gap-3 p-3.5 rounded-xl border ${
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
            <div key={r.label} className="p-4 bg-muted/20 rounded-xl text-center border border-border/30">
              <p className="text-xl font-bold text-foreground">{r.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{r.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
