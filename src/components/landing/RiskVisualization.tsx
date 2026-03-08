import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from "recharts";

const TARGET_SCORE = 62;
const riskCategory = "Medium";

const riskFactors = [
  { name: "Debt-Equity", value: 78, color: "hsl(var(--chart-2))" },
  { name: "Cash Flow", value: 55, color: "hsl(var(--chart-3))" },
  { name: "Revenue Growth", value: 82, color: "hsl(var(--chart-1))" },
  { name: "Litigation Risk", value: 35, color: "hsl(var(--chart-5))" },
  { name: "Market Position", value: 70, color: "hsl(var(--chart-4))" },
];

const signals = [
  { icon: CheckCircle2, label: "GST Filing Regular", positive: true },
  { icon: CheckCircle2, label: "PAN Verified", positive: true },
  { icon: AlertTriangle, label: "2 Pending Litigations", positive: false },
  { icon: CheckCircle2, label: "Bank Statements Clean", positive: true },
  { icon: XCircle, label: "High Debt Ratio", positive: false },
];

/* ── Animated counter ── */
function AnimatedScore({ target, isInView }: { target: number; isInView: boolean }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, target, { duration: 2, ease: "easeOut" });
      const unsub = rounded.on("change", (v) => setDisplay(v));
      return () => { controls.stop(); unsub(); };
    }
  }, [isInView, target, count, rounded]);

  return (
    <span className="text-4xl font-bold text-foreground tabular-nums">{display}</span>
  );
}

export function RiskVisualization() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const scoreData = [{ name: "Score", value: isInView ? TARGET_SCORE : 0, fill: "hsl(var(--chart-3))" }];

  return (
    <section id="technology" className="relative py-28 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />

      <div ref={ref} className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-4">
            AI Decision Intelligence
          </span>
          <h2 className="text-3xl md:text-5xl font-bold">
            Real-Time <span className="text-gradient">Risk Analysis</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            See how Intelli-Credit evaluates corporate credit risk with explainable AI.
          </p>
        </motion.div>

        {/* Calculating label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="text-center mb-6"
        >
          <motion.span
            animate={isInView ? { opacity: [1, 0.4, 1] } : {}}
            transition={{ duration: 1.5, repeat: 2 }}
            className="text-xs font-medium text-primary"
          >
            Risk Score Calculating...
          </motion.span>
        </motion.div>

        {/* Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, type: "spring", stiffness: 60 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Risk Score Gauge */}
          <motion.div whileHover={{ y: -4 }} className="glass-card p-6 flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">Credit Risk Score</h3>
            <div className="w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%" cy="50%"
                  innerRadius="70%" outerRadius="100%"
                  startAngle={180} endAngle={0}
                  data={scoreData}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    background={{ fill: "hsl(var(--muted))" }}
                    isAnimationActive={isInView}
                    animationDuration={2000}
                    animationEasing="ease-out"
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="-mt-12 text-center">
              <AnimatedScore target={TARGET_SCORE} isInView={isInView} />
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <motion.span
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ delay: 2.2, type: "spring" }}
              className="mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-chart-3/15 text-chart-3 border border-chart-3/25"
            >
              {riskCategory} Risk
            </motion.span>
          </motion.div>

          {/* Risk Factors */}
          <motion.div whileHover={{ y: -4 }} className="glass-card p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">Top Risk Factors</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskFactors} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    width={90}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 6, 6, 0]}
                    barSize={14}
                    isAnimationActive={isInView}
                    animationDuration={1800}
                    animationEasing="ease-out"
                  >
                    {riskFactors.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Verification Signals */}
          <motion.div whileHover={{ y: -4 }} className="glass-card p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">Verification Signals</h3>
            <div className="space-y-3">
              {signals.map((signal, i) => {
                const Icon = signal.icon;
                return (
                  <motion.div
                    key={signal.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 border border-border/30"
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${signal.positive ? "text-chart-2" : "text-destructive"}`} />
                    <span className="text-xs font-medium text-foreground">{signal.label}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
