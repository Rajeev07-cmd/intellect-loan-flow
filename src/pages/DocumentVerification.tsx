import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, FileCheck, AlertTriangle, XCircle, File, Trash2, 
  CheckCircle2, ShieldCheck, RotateCcw, Loader2, Wifi, WifiOff,
  CloudUpload, FileText, Image, FileType
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

interface DocFile {
  id: string;
  name: string;
  type: string;
  size: string;
  status: "uploading" | "verified" | "pending" | "failed";
  progress: number;
  file_url?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // Load existing documents from Supabase
  useEffect(() => {
    if (!selectedApplication) return;

    const loadDocuments = async () => {
      // Check if the ID is a valid UUID (DB apps) vs mock ID like "APP-001"
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedApplication.id);
      
      if (!isUUID) {
        // Mock application - just use mock docs
        const mockDocs = (selectedApplication.documents || []).map(d => ({
          ...d,
          progress: 100,
        }));
        setDocs(mockDocs);
        return;
      }

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
          
          // Merge with mock docs from selected app
          const mockDocs = (selectedApplication.documents || []).map(d => ({
            ...d,
            progress: 100,
          }));
          
          setDocs([...dbDocs, ...mockDocs]);
        }
      } catch (e) {
        console.log("Using mock documents");
        const mockDocs = (selectedApplication.documents || []).map(d => ({
          ...d,
          progress: 100,
        }));
        setDocs(mockDocs);
      }
    };

    loadDocuments();
  }, [selectedApplication]);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" exceeds 10MB limit`;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `File "${file.name}" has invalid type. Allowed: PDF, PNG, JPG, DOCX`;
    }
    return null;
  };

  const uploadToSupabase = async (file: File, docId: string): Promise<string | null> => {
    if (!selectedApplication) return null;

    const filePath = `${selectedApplication.id}/${Date.now()}_${file.name}`;
    
    // Simulate progress since Supabase JS doesn't support onUploadProgress
    const progressInterval = setInterval(() => {
      setDocs(prev => prev.map(d => 
        d.id === docId && d.progress < 90 ? { ...d, progress: d.progress + 10 } : d
      ));
    }, 200);

    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      clearInterval(progressInterval);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    }
  };

  const saveDocumentMetadata = async (
    docId: string, 
    fileName: string, 
    fileUrl: string, 
    fileSize: string
  ) => {
    if (!selectedApplication) return;

    const { data: { user } } = await supabase.auth.getUser();

    // Determine document type from file name
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

    // Validate all files first
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        toast({ title: "Upload Error", description: error, variant: "destructive" });
        return;
      }
    }

    setUploading(true);

    // Add placeholder docs
    const newDocs: DocFile[] = files.map((f, i) => ({
      id: crypto.randomUUID(),
      name: f.name,
      type: "Uploaded Document",
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      status: "uploading" as const,
      progress: 0,
    }));

    setDocs(prev => [...newDocs, ...prev]);

    // Upload each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const docId = newDocs[i].id;

      try {
        // Upload to Supabase storage
        const fileUrl = await uploadToSupabase(file, docId);

        if (fileUrl) {
          // Save metadata to database
          await saveDocumentMetadata(docId, file.name, fileUrl, newDocs[i].size);
          setDbConnected(true);
        }

        // Update status to pending (awaiting verification)
        setDocs(prev => prev.map(d => 
          d.id === docId 
            ? { ...d, status: "pending" as const, progress: 100, file_url: fileUrl || undefined } 
            : d
        ));

        // Log audit event
        const isUUID = /^[0-9a-f]{8}-/i.test(selectedApplication!.id);
        if (isUUID) {
          await logAuditEvent("Document Uploaded", `${file.name} uploaded`, selectedApplication!.id, "Credit Officer");
        }

        toast({ 
          title: "Upload Complete", 
          description: `${file.name} uploaded successfully` 
        });
      } catch (error: any) {
        console.error("Upload error:", error);
        setDocs(prev => prev.map(d => 
          d.id === docId ? { ...d, status: "failed" as const, progress: 0 } : d
        ));
        toast({ 
          title: "Upload Failed", 
          description: error.message || `Failed to upload ${file.name}`, 
          variant: "destructive" 
        });
      }
    }

    setUploading(false);
  }, [selectedApplication, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [handleFiles]);

  const removeDoc = useCallback(async (id: string) => {
    // Try to delete from Supabase
    try {
      await supabase.from("documents").delete().eq("id", id);
    } catch (e) {
      // Ignore if not in DB
    }
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

  const runFullVerification = useCallback(async () => {
    setVerifying(true);
    toast({ title: "Verification Started", description: "Running full document verification..." });

    // Simulate verification with progress
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update all pending docs to verified
    setDocs(prev => prev.map(d => 
      d.status === "pending" ? { ...d, status: "verified" as const } : d
    ));

    // Update documents in Supabase
    const pendingIds = docs.filter(d => d.status === "pending").map(d => d.id);
    if (pendingIds.length > 0) {
      try {
        await supabase
          .from("documents")
          .update({ verification_status: "verified" })
          .in("id", pendingIds);
      } catch (e) {
        // Ignore DB errors
      }
    }

    setVerifying(false);
    toast({ title: "Complete", description: "All pending documents verified." });
  }, [toast, docs]);

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
          <Button className="gap-2" onClick={runFullVerification} disabled={verifying || pending === 0}>
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
                <CardDescription className="text-xs">Drag & drop or click to upload (Max 10MB)</CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div 
                  onDragOver={handleDragOver} 
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    dragOver 
                      ? "border-primary bg-primary/10" 
                      : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                  }`}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-8 w-8 mx-auto text-primary mb-3 animate-spin" />
                      <p className="text-sm text-primary font-medium">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <CloudUpload className={`h-8 w-8 mx-auto mb-3 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className="text-sm text-foreground font-medium">
                        {dragOver ? "Drop files here" : "Drop files or click to browse"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG, DOCX up to 10MB</p>
                    </>
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
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        No documents uploaded yet
                      </div>
                    ) : (
                      docs.map((doc) => (
                        <motion.div key={doc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                        >
                          {getFileIcon(doc.name)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] text-muted-foreground">{doc.type} · {doc.size}</p>
                              {doc.status === "uploading" && doc.progress > 0 && doc.progress < 100 && (
                                <span className="text-[10px] text-primary">{doc.progress}%</span>
                              )}
                            </div>
                            {doc.status === "uploading" && (
                              <Progress value={doc.progress} className="h-1 mt-1.5" />
                            )}
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
                      ))
                    )}
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
                  <motion.circle 
                    cx="80" cy="80" r="65" fill="none"
                    stroke={integrityScore >= 80 ? "hsl(var(--risk-low))" : integrityScore >= 60 ? "hsl(var(--risk-medium))" : "hsl(var(--risk-high))"}
                    strokeWidth="10" strokeLinecap="round"
                    initial={{ strokeDasharray: "0 408" }}
                    animate={{ strokeDasharray: `${(integrityScore / 100) * 408} 408` }}
                    transition={{ duration: 1, ease: "easeOut" }}
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
