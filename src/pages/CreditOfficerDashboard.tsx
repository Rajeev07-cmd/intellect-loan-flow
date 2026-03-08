import { motion } from "framer-motion";
import { Upload, FileText, FileCheck, Shield, BookOpen, AlertTriangle, Clock, ChevronRight } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { RiskBadge } from "@/components/ui/risk-badge";
import { recentApplications } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function CreditOfficerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const pending = recentApplications.filter(a => a.status === "Under Review" || a.status === "Pending");
  const docsPending = 3;
  const riskQueue = recentApplications.filter(a => a.riskScore > 50).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Credit Officer Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Loan processing and analysis workspace</p>
      </div>

      {/* KPIs - clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate("/credit-officer/applications")}>
          <KpiCard title="Pending Review" value={pending.length} icon={Clock} trend={{ value: 5, positive: false }} index={0} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate("/credit-officer/document-verification")}>
          <KpiCard title="Docs Pending" value={docsPending} icon={FileCheck} variant="risk-medium" index={1} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate("/credit-officer/risk-engine")}>
          <KpiCard title="Risk Queue" value={riskQueue} icon={Shield} variant="risk-high" trend={{ value: 8, positive: false }} index={2} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate("/credit-officer/cam-generator")}>
          <KpiCard title="CAMs Generated" value={14} icon={BookOpen} variant="risk-low" trend={{ value: 20, positive: true }} index={3} />
        </motion.div>
      </div>

      {/* Upload New Application */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-20 flex-col gap-2 glass-card-hover" onClick={() => { navigate("/credit-officer/applications"); toast({ title: "Navigate", description: "Opening loan application workspace." }); }}>
            <Upload className="h-5 w-5 text-primary" />
            <span className="text-xs">Upload New Application</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2 glass-card-hover" onClick={() => navigate("/credit-officer/document-verification")}>
            <FileCheck className="h-5 w-5 text-primary" />
            <span className="text-xs">Verify Documents</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2 glass-card-hover" onClick={() => navigate("/credit-officer/risk-engine")}>
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-xs">Run Risk Analysis</span>
          </Button>
        </div>
      </motion.div>

      {/* Recent Applications */}
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
              {recentApplications.slice(0, 5).map((app) => (
                <tr key={app.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate("/credit-officer/applications")}>
                  <td className="p-3">
                    <p className="font-medium text-foreground">{app.company}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{app.cin}</p>
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
