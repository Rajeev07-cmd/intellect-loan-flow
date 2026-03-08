import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  FileText, Shield, Brain, BarChart3, BookOpen, Search,
  CheckCircle2, AlertTriangle, XCircle, Download, Building2,
  ChevronDown, Zap, TrendingUp, Scale
} from "lucide-react";
import { RadialBarChart, RadialBar, BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer } from "recharts";
import { applications, type ApplicationData } from "@/lib/application-data";

/* ─── Animated counter ─── */
function AnimatedNumber({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const inView = useInView(ref, { once: false, amount: 0.5 });

  useEffect(() => {
    if (inView) {
      mv.set(0);
      animate(mv, value, { duration });
    }
  }, [inView, value, duration, mv]);

  useEffect(() => {
    const unsub = mv.on("change", (v) => {
      if (ref.current) ref.current.textContent = Math.round(v).toString();
    });
    return unsub;
  }, [mv]);

  return <span ref={ref}>0</span>;
}

/* ─── Data source card (left) ─── */
function DataSourceCard({ name, icon: Icon, delay }: { name: string; icon: any; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="relative flex items-center gap-3 rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm px-4 py-3 shadow-sm"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <span className="text-xs font-medium text-foreground">{name}</span>
      {/* flowing dot */}
      <motion.div
        className="absolute -right-3 top-1/2 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]"
        animate={{ x: [0, 24, 0], opacity: [1, 0.4, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: delay * 0.5 }}
      />
    </motion.div>
  );
}

/* ─── Processing module chip ─── */
function ModuleChip({ label, angle, active }: { label: string; angle: number; active: boolean }) {
  const r = 155;
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * r;
  const y = Math.sin(rad) * r;

  return (
    <motion.div
      className={`absolute whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-semibold backdrop-blur-sm transition-colors duration-500 ${
        active
          ? "border-primary/60 bg-primary/20 text-primary shadow-[0_0_16px_hsl(var(--primary)/0.3)]"
          : "border-border/40 bg-card/60 text-muted-foreground"
      }`}
      style={{ left: `calc(50% + ${x}px - 60px)`, top: `calc(50% + ${y}px - 14px)`, width: 120, textAlign: "center" }}
      animate={active ? { scale: [1, 1.08, 1] } : {}}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      {label}
    </motion.div>
  );
}

/* ─── Result card (right) ─── */
function ResultCard({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm p-4 shadow-sm"
    >
      {children}
    </motion.div>
  );
}

/* ─── Risk color helper ─── */
function riskColor(cat: string) {
  if (cat === "Low") return "text-risk-low";
  if (cat === "High") return "text-risk-high";
  return "text-risk-medium";
}
function riskBg(cat: string) {
  if (cat === "Low") return "hsl(var(--risk-low))";
  if (cat === "High") return "hsl(var(--risk-high))";
  return "hsl(var(--risk-medium))";
}
function riskBarColor(score: number) {
  if (score >= 70) return "hsl(var(--risk-high))";
  if (score >= 40) return "hsl(var(--risk-medium))";
  return "hsl(var(--risk-low))";
}

const modules = [
  "Document Extraction",
  "Doc Verification",
  "Research Intel",
  "Risk Scoring",
  "Explainable AI",
  "CAM Generator",
];

export function AICommandCenter() {
  const [selectedId, setSelectedId] = useState(applications[0].id);
  const [activeModule, setActiveModule] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const app = applications.find((a) => a.id === selectedId)!;

  // cycle active module
  useEffect(() => {
    const interval = setInterval(() => setActiveModule((p) => (p + 1) % modules.length), 2000);
    return () => clearInterval(interval);
  }, []);

  const gaugeData = [{ value: app.riskScore, fill: riskBg(app.riskCategory) }];

  return (
    <section ref={sectionRef} id="command-center" className="relative py-24 overflow-hidden">
      {/* subtle bg glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="container relative mx-auto max-w-7xl px-4">
        {/* Header + Selector */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 text-center">
          <span className="mb-3 inline-block rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-semibold text-primary">
            AI Command Center
          </span>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">Real-Time Credit Intelligence</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Select an application to watch the AI engine analyze documents, score risk, and generate recommendations.
          </p>

          {/* App selector */}
          <div className="relative mx-auto mt-6 w-full max-w-sm">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-card/80 backdrop-blur-sm px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-primary/40"
            >
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                {app.company}
              </span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute z-30 mt-1 w-full rounded-lg border border-border/60 bg-card/95 backdrop-blur-md shadow-lg"
                >
                  {applications.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => { setSelectedId(a.id); setDropdownOpen(false); }}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-primary/10 first:rounded-t-lg last:rounded-b-lg ${
                        a.id === selectedId ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{a.company}</p>
                        <p className="text-[10px] text-muted-foreground">{a.sector} · ₹{a.loanAmount} Cr</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Main 3-col layout */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedId}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="grid gap-8 lg:grid-cols-[240px_1fr_280px] items-start"
          >
            {/* LEFT — Data Sources */}
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Data Sources</p>
              {[
                { name: "Corporate Documents", icon: FileText },
                { name: "Financial Statements", icon: BarChart3 },
                { name: "GST & Tax Data", icon: Scale },
                { name: "Bank Statements", icon: Building2 },
                { name: "External Intelligence", icon: Search },
              ].map((s, i) => (
                <DataSourceCard key={s.name} {...s} delay={i * 0.1} />
              ))}

              {/* Doc verification status */}
              <div className="mt-4 rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm p-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Document Status</p>
                {app.documents.map((d) => (
                  <div key={d.name} className="flex items-center justify-between py-1">
                    <span className="text-[11px] text-foreground">{d.name}</span>
                    {d.status === "Verified" && <CheckCircle2 className="h-3.5 w-3.5 text-risk-low" />}
                    {d.status === "Pending" && <AlertTriangle className="h-3.5 w-3.5 text-risk-medium" />}
                    {d.status === "Flagged" && <XCircle className="h-3.5 w-3.5 text-risk-high" />}
                  </div>
                ))}
              </div>
            </div>

            {/* CENTER — AI Engine */}
            <div className="flex flex-col items-center">
              <div className="relative h-[360px] w-[360px]">
                {/* outer rotating ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                />
                {/* mid ring */}
                <motion.div
                  className="absolute inset-6 rounded-full border border-primary/10"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                />
                {/* glow */}
                <div className="absolute inset-12 rounded-full bg-primary/5 blur-xl" />
                {/* core */}
                <motion.div
                  className="absolute inset-16 flex flex-col items-center justify-center rounded-full border border-primary/30 bg-card/90 backdrop-blur-md shadow-lg"
                  animate={{ boxShadow: ["0 0 20px hsl(var(--primary)/0.1)", "0 0 40px hsl(var(--primary)/0.25)", "0 0 20px hsl(var(--primary)/0.1)"] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Brain className="h-6 w-6 text-primary mb-1" />
                  <p className="text-[10px] font-bold text-primary tracking-wide">INTELLI-CREDIT</p>
                  <p className="text-[9px] text-muted-foreground font-semibold">AI ENGINE</p>
                </motion.div>

                {/* module chips */}
                {modules.map((m, i) => (
                  <ModuleChip key={m} label={m} angle={i * 60 - 90} active={i === activeModule} />
                ))}
              </div>

              {/* Pipeline steps */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-1">
                {["Ingest", "Extract", "Verify", "Research", "Score", "Explain", "CAM", "Decision"].map((step, i) => (
                  <div key={step} className="flex items-center gap-1">
                    <motion.div
                      className={`rounded-full px-2.5 py-1 text-[9px] font-semibold transition-colors ${
                        i <= activeModule + 1
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "bg-muted/50 text-muted-foreground border border-border/30"
                      }`}
                      animate={i === activeModule + 1 ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {step}
                    </motion.div>
                    {i < 7 && (
                      <motion.div
                        className="h-0.5 w-3 rounded-full bg-primary/30"
                        animate={i <= activeModule ? { opacity: [0.3, 1, 0.3] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — Results */}
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">AI Analysis Results</p>

              {/* Risk Score Gauge */}
              <ResultCard delay={0.1}>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Risk Score</p>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" startAngle={180} endAngle={0} data={gaugeData} barSize={8}>
                        <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "hsl(var(--muted))" }} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <p className={`text-3xl font-bold ${riskColor(app.riskCategory)}`}>
                      <AnimatedNumber value={app.riskScore} />
                    </p>
                    <p className={`text-xs font-semibold ${riskColor(app.riskCategory)}`}>{app.riskCategory} Risk</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">PD: {(app.defaultProbability * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </ResultCard>

              {/* Risk Factors Bar */}
              <ResultCard delay={0.2}>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Risk Factor Analysis</p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={app.riskFactorScores} layout="vertical" margin={{ left: 2, right: 8, top: 0, bottom: 0 }}>
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis type="category" dataKey="name" width={65} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={10}>
                        {app.riskFactorScores.map((entry) => (
                          <Cell key={entry.name} fill={riskBarColor(entry.score)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ResultCard>

              {/* Top Risk Factors */}
              <ResultCard delay={0.3}>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Top Risk Triggers</p>
                <ul className="space-y-1.5">
                  {app.topRiskFactors.slice(0, 3).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-foreground">
                      <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-risk-medium" />
                      {f}
                    </li>
                  ))}
                </ul>
              </ResultCard>

              {/* Research Signals */}
              <ResultCard delay={0.35}>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Research Signals</p>
                {app.researchSignals.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      s.sentiment === "Positive" ? "bg-risk-low" : s.sentiment === "Negative" ? "bg-risk-high" : "bg-risk-medium"
                    }`} />
                    <span className="text-[10px] text-foreground truncate">{s.title}</span>
                  </div>
                ))}
              </ResultCard>

              {/* CAM + Recommendation */}
              <ResultCard delay={0.4}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Recommendation</p>
                  <button className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary hover:bg-primary/20 transition-colors">
                    <Download className="h-3 w-3" /> CAM
                  </button>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Decision</span>
                    <span className={`font-semibold ${
                      app.recommendation.decision === "Approve" ? "text-risk-low" :
                      app.recommendation.decision === "Reject" ? "text-risk-high" : "text-risk-medium"
                    }`}>{app.recommendation.decision}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Limit</span>
                    <span className="font-medium text-foreground">{app.recommendation.suggestedLimit}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="font-medium text-foreground">{app.recommendation.interestRate}</span>
                  </div>
                </div>
              </ResultCard>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
