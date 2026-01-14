// @ts-nocheck
// Edge Function (Deno runtime). The declarations below keep the web build TypeScript checker happy.
declare const Deno: {
  env: { get: (key: string) => string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      type,
      briefing,
      currentContent,
      currentDesign,
      currentVisibility,
      instruction,
    } = await req.json();

    if (!type || (type !== "generate" && type !== "refine")) {
      return new Response(
        JSON.stringify({ error: "Tipo de operação inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (type === "generate" && !briefing) {
      return new Response(
        JSON.stringify({ error: "Briefing é obrigatório para geração de conteúdo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (type === "refine" && !instruction) {
      return new Response(
        JSON.stringify({ error: "Instrução é obrigatória para refinamento" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "generate") {
      systemPrompt = `You are an expert medical copywriter. Create content for a high-converting landing page for a doctor.

CRITICAL COMPLIANCE RULES (CFM Resolution 2.336/2023 - STRICT):
1. NEVER use words like "Garantido", "Melhor do país", "Cura definitiva", "Sem riscos", "100% eficaz", "Milagroso".
2. Do NOT promise specific results (e.g., "Lose 10kg in 1 week").
3. Use educational and objective language (e.g., "Treatment indicated for...", "Evaluation required").
4. Call to Actions (CTA) must be neutral: "Agendar Consulta", "Marcar Avaliação", "Entrar em Contato". Do NOT use "Compre Agora".
5. In the services descriptions, explain WHAT the procedure is, do not sell the result.
6. Ensure the tone builds trust but respects medical ethics.

Keep the tone professional yet approachable.`;

      userPrompt = `Create content for a landing page with these details:
- Name: ${briefing.name}
- Specialty: ${briefing.specialty}
- Target Audience: ${briefing.targetAudience}
- Services: ${briefing.mainServices}
- Bio/Background: ${briefing.bio || "N/A"}
- Tone: ${briefing.tone}
- Locations: ${briefing.addresses?.join(', ') || "N/A"}

Return a JSON object with these fields:
{
  "headline": "A catchy main headline for the hero section",
  "subheadline": "A supporting subheadline explaining the value proposition",
  "ctaText": "Text for the main Call to Action button",
  "aboutTitle": "Title for the About Doctor section",
  "aboutBody": "Biographical text about the doctor, building trust",
  "servicesTitle": "Title for the Services section",
  "services": [{"title": "Service name", "description": "Service description"}],
  "testimonials": [{"name": "Patient name", "text": "Testimonial text"}],
  "footerText": "Footer copyright text",
  "contactEmail": "email if provided",
  "contactPhone": "phone if provided",
  "contactAddresses": ["addresses if provided"]
}`;
    } else if (type === "refine") {
      systemPrompt = `You are an expert Landing Page Designer and Copywriter assistant.
The user wants to modify their page. You can change the TEXT content, the VISUAL DESIGN, or the VISIBILITY of sections.

Instructions:
1. Interpret the user's intent.
   - If they say "make it blue" or "round buttons", update 'design'.
   - If they say "hide testimonials", update 'visibility'.
   - If they say "rewrite the headline", update 'content'.
2. Return a JSON object with ONLY the parts that need to change.
3. If changing content, return the FULL content object with the specific fields updated.
4. If changing design or visibility, you can return partial objects.

Compliance Reminder: Do NOT allow any changes that violate medical advertising ethics (no sensationalism).

Available Design Options:
- colorPalette: blue, green, slate, rose, indigo
- secondaryColor: orange, teal, purple, gold, gray
- fontPairing: sans, serif-sans, mono-sans
- borderRadius: none, medium, full
- photoStyle: minimal, organic, framed, glass, floating, arch, rotate, collage`;

      userPrompt = `Current State:
- Content: ${JSON.stringify(currentContent)}
- Design Settings: ${JSON.stringify(currentDesign)}
- Section Visibility: ${JSON.stringify(currentVisibility)}

User Instruction: "${instruction}"

Return a JSON object with the changes needed:
{
  "content": { /* only if content changes needed */ },
  "design": { /* only if design changes needed */ },
  "visibility": { /* only if visibility changes needed */ }
}`;
    }

    // Call Google Gemini API directly using GEMINI_API_KEY (v1 endpoint, gemini-2.5-flash)
    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" +
        encodeURIComponent(GEMINI_API_KEY),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${systemPrompt}\n\n${userPrompt}`,
                },
              ],
            },
          ],
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorText);

      const status = geminiResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de uso do Gemini excedido. Tente novamente mais tarde." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Pagamento requerido na conta do Gemini. Verifique seu billing." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ error: `Gemini API error: ${geminiResponse.status}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }


    const geminiData = await geminiResponse.json();
    const text =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;

    if (!text) {
      throw new Error("Gemini não retornou conteúdo");
    }

    // O modelo às vezes retorna JSON dentro de blocos markdown ```json ... ```;
    // aqui limpamos esses fences e garantimos que o body seja JSON válido.
    let cleaned = text.trim();

    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```json\s*/i, "");
      cleaned = cleaned.replace(/^```\s*/i, "");
      cleaned = cleaned.replace(/```\s*$/, "");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("Falha ao fazer parse do JSON retornado pelo Gemini:", cleaned, e);
      throw new Error("Resposta do Gemini não é um JSON válido");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

