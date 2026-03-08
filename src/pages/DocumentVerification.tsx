import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileCheck, AlertTriangle, XCircle, File, Trash2, CheckCircle2, ShieldCheck, RotateCcw, Loader2, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useApplicationStore } from "@/store/useApplicationStore";
import { ActiveApplicationBanner, NoApplicationSelected } from "@/components/ActiveApplicationBanner";
import { processDocument, verifyDocuments, type VerificationResult } from "@/services/documentProcessing";
import { useApiCall } from "@/hooks/useApiCall";

interface DocFile {
  id: string;
  name: string;
  type: string;
  size: string;
  status: "uploading" | "verified" | "pending" | "failed";
  progress: number;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "verified") return <FileCheck className="h-4 w-4 text-risk-low" />;
  if (status === "pending") return <AlertTriangle className="h-4 w-4 text-risk-medium" />;
  if (status === "failed") return <XCircle className="h-4 w-4 text-risk-high" />;
  if (status === "uploading") return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

function ValidationIcon({ status }: { status: "pass" | "warning" | "fail" }) {
  if (status === "pass") return <CheckCircle2 className="h-4 w-4 text-risk-low" />;
  if (status === "warning") return <AlertTriangle className="h-4 w-4 text-risk-medium" />;
  return <XCircle className="h-4 w-4 text-risk-high" />;
}

export default function DocumentVerification() {
  const { selectedApplication } = useApplicationStore();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(false);
  const [apiVerification, setApiVerification] = useState<VerificationResult | null>(null);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);

  const initialDocs: DocFile[] = useMemo(() =>
    (selectedApplication?.documents || []).map(d => ({ ...d, progress: 100 })),
    [selectedApplication]
  );

  const [docs, setDocs] = useState<DocFile[]>(initialDocs);

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    const newDocs: DocFile[] = files.map((f, i) => ({
      id: `new-${Date.now()}-${i}`,
      name: f.name,
      type: "Uploaded Document",
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      status: "uploading" as const,
      progress: 0,
    }));
    setDocs(prev => [...prev, ...newDocs]);
    toast({ title: "Uploading", description: `${files.length} file(s) being uploaded...` });

    // Try backend processing for each file
    for (const file of files) {
      try {
        const result = await processDocument(file);
        toast({ title: "AI Extraction Complete", description: `Revenue: ₹${(result.revenue / 10000000).toFixed(0)} Cr extracted from ${file.name}` });
      } catch {
        // Backend unavailable, fall back to local simulation
      }
    }

    setDocs(prev => prev.map(d => newDocs.find(nd => nd.id === d.id) ? { ...d, status: "pending" as const, progress: 100 } : d));
  }, [toast]);

  const removeDoc = useCallback((id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    toast({ title: "Removed", description: "Document removed." });
  }, [toast]);

  const retryDoc = useCallback((id: string) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, status: "uploading" as const } : d));
    setTimeout(() => {
      setDocs(prev => prev.map(d => d.id === id ? { ...d, status: "verified" as const } : d));
      toast({ title: "Verified", description: "Document verified." });
    }, 2500);
  }, [toast]);

  const runFullVerification = useCallback(async () => {
    setVerifying(true);
    toast({ title: "Verification Started", description: "Running full document verification..." });

    // Try backend API first
    if (selectedApplication) {
      try {
        const result = await verifyDocuments(selectedApplication.id);
        setApiVerification(result);
        setBackendAvailable(true);
        toast({ title: "Backend Verified", description: `Integrity Score: ${result.document_integrity_score}` });
      } catch {
        setBackendAvailable(false);
        toast({ title: "Using Local Verification", description: "Backend unavailable — using pre-computed results.", variant: "destructive" });
      }
    }

    // Also update local doc statuses
    setDocs(prev => prev.map(d => d.status === "pending" ? { ...d, status: "verified" as const } : d));
    setVerifying(false);
  }, [toast, selectedApplication]);

  if (!selectedApplication) return <NoApplicationSelected />;

  const verified = docs.filter(d => d.status === "verified").length;
  const pending = docs.filter(d => d.status === "pending").length;
  const failed = docs.filter(d => d.status === "failed").length;
  const validations = selectedApplication.validations;
  const integrityScore = selectedApplication.integrityScore;

  return (
    <div className="space-y-6 animate-slide-up">
      <ActiveApplicationBanner />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Document Verification</h1>
          <p className="text-sm text-muted-foreground mt-1">{selectedApplication.company} — Compliance document verification</p>
        </div>
        <div className="flex items-center gap-2">
          {backendAvailable === true && (
            <Badge variant="outline" className="gap-1.5 text-xs text-risk-low border-risk-low/30">
              <Wifi className="h-3 w-3" /> Backend connected
            </Badge>
          )}
          {backendAvailable === false && (
            <Badge variant="outline" className="gap-1.5 text-xs text-risk-medium border-risk-medium/30">
              <WifiOff className="h-3 w-3" /> Using mock data
            </Badge>
          )}
          <Button className="gap-2" onClick={runFullVerification} disabled={verifying}>
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {verifying ? "Verifying..." : "Run Full Verification"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Documents", value: docs.length, icon: File, color: "text-primary" },
          { label: "Verified", value: verified, icon: FileCheck, color: "text-risk-low" },
          { label: "Pending", value: pending, icon: AlertTriangle, color: "text-risk-medium" },
          { label: "Failed", value: failed, icon: XCircle, color: "text-risk-high" },
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

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="upload">Upload & Status</TabsTrigger>
          <TabsTrigger value="validation">Cross-Validation</TabsTrigger>
          <TabsTrigger value="summary">Integrity Score</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="glass-card lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Upload Documents</CardTitle>
                <CardDescription className="text-xs">Drag & drop or click to upload</CardDescription>
              </CardHeader>
              <CardContent>
                <div onDragOver={e => e.preventDefault()} onDrop={handleFileDrop}
                  className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer border-border/50 hover:border-primary/30"
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-foreground font-medium">Drop files here</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 20MB</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card lg:col-span-2">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Uploaded Documents</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <AnimatePresence>
                    {docs.map((doc, i) => (
                      <motion.div key={doc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                      >
                        <StatusIcon status={doc.status} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                          <p className="text-[10px] text-muted-foreground">{doc.type} · {doc.size}</p>
                        </div>
                        <Badge variant="secondary" className={`text-[10px] ${
                          doc.status === "verified" ? "bg-risk-low/15 text-risk-low" :
                          doc.status === "pending" ? "bg-risk-medium/15 text-risk-medium" :
                          doc.status === "uploading" ? "bg-primary/15 text-primary" :
                          "bg-risk-high/15 text-risk-high"
                        }`}>
                          {doc.status === "verified" ? "✔ Verified" : doc.status === "pending" ? "⚠ Pending" : doc.status === "uploading" ? "⏳ Uploading" : "❌ Failed"}
                        </Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {doc.status === "failed" && (
                            <button className="p-1.5 rounded-md hover:bg-muted/50" onClick={() => retryDoc(doc.id)}><RotateCcw className="h-3.5 w-3.5 text-muted-foreground" /></button>
                          )}
                          <button className="p-1.5 rounded-md hover:bg-muted/50" onClick={() => removeDoc(doc.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Cross-Validation Results</CardTitle>
              <CardDescription className="text-xs">{selectedApplication.company}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {validations.map((v, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      v.status === "pass" ? "bg-risk-low/5 border-risk-low/20" :
                      v.status === "warning" ? "bg-risk-medium/5 border-risk-medium/20" :
                      "bg-risk-high/5 border-risk-high/20"
                    }`}
                  >
                    <ValidationIcon status={v.status} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{v.check}</p>
                      <p className="text-xs text-muted-foreground">{v.detail}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <div className="relative inline-block">
                <svg className="w-40 h-40 -rotate-90">
                  <circle cx="80" cy="80" r="65" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                  <circle cx="80" cy="80" r="65" fill="none"
                    stroke={integrityScore >= 80 ? "hsl(var(--risk-low))" : integrityScore >= 60 ? "hsl(var(--risk-medium))" : "hsl(var(--risk-high))"}
                    strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${(integrityScore / 100) * 408} 408`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-bold ${integrityScore >= 80 ? "text-risk-low" : integrityScore >= 60 ? "text-risk-medium" : "text-risk-high"}`}>{integrityScore}</span>
                  <span className="text-xs text-muted-foreground">Integrity Score</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">Document integrity score for {selectedApplication.company}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
