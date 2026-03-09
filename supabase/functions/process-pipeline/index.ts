import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Full pipeline orchestrator:
 * 1. Extract fields from all pending documents
 * 2. Verify extracted data
 * 3. Build financial features from extracted fields
 * 4. Run risk analysis
 * 5. Generate CAM report
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { application_id, steps } = await req.json();
    if (!application_id) throw new Error("application_id required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const stepsToRun = steps || ["extract", "verify", "risk", "cam"];
    const results: Record<string, any> = {};
    const baseUrl = supabaseUrl + "/functions/v1";

    // Helper to call sibling edge functions
    async function callFunction(name: string, body: any) {
      const resp = await fetch(`${baseUrl}/${name}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`${name} failed: ${err}`);
      }
      return resp.json();
    }

    // Step 1: Extract fields from all unprocessed documents
    if (stepsToRun.includes("extract")) {
      const { data: docs } = await sb.from("documents")
        .select("id, document_name, file_url, application_id")
        .eq("application_id", application_id);

      if (docs && docs.length > 0) {
        const extractResults = [];
        for (const doc of docs) {
          try {
            const r = await callFunction("extract-document-fields", {
              document_id: doc.id,
              application_id: doc.application_id,
              document_name: doc.document_name,
              file_url: doc.file_url || "",
            });
            extractResults.push({ document_id: doc.id, ...r });
          } catch (e) {
            extractResults.push({ document_id: doc.id, error: String(e) });
          }
        }
        results.extraction = { documents_processed: docs.length, results: extractResults };
      } else {
        results.extraction = { documents_processed: 0, message: "No documents found" };
      }

      await sb.from("workflow_status").upsert({
        application_id,
        current_stage: "Fields Extracted",
        updated_at: new Date().toISOString(),
      }, { onConflict: "application_id" });
    }

    // Step 2: Verify documents
    if (stepsToRun.includes("verify")) {
      results.verification = await callFunction("verify-documents", { application_id });
    }

    // Step 3: Build features from extracted fields and run risk analysis
    if (stepsToRun.includes("risk")) {
      // Get extracted fields to build features
      const { data: fields } = await sb.from("document_extracted_fields")
        .select("field_name, field_value")
        .eq("application_id", application_id);

      const fieldMap: Record<string, string> = {};
      for (const f of (fields || [])) {
        if (f.field_value) fieldMap[f.field_name.toLowerCase()] = f.field_value;
      }

      // Parse financial values from extracted fields
      const parseNum = (val: string | undefined): number => {
        if (!val) return 0;
        return parseFloat(val.replace(/[₹,\s]/g, "")) || 0;
      };

      const revenue = parseNum(fieldMap["revenue"] || fieldMap["total revenue"]);
      const profit = parseNum(fieldMap["net profit"] || fieldMap["profit after tax"] || fieldMap["pat"]);
      const totalAssets = parseNum(fieldMap["total assets"]);
      const totalLiabilities = parseNum(fieldMap["total liabilities"] || fieldMap["total debt"]);
      const interestExpense = parseNum(fieldMap["interest expense"] || fieldMap["interest cost"]);

      // Calculate features
      const profitMargin = revenue > 0 ? profit / revenue : 0.1;
      const debtRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 0.5;
      const interestCoverage = interestExpense > 0 ? profit / interestExpense : 2;

      const riskInput = {
        application_id,
        revenue_growth: 0.10, // Would need YoY data
        profit_margin: Math.max(-1, Math.min(1, profitMargin)),
        debt_ratio: Math.max(0, Math.min(1, debtRatio)),
        interest_coverage_ratio: Math.max(0, Math.min(20, interestCoverage)),
        litigation_count: parseInt(fieldMap["litigation count"] || "0") || 0,
        sector_risk: 0.5, // Default; could map from sector
        collateral_score: 0.6, // Default; could extract from docs
      };

      results.risk = await callFunction("run-risk-analysis", riskInput);
    }

    // Step 4: Generate CAM
    if (stepsToRun.includes("cam")) {
      results.cam = await callFunction("generate-cam", { application_id });
    }

    // Final audit log
    await sb.from("audit_logs").insert({
      event_type: "Pipeline Completed",
      event_description: `Full AI pipeline completed. Steps: ${stepsToRun.join(", ")}`,
      application_id,
      user_name: "AI Engine",
    });

    await sb.from("notifications").insert({
      title: "AI Pipeline Complete",
      description: `Full processing pipeline completed for application.`,
      severity: "info",
      application_id,
      notification_type: "pipeline_complete",
      role: "credit_officer",
    });

    return new Response(JSON.stringify({ success: true, steps_completed: stepsToRun, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-pipeline error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
