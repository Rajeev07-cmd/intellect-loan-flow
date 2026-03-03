import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Globe, ClipboardEdit, FileUp, CheckCircle, AlertTriangle, XCircle, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { extractedData, researchFindings } from "@/lib/mock-data";
import { RiskBadge } from "@/components/ui/risk-badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

const uploadFiles = [
  { name: "GST_Returns_FY24.pdf", type: "GST Returns", status: "Extracted", size: "2.4 MB" },
  { name: "ITR_FY23_FY24.pdf", type: "ITR Documents", status: "Extracted", size: "1.8 MB" },
  { name: "Bank_Statement_SBI.pdf", type: "Bank Statement", status: "Parsing", size: "5.1 MB" },
  { name: "Annual_Report_2024.pdf", type: "Annual Report", status: "Extracted", size: "12.3 MB" },
  { name: "Legal_Notice_HC.pdf", type: "Legal Notices", status: "Error", size: "340 KB" },
];

const statusIcon = {
  Extracted: <CheckCircle className="h-4 w-4 text-risk-low" />,
  Parsing: <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />,
  Error: <XCircle className="h-4 w-4 text-risk-high" />,
};

export default function Applications() {
  const [riskScore, setRiskScore] = useState(62);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Loan Application Workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">Tata Steel Ltd • CIN: L27100MH1907PLC000260</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card px-4 py-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Live Risk Score:</span>
            <span className={`text-lg font-bold ${riskScore <= 40 ? "text-risk-low" : riskScore <= 65 ? "text-risk-medium" : "text-risk-high"}`}>{riskScore}</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="ingestor" className="space-y-4">
        <TabsList className="bg-muted/50 border border-border/50 p-1">
          <TabsTrigger value="ingestor" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2 text-xs">
            <Upload className="h-3.5 w-3.5" /> Data Ingestor
          </TabsTrigger>
          <TabsTrigger value="research" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2 text-xs">
            <Globe className="h-3.5 w-3.5" /> Research Agent
          </TabsTrigger>
          <TabsTrigger value="diligence" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2 text-xs">
            <ClipboardEdit className="h-3.5 w-3.5" /> Due Diligence
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Data Ingestor */}
        <TabsContent value="ingestor" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Upload Zone */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Document Upload</h3>
              <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer">
                <FileUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-foreground font-medium">Drag & Drop files here</p>
                <p className="text-xs text-muted-foreground mt-1">GST Returns, ITR, Bank Statements, Annual Reports</p>
                <p className="text-[10px] text-muted-foreground mt-2">PDF, XLSX up to 50MB</p>
              </div>

              <div className="mt-4 space-y-2">
                {uploadFiles.map((file) => (
                  <div key={file.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      {statusIcon[file.status as keyof typeof statusIcon]}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-[10px] text-muted-foreground">{file.type} • {file.size}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      file.status === "Extracted" ? "risk-badge-low" : file.status === "Parsing" ? "bg-primary/15 text-primary border border-primary/20" : "risk-badge-high"
                    }`}>{file.status}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Extracted Data */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Extracted Financial Data</h3>
              <div className="space-y-3">
                {[
                  { label: "Revenue", value: extractedData.revenue, icon: "✔", ok: true },
                  { label: "Outstanding Debt", value: extractedData.outstandingDebt, icon: "✔", ok: true },
                  { label: "Litigation Mentions", value: `${extractedData.litigationMentions} found`, icon: "⚠", ok: false },
                  { label: "Related Party Txn", value: extractedData.relatedPartyTransactions, icon: "✔", ok: true },
                  { label: "CIBIL Score", value: extractedData.cibilScore.toString(), icon: "✔", ok: true },
                  { label: "DSCR", value: `${extractedData.dscr}x`, icon: extractedData.dscr >= 1.5 ? "✔" : "⚠", ok: extractedData.dscr >= 1.5 },
                  { label: "Debt/Equity", value: `${extractedData.debtEquity}x`, icon: "✔", ok: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className={item.ok ? "text-risk-low" : "text-risk-medium"}>{item.icon}</span>
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>

              {extractedData.gstMismatch && (
                <div className="mt-4 p-3 rounded-lg bg-risk-high/10 border border-risk-high/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-risk-high" />
                    <span className="text-xs font-semibold text-risk-high">GST Mismatch Alert</span>
                  </div>
                  <p className="text-[10px] text-risk-high/80 mt-1">GSTR-2A vs 3B discrepancy of {extractedData.gstMismatchAmount} detected</p>
                </div>
              )}
            </motion.div>
          </div>
        </TabsContent>

        {/* Tab 2: Research Agent */}
        <TabsContent value="research" className="space-y-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">AI Research Findings</h3>
            <div className="space-y-3">
              {researchFindings.map((finding, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-medium text-primary">{finding.source}</span>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <span className="text-[10px] text-muted-foreground">{finding.date}</span>
                    </div>
                    <p className="text-sm text-foreground">{finding.title}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <RiskBadge label={finding.sentiment} size="sm" />
                    <span className="text-[10px] text-muted-foreground font-mono">{finding.confidence}%</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* Tab 3: Due Diligence */}
        <TabsContent value="diligence" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 space-y-5">
              <h3 className="text-sm font-semibold text-foreground">Primary Due Diligence</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Factory Capacity Utilization (%)</label>
                  <Slider defaultValue={[40]} max={100} step={1} className="mt-2"
                    onValueChange={(val) => setRiskScore(Math.min(100, Math.max(0, 62 + (50 - val[0]) * 0.5)))} />
                  <span className="text-xs text-muted-foreground mt-1 block">Current: 40%</span>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Management Quality Rating</label>
                  <div className="flex gap-2 mt-2">
                    {["Excellent", "Good", "Average", "Poor"].map((r) => (
                      <button key={r} className="px-3 py-1.5 text-xs rounded-lg border border-border/50 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors">
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Site Visit Notes</label>
                  <Textarea placeholder="Enter observations from site visit..." className="mt-2 bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground min-h-[100px]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Custom Risk Flags</label>
                  <Textarea placeholder="Add any additional risk observations..." className="mt-2 bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground" />
                </div>
              </div>
            </motion.div>

            {/* Real-time Risk Preview */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">🔁 Real-time Risk Score Simulation</h3>
              <div className="flex items-center justify-center py-8">
                <div className="relative">
                  <svg className="w-40 h-40 -rotate-90">
                    <circle cx="80" cy="80" r="65" fill="none" stroke="hsl(222, 30%, 16%)" strokeWidth="10" />
                    <circle cx="80" cy="80" r="65" fill="none"
                      stroke={riskScore <= 40 ? "hsl(142, 71%, 45%)" : riskScore <= 65 ? "hsl(38, 92%, 50%)" : "hsl(0, 72%, 51%)"}
                      strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${(riskScore / 100) * 408} 408`}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${riskScore <= 40 ? "text-risk-low" : riskScore <= 65 ? "text-risk-medium" : "text-risk-high"}`}>{Math.round(riskScore)}</span>
                    <span className="text-[10px] text-muted-foreground">Risk Score</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">Adjust due diligence inputs to see real-time impact on risk scoring</p>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
