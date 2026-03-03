import { motion } from "framer-motion";
import { FileText, AlertTriangle, TrendingUp, IndianRupee, XCircle, Eye } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { kpiData, recentApplications, riskDistribution, sectorExposure, monthlyTrend } from "@/lib/mock-data";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Credit Control Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time overview of corporate credit portfolio</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard title="In Review" value={kpiData.applicationsInReview} icon={FileText} trend={{ value: 12, positive: true }} index={0} />
        <KpiCard title="High Risk" value={kpiData.highRiskCases} icon={AlertTriangle} variant="risk-high" trend={{ value: 8, positive: false }} index={1} />
        <KpiCard title="Avg Risk Score" value={kpiData.avgRiskScore} icon={TrendingUp} variant="risk-medium" index={2} />
        <KpiCard title="Approved Value" value={`₹${kpiData.approvedLoanValue} Cr`} icon={IndianRupee} variant="risk-low" trend={{ value: 15, positive: true }} index={3} />
        <KpiCard title="Rejected" value={kpiData.rejectedApplications} icon={XCircle} variant="risk-high" index={4} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Approval Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 16%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(222, 44%, 10%)", border: "1px solid hsl(222, 30%, 16%)", borderRadius: 8, color: "hsl(210, 40%, 96%)", fontSize: 12 }} />
              <Bar dataKey="approved" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejected" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Risk Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={riskDistribution} innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                {riskDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(222, 44%, 10%)", border: "1px solid hsl(222, 30%, 16%)", borderRadius: 8, color: "hsl(210, 40%, 96%)", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "hsl(215, 20%, 55%)" }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Sector Exposure */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Sector Exposure</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={sectorExposure} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 16%)" horizontal={false} />
            <XAxis type="number" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
            <Tooltip contentStyle={{ background: "hsl(222, 44%, 10%)", border: "1px solid hsl(222, 30%, 16%)", borderRadius: 8, color: "hsl(210, 40%, 96%)", fontSize: 12 }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {sectorExposure.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Recent Applications */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground">Recent Applications</h3>
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
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentApplications.map((app) => (
                <tr key={app.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div>
                      <p className="font-medium text-foreground">{app.company}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{app.cin}</p>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{app.sector}</td>
                  <td className="p-3"><RiskBadge score={app.riskScore} label={`${app.riskScore}`} size="md" /></td>
                  <td className="p-3"><StatusBadge status={app.status} /></td>
                  <td className="p-3 text-foreground font-medium">₹{app.loanAmount} Cr</td>
                  <td className="p-3">
                    <button
                      onClick={() => navigate("/applications")}
                      className="flex items-center gap-1 text-primary hover:text-primary/80 text-xs font-medium transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
