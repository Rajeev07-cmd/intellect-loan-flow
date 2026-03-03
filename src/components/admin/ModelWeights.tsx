import { useState } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface WeightConfig {
  name: string;
  key: string;
  weight: number;
  description: string;
}

const defaultWeights: WeightConfig[] = [
  { name: "Character", key: "character", weight: 20, description: "Promoter track record, CIBIL history, management integrity, and corporate governance quality." },
  { name: "Capacity", key: "capacity", weight: 25, description: "Revenue trends, DSCR, cash flow adequacy, and ability to service debt obligations." },
  { name: "Capital", key: "capital", weight: 20, description: "Debt-to-equity ratio, net worth, capital adequacy, and financial resilience." },
  { name: "Collateral", key: "collateral", weight: 15, description: "Asset coverage ratio, collateral quality, valuation recency, and enforceability." },
  { name: "Conditions", key: "conditions", weight: 20, description: "Industry outlook, macroeconomic factors, regulatory environment, and sector-specific risks." },
];

export function ModelWeights() {
  const [weights, setWeights] = useState(defaultWeights);
  const total = weights.reduce((s, w) => s + w.weight, 0);
  const isValid = total === 100;

  const updateWeight = (key: string, value: number) => {
    setWeights(prev => prev.map(w => w.key === key ? { ...w, weight: value } : w));
  };

  const reset = () => setWeights(defaultWeights);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Five Cs Model Weight Configuration</h3>
          <p className="text-[10px] text-muted-foreground mt-1">Adjust the relative importance of each scoring dimension. Total must equal 100%.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={reset} className="gap-2 border-border/50 text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
          <Button size="sm" disabled={!isValid} className="gap-2 bg-primary text-primary-foreground disabled:opacity-50">
            <Save className="h-3.5 w-3.5" /> Save Configuration
          </Button>
        </div>
      </div>

      {/* Total indicator */}
      <div className={`glass-card p-4 flex items-center justify-between ${isValid ? "border-risk-low/30" : "border-risk-high/30"}`}>
        <span className="text-xs text-muted-foreground">Total Weight Allocation</span>
        <span className={`text-lg font-bold ${isValid ? "text-risk-low" : "text-risk-high"}`}>{total}%</span>
      </div>

      {/* Weight Sliders */}
      <div className="space-y-3">
        {weights.map((w, i) => (
          <motion.div key={w.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{w.name}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs bg-popover border-border text-popover-foreground">
                      <p className="text-xs">{w.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={w.weight}
                  onChange={e => updateWeight(w.key, Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="w-14 text-right bg-muted/50 border border-border/50 rounded px-2 py-1 text-sm font-bold text-foreground outline-none focus:border-primary/50"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
            <Slider
              value={[w.weight]}
              onValueChange={([v]) => updateWeight(w.key, v)}
              max={50}
              step={1}
              className="mt-1"
            />
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-muted-foreground">0%</span>
              <span className="text-[10px] text-muted-foreground">50%</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
