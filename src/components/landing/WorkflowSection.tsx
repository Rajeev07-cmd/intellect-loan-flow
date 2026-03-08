import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  UserPlus,
  Upload,
  ScanText,
  ShieldCheck,
  Globe,
  Brain,
  Lightbulb,
  FileText,
  Gavel,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

interface WorkflowStep {
  icon: LucideIcon;
  title: string;
  description: string;
  accentClass: string;
}

const steps: WorkflowStep[] = [
  {
    icon: UserPlus,
    title: "Loan Application",
    description: "Credit Officer creates a corporate loan application",
    accentClass: "from-primary to-primary",
  },
  {
    icon: Upload,
    title: "Document Upload",
    description: "Corporate documents are uploaded — PAN, GST, Financial Statements",
    accentClass: "from-primary to-chart-4",
  },
  {
    icon: ScanText,
    title: "AI Data Extraction",
    description: "AI extracts financial data from documents using OCR and NLP",
    accentClass: "from-chart-4 to-primary",
  },
  {
    icon: ShieldCheck,
    title: "Document Verification",
    description: "System validates corporate identity — PAN, GSTIN, CIN verification",
    accentClass: "from-chart-2 to-chart-2",
  },
  {
    icon: Globe,
    title: "Research Intelligence",
    description: "External intelligence analysis — news sentiment and litigation signals",
    accentClass: "from-chart-3 to-chart-3",
  },
  {
    icon: Brain,
    title: "Credit Risk Model",
    description: "Machine learning model predicts corporate credit risk",
    accentClass: "from-chart-5 to-primary",
  },
  {
    icon: Lightbulb,
    title: "Explainable AI",
    description: "System explains the factors affecting the risk score",
    accentClass: "from-chart-4 to-chart-5",
  },
  {
    icon: FileText,
    title: "CAM Generation",
    description: "AI automatically generates the Credit Appraisal Memo (CAM)",
    accentClass: "from-primary to-chart-2",
  },
  {
    icon: Gavel,
    title: "Manager Decision",
    description: "Manager reviews insights and approves or rejects the loan",
    accentClass: "from-chart-2 to-primary",
  },
];

/* ── Animated connector between nodes ── */
function Connector({ index, vertical = false }: { index: number; vertical?: boolean }) {
  if (vertical) {
    return (
      <div className="flex items-center justify-center h-12 relative">
        <svg width="4" height="48" viewBox="0 0 4 48" className="overflow-visible">
          <motion.line
            x1="2" y1="0" x2="2" y2="48"
            stroke="hsl(var(--primary) / 0.3)"
            strokeWidth="2"
            strokeDasharray="6 4"
            animate={{ strokeDashoffset: [0, -20] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
        </svg>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-primary/80 shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
            style={{ left: "50%", translateX: "-50%" }}
            animate={{ y: [-6, 48], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.45, ease: "linear" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="hidden lg:flex items-center justify-center w-16 relative">
      <svg width="64" height="4" viewBox="0 0 64 4" className="overflow-visible">
        <motion.line
          x1="0" y1="2" x2="64" y2="2"
          stroke="hsl(var(--primary) / 0.3)"
          strokeWidth="2"
          strokeDasharray="6 4"
          animate={{ strokeDashoffset: [0, -20] }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </svg>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-primary/80 shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
          style={{ top: "50%", translateY: "-50%" }}
          animate={{ x: [-8, 64], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.45, ease: "linear" }}
        />
      ))}
    </div>
  );
}

/* ── Single workflow node ── */
function WorkflowNode({ step, index }: { step: WorkflowStep; index: number }) {
  const Icon = step.icon;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ delay: index * 0.12, type: "spring", stiffness: 100, damping: 18 }}
      whileHover={{ scale: 1.06, y: -6 }}
      className="group relative flex flex-col items-center w-full lg:w-36 shrink-0 cursor-default"
    >
      {/* Step number */}
      <motion.span
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : {}}
        transition={{ delay: index * 0.12 + 0.15, type: "spring" }}
        className="absolute -top-3 -right-1 lg:-top-2 lg:-right-2 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-md"
      >
        {index + 1}
      </motion.span>

      {/* Icon container */}
      <div className="relative mb-3">
        {/* Glow ring */}
        <motion.div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.accentClass} opacity-0 blur-xl group-hover:opacity-30 transition-opacity duration-500`}
        />
        {/* Pulse on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-primary/0 group-hover:border-primary/40"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.3 }}
        />
        <div className="relative w-16 h-16 rounded-2xl bg-card border border-border/60 flex items-center justify-center shadow-lg group-hover:shadow-primary/20 transition-shadow duration-300">
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: index * 0.25, ease: "easeInOut" }}
          >
            <Icon className="h-7 w-7 text-primary" />
          </motion.div>
        </div>
      </div>

      {/* Title */}
      <h4 className="text-xs font-bold text-foreground text-center leading-tight mb-1">{step.title}</h4>
      {/* Description */}
      <p className="text-[10px] text-muted-foreground text-center leading-snug max-w-[140px]">{step.description}</p>
    </motion.div>
  );
}

/* ── Desktop: 2 rows layout ── */
function DesktopWorkflow() {
  const topRow = steps.slice(0, 5);
  const bottomRow = steps.slice(5);

  return (
    <div className="hidden lg:block">
      {/* Top row: steps 1–5, left to right */}
      <div className="flex items-start justify-center">
        {topRow.map((step, i) => (
          <div key={step.title} className="flex items-start">
            <WorkflowNode step={step} index={i} />
            {i < topRow.length - 1 && <Connector index={i} />}
          </div>
        ))}
      </div>

      {/* Vertical connector from step 5 down to step 6 */}
      <div className="flex justify-end pr-[68px]">
        <Connector index={4} vertical />
      </div>

      {/* Bottom row: steps 6–9, right to left */}
      <div className="flex items-start justify-center flex-row-reverse">
        {bottomRow.map((step, i) => (
          <div key={step.title} className="flex items-start flex-row-reverse">
            <WorkflowNode step={step} index={i + 5} />
            {i < bottomRow.length - 1 && <Connector index={i + 5} />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Mobile: vertical stack ── */
function MobileWorkflow() {
  return (
    <div className="lg:hidden flex flex-col items-center">
      {steps.map((step, i) => (
        <div key={step.title} className="flex flex-col items-center">
          <WorkflowNode step={step} index={i} />
          {i < steps.length - 1 && <Connector index={i} vertical />}
        </div>
      ))}
    </div>
  );
}

/* ── Background particles ── */
function BackgroundParticles() {
  return (
    <>
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

export function WorkflowSection() {
  return (
    <section id="workflow" className="relative py-24 px-6 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
      <BackgroundParticles />

      <div className="relative max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">
            System Workflow
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3">
            How <span className="text-gradient">Intelli-Credit</span> Works
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Follow the data as it flows from loan application to final decision — fully automated by AI.
          </p>
        </motion.div>

        {/* Workflow diagram */}
        <DesktopWorkflow />
        <MobileWorkflow />
      </div>
    </section>
  );
}
