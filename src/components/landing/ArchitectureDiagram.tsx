import { motion } from "framer-motion";
import {
  FileText, BarChart3, Building2, Receipt, Globe, Scale,
  Brain, FileCheck, Search, Shield, Sparkles, BookOpen,
  LayoutDashboard, Gavel, TrendingUp, CheckCircle2, PieChart,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

interface DataCard {
  icon: LucideIcon;
  label: string;
}

const dataSources: DataCard[] = [
  { icon: FileText, label: "Corporate Documents" },
  { icon: BarChart3, label: "Financial Statements" },
  { icon: Building2, label: "Bank Statements" },
  { icon: Receipt, label: "GST Filings" },
  { icon: Globe, label: "External Research" },
  { icon: Scale, label: "Regulatory Filings" },
];

const aiModules: DataCard[] = [
  { icon: FileCheck, label: "Document Extraction" },
  { icon: Shield, label: "Document Verification" },
  { icon: Search, label: "Research Intelligence" },
  { icon: Brain, label: "Credit Risk Model" },
  { icon: Sparkles, label: "Explainable AI" },
  { icon: BookOpen, label: "CAM Generator" },
];

const outputs: DataCard[] = [
  { icon: LayoutDashboard, label: "Credit Officer Dashboard" },
  { icon: Gavel, label: "Manager Decision Center" },
  { icon: TrendingUp, label: "Risk Analytics Dashboard" },
  { icon: CheckCircle2, label: "Loan Approval Engine" },
  { icon: PieChart, label: "Portfolio Monitoring" },
];

const workflowSteps = [
  "Upload Corporate Documents",
  "AI Extracts Financial Data",
  "Document Verification",
  "Research Intelligence Analysis",
  "Risk Scoring Model",
  "Explainable AI Insights",
  "CAM Generation",
  "Manager Loan Decision",
];

function ColumnCard({ card, index, side }: { card: DataCard; index: number; side: "left" | "right" }) {
  const Icon = card.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: side === "left" ? -30 : 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ scale: 1.04, y: -2 }}
      className="glass-card-hover p-3 flex items-center gap-3 cursor-default"
    >
      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <span className="text-xs font-medium text-foreground">{card.label}</span>
    </motion.div>
  );
}

function FlowArrow({ direction }: { direction: "down" | "right" | "left" }) {
  return (
    <div className="flex items-center justify-center py-2 lg:py-0 lg:px-2">
      <svg
        className={`text-primary/40 ${direction === "down" ? "w-6 h-10" : "w-10 h-6 hidden lg:block"}`}
        viewBox={direction === "down" ? "0 0 24 40" : "0 0 40 24"}
      >
        {direction === "down" ? (
          <>
            <motion.line
              x1="12" y1="0" x2="12" y2="32"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="4 4"
              animate={{ strokeDashoffset: [0, -16] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <polygon points="6,30 12,40 18,30" fill="currentColor" />
          </>
        ) : (
          <>
            <motion.line
              x1="0" y1="12" x2="32" y2="12"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="4 4"
              animate={{ strokeDashoffset: direction === "left" ? [0, 16] : [0, -16] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <polygon
              points={direction === "left" ? "0,6 0,18 -6,12" : "30,6 30,18 40,12"}
              fill="currentColor"
              transform={direction === "left" ? "translate(2,0)" : ""}
            />
          </>
        )}
      </svg>
    </div>
  );
}

export function ArchitectureDiagram() {
  return (
    <section id="architecture" className="py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">System Architecture</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3">How Intelli-Credit Works</h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            End-to-end AI pipeline from corporate data ingestion to final credit decision.
          </p>
        </motion.div>

        {/* Architecture 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1.2fr_auto_1fr] gap-6 items-center">
          {/* Left: Data Sources */}
          <div>
            <motion.h3
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm font-semibold text-primary mb-4 text-center"
            >
              Corporate Data Sources
            </motion.h3>
            <div className="space-y-2.5">
              {dataSources.map((card, i) => (
                <ColumnCard key={card.label} card={card} index={i} side="left" />
              ))}
            </div>
          </div>

          {/* Arrow left → center */}
          <FlowArrow direction="right" />
          <div className="lg:hidden"><FlowArrow direction="down" /></div>

          {/* Center: AI Core */}
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Outer glow ring */}
              <motion.div
                className="absolute -inset-4 rounded-full border-2 border-primary/20"
                animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.div
                className="absolute -inset-8 rounded-full border border-primary/10"
                animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.35, 0.15] }}
                transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
              />

              {/* Core circle */}
              <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-full bg-gradient-to-br from-primary/15 via-card to-chart-4/10 border border-primary/30 flex flex-col items-center justify-center p-6 shadow-2xl shadow-primary/10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "conic-gradient(from 0deg, transparent 0%, hsl(var(--primary) / 0.15) 25%, transparent 50%, hsl(var(--chart-4) / 0.1) 75%, transparent 100%)",
                  }}
                />
                <Brain className="h-8 w-8 text-primary mb-2 relative z-10" />
                <span className="text-sm font-bold text-foreground text-center relative z-10">
                  Intelli-Credit
                  <br />
                  AI Engine
                </span>
                <div className="mt-3 space-y-1 relative z-10">
                  {aiModules.map((m) => (
                    <p key={m.label} className="text-[9px] text-muted-foreground text-center">{m.label}</p>
                  ))}
                </div>
              </div>

              {/* Animated particles flowing into core */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-primary/60"
                  style={{
                    left: `${-20 + Math.random() * 10}%`,
                    top: `${20 + i * 12}%`,
                  }}
                  animate={{
                    x: [0, 80, 130],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: "easeInOut",
                  }}
                />
              ))}
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={`r-${i}`}
                  className="absolute w-1.5 h-1.5 rounded-full bg-chart-4/60"
                  style={{
                    right: `${-20 + Math.random() * 10}%`,
                    top: `${25 + i * 12}%`,
                  }}
                  animate={{
                    x: [0, -80, -130],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>
          </div>

          {/* Arrow center → right */}
          <FlowArrow direction="right" />
          <div className="lg:hidden"><FlowArrow direction="down" /></div>

          {/* Right: Decision Intelligence */}
          <div>
            <motion.h3
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm font-semibold text-primary mb-4 text-center"
            >
              Credit Decision System
            </motion.h3>
            <div className="space-y-2.5">
              {outputs.map((card, i) => (
                <ColumnCard key={card.label} card={card} index={i} side="right" />
              ))}
            </div>
          </div>
        </div>

        {/* Workflow Steps */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <h3 className="text-center text-sm font-semibold text-muted-foreground mb-8 uppercase tracking-widest">
            Processing Pipeline
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {workflowSteps.map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.06 }}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-card border border-border/60 shadow-sm cursor-default"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-xs font-medium text-foreground">{step}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
