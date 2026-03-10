import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FileSearch, CheckCircle2, Edit, RotateCcw, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useApplicationStore } from "@/store/useApplicationStore";
import { ActiveApplicationBanner, NoApplicationSelected } from "@/components/ActiveApplicationBanner";
import { supabase } from "@/integrations/supabase/client";
import { ProcessingBanner } from "@/components/ui/processing-status";

const DOCUMENT_TYPES = [
  "PAN Card", "GST Certificate", "Certificate of Incorporation", "Financial Statement",
  "Balance Sheet", "Profit & Loss Statement", "Cash Flow Statement", "Annual Report",
  "Director KYC", "Board Resolution", "MOA/AOA", "Bank Statement", "ITR Filing",
  "Audit Report", "Shareholding Pattern", "ALM Report", "Borrowing Profile", "Portfolio Performance",
];

interface Classification {
  id: string;
  document_id: string;
  document_name: string;
  ai_predicted_type: string;
  confidence_score: number;
  user_decision: string;
  editing?: boolean;
  editType?: string;
}

export default function DocumentClassification() {
  const { selectedApplication } = useApplicationStore();
  const { toast } = useToast();
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [classifying, setClassifying] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load existing classifications
  useEffect(() => {
    if (!selectedApplication) return;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("document_classifications")
        .select("*, documents(document_name)")
        .eq("application_id", selectedApplication.id);

      if (!error && data) {
        setClassifications(data.map((d: any) => ({
          id: d.id,
          document_id: d.document_id,
          document_name: d.documents?.document_name || "Unknown",
          ai_predicted_type: d.ai_predicted_type,
          confidence_score: Number(d.confidence_score),
          user_decision: d.user_decision,
        })));
      }
      setLoading(false);
    };
    load();
  }, [selectedApplication]);

  const runClassification = useCallback(async () => {
    if (!selectedApplication) return;
    const isUUID = /^[0-9a-f]{8}-/i.test(selectedApplication.id);
    if (!isUUID) {
      toast({ title: "Demo Application", description: "Classification only works with database applications.", variant: "destructive" });
      return;
    }

    setClassifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("classify-documents", {
        body: { application_id: selectedApplication.id },
      });
      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      // Reload classifications
      const { data: updated } = await supabase
        .from("document_classifications")
        .select("*, documents(document_name)")
        .eq("application_id", selectedApplication.id);

      if (updated) {
        setClassifications(updated.map((d: any) => ({
          id: d.id,
          document_id: d.document_id,
          document_name: d.documents?.document_name || "Unknown",
          ai_predicted_type: d.ai_predicted_type,
          confidence_score: Number(d.confidence_score),
          user_decision: d.user_decision,
        })));
      }

      toast({ title: "Classification Complete", description: `${data.classifications?.length || 0} documents classified by AI.` });
    } catch (e: any) {
      toast({ title: "Classification Failed", description: e.message, variant: "destructive" });
    } finally {
      setClassifying(false);
    }
  }, [selectedApplication, toast]);

  const approveClassification = async (id: string) => {
    await supabase.from("document_classifications").update({ user_decision: "approved" }).eq("id", id);
    setClassifications(prev => prev.map(c => c.id === id ? { ...c, user_decision: "approved" } : c));
    toast({ title: "Approved", description: "Classification approved." });
  };

  const saveEdit = async (id: string, newType: string) => {
    await supabase.from("document_classifications").update({
      ai_predicted_type: newType,
      user_decision: "edited",
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    setClassifications(prev => prev.map(c => c.id === id ? { ...c, ai_predicted_type: newType, user_decision: "edited", editing: false } : c));
    toast({ title: "Updated", description: "Classification updated." });
  };

  const toggleEdit = (id: string) => {
    setClassifications(prev => prev.map(c =>
      c.id === id ? { ...c, editing: !c.editing, editType: c.ai_predicted_type } : c
    ));
  };

  if (!selectedApplication) return <NoApplicationSelected />;

  const approved = classifications.filter(c => c.user_decision === "approved").length;
  const pending = classifications.filter(c => c.user_decision === "pending").length;

  return (
    <div className="space-y-6 animate-slide-up">
      <ActiveApplicationBanner />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Document Classification</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedApplication.company} — AI-powered document type detection
          </p>
        </div>
        <Button className="gap-2" onClick={runClassification} disabled={classifying}>
          {classifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {classifying ? "Classifying..." : "Run AI Classification"}
        </Button>
      </div>

      <ProcessingBanner
        state={classifying ? "processing" : "idle"}
        processingText="AI is analyzing document types..."
        successText="Classification complete"
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Documents", value: classifications.length, icon: FileSearch, color: "text-primary" },
          { label: "Approved", value: approved, icon: CheckCircle2, color: "text-risk-low" },
          { label: "Pending Review", value: pending, icon: AlertTriangle, color: "text-risk-medium" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="glass-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-2.5 rounded-lg bg-muted/50 ${kpi.color}`}><kpi.icon className="h-5 w-5" /></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm">Classification Results</CardTitle>
          <CardDescription className="text-xs">Review and approve AI-predicted document types</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
            </div>
          ) : classifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileSearch className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No classifications yet. Upload documents first, then run AI classification.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>AI Predicted Type</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classifications.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-sm">{c.document_name}</TableCell>
                    <TableCell>
                      {c.editing ? (
                        <Select value={c.editType || c.ai_predicted_type} onValueChange={(v) => setClassifications(prev => prev.map(x => x.id === c.id ? { ...x, editType: v } : x))}>
                          <SelectTrigger className="w-48 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className="text-xs">{c.ai_predicted_type}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${c.confidence_score >= 80 ? "bg-risk-low" : c.confidence_score >= 50 ? "bg-risk-medium" : "bg-risk-high"}`}
                            style={{ width: `${c.confidence_score}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{c.confidence_score}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          c.user_decision === "approved" ? "text-risk-low border-risk-low/30" :
                          c.user_decision === "edited" ? "text-primary border-primary/30" :
                          "text-risk-medium border-risk-medium/30"
                        }`}
                      >
                        {c.user_decision === "approved" ? "✔ Approved" : c.user_decision === "edited" ? "✎ Edited" : "⏳ Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {c.editing ? (
                          <>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => saveEdit(c.id, c.editType || c.ai_predicted_type)}>
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toggleEdit(c.id)}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            {c.user_decision === "pending" && (
                              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-risk-low" onClick={() => approveClassification(c.id)}>
                                <CheckCircle2 className="h-3 w-3" /> Approve
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => toggleEdit(c.id)}>
                              <Edit className="h-3 w-3" /> Edit
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
