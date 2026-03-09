import { supabase } from "@/integrations/supabase/client";
import { updateWorkflowStatus } from "./workflowStatus";

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

export interface VerificationResult {
  document_integrity_score: number;
  checks: { check: string; status: "pass" | "warning" | "fail"; detail: string }[];
  pan_gstin_match: boolean;
  cin_valid: boolean;
  overall_status: "verified" | "issues_found";
}

export interface ExtractedFields {
  fields_count: number;
  fields: { field_name: string; field_value: string; confidence_score: number }[];
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

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, file);

  if (uploadError) {
    console.error("Error uploading file:", uploadError);
    throw uploadError;
  }

  const { data: urlData } = supabase.storage
    .from("documents")
    .getPublicUrl(uploadData.path);

  const { data: userData } = await supabase.auth.getUser();

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

// Extract fields from a document via AI
export async function extractDocumentFields(
  documentId: string,
  applicationId: string,
  documentName: string,
  fileUrl: string
): Promise<ExtractedFields> {
  const { data, error } = await supabase.functions.invoke("extract-document-fields", {
    body: { document_id: documentId, application_id: applicationId, document_name: documentName, file_url: fileUrl },
  });

  if (error) throw new Error(error.message || "Field extraction failed");
  if (data.error) throw new Error(data.error);
  return data as ExtractedFields;
}

// Verify all documents for an application via AI
export async function verifyDocuments(applicationId: string): Promise<VerificationResult> {
  const { data, error } = await supabase.functions.invoke("verify-documents", {
    body: { application_id: applicationId },
  });

  if (error) throw new Error(error.message || "Verification failed");
  if (data.error) throw new Error(data.error);
  return data as VerificationResult;
}

// Run full processing pipeline
export async function runFullPipeline(
  applicationId: string,
  steps?: string[]
): Promise<any> {
  const { data, error } = await supabase.functions.invoke("process-pipeline", {
    body: { application_id: applicationId, steps },
  });

  if (error) throw new Error(error.message || "Pipeline failed");
  if (data.error) throw new Error(data.error);
  return data;
}

// Delete document
export async function deleteDocument(documentId: string): Promise<boolean> {
  const { data: doc } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", documentId)
    .single();

  if (doc?.file_path) {
    await supabase.storage.from("documents").remove([doc.file_path]);
  }

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
