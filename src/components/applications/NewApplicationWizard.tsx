import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, Building2, Upload, FileText, CheckCircle2, X, ChevronRight, ChevronLeft,
  CloudUpload, AlertTriangle, Shield, FileCheck, Trash2, File, Image
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { initializeWorkflow, updateWorkflowStatus } from "@/services/workflowStatus";
import { logAuditEvent } from "@/services/auditLog";
import { createNotification } from "@/services/notifications";
import { motion, AnimatePresence } from "framer-motion";

interface NewApplicationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SECTORS = [
  "Petrochemicals", "Steel & Metals", "IT Services", "Infrastructure",
  "Financial Services", "Manufacturing", "Healthcare", "Real Estate",
  "Automotive", "Energy", "Telecommunications", "Consumer Goods",
];

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: string;
  category: string;
  status: "uploading" | "uploaded" | "failed";
  progress: number;
}

interface DocCategory {
  title: string;
  icon: React.ReactNode;
  types: { label: string; key: string }[];
}

const DOC_CATEGORIES: DocCategory[] = [
  {
    title: "Company Identity",
    icon: <Building2 className="h-4 w-4" />,
    types: [
      { label: "Certificate of Incorporation", key: "incorporation" },
      { label: "Company PAN", key: "pan" },
      { label: "GST Certificate", key: "gst" },
    ],
  },
  {
    title: "Financial Documents",
    icon: <FileText className="h-4 w-4" />,
    types: [
      { label: "Balance Sheet", key: "balance_sheet" },
      { label: "Profit & Loss Statement", key: "pnl" },
      { label: "Bank Statement", key: "bank_statement" },
      { label: "GST Returns", key: "gst_returns" },
    ],
  },
  {
    title: "Risk & Compliance",
    icon: <Shield className="h-4 w-4" />,
    types: [
      { label: "Credit Rating Report", key: "credit_rating" },
      { label: "Auditor Report", key: "auditor_report" },
      { label: "Collateral Documents", key: "collateral" },
    ],
  },
];

function generateAppId(): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(1000 + Math.random() * 9000));
  return `APP-${year}-${seq}`;
}

export function NewApplicationWizard({ open, onOpenChange, onSuccess }: NewApplicationWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [appId] = useState(generateAppId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeCategory, setActiveCategory] = useState("");

  const [formData, setFormData] = useState({
    company_name: "", sector: "", loan_amount: "", company_email: "",
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const step1Valid = formData.company_name && formData.sector && formData.loan_amount && formData.company_email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.company_email);

  const hasCategoryFile = (catTitle: string) =>
    uploadedFiles.some(f => f.category === catTitle && f.status === "uploaded");

  const step2Valid = DOC_CATEGORIES.every(cat => hasCategoryFile(cat.title));

  const handleFileSelect = useCallback((category: string) => {
    setActiveCategory(category);
    fileInputRef.current?.click();
  }, []);

  const onFilesChosen = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const cat = activeCategory;

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} exceeds 10MB`, variant: "destructive" });
        continue;
      }
      const id = crypto.randomUUID();
      const entry: UploadedFile = {
        id, file, name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        category: cat, status: "uploading", progress: 0,
      };
      setUploadedFiles(prev => [...prev, entry]);

      // Simulate progress
      const interval = setInterval(() => {
        setUploadedFiles(prev => prev.map(f =>
          f.id === id && f.progress < 90 ? { ...f, progress: f.progress + 15 } : f
        ));
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        setUploadedFiles(prev => prev.map(f =>
          f.id === id ? { ...f, status: "uploaded", progress: 100 } : f
        ));
      }, 1500);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [activeCategory, toast]);

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Create application
      const { data: appData, error: appError } = await supabase
        .from("applications")
        .insert({
          user_id: user?.id || null,
          company_name: formData.company_name,
          cin: `U${Math.floor(10000 + Math.random() * 90000)}MH${new Date().getFullYear()}PLC${Math.floor(100000 + Math.random() * 900000)}`,
          sector: formData.sector,
          loan_amount: parseFloat(formData.loan_amount),
          company_email: formData.company_email,
          status: "Documents Uploaded",
          suggested_limit: `₹${formData.loan_amount} Cr`,
        })
        .select()
        .single();

      if (appError) throw appError;

      // 2. Upload files to storage and save metadata
      for (const uf of uploadedFiles.filter(f => f.status === "uploaded")) {
        const filePath = `${appData.id}/${Date.now()}_${uf.file.name}`;
        const { data: storageData, error: storageError } = await supabase.storage
          .from("documents")
          .upload(filePath, uf.file);

        if (storageError) {
          console.error("Storage upload error:", storageError);
          continue;
        }

        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(storageData.path);

        await supabase.from("documents").insert({
          application_id: appData.id,
          user_id: user?.id || null,
          document_name: uf.name,
          document_type: uf.category,
          file_path: urlData.publicUrl,
          file_url: urlData.publicUrl,
          file_size: uf.size,
          verification_status: "pending",
        });
      }

      // 3. Initialize workflow
      await initializeWorkflow(appData.id);
      await updateWorkflowStatus(appData.id, "Documents Uploaded");

      // 4. Audit & notifications
      await logAuditEvent(
        "Application Created",
        `New application: ${formData.company_name} — ₹${formData.loan_amount} Cr (${appId})`,
        appData.id,
        "Credit Officer"
      );
      await createNotification(
        "New Application",
        `${formData.company_name} — ₹${formData.loan_amount} Cr ${formData.sector}`,
        "info",
        appData.id
      );

      toast({ title: "Application Submitted", description: `${appId} — ${formData.company_name} created successfully.` });

      // Reset
      setStep(1);
      setFormData({ company_name: "", sector: "", loan_amount: "", company_email: "" });
      setUploadedFiles([]);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error creating application:", error);
      toast({ title: "Error", description: error.message || "Failed to create application.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: "Company Details" },
    { num: 2, label: "Document Upload" },
    { num: 3, label: "Review & Submit" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <input ref={fileInputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.docx" onChange={onFilesChosen} className="hidden" />

        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>New Loan Application</DialogTitle>
              <DialogDescription>Follow the steps to create a structured application</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Step Progress */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold shrink-0 transition-colors ${
                  step > s.num ? "bg-primary text-primary-foreground" :
                  step === s.num ? "bg-primary text-primary-foreground ring-2 ring-primary/30" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {step > s.num ? <CheckCircle2 className="h-4 w-4" /> : s.num}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step >= s.num ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded ${step > s.num ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* STEP 1 */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input id="company_name" value={formData.company_name} onChange={e => handleChange("company_name", e.target.value)} placeholder="e.g., Reliance Industries Ltd" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="sector">Sector / Industry *</Label>
                    <Select value={formData.sector} onValueChange={v => handleChange("sector", v)}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select sector" /></SelectTrigger>
                      <SelectContent>{SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="loan_amount">Loan Amount (₹ Cr) *</Label>
                    <Input id="loan_amount" type="number" value={formData.loan_amount} onChange={e => handleChange("loan_amount", e.target.value)} placeholder="e.g., 500" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="cin">CIN (optional)</Label>
                    <Input id="cin" value={formData.cin} onChange={e => handleChange("cin", e.target.value)} placeholder="Auto-generated if empty" className="mt-1.5 font-mono text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="incorporation_year">Incorporation Year</Label>
                    <Input id="incorporation_year" value={formData.incorporation_year} onChange={e => handleChange("incorporation_year", e.target.value)} placeholder="e.g., 1998" className="mt-1.5" />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="registered_address">Registered Address</Label>
                    <Input id="registered_address" value={formData.registered_address} onChange={e => handleChange("registered_address", e.target.value)} placeholder="e.g., Mumbai, Maharashtra" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="contact_person">Contact Person</Label>
                    <Input id="contact_person" value={formData.contact_person} onChange={e => handleChange("contact_person", e.target.value)} placeholder="e.g., Rajesh Kumar" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="promoter_group">Promoter Group</Label>
                    <Input id="promoter_group" value={formData.promoter_group} onChange={e => handleChange("promoter_group", e.target.value)} placeholder="e.g., Ambani Group" className="mt-1.5" />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="business_description">Business Description</Label>
                    <Textarea id="business_description" value={formData.business_description} onChange={e => handleChange("business_description", e.target.value)} placeholder="Brief description of business operations..." className="mt-1.5 min-h-[80px]" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                {DOC_CATEGORIES.map(cat => {
                  const catFiles = uploadedFiles.filter(f => f.category === cat.title);
                  const hasFile = catFiles.some(f => f.status === "uploaded");
                  return (
                    <Card key={cat.title} className={`border transition-colors ${hasFile ? "border-primary/30 bg-primary/5" : ""}`}>
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {hasFile ? <CheckCircle2 className="h-4 w-4 text-primary" /> : cat.icon}
                            <CardTitle className="text-sm">{cat.title}</CardTitle>
                          </div>
                          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleFileSelect(cat.title)}>
                            <Upload className="h-3 w-3" /> Upload
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-3 pt-0">
                        <div className="text-xs text-muted-foreground mb-2">
                          {cat.types.map(t => t.label).join(" · ")}
                        </div>
                        {catFiles.length > 0 && (
                          <div className="space-y-1.5">
                            {catFiles.map(f => (
                              <div key={f.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-sm">
                                {f.name.toLowerCase().endsWith('.pdf') ? <FileText className="h-3.5 w-3.5 text-muted-foreground" /> : <Image className="h-3.5 w-3.5 text-muted-foreground" />}
                                <span className="truncate flex-1 text-foreground">{f.name}</span>
                                <span className="text-[10px] text-muted-foreground">{f.size}</span>
                                {f.status === "uploading" && <Progress value={f.progress} className="h-1 w-16" />}
                                {f.status === "uploaded" && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                                <button onClick={() => removeFile(f.id)} className="p-0.5 hover:text-destructive text-muted-foreground"><X className="h-3 w-3" /></button>
                              </div>
                            ))}
                          </div>
                        )}
                        {catFiles.length === 0 && (
                          <div
                            onClick={() => handleFileSelect(cat.title)}
                            className="border border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/30 hover:bg-muted/20 transition-colors"
                          >
                            <CloudUpload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                            <p className="text-xs text-muted-foreground">Drag & drop or click to upload</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                {!step2Valid && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/30">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground">Upload at least one document from each category to proceed.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="text-xs font-medium text-muted-foreground">Application ID</span>
                  <Badge variant="outline" className="font-mono text-sm font-bold text-primary border-primary/30">{appId}</Badge>
                </div>

                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4" /> Company Details</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 pt-0">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      {[
                        ["Company Name", formData.company_name],
                        ["Sector", formData.sector],
                        ["Loan Amount", `₹${formData.loan_amount} Cr`],
                        ["CIN", formData.cin || "Auto-generated"],
                        ["Incorporation Year", formData.incorporation_year || "—"],
                        ["Registered Address", formData.registered_address || "—"],
                        ["Promoter Group", formData.promoter_group || "—"],
                        ["Contact Person", formData.contact_person || "—"],
                      ].map(([label, value]) => (
                        <div key={label} className="py-1.5 border-b border-border/20">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
                          <p className="text-foreground font-medium">{value}</p>
                        </div>
                      ))}
                    </div>
                    {formData.business_description && (
                      <div className="mt-3 pt-2 border-t border-border/20">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Business Description</span>
                        <p className="text-sm text-foreground mt-0.5">{formData.business_description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center gap-2"><FileCheck className="h-4 w-4" /> Uploaded Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 pt-0 space-y-3">
                    {DOC_CATEGORIES.map(cat => {
                      const catFiles = uploadedFiles.filter(f => f.category === cat.title && f.status === "uploaded");
                      return (
                        <div key={cat.title}>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">{cat.title}</p>
                          {catFiles.map(f => (
                            <div key={f.id} className="flex items-center gap-2 py-1 text-sm">
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                              <span className="text-foreground">{f.name}</span>
                              <span className="text-[10px] text-muted-foreground ml-auto">{f.size}</span>
                            </div>
                          ))}
                          {catFiles.length === 0 && <p className="text-xs text-muted-foreground italic">No documents</p>}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Summary metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-muted/30 text-center">
                    <p className="text-lg font-bold text-foreground">{uploadedFiles.filter(f => f.status === "uploaded").length}</p>
                    <p className="text-[10px] text-muted-foreground">Documents</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 text-center">
                    <p className="text-lg font-bold text-foreground">₹{formData.loan_amount} Cr</p>
                    <p className="text-[10px] text-muted-foreground">Loan Amount</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10 text-center">
                    <p className="text-lg font-bold text-primary">Pending</p>
                    <p className="text-[10px] text-muted-foreground">Verification</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center p-6 pt-0 border-t mt-2">
          <Button variant="outline" onClick={() => step === 1 ? onOpenChange(false) : setStep(s => s - 1)} className="gap-2">
            {step === 1 ? "Cancel" : <><ChevronLeft className="h-4 w-4" /> Back</>}
          </Button>
          {step < 3 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 ? !step1Valid : !step2Valid}
              className="gap-2"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
