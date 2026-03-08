import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Zap, Shield, FileCheck, Brain, BookOpen, BarChart3, TrendingUp,
  ArrowRight, ChevronRight, Menu, X, Mail, Phone, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "AI Risk Engine", href: "#risk-engine" },
  { label: "CAM Generator", href: "#cam" },
  { label: "Contact", href: "#contact" },
];

const features = [
  { icon: FileCheck, title: "AI Document Verification", desc: "Automated extraction and cross-validation of corporate documents with 98% accuracy." },
  { icon: Shield, title: "Corporate Risk Scoring", desc: "Five Cs analysis powered by explainable AI for transparent credit risk assessment." },
  { icon: Brain, title: "Explainable AI", desc: "Every risk score comes with clear reasoning — no black box decisions." },
  { icon: BookOpen, title: "CAM Generation", desc: "Auto-generate comprehensive Credit Appraisal Memos in minutes, not weeks." },
  { icon: BarChart3, title: "Portfolio Monitoring", desc: "Real-time portfolio analytics with sector exposure and risk distribution insights." },
  { icon: TrendingUp, title: "Decision Intelligence", desc: "Multi-level approval workflows with human-in-the-loop final decisions." },
];

const stats = [
  { value: "12,847", label: "Applications Processed" },
  { value: "4.2 hrs", label: "Avg Processing Time" },
  { value: "96.8%", label: "Accuracy Rate" },
  { value: "₹28,470 Cr", label: "Loans Evaluated" },
];

export default function Index() {
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold">Intelli-Credit</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Login</Button>
            <Button size="sm" onClick={() => navigate("/login")} className="gap-1.5">Register <ArrowRight className="h-3.5 w-3.5" /></Button>
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenu && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden bg-background border-b border-border/50 px-6 py-4 space-y-3">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="block text-sm text-muted-foreground py-2" onClick={() => setMobileMenu(false)}>
                {item.label}
              </a>
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Login</Button>
              <Button size="sm" onClick={() => navigate("/login")}>Register</Button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[100px]" />

        {/* Floating icons */}
        {[
          { Icon: Shield, x: "10%", y: "20%", delay: 0 },
          { Icon: TrendingUp, x: "85%", y: "15%", delay: 0.5 },
          { Icon: BarChart3, x: "75%", y: "70%", delay: 1 },
          { Icon: FileCheck, x: "15%", y: "75%", delay: 1.5 },
        ].map(({ Icon, x, y, delay }, i) => (
          <motion.div
            key={i}
            className="absolute hidden lg:block"
            style={{ left: x, top: y }}
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay }}
          >
            <div className="p-3 rounded-xl bg-card/80 border border-border/50 backdrop-blur-sm shadow-lg">
              <Icon className="h-5 w-5 text-primary/60" />
            </div>
          </motion.div>
        ))}

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">AI-Powered Credit Intelligence</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Intelli-Credit
              <br />
              <span className="text-gradient">Corporate Credit Decisioning</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Automating Corporate Loan Risk Assessment and Credit Appraisal Memo Generation.
              From data ingestion to final recommendation — in minutes, not weeks.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/login")} className="gap-2 px-8">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
              Explore Features
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 + i * 0.1 }}
                className="glass-card p-5 text-center"
              >
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl font-bold">Platform Capabilities</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">End-to-end credit decisioning powered by AI, built for enterprise financial institutions.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-card-hover p-6 group"
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

      {/* AI Risk Engine Section */}
      <section id="risk-engine" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold">AI Risk Scoring Engine</h2>
              <p className="text-muted-foreground mt-3 leading-relaxed">
                Our Five Cs analysis engine evaluates Character, Capacity, Capital, Collateral, and Conditions — with full explainability for every score component.
              </p>
              <div className="mt-6 space-y-3">
                {["Explainable risk factors", "Real-time score simulation", "Regulatory compliance ready", "Integration with MCA, CIBIL, GST"].map((item, i) => (
                  <motion.div key={item} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <ChevronRight className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              className="glass-card p-8"
            >
              <div className="space-y-4">
                {[
                  { name: "Character", score: 78 },
                  { name: "Capacity", score: 65 },
                  { name: "Capital", score: 82 },
                  { name: "Collateral", score: 55 },
                  { name: "Conditions", score: 48 },
                ].map((c) => (
                  <div key={c.name}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-medium">{c.name}</span>
                      <span className="text-sm font-bold">{c.score}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${c.score}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className={`h-full rounded-full ${c.score >= 70 ? "bg-risk-low" : c.score >= 50 ? "bg-risk-medium" : "bg-risk-high"}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CAM Section */}
      <section id="cam" className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold">Automated CAM Generation</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Generate comprehensive Credit Appraisal Memos with AI — complete with financial analysis, risk assessment, and actionable recommendations.
            </p>
            <Button size="lg" className="mt-8 gap-2" onClick={() => navigate("/login")}>
              Try It Now <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold">Get In Touch</h2>
            <p className="text-muted-foreground mt-3">Interested in transforming your credit appraisal process?</p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Mail, label: "Email", value: "contact@intelli-credit.ai" },
                { icon: Phone, label: "Phone", value: "+91 22 4000 1234" },
                { icon: MapPin, label: "Office", value: "Mumbai, India" },
              ].map((c) => (
                <div key={c.label} className="glass-card p-6 text-center">
                  <c.icon className="h-6 w-6 text-primary mx-auto mb-3" />
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="text-sm font-medium text-foreground mt-1">{c.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <span className="text-base font-bold">Intelli-Credit</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm">AI Powered Credit Intelligence — Transforming corporate loan risk assessment for banks and NBFCs.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Quick Links</h4>
              <div className="space-y-2">
                {["Features", "Risk Engine", "CAM Generator", "Contact"].map((l) => (
                  <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Platform</h4>
              <div className="space-y-2">
                {["Login", "Register", "Documentation", "Support"].map((l) => (
                  <button key={l} onClick={() => l === "Login" || l === "Register" ? navigate("/login") : null} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-border/50 mt-8 pt-8 text-center">
            <p className="text-xs text-muted-foreground">© 2026 Intelli-Credit Platform. AI Powered Credit Intelligence. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
