import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSearch, Eye, Pencil, Check, X, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, Loader2, ShieldCheck, AlertTriangle, XCircle,
  FileText, Sparkles, RotateCcw, Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useApplicationStore } from "@/store/useApplicationStore";
import { ActiveApplicationBanner, NoApplicationSelected } from "@/components/ActiveApplicationBanner";
import { supabase } from "@/integrations/supabase/client";

interface ExtractedField {
  id: string;
  field_name: string;
  field_value: string | null;
  page_number: number;
  coordinates: { x: number; y: number; width: number; height: number };
  confidence_score: number;
  is_manually_verified: boolean;
  document_id: string;
}

interface DocInfo {
  id: string;
  document_name: string;
  document_type: string;
  file_url: string | null;
  verification_status: string;
}

const FIELD_COLORS: Record<string, string> = {
  "Company Name": "bg-blue-500/30 border-blue-400",
  "CIN": "bg-purple-500/30 border-purple-400",
  "PAN": "bg-green-500/30 border-green-400",
  "GSTIN": "bg-orange-500/30 border-orange-400",
  "Revenue": "bg-cyan-500/30 border-cyan-400",
  "Net Profit": "bg-cyan-500/30 border-cyan-400",
  "Director": "bg-yellow-500/30 border-yellow-400",
};

function getFieldColor(name: string) {
  for (const key of Object.keys(FIELD_COLORS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return FIELD_COLORS[key];
  }
  return "bg-primary/20 border-primary/40";
}

function confidenceColor(score: number) {
  if (score >= 0.85) return "text-risk-low";
  if (score >= 0.6) return "text-risk-medium";
  return "text-risk-high";
}

function confidenceBg(score: number) {
  if (score >= 0.85) return "bg-risk-low/15 text-risk-low border-risk-low/30";
  if (score >= 0.6) return "bg-risk-medium/15 text-risk-medium border-risk-medium/30";
  return "bg-risk-high/15 text-risk-high border-risk-high/30";
}

export default function DocumentIntelligence() {
  const { selectedApplication } = useApplicationStore();
  const { toast } = useToast();

  const [documents, setDocuments] = useState<DocInfo[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocInfo | null>(null);
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [allFields, setAllFields] = useState<ExtractedField[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [zoom, setZoom] = useState(100);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load documents
  useEffect(() => {
    if (!selectedApplication) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("documents")
        .select("id, document_name, document_type, file_url, verification_status")
        .eq("application_id", selectedApplication.id)
        .order("created_at", { ascending: false });
      const docs = (data || []) as DocInfo[];
      setDocuments(docs);
      if (docs.length > 0 && !selectedDoc) setSelectedDoc(docs[0]);

      // Load all extracted fields for the application
      const { data: fieldsData } = await supabase
        .from("document_extracted_fields")
        .select("*")
        .eq("application_id", selectedApplication.id);
      setAllFields((fieldsData || []) as unknown as ExtractedField[]);
      setLoading(false);
    };
    load();
  }, [selectedApplication]);

  // Load fields for selected doc
  useEffect(() => {
    if (!selectedDoc) { setFields([]); return; }
    setFields(allFields.filter(f => f.document_id === selectedDoc.id));
  }, [selectedDoc, allFields]);

  const runExtraction = useCallback(async (doc: DocInfo) => {
    if (!selectedApplication) return;
    setExtracting(true);
    toast({ title: "AI Extraction", description: `Analyzing ${doc.document_name}...` });
    try {
      const res = await supabase.functions.invoke("extract-document-fields", {
        body: {
          document_id: doc.id,
          application_id: selectedApplication.id,
          document_name: doc.document_name,
          file_url: doc.file_url || "",
        },
      });
      if (res.error) throw new Error(res.error.message);
      const result = res.data;
      if (result?.error) {
        toast({ title: "Extraction Error", description: result.error, variant: "destructive" });
      } else {
        // Reload fields
        const { data: fieldsData } = await supabase
          .from("document_extracted_fields")
          .select("*")
          .eq("application_id", selectedApplication.id);
        setAllFields((fieldsData || []) as ExtractedField[]);
        toast({ title: "Extraction Complete", description: `${result.fields_count} fields extracted` });
      }
    } catch (e: any) {
      toast({ title: "Extraction Failed", description: e.message, variant: "destructive" });
    }
    setExtracting(false);
  }, [selectedApplication, toast]);

  const runAllExtractions = useCallback(async () => {
    for (const doc of documents) {
      await runExtraction(doc);
    }
  }, [documents, runExtraction]);

  const saveFieldEdit = useCallback(async (fieldId: string) => {
    const { error } = await supabase
      .from("document_extracted_fields")
      .update({ field_value: editValue, is_manually_verified: true, updated_at: new Date().toISOString() })
      .eq("id", fieldId);
    if (!error) {
      setAllFields(prev =>
        prev.map(f => f.id === fieldId ? { ...f, field_value: editValue, is_manually_verified: true } : f)
      );
      toast({ title: "Field Updated", description: "Value saved and marked as manually verified." });
    }
    setEditingField(null);
  }, [editValue, toast]);

  if (!selectedApplication) return <NoApplicationSelected />;

  const totalFields = allFields.length;
  const autoVerified = allFields.filter(f => (f.confidence_score ?? 0) >= 0.85 && !f.is_manually_verified).length;
  const manualCorrections = allFields.filter(f => f.is_manually_verified).length;
  const avgConfidence = totalFields > 0
    ? Math.round(allFields.reduce((s, f) => s + (f.confidence_score ?? 0), 0) / totalFields * 100)
    : 0;

  return (
    <div className="space-y-6 animate-slide-up">
      <ActiveApplicationBanner />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileSearch className="h-6 w-6 text-primary" />
            Document Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered field extraction with visual document analysis
          </p>
        </div>
        <Button onClick={runAllExtractions} disabled={extracting || documents.length === 0} className="gap-2">
          {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {extracting ? "Extracting..." : "Extract All Documents"}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Documents", value: documents.length, icon: FileText, color: "text-primary" },
          { label: "Fields Extracted", value: totalFields, icon: Eye, color: "text-chart-2" },
          { label: "Auto Verified", value: autoVerified, icon: ShieldCheck, color: "text-risk-low" },
          { label: "Manual Corrections", value: manualCorrections, icon: Pencil, color: "text-risk-medium" },
          { label: "Avg Accuracy", value: `${avgConfidence}%`, icon: Sparkles, color: "text-primary" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="glass-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted/50 ${stat.color}`}><stat.icon className="h-4 w-4" /></div>
                <div>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : documents.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Documents Uploaded</h3>
            <p className="text-sm text-muted-foreground">Upload documents in the Document Verification module first.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Panel — Document Viewer */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Document Viewer</CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.max(50, z - 25))}>
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs text-muted-foreground w-10 text-center">{zoom}%</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.min(200, z + 25))}>
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {/* Document tabs */}
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                {documents.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedDoc?.id === doc.id
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    {doc.document_name.length > 20 ? doc.document_name.slice(0, 20) + "…" : doc.document_name}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {selectedDoc ? (
                <div className="relative">
                  {/* Document preview area */}
                  <div
                    className="relative rounded-xl border border-border/30 bg-muted/10 overflow-hidden"
                    style={{ minHeight: 500, transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}
                  >
                    {selectedDoc.file_url ? (
                      selectedDoc.document_name.toLowerCase().endsWith(".pdf") ? (
                        <iframe
                          src={selectedDoc.file_url}
                          className="w-full border-0"
                          style={{ height: 500 }}
                          title={selectedDoc.document_name}
                        />
                      ) : (
                        <div className="relative">
                          <img
                            src={selectedDoc.file_url}
                            alt={selectedDoc.document_name}
                            className="w-full h-auto"
                          />
                          {/* Field highlight overlays on images */}
                          {fields.map(field => (
                            <div
                              key={field.id}
                              className={`absolute border-2 rounded transition-all cursor-pointer ${getFieldColor(field.field_name)} ${
                                highlightedField === field.id ? "ring-2 ring-primary shadow-lg" : ""
                              }`}
                              style={{
                                left: `${field.coordinates?.x || 0}%`,
                                top: `${field.coordinates?.y || 0}%`,
                                width: `${field.coordinates?.width || 10}%`,
                                height: `${field.coordinates?.height || 4}%`,
                              }}
                              onClick={() => setHighlightedField(field.id)}
                            >
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="w-full h-full" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-semibold">{field.field_name}</p>
                                    <p className="text-xs">{field.field_value}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      <div className="flex items-center justify-center h-[500px]">
                        <div className="text-center">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">Preview not available</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Extract button for selected doc */}
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">{selectedDoc.document_type}</Badge>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => runExtraction(selectedDoc)} disabled={extracting}>
                      {extracting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Extract Fields
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground text-sm">
                  Select a document to preview
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Panel — Extracted Fields */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                Extracted Fields
                {fields.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] ml-auto">{fields.length} fields</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Click a field to highlight it in the document. Click ✏ to edit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[560px]">
                {fields.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Sparkles className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">No fields extracted yet</p>
                    <p className="text-xs text-muted-foreground mb-4">Click "Extract Fields" to analyze this document with AI</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {fields.map((field, i) => (
                        <motion.div
                          key={field.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => setHighlightedField(field.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            highlightedField === field.id
                              ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                              : "border-border/20 bg-muted/10 hover:bg-muted/20"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                  {field.field_name}
                                </span>
                                {field.is_manually_verified && (
                                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-chart-4/10 text-chart-4 border-chart-4/30">
                                    Edited
                                  </Badge>
                                )}
                              </div>
                              {editingField === field.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    className="h-7 text-sm"
                                    autoFocus
                                  />
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-risk-low" onClick={() => saveFieldEdit(field.id)}>
                                    <Check className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-risk-high" onClick={() => setEditingField(null)}>
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-sm font-medium text-foreground truncate">{field.field_value || "—"}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${confidenceBg(field.confidence_score)}`}>
                                {Math.round((field.confidence_score ?? 0) * 100)}%
                              </Badge>
                              {editingField !== field.id && (
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    setEditingField(field.id);
                                    setEditValue(field.field_value || "");
                                  }}
                                  className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[9px] text-muted-foreground">Page {field.page_number}</span>
                            <div className="flex-1">
                              <Progress value={(field.confidence_score ?? 0) * 100} className="h-1" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Verification Status Summary */}
                {allFields.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Verification Status
                      </h4>
                      {Array.from(new Set(allFields.map(f => f.field_name))).map(name => {
                        const field = allFields.find(f => f.field_name === name);
                        const verified = (field?.confidence_score ?? 0) >= 0.85 || field?.is_manually_verified;
                        return (
                          <div key={name} className="flex items-center justify-between text-xs">
                            <span className="text-foreground">{name}</span>
                            {verified ? (
                              <span className="flex items-center gap-1 text-risk-low">
                                <ShieldCheck className="h-3 w-3" /> Verified
                              </span>
                            ) : (field?.confidence_score ?? 0) >= 0.6 ? (
                              <span className="flex items-center gap-1 text-risk-medium">
                                <AlertTriangle className="h-3 w-3" /> Review
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-risk-high">
                                <XCircle className="h-3 w-3" /> Low Confidence
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
