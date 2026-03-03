import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, RotateCcw, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ThresholdConfig {
  label: string;
  key: string;
  value: number;
  unit: string;
  description: string;
  severity: "low" | "medium" | "high";
}

const defaultThresholds: ThresholdConfig[] = [
  { label: "Low Risk Upper Bound", key: "low_upper", value: 40, unit: "score", description: "Applications scoring at or below this are classified as Low Risk", severity: "low" },
  { label: "Medium Risk Upper Bound", key: "med_upper", value: 65, unit: "score", description: "Applications scoring between Low bound and this value are Medium Risk", severity: "medium" },
  { label: "Auto-Reject Threshold", key: "auto_reject", value: 85, unit: "score", description: "Applications exceeding this score are auto-flagged for rejection", severity: "high" },
  { label: "Min DSCR Requirement", key: "min_dscr", value: 1.25, unit: "x", description: "Minimum Debt Service Coverage Ratio for approval consideration", severity: "medium" },
  { label: "Max Debt-to-Equity", key: "max_de", value: 2.0, unit: "x", description: "Maximum permissible Debt-to-Equity ratio", severity: "medium" },
  { label: "Min CIBIL Score", key: "min_cibil", value: 650, unit: "", description: "Minimum CIBIL commercial score for processing", severity: "high" },
  { label: "GST Mismatch Tolerance", key: "gst_tolerance", value: 10, unit: "%", description: "Allowable variance between GSTR-2A and 3B before flagging", severity: "medium" },
  { label: "Max Single Sector Exposure", key: "sector_cap", value: 30, unit: "%", description: "Maximum portfolio exposure to any single sector", severity: "high" },
];

const sectorOverrides = [
  { sector: "Steel & Metals", riskAdjustment: +5, status: "Active" },
  { sector: "Real Estate", riskAdjustment: +10, status: "Active" },
  { sector: "IT Services", riskAdjustment: -3, status: "Active" },
  { sector: "NBFC", riskAdjustment: +8, status: "Active" },
  { sector: "Pharma", riskAdjustment: -2, status: "Inactive" },
];

const severityStyles = {
  low: "border-l-risk-low",
  medium: "border-l-risk-medium",
  high: "border-l-risk-high",
};

export function RiskThresholds() {
  const [thresholds, setThresholds] = useState(defaultThresholds);

  const updateThreshold = (key: string, value: number) => {
    setThresholds(prev => prev.map(t => t.key === key ? { ...t, value } : t));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Thresholds */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Risk Classification Thresholds</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setThresholds(defaultThresholds)} className="gap-2 border-border/50 text-muted-foreground hover:text-foreground">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
            <Button size="sm" className="gap-2 bg-primary text-primary-foreground">
              <Save className="h-3.5 w-3.5" /> Save
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {thresholds.map((t, i) => (
            <motion.div key={t.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`glass-card p-4 border-l-4 ${severityStyles[t.severity]}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground">{t.label}</span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={t.value}
                    onChange={e => updateThreshold(t.key, Number(e.target.value))}
                    className="w-20 text-right bg-muted/50 border-border/50 h-8 text-sm font-bold text-foreground"
                    step={t.unit === "x" ? 0.05 : 1}
                  />
                  {t.unit && <span className="text-xs text-muted-foreground ml-1">{t.unit}</span>}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">{t.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Sector Risk Overrides */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Sector Risk Overrides</h3>
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sector</th>
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Risk Adjustment</th>
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {sectorOverrides.map((s, i) => (
                <tr key={s.sector} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="p-3 text-xs text-foreground font-medium">{s.sector}</td>
                  <td className="p-3">
                    <span className={`text-xs font-bold ${s.riskAdjustment > 0 ? "text-risk-high" : "text-risk-low"}`}>
                      {s.riskAdjustment > 0 ? "+" : ""}{s.riskAdjustment} pts
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      s.status === "Active" ? "risk-badge-low" : "bg-muted text-muted-foreground border border-border"
                    }`}>{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
