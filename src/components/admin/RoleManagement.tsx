import { motion } from "framer-motion";
import { Shield, Check, X, Eye, Edit, FileText, Users, Settings, Brain, GitBranch } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Permission {
  label: string;
  icon: LucideIcon;
  admin: boolean;
  officer: boolean;
  viewer: boolean;
}

const permissions: Permission[] = [
  { label: "View Dashboard", icon: Eye, admin: true, officer: true, viewer: true },
  { label: "Create Applications", icon: FileText, admin: true, officer: true, viewer: false },
  { label: "Run Risk Scoring", icon: Brain, admin: true, officer: true, viewer: false },
  { label: "Generate CAM", icon: Edit, admin: true, officer: true, viewer: false },
  { label: "Approve / Reject", icon: GitBranch, admin: true, officer: false, viewer: false },
  { label: "Manage Users", icon: Users, admin: true, officer: false, viewer: false },
  { label: "Configure Model Weights", icon: Settings, admin: true, officer: false, viewer: false },
  { label: "View Audit Logs", icon: Shield, admin: true, officer: false, viewer: true },
  { label: "Export Data", icon: FileText, admin: true, officer: true, viewer: false },
  { label: "Override Risk Scores", icon: Brain, admin: true, officer: false, viewer: false },
];

const roles = [
  { name: "Admin", count: 2, color: "primary" },
  { name: "Credit Officer", count: 3, color: "risk-medium" },
  { name: "Viewer", count: 2, color: "muted-foreground" },
];

export function RoleManagement() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Role Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((role, i) => (
          <motion.div key={role.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg bg-${role.color}/10`}>
                <Shield className={`h-5 w-5 text-${role.color}`} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">{role.name}</h4>
                <p className="text-[10px] text-muted-foreground">{role.count} users assigned</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {role.name === "Admin" ? "Full system access including configuration and user management" :
               role.name === "Credit Officer" ? "Create, analyze, and process credit applications" :
               "Read-only access to dashboards and audit logs"}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Permissions Matrix */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground">Permissions Matrix</h3>
          <p className="text-[10px] text-muted-foreground mt-1">Role-based access control configuration</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-1/3">Permission</th>
              <th className="text-center p-3 text-[10px] uppercase tracking-wider text-primary font-semibold">Admin</th>
              <th className="text-center p-3 text-[10px] uppercase tracking-wider text-risk-medium font-semibold">Credit Officer</th>
              <th className="text-center p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Viewer</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((p, i) => (
              <motion.tr key={p.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <p.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-foreground">{p.label}</span>
                  </div>
                </td>
                {[p.admin, p.officer, p.viewer].map((granted, j) => (
                  <td key={j} className="p-3 text-center">
                    {granted ? (
                      <Check className="h-4 w-4 text-risk-low mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                    )}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
