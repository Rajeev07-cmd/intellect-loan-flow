import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Eye, EyeOff, ArrowRight, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValidLink, setIsValidLink] = useState(false);

  useEffect(() => {
    // Check if this is a valid password reset link
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    
    if (type === "recovery") {
      setIsValidLink(true);
    } else {
      // Also check for access_token which indicates a valid session
      const accessToken = hashParams.get("access_token");
      if (accessToken) {
        setIsValidLink(true);
      }
    }
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast({ title: "Error", description: "Please enter a new password.", variant: "destructive" });
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

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Password Updated", description: "Your password has been reset successfully." });
    navigate("/login");
  };

  if (!isValidLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="w-full max-w-md p-8 text-center space-y-6"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">Intelli-Credit</span>
          </div>
          
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <h2 className="text-lg font-semibold text-destructive">Invalid Reset Link</h2>
            <p className="text-sm text-muted-foreground mt-2">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
          </div>
          
          <Button onClick={() => navigate("/login")} variant="outline" className="w-full">
            Back to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md p-8 space-y-6"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-bold text-foreground">Intelli-Credit</span>
        </div>

        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Set New Password</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter your new password below</p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New Password</label>
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
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
            ) : (
              <>Update Password <ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
