import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert, ShieldCheck, ShieldX, AlertTriangle, CheckCircle2,
  XCircle, Loader2, Search, FileWarning,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useApplicationStore } from "@/store/useApplicationStore";
import { runAmlScreening, getAmlResults, type AmlResult } from "@/services/amlScreening";

function CheckRow({ label, passed, warning }: { label: string; passed: boolean; warning?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm font-medium">{label}</span>
      {warning ? (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
          <AlertTriangle className="h-3 w-3 mr-1" /> Warning
        </Badge>
      ) : passed ? (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
          <CheckCircle2 className="h-3 w-3 mr-1" /> Passed
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
          <XCircle className="h-3 w-3 mr-1" /> High Risk
        </Badge>
      )}
    </div>
  );
}

export function AmlScreeningPanel() {
  const { selectedApplication } = useApplicationStore();
  const { toast } = useToast();
  const [result, setResult] = useState<AmlResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const appId = selectedApplication?.id;
  const isUUID = appId && /^[0-9a-f]{8}-/i.test(appId);

  useEffect(() => {
    if (!isUUID) { setFetching(false); return; }
    getAmlResults(appId!).then(r => { if (r) setResult(r); setFetching(false); });
  }, [appId, isUUID]);

  const handleRunScreening = async () => {
    if (!isUUID || !selectedApplication) return;
    setLoading(true);
    try {
      const directors = selectedApplication.comments
        ?.map(c => c.author)
        .filter(Boolean) || [];
      const r = await runAmlScreening(
        appId!,
        selectedApplication.company,
        directors.length > 0 ? directors : ["Director 1"]
      );
      setResult(r);
      toast({
        title: "AML Screening Complete",
        description: `AML Score: ${r.aml_risk_score} — ${r.aml_risk_level} Risk`,
      });
    } catch (err: any) {
      toast({ title: "AML Screening Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const riskColor = result?.aml_risk_level === "High"
    ? "text-destructive"
    : result?.aml_risk_level === "Medium"
    ? "text-yellow-600"
    : "text-green-600";

  const RiskIcon = result?.aml_risk_level === "High"
    ? ShieldX
    : result?.aml_risk_level === "Medium"
    ? ShieldAlert
    : ShieldCheck;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Compliance & AML Screening
            </CardTitle>
            <CardDescription>Anti-Money Laundering & fraud monitoring checks</CardDescription>
          </div>
          <Button
            onClick={handleRunScreening}
            disabled={loading || !isUUID}
            size="sm"
          >
            {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
            {loading ? "Screening..." : "Run AML Screening"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {fetching ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading AML data...
          </div>
        ) : !result ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShieldAlert className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No AML screening performed yet.</p>
            <p className="text-xs">Click "Run AML Screening" to check compliance.</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* High Risk Alert */}
            {result.aml_risk_level === "High" && (
              <Alert variant="destructive">
                <FileWarning className="h-4 w-4" />
                <AlertTitle>⚠ Compliance Alert</AlertTitle>
                <AlertDescription>
                  This company has high AML risk. Additional due diligence required before approval.
                </AlertDescription>
              </Alert>
            )}

            {/* Score Display */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <RiskIcon className={`h-10 w-10 ${riskColor}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">AML Risk Score</span>
                  <span className={`text-2xl font-bold ${riskColor}`}>{result.aml_risk_score}</span>
                </div>
                <Progress
                  value={result.aml_risk_score}
                  className="h-2"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">Low Risk</span>
                  <Badge variant="outline" className={riskColor}>
                    {result.aml_risk_level} Risk
                  </Badge>
                  <span className="text-xs text-muted-foreground">High Risk</span>
                </div>
              </div>
            </div>

            {/* Check Results */}
            <div className="rounded-lg border border-border/50 p-3">
              <h4 className="text-sm font-semibold mb-2">Screening Results</h4>
              <CheckRow
                label="Sanction List Check"
                passed={!result.sanction_match}
                warning={false}
              />
              <CheckRow
                label="PEP Screening"
                passed={!result.pep_detected}
                warning={result.pep_detected}
              />
              <CheckRow
                label="Fraud History Check"
                passed={!result.fraud_history}
                warning={false}
              />
            </div>

            {/* Flags */}
            {result.flags.length > 0 && (
              <div className="rounded-lg border border-border/50 p-3">
                <h4 className="text-sm font-semibold mb-2">AML Flags</h4>
                <div className="space-y-1.5">
                  {result.flags.map((flag, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <AlertTriangle className="h-3 w-3 mt-0.5 text-yellow-500 shrink-0" />
                      <span className="text-muted-foreground">{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
