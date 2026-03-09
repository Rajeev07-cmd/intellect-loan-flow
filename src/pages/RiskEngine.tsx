import { useState } from "react";
import { motion } from "framer-motion";

import { Info, Brain, TrendingUp, AlertTriangle, Loader2, Wifi, WifiOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useApplicationStore } from "@/store/useApplicationStore";
import { ActiveApplicationBanner, NoApplicationSelected } from "@/components/ActiveApplicationBanner";
import { WorkflowProgress } from "@/components/applications/WorkflowProgress";
import { runRiskAnalysis, type RiskAnalysisResult } from "@/services/riskAnalysis";
import { logAuditEvent } from "@/services/auditLog";
import { createNotification } from "@/services/notifications";
import { useApiCall } from "@/hooks/useApiCall";
import { ProcessingBanner } from "@/components/ui/processing-status";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
} from "recharts";

export default function RiskEngine() {
  const { selectedApplication } = useApplicationStore();
  const { toast } = useToast();
  const [liveResult, setLiveResult] = useState<RiskAnalysisResult | null>(null);

  const { loading: analyzing, usingFallback, execute: executeRiskAnalysis } = useApiCall(
    runRiskAnalysis,
    {
      onSuccess: async (result) => {
        setLiveResult(result);
        toast({ title: "ML Model Response", description: `Risk Score: ${result.risk_score} — ${result.risk_category}` });
        // Log audit
        if (selectedApplication) {
          const isUUID = /^[0-9a-f]{8}-/i.test(selectedApplication.id);
          if (isUUID) {
            await logAuditEvent("Risk Analysis Completed", `Risk Score: ${result.risk_score} — ${result.risk_category}`, selectedApplication.id, "System");
            if (result.risk_score > 65) {
              await createNotification("High Risk Detected", `${selectedApplication.company} — Risk Score: ${result.risk_score}`, "error", selectedApplication.id);
            }
          }
        }
      },
      onError: () => {
        toast({ title: "Backend Unavailable", description: "Using pre-computed mock data. Start your FastAPI server to get live predictions.", variant: "destructive" });
      },
    }
  );

  const handleRunModel = async () => {
    if (!selectedApplication) return;
    const fin = selectedApplication.financials;
    await executeRiskAnalysis({
      revenue_growth: 0.12,
      profit_margin: fin.dscr > 1.5 ? 0.18 : 0.08,
      debt_ratio: fin.debtEquity,
      interest_coverage_ratio: fin.interestCoverage,
      litigation_count: 1,
      sector_risk: 0.5,
      collateral_score: 0.7,
    });
  };

  if (!selectedApplication) return <NoApplicationSelected />;

  const fiveCsScores = selectedApplication.fiveCsScores ?? [];
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

      <WorkflowProgress />

      <div>
        <h1 className="text-2xl font-bold text-foreground">Risk Scoring Engine</h1>
        <p className="text-sm text-muted-foreground mt-1">{selectedApplication.company} — Five Cs Analysis with Explainable AI</p>
      </div>

      {/* API Status + Run Model */}
      <div className="flex items-center gap-3">
        {usingFallback && (
          <Badge variant="outline" className="gap-1.5 text-xs text-risk-medium border-risk-medium/30">
            <WifiOff className="h-3 w-3" /> Using mock data
          </Badge>
        )}
        {liveResult && !usingFallback && (
          <Badge variant="outline" className="gap-1.5 text-xs text-risk-low border-risk-low/30">
            <Wifi className="h-3 w-3" /> Live ML prediction
          </Badge>
        )}
        <Button size="sm" className="gap-2 rounded-xl" onClick={handleRunModel} disabled={analyzing}>
          {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          {analyzing ? "Running Model..." : "Run ML Model"}
        </Button>
      </div>

      {/* Live result banner */}
      {liveResult && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 border-primary/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Live ML Prediction</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold text-foreground">{liveResult.risk_score}</p>
              <p className="text-xs text-muted-foreground">Risk Score</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{liveResult.risk_category}</p>
              <p className="text-xs text-muted-foreground">Category</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{(liveResult.default_probability * 100).toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Default Probability</p>
            </div>
          </div>
          {liveResult.explanation?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/30">
              <p className="text-xs text-muted-foreground mb-1.5">Top Risk Factors:</p>
              <div className="flex flex-wrap gap-2">
                {liveResult.explanation.map((e, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{e}</Badge>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

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
