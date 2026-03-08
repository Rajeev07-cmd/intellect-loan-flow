import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Eye, EyeOff, ArrowRight, Loader2, Users, Briefcase, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { useAuth, UserRole } from "@/contexts/AuthContext";

type RoleSelection = "credit_officer" | "manager";

export default function Signup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();
  
  const [selectedRole, setSelectedRole] = useState<RoleSelection | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      toast({ title: "Select Role", description: "Please select your role.", variant: "destructive" });
      return;
    }
    if (!fullName || !email || !password) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Password Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Weak Password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, fullName, selectedRole as UserRole);

    setLoading(false);

    if (error) {
      toast({ title: "Signup Failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ 
      title: "Account Created!", 
      description: "Please check your email to verify your account before logging in." 
    });
    navigate("/login");
  };

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
              Join the Future of<br />
              <span className="text-gradient">Credit Decisioning</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-md leading-relaxed">
              Create your account to access AI-powered credit appraisal tools.
              Streamline your workflow and make better decisions faster.
            </p>
          </motion.div>

          <div className="space-y-3">
            {[
              "Automated document verification",
              "ML-powered risk assessment",
              "Real-time CAM generation",
              "Role-based access control",
            ].map((feature, i) => (
              <motion.div 
                key={feature} 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[10px] text-muted-foreground/50">© 2026 Intelli-Credit. Enterprise License.</p>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold text-foreground">Intelli-Credit</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign up to start using the credit platform</p>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Select Your Role</label>
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
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</label>
              <Input 
                type="text" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                placeholder="Rajesh Kumar" 
                className="bg-muted/50 border-border/50 h-11 text-foreground placeholder:text-muted-foreground" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="name@company.com" 
                className="bg-muted/50 border-border/50 h-11 text-foreground placeholder:text-muted-foreground" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="bg-muted/50 border-border/50 h-11 pr-10 text-foreground placeholder:text-muted-foreground" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Confirm Password</label>
              <Input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="••••••••" 
                className="bg-muted/50 border-border/50 h-11 text-foreground placeholder:text-muted-foreground" 
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</>
              ) : (
                <><UserPlus className="mr-2 h-4 w-4" /> Create Account</>
              )}
            </Button>
          </form>

          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:text-primary/80 font-medium">
                Sign In
              </Link>
            </p>
            <p className="text-xs text-muted-foreground">
              By signing up, you agree to our{" "}
              <span className="text-primary cursor-pointer hover:underline">Terms</span>
              {" & "}
              <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
