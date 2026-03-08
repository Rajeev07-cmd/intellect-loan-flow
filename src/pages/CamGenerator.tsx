import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileDown, Share2, Download, Loader2, CheckCircle, XCircle, AlertTriangle, FileText, Shield, Building2, BarChart3, Gavel, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useApplicationStore } from "@/store/useApplicationStore";
import { ActiveApplicationBanner, NoApplicationSelected } from "@/components/ActiveApplicationBanner";
import { saveCamReport, getCamReport } from "@/services/camReports";
import { logAuditEvent } from "@/services/auditLog";
const outlineItems = [
  { id: "overview", label: "Company Overview", icon: Building2 },
  { id: "financial", label: "Financial Analysis", icon: BarChart3 },
  { id: "risk", label: "Risk Analysis", icon: Shield },
  { id: "fivec", label: "Five-C Evaluation", icon: FileText },
  { id: "recommendation", label: "Recommendation", icon: Gavel },
];

export default function CamGenerator() {
  const { toast } = useToast();
  const { selectedApplication } = useApplicationStore();
  const [exporting, setExporting] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [saving, setSaving] = useState(false);
  const [savedToDb, setSavedToDb] = useState(false);

  if (!selectedApplication) return <NoApplicationSelected />;

  const app = selectedApplication;
  const overallScore = app.fiveCsScores.reduce((sum, c) => sum + c.contribution, 0);

  const handleExport = (format: string) => {
    setExporting(format);
    toast({ title: `Generating ${format}...`, description: "Please wait while the document is being prepared." });
    setTimeout(() => {
      setExporting(null);
      toast({ title: `${format} Ready`, description: `CAM exported as ${format}. Download started.` });
    }, 2000);
  };

  const handleSaveToDb = async () => {
    const isUUID = /^[0-9a-f]{8}-/i.test(app.id);
    if (!isUUID) {
      toast({ title: "Demo Application", description: "CAM reports can only be saved for database applications." });
      return;
    }
    setSaving(true);
    try {
      await saveCamReport(app.id, {
        company_overview: `${app.company} — ${app.sector} — CIN: ${app.cin}`,
        financial_analysis: `Revenue: ${app.financials.revenue}, DSCR: ${app.financials.dscr}x, D/E: ${app.financials.debtEquity}x`,
        risk_analysis: app.explainableAI.map(e => e.text).join("; "),
        recommendation: app.recommendation,
        suggested_loan_limit: app.suggestedLimit,
        interest_rate: app.interestRate,
      });
      setSavedToDb(true);
      toast({ title: "CAM Saved", description: "Report saved to database successfully." });
    } catch (e) {
      toast({ title: "Save Failed", description: "Could not save CAM report.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    toast({ title: "Shared with Committee", description: "CAM report has been shared for review." });
  };

  const DecisionIcon = app.recommendation === "Approve" ? CheckCircle :
    app.recommendation === "Reject" ? XCircle : AlertTriangle;
  const decisionColor = app.recommendation === "Approve" ? "risk-low" :
    app.recommendation === "Reject" ? "risk-high" : "risk-medium";

  return (
    <div className="space-y-6">
      <ActiveApplicationBanner />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Credit Appraisal Memo</h1>
          <p className="text-sm text-muted-foreground mt-1">{app.company} — Generated on March 8, 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 rounded-xl" disabled={exporting === "PDF"} onClick={() => handleExport("PDF")}>
            {exporting === "PDF" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />} Export PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl" disabled={exporting === "Word"} onClick={() => handleExport("Word")}>
            {exporting === "Word" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Word
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={handleSaveToDb} disabled={saving || savedToDb}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : savedToDb ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : savedToDb ? "Saved" : "Save to DB"}
          </Button>
          <Button size="sm" className="gap-2 rounded-xl" onClick={handleShare}>
            <Share2 className="h-4 w-4" /> Share
          </Button>
        </div>
      </div>

      {/* Split Layout: Outline + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        {/* Left Outline */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-4 h-fit sticky top-20">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3 px-2">CAM Outline</p>
          <div className="space-y-1">
            {outlineItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    activeSection === item.id
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Right Content */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 space-y-8">
          <div className="text-center border-b border-border/50 pb-6">
            <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">Comprehensive Credit Appraisal Memo</h2>
            <p className="text-xs text-muted-foreground mt-1">Confidential — For Internal Use Only</p>
          </div>

          {/* Company Overview */}
          <Section title="1. Company Overview" id="overview" active={activeSection}>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Company Name", app.company],
                ["CIN", app.cin],
                ["Sector", app.sector],
                ["Incorporated", app.incorporationYear],
                ["Registered Office", app.registeredOffice],
                ["Promoter Group", app.promoterGroup],
                ["CIBIL Score", app.cibilScore.toString()],
                ["Facility Requested", `₹${app.loanAmount} Cr Term Loan`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between p-3 bg-muted/20 rounded-xl border border-border/20">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </Section>

          <Separator className="bg-border/30" />

          {/* Financial Analysis */}
          <Section title="2. Financial Analysis" id="financial" active={activeSection}>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Revenue", app.financials.revenue],
                ["Outstanding Debt", app.financials.outstandingDebt],
                ["DSCR", `${app.financials.dscr}x`],
                ["Debt/Equity", `${app.financials.debtEquity}x`],
                ["Related Party Txn", app.financials.relatedPartyTransactions],
                ["GST Mismatch", app.financials.gstMismatch ? app.financials.gstMismatchAmount : "None"],
              ].map(([label, value]) => (
                <div key={label as string} className="p-4 bg-muted/20 rounded-xl text-center border border-border/20">
                  <p className="text-lg font-bold text-foreground">{value}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>
          </Section>

          <Separator className="bg-border/30" />

          {/* Risk Analysis */}
          <Section title="3. Risk Analysis" id="risk" active={activeSection}>
            <div className="space-y-3">
              {app.explainableAI.map((item, i) => (
                <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                  item.severity === "high" ? "bg-risk-high/5 border-risk-high/20" :
                  item.severity === "medium" ? "bg-risk-medium/5 border-risk-medium/20" :
                  "bg-risk-low/5 border-risk-low/20"
                }`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    item.severity === "high" ? "bg-risk-high" : item.severity === "medium" ? "bg-risk-medium" : "bg-risk-low"
                  }`} />
                  <p className="text-sm text-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </Section>

          <Separator className="bg-border/30" />

          {/* Five-C Evaluation */}
          <Section title="4. Five-C Evaluation" id="fivec" active={activeSection}>
            <div className="space-y-3">
              {app.fiveCsScores.map(c => (
                <div key={c.name} className="flex items-center justify-between p-3.5 bg-muted/20 rounded-xl border border-border/20">
                  <span className="text-sm font-medium text-foreground">{c.name}</span>
                  <div className="flex items-center gap-4">
                    <div className="w-28 h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.score >= 70 ? "bg-risk-low" : c.score >= 50 ? "bg-risk-medium" : "bg-risk-high"}`} style={{ width: `${c.score}%` }} />
                    </div>
                    <span className="text-sm font-bold text-foreground w-8 text-right">{c.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Separator className="bg-border/30" />

          {/* Recommendation */}
          <Section title="5. Final Recommendation" id="recommendation" active={activeSection}>
            <div className={`p-6 rounded-2xl bg-${decisionColor}/5 border border-${decisionColor}/20 text-center space-y-4`}>
              <div className="flex items-center justify-center gap-2">
                <DecisionIcon className={`h-6 w-6 text-${decisionColor}`} />
                <span className={`text-xl font-bold text-${decisionColor}`}>{app.recommendation.toUpperCase()}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ["Suggested Limit", app.suggestedLimit],
                  ["Interest Rate", app.interestRate],
                  ["Risk Score", `${app.riskScore}`],
                  ["Default Prob", `${(app.defaultProbability * 100).toFixed(0)}%`],
                ].map(([label, value]) => (
                  <div key={label as string} className="p-3 bg-muted/20 rounded-xl border border-border/20">
                    <p className="text-lg font-bold text-foreground">{value}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </motion.div>
      </div>
    </div>
  );
}

function Section({ title, id, active, children }: { title: string; id: string; active: string; children: React.ReactNode }) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0.7 }}
      animate={{ opacity: active === id ? 1 : 0.6 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </motion.div>
  );
}
