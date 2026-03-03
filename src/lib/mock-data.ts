export const kpiData = {
  applicationsInReview: 47,
  highRiskCases: 12,
  avgRiskScore: 62,
  approvedLoanValue: 2847,
  rejectedApplications: 8,
};

export const recentApplications = [
  { id: "APP-001", company: "Tata Steel Ltd", cin: "L27100MH1907PLC000260", sector: "Steel & Metals", riskScore: 28, status: "Approved", loanAmount: 500, recommendation: "Approve" },
  { id: "APP-002", company: "Reliance Industries", cin: "L17110MH1973PLC019786", sector: "Petrochemicals", riskScore: 35, status: "Under Review", loanAmount: 1200, recommendation: "Conditional" },
  { id: "APP-003", company: "Adani Ports & SEZ", cin: "L63090GJ1998PLC034182", sector: "Infrastructure", riskScore: 72, status: "High Risk", loanAmount: 800, recommendation: "Review" },
  { id: "APP-004", company: "Infosys Ltd", cin: "L85110KA1981PLC013115", sector: "IT Services", riskScore: 18, status: "Approved", loanAmount: 350, recommendation: "Approve" },
  { id: "APP-005", company: "Bajaj Finance", cin: "L65910MH1987PLC042961", sector: "NBFC", riskScore: 45, status: "Under Review", loanAmount: 600, recommendation: "Conditional" },
  { id: "APP-006", company: "JSW Steel Ltd", cin: "L27102MH1994PLC152925", sector: "Steel & Metals", riskScore: 58, status: "Pending", loanAmount: 450, recommendation: "Review" },
  { id: "APP-007", company: "HDFC Ltd", cin: "L70100MH1977PLC019916", sector: "Housing Finance", riskScore: 22, status: "Approved", loanAmount: 900, recommendation: "Approve" },
  { id: "APP-008", company: "Vedanta Ltd", cin: "L13209MH1965PLC291394", sector: "Mining", riskScore: 81, status: "Rejected", loanAmount: 700, recommendation: "Reject" },
];

export const riskDistribution = [
  { name: "Low Risk", value: 42, fill: "hsl(142, 71%, 45%)" },
  { name: "Medium Risk", value: 35, fill: "hsl(38, 92%, 50%)" },
  { name: "High Risk", value: 23, fill: "hsl(0, 72%, 51%)" },
];

export const sectorExposure = [
  { name: "Steel & Metals", value: 28, fill: "hsl(217, 91%, 60%)" },
  { name: "IT Services", value: 18, fill: "hsl(142, 71%, 45%)" },
  { name: "Petrochemicals", value: 15, fill: "hsl(38, 92%, 50%)" },
  { name: "Infrastructure", value: 14, fill: "hsl(280, 65%, 60%)" },
  { name: "NBFC", value: 12, fill: "hsl(340, 75%, 55%)" },
  { name: "Others", value: 13, fill: "hsl(215, 20%, 55%)" },
];

export const monthlyTrend = [
  { month: "Jul", approved: 12, rejected: 3, pending: 5 },
  { month: "Aug", approved: 15, rejected: 4, pending: 7 },
  { month: "Sep", approved: 18, rejected: 2, pending: 4 },
  { month: "Oct", approved: 14, rejected: 5, pending: 6 },
  { month: "Nov", approved: 20, rejected: 3, pending: 8 },
  { month: "Dec", approved: 22, rejected: 4, pending: 5 },
  { month: "Jan", approved: 19, rejected: 6, pending: 7 },
  { month: "Feb", approved: 25, rejected: 3, pending: 4 },
];

export const fiveCsScores = [
  { name: "Character", score: 78, weight: 20, contribution: 15.6, explanation: "Strong promoter track record with 25+ years in the industry. Clean CIBIL history. No defaults." },
  { name: "Capacity", score: 65, weight: 25, contribution: 16.25, explanation: "DSCR at 1.4x — adequate but below ideal 1.5x threshold. Revenue growth at 12% YoY." },
  { name: "Capital", score: 82, weight: 20, contribution: 16.4, explanation: "Debt-to-Equity at 0.8x. Strong net worth of ₹450 Cr. Adequate working capital." },
  { name: "Collateral", score: 55, weight: 15, contribution: 8.25, explanation: "Primary security covers 1.2x of loan. Collateral valuation dated — needs reassessment." },
  { name: "Conditions", score: 48, weight: 20, contribution: 9.6, explanation: "Steel sector facing headwinds. Global demand softening. Raw material cost volatility." },
];

export const researchFindings = [
  { source: "Economic Times", date: "2026-02-28", title: "Steel sector braces for margin squeeze amid global slowdown", sentiment: "Negative", confidence: 87 },
  { source: "CRISIL Report", date: "2026-02-25", title: "Credit outlook stable for large steel manufacturers", sentiment: "Neutral", confidence: 92 },
  { source: "MCA Filing", date: "2026-02-20", title: "Annual return filed — No adverse remarks by auditors", sentiment: "Positive", confidence: 95 },
  { source: "e-Courts", date: "2026-02-15", title: "2 pending cases found — ₹12 Cr aggregate claim value", sentiment: "Negative", confidence: 78 },
  { source: "RBI Bulletin", date: "2026-02-10", title: "NPA norms tightened for NBFC lending to steel sector", sentiment: "Negative", confidence: 88 },
  { source: "Bloomberg", date: "2026-02-08", title: "Promoter increased stake by 2% via open market purchase", sentiment: "Positive", confidence: 91 },
];

export const extractedData = {
  revenue: "₹2,847 Cr",
  outstandingDebt: "₹1,205 Cr",
  litigationMentions: 3,
  relatedPartyTransactions: "₹145 Cr",
  gstMismatch: true,
  gstMismatchAmount: "₹23.5 Cr",
  cibilScore: 742,
  dscr: 1.4,
  debtEquity: 0.8,
};

export const pipelineStages = [
  { stage: "Draft", count: 5, color: "muted" as const },
  { stage: "Data Ingestion", count: 8, color: "primary" as const },
  { stage: "Research", count: 6, color: "primary" as const },
  { stage: "Risk Scoring", count: 4, color: "warning" as const },
  { stage: "Committee Review", count: 3, color: "warning" as const },
  { stage: "Approved", count: 22, color: "success" as const },
  { stage: "Rejected", count: 8, color: "danger" as const },
];
