import { motion } from "framer-motion";
import { Shield, FileText, BarChart3, Building2, CheckCircle2, Brain, TrendingUp } from "lucide-react";

const previews = [
  {
    title: "Applications Dashboard",
    description: "Production-grade table UI with search, filters, and real-time status tracking for all corporate loan applications.",
    icon: FileText,
    mockContent: (
      <div className="space-y-2">
        {[
          { company: "Tata Steel Ltd", sector: "Steel & Metals", score: 28, status: "Approved", loan: "₹500 Cr" },
          { company: "Reliance Industries", sector: "Petrochemicals", score: 35, status: "Under Review", loan: "₹1,200 Cr" },
          { company: "Adani Ports & SEZ", sector: "Infrastructure", score: 72, status: "High Risk", loan: "₹800 Cr" },
          { company: "Infosys Ltd", sector: "IT Services", score: 18, status: "Approved", loan: "₹350 Cr" },
        ].map((row) => (
          <div key={row.company} className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/30 border border-border/20">
            <div className="flex items-center gap-2">
              <Building2 className="h-3 w-3 text-muted-foreground" />
              <div>
                <p className="text-[10px] font-medium text-foreground">{row.company}</p>
                <p className="text-[8px] text-muted-foreground">{row.sector}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[9px] font-bold ${row.score <= 40 ? "text-risk-low" : row.score <= 65 ? "text-risk-medium" : "text-risk-high"}`}>
                {row.score}
              </span>
              <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${
                row.status === "Approved" ? "bg-risk-low/15 text-risk-low" :
                row.status === "Under Review" ? "bg-primary/15 text-primary" :
                "bg-risk-high/15 text-risk-high"
              }`}>
                {row.status}
              </span>
              <span className="text-[9px] font-medium text-foreground">{row.loan}</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Risk Analysis Dashboard",
    description: "Five Cs credit analysis with explainable AI, financial ratio indicators, and default probability scoring.",
    icon: Shield,
    mockContent: (
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90">
              <circle cx="32" cy="32" r="26" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
              <circle cx="32" cy="32" r="26" fill="none" stroke="hsl(var(--risk-medium))" strokeWidth="5" strokeLinecap="round" strokeDasharray="102 163" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-risk-medium">62</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Medium Risk</p>
            <p className="text-[9px] text-muted-foreground">Default Probability: 18%</p>
          </div>
        </div>
        {["Character", "Capacity", "Capital", "Collateral", "Conditions"].map((c, i) => (
          <div key={c} className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground w-16">{c}</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${[75, 60, 55, 80, 45][i] >= 70 ? "bg-risk-low" : [75, 60, 55, 80, 45][i] >= 50 ? "bg-risk-medium" : "bg-risk-high"}`} style={{ width: `${[75, 60, 55, 80, 45][i]}%` }} />
            </div>
            <span className="text-[9px] font-semibold text-foreground w-6 text-right">{[75, 60, 55, 80, 45][i]}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "CAM Report Preview",
    description: "Auto-generated Credit Appraisal Memo with company overview, financial analysis, risk summary, and loan recommendation.",
    icon: BarChart3,
    mockContent: (
      <div className="space-y-2">
        <div className="text-center pb-2 border-b border-border/30">
          <p className="text-[9px] font-bold text-foreground uppercase tracking-wider">Credit Appraisal Memo</p>
          <p className="text-[7px] text-muted-foreground">Confidential — Internal Use Only</p>
        </div>
        {[
          { section: "Company Overview", items: ["Sector: Steel & Metals", "CIN: L27100MH2005PLC153689"] },
          { section: "Financial Analysis", items: ["Revenue: ₹2,43,000 Cr", "DSCR: 1.8x"] },
          { section: "Recommendation", items: ["Decision: Conditional Approval", "Suggested Limit: ₹500 Cr"] },
        ].map((s) => (
          <div key={s.section} className="p-2 bg-muted/20 rounded">
            <p className="text-[8px] font-semibold text-foreground mb-1">{s.section}</p>
            {s.items.map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-[8px] text-muted-foreground">
                <CheckCircle2 className="h-2 w-2 text-risk-low shrink-0" />
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>
    ),
  },
];

export function ProductOverviewSection() {
  return (
    <section id="platform" className="relative py-28 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent" />

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-4">
            Platform Preview
          </span>
          <h2 className="text-3xl md:text-5xl font-bold">
            Built for <span className="text-gradient">Enterprise Banking</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            Production-grade dashboards designed for corporate credit teams at banks and NBFCs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {previews.map((preview, i) => {
            const Icon = preview.icon;
            return (
              <motion.div
                key={preview.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -8 }}
                className="group glass-card overflow-hidden"
              >
                {/* Mock UI */}
                <div className="p-4 border-b border-border/30">
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-2 h-2 rounded-full bg-risk-high/60" />
                    <div className="w-2 h-2 rounded-full bg-risk-medium/60" />
                    <div className="w-2 h-2 rounded-full bg-risk-low/60" />
                    <span className="text-[8px] text-muted-foreground ml-2">{preview.title}</span>
                  </div>
                  <div className="min-h-[180px]">
                    {preview.mockContent}
                  </div>
                </div>

                {/* Description */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{preview.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{preview.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
