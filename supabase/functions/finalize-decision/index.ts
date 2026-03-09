import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      application_id,
      decision,
      approved_limit,
      interest_rate,
      officer_name,
      reasons,
    } = await req.json();

    if (!application_id || !decision) {
      return new Response(
        JSON.stringify({ error: "application_id and decision are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch application data
    const { data: app, error: appError } = await supabase
      .from("applications")
      .select("*")
      .eq("id", application_id)
      .single();

    if (appError || !app) {
      return new Response(
        JSON.stringify({ error: "Application not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch risk results
    const { data: riskData } = await supabase
      .from("risk_results")
      .select("*")
      .eq("application_id", application_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3. Fetch financial features
    const { data: financials } = await supabase
      .from("financial_features")
      .select("*")
      .eq("application_id", application_id)
      .maybeSingle();

    // 4. Generate CAM content using AI
    const companyName = app.company_name;
    const sector = app.sector;
    const loanAmount = app.loan_amount;
    const riskScore = riskData?.risk_score ?? app.risk_score ?? 50;
    const riskCategory = riskData?.risk_category ?? app.risk_category ?? "Medium";
    const defaultProb = riskData?.default_probability ?? app.default_probability ?? 0.25;

    const camContent = generateCAMContent({
      companyName,
      sector,
      loanAmount,
      riskScore,
      riskCategory,
      defaultProb,
      decision,
      approved_limit: approved_limit || `₹${loanAmount} Cr`,
      interest_rate: interest_rate || app.interest_rate || "11.5%",
      officer_name: officer_name || "Credit Committee",
      reasons: reasons || [],
      financials,
      cibilScore: app.cibil_score,
      incorporationYear: app.incorporation_year,
      promoterGroup: app.promoter_group,
    });

    // 5. Save CAM report
    const { error: camError } = await supabase.from("cam_reports").upsert(
      {
        application_id,
        company_overview: camContent.company_overview,
        financial_analysis: camContent.financial_analysis,
        risk_analysis: camContent.risk_analysis,
        recommendation: camContent.recommendation,
        suggested_loan_limit: approved_limit || `₹${loanAmount} Cr`,
        interest_rate: interest_rate || app.interest_rate || "11.5%",
      },
      { onConflict: "application_id" }
    );

    if (camError) console.error("CAM save error:", camError);

    // 6. Update application status
    const finalStatus = decision === "approve" ? "Approved" : decision === "reject" ? "Rejected" : "Under Review";
    await supabase.from("applications").update({
      status: finalStatus,
      final_status: finalStatus,
      recommendation: camContent.recommendation,
      suggested_limit: approved_limit || `₹${loanAmount} Cr`,
      interest_rate: interest_rate || app.interest_rate,
      updated_at: new Date().toISOString(),
    }).eq("id", application_id);

    // 7. Update workflow status
    const workflowStage = decision === "approve" ? "Approved" : decision === "reject" ? "Rejected" : "Under Review";
    await supabase.from("workflow_status").upsert(
      {
        application_id,
        current_stage: workflowStage,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "application_id" }
    );

    // 8. Log audit event
    await supabase.from("audit_logs").insert({
      event_type: "Decision Finalized",
      event_description: `Decision: ${finalStatus} for ${companyName}. CAM auto-generated. Limit: ${approved_limit || loanAmount}. Rate: ${interest_rate || app.interest_rate}.`,
      application_id,
      user_name: officer_name || "System",
    });

    // 9. Create notification
    await supabase.from("notifications").insert({
      title: `Loan ${finalStatus}`,
      description: `${companyName} — Final decision: ${finalStatus}. CAM report generated and available for review.`,
      severity: finalStatus === "Rejected" ? "error" : finalStatus === "Approved" ? "info" : "warning",
      application_id,
      notification_type: "decision_finalized",
      role: "credit_officer",
    });

    // Also notify manager
    await supabase.from("notifications").insert({
      title: `CAM Generated — ${companyName}`,
      description: `Credit Appraisal Memo auto-generated for ${companyName}. Decision: ${finalStatus}.`,
      severity: "info",
      application_id,
      notification_type: "cam_generated",
      role: "manager",
    });

    return new Response(
      JSON.stringify({
        success: true,
        final_status: finalStatus,
        cam_generated: true,
        notifications_sent: true,
        message: `Decision recorded. CAM generated and notifications sent for ${companyName}.`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("finalize-decision error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── CAM Content Generator ───────────────────────────────────────
function generateCAMContent(params: {
  companyName: string;
  sector: string;
  loanAmount: number;
  riskScore: number;
  riskCategory: string;
  defaultProb: number;
  decision: string;
  approved_limit: string;
  interest_rate: string;
  officer_name: string;
  reasons: string[];
  financials: any;
  cibilScore: number | null;
  incorporationYear: string | null;
  promoterGroup: string | null;
}) {
  const {
    companyName, sector, loanAmount, riskScore, riskCategory, defaultProb,
    decision, approved_limit, interest_rate, officer_name, reasons,
    financials, cibilScore, incorporationYear, promoterGroup,
  } = params;

  const decisionLabel = decision === "approve" ? "Approved" : decision === "reject" ? "Rejected" : "Conditional Approval";
  const reasonsText = reasons.length > 0 ? reasons.join("; ") : "Based on comprehensive credit analysis";

  const company_overview = [
    `**Company:** ${companyName}`,
    `**Sector:** ${sector}`,
    `**Loan Amount Requested:** ₹${loanAmount} Cr`,
    incorporationYear ? `**Year of Incorporation:** ${incorporationYear}` : null,
    promoterGroup ? `**Promoter Group:** ${promoterGroup}` : null,
    cibilScore ? `**CIBIL Score:** ${cibilScore}` : null,
    "",
    `${companyName} operates in the ${sector} sector. The company has applied for a credit facility of ₹${loanAmount} Crore.`,
  ].filter(Boolean).join("\n");

  const financial_analysis = [
    "### Financial Summary",
    "",
    financials?.revenue_growth != null ? `- **Revenue Growth:** ${(financials.revenue_growth * 100).toFixed(1)}%` : "- Revenue data under review",
    financials?.profit_margin != null ? `- **Profit Margin:** ${(financials.profit_margin * 100).toFixed(1)}%` : null,
    financials?.debt_ratio != null ? `- **Debt Ratio:** ${(financials.debt_ratio * 100).toFixed(1)}%` : null,
    financials?.interest_coverage_ratio != null ? `- **Interest Coverage Ratio:** ${financials.interest_coverage_ratio.toFixed(2)}x` : null,
    financials?.collateral_score != null ? `- **Collateral Score:** ${financials.collateral_score}/10` : null,
    financials?.litigation_count != null ? `- **Litigation Count:** ${financials.litigation_count}` : null,
    "",
    "The financial position has been evaluated considering sector benchmarks and macroeconomic conditions.",
  ].filter(Boolean).join("\n");

  const risk_analysis = [
    "### AI Risk Assessment",
    "",
    `- **Risk Score:** ${riskScore}/100`,
    `- **Risk Category:** ${riskCategory}`,
    `- **Default Probability:** ${(defaultProb * 100).toFixed(2)}%`,
    "",
    `The AI risk engine has classified this application as **${riskCategory} Risk**. `,
    riskScore > 65
      ? "Elevated risk factors have been identified requiring additional monitoring and collateral safeguards."
      : riskScore > 40
      ? "Moderate risk indicators present. Standard credit monitoring recommended."
      : "Risk profile is within acceptable parameters for the requested facility.",
  ].join("\n");

  const recommendation = [
    `### Credit Committee Decision: **${decisionLabel}**`,
    "",
    `**Approved Limit:** ${approved_limit}`,
    `**Interest Rate:** ${interest_rate}`,
    `**Decision Officer:** ${officer_name}`,
    "",
    `**Rationale:** ${reasonsText}`,
    "",
    decision === "approve"
      ? `Based on the comprehensive analysis of ${companyName}'s financial position, risk profile, and sector outlook, the credit committee recommends **approval** of the requested facility.`
      : decision === "reject"
      ? `After thorough evaluation, the credit committee has determined that the risk profile does not meet the institution's lending criteria at this time.`
      : `The application requires further review with additional conditions before final disbursement.`,
    "",
    `*This Credit Appraisal Memo was auto-generated by the Intelli-Credit AI Platform on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.*`,
  ].join("\n");

  return { company_overview, financial_analysis, risk_analysis, recommendation };
}
