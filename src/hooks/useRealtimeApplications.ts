import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DbApp {
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
  created_at: string;
}

export interface DashboardKpis {
  total: number;
  pendingReview: number;
  approved: number;
  highRisk: number;
  rejected: number;
  totalExposure: number;
  avgRiskScore: number;
}

export interface RiskBreakdown {
  name: string;
  value: number;
  fill: string;
}

export function useRealtimeApplications() {
  const [applications, setApplications] = useState<DbApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLiveData, setHasLiveData] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("id, company_name, cin, sector, loan_amount, risk_score, risk_category, default_probability, status, recommendation, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setApplications(data);
        setHasLiveData(true);
      } else {
        setHasLiveData(false);
      }
    } catch (err) {
      console.log("Realtime hook: falling back to mock data", err);
      setHasLiveData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();

    const channel = supabase
      .channel("dashboard_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
        () => {
          fetchApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchApplications]);

  const kpis: DashboardKpis = {
    total: applications.length,
    pendingReview: applications.filter(a => ["Under Review", "Pending", "Application Created"].includes(a.status)).length,
    approved: applications.filter(a => a.status === "Approved").length,
    highRisk: applications.filter(a => (a.risk_score ?? 0) > 65).length,
    rejected: applications.filter(a => a.status === "Rejected").length,
    totalExposure: applications.reduce((sum, a) => sum + Number(a.loan_amount), 0),
    avgRiskScore: applications.length > 0
      ? Math.round(applications.reduce((sum, a) => sum + (a.risk_score ?? 50), 0) / applications.length)
      : 0,
  };

  const riskBreakdown: RiskBreakdown[] = [
    { name: "Low Risk", value: applications.filter(a => (a.risk_score ?? 50) <= 40).length, fill: "hsl(var(--risk-low))" },
    { name: "Medium Risk", value: applications.filter(a => { const s = a.risk_score ?? 50; return s > 40 && s <= 65; }).length, fill: "hsl(var(--risk-medium))" },
    { name: "High Risk", value: applications.filter(a => (a.risk_score ?? 50) > 65).length, fill: "hsl(var(--risk-high))" },
  ];

  const sectorExposure = Object.entries(
    applications.reduce<Record<string, number>>((acc, a) => {
      acc[a.sector] = (acc[a.sector] || 0) + Number(a.loan_amount);
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map((entry, i) => ({
      name: entry[0],
      value: entry[1],
      fill: [
        "hsl(var(--primary))",
        "hsl(var(--risk-low))",
        "hsl(var(--risk-medium))",
        "hsl(var(--chart-4))",
        "hsl(var(--risk-high))",
        "hsl(var(--chart-5))",
      ][i] || "hsl(var(--primary))",
    }));

  return {
    applications,
    loading,
    hasLiveData,
    kpis,
    riskBreakdown,
    sectorExposure,
    refetch: fetchApplications,
  };
}
