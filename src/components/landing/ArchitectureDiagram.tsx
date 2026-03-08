import { motion } from "framer-motion";
import {
  FileText, BarChart3, Building2, Receipt, Globe, Scale,
  Brain, FileCheck, Search, Shield, Sparkles, BookOpen,
  LayoutDashboard, Gavel, TrendingUp, PieChart,
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
  { icon: Scale, label: "Regulatory Filings" },
  { icon: Globe, label: "News & Litigation Data" },
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
  { icon: Gavel, label: "Manager Approval System" },
  { icon: TrendingUp, label: "Risk Monitoring Dashboard" },
  { icon: PieChart, label: "Portfolio Analytics" },
];

const workflowSteps = [
  "Upload Corporate Documents",
  "AI Extracts Financial Data",
  "Document Verification",
  "Research Intelligence Analysis",
  "Credit Risk Scoring Model",
  "Explainable AI Insights",
  "CAM Generation",
  "Manager Loan Approval",
];

/* ── Animated flowing dots along an SVG path ── */
function FlowingDots({ direction = "right" }: { direction?: "right" | "left" }) {
  return (
    <div className="hidden lg:flex items-center justify-center w-20 relative">
      <svg width="80" height="40" viewBox="0 0 80 40" className="overflow-visible">
        <motion.line
          x1="0" y1="20" x2="70" y2="20"
          stroke="hsl(var(--primary) / 0.25)"
          strokeWidth="2"
          strokeDasharray="6 4"
          animate={{ strokeDashoffset: direction === "right" ? [0, -20] : [0, 20] }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <polygon
          points={direction === "right" ? "68,14 68,26 80,20" : "12,14 12,26 0,20"}
          fill="hsl(var(--primary) / 0.4)"
        />
      </svg>
      {/* Flowing particle dots */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary/70 shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
          style={{ top: "50%", translateY: "-50%" }}
          animate={{
            x: direction === "right" ? [-10, 80] : [80, -10],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            delay: i * 0.6,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

/* ── Mobile vertical arrow ── */
function MobileFlowArrow() {
  return (
    <div className="flex lg:hidden items-center justify-center py-3">
      <svg width="24" height="40" viewBox="0 0 24 40">
        <motion.line
          x1="12" y1="0" x2="12" y2="30"
          stroke="hsl(var(--primary) / 0.3)"
          strokeWidth="2"
          strokeDasharray="5 4"
          animate={{ strokeDashoffset: [0, -18] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
        <polygon points="6,28 12,40 18,28" fill="hsl(var(--primary) / 0.4)" />
      </svg>
    </div>
  );
}

/* ── Source / Output card ── */
function ColumnCard({ card, index, side }: { card: DataCard; index: number; side: "left" | "right" }) {
  const Icon = card.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: side === "left" ? -40 : 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 120 }}
      whileHover={{ scale: 1.05, y: -3 }}
      className="glass-card-hover p-3.5 flex items-center gap-3 cursor-default group"
    >
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: index * 0.3, ease: "easeInOut" }}
        className="p-2 rounded-lg bg-primary/10 border border-primary/20 shrink-0 group-hover:shadow-[0_0_12px_hsl(var(--primary)/0.3)] transition-shadow"
      >
        <Icon className="h-4 w-4 text-primary" />
      </motion.div>
      <span className="text-xs font-medium text-foreground">{card.label}</span>
    </motion.div>
  );
}

/* ── AI Core ── */
function AICore() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 80 }}
      className="relative flex items-center justify-center"
    >
      {/* Outer pulsing rings */}
      <motion.div
        className="absolute w-[340px] h-[340px] rounded-full border border-primary/10"
        animate={{ scale: [1, 1.08, 1], opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full border-2 border-primary/20"
        animate={{ scale: [1, 1.04, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
      />

      {/* Rotating ring */}
      <motion.div
        className="absolute w-[280px] h-[280px] rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        style={{
          background: "conic-gradient(from 0deg, transparent 0%, hsl(var(--primary) / 0.2) 15%, transparent 30%, hsl(var(--chart-4) / 0.15) 50%, transparent 65%, hsl(var(--primary) / 0.15) 80%, transparent 100%)",
        }}
      />

      {/* Core circle */}
      <div className="relative w-60 h-60 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-primary/15 via-card to-chart-4/10 border border-primary/30 flex flex-col items-center justify-center p-5 shadow-[0_0_60px_-15px_hsl(var(--primary)/0.3)]">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Brain className="h-8 w-8 text-primary mb-1" />
        </motion.div>
        <span className="text-sm font-bold text-foreground text-center leading-tight">
          Intelli-Credit
          <br />
          AI Engine
        </span>
        <div className="mt-2.5 space-y-0.5">
          {aiModules.map((m) => (
            <p key={m.label} className="text-[9px] text-muted-foreground text-center">{m.label}</p>
          ))}
        </div>
      </div>

      {/* Incoming particles (left side) */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={`l-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-primary/70 shadow-[0_0_6px_hsl(var(--primary)/0.5)]"
          style={{ left: "-15%", top: `${18 + i * 12}%` }}
          animate={{ x: [0, 100, 140], opacity: [0, 1, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }}
        />
      ))}
      {/* Outgoing particles (right side) */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={`r-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-chart-4/70 shadow-[0_0_6px_hsl(var(--chart-4)/0.5)]"
          style={{ right: "-15%", top: `${22 + i * 14}%` }}
          animate={{ x: [0, -100, -140], opacity: [0, 1, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.45, ease: "easeInOut" }}
        />
      ))}
    </motion.div>
  );
}

export function ArchitectureDiagram() {
  return (
    <section id="architecture" className="py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">System Architecture</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3">
            <span className="text-gradient">AI-Powered</span> Corporate Credit Decisioning
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Automating corporate loan risk assessment, document verification, and credit appraisal memo generation using explainable AI.
          </p>
        </motion.div>

        {/* ── 3-Column Architecture ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1.3fr_auto_1fr] gap-6 items-center">
          {/* Left: Data Sources */}
          <div>
            <motion.h3
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm font-semibold text-primary mb-4 text-center"
            >
              Corporate Data Inputs
            </motion.h3>
            <div className="space-y-2.5">
              {dataSources.map((card, i) => (
                <ColumnCard key={card.label} card={card} index={i} side="left" />
              ))}
            </div>
          </div>

          {/* Arrow left → center */}
          <FlowingDots direction="right" />
          <MobileFlowArrow />

          {/* Center: AI Core */}
          <div className="flex justify-center">
            <AICore />
          </div>

          {/* Arrow center → right */}
          <FlowingDots direction="right" />
          <MobileFlowArrow />

          {/* Right: Decision System */}
          <div>
            <motion.h3
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm font-semibold text-primary mb-4 text-center"
            >
              Credit Decision Platform
            </motion.h3>
            <div className="space-y-2.5">
              {outputs.map((card, i) => (
                <ColumnCard key={card.label} card={card} index={i} side="right" />
              ))}
            </div>
          </div>
        </div>

        {/* ── Workflow Steps ── */}
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
                whileHover={{ scale: 1.06, y: -2 }}
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
