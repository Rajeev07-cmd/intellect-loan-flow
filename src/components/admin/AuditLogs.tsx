import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const logs = [
  { id: 1, timestamp: "2026-03-03 14:32:15", user: "Rajesh Kumar", action: "Updated risk threshold", resource: "Auto-Reject Threshold → 85", level: "config", ip: "192.168.1.45" },
  { id: 2, timestamp: "2026-03-03 13:18:42", user: "Priya Sharma", action: "Generated CAM report", resource: "APP-001 (Tata Steel Ltd)", level: "action", ip: "192.168.1.102" },
  { id: 3, timestamp: "2026-03-03 12:05:33", user: "Amit Patel", action: "Uploaded documents", resource: "GST_Returns_FY24.pdf, ITR_FY23.pdf", level: "action", ip: "192.168.1.78" },
  { id: 4, timestamp: "2026-03-03 11:47:19", user: "Rajesh Kumar", action: "Modified model weights", resource: "Character: 20→22, Capacity: 25→23", level: "config", ip: "192.168.1.45" },
  { id: 5, timestamp: "2026-03-03 10:22:08", user: "Sneha Reddy", action: "Viewed audit logs", resource: "Admin Panel / Audit", level: "access", ip: "192.168.1.201" },
  { id: 6, timestamp: "2026-03-02 17:55:44", user: "Rajesh Kumar", action: "Approved application", resource: "APP-004 (Infosys Ltd) — ₹350 Cr", level: "decision", ip: "192.168.1.45" },
  { id: 7, timestamp: "2026-03-02 16:30:12", user: "Vikram Singh", action: "Rejected application", resource: "APP-008 (Vedanta Ltd) — High litigation risk", level: "decision", ip: "192.168.1.156" },
  { id: 8, timestamp: "2026-03-02 15:10:55", user: "Anita Desai", action: "Added new user", resource: "rohit.mehta@intellicredit.com (Viewer)", level: "config", ip: "192.168.1.88" },
  { id: 9, timestamp: "2026-03-02 14:02:31", user: "Priya Sharma", action: "Ran risk scoring", resource: "APP-002 (Reliance Industries) — Score: 35", level: "action", ip: "192.168.1.102" },
  { id: 10, timestamp: "2026-03-02 11:45:20", user: "Amit Patel", action: "Updated due diligence", resource: "APP-003 — Factory utilization: 40%", level: "action", ip: "192.168.1.78" },
];

const levelStyles: Record<string, string> = {
  config: "bg-primary/15 text-primary border border-primary/20",
  action: "bg-risk-low/15 text-risk-low border border-risk-low/20",
  decision: "bg-risk-medium/15 text-risk-medium border border-risk-medium/20",
  access: "bg-muted text-muted-foreground border border-border",
};

export function AuditLogs() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const filtered = logs
    .filter(l => filter === "all" || l.level === filter)
    .filter(l => {
      if (!search) return true;
      const q = search.toLowerCase();
      return l.user.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.resource.toLowerCase().includes(q);
    });

  const handleExport = () => {
    const csv = [
      "Timestamp,User,Action,Resource,Type,IP",
      ...filtered.map(l => `${l.timestamp},${l.user},${l.action},"${l.resource}",${l.level},${l.ip}`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit_logs.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export Complete", description: `${filtered.length} audit log entries exported as CSV.` });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5 border border-border/50">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search logs..."
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-48"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-36 bg-muted/50 border-border/50 text-foreground h-9 text-xs">
              <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="config">Configuration</SelectItem>
              <SelectItem value="action">Actions</SelectItem>
              <SelectItem value="decision">Decisions</SelectItem>
              <SelectItem value="access">Access</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" className="gap-2 border-border/50 text-muted-foreground hover:text-foreground" onClick={handleExport}>
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              {["Timestamp", "User", "Action", "Resource", "Type", "IP"].map(h => (
                <th key={h} className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">No logs matching your criteria.</td>
              </tr>
            ) : (
              filtered.map((log, i) => (
                <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="p-3 text-[11px] text-muted-foreground font-mono whitespace-nowrap">{log.timestamp}</td>
                  <td className="p-3 text-xs font-medium text-foreground whitespace-nowrap">{log.user}</td>
                  <td className="p-3 text-xs text-foreground">{log.action}</td>
                  <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate">{log.resource}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${levelStyles[log.level]}`}>{log.level}</span>
                  </td>
                  <td className="p-3 text-[11px] text-muted-foreground font-mono">{log.ip}</td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
