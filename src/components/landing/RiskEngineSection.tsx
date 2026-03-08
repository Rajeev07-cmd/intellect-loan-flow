import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const riskFactors = [
  { name: "Character", score: 78 },
  { name: "Capacity", score: 65 },
  { name: "Capital", score: 82 },
  { name: "Collateral", score: 55 },
  { name: "Conditions", score: 48 },
];

const bulletPoints = [
  "Explainable risk factors with attribution",
  "Real-time score simulation",
  "Regulatory compliance ready (RBI/Basel III)",
  "Integration with MCA, CIBIL, GST portals",
];

export function RiskEngineSection() {
  return (
    <section id="risk-engine" className="py-24 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center"
        >
          <div>
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Risk Intelligence</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">AI Risk Scoring Engine</h2>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              Our Five Cs analysis engine evaluates Character, Capacity, Capital, Collateral, and Conditions — with full explainability for every score component.
            </p>
            <div className="mt-6 space-y-3">
              {bulletPoints.map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-8"
          >
            <div className="space-y-5">
              {riskFactors.map((c, i) => (
                <div key={c.name}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className="text-sm font-bold">{c.score}/100</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${c.score}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.15 }}
                      className={`h-full rounded-full ${
                        c.score >= 70 ? "bg-risk-low" : c.score >= 50 ? "bg-risk-medium" : "bg-risk-high"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-border/50 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Overall Risk Score</span>
              <span className="text-2xl font-bold text-risk-medium">65.6</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
