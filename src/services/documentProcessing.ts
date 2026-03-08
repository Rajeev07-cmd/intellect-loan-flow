import { apiClient } from "./api";
import { supabase } from "@/integrations/supabase/client";
import { updateWorkflowStatus } from "./workflowStatus";

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

export interface DocumentMetadata {
  id: string;
  application_id: string;
  document_name: string;
  document_type: string;
  file_path: string;
  file_url?: string;
  file_size?: string;
  verification_status: string;
  created_at: string;
}

export interface OcrResult {
  text: string;
  confidence: number;
  fields: Record<string, string>;
}

export interface ExtractedFeatures {
  profit_margin?: number;
  debt_ratio?: number;
  interest_coverage_ratio?: number;
  revenue_growth?: number;
}

// Legacy functions for backward compatibility
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

// Get documents for an application
export async function getDocuments(applicationId: string): Promise<DocumentMetadata[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching documents:", error);
    return [];
  }

  return (data || []).map(doc => ({
    id: doc.id,
    application_id: doc.application_id,
    document_name: doc.document_name,
    document_type: doc.document_type,
    file_path: doc.file_path,
    file_url: doc.file_url ?? undefined,
    file_size: doc.file_size ?? undefined,
    verification_status: doc.verification_status,
    created_at: doc.created_at,
  }));
}

// Upload document to storage and save metadata
export async function uploadDocument(
  applicationId: string,
  file: File,
  documentType: string
): Promise<DocumentMetadata | null> {
  const filePath = `${applicationId}/${Date.now()}_${file.name}`;
  
  // Upload to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, file);

  if (uploadError) {
    console.error("Error uploading file:", uploadError);
    throw uploadError;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("documents")
    .getPublicUrl(uploadData.path);

  const { data: userData } = await supabase.auth.getUser();

  // Save metadata
  const { data: docData, error: docError } = await supabase
    .from("documents")
    .insert({
      application_id: applicationId,
      user_id: userData.user?.id || null,
      document_name: file.name,
      document_type: documentType,
      file_path: filePath,
      file_url: urlData.publicUrl,
      file_size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      verification_status: "pending",
    })
    .select()
    .single();

  if (docError) {
    console.error("Error saving document metadata:", docError);
    throw docError;
  }

  // Update workflow status
  await updateWorkflowStatus(applicationId, "Documents Uploaded");

  return {
    id: docData.id,
    application_id: docData.application_id,
    document_name: docData.document_name,
    document_type: docData.document_type,
    file_path: docData.file_path,
    file_url: docData.file_url ?? undefined,
    file_size: docData.file_size ?? undefined,
    verification_status: docData.verification_status,
    created_at: docData.created_at,
  };
}

// Process document via backend OCR service
export async function processDocumentOcr(documentId: string): Promise<OcrResult> {
  try {
    const result = await apiClient.post<OcrResult>("/api/process-document", {
      document_id: documentId,
    });

    // Update verification status
    await supabase
      .from("documents")
      .update({ verification_status: "verified" })
      .eq("id", documentId);

    return result;
  } catch (error) {
    console.error("OCR processing failed:", error);
    throw error;
  }
}

// Extract financial features from documents
export async function extractFeatures(applicationId: string): Promise<ExtractedFeatures> {
  try {
    const features = await apiClient.post<ExtractedFeatures>("/api/extract-features", {
      application_id: applicationId,
    });

    // Save to financial_features table
    await supabase.from("financial_features").upsert({
      application_id: applicationId,
      profit_margin: features.profit_margin,
      debt_ratio: features.debt_ratio,
      interest_coverage_ratio: features.interest_coverage_ratio,
      revenue_growth: features.revenue_growth,
    }, { onConflict: "application_id" });

    return features;
  } catch (error) {
    console.error("Feature extraction failed:", error);
    throw error;
  }
}

// Verify all documents for an application
export async function verifyAllDocuments(applicationId: string): Promise<void> {
  await supabase
    .from("documents")
    .update({ verification_status: "verified" })
    .eq("application_id", applicationId)
    .eq("verification_status", "pending");

  // Update workflow
  await updateWorkflowStatus(applicationId, "Verification Completed");
}

// Delete document
export async function deleteDocument(documentId: string): Promise<boolean> {
  // Get document info first
  const { data: doc } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", documentId)
    .single();

  if (doc?.file_path) {
    // Delete from storage
    await supabase.storage.from("documents").remove([doc.file_path]);
  }

  // Delete metadata
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId);

  return !error;
}

// Subscribe to document updates
export function subscribeToDocuments(
  applicationId: string,
  callback: (documents: DocumentMetadata[]) => void
) {
  return supabase
    .channel(`documents:${applicationId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "documents",
        filter: `application_id=eq.${applicationId}`,
      },
      async () => {
        const documents = await getDocuments(applicationId);
        callback(documents);
      }
    )
    .subscribe();
}
