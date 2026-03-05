import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileCheck, AlertTriangle, XCircle, ChevronRight, File, Eye, Trash2, CheckCircle2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskBadge } from "@/components/ui/risk-badge";

const documentTypes = [
  "Certificate of Incorporation",
  "Company PAN",
  "GST Registration",
  "Memorandum of Association (MOA)",
  "Articles of Association (AOA)",
  "Partnership Deed",
  "LLP Agreement",
  "Registered Office Address Proof",
  "Director KYC",
];

interface DocFile {
  id: string;
  name: string;
  type: string;
  size: string;
  status: "uploading" | "verified" | "pending" | "failed";
  progress: number;
}

const mockDocs: DocFile[] = [
  { id: "1", name: "Certificate_of_Incorporation.pdf", type: "Certificate of Incorporation", size: "2.4 MB", status: "verified", progress: 100 },
  { id: "2", name: "Company_PAN.pdf", type: "Company PAN", size: "1.1 MB", status: "verified", progress: 100 },
  { id: "3", name: "GST_Registration.pdf", type: "GST Registration", size: "890 KB", status: "verified", progress: 100 },
  { id: "4", name: "MOA_TataSteel.pdf", type: "Memorandum of Association (MOA)", size: "5.2 MB", status: "pending", progress: 100 },
  { id: "5", name: "AOA_TataSteel.pdf", type: "Articles of Association (AOA)", size: "3.8 MB", status: "verified", progress: 100 },
  { id: "6", name: "Director_KYC_Bundle.zip", type: "Director KYC", size: "8.1 MB", status: "failed", progress: 100 },
];

const extractedData = [
  { field: "Company Name", value: "Tata Steel Limited", confidence: 98, source: "Certificate of Incorporation" },
  { field: "CIN", value: "L27100MH1907PLC000260", confidence: 99, source: "Certificate of Incorporation" },
  { field: "PAN", value: "AAACT2727Q", confidence: 97, source: "Company PAN" },
  { field: "GSTIN", value: "27AAACT2727Q1ZV", confidence: 96, source: "GST Registration" },
  { field: "Registered Address", value: "Bombay House, 24 Homi Mody Street, Fort, Mumbai – 400001", confidence: 94, source: "Certificate of Incorporation" },
  { field: "Directors", value: "T.V. Narendran (MD), O.P. Bhatt (Chairman), N. Chandrasekaran", confidence: 91, source: "Director KYC" },
  { field: "Date of Incorporation", value: "26-08-1907", confidence: 99, source: "Certificate of Incorporation" },
  { field: "Authorized Capital", value: "₹1,030 Cr", confidence: 88, source: "MOA" },
];

const validations = [
  { check: "PAN vs GSTIN Match", status: "pass" as const, detail: "PAN AAACT2727Q matches GSTIN prefix" },
  { check: "CIN Format Valid", status: "pass" as const, detail: "L27100MH1907PLC000260 — valid format" },
  { check: "Company Name Consistency", status: "pass" as const, detail: "Matches across all documents" },
  { check: "Director Identity Match", status: "warning" as const, detail: "1 director name has slight variation across documents" },
  { check: "GST Registration Active", status: "pass" as const, detail: "Active status confirmed" },
  { check: "Address Consistency", status: "warning" as const, detail: "Minor address format difference in GST vs PAN" },
  { check: "MOA Object Clause", status: "pass" as const, detail: "Lending activity covered under object clause" },
  { check: "Director DIN Verification", status: "fail" as const, detail: "1 director DIN not found in MCA records" },
];

const alerts = [
  { severity: "high", message: "Director DIN not found in MCA database — requires manual verification" },
  { severity: "medium", message: "Director name variation: 'O.P. Bhatt' vs 'Om Prakash Bhatt' across documents" },
  { severity: "medium", message: "Registered address format differs between PAN and GST registration" },
  { severity: "low", message: "MOA authorized capital last updated in 2019 — consider requesting latest version" },
];

const integrityScore = 87;

function StatusIcon({ status }: { status: string }) {
  if (status === "verified") return <FileCheck className="h-4 w-4 text-risk-low" />;
  if (status === "pending") return <AlertTriangle className="h-4 w-4 text-risk-medium" />;
  if (status === "failed") return <XCircle className="h-4 w-4 text-risk-high" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

function ValidationIcon({ status }: { status: "pass" | "warning" | "fail" }) {
  if (status === "pass") return <CheckCircle2 className="h-4 w-4 text-risk-low" />;
  if (status === "warning") return <AlertTriangle className="h-4 w-4 text-risk-medium" />;
  return <XCircle className="h-4 w-4 text-risk-high" />;
}

export default function DocumentVerification() {
  const [docs] = useState<DocFile[]>(mockDocs);
  const [dragOver, setDragOver] = useState(false);

  const verified = docs.filter(d => d.status === "verified").length;
  const pending = docs.filter(d => d.status === "pending").length;
  const failed = docs.filter(d => d.status === "failed").length;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Document Verification</h1>
          <p className="text-sm text-muted-foreground mt-1">Verify corporate compliance documents before credit analysis</p>
        </div>
        <Button className="gap-2">
          <ShieldCheck className="h-4 w-4" />
          Run Full Verification
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Documents", value: docs.length, icon: File, color: "text-primary" },
          { label: "Verified", value: verified, icon: FileCheck, color: "text-risk-low" },
          { label: "Pending", value: pending, icon: AlertTriangle, color: "text-risk-medium" },
          { label: "Failed", value: failed, icon: XCircle, color: "text-risk-high" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="glass-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-2.5 rounded-lg bg-muted/50 ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
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
          <TabsTrigger value="extraction">Data Extraction</TabsTrigger>
          <TabsTrigger value="validation">Cross-Validation</TabsTrigger>
          <TabsTrigger value="summary">Risk Summary</TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Upload zone */}
            <Card className="glass-card lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Upload Documents</CardTitle>
                <CardDescription className="text-xs">Drag & drop or click to upload</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); }}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                    dragOver ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"
                  }`}
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-foreground font-medium">Drop files here</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 20MB</p>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Accepted Documents</p>
                  <div className="flex flex-wrap gap-1.5">
                    {documentTypes.map(dt => (
                      <Badge key={dt} variant="secondary" className="text-[10px] font-normal">{dt}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents list */}
            <Card className="glass-card lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Uploaded Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <AnimatePresence>
                    {docs.map((doc, i) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                      >
                        <StatusIcon status={doc.status} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                          <p className="text-[10px] text-muted-foreground">{doc.type} · {doc.size}</p>
                        </div>
                        {doc.status === "uploading" && (
                          <div className="w-24">
                            <Progress value={doc.progress} className="h-1.5" />
                          </div>
                        )}
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${
                            doc.status === "verified" ? "bg-risk-low/15 text-risk-low" :
                            doc.status === "pending" ? "bg-risk-medium/15 text-risk-medium" :
                            "bg-risk-high/15 text-risk-high"
                          }`}
                        >
                          {doc.status === "verified" ? "✔ Verified" : doc.status === "pending" ? "⚠ Pending" : "❌ Failed"}
                        </Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 rounded-md hover:bg-muted/50"><Eye className="h-3.5 w-3.5 text-muted-foreground" /></button>
                          <button className="p-1.5 rounded-md hover:bg-muted/50"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Extraction Tab */}
        <TabsContent value="extraction" className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Extracted Document Data</CardTitle>
              <CardDescription className="text-xs">AI-extracted fields with confidence scores</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Field</TableHead>
                    <TableHead className="text-xs">Extracted Value</TableHead>
                    <TableHead className="text-xs">Confidence</TableHead>
                    <TableHead className="text-xs">Source Document</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extractedData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-medium text-foreground">{row.field}</TableCell>
                      <TableCell className="text-xs font-mono text-foreground">{row.value}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={row.confidence} className="h-1.5 w-16" />
                          <span className="text-xs text-muted-foreground">{row.confidence}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.source}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "PAN extracted from GSTIN", result: "MATCH ✔", status: "pass" },
              { label: "CIN found in incorporation certificate", result: "MATCH ✔", status: "pass" },
              { label: "Director name consistency", result: "MISMATCH ⚠", status: "warning" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="glass-card">
                  <CardContent className="p-4 flex items-center gap-3">
                    <ValidationIcon status={item.status as "pass" | "warning" | "fail"} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className={`text-sm font-semibold ${
                        item.status === "pass" ? "text-risk-low" : "text-risk-medium"
                      }`}>{item.result}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation" className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Cross-Document Validation</CardTitle>
              <CardDescription className="text-xs">Automated consistency checks across all uploaded documents</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Validation Check</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validations.map((v, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-medium text-foreground">{v.check}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <ValidationIcon status={v.status} />
                          <span className={`text-xs font-medium ${
                            v.status === "pass" ? "text-risk-low" : v.status === "warning" ? "text-risk-medium" : "text-risk-high"
                          }`}>
                            {v.status === "pass" ? "Pass" : v.status === "warning" ? "Warning" : "Fail"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{v.detail}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Integrity Score */}
            <Card className="glass-card lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Document Integrity Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div className="relative h-36 w-36">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke={integrityScore >= 80 ? "hsl(var(--risk-low))" : integrityScore >= 50 ? "hsl(var(--risk-medium))" : "hsl(var(--risk-high))"}
                      strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${integrityScore * 2.64} ${264 - integrityScore * 2.64}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-foreground">{integrityScore}</span>
                    <span className="text-xs text-muted-foreground">/ 100</span>
                  </div>
                </div>
                <RiskBadge score={100 - integrityScore} label={integrityScore >= 80 ? "Low Risk" : integrityScore >= 50 ? "Medium Risk" : "High Risk"} size="md" />
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card className="glass-card lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Document Alerts</CardTitle>
                <CardDescription className="text-xs">Issues requiring attention before proceeding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {alerts.map((alert, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      alert.severity === "high" ? "bg-risk-high/5 border-risk-high/20" :
                      alert.severity === "medium" ? "bg-risk-medium/5 border-risk-medium/20" :
                      "bg-risk-low/5 border-risk-low/20"
                    }`}
                  >
                    <div className="mt-0.5">
                      {alert.severity === "high" ? <XCircle className="h-4 w-4 text-risk-high" /> :
                       alert.severity === "medium" ? <AlertTriangle className="h-4 w-4 text-risk-medium" /> :
                       <CheckCircle2 className="h-4 w-4 text-risk-low" />}
                    </div>
                    <div>
                      <Badge variant="secondary" className={`text-[10px] mb-1 ${
                        alert.severity === "high" ? "bg-risk-high/15 text-risk-high" :
                        alert.severity === "medium" ? "bg-risk-medium/15 text-risk-medium" :
                        "bg-risk-low/15 text-risk-low"
                      }`}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <p className="text-xs text-foreground">{alert.message}</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Document Viewer Placeholder */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" /> Document Viewer
              </CardTitle>
              <CardDescription className="text-xs">View documents with highlighted extracted fields</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-center">
                <div className="text-center">
                  <File className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">Select a document to preview</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">CIN, PAN, GSTIN and Director names will be highlighted</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
