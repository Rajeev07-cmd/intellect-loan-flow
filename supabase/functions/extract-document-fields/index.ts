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
    const { document_id, application_id, document_name, file_url } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Build extraction prompt based on document type
    const docType = document_name.toLowerCase();
    let extractionFocus = "all business and financial fields";
    if (docType.includes("pan")) extractionFocus = "PAN number, name, date of birth, father's name";
    else if (docType.includes("gst")) extractionFocus = "GSTIN, legal name, trade name, registration date, state";
    else if (docType.includes("cin") || docType.includes("incorporation")) extractionFocus = "CIN, company name, date of incorporation, registered office, authorized capital";
    else if (docType.includes("financial") || docType.includes("annual") || docType.includes("balance")) extractionFocus = "revenue, net profit, total assets, total liabilities, debt ratio, EBITDA, interest coverage ratio";
    else if (docType.includes("director") || docType.includes("kyc")) extractionFocus = "director name, DIN, address, nationality, date of appointment";

    const systemPrompt = `You are a document data extraction AI for a corporate credit platform. Extract structured fields from the document described below.

For the document "${document_name}", focus on extracting: ${extractionFocus}.

You MUST return extracted fields using the extract_fields tool. For each field:
- field_name: The name of the field (e.g., "Company Name", "PAN", "Revenue")
- field_value: The extracted value
- page_number: Which page it was found on (default 1)
- confidence_score: Your confidence from 0.0 to 1.0
- coordinates: Approximate bounding box as {"x": number, "y": number, "width": number, "height": number} where values are percentages (0-100) of page dimensions

Extract as many relevant fields as possible. Be accurate with values.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract fields from document: "${document_name}" (URL: ${file_url}). This is a corporate loan application document.` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_fields",
              description: "Return extracted document fields with coordinates and confidence scores.",
              parameters: {
                type: "object",
                properties: {
                  fields: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        field_name: { type: "string" },
                        field_value: { type: "string" },
                        page_number: { type: "number" },
                        confidence_score: { type: "number" },
                        coordinates: {
                          type: "object",
                          properties: {
                            x: { type: "number" },
                            y: { type: "number" },
                            width: { type: "number" },
                            height: { type: "number" },
                          },
                          required: ["x", "y", "width", "height"],
                        },
                      },
                      required: ["field_name", "field_value", "page_number", "confidence_score", "coordinates"],
                    },
                  },
                },
                required: ["fields"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_fields" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Gateway error:", response.status, t);
      throw new Error("AI extraction failed");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No extraction result from AI");

    const extracted = JSON.parse(toolCall.function.arguments);
    const fields = extracted.fields || [];

    // Delete existing fields for this document and re-insert
    await sb.from("document_extracted_fields").delete().eq("document_id", document_id);

    if (fields.length > 0) {
      const rows = fields.map((f: any) => ({
        application_id,
        document_id,
        field_name: f.field_name,
        field_value: f.field_value,
        page_number: f.page_number || 1,
        coordinates: f.coordinates || {},
        confidence_score: f.confidence_score || 0,
        is_manually_verified: false,
      }));
      const { error: insertError } = await sb.from("document_extracted_fields").insert(rows);
      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error("Failed to save extracted fields");
      }
    }

    return new Response(JSON.stringify({ success: true, fields_count: fields.length, fields }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-document-fields error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
