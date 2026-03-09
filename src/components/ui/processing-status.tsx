import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, XCircle, AlertTriangle } from "lucide-react";

type ProcessingState = "idle" | "processing" | "success" | "error";

interface ProcessingStatusProps {
  state: ProcessingState;
  processingText?: string;
  successText?: string;
  errorText?: string;
  className?: string;
  compact?: boolean;
}

const pulsingDots = (
  <span className="inline-flex gap-0.5 ml-1">
    {[0, 1, 2].map(i => (
      <motion.span
        key={i}
        className="w-1 h-1 rounded-full bg-primary"
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
      />
    ))}
  </span>
);

export function ProcessingStatus({
  state,
  processingText = "Processing...",
  successText = "Verified",
  errorText = "Failed",
  className = "",
  compact = false,
}: ProcessingStatusProps) {
  if (state === "idle") return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, scale: 0.9, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 4 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`inline-flex items-center gap-2 ${className}`}
      >
        {state === "processing" && (
          <div className={`flex items-center gap-2 ${compact ? "px-2 py-1" : "px-3 py-1.5"} rounded-full bg-primary/10 border border-primary/20`}>
            <Loader2 className={`${compact ? "h-3 w-3" : "h-3.5 w-3.5"} text-primary animate-spin`} />
            <span className={`${compact ? "text-[10px]" : "text-xs"} font-medium text-primary`}>
              {processingText}
            </span>
            {pulsingDots}
          </div>
        )}

        {state === "success" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className={`flex items-center gap-2 ${compact ? "px-2 py-1" : "px-3 py-1.5"} rounded-full bg-risk-low/10 border border-risk-low/20`}
          >
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 12 }}
            >
              <CheckCircle2 className={`${compact ? "h-3 w-3" : "h-3.5 w-3.5"} text-risk-low`} />
            </motion.div>
            <span className={`${compact ? "text-[10px]" : "text-xs"} font-medium text-risk-low`}>
              {successText}
            </span>
          </motion.div>
        )}

        {state === "error" && (
          <div className={`flex items-center gap-2 ${compact ? "px-2 py-1" : "px-3 py-1.5"} rounded-full bg-risk-high/10 border border-risk-high/20`}>
            <XCircle className={`${compact ? "h-3 w-3" : "h-3.5 w-3.5"} text-risk-high`} />
            <span className={`${compact ? "text-[10px]" : "text-xs"} font-medium text-risk-high`}>
              {errorText}
            </span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/** Full-width processing banner for module-level status */
export function ProcessingBanner({
  state,
  processingText = "Processing...",
  successText = "Complete",
  errorText = "Failed",
}: ProcessingStatusProps) {
  if (state === "idle") return null;

  const config = {
    processing: {
      bg: "bg-primary/5 border-primary/20",
      icon: <Loader2 className="h-4 w-4 text-primary animate-spin" />,
      text: processingText,
      textColor: "text-primary",
    },
    success: {
      bg: "bg-risk-low/5 border-risk-low/20",
      icon: <CheckCircle2 className="h-4 w-4 text-risk-low" />,
      text: successText,
      textColor: "text-risk-low",
    },
    error: {
      bg: "bg-risk-high/5 border-risk-high/20",
      icon: <XCircle className="h-4 w-4 text-risk-high" />,
      text: errorText,
      textColor: "text-risk-high",
    },
    idle: { bg: "", icon: null, text: "", textColor: "" },
  }[state];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${config.bg}`}
      >
        {state === "processing" && (
          <motion.div
            className="absolute inset-0 rounded-xl opacity-20"
            style={{
              background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary)) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
            }}
            animate={{ backgroundPosition: ["200% 0%", "-200% 0%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        )}
        <div className="relative z-10 flex items-center gap-3 w-full">
          {state === "success" ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
              {config.icon}
            </motion.div>
          ) : (
            config.icon
          )}
          <span className={`text-sm font-medium ${config.textColor}`}>{config.text}</span>
          {state === "processing" && pulsingDots}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/** AI Processing indicator for dashboard */
export function AIProcessingIndicator({ active = true }: { active?: boolean }) {
  if (!active) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
    >
      <motion.div
        className="relative flex items-center justify-center"
      >
        <motion.div
          className="absolute w-5 h-5 rounded-full bg-primary/20"
          animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="w-2 h-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </motion.div>
      <span className="text-[10px] font-semibold text-primary tracking-wide">
        AI Engine Active ⚡
      </span>
    </motion.div>
  );
}
