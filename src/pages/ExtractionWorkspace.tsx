import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Database, Plus, Trash2, Save, Loader2, Sparkles, CheckCircle2,
  AlertTriangle, FileSearch, Settings2, Wand2, Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useApplicationStore } from "@/store/useApplicationStore";
import { ActiveApplicationBanner, NoApplicationSelected } from "@/components/ActiveApplicationBanner";
import { supabase } from "@/integrations/supabase/client";
import { extractDocumentFields } from "@/services/documentProcessing";

type FieldType = "string" | "number" | "currency" | "percent" | "date" | "boolean";

interface SchemaField {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  group: string; // e.g. "Balance Sheet", "KYC"
}

interface ExtractedRow {
  id: string;
  document_id: string;
  document_name: string;
  field_name: string;
  field_value: string;
  confidence_score: number;
  is_manually_verified: boolean;
  page_number: number;
  dirty?: boolean;
}

interface DocRow {
  id: string;
  document_name: string;
  document_type: string;
  file_url?: string | null;
}

const SCHEMA_STORAGE_KEY = "intelli-extraction-schema-v1";

const DEFAULT_SCHEMA: SchemaField[] = [
  { id: "f1", name: "Company Name", type: "string", required: true, group: "KYC" },
  { id: "f2", name: "PAN", type: "string", required: true, group: "KYC" },
  { id: "f3", name: "GSTIN", type: "string", required: true, group: "KYC" },
  { id: "f4", name: "CIN", type: "string", required: false, group: "KYC" },
  { id: "f5", name: "Revenue", type: "currency", required: true, group: "Financials" },
  { id: "f6", name: "EBITDA", type: "currency", required: true, group: "Financials" },
  { id: "f7", name: "Net Profit", type: "currency", required: true, group: "Financials" },
  { id: "f8", name: "Total Assets", type: "currency", required: false, group: "Financials" },
  { id: "f9", name: "Total Liabilities", type: "currency", required: false, group: "Financials" },
  { id: "f10", name: "Debt Ratio", type: "percent", required: false, group: "Ratios" },
  { id: "f11", name: "Interest Coverage Ratio", type: "number", required: false, group: "Ratios" },
  { id: "f12", name: "Current Ratio", type: "number", required: false, group: "Ratios" },
];

const TYPE_COLORS: Record<FieldType, string> = {
  string: "bg-muted/30 text-muted-foreground",
  number: "bg-primary/15 text-primary",
  currency: "bg-risk-low/15 text-risk-low",
  percent: "bg-chart-4/15 text-chart-4",
  date: "bg-accent/30 text-foreground",
  boolean: "bg-risk-medium/15 text-risk-medium",
};

function loadSchema(): SchemaField[] {
  try {
    const raw = localStorage.getItem(SCHEMA_STORAGE_KEY);
    if (!raw) return DEFAULT_SCHEMA;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {}
  return DEFAULT_SCHEMA;
}

function saveSchema(schema: SchemaField[]) {
  localStorage.setItem(SCHEMA_STORAGE_KEY, JSON.stringify(schema));
}

function confidenceBadge(score: number) {
  if (score >= 0.85) return { label: "High", cls: "bg-risk-low/15 text-risk-low border-risk-low/30" };
  if (score >= 0.6) return { label: "Medium", cls: "bg-risk-medium/15 text-risk-medium border-risk-medium/30" };
  return { label: "Low", cls: "bg-risk-high/15 text-risk-high border-risk-high/30" };
}

export default function ExtractionWorkspace() {
  const { selectedApplication } = useApplicationStore();
  const { toast } = useToast();

  const [schema, setSchema] = useState<SchemaField[]>(loadSchema);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [rows, setRows] = useState<ExtractedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [extractingDocId, setExtractingDocId] = useState<string | null>(null);
  const [activeDocId, setActiveDocId] = useState<string>("all");
  const [savingAll, setSavingAll] = useState(false);

  // Schema builder dialog state
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [draftSchema, setDraftSchema] = useState<SchemaField[]>(schema);

  useEffect(() => { setDraftSchema(schema); }, [schema]);

  const loadData = useCallback(async () => {
    if (!selectedApplication) return;
    setLoading(true);
    const [docsRes, fieldsRes] = await Promise.all([
      supabase
        .from("documents")
        .select("id, document_name, document_type, file_url")
        .eq("application_id", selectedApplication.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("document_extracted_fields")
        .select("*")
        .eq("application_id", selectedApplication.id),
    ]);

    const docList = (docsRes.data || []) as DocRow[];
    setDocs(docList);

    const docMap = new Map(docList.map(d => [d.id, d.document_name]));
    const fields = (fieldsRes.data || []).map((f: any) => ({
      id: f.id,
      document_id: f.document_id,
      document_name: docMap.get(f.document_id) || "Unknown",
      field_name: f.field_name,
      field_value: f.field_value ?? "",
      confidence_score: Number(f.confidence_score ?? 0),
      is_manually_verified: !!f.is_manually_verified,
      page_number: f.page_number || 1,
    })) as ExtractedRow[];

    setRows(fields);
    setLoading(false);
  }, [selectedApplication]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredRows = useMemo(() => {
    if (activeDocId === "all") return rows;
    return rows.filter(r => r.document_id === activeDocId);
  }, [rows, activeDocId]);

  const stats = useMemo(() => {
    const total = rows.length;
    const verified = rows.filter(r => r.is_manually_verified).length;
    const lowConf = rows.filter(r => r.confidence_score < 0.6).length;
    const avgConf = total ? rows.reduce((s, r) => s + r.confidence_score, 0) / total : 0;
    const dirty = rows.filter(r => r.dirty).length;
    return { total, verified, lowConf, avgConf, dirty };
  }, [rows]);

  const schemaCoverage = useMemo(() => {
    const present = new Set(rows.map(r => r.field_name.toLowerCase().trim()));
    const required = schema.filter(s => s.required);
    const found = required.filter(s => present.has(s.name.toLowerCase().trim()));
    return { found: found.length, total: required.length };
  }, [rows, schema]);

  const updateRow = (id: string, patch: Partial<ExtractedRow>) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch, dirty: true } : r)));
  };

  const deleteRow = async (id: string) => {
    const { error } = await supabase.from("document_extracted_fields").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    setRows(prev => prev.filter(r => r.id !== id));
    toast({ title: "Field removed" });
  };

  const addRow = async (documentId: string) => {
    if (!selectedApplication) return;
    const { data, error } = await supabase
      .from("document_extracted_fields")
      .insert({
        application_id: selectedApplication.id,
        document_id: documentId,
        field_name: "New Field",
        field_value: "",
        page_number: 1,
        confidence_score: 1,
        is_manually_verified: true,
      })
      .select()
      .single();
    if (error) {
      toast({ title: "Could not add", description: error.message, variant: "destructive" });
      return;
    }
    const doc = docs.find(d => d.id === documentId);
    setRows(prev => [
      ...prev,
      {
        id: data.id,
        document_id: documentId,
        document_name: doc?.document_name || "Unknown",
        field_name: data.field_name,
        field_value: data.field_value ?? "",
        confidence_score: 1,
        is_manually_verified: true,
        page_number: 1,
      },
    ]);
  };

  const saveAll = async () => {
    const dirty = rows.filter(r => r.dirty);
    if (!dirty.length) {
      toast({ title: "Nothing to save" });
      return;
    }
    setSavingAll(true);
    const results = await Promise.all(
      dirty.map(r =>
        supabase
          .from("document_extracted_fields")
          .update({
            field_name: r.field_name,
            field_value: r.field_value,
            is_manually_verified: r.is_manually_verified,
            updated_at: new Date().toISOString(),
          })
          .eq("id", r.id)
      )
    );
    const failed = results.filter(r => r.error).length;
    setSavingAll(false);
    if (failed > 0) {
      toast({ title: `${failed} update(s) failed`, variant: "destructive" });
    } else {
      toast({ title: `Saved ${dirty.length} field(s)` });
      setRows(prev => prev.map(r => ({ ...r, dirty: false })));
    }
  };

  const reExtract = async (doc: DocRow) => {
    if (!selectedApplication) return;
    setExtractingDocId(doc.id);
    try {
      await extractDocumentFields(
        doc.id,
        selectedApplication.id,
        doc.document_name,
        doc.file_url || ""
      );
      toast({ title: "Re-extraction complete", description: doc.document_name });
      await loadData();
    } catch (e: any) {
      toast({ title: "Extraction failed", description: e.message, variant: "destructive" });
    } finally {
      setExtractingDocId(null);
    }
  };

  const exportCsv = () => {
    const header = ["Document", "Field", "Value", "Confidence", "Verified", "Page"];
    const lines = [header.join(",")];
    for (const r of filteredRows) {
      const cells = [
        r.document_name, r.field_name, r.field_value,
        r.confidence_score.toFixed(2), r.is_manually_verified ? "yes" : "no", String(r.page_number),
      ].map(c => `"${String(c).replace(/"/g, '""')}"`);
      lines.push(cells.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `extraction_${selectedApplication?.company || "app"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Schema builder helpers
  const addSchemaField = () => {
    setDraftSchema(prev => [
      ...prev,
      { id: `f_${Date.now()}`, name: "New Field", type: "string", required: false, group: "Custom" },
    ]);
  };
  const updateSchemaField = (id: string, patch: Partial<SchemaField>) =>
    setDraftSchema(prev => prev.map(f => (f.id === id ? { ...f, ...patch } : f)));
  const deleteSchemaField = (id: string) =>
    setDraftSchema(prev => prev.filter(f => f.id !== id));
  const commitSchema = () => {
    setSchema(draftSchema);
    saveSchema(draftSchema);
    setSchemaOpen(false);
    toast({ title: "Schema saved", description: `${draftSchema.length} fields defined` });
  };

  if (!selectedApplication) {
    return (
      <div className="space-y-6 p-6">
        <NoApplicationSelected />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <ActiveApplicationBanner />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Database className="h-6 w-6 text-primary" />
            Extraction Workspace
          </h1>
          <p className="text-sm text-muted-foreground">
            Review, edit, and verify AI-extracted financial fields with source-level confidence.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={schemaOpen} onOpenChange={setSchemaOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="mr-2 h-4 w-4" /> Schema Builder
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-primary" /> Extraction Schema
                </DialogTitle>
                <CardDescription>
                  Define the fields the AI should look for across documents. Used as the
                  coverage benchmark in the workspace.
                </CardDescription>
              </DialogHeader>

              <div className="max-h-[55vh] overflow-y-auto rounded-md border border-border/40">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[28%]">Field</TableHead>
                      <TableHead className="w-[18%]">Type</TableHead>
                      <TableHead className="w-[22%]">Group</TableHead>
                      <TableHead className="w-[14%]">Required</TableHead>
                      <TableHead className="w-[10%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {draftSchema.map(f => (
                      <TableRow key={f.id}>
                        <TableCell>
                          <Input
                            value={f.name}
                            onChange={e => updateSchemaField(f.id, { name: e.target.value })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={f.type}
                            onValueChange={(v) => updateSchemaField(f.id, { type: v as FieldType })}
                          >
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(["string", "number", "currency", "percent", "date", "boolean"] as FieldType[]).map(t => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={f.group}
                            onChange={e => updateSchemaField(f.id, { group: e.target.value })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={f.required}
                            onChange={e => updateSchemaField(f.id, { required: e.target.checked })}
                            className="h-4 w-4 accent-primary"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteSchemaField(f.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" size="sm" onClick={addSchemaField}>
                  <Plus className="mr-2 h-4 w-4" /> Add Field
                </Button>
                <div className="flex-1" />
                <Button variant="ghost" size="sm" onClick={() => { setDraftSchema(DEFAULT_SCHEMA); }}>
                  Reset Defaults
                </Button>
                <Button size="sm" onClick={commitSchema}>
                  <Save className="mr-2 h-4 w-4" /> Save Schema
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!rows.length}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button size="sm" onClick={saveAll} disabled={savingAll || !stats.dirty}>
            {savingAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes {stats.dirty > 0 && `(${stats.dirty})`}
          </Button>
        </div>
      </motion.div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: "Fields", value: stats.total, icon: Database },
          { label: "Verified", value: stats.verified, icon: CheckCircle2, accent: "text-risk-low" },
          { label: "Low Confidence", value: stats.lowConf, icon: AlertTriangle, accent: "text-risk-high" },
          { label: "Avg Confidence", value: `${Math.round(stats.avgConf * 100)}%`, icon: Sparkles, accent: "text-primary" },
          { label: "Schema Coverage", value: `${schemaCoverage.found}/${schemaCoverage.total}`, icon: FileSearch, accent: "text-chart-4" },
        ].map(k => (
          <Card key={k.label} className="border-border/40 bg-card/60 backdrop-blur">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-muted/30 p-2">
                <k.icon className={`h-4 w-4 ${k.accent || "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
                <p className="text-lg font-semibold tabular-nums">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schema preview chips */}
      <Card className="border-border/40 bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground">
            Active Schema · {schema.length} fields
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          {schema.map(f => (
            <Badge
              key={f.id}
              variant="outline"
              className={`text-[10px] font-medium ${TYPE_COLORS[f.type]} border-border/40`}
            >
              {f.name}
              {f.required && <span className="ml-1 text-risk-high">*</span>}
            </Badge>
          ))}
        </CardContent>
      </Card>

      {/* Document tabs + table */}
      <Card className="border-border/40 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Extracted Fields</CardTitle>
          <CardDescription>
            Inline-edit values, confirm verified state, or re-run AI extraction per document.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeDocId} onValueChange={setActiveDocId}>
            <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-muted/30 p-1">
              <TabsTrigger value="all" className="text-xs">
                All ({rows.length})
              </TabsTrigger>
              {docs.map(d => {
                const count = rows.filter(r => r.document_id === d.id).length;
                return (
                  <TabsTrigger key={d.id} value={d.id} className="text-xs">
                    {d.document_name} ({count})
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value={activeDocId} className="mt-4">
              {/* Per-doc action bar */}
              {activeDocId !== "all" && (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {(() => {
                    const doc = docs.find(d => d.id === activeDocId);
                    if (!doc) return null;
                    return (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reExtract(doc)}
                          disabled={extractingDocId === doc.id}
                        >
                          {extractingDocId === doc.id ? (
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="mr-2 h-3.5 w-3.5" />
                          )}
                          Re-run AI Extraction
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => addRow(doc.id)}>
                          <Plus className="mr-2 h-3.5 w-3.5" /> Add Field
                        </Button>
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="rounded-md border border-border/40">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      {activeDocId === "all" && <TableHead className="w-[18%]">Document</TableHead>}
                      <TableHead className="w-[22%]">Field</TableHead>
                      <TableHead className="w-[30%]">Value</TableHead>
                      <TableHead className="w-[14%]">Confidence</TableHead>
                      <TableHead className="w-[8%]">Page</TableHead>
                      <TableHead className="w-[10%]">Verified</TableHead>
                      <TableHead className="w-[6%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                        </TableCell>
                      </TableRow>
                    ) : filteredRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                          No extracted fields yet. Upload documents and run extraction from Doc Verification.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRows.map(r => {
                        const conf = confidenceBadge(r.confidence_score);
                        return (
                          <TableRow key={r.id} className={r.dirty ? "bg-primary/5" : ""}>
                            {activeDocId === "all" && (
                              <TableCell className="text-xs text-muted-foreground">
                                {r.document_name}
                              </TableCell>
                            )}
                            <TableCell>
                              <Input
                                value={r.field_name}
                                onChange={e => updateRow(r.id, { field_name: e.target.value })}
                                className="h-8 text-xs"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={r.field_value}
                                onChange={e => updateRow(r.id, { field_value: e.target.value })}
                                className="h-8 text-xs font-mono"
                              />
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] ${conf.cls}`}>
                                {conf.label} · {Math.round(r.confidence_score * 100)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs tabular-nums text-muted-foreground">
                              {r.page_number}
                            </TableCell>
                            <TableCell>
                              <label className="flex items-center gap-1.5 text-xs">
                                <input
                                  type="checkbox"
                                  checked={r.is_manually_verified}
                                  onChange={e =>
                                    updateRow(r.id, { is_manually_verified: e.target.checked })
                                  }
                                  className="h-3.5 w-3.5 accent-primary"
                                />
                                {r.is_manually_verified ? "Yes" : "No"}
                              </label>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteRow(r.id)}
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
