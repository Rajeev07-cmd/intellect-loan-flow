import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Regex patterns for Indian corporate documents
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]$/;
const CIN_REGEX = /^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;

interface VerificationResult {
  document_integrity_score: number;
  checks: { check: string; status: "pass" | "warning" | "fail"; detail: string }[];
  pan_gstin_match: boolean;
  cin_valid: boolean;
  overall_status: "verified" | "issues_found";
}

function verifyExtractedFields(fields: { field_name: string; field_value: string | null }[]): VerificationResult {
  const fieldMap: Record<string, string> = {};
  for (const f of fields) {
    if (f.field_value) fieldMap[f.field_name.toLowerCase()] = f.field_value.trim();
  }

  const checks: VerificationResult["checks"] = [];
  let score = 50; // base score

  // Find PAN
  const pan = fieldMap["pan"] || fieldMap["pan number"] || fieldMap["pan no"] || "";
  if (pan) {
    if (PAN_REGEX.test(pan)) {
      checks.push({ check: "PAN Format", status: "pass", detail: `Valid PAN: ${pan}` });
      score += 10;
    } else {
      checks.push({ check: "PAN Format", status: "fail", detail: `Invalid PAN format: ${pan}` });
      score -= 5;
    }
  } else {
    checks.push({ check: "PAN Format", status: "warning", detail: "PAN not found in documents" });
  }

  // Find GSTIN
  const gstin = fieldMap["gstin"] || fieldMap["gst number"] || fieldMap["gst no"] || "";
  if (gstin) {
    if (GSTIN_REGEX.test(gstin)) {
      checks.push({ check: "GSTIN Format", status: "pass", detail: `Valid GSTIN: ${gstin}` });
      score += 10;
    } else {
      checks.push({ check: "GSTIN Format", status: "fail", detail: `Invalid GSTIN format: ${gstin}` });
      score -= 5;
    }
  } else {
    checks.push({ check: "GSTIN Format", status: "warning", detail: "GSTIN not found in documents" });
  }

  // PAN-GSTIN cross check
  let panGstinMatch = false;
  if (pan && gstin && gstin.length >= 12) {
    const panInGstin = gstin.substring(2, 12);
    panGstinMatch = pan === panInGstin;
    if (panGstinMatch) {
      checks.push({ check: "PAN-GSTIN Match", status: "pass", detail: "PAN matches GSTIN (positions 3-12)" });
      score += 15;
    } else {
      checks.push({ check: "PAN-GSTIN Match", status: "fail", detail: `PAN ${pan} does not match GSTIN PAN ${panInGstin}` });
      score -= 10;
    }
  }

  // CIN validation
  const cin = fieldMap["cin"] || fieldMap["cin number"] || fieldMap["corporate identity number"] || "";
  let cinValid = false;
  if (cin) {
    cinValid = CIN_REGEX.test(cin);
    if (cinValid) {
      checks.push({ check: "CIN Format", status: "pass", detail: `Valid CIN: ${cin}` });
      score += 10;
    } else {
      checks.push({ check: "CIN Format", status: "fail", detail: `Invalid CIN format: ${cin}` });
      score -= 5;
    }
  } else {
    checks.push({ check: "CIN Format", status: "warning", detail: "CIN not found in documents" });
  }

  // Company name consistency
  const names = [
    fieldMap["company name"],
    fieldMap["legal name"],
    fieldMap["trade name"],
    fieldMap["name"],
  ].filter(Boolean);
  if (names.length >= 2) {
    const normalized = names.map(n => n!.toLowerCase().replace(/\s+/g, " ").trim());
    const allMatch = normalized.every(n => n === normalized[0]);
    if (allMatch) {
      checks.push({ check: "Company Name Consistency", status: "pass", detail: "Company name consistent across documents" });
      score += 5;
    } else {
      checks.push({ check: "Company Name Consistency", status: "warning", detail: `Name variations found: ${names.join(", ")}` });
    }
  }

  // Revenue/financial data presence
  const hasFinancials = fieldMap["revenue"] || fieldMap["net profit"] || fieldMap["total assets"] || fieldMap["total revenue"];
  if (hasFinancials) {
    checks.push({ check: "Financial Data Present", status: "pass", detail: "Financial data extracted from documents" });
    score += 5;
  } else {
    checks.push({ check: "Financial Data Present", status: "warning", detail: "No financial data found in uploaded documents" });
  }

  score = Math.max(0, Math.min(100, score));
  const failCount = checks.filter(c => c.status === "fail").length;

  return {
    document_integrity_score: score,
    checks,
    pan_gstin_match: panGstinMatch,
    cin_valid: cinValid,
    overall_status: failCount === 0 ? "verified" : "issues_found",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { application_id } = await req.json();
    if (!application_id) throw new Error("application_id required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Get all extracted fields for this application
    const { data: fields, error } = await sb
      .from("document_extracted_fields")
      .select("field_name, field_value")
      .eq("application_id", application_id);

    if (error) throw error;

    const result = verifyExtractedFields(fields || []);

    // Update all documents to verified/issues status
    const newStatus = result.overall_status === "verified" ? "verified" : "pending";
    await sb.from("documents")
      .update({ verification_status: newStatus })
      .eq("application_id", application_id);

    // Update workflow
    await sb.from("workflow_status").upsert({
      application_id,
      current_stage: "Verification Completed",
      updated_at: new Date().toISOString(),
    }, { onConflict: "application_id" });

    // Audit log
    await sb.from("audit_logs").insert({
      event_type: "Document Verification",
      event_description: `Integrity Score: ${result.document_integrity_score}. Checks: ${result.checks.length} (${result.checks.filter(c => c.status === "pass").length} passed)`,
      application_id,
      user_name: "System",
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-documents error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
