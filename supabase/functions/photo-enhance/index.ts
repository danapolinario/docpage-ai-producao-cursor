// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EnhanceRequest {
  image: string; // base64 data URL
  type?: "profile" | "office";
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as EnhanceRequest;

    if (!body.image) {
      return new Response(
        JSON.stringify({ error: "Imagem (base64) é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }


    // Extrai dados da data URL: data:image/...;base64,XXXXX
    const dataUrlMatch = body.image.match(/^data:(.+);base64,(.+)$/);
    if (!dataUrlMatch) {
      return new Response(
        JSON.stringify({ error: "Formato de imagem inválido. Esperado data URL base64." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const mimeType = dataUrlMatch[1] || "image/png";
    const base64Data = dataUrlMatch[2];

    const prompt =
      body.type === "office"
        ? "Transform this doctor's portrait into a clean, bright medical office scene that matches Brazilian private practice aesthetics. Keep the person recognizable and in a professional context. Ultra high resolution, portrait orientation."
        : "Enhance this doctor's portrait photo: improve lighting, smooth skin subtly, keep features realistic, adjust background to a clean, soft medical-themed backdrop. Ultra high resolution, portrait orientation.";

    const geminiPrompt = prompt;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY não configurada no backend" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Chamada ao gateway Lovable AI usando modelo de imagem do Gemini
    const gatewayResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: geminiPrompt },
                {
                  type: "image_url",
                  image_url: {
                    // Mantém o mesmo data URL enviado pelo cliente
                    url: `data:${mimeType};base64,${base64Data}`,
                  },
                },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      },
    );

    if (!gatewayResponse.ok) {
      const text = await gatewayResponse.text();
      console.error("photo-enhance Lovable AI error", gatewayResponse.status, text);
      const status = gatewayResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de uso da IA excedido. Tente novamente em alguns minutos." }),
          { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos à sua conta." }),
          { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: "Erro ao processar imagem com IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiData = await gatewayResponse.json();
    const imageUrl =
      aiData?.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("photo-enhance: resposta da IA sem imagem", aiData);
      return new Response(
        JSON.stringify({ error: "Gemini não retornou imagem" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mantém o contrato anterior: retorna um data URL em { image }
    return new Response(
      JSON.stringify({ image: imageUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Erro na função photo-enhance:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
