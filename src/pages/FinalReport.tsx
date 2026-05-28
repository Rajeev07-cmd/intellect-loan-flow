import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Loader2, CheckCircle2, AlertCircle, Building2, Shield, ShieldAlert, Target, BookOpen, Gavel, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useApplicationStore } from "@/store/useApplicationStore";
import { ActiveApplicationBanner, NoApplicationSelected } from "@/components/ActiveApplicationBanner";
import { fetchFinalReportData, generateFinalReportPdf, type FinalReportData } from "@/services/finalReport";

const sectionCheck = (label: string, present: boolean, icon: any) => ({ label, present, icon });

export default function FinalReport() {
  const { selectedApplication } = useApplicationStore();
  const { toast } = useToast();
  const [data, setData] = useState<FinalReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!selectedApplication) return;
    setLoading(true);
    fetchFinalReportData(selectedApplication.id)
      .then(setData)
      .catch((e) => toast({ title: "Failed to load report data", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [selectedApplication, toast]);

  const handleDownload = async () => {
    if (!data) return;
    setDownloading(true);
    try {
      const blob = await generateFinalReportPdf(data);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Final_Investment_Report_${data.application?.company_name?.replace(/\s+/g, "_") || "report"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Report downloaded", description: "Final investment report is ready." });
    } catch (e: any) {
      toast({ title: "PDF generation failed", description: e.message, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  if (!selectedApplication) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Final Investment Report</h1>
          <p className="text-muted-foreground mt-1">Comprehensive credit assessment combining all analyses.</p>
        </div>
        <NoApplicationSelected />
      </div>
    );
  }

  const app = data?.application;
  const checks = data ? [
    sectionCheck("Entity Summary", !!app, Building2),
    sectionCheck("Risk Analysis", !!data.risk, Shield),
    sectionCheck("Financial Profile", !!data.financials, Sparkles),
    sectionCheck("AML / Compliance", !!data.aml, ShieldAlert),
    sectionCheck("SWOT Analysis", !!data.swot, Target),
    sectionCheck("CAM Report", !!data.cam, BookOpen),
    sectionCheck("Documents", (data.documents?.length || 0) > 0, FileText),
    sectionCheck("Decision", !!(app?.credit_officer_decision || app?.manager_decision), Gavel),
  ] : [];

  const completeness = checks.length ? Math.round((checks.filter(c => c.present).length / checks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Final Investment Report</h1>
          <p className="text-muted-foreground mt-1">All analyses consolidated into a downloadable credit report.</p>
        </div>
        <Button onClick={handleDownload} disabled={!data || downloading || loading} size="lg">
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {downloading ? "Generating..." : "Download PDF"}
        </Button>
      </div>

      <ActiveApplicationBanner />

      {loading || !data ? (
        <Card><CardContent className="p-12 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading consolidated data...
        </CardContent></Card>
      ) : (
        <>
          {/* Header summary */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 border-b border-border/40">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Subject Entity</p>
                    <h2 className="text-2xl font-bold mt-1">{app?.company_name}</h2>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline">{app?.sector}</Badge>
                      <Badge variant="outline">CIN: {app?.cin || "-"}</Badge>
                      <Badge variant="outline">{app?.status}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Loan Requested</p>
                    <p className="text-2xl font-bold mt-1">₹{Number(app?.loan_amount || 0).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <Metric label="Risk Score" value={data.risk?.risk_score ?? app?.risk_score ?? "-"} />
                <Metric label="Risk Category" value={data.risk?.risk_category || app?.risk_category || "-"} />
                <Metric label="AML Level" value={data.aml?.aml_risk_level || "Not Run"} />
                <Metric label="Recommendation" value={data.cam?.recommendation || app?.recommendation || "Under Review"} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Completeness */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Report Completeness</CardTitle>
                <Badge variant={completeness === 100 ? "default" : "outline"}>{completeness}%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {checks.map(({ label, present, icon: Icon }) => (
                  <div key={label} className={`flex items-center gap-3 p-3 rounded-lg border ${present ? "border-risk-low/30 bg-risk-low/5" : "border-border/50 bg-muted/20"}`}>
                    <Icon className={`h-4 w-4 ${present ? "text-risk-low" : "text-muted-foreground"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{label}</p>
                      <p className="text-[10px] text-muted-foreground">{present ? "Included" : "Missing"}</p>
                    </div>
                    {present ? <CheckCircle2 className="h-4 w-4 text-risk-low" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                  </div>
                ))}
              </div>
              {completeness < 100 && (
                <p className="text-xs text-muted-foreground mt-4">
                  Tip: missing sections will appear blank in the PDF. Run them from their respective modules for a complete report.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Preview of key sections */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Risk Snapshot</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row k="Score" v={String(data.risk?.risk_score ?? app?.risk_score ?? "-")} />
                <Row k="Category" v={data.risk?.risk_category || app?.risk_category || "-"} />
                <Row k="Default Probability" v={data.risk?.default_probability != null ? `${(Number(data.risk.default_probability) * 100).toFixed(2)}%` : "-"} />
                <Row k="CIBIL Score" v={String(app?.cibil_score ?? "-")} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Compliance</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row k="AML Score" v={String(data.aml?.aml_risk_score ?? "-")} />
                <Row k="AML Level" v={data.aml?.aml_risk_level || "Not Run"} />
                <Row k="Sanction Match" v={data.aml?.sanction_match ? "Yes" : "No"} />
                <Row k="PEP Detected" v={data.aml?.pep_detected ? "Yes" : "No"} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" /> CAM Summary</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row k="Recommendation" v={data.cam?.recommendation || "-"} />
                <Row k="Suggested Limit" v={data.cam?.suggested_loan_limit || app?.suggested_limit || "-"} />
                <Row k="Interest Rate" v={data.cam?.interest_rate || app?.interest_rate || "-"} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Gavel className="h-4 w-4" /> Decision</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row k="Credit Officer" v={app?.credit_officer_decision || "Pending"} />
                <Row k="Manager" v={app?.manager_decision || "Pending"} />
                <Row k="Final Status" v={app?.final_status || "Pending"} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold mt-1">{String(value)}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/30 pb-1.5">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right truncate ml-3">{v}</span>
    </div>
  );
}
