import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, FileText, BarChart3, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const camSteps = [
  { icon: FileText, label: "Financial Summary", desc: "Auto-extracted P&L, Balance Sheet, Cash Flow analysis" },
  { icon: BarChart3, label: "Ratio Analysis", desc: "30+ financial ratios computed and benchmarked" },
  { icon: Shield, label: "Risk Assessment", desc: "Five Cs scoring with explainable factors" },
  { icon: CheckCircle2, label: "Recommendation", desc: "AI-generated approval recommendation with conditions" },
];

export function CAMSection() {
  const navigate = useNavigate();

  return (
    <section id="cam" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">CAM Generator</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3">Automated Credit Appraisal Memo</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Generate comprehensive, audit-ready CAM reports in minutes with AI-driven financial analysis and risk assessment.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {camSteps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass-card-hover p-5 text-center"
            >
              <div className="mx-auto w-fit p-3 rounded-xl bg-primary/10 mb-3">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-1">{step.label}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Button size="lg" className="gap-2" onClick={() => navigate("/login")}>
            Try CAM Generator <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
