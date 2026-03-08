import { apiClient } from "./api";

export interface ProcessedDocument {
  revenue: number;
  profit: number;
  outstanding_debt: number;
  litigation_mentions: number;
  total_assets?: number;
  total_liabilities?: number;
  directors?: string[];
}

export interface VerificationResult {
  document_integrity_score: number;
  pan_gstin_match: boolean;
  cin_valid: boolean;
  director_mismatch: boolean;
}

export async function processDocument(file: File): Promise<ProcessedDocument> {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.postFormData<ProcessedDocument>("/api/process-document", formData);
}

export async function verifyDocuments(applicationId: string): Promise<VerificationResult> {
  return apiClient.post<VerificationResult>("/api/verify-documents", {
    application_id: applicationId,
  });
}
