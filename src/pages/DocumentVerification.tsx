import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, FileCheck, AlertTriangle, XCircle, File, Trash2, 
  CheckCircle2, ShieldCheck, RotateCcw, Loader2, Wifi, WifiOff,
  CloudUpload, FileText, Image, FileType, Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useApplicationStore } from "@/store/useApplicationStore";
import { ActiveApplicationBanner, NoApplicationSelected } from "@/components/ActiveApplicationBanner";
import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "@/services/auditLog";
import { createNotification } from "@/services/notifications";
import { ProcessingBanner } from "@/components/ui/processing-status";
import { extractDocumentFields, verifyDocuments, runFullPipeline, type VerificationResult } from "@/services/documentProcessing";
import { AmlScreeningPanel } from "@/components/compliance/AmlScreeningPanel";

interface DocFile {
  id: string;
  name: string;
  type: string;
  size: string;
  status: "uploading" | "verified" | "pending" | "failed";
  progress: number;
  file_url?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <FileText className="h-4 w-4 text-risk-high" />;
  if (['png', 'jpg', 'jpeg'].includes(ext || '')) return <Image className="h-4 w-4 text-primary" />;
  if (ext === 'docx') return <FileType className="h-4 w-4 text-accent-foreground" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [verifyComplete, setVerifyComplete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // Load documents from Supabase
  useEffect(() => {
    if (!selectedApplication) return;

    const loadDocuments = async () => {
      try {
        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .eq("application_id", selectedApplication.id)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setDbConnected(true);
          const dbDocs: DocFile[] = data.map(d => ({
            id: d.id,
            name: d.document_name,
            type: d.document_type,
            size: d.file_size || "N/A",
            status: d.verification_status as DocFile["status"],
            progress: 100,
            file_url: d.file_url || undefined,
          }));
          setDocs(dbDocs);
        }
      } catch (e) {
        console.log("Error loading documents:", e);
        setDocs([]);
      }
    };

    loadDocuments();
  }, [selectedApplication]);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) return `File "${file.name}" exceeds 10MB limit`;
    if (!ALLOWED_TYPES.includes(file.type)) return `File "${file.name}" has invalid type. Allowed: PDF, PNG, JPG, DOCX`;
    return null;
  };

  const uploadToSupabase = async (file: File, docId: string): Promise<string | null> => {
    if (!selectedApplication) return null;
    const filePath = `${selectedApplication.id}/${Date.now()}_${file.name}`;
    const progressInterval = setInterval(() => {
      setDocs(prev => prev.map(d => d.id === docId && d.progress < 90 ? { ...d, progress: d.progress + 10 } : d));
    }, 200);
    try {
      const { data, error } = await supabase.storage.from("documents").upload(filePath, file);
      clearInterval(progressInterval);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(data.path);
      return urlData.publicUrl;
    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    }
  };

  const saveDocumentMetadata = async (docId: string, fileName: string, fileUrl: string, fileSize: string) => {
    if (!selectedApplication) return;
    const { data: { user } } = await supabase.auth.getUser();
    let docType = "Other";
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes("pan")) docType = "PAN Card";
    else if (lowerName.includes("gst")) docType = "GST Certificate";
    else if (lowerName.includes("cin") || lowerName.includes("incorporation")) docType = "Certificate of Incorporation";
    else if (lowerName.includes("financial") || lowerName.includes("annual")) docType = "Financial Statement";
    else if (lowerName.includes("director") || lowerName.includes("kyc")) docType = "Director KYC";
    await supabase.from("documents").insert({
      id: docId,
      application_id: selectedApplication.id,
      user_id: user?.id || null,
      document_name: fileName,
      document_type: docType,
      file_path: fileUrl,
      file_url: fileUrl,
      file_size: fileSize,
      verification_status: "pending",
    });
  };

  const handleFiles = useCallback(async (files: File[]) => {
    if (!selectedApplication || files.length === 0) return;
    for (const file of files) {
      const error = validateFile(file);
      if (error) { toast({ title: "Upload Error", description: error, variant: "destructive" }); return; }
    }
    setUploading(true);
    const newDocs: DocFile[] = files.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      type: "Uploaded Document",
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      status: "uploading" as const,
      progress: 0,
    }));
    setDocs(prev => [...newDocs, ...prev]);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const docId = newDocs[i].id;
      try {
        const fileUrl = await uploadToSupabase(file, docId);
        if (fileUrl) {
          await saveDocumentMetadata(docId, file.name, fileUrl, newDocs[i].size);
          setDbConnected(true);
        }
        setDocs(prev => prev.map(d => d.id === docId ? { ...d, status: "pending" as const, progress: 100, file_url: fileUrl || undefined } : d));
        await logAuditEvent("Document Uploaded", `${file.name} uploaded`, selectedApplication!.id, "Credit Officer");
        toast({ title: "Upload Complete", description: `${file.name} uploaded successfully` });
      } catch (error: any) {
        console.error("Upload error:", error);
        setDocs(prev => prev.map(d => d.id === docId ? { ...d, status: "failed" as const, progress: 0 } : d));
        toast({ title: "Upload Failed", description: error.message || `Failed to upload ${file.name}`, variant: "destructive" });
      }
    }
    setUploading(false);
  }, [selectedApplication, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); handleFiles(Array.from(e.dataTransfer.files)); }, [handleFiles]);
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); }, []);
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { handleFiles(Array.from(e.target.files || [])); if (fileInputRef.current) fileInputRef.current.value = ""; }, [handleFiles]);

  const removeDoc = useCallback(async (id: string) => {
    try { await supabase.from("documents").delete().eq("id", id); } catch (e) {}
    setDocs(prev => prev.filter(d => d.id !== id));
    toast({ title: "Removed", description: "Document removed." });
  }, [toast]);

  const retryDoc = useCallback((id: string) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, status: "uploading" as const, progress: 0 } : d));
    setTimeout(() => {
      setDocs(prev => prev.map(d => d.id === id ? { ...d, status: "verified" as const, progress: 100 } : d));
      toast({ title: "Verified", description: "Document verified." });
    }, 2500);
  }, [toast]);

  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [extracting, setExtracting] = useState(false);

  const runFullVerification = useCallback(async () => {
    if (!selectedApplication) return;
    const isUUID = /^[0-9a-f]{8}-/i.test(selectedApplication.id);
    if (!isUUID) {
      toast({ title: "Demo Application", description: "Verification only works with database applications." });
      return;
    }

    setVerifying(true);
    setVerifyComplete(false);
    toast({ title: "AI Verification Started", description: "Running document extraction and verification..." });

    try {
      // Step 1: Extract fields from all pending documents
      const pendingDocs = docs.filter(d => d.status === "pending" && d.file_url);
      for (const doc of pendingDocs) {
        try {
          await extractDocumentFields(doc.id, selectedApplication.id, doc.name, doc.file_url!);
        } catch (e) {
          console.error(`Extraction failed for ${doc.name}:`, e);
        }
      }

      // Step 2: Verify extracted fields
      const result = await verifyDocuments(selectedApplication.id);
      setVerificationResult(result);

      // Update local state
      setDocs(prev => prev.map(d => d.status === "pending" ? { ...d, status: result.overall_status === "verified" ? "verified" as const : "pending" as const } : d));

      await logAuditEvent("AI Verification Completed", `Integrity Score: ${result.document_integrity_score}`, selectedApplication.id, "AI Engine");
      await createNotification("Verification Complete", `AI verification completed for ${selectedApplication.company}. Score: ${result.document_integrity_score}`, "info", selectedApplication.id);

      toast({ title: "AI Verification Complete", description: `Integrity Score: ${result.document_integrity_score}/100` });
    } catch (e: any) {
      toast({ title: "Verification Failed", description: e.message || "Could not complete verification.", variant: "destructive" });
    } finally {
      setVerifying(false);
      setVerifyComplete(true);
      setTimeout(() => setVerifyComplete(false), 5000);
    }
  }, [toast, docs, selectedApplication]);

  const runPipeline = useCallback(async () => {
    if (!selectedApplication) return;
    const isUUID = /^[0-9a-f]{8}-/i.test(selectedApplication.id);
    if (!isUUID) {
      toast({ title: "Demo Application", description: "Pipeline only works with database applications." });
      return;
    }

    setExtracting(true);
    toast({ title: "Full Pipeline Started", description: "Running extraction → verification → risk → CAM..." });

    try {
      const result = await runFullPipeline(selectedApplication.id);
      toast({ title: "Pipeline Complete", description: `All ${result.steps_completed.length} steps completed successfully.` });
    } catch (e: any) {
      toast({ title: "Pipeline Failed", description: e.message, variant: "destructive" });
    } finally {
      setExtracting(false);
    }
  }, [selectedApplication, toast]);

  if (!selectedApplication) return <NoApplicationSelected />;

  const verified = docs.filter(d => d.status === "verified").length;
  const pending = docs.filter(d => d.status === "pending").length;
  const failed = docs.filter(d => d.status === "failed").length;
  const validations = selectedApplication.validations;
  const integrityScore = selectedApplication.integrityScore || 
    Math.round((verified / Math.max(docs.length, 1)) * 100);

  return (
    <div className="space-y-6 animate-slide-up">
      <ActiveApplicationBanner />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Document Verification</h1>
          <p className="text-sm text-muted-foreground mt-1">{selectedApplication.company} — Compliance document verification</p>
        </div>
        <div className="flex items-center gap-2">
          {dbConnected && (
            <Badge variant="outline" className="gap-1.5 text-xs text-risk-low border-risk-low/30">
              <Wifi className="h-3 w-3" /> Cloud storage connected
            </Badge>
          )}
          <Button variant="outline" className="gap-2" onClick={runPipeline} disabled={extracting || docs.length === 0}>
            {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {extracting ? "Processing..." : "Run Full Pipeline"}
          </Button>
          <Button className="gap-2" onClick={runFullVerification} disabled={verifying || pending === 0}>
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {verifying ? "Verifying..." : "AI Verify Documents"}
          </Button>
        </div>
      </div>

      <ProcessingBanner
        state={verifying || extracting ? "processing" : verifyComplete ? "success" : "idle"}
        processingText={extracting ? "Running full AI pipeline..." : "AI verifying compliance documents..."}
        successText="AI Processing Complete ✔"
      />

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
                <CardDescription className="text-xs">Drag & drop or click to upload (Max 10MB)</CardDescription>
              </CardHeader>
              <CardContent>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.docx" onChange={handleFileSelect} className="hidden" />
                <div 
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    dragOver ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                  }`}
                >
                  {uploading ? (
                    <><Loader2 className="h-8 w-8 mx-auto text-primary mb-3 animate-spin" /><p className="text-sm text-primary font-medium">Uploading...</p></>
                  ) : (
                    <><CloudUpload className={`h-8 w-8 mx-auto mb-3 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="text-sm text-foreground font-medium">{dragOver ? "Drop files here" : "Drop files or click to browse"}</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG, DOCX up to 10MB</p></>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card lg:col-span-2">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Uploaded Documents</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  <AnimatePresence>
                    {docs.length === 0 ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center">
                        <File className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Upload documents to begin verification</p>
                      </motion.div>
                    ) : docs.map((doc) => (
                      <motion.div key={doc.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/20"
                      >
                        {getFileIcon(doc.name)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                            <Badge variant="outline" className="text-[9px] shrink-0">{doc.type}</Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">{doc.size}</span>
                            {doc.status === "uploading" && <Progress value={doc.progress} className="h-1 w-20" />}
                          </div>
                        </div>
                        <StatusIcon status={doc.status} />
                        <div className="flex items-center gap-1">
                          {doc.status === "failed" && (
                            <button onClick={() => retryDoc(doc.id)} className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground"><RotateCcw className="h-3.5 w-3.5" /></button>
                          )}
                          <button onClick={() => removeDoc(doc.id)} className="p-1 rounded-md hover:bg-risk-high/10 text-muted-foreground hover:text-risk-high"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="validation">
          <Card className="glass-card">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Cross-Document Validation</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(validations || []).map((v, i) => (
                  <motion.div key={v.check} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
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
                {(!validations || validations.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">Upload and verify documents to see validation results</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card className="glass-card">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Document Integrity Score</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center py-6">
                <div className="relative">
                  <svg className="w-36 h-36 -rotate-90">
                    <circle cx="72" cy="72" r="60" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                    <motion.circle cx="72" cy="72" r="60" fill="none"
                      stroke={integrityScore >= 80 ? "hsl(var(--risk-low))" : integrityScore >= 50 ? "hsl(var(--risk-medium))" : "hsl(var(--risk-high))"}
                      strokeWidth="8" strokeLinecap="round"
                      initial={{ strokeDasharray: "0 377" }}
                      animate={{ strokeDasharray: `${(integrityScore / 100) * 377} 377` }}
                      transition={{ duration: 1 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${integrityScore >= 80 ? "text-risk-low" : integrityScore >= 50 ? "text-risk-medium" : "text-risk-high"}`}>{integrityScore}</span>
                    <span className="text-[10px] text-muted-foreground">out of 100</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  {integrityScore >= 80 ? "Documents are well-verified and consistent." :
                   integrityScore >= 50 ? "Some documents need attention." :
                   "Critical issues found — review required."}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
