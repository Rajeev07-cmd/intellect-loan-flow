import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FileDown, Share2, Download, Loader2, CheckCircle, XCircle, AlertTriangle, FileText, Shield, Building2, BarChart3, Gavel, Save, Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useApplicationStore } from "@/store/useApplicationStore";
import { ActiveApplicationBanner, NoApplicationSelected } from "@/components/ActiveApplicationBanner";
import { saveCamReport, getCamReport } from "@/services/camReports";
import { generateCam, getCamReport as getCamFromGenService } from "@/services/camGeneration";
import { logAuditEvent } from "@/services/auditLog";
import { createNotification } from "@/services/notifications";
import { ProcessingBanner } from "@/components/ui/processing-status";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const outlineItems = [
  { id: "overview", label: "Company Overview", icon: Building2 },
  { id: "financial", label: "Financial Analysis", icon: BarChart3 },
  { id: "risk", label: "Risk Analysis", icon: Shield },
  { id: "fivec", label: "Five-C Evaluation", icon: FileText },
  { id: "recommendation", label: "Recommendation", icon: Gavel },
];

function buildCamData(app: any) {
  return {
    companyOverview: [
      ["Company Name", app.company],
      ["CIN", app.cin || "N/A"],
      ["Sector", app.sector],
      ["Incorporated", app.incorporationYear || "N/A"],
      ["Registered Office", app.registeredOffice || "N/A"],
      ["Promoter Group", app.promoterGroup || "N/A"],
      ["CIBIL Score", String(app.cibilScore ?? "N/A")],
      ["Facility Requested", `₹${app.loanAmount} Cr Term Loan`],
    ],
    financials: [
      ["Revenue", app.financials?.revenue || "N/A"],
      ["Outstanding Debt", app.financials?.outstandingDebt || "N/A"],
      ["DSCR", app.financials?.dscr ? `${app.financials.dscr}x` : "N/A"],
      ["Debt/Equity", app.financials?.debtEquity ? `${app.financials.debtEquity}x` : "N/A"],
      ["Related Party Txn", app.financials?.relatedPartyTransactions || "N/A"],
      ["GST Mismatch", app.financials?.gstMismatch ? app.financials.gstMismatchAmount : "None"],
    ],
    riskItems: (app.explainableAI || []).map((item: any) => `[${item.severity.toUpperCase()}] ${item.text}`),
    fiveCScores: (app.fiveCsScores || []).map((c: any) => [c.name, String(c.score), `${c.weight}%`, String(c.contribution.toFixed(1))]),
    recommendation: app.recommendation || "Under Review",
    suggestedLimit: app.suggestedLimit || "N/A",
    interestRate: app.interestRate || "N/A",
    riskScore: String(app.riskScore ?? "N/A"),
    defaultProb: app.defaultProbability != null ? `${(app.defaultProbability * 100).toFixed(0)}%` : "N/A",
  };
}

function generatePDF(app: any): void {
  const cam = buildCamData(app);
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("CREDIT APPRAISAL MEMO", pageWidth / 2, 20, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Confidential — For Internal Use Only", pageWidth / 2, 27, { align: "center" });
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 32, { align: "center" });

  let y = 40;

  // Section 1 - Company Overview
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("1. Company Overview", 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Field", "Value"]],
    body: cam.companyOverview,
    theme: "grid",
    headStyles: { fillColor: [41, 65, 148] },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Section 2 - Financial Analysis
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("2. Financial Analysis", 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: cam.financials,
    theme: "grid",
    headStyles: { fillColor: [41, 65, 148] },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Section 3 - Risk Analysis
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("3. Risk Analysis", 14, y);
  y += 7;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  cam.riskItems.forEach((item: string) => {
    if (y > 270) { doc.addPage(); y = 20; }
    const lines = doc.splitTextToSize(`• ${item}`, pageWidth - 28);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 2;
  });
  y += 5;

  // Section 4 - Five-C Evaluation
  if (y > 230) { doc.addPage(); y = 20; }
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("4. Five-C Evaluation", 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Parameter", "Score", "Weight", "Contribution"]],
    body: cam.fiveCScores,
    theme: "grid",
    headStyles: { fillColor: [41, 65, 148] },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Section 5 - Recommendation
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("5. Final Recommendation", 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["", ""]],
    body: [
      ["Recommendation", cam.recommendation],
      ["Suggested Limit", cam.suggestedLimit],
      ["Interest Rate", cam.interestRate],
      ["Risk Score", cam.riskScore],
      ["Default Probability", cam.defaultProb],
    ],
    theme: "grid",
    headStyles: { fillColor: [41, 65, 148] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`CAM_${app.company.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

function generateWord(app: any): void {
  const cam = buildCamData(app);

  const tableRow = (cells: string[]) =>
    `<tr>${cells.map(c => `<td style="padding:6px;border:1px solid #ccc;">${c}</td>`).join("")}</tr>`;

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><title>CAM Report</title>
    <style>body{font-family:Calibri,sans-serif;padding:40px;} h1{text-align:center;font-size:18px;} h2{font-size:14px;margin-top:24px;color:#294194;} table{border-collapse:collapse;width:100%;margin-top:8px;} th{background:#294194;color:#fff;padding:6px;border:1px solid #294194;text-align:left;} .subtitle{text-align:center;font-size:10px;color:#666;}</style>
    </head><body>
    <h1>CREDIT APPRAISAL MEMO</h1>
    <p class="subtitle">Confidential — For Internal Use Only | Generated: ${new Date().toLocaleDateString()}</p>

    <h2>1. Company Overview</h2>
    <table><tr><th>Field</th><th>Value</th></tr>
    ${cam.companyOverview.map(r => tableRow(r)).join("")}
    </table>

    <h2>2. Financial Analysis</h2>
    <table><tr><th>Metric</th><th>Value</th></tr>
    ${cam.financials.map(r => tableRow(r)).join("")}
    </table>

    <h2>3. Risk Analysis</h2>
    <ul>${cam.riskItems.map((item: string) => `<li>${item}</li>`).join("")}</ul>

    <h2>4. Five-C Evaluation</h2>
    <table><tr><th>Parameter</th><th>Score</th><th>Weight</th><th>Contribution</th></tr>
    ${cam.fiveCScores.map((r: string[]) => tableRow(r)).join("")}
    </table>

    <h2>5. Final Recommendation</h2>
    <table><tr><th>Field</th><th>Value</th></tr>
    ${[["Recommendation", cam.recommendation], ["Suggested Limit", cam.suggestedLimit], ["Interest Rate", cam.interestRate], ["Risk Score", cam.riskScore], ["Default Probability", cam.defaultProb]].map(r => tableRow(r)).join("")}
    </table>
    </body></html>`;

  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `CAM_${app.company.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CamGenerator() {
  const { toast } = useToast();
  const { selectedApplication } = useApplicationStore();
  const [exporting, setExporting] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [saving, setSaving] = useState(false);
  const [savedToDb, setSavedToDb] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareNote, setShareNote] = useState("");
  const [sharing, setSharing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genComplete, setGenComplete] = useState(false);

  if (!selectedApplication) return <NoApplicationSelected />;

  const app = selectedApplication;
  const overallScore = app.fiveCsScores?.reduce((sum, c) => sum + c.contribution, 0) ?? 0;

  const handleExportPDF = async () => {
    setExporting("PDF");
    try {
      generatePDF(app);
      await logAuditEvent("CAM Exported", `CAM exported as PDF for ${app.company}`, app.id, "Credit Officer");
      toast({ title: "PDF Downloaded", description: `CAM report for ${app.company} saved as PDF.` });
    } catch (e) {
      toast({ title: "Export Failed", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  const handleExportWord = async () => {
    setExporting("Word");
    try {
      generateWord(app);
      await logAuditEvent("CAM Exported", `CAM exported as Word for ${app.company}`, app.id, "Credit Officer");
      toast({ title: "Word Downloaded", description: `CAM report for ${app.company} saved as .doc.` });
    } catch (e) {
      toast({ title: "Export Failed", description: "Could not generate Word document.", variant: "destructive" });
    } finally {
      setExporting(null);
    }
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
        company_overview: `${app.company} — ${app.sector} — CIN: ${app.cin || "N/A"}`,
        financial_analysis: `Revenue: ${app.financials?.revenue || "N/A"}, DSCR: ${app.financials?.dscr || "N/A"}x, D/E: ${app.financials?.debtEquity || "N/A"}x`,
        risk_analysis: (app.explainableAI || []).map((e: any) => e.text).join("; "),
        recommendation: app.recommendation,
        suggested_loan_limit: app.suggestedLimit || "N/A",
        interest_rate: app.interestRate || "N/A",
      });
      setSavedToDb(true);
      toast({ title: "CAM Saved", description: "Report saved to database successfully." });
    } catch (e) {
      toast({ title: "Save Failed", description: "Could not save CAM report.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      // Create notification for the committee
      await createNotification(
        "CAM Report Shared for Review",
        `CAM report for ${app.company} (₹${app.loanAmount} Cr) has been shared for committee review.${shareNote ? ` Note: ${shareNote}` : ""}`,
        "info",
        /^[0-9a-f]{8}-/i.test(app.id) ? app.id : undefined
      );
      await logAuditEvent(
        "CAM Shared",
        `CAM report shared for ${app.company}${shareNote ? ` — Note: ${shareNote}` : ""}`,
        /^[0-9a-f]{8}-/i.test(app.id) ? app.id : undefined,
        "Credit Officer"
      );
      toast({ title: "Shared Successfully", description: "CAM report shared with the review committee." });
      setShareDialogOpen(false);
      setShareNote("");
    } catch (e) {
      toast({ title: "Share Failed", description: "Could not share the report.", variant: "destructive" });
    } finally {
      setSharing(false);
    }
  };

  const handleCopyToClipboard = () => {
    const cam = buildCamData(app);
    const text = `CREDIT APPRAISAL MEMO — ${app.company}\n\nSector: ${app.sector}\nLoan: ₹${app.loanAmount} Cr\nRisk Score: ${cam.riskScore}\nRecommendation: ${cam.recommendation}\nSuggested Limit: ${cam.suggestedLimit}\nInterest Rate: ${cam.interestRate}\nDefault Probability: ${cam.defaultProb}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "CAM summary copied to clipboard." });
  };

  const DecisionIcon = app.recommendation === "Approve" ? CheckCircle :
    app.recommendation === "Reject" ? XCircle : AlertTriangle;
  const decisionColor = app.recommendation === "Approve" ? "risk-low" :
    app.recommendation === "Reject" ? "risk-high" : "risk-medium";

  return (
    <div className="space-y-6">
      <ActiveApplicationBanner />
      <ProcessingBanner
        state={generating ? "processing" : genComplete ? "success" : (exporting ? "processing" : "idle")}
        processingText={exporting ? `Generating ${exporting}...` : "Generating Credit Appraisal Memo..."}
        successText="CAM Generated Successfully ✔"
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Credit Appraisal Memo</h1>
          <p className="text-sm text-muted-foreground mt-1">{app.company} — Generated on {new Date().toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-2 rounded-xl" disabled={exporting === "PDF"} onClick={handleExportPDF}>
            {exporting === "PDF" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />} Export PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl" disabled={exporting === "Word"} onClick={handleExportWord}>
            {exporting === "Word" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Word
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={handleSaveToDb} disabled={saving || savedToDb}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : savedToDb ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : savedToDb ? "Saved" : "Save to DB"}
          </Button>
          <Button size="sm" className="gap-2 rounded-xl" onClick={() => setShareDialogOpen(true)}>
            <Share2 className="h-4 w-4" /> Share
          </Button>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share CAM Report</DialogTitle>
            <DialogDescription>Share this Credit Appraisal Memo with the review committee.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-muted/30 rounded-xl border border-border/30 text-sm">
              <p className="font-medium text-foreground">{app.company}</p>
              <p className="text-muted-foreground text-xs">₹{app.loanAmount} Cr • {app.sector} • {app.recommendation}</p>
            </div>
            <Textarea
              placeholder="Add a note for the committee (optional)..."
              value={shareNote}
              onChange={e => setShareNote(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleCopyToClipboard}>
                <Copy className="h-4 w-4" /> Copy Summary
              </Button>
              <Button size="sm" className="gap-2 ml-auto" onClick={handleShare} disabled={sharing}>
                {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                {sharing ? "Sharing..." : "Share with Committee"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Split Layout: Outline + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        {/* Left Outline */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-4 h-fit sticky top-20">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3 px-2">CAM Outline</p>
          <div className="space-y-1">
            {outlineItems.map((item) => {
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
                ["CIN", app.cin || "N/A"],
                ["Sector", app.sector],
                ["Incorporated", app.incorporationYear || "N/A"],
                ["Registered Office", app.registeredOffice || "N/A"],
                ["Promoter Group", app.promoterGroup || "N/A"],
                ["CIBIL Score", String(app.cibilScore ?? "N/A")],
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
                ["Revenue", app.financials?.revenue || "N/A"],
                ["Outstanding Debt", app.financials?.outstandingDebt || "N/A"],
                ["DSCR", app.financials?.dscr ? `${app.financials.dscr}x` : "N/A"],
                ["Debt/Equity", app.financials?.debtEquity ? `${app.financials.debtEquity}x` : "N/A"],
                ["Related Party Txn", app.financials?.relatedPartyTransactions || "N/A"],
                ["GST Mismatch", app.financials?.gstMismatch ? app.financials.gstMismatchAmount : "None"],
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
              {(app.explainableAI || []).length === 0 && (
                <p className="text-sm text-muted-foreground italic">No risk signals available.</p>
              )}
              {(app.explainableAI || []).map((item, i) => (
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
              {(app.fiveCsScores || []).length === 0 && (
                <p className="text-sm text-muted-foreground italic">No Five-C scores available.</p>
              )}
              {(app.fiveCsScores || []).map((c) => (
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
                <span className={`text-xl font-bold text-${decisionColor}`}>{(app.recommendation || "Under Review").toUpperCase()}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ["Suggested Limit", app.suggestedLimit || "N/A"],
                  ["Interest Rate", app.interestRate || "N/A"],
                  ["Risk Score", `${app.riskScore ?? "N/A"}`],
                  ["Default Prob", app.defaultProbability != null ? `${(app.defaultProbability * 100).toFixed(0)}%` : "N/A"],
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
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="scroll-mt-24"
    >
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </motion.div>
  );
}
