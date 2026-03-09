import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Building2, ChevronRight, Plus, RefreshCw, Database, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { useApplicationStore, type CompanyApplication } from "@/store/useApplicationStore";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { NewApplicationWizard } from "@/components/applications/NewApplicationWizard";
import { mapDbApplicationToStoreApp } from "@/lib/applicationMapper";

interface DbApplication {
  id: string;
  company_name: string;
  cin: string | null;
  sector: string;
  loan_amount: number;
  risk_score: number | null;
  risk_category: string | null;
  default_probability: number | null;
  status: string;
  recommendation: string | null;
  interest_rate: string | null;
  suggested_limit: string | null;
  incorporation_year: string | null;
  registered_address: string | null;
  promoter_group: string | null;
  cibil_score: number | null;
  created_at: string;
}

export default function Applications() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("All");
  const [showNewModal, setShowNewModal] = useState(false);
  const [applications, setApplications] = useState<CompanyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { setSelectedApplication } = useApplicationStore();
  const navigate = useNavigate();

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications((data || []).map(mapDbApplicationToStoreApp));
    } catch (error) {
      console.error("Error fetching applications:", error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();

    const channel = supabase
      .channel("applications_list")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, () => fetchApplications())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchApplications]);

  const sectors = ["All", ...Array.from(new Set(applications.map(a => a.sector)))];

  const filtered = applications.filter(app => {
    const matchesSearch = !searchQuery ||
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.cin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.sector.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = sectorFilter === "All" || app.sector === sectorFilter;
    return matchesSearch && matchesSector;
  });

  const handleSelectApp = (app: CompanyApplication) => {
    setSelectedApplication(app);
    navigate("/document-verification");
  };

  const statusCounts = {
    total: applications.length,
    approved: applications.filter(a => a.status === "Approved").length,
    review: applications.filter(a => ["Under Review", "Pending", "Application Created"].includes(a.status)).length,
    high: applications.filter(a => a.status === "High Risk" || a.status === "Rejected").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Applications</h1>
          <p className="text-sm text-muted-foreground mt-1">Select an application to begin credit analysis workflow</p>
        </div>
        <div className="flex items-center gap-2">
          {applications.length > 0 && (
            <Badge variant="outline" className="gap-1.5 text-xs text-risk-low border-risk-low/30">
              <Database className="h-3 w-3" /> Live data
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={fetchApplications} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowNewModal(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New Application
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Applications", value: statusCounts.total, color: "text-primary" },
          { label: "Approved", value: statusCounts.approved, color: "text-risk-low" },
          { label: "Under Review", value: statusCounts.review, color: "text-risk-medium" },
          { label: "High Risk / Rejected", value: statusCounts.high, color: "text-risk-high" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-4"
          >
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by company, CIN, sector..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={sectorFilter}
            onChange={e => setSectorFilter(e.target.value)}
            className="bg-muted/50 text-sm text-foreground rounded-lg px-3 py-2 border-none outline-none"
          >
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading applications...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Company</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Sector</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Risk Score</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Status</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Loan Amount</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((app) => (
                <TableRow
                  key={app.id}
                  className="cursor-pointer hover:bg-primary/5 transition-colors"
                  onClick={() => handleSelectApp(app)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{app.company}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{app.cin}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{app.sector}</TableCell>
                  <TableCell><RiskBadge score={app.riskScore} label={`${app.riskScore}`} size="md" /></TableCell>
                  <TableCell><StatusBadge status={app.status} /></TableCell>
                  <TableCell className="text-sm font-medium text-foreground">₹{app.loanAmount} Cr</TableCell>
                  <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No applications found. Create a new loan application to begin.</p>
            <Button size="sm" className="mt-4 gap-2" onClick={() => setShowNewModal(true)}>
              <Plus className="h-4 w-4" /> Create Application
            </Button>
          </div>
        )}
      </motion.div>

      <NewApplicationWizard 
        open={showNewModal} 
        onOpenChange={setShowNewModal} 
        onSuccess={fetchApplications}
      />
    </div>
  );
}
