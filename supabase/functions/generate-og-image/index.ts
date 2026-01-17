// @ts-nocheck - Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate OG image using AI for dynamic, branded social sharing images
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, specialty, crm, crmState, photoUrl, subdomain } = await req.json();

    if (!name || !specialty) {
      return new Response(
        JSON.stringify({ error: "Nome e especialidade são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY não configurada");
      return new Response(
        JSON.stringify({ error: "Configuração de API ausente" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate OG image using AI image generation
    const prompt = `Create a professional medical doctor social media preview card image (1200x630 pixels, 16:9 aspect ratio) with:
- A clean, modern healthcare design with a light blue/teal gradient background
- The doctor's name "${name}" prominently displayed in elegant white typography
- The medical specialty "${specialty}" shown below the name
- CRM credentials "${crm}/${crmState}" in a subtle badge or corner
- Professional medical imagery (stethoscope, medical cross) as subtle design elements
- Call-to-action text "Agende sua Consulta" in a button-like design at bottom
- Clean, professional aesthetic suitable for WhatsApp/Facebook sharing
- High contrast, readable text
Ultra high resolution, professional quality.`;

    console.log("Gerando OG image para:", name, specialty);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro ao gerar imagem:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit atingido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Entre em contato com o suporte." }),
          { status: 402, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Erro ao gerar imagem OG" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("Nenhuma imagem gerada na resposta:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Nenhuma imagem foi gerada" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("OG image gerada com sucesso para:", subdomain);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: imageUrl,
        subdomain: subdomain
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("Erro na função generate-og-image:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
