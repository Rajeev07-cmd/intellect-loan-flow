import { useNavigate } from "react-router-dom";
import { Zap, Github, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  const navigate = useNavigate();

  return (
    <footer id="contact" className="border-t border-border/50 bg-card/50">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <span className="text-base font-bold">Intelli-Credit</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI Powered Credit Intelligence — Transforming corporate loan risk assessment for banks and NBFCs.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Quick Links</h4>
            <div className="space-y-2.5">
              {[
                { label: "Platform", href: "#features" },
                { label: "AI Engine", href: "#architecture" },
                { label: "Features", href: "#risk-engine" },
                { label: "Solutions", href: "#cam" },
              ].map((l) => (
                <a key={l.label} href={l.href} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Platform</h4>
            <div className="space-y-2.5">
              {[
                { label: "Login", action: () => navigate("/login") },
                { label: "Register", action: () => navigate("/login") },
                { label: "Documentation", action: () => {} },
                { label: "API Reference", action: () => {} },
              ].map((l) => (
                <button key={l.label} onClick={l.action} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                contact@intelli-credit.ai
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                +91 22 4000 1234
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                Mumbai, India
              </div>
              <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-4 w-4 text-primary" />
                GitHub Repository
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 mt-10 pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 Intelli-Credit Platform. AI Powered Credit Intelligence. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
