import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { application_id, company_name, director_names } = await req.json();
    if (!application_id) throw new Error("application_id required");

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const flags: string[] = [];
    let amlScore = 0;
    let sanctionMatch = false;
    let pepDetected = false;
    let fraudHistory = false;

    // 1. Sanction list screening
    if (company_name) {
      const { data: sanctionHits } = await sb
        .from("sanction_list")
        .select("*");

      const companyLower = company_name.toLowerCase();
      for (const entry of sanctionHits || []) {
        if (entry.company_name && companyLower.includes(entry.company_name.toLowerCase().split(" ")[0])) {
          sanctionMatch = true;
          amlScore += 80;
          flags.push(`Sanction match: ${entry.company_name} — ${entry.reason} (${entry.country})`);
          break;
        }
      }

      // Check directors against sanction list
      const directors = director_names || [];
      for (const director of directors) {
        const dirLower = (director as string).toLowerCase();
        for (const entry of sanctionHits || []) {
          if (entry.director_name && dirLower.includes(entry.director_name.toLowerCase().split(" ")[0])) {
            sanctionMatch = true;
            amlScore += 40;
            flags.push(`Director "${director}" matches sanctioned person: ${entry.director_name}`);
          }
        }
      }
    }

    // 2. PEP screening
    const directors = director_names || [];
    if (directors.length > 0) {
      const { data: pepHits } = await sb.from("pep_database").select("*");

      for (const director of directors) {
        const dirLower = (director as string).toLowerCase();
        for (const pep of pepHits || []) {
          const nameParts = pep.person_name.toLowerCase().split(" ");
          if (nameParts.some((part: string) => dirLower.includes(part) && part.length > 2)) {
            pepDetected = true;
            amlScore += 30;
            flags.push(`PEP detected: Director "${director}" matches ${pep.person_name} (${pep.position}, ${pep.country})`);
          }
        }
      }
    }

    // 3. Additional rule-based checks
    // Check for high-risk sectors
    const { data: app } = await sb
      .from("applications")
      .select("sector, business_description, cin")
      .eq("id", application_id)
      .maybeSingle();

    if (app) {
      const highRiskSectors = ["mining", "crypto", "gambling", "defense", "arms", "tobacco"];
      if (highRiskSectors.some(s => app.sector?.toLowerCase().includes(s))) {
        amlScore += 20;
        flags.push(`High-risk sector detected: ${app.sector}`);
      }

      // Shell company indicators
      if (!app.business_description || app.business_description.length < 20) {
        amlScore += 10;
        flags.push("Minimal business description — possible shell company indicator");
      }
    }

    // Cap score at 100
    amlScore = Math.min(100, amlScore);

    // Determine risk level
    const amlRiskLevel = amlScore <= 30 ? "Low" : amlScore <= 60 ? "Medium" : "High";

    if (flags.length === 0) {
      flags.push("No AML risks detected — all checks passed");
    }

    // Store results
    const { error: upsertError } = await sb.from("aml_results").upsert({
      application_id,
      aml_risk_score: amlScore,
      aml_risk_level: amlRiskLevel,
      sanction_match: sanctionMatch,
      pep_detected: pepDetected,
      fraud_history: fraudHistory,
      flags,
    }, { onConflict: "application_id" });

    // We need a unique constraint on application_id for upsert; if it fails, insert instead
    if (upsertError) {
      // Delete existing and re-insert
      await sb.from("aml_results").delete().eq("application_id", application_id);
      await sb.from("aml_results").insert({
        application_id,
        aml_risk_score: amlScore,
        aml_risk_level: amlRiskLevel,
        sanction_match: sanctionMatch,
        pep_detected: pepDetected,
        fraud_history: fraudHistory,
        flags,
      });
    }

    // Audit log
    await sb.from("audit_logs").insert({
      event_type: "AML Screening",
      event_description: `AML screening completed. Score: ${amlScore} (${amlRiskLevel}). ${flags.length} flag(s) raised.`,
      application_id,
      user_name: "System",
    });

    // Notification if high risk
    if (amlRiskLevel === "High") {
      await sb.from("notifications").insert({
        title: "⚠ High AML Risk Detected",
        description: `Application flagged with AML score ${amlScore}. Additional due diligence required.`,
        severity: "error",
        application_id,
        notification_type: "aml_alert",
        role: "credit_officer",
      });
    }

    const result = {
      aml_risk_score: amlScore,
      aml_risk_level: amlRiskLevel,
      sanction_match: sanctionMatch,
      pep_detected: pepDetected,
      fraud_history: fraudHistory,
      flags,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("run-aml-screening error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
