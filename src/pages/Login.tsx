import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Eye, EyeOff, ArrowRight, Loader2, Users, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";


export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signIn, resetPassword, user, profile, loading: authLoading, sessionExpired } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && profile) {
      const from = (location.state as any)?.from?.pathname;
      const redirectPath = from || (profile.role === "manager" 
        ? "/manager-dashboard" 
        : "/dashboard");
      navigate(redirectPath, { replace: true });
    }
  }, [user, profile, authLoading, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({ title: "Validation Error", description: "Please enter both email and password.", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setLoading(false);
      const description = error.message.includes("Email not confirmed")
        ? "Please verify your email or contact administrator."
        : error.message;
      toast({ title: "Login Failed", description, variant: "destructive" });
      return;
    }

    // Auth state listener will handle the redirect
    toast({ title: "Welcome back!", description: "Signing you in..." });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({ title: "Error", description: "Please enter your email address.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(resetEmail);
    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Reset Link Sent", description: `Password reset instructions sent to ${resetEmail}` });
    setShowForgotPassword(false);
    setResetEmail("");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background relative">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">Intelli-Credit</span>
          </div>
          <p className="text-sm text-muted-foreground">AI-Powered Corporate Credit Decisioning Platform</p>
        </div>

        <div className="relative z-10 space-y-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-3xl font-bold text-foreground leading-tight">
              AI-Powered Credit<br />
              <span className="text-gradient">Decisioning Engine</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-md leading-relaxed">
              Automate comprehensive credit appraisal memos with explainable AI.
              From data ingestion to final recommendation — in minutes, not weeks.
            </p>
          </motion.div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Applications Processed", value: "12,847" },
              { label: "Avg. Processing Time", value: "4.2 hrs" },
              { label: "Accuracy Rate", value: "96.8%" },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="glass-card p-4">
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[10px] text-muted-foreground/50">© 2026 Intelli-Credit. Enterprise License.</p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold text-foreground">Intelli-Credit</span>
          </div>

          {showForgotPassword ? (
            <>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
                <p className="text-sm text-muted-foreground mt-1">Enter your email to receive a reset link</p>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                  <Input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="name@company.com" className="bg-muted/50 border-border/50 h-11 text-foreground placeholder:text-muted-foreground" />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Send Reset Link <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <button type="button" onClick={() => setShowForgotPassword(false)} className="text-xs text-primary hover:text-primary/80 w-full text-center">
                  Back to Sign In
                </button>
              </form>
            </>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
                <p className="text-sm text-muted-foreground mt-1">Sign in to your credit appraisal workspace</p>
              </div>

              {sessionExpired && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2"
                >
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Your session has expired. Please log in again.
                </motion.div>
              )}

              {/* Role Selection - informational only */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("credit_officer")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      selectedRole === "credit_officer"
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border/50 hover:border-primary/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg ${selectedRole === "credit_officer" ? "bg-primary/20" : "bg-muted/50"}`}>
                      <Briefcase className={`h-5 w-5 ${selectedRole === "credit_officer" ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <span className={`text-sm font-semibold ${selectedRole === "credit_officer" ? "text-primary" : "text-foreground"}`}>Credit Officer</span>
                    <span className="text-[10px] text-muted-foreground">Loan Processing</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("manager")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      selectedRole === "manager"
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border/50 hover:border-primary/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg ${selectedRole === "manager" ? "bg-primary/20" : "bg-muted/50"}`}>
                      <Users className={`h-5 w-5 ${selectedRole === "manager" ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <span className={`text-sm font-semibold ${selectedRole === "manager" ? "text-primary" : "text-foreground"}`}>Manager</span>
                    <span className="text-[10px] text-muted-foreground">Decision & Oversight</span>
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-1">Your dashboard will be based on your registered role</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className="bg-muted/50 border-border/50 h-11 text-foreground placeholder:text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
                    <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-primary hover:text-primary/80">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-muted/50 border-border/50 h-11 pr-10 text-foreground placeholder:text-muted-foreground" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...</> : <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
              </form>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-primary hover:text-primary/80 font-medium">
                    Sign Up
                  </Link>
                </p>
              </div>
            </>
          )}

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Protected by enterprise-grade security.{" "}
              <button onClick={() => toast({ title: "Terms of Service", description: "Terms of Service document will open in a new tab." })} className="text-primary cursor-pointer hover:underline">Terms</button>
              {" & "}
              <button onClick={() => toast({ title: "Privacy Policy", description: "Privacy Policy document will open in a new tab." })} className="text-primary cursor-pointer hover:underline">Privacy</button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
