export interface ApplicationData {
  id: string;
  company: string;
  cin: string;
  sector: string;
  loanAmount: number;
  riskScore: number;
  riskCategory: "Low" | "Medium" | "High";
  defaultProbability: number;
  topRiskFactors: string[];
  financials: {
    revenue: string;
    debtEquity: number;
    interestCoverage: number;
    currentRatio: number;
    dscr: number;
  };
  documents: { name: string; status: "Verified" | "Pending" | "Flagged" }[];
  researchSignals: { source: string; sentiment: "Positive" | "Negative" | "Neutral"; title: string }[];
  recommendation: {
    decision: string;
    suggestedLimit: string;
    interestRate: string;
  };
  riskFactorScores: { name: string; score: number }[];
}

export const applications: ApplicationData[] = [
  {
    id: "APP-101",
    company: "Nexus AI Technologies Pvt Ltd",
    cin: "U72200KA2018PTC112456",
    sector: "Technology",
    loanAmount: 25,
    riskScore: 62,
    riskCategory: "Medium",
    defaultProbability: 0.31,
    topRiskFactors: [
      "High debt-to-equity ratio (1.8x)",
      "Low interest coverage ratio (1.2x)",
      "Negative news sentiment detected",
      "Short operating history (5 years)",
    ],
    financials: {
      revenue: "₹185 Cr",
      debtEquity: 1.8,
      interestCoverage: 1.2,
      currentRatio: 1.1,
      dscr: 1.15,
    },
    documents: [
      { name: "PAN Card", status: "Verified" },
      { name: "GST Certificate", status: "Verified" },
      { name: "Financial Statements", status: "Verified" },
      { name: "Bank Statements", status: "Pending" },
      { name: "Board Resolution", status: "Verified" },
    ],
    researchSignals: [
      { source: "Economic Times", sentiment: "Negative", title: "Tech sector faces funding winter" },
      { source: "MCA Filing", sentiment: "Positive", title: "No adverse auditor remarks" },
      { source: "CIBIL", sentiment: "Neutral", title: "Credit score: 712" },
    ],
    recommendation: {
      decision: "Conditional Approval",
      suggestedLimit: "₹20 Cr",
      interestRate: "11.5%",
    },
    riskFactorScores: [
      { name: "Debt-Equity", score: 78 },
      { name: "Cash Flow", score: 45 },
      { name: "Litigation", score: 30 },
      { name: "Sector Risk", score: 65 },
      { name: "Promoter", score: 52 },
    ],
  },
  {
    id: "APP-102",
    company: "Orion Manufacturing Ltd",
    cin: "L28920MH2005PLC148273",
    sector: "Manufacturing",
    loanAmount: 50,
    riskScore: 35,
    riskCategory: "Low",
    defaultProbability: 0.08,
    topRiskFactors: [
      "Moderate raw material cost volatility",
      "Single geography concentration",
    ],
    financials: {
      revenue: "₹720 Cr",
      debtEquity: 0.6,
      interestCoverage: 3.8,
      currentRatio: 2.1,
      dscr: 2.4,
    },
    documents: [
      { name: "PAN Card", status: "Verified" },
      { name: "GST Certificate", status: "Verified" },
      { name: "Financial Statements", status: "Verified" },
      { name: "Bank Statements", status: "Verified" },
      { name: "Board Resolution", status: "Verified" },
    ],
    researchSignals: [
      { source: "Bloomberg", sentiment: "Positive", title: "Strong order book growth" },
      { source: "CRISIL", sentiment: "Positive", title: "Rating upgraded to AA-" },
      { source: "MCA Filing", sentiment: "Positive", title: "Clean audit report" },
    ],
    recommendation: {
      decision: "Approve",
      suggestedLimit: "₹50 Cr",
      interestRate: "9.25%",
    },
    riskFactorScores: [
      { name: "Debt-Equity", score: 25 },
      { name: "Cash Flow", score: 20 },
      { name: "Litigation", score: 10 },
      { name: "Sector Risk", score: 45 },
      { name: "Promoter", score: 30 },
    ],
  },
  {
    id: "APP-103",
    company: "BluePeak Logistics Pvt Ltd",
    cin: "U63000DL2012PTC234567",
    sector: "Logistics",
    loanAmount: 35,
    riskScore: 81,
    riskCategory: "High",
    defaultProbability: 0.58,
    topRiskFactors: [
      "Critical debt-to-equity ratio (3.2x)",
      "Negative DSCR (0.7x)",
      "Multiple litigation cases pending",
      "Promoter pledge at 62%",
      "GST mismatch flagged",
    ],
    financials: {
      revenue: "₹290 Cr",
      debtEquity: 3.2,
      interestCoverage: 0.6,
      currentRatio: 0.8,
      dscr: 0.7,
    },
    documents: [
      { name: "PAN Card", status: "Verified" },
      { name: "GST Certificate", status: "Flagged" },
      { name: "Financial Statements", status: "Verified" },
      { name: "Bank Statements", status: "Pending" },
      { name: "Board Resolution", status: "Verified" },
    ],
    researchSignals: [
      { source: "e-Courts", sentiment: "Negative", title: "3 active litigation cases" },
      { source: "Economic Times", sentiment: "Negative", title: "Logistics sector downturn" },
      { source: "CIBIL", sentiment: "Negative", title: "Credit score: 580" },
    ],
    recommendation: {
      decision: "Reject",
      suggestedLimit: "N/A",
      interestRate: "N/A",
    },
    riskFactorScores: [
      { name: "Debt-Equity", score: 92 },
      { name: "Cash Flow", score: 85 },
      { name: "Litigation", score: 78 },
      { name: "Sector Risk", score: 70 },
      { name: "Promoter", score: 88 },
    ],
  },
  {
    id: "APP-104",
    company: "Vertex Fintech Solutions",
    cin: "U65999KA2019PTC267890",
    sector: "Fintech",
    loanAmount: 15,
    riskScore: 44,
    riskCategory: "Medium",
    defaultProbability: 0.18,
    topRiskFactors: [
      "Regulatory uncertainty in fintech sector",
      "Limited collateral coverage",
      "High customer acquisition cost",
    ],
    financials: {
      revenue: "₹95 Cr",
      debtEquity: 1.1,
      interestCoverage: 2.2,
      currentRatio: 1.6,
      dscr: 1.8,
    },
    documents: [
      { name: "PAN Card", status: "Verified" },
      { name: "GST Certificate", status: "Verified" },
      { name: "Financial Statements", status: "Verified" },
      { name: "Bank Statements", status: "Verified" },
      { name: "Board Resolution", status: "Pending" },
    ],
    researchSignals: [
      { source: "RBI Bulletin", sentiment: "Neutral", title: "New fintech regulations proposed" },
      { source: "Bloomberg", sentiment: "Positive", title: "Fintech funding rebounds" },
      { source: "MCA Filing", sentiment: "Positive", title: "Strong revenue growth" },
    ],
    recommendation: {
      decision: "Conditional Approval",
      suggestedLimit: "₹12 Cr",
      interestRate: "10.75%",
    },
    riskFactorScores: [
      { name: "Debt-Equity", score: 48 },
      { name: "Cash Flow", score: 35 },
      { name: "Litigation", score: 15 },
      { name: "Sector Risk", score: 55 },
      { name: "Promoter", score: 40 },
    ],
  },
];
