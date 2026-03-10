import { supabase } from "@/integrations/supabase/client";

export interface AmlResult {
  aml_risk_score: number;
  aml_risk_level: "Low" | "Medium" | "High";
  sanction_match: boolean;
  pep_detected: boolean;
  fraud_history: boolean;
  flags: string[];
}

export async function runAmlScreening(
  applicationId: string,
  companyName: string,
  directorNames: string[] = []
): Promise<AmlResult> {
  const { data, error } = await supabase.functions.invoke("run-aml-screening", {
    body: {
      application_id: applicationId,
      company_name: companyName,
      director_names: directorNames,
    },
  });

  if (error) throw new Error(error.message || "AML screening failed");
  if (data.error) throw new Error(data.error);
  return data as AmlResult;
}

export async function getAmlResults(applicationId: string): Promise<AmlResult | null> {
  const { data, error } = await supabase
    .from("aml_results" as any)
    .select("*")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (error || !data) return null;

  const d = data as any;
  return {
    aml_risk_score: d.aml_risk_score || 0,
    aml_risk_level: d.aml_risk_level || "Low",
    sanction_match: d.sanction_match || false,
    pep_detected: d.pep_detected || false,
    fraud_history: d.fraud_history || false,
    flags: (d.flags as string[]) || [],
  };
}
