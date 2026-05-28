import { supabase } from "@/integrations/supabase/client";

export interface FinalReportData {
  application: any;
  risk: any | null;
  aml: any | null;
  cam: any | null;
  swot: any | null;
  financials: any | null;
  documents: any[];
  workflow: any | null;
}

export async function fetchFinalReportData(applicationId: string): Promise<FinalReportData> {
  const [app, risk, aml, cam, swot, fin, docs, wf] = await Promise.all([
    supabase.from("applications").select("*").eq("id", applicationId).maybeSingle(),
    supabase.from("risk_results").select("*").eq("application_id", applicationId).order("created_at", { ascending: false }).maybeSingle(),
    supabase.from("aml_results").select("*").eq("application_id", applicationId).maybeSingle(),
    supabase.from("cam_reports").select("*").eq("application_id", applicationId).order("created_at", { ascending: false }).maybeSingle(),
    supabase.from("swot_reports").select("*").eq("application_id", applicationId).order("created_at", { ascending: false }).maybeSingle(),
    supabase.from("financial_features").select("*").eq("application_id", applicationId).order("created_at", { ascending: false }).maybeSingle(),
    supabase.from("documents").select("*").eq("application_id", applicationId),
    supabase.from("workflow_status").select("*").eq("application_id", applicationId).maybeSingle(),
  ]);

  return {
    application: app.data,
    risk: risk.data,
    aml: aml.data,
    cam: cam.data,
    swot: swot.data,
    financials: fin.data,
    documents: docs.data || [],
    workflow: wf.data,
  };
}

export async function generateFinalReportPdf(data: FinalReportData): Promise<Blob> {
  const { default: jsPDF } = await import("jspdf");
  const autoTableMod: any = await import("jspdf-autotable");
  const autoTable = autoTableMod.default || autoTableMod;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  const app = data.application || {};
  const company = app.company_name || "Unknown Entity";
  const today = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const heading = (text: string, size = 14) => {
    ensureSpace(size + 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(20, 30, 60);
    doc.text(text, margin, y);
    y += size + 6;
    doc.setDrawColor(200);
    doc.line(margin, y, pageW - margin, y);
    y += 12;
    doc.setTextColor(40);
  };

  const para = (text: string) => {
    if (!text) return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(text, pageW - margin * 2);
    lines.forEach((ln: string) => {
      ensureSpace(14);
      doc.text(ln, margin, y);
      y += 14;
    });
    y += 6;
  };

  // ===== Cover =====
  doc.setFillColor(20, 30, 60);
  doc.rect(0, 0, pageW, 160, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("FINAL INVESTMENT REPORT", margin, 70);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Intelli-Credit — AI Powered Corporate Credit Decisioning", margin, 92);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(company, margin, 130);

  y = 190;
  doc.setTextColor(40);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Report Date: ${today}`, margin, y); y += 14;
  doc.text(`Application ID: ${app.id || "-"}`, margin, y); y += 20;

  // ===== Entity Summary =====
  heading("1. Entity Summary");
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Field", "Value"]],
    body: [
      ["Company", app.company_name || "-"],
      ["CIN", app.cin || "-"],
      ["Sector", app.sector || "-"],
      ["Incorporation Year", app.incorporation_year || "-"],
      ["Promoter Group", app.promoter_group || "-"],
      ["Registered Address", app.registered_address || "-"],
      ["Contact Person", app.contact_person || "-"],
      ["Loan Amount Requested", app.loan_amount ? `INR ${Number(app.loan_amount).toLocaleString("en-IN")}` : "-"],
      ["CIBIL Score", String(app.cibil_score ?? "-")],
      ["Current Status", app.status || "-"],
    ],
    theme: "striped",
    headStyles: { fillColor: [20, 30, 60] },
    styles: { fontSize: 9 },
  });
  y = (doc as any).lastAutoTable.finalY + 18;

  // ===== Risk Analysis =====
  heading("2. AI Risk Analysis");
  const risk = data.risk;
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Metric", "Value"]],
    body: [
      ["Risk Score", String(risk?.risk_score ?? app.risk_score ?? "-")],
      ["Risk Category", risk?.risk_category || app.risk_category || "-"],
      ["Default Probability", risk?.default_probability != null ? `${(Number(risk.default_probability) * 100).toFixed(2)}%` : "-"],
    ],
    theme: "striped",
    headStyles: { fillColor: [20, 30, 60] },
    styles: { fontSize: 9 },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  const expl = risk?.explanation;
  if (expl) {
    const items = Array.isArray(expl) ? expl : (expl.factors || expl.drivers || []);
    if (Array.isArray(items) && items.length) {
      para("Key Risk Drivers:");
      items.slice(0, 8).forEach((it: any) => {
        const t = typeof it === "string" ? it : (it.text || it.factor || JSON.stringify(it));
        para(`• ${t}`);
      });
    }
  }

  // ===== Financial Features =====
  if (data.financials) {
    heading("3. Financial Profile");
    const f = data.financials;
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Indicator", "Value"]],
      body: [
        ["Revenue Growth", f.revenue_growth != null ? `${f.revenue_growth}%` : "-"],
        ["Profit Margin", f.profit_margin != null ? `${f.profit_margin}%` : "-"],
        ["Debt Ratio", f.debt_ratio != null ? String(f.debt_ratio) : "-"],
        ["Interest Coverage Ratio", f.interest_coverage_ratio != null ? String(f.interest_coverage_ratio) : "-"],
        ["Sector Risk", f.sector_risk != null ? String(f.sector_risk) : "-"],
        ["Collateral Score", f.collateral_score != null ? String(f.collateral_score) : "-"],
        ["Litigation Count", String(f.litigation_count ?? 0)],
      ],
      theme: "striped",
      headStyles: { fillColor: [20, 30, 60] },
      styles: { fontSize: 9 },
    });
    y = (doc as any).lastAutoTable.finalY + 18;
  }

  // ===== AML =====
  heading("4. AML / Compliance Screening");
  const aml = data.aml;
  if (aml) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Check", "Result"]],
      body: [
        ["AML Risk Score", String(aml.aml_risk_score ?? 0)],
        ["AML Risk Level", aml.aml_risk_level || "Low"],
        ["Sanction Match", aml.sanction_match ? "Yes" : "No"],
        ["PEP Detected", aml.pep_detected ? "Yes" : "No"],
        ["Fraud History", aml.fraud_history ? "Yes" : "No"],
      ],
      theme: "striped",
      headStyles: { fillColor: [20, 30, 60] },
      styles: { fontSize: 9 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
    const flags = Array.isArray(aml.flags) ? aml.flags : [];
    if (flags.length) {
      para("Flags Raised:");
      flags.forEach((f: any) => para(`• ${typeof f === "string" ? f : (f.message || JSON.stringify(f))}`));
    }
  } else {
    para("No AML screening on record.");
  }

  // ===== SWOT =====
  heading("5. SWOT Analysis");
  const swot = data.swot;
  if (swot) {
    const rows: any[] = [];
    const pushBlock = (label: string, arr: any) => {
      const items = Array.isArray(arr) ? arr : [];
      rows.push([label, items.length ? items.map((i: any) => `• ${typeof i === "string" ? i : (i.text || JSON.stringify(i))}`).join("\n") : "-"]);
    };
    pushBlock("Strengths", swot.strengths);
    pushBlock("Weaknesses", swot.weaknesses);
    pushBlock("Opportunities", swot.opportunities);
    pushBlock("Threats", swot.threats);
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Quadrant", "Details"]],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [20, 30, 60] },
      styles: { fontSize: 9, cellPadding: 6 },
      columnStyles: { 0: { cellWidth: 100, fontStyle: "bold" } },
    });
    y = (doc as any).lastAutoTable.finalY + 18;
  } else {
    para("SWOT analysis not generated.");
  }

  // ===== CAM =====
  heading("6. Credit Appraisal Memo");
  const cam = data.cam;
  if (cam) {
    if (cam.company_overview) { para("Company Overview:"); para(cam.company_overview); }
    if (cam.financial_analysis) { para("Financial Analysis:"); para(cam.financial_analysis); }
    if (cam.risk_analysis) { para("Risk Analysis:"); para(cam.risk_analysis); }
  } else {
    para("CAM report not generated.");
  }

  // ===== Documents =====
  heading("7. Documents on Record");
  if (data.documents.length) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Document", "Type", "Status"]],
      body: data.documents.map((d) => [d.document_name, d.document_type, d.verification_status]),
      theme: "striped",
      headStyles: { fillColor: [20, 30, 60] },
      styles: { fontSize: 9 },
    });
    y = (doc as any).lastAutoTable.finalY + 18;
  } else {
    para("No documents uploaded.");
  }

  // ===== Final Recommendation =====
  heading("8. Final Recommendation");
  const rec = cam?.recommendation || app.recommendation || "Under Review";
  const limit = cam?.suggested_loan_limit || app.suggested_limit || "-";
  const rate = cam?.interest_rate || app.interest_rate || "-";
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Field", "Value"]],
    body: [
      ["Recommendation", rec],
      ["Suggested Loan Limit", limit],
      ["Indicative Interest Rate", rate],
      ["Credit Officer Decision", app.credit_officer_decision || "Pending"],
      ["Manager Decision", app.manager_decision || "Pending"],
      ["Final Status", app.final_status || "Pending"],
    ],
    theme: "striped",
    headStyles: { fillColor: [20, 30, 60] },
    styles: { fontSize: 10 },
  });
  y = (doc as any).lastAutoTable.finalY + 24;

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(`Intelli-Credit Confidential • ${company} • Page ${i} / ${pageCount}`, margin, pageH - 18);
  }

  return doc.output("blob");
}
