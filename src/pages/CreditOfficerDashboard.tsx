import { motion } from "framer-motion";
import { Upload, FileText, FileCheck, Shield, BookOpen, Clock, ChevronRight, Building2 } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { companyApplications } from "@/lib/company-data";
import { useApplicationStore } from "@/store/useApplicationStore";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function CreditOfficerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setSelectedApplication } = useApplicationStore();

  const pending = companyApplications.filter(a => a.status === "Under Review" || a.status === "Pending");
  const docsPending = companyApplications.reduce((sum, a) => sum + a.documents.filter(d => d.status === "pending").length, 0);
  const riskQueue = companyApplications.filter(a => a.riskScore > 50).length;

  const handleSelectApp = (app: typeof companyApplications[0]) => {
    setSelectedApplication(app);
    navigate("/credit-officer/document-verification");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Credit Officer Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Loan processing and analysis workspace</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate("/credit-officer/applications")}>
          <KpiCard title="Pending Review" value={pending.length} icon={Clock} trend={{ value: 5, positive: false }} index={0} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate("/credit-officer/applications")}>
          <KpiCard title="Docs Pending" value={docsPending} icon={FileCheck} variant="risk-medium" index={1} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate("/credit-officer/applications")}>
          <KpiCard title="Risk Queue" value={riskQueue} icon={Shield} variant="risk-high" trend={{ value: 8, positive: false }} index={2} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate("/credit-officer/applications")}>
          <KpiCard title="CAMs Generated" value={14} icon={BookOpen} variant="risk-low" trend={{ value: 20, positive: true }} index={3} />
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-20 flex-col gap-2 glass-card-hover" onClick={() => navigate("/credit-officer/applications")}>
            <Upload className="h-5 w-5 text-primary" />
            <span className="text-xs">View Applications</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2 glass-card-hover" onClick={() => navigate("/credit-officer/applications")}>
            <FileCheck className="h-5 w-5 text-primary" />
            <span className="text-xs">Verify Documents</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2 glass-card-hover" onClick={() => navigate("/credit-officer/applications")}>
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-xs">Run Risk Analysis</span>
          </Button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Recent Applications</h3>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/credit-officer/applications")}>
            View All <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Company</th>
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sector</th>
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Risk Score</th>
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Status</th>
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Loan (₹ Cr)</th>
              </tr>
            </thead>
            <tbody>
              {companyApplications.slice(0, 5).map(app => (
                <tr key={app.id} className="border-b border-border/30 hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => handleSelectApp(app)}>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">{app.company}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{app.cin}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{app.sector}</td>
                  <td className="p-3"><RiskBadge score={app.riskScore} label={`${app.riskScore}`} size="md" /></td>
                  <td className="p-3"><StatusBadge status={app.status} /></td>
                  <td className="p-3 text-foreground font-medium">₹{app.loanAmount} Cr</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
