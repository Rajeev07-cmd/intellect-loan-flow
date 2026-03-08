import { supabase } from "@/integrations/supabase/client";
import { initializeWorkflow } from "./workflowStatus";
import { logAuditEvent } from "./auditLog";
import { createNotification } from "./notifications";

export interface Application {
  id: string;
  company_name: string;
  sector: string;
  loan_amount: number;
  status: string;
  risk_score?: number;
  risk_category?: string;
  default_probability?: number;
  cibil_score?: number;
  recommendation?: string;
  interest_rate?: string;
  suggested_limit?: string;
  cin?: string;
  business_description?: string;
  registered_address?: string;
  contact_person?: string;
  incorporation_year?: string;
  promoter_group?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface ApplicationSummary {
  id: string;
  company_name: string;
  sector: string;
  loan_amount: number;
  risk_score: number;
  status: string;
}

export interface CreateApplicationInput {
  company_name: string;
  sector: string;
  loan_amount: number;
  business_description?: string;
  registered_address?: string;
  contact_person?: string;
  cin?: string;
  incorporation_year?: string;
  promoter_group?: string;
}

// Fetch all applications
export async function getApplications(): Promise<Application[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching applications:", error);
    return [];
  }

  return (data || []).map(app => ({
    ...app,
    risk_score: app.risk_score ?? undefined,
    risk_category: app.risk_category ?? undefined,
    default_probability: app.default_probability ? Number(app.default_probability) : undefined,
    cibil_score: app.cibil_score ?? undefined,
    recommendation: app.recommendation ?? undefined,
    interest_rate: app.interest_rate ?? undefined,
    suggested_limit: app.suggested_limit ?? undefined,
    cin: app.cin ?? undefined,
    business_description: app.business_description ?? undefined,
    registered_address: app.registered_address ?? undefined,
    contact_person: app.contact_person ?? undefined,
    incorporation_year: app.incorporation_year ?? undefined,
    promoter_group: app.promoter_group ?? undefined,
    user_id: app.user_id ?? undefined,
  }));
}

// Fetch single application by ID
export async function getApplication(id: string): Promise<Application | null> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching application:", error);
    return null;
  }

  return data;
}

// Create new application
export async function createApplication(
  input: CreateApplicationInput
): Promise<Application | null> {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("applications")
    .insert({
      company_name: input.company_name,
      sector: input.sector,
      loan_amount: input.loan_amount,
      business_description: input.business_description || null,
      registered_address: input.registered_address || null,
      contact_person: input.contact_person || null,
      cin: input.cin || null,
      incorporation_year: input.incorporation_year || null,
      promoter_group: input.promoter_group || null,
      user_id: userData.user?.id || null,
      status: "Application Created",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating application:", error);
    throw error;
  }

  // Initialize workflow for this application
  if (data) {
    await initializeWorkflow(data.id);
    await logAuditEvent("Application Created", `New application: ${input.company_name} — ₹${input.loan_amount} Cr`, data.id, "Credit Officer");
    await createNotification("New Application", `${input.company_name} — ₹${input.loan_amount} Cr ${input.sector}`, "info", data.id);
  }

  return data;
}

// Update application
export async function updateApplication(
  id: string,
  updates: Partial<Application>
): Promise<Application | null> {
  const { data, error } = await supabase
    .from("applications")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating application:", error);
    return null;
  }

  return data;
}

// Delete application
export async function deleteApplication(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting application:", error);
    return false;
  }

  return true;
}

// Subscribe to real-time application updates
export function subscribeToApplications(
  callback: (applications: Application[]) => void
) {
  return supabase
    .channel("applications_channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "applications",
      },
      async () => {
        const applications = await getApplications();
        callback(applications);
      }
    )
    .subscribe();
}
