import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import {
  UserPlus, Upload, ScanText, ShieldCheck, Globe,
  Brain, Lightbulb, FileText, Gavel,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

interface WorkflowStep {
  icon: LucideIcon;
  title: string;
  description: string;
  tag: string;
  details: string[];
}

const steps: WorkflowStep[] = [
  {
    icon: UserPlus,
    title: "Loan Application",
    description: "Credit Officer creates a corporate loan application in the platform.",
    tag: "Input",
    details: ["Applicant onboarding", "KYC data capture", "Loan amount & tenure"],
  },
  {
    icon: Upload,
    title: "Document Upload",
    description: "Corporate documents uploaded — PAN, GST returns, financial statements, bank statements.",
    tag: "Input",
    details: ["Multi-format support", "Batch upload", "Auto-classification"],
  },
  {
    icon: ScanText,
    title: "AI Data Extraction",
    description: "AI extracts structured financial data from documents using OCR and NLP pipelines.",
    tag: "Processing",
    details: ["OCR + NLP pipeline", "Table extraction", "Financial ratio computation"],
  },
  {
    icon: ShieldCheck,
    title: "Document Verification",
    description: "Automated validation of corporate identity — PAN, GSTIN, CIN cross-verification.",
    tag: "Verification",
    details: ["PAN & GSTIN validation", "CIN cross-check", "Fraud signal detection"],
  },
  {
    icon: Globe,
    title: "Research Intelligence",
    description: "External intelligence — news sentiment analysis, litigation signals, regulatory checks.",
    tag: "Intelligence",
    details: ["News sentiment analysis", "Litigation signals", "Regulatory compliance"],
  },
  {
    icon: Brain,
    title: "Credit Risk Model",
    description: "ML model evaluates corporate credit risk using financial ratios, market signals, and history.",
    tag: "AI Engine",
    details: ["Financial ratio analysis", "Sector risk evaluation", "Predictive scoring"],
  },
  {
    icon: Lightbulb,
    title: "Explainable AI",
    description: "Transparent explanation of risk factors and scoring methodology for audit compliance.",
    tag: "AI Engine",
    details: ["SHAP-based explanations", "Factor contribution chart", "Audit trail generation"],
  },
  {
    icon: FileText,
    title: "CAM Generation",
    description: "AI auto-generates the Credit Appraisal Memo with recommendations and risk summary.",
    tag: "Output",
    details: ["Auto-generated narrative", "Risk summary tables", "Recommendation engine"],
  },
  {
    icon: Gavel,
    title: "Manager Decision",
    description: "Manager reviews AI insights, risk scores, and CAM — then approves or rejects the loan.",
    tag: "Decision",
    details: ["One-click approval", "Conditional sanctions", "Digital audit log"],
  },
];

const tagColors: Record<string, string> = {
  Input: "bg-chart-1/15 text-chart-1 border-chart-1/25",
  Processing: "bg-chart-4/15 text-chart-4 border-chart-4/25",
  Verification: "bg-chart-2/15 text-chart-2 border-chart-2/25",
  Intelligence: "bg-chart-3/15 text-chart-3 border-chart-3/25",
  "AI Engine": "bg-chart-5/15 text-chart-5 border-chart-5/25",
  Output: "bg-primary/15 text-primary border-primary/25",
  Decision: "bg-chart-2/15 text-chart-2 border-chart-2/25",
};

/* ── Flowing particles on connector lines ── */
function FlowingParticles({ index }: { index: number }) {
  return (
    <div className="relative w-px h-10 overflow-visible">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-primary/40" />
      {[0, 1, 2].map((p) => (
        <motion.div
          key={p}
          className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.7)]"
          animate={{ y: [-4, 38], opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 0.5] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            delay: p * 0.45 + index * 0.1,
            ease: "linear",
          }}
        />
      ))}
      {/* Glow line */}
      <motion.div
        className="absolute inset-0 w-px bg-gradient-to-b from-primary/0 via-primary/60 to-primary/0"
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, delay: index * 0.15 }}
      />
    </div>
  );
}

/* ── Timeline node ── */
function TimelineNode({ step, index, total }: { step: WorkflowStep; index: number; total: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const isLeft = index % 2 === 0;

  return (
    <div ref={ref} className="relative flex items-center w-full">
      {/* Left content */}
      <div className={`w-5/12 ${isLeft ? "pr-8 text-right" : ""}`}>
        {isLeft && (
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.15, type: "spring", stiffness: 80, damping: 20 }}
          >
            <NodeCard step={step} index={index} align="right" />
          </motion.div>
        )}
      </div>

      {/* Center timeline */}
      <div className="relative flex flex-col items-center w-2/12">
        {index > 0 && <FlowingParticles index={index} />}

        {/* Node circle */}
        <motion.div
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="relative z-10"
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20"
            animate={{ scale: [1, 2, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, delay: index * 0.3 }}
          />
          <div className="relative w-12 h-12 rounded-full bg-card border-2 border-primary/40 flex items-center justify-center shadow-lg shadow-primary/10">
            <step.icon className="h-5 w-5 text-primary" />
          </div>
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
            {index + 1}
          </span>
        </motion.div>

        {index < total - 1 && <FlowingParticles index={index} />}
      </div>

      {/* Right content */}
      <div className={`w-5/12 ${!isLeft ? "pl-8" : ""}`}>
        {!isLeft && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.15, type: "spring", stiffness: 80, damping: 20 }}
          >
            <NodeCard step={step} index={index} align="left" />
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ── Interactive card with hover expand ── */
function NodeCard({ step, index, align }: { step: WorkflowStep; index: number; align: "left" | "right" }) {
  const [hovered, setHovered] = useState(false);
  const Icon = step.icon;

  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ scale: 1.03, y: -4 }}
      className={`group relative p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 cursor-default ${align === "right" ? "text-right" : "text-left"}`}
    >
      {/* Glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-chart-4/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className={`relative flex items-start gap-3 ${align === "right" ? "flex-row-reverse" : ""}`}>
        <motion.div
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: index * 0.2, ease: "easeInOut" }}
          className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center"
        >
          <Icon className="h-5 w-5 text-primary" />
        </motion.div>
        <div className="flex-1">
          <div className={`flex items-center gap-2 mb-1 ${align === "right" ? "justify-end" : ""}`}>
            <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${tagColors[step.tag]}`}>
              {step.tag}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>

          {/* Hover-expand details */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <ul className={`mt-3 pt-3 border-t border-border/40 space-y-1.5 ${align === "right" ? "text-right" : "text-left"}`}>
                  {step.details.map((d) => (
                    <li key={d} className="flex items-center gap-1.5 text-[11px] text-primary/80" style={{ justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
                      <span className="w-1 h-1 rounded-full bg-primary/60 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Mobile node ── */
function MobileNode({ step, index, total }: { step: WorkflowStep; index: number; total: number }) {
  const [hovered, setHovered] = useState(false);
  const Icon = step.icon;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div ref={ref} className="flex gap-4">
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ type: "spring", stiffness: 200 }}
          className="relative w-10 h-10 rounded-full bg-card border-2 border-primary/40 flex items-center justify-center shadow-md shrink-0 z-10"
        >
          <Icon className="h-4 w-4 text-primary" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
            {index + 1}
          </span>
        </motion.div>
        {index < total - 1 && (
          <div className="relative w-px flex-1 min-h-[24px]">
            <div className="absolute inset-0 bg-primary/20" />
            {[0, 1].map((p) => (
              <motion.div
                key={p}
                className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.6)]"
                animate={{ y: [-2, 22], opacity: [0, 1, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: p * 0.5, ease: "linear" }}
              />
            ))}
          </div>
        )}
      </div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ delay: 0.1, type: "spring", stiffness: 80 }}
        className="pb-6 pt-1"
        onClick={() => setHovered(!hovered)}
      >
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${tagColors[step.tag]}`}>
            {step.tag}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
        <AnimatePresence>
          {hovered && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-2 pt-2 border-t border-border/40 space-y-1 overflow-hidden"
            >
              {step.details.map((d) => (
                <li key={d} className="flex items-center gap-1.5 text-[11px] text-primary/80">
                  <span className="w-1 h-1 rounded-full bg-primary/60 shrink-0" />
                  {d}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ── AI Brain Core ── */
function AIBrainCore() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const modules = ["Document Processing", "Risk Scoring", "Explainable AI", "CAM Generator"];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ type: "spring", stiffness: 60 }}
      className="relative flex items-center justify-center my-16"
    >
      {/* Outer rotating ring */}
      <motion.div
        className="absolute w-56 h-56 md:w-72 md:h-72 rounded-full border border-dashed border-primary/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      {/* Middle pulsing ring */}
      <motion.div
        className="absolute w-48 h-48 md:w-60 md:h-60 rounded-full border-2 border-primary/20"
        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      {/* Inner glow */}
      <motion.div
        className="absolute w-36 h-36 md:w-44 md:h-44 rounded-full bg-primary/10 blur-xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Core */}
      <div className="relative z-10 w-36 h-36 md:w-44 md:h-44 rounded-full bg-card border-2 border-primary/40 flex flex-col items-center justify-center shadow-2xl shadow-primary/20">
        <Brain className="h-8 w-8 text-primary mb-1" />
        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Intelli-Credit</span>
        <span className="text-[9px] text-muted-foreground">AI Engine</span>
      </div>

      {/* Orbiting module labels */}
      {modules.map((mod, i) => {
        const angle = (360 / modules.length) * i - 90;
        const rad = (angle * Math.PI) / 180;
        const radius = 160;
        return (
          <motion.div
            key={mod}
            className="absolute hidden md:flex"
            style={{
              left: `calc(50% + ${Math.cos(rad) * radius}px - 50px)`,
              top: `calc(50% + ${Math.sin(rad) * radius}px - 12px)`,
            }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.7 }}
          >
            <span className="px-3 py-1.5 rounded-full bg-card/90 border border-primary/20 text-[10px] font-medium text-primary shadow-md whitespace-nowrap backdrop-blur-sm">
              {mod}
            </span>
          </motion.div>
        );
      })}

      {/* Particle effects around core */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary"
          animate={{
            x: [0, Math.cos((i * 60 * Math.PI) / 180) * 100, 0],
            y: [0, Math.sin((i * 60 * Math.PI) / 180) * 100, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
        />
      ))}
    </motion.div>
  );
}

/* ── Background grid ── */
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
    </div>
  );
}

export function WorkflowSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const glowOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 0.6, 0.6, 0]);

  return (
    <section id="workflow" ref={containerRef} className="relative py-28 px-6 overflow-hidden">
      <GridBackground />

      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-[150px]"
        style={{ opacity: glowOpacity }}
      />

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-4"
          >
            How It Works
          </motion.span>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight">
            From Application to Decision
            <br />
            <span className="text-gradient">Fully Automated by AI</span>
          </h2>
          <p className="text-muted-foreground mt-5 max-w-xl mx-auto text-base">
            Follow data as it flows through 9 intelligent stages — from document upload to final credit decision.
          </p>
        </motion.div>

        {/* AI Brain Core */}
        <AIBrainCore />

        {/* Desktop timeline */}
        <div className="hidden lg:block">
          {steps.map((step, i) => (
            <TimelineNode key={step.title} step={step} index={i} total={steps.length} />
          ))}
        </div>

        {/* Mobile timeline */}
        <div className="lg:hidden space-y-0">
          {steps.map((step, i) => (
            <MobileNode key={step.title} step={step} index={i} total={steps.length} />
          ))}
        </div>
      </div>
    </section>
  );
}
