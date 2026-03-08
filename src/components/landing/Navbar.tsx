import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Workflow", href: "#workflow" },
  { label: "Platform", href: "#platform" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-2xl border-b border-border/40">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center"
          >
            <Zap className="h-5 w-5 text-primary" />
          </motion.div>
          <span className="text-lg font-bold tracking-tight">Intelli-Credit</span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <motion.a
              key={item.label}
              href={item.href}
              whileHover={{ y: -1 }}
              className="relative px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              {item.label}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary rounded-full group-hover:w-4/5 transition-all duration-300" />
            </motion.a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
            Login
          </Button>
          <Button size="sm" onClick={() => navigate("/login")} className="gap-1.5">
            Register <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <button className="lg:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)}>
          {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background border-b border-border/40 px-6 pb-4 overflow-hidden"
          >
            {navItems.map((item, i) => (
              <motion.a
                key={item.label}
                href={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="block text-sm text-muted-foreground py-2.5 hover:text-foreground"
                onClick={() => setMobileMenu(false)}
              >
                {item.label}
              </motion.a>
            ))}
            <div className="flex gap-2 pt-3">
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Login</Button>
              <Button size="sm" onClick={() => navigate("/login")}>Register</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
