import { motion } from "framer-motion";
import { FileCheck, Shield, Brain, BookOpen, BarChart3, MessageSquare } from "lucide-react";

const features = [
  { icon: FileCheck, title: "AI Document Verification", desc: "Automated extraction and cross-validation of corporate documents with 98% accuracy using OCR and NLP." },
  { icon: Shield, title: "Credit Risk Scoring Engine", desc: "Five Cs analysis powered by explainable AI for transparent, auditable credit risk assessment." },
  { icon: Brain, title: "Explainable AI", desc: "Every risk score comes with clear reasoning and factor attribution — no black box decisions." },
  { icon: BookOpen, title: "CAM Report Generator", desc: "Auto-generate comprehensive Credit Appraisal Memos in minutes with AI-driven financial summaries." },
  { icon: BarChart3, title: "Portfolio Risk Monitoring", desc: "Real-time portfolio analytics with sector exposure, risk distribution, and concentration limit alerts." },
  { icon: MessageSquare, title: "AI Credit Assistant", desc: "Ask questions about any company's risk profile and get instant, citation-backed intelligence." },
];

export function FeatureHighlights() {
  return (
    <section id="features" className="py-24 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">Platform Capabilities</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3">Everything You Need for Credit Decisioning</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            End-to-end corporate credit assessment powered by AI, built for enterprise financial institutions.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="glass-card-hover p-6 group cursor-default"
            >
              <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
