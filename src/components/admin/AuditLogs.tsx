import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Download, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AuditLog {
  id: string;
  created_at: string;
  user_name: string | null;
  event_type: string;
  event_description: string;
  application_id: string | null;
}

const levelStyles: Record<string, string> = {
  config: "bg-primary/15 text-primary border border-primary/20",
  action: "bg-risk-low/15 text-risk-low border border-risk-low/20",
  decision: "bg-risk-medium/15 text-risk-medium border border-risk-medium/20",
  access: "bg-muted text-muted-foreground border border-border",
};

function getLevel(eventType: string): string {
  const lower = eventType.toLowerCase();
  if (lower.includes("approv") || lower.includes("reject") || lower.includes("decision")) return "decision";
  if (lower.includes("config") || lower.includes("threshold") || lower.includes("weight")) return "config";
  if (lower.includes("view") || lower.includes("login")) return "access";
  return "action";
}

export function AuditLogs() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) setLogs(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
    const channel = supabase
      .channel("audit_logs_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_logs" }, () => fetchLogs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLogs]);

  const filtered = logs
    .filter(l => filter === "all" || getLevel(l.event_type) === filter)
    .filter(l => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (l.user_name || "").toLowerCase().includes(q) || l.event_type.toLowerCase().includes(q) || l.event_description.toLowerCase().includes(q);
    });

  const handleExport = () => {
    const csv = [
      "Timestamp,User,Event Type,Description",
      ...filtered.map(l => `${l.created_at},${l.user_name || "System"},${l.event_type},"${l.event_description}"`)
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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                {["Timestamp", "User", "Event Type", "Description", "Type"].map(h => (
                  <th key={h} className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">No audit logs found. Actions will appear here as you use the platform.</td>
                </tr>
              ) : (
                filtered.map((log, i) => {
                  const level = getLevel(log.event_type);
                  return (
                    <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="p-3 text-[11px] text-muted-foreground font-mono whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-3 text-xs font-medium text-foreground whitespace-nowrap">{log.user_name || "System"}</td>
                      <td className="p-3 text-xs text-foreground">{log.event_type}</td>
                      <td className="p-3 text-xs text-muted-foreground max-w-[300px] truncate">{log.event_description}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${levelStyles[level] || levelStyles.action}`}>{level}</span>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
