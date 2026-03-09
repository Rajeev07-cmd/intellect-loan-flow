import type { CompanyApplication } from "@/store/useApplicationStore";

interface DbApplicationLike {
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
}

export function mapDbApplicationToStoreApp(db: DbApplicationLike): CompanyApplication {
  return {
    id: db.id,
    company: db.company_name,
    cin: db.cin || "N/A",
    sector: db.sector,
    loanAmount: db.loan_amount,
    riskScore: db.risk_score ?? 50,
    riskCategory: (db.risk_category as "Low" | "Medium" | "High") || "Medium",
    status: db.status,
    defaultProbability: db.default_probability ?? 0.25,
    recommendation: db.recommendation || "Under Review",
    interestRate: db.interest_rate || "11.5%",
    suggestedLimit: db.suggested_limit || `₹${db.loan_amount} Cr`,
    incorporationYear: db.incorporation_year || undefined,
    registeredOffice: db.registered_address || undefined,
    promoterGroup: db.promoter_group || undefined,
    cibilScore: db.cibil_score ?? undefined,
    comments: [],
  };
}
