import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CompanyApplication {
  id: string;
  company: string;
  cin: string;
  sector: string;
  loanAmount: number;
  riskScore: number;
  riskCategory: "Low" | "Medium" | "High";
  status: string;
  defaultProbability: number;
  recommendation: string;
  interestRate: string;
  suggestedLimit: string;
  incorporationYear: string;
  registeredOffice: string;
  promoterGroup: string;
  cibilScore: number;
  financials: {
    revenue: string;
    outstandingDebt: string;
    dscr: number;
    debtEquity: number;
    relatedPartyTransactions: string;
    gstMismatch: boolean;
    gstMismatchAmount: string;
    interestCoverage: number;
    currentRatio: number;
  };
  fiveCsScores: {
    name: string;
    score: number;
    weight: number;
    contribution: number;
    explanation: string;
  }[];
  documents: {
    id: string;
    name: string;
    type: string;
    size: string;
    status: "verified" | "pending" | "failed";
  }[];
  validations: {
    check: string;
    status: "pass" | "warning" | "fail";
    detail: string;
  }[];
  integrityScore: number;
  researchFindings: {
    source: string;
    date: string;
    title: string;
    sentiment: string;
    confidence: number;
  }[];
  explainableAI: {
    severity: "high" | "medium" | "low";
    text: string;
  }[];
  pipeline: {
    stage: string;
    status: "completed" | "active" | "pending";
    date: string;
  }[];
  comments: {
    author: string;
    role: string;
    time: string;
    text: string;
  }[];
}

interface ApplicationStore {
  selectedApplication: CompanyApplication | null;
  setSelectedApplication: (app: CompanyApplication) => void;
  clearSelectedApplication: () => void;
}

export const useApplicationStore = create<ApplicationStore>()(
  persist(
    (set) => ({
      selectedApplication: null,
      setSelectedApplication: (app) => set({ selectedApplication: app }),
      clearSelectedApplication: () => set({ selectedApplication: null }),
    }),
    {
      name: "intelli-credit-selected-app",
    }
  )
);
