import { useState } from "react";
import { motion } from "framer-motion";
import { FileDown, Share2, FileText, CheckCircle, XCircle, AlertTriangle, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { fiveCsScores, extractedData } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

const overallScore = fiveCsScores.reduce((sum, c) => sum + c.contribution, 0);

export default function CamGenerator() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = (format: string) => {
    setExporting(format);
    toast({ title: `Generating ${format}...`, description: "Please wait while the document is being prepared." });
    setTimeout(() => {
      setExporting(null);
      toast({ title: `${format} Ready`, description: `Credit Appraisal Memo has been exported as ${format}. Download started.` });
    }, 2000);
  };

  const handleShare = () => {
    toast({ title: "Shared with Committee", description: "CAM report has been shared with the Credit Committee for review." });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Credit Appraisal Memo</h1>
          <p className="text-sm text-muted-foreground mt-1">Generated on March 3, 2026 • Draft v2.1</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-border/50 text-muted-foreground hover:text-foreground"
            disabled={exporting === "PDF"}
            onClick={() => handleExport("PDF")}
          >
            {exporting === "PDF" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />} Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-border/50 text-muted-foreground hover:text-foreground"
            disabled={exporting === "Word"}
            onClick={() => handleExport("Word")}
          >
            {exporting === "Word" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Word
          </Button>
          <Button size="sm" className="gap-2 bg-primary text-primary-foreground" onClick={handleShare}>
            <Share2 className="h-4 w-4" /> Share with Committee
          </Button>
        </div>
      </div>

      {/* CAM Document */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 space-y-8">
        {/* Header */}
        <div className="text-center border-b border-border/50 pb-6">
          <h2 className="text-xl font-bold text-foreground">COMPREHENSIVE CREDIT APPRAISAL MEMO</h2>
          <p className="text-sm text-muted-foreground mt-1">Confidential — For Internal Use Only</p>
        </div>

        {/* Company Overview */}
        <Section title="1. Company Overview">
          <div className="grid grid-cols-2 gap-4">
            {[
              ["Company Name", "Tata Steel Limited"],
              ["CIN", "L27100MH1907PLC000260"],
              ["Sector", "Steel & Metals"],
              ["Incorporated", "1907"],
              ["Registered Office", "Mumbai, Maharashtra"],
              ["Promoter Group", "Tata Group"],
              ["CIBIL Score", extractedData.cibilScore.toString()],
              ["Facility Requested", "₹500 Cr Term Loan"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between p-2 bg-muted/20 rounded">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-medium text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </Section>

        <Separator className="bg-border/30" />

        {/* Financial Summary */}
        <Section title="2. Financial Analysis">
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Revenue", extractedData.revenue],
              ["Outstanding Debt", extractedData.outstandingDebt],
              ["DSCR", `${extractedData.dscr}x`],
              ["Debt/Equity", `${extractedData.debtEquity}x`],
              ["Related Party Txn", extractedData.relatedPartyTransactions],
              ["GST Mismatch", extractedData.gstMismatchAmount || "None"],
            ].map(([label, value]) => (
              <div key={label as string} className="p-3 bg-muted/20 rounded-lg text-center">
                <p className="text-lg font-bold text-foreground">{value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
        </Section>

        <Separator className="bg-border/30" />

        {/* Five Cs */}
        <Section title="3. Five Cs Risk Analysis">
          <div className="space-y-3">
            {fiveCsScores.map((c) => (
              <div key={c.name} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <span className="text-sm font-medium text-foreground">{c.name}</span>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${c.score >= 70 ? "bg-risk-low" : c.score >= 50 ? "bg-risk-medium" : "bg-risk-high"}`} style={{ width: `${c.score}%` }} />
                  </div>
                  <span className="text-sm font-bold text-foreground w-8">{c.score}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Separator className="bg-border/30" />

        {/* Decision */}
        <Section title="4. Final Recommendation">
          <div className="p-6 rounded-xl bg-risk-medium/5 border border-risk-medium/20 text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="h-6 w-6 text-risk-medium" />
              <span className="text-xl font-bold text-risk-medium">CONDITIONAL APPROVAL</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ["Recommended Limit", "₹350 Cr"],
                ["Interest Rate", "10.5% p.a."],
                ["Risk Premium", "+150 bps"],
                ["Confidence", "78%"],
              ].map(([label, value]) => (
                <div key={label as string} className="p-3 bg-muted/20 rounded-lg">
                  <p className="text-lg font-bold text-foreground">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground max-w-lg mx-auto">
              Conditional approval recommended subject to collateral reassessment, resolution of GST mismatch (₹23.5 Cr), 
              and improved factory capacity utilization above 60%.
            </p>
          </div>
        </Section>
      </motion.div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  );
}
