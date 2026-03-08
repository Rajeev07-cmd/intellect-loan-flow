import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Play, Shield, TrendingUp, BarChart3, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedValue } from "@/components/ui/animated-value";

const stats = [
  { value: "12,847", label: "Applications Processed" },
  { value: "4.2 hrs", label: "Avg Processing Time" },
  { value: "96.8%", label: "Accuracy Rate" },
  { value: "₹28,470 Cr", label: "Loans Evaluated" },
];

const floatingIcons = [
  { Icon: Shield, x: "8%", y: "25%", delay: 0, size: "h-5 w-5" },
  { Icon: TrendingUp, x: "88%", y: "18%", delay: 0.5, size: "h-6 w-6" },
  { Icon: BarChart3, x: "78%", y: "72%", delay: 1, size: "h-5 w-5" },
  { Icon: FileCheck, x: "12%", y: "70%", delay: 1.5, size: "h-4 w-4" },
];

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section id="home" className="relative pt-32 pb-24 px-6 overflow-hidden">
      {/* Ambient backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-4/5" />
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-chart-4/5 rounded-full blur-[120px]" />

      {/* Floating icons */}
      {floatingIcons.map(({ Icon, x, y, delay, size }, i) => (
        <motion.div
          key={i}
          className="absolute hidden lg:block"
          style={{ left: x, top: y }}
          animate={{ y: [0, -18, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay }}
        >
          <div className="p-3 rounded-xl bg-card/80 border border-border/50 backdrop-blur-sm shadow-lg">
            <Icon className={`${size} text-primary/60`} />
          </div>
        </motion.div>
      ))}

      <div className="relative max-w-5xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-xs font-medium text-primary">AI-Powered Credit Intelligence Platform</span>
          </motion.div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
            <span className="text-gradient">AI-Powered</span> Corporate
            <br />
            Credit Decisioning
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Automating corporate loan risk assessment, document verification, and credit appraisal memo generation using explainable AI.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button size="lg" onClick={() => navigate("/login")} className="gap-2 px-8 h-12 text-base">
            Explore Platform <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 h-12 text-base"
            onClick={() => document.getElementById("workflow")?.scrollIntoView({ behavior: "smooth" })}
          >
            <Play className="h-4 w-4" /> View Demo
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              whileHover={{ y: -4, scale: 1.03 }}
              className="glass-card p-6 text-center cursor-default"
            >
              <AnimatedValue value={s.value} className="text-2xl md:text-3xl font-bold text-foreground" />
              <p className="text-xs text-muted-foreground mt-1.5">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
