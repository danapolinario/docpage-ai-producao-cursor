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
        ? "Transform this doctor's portrait photo into a professional medical office scene. The doctor should be placed in a clean, modern, bright medical office environment typical of Brazilian private practice. The person should be wearing medical attire (white coat or medical scrubs) and be clearly recognizable. The scene should show a well-lit, modern medical office with professional medical equipment visible in the background, clean white walls, modern furniture, and a professional, clean atmosphere. The doctor should appear natural and professional in this medical office setting. Ultra high resolution, portrait orientation, professional medical photography style."
        : "Transform this photo into a professional medical portrait of a doctor or medical professional. The person should be wearing professional medical attire (white medical coat or medical scrubs). Enhance the photo to look like a high-quality professional headshot with professional medical lighting, natural skin tone while keeping features realistic and recognizable, and a clean, neutral, professional medical-themed backdrop (soft gradient or subtle medical office background). The final result should look like a professional medical profile photo suitable for a doctor's website or medical practice, with the person clearly wearing medical professional attire. Ultra high resolution, portrait orientation, professional medical photography style.";

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY não configurada.");
      return new Response(
        JSON.stringify({ 
          error: "GEMINI_API_KEY não configurada. Configure esta variável no Supabase (Settings > Edge Functions > Secrets).",
          image: body.image 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Usa o Nano Banana (gemini-2.5-flash-image) diretamente via API do Gemini
    // Tenta primeiro com v1beta, se falhar tenta v1
    
    let geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    
    // Formato da requisição para geração de imagens
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
    };
    
    // Tenta primeiro sem responseModalities (pode não ser suportado)
    let geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // Se falhar com 400, tenta com v1 ao invés de v1beta
    if (!geminiResponse.ok && geminiResponse.status === 400) {
      console.log("Tentando com endpoint v1...");
      geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-image:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
      geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
    }

    // Se ainda falhar, tenta com modelo alternativo
    if (!geminiResponse.ok && geminiResponse.status === 400) {
      console.log("Tentando com modelo gemini-2.0-flash-exp...");
      geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
      geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
    }

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status);
      console.error("Error details:", errorText);
      console.error("Request URL:", geminiUrl);
      console.error("Request body keys:", Object.keys(requestBody));
      
      // Tenta parsear o erro como JSON para ver mais detalhes
      let errorDetails: any = {};
      try {
        errorDetails = JSON.parse(errorText);
        console.error("Parsed error:", JSON.stringify(errorDetails, null, 2));
      } catch (e) {
        console.error("Error text (raw):", errorText.substring(0, 500));
      }
      
      const status = geminiResponse.status;
      
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de uso do Gemini excedido. Tente novamente em alguns minutos." }),
          { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (status === 402 || status === 403) {
        return new Response(
          JSON.stringify({ error: "Pagamento ou permissões requeridas na conta do Gemini. Verifique seu billing e se o modelo gemini-2.5-flash-image está disponível na sua região." }),
          { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (status === 404) {
        return new Response(
          JSON.stringify({ error: "Modelo gemini-2.5-flash-image não encontrado. Verifique se o modelo está disponível na sua região ou se precisa usar outro endpoint." }),
          { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      
      // Se falhar, retorna a imagem original
      console.warn("Gemini API falhou. Retornando imagem original.");
      return new Response(
        JSON.stringify({ 
          image: body.image,
          warning: `Não foi possível processar a imagem com IA (erro ${status}). Retornando imagem original.`
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiData = await geminiResponse.json();
    
    // Log completo da resposta para debug
    console.log("Resposta completa do Gemini:", JSON.stringify(geminiData, null, 2));
    
    // Tenta extrair a imagem da resposta do Nano Banana
    let imageUrl: string | undefined;
    
    // Verifica diferentes formatos de resposta possíveis
    if (geminiData?.candidates?.[0]?.content?.parts) {
      console.log("Encontrou parts na resposta, verificando...");
      for (const part of geminiData.candidates[0].content.parts) {
        console.log("Part type:", Object.keys(part));
        
        // Se retornou imagem em base64 inline
        if (part.inlineData?.data) {
          console.log("Encontrou inlineData!");
          imageUrl = `data:${part.inlineData.mimeType || mimeType};base64,${part.inlineData.data}`;
          break;
        }
        // Se retornou URL de imagem
        if (part.fileData?.fileUri) {
          console.log("Encontrou fileUri:", part.fileData.fileUri);
          imageUrl = part.fileData.fileUri;
          break;
        }
        // Se retornou texto com URL de imagem
        if (part.text) {
          console.log("Encontrou texto, procurando URL ou base64...");
          const urlMatch = part.text.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|webp)/i);
          if (urlMatch) {
            imageUrl = urlMatch[0];
            break;
          }
          // Tenta extrair base64 do texto
          const base64Match = part.text.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
          if (base64Match) {
            imageUrl = base64Match[0];
            break;
          }
        }
      }
    }

    // Se não encontrou imagem na resposta, tenta usar a resposta completa como base64
    if (!imageUrl && geminiData) {
      console.log("Tentando extrair imagem de formato alternativo...");
      const responseStr = JSON.stringify(geminiData);
      // Procura por padrões de base64 na resposta
      const base64Pattern = /data:image\/[^;]+;base64,([A-Za-z0-9+/=]{100,})/;
      const match = responseStr.match(base64Pattern);
      if (match) {
        imageUrl = match[0];
        console.log("Encontrou base64 no texto da resposta!");
      }
    }

    // Se ainda não encontrou, retorna a imagem original com log detalhado
    if (!imageUrl) {
      console.warn("Nano Banana não retornou imagem na resposta. Retornando imagem original.");
      console.log("Estrutura da resposta:", {
        hasCandidates: !!geminiData?.candidates,
        candidatesLength: geminiData?.candidates?.length,
        firstCandidate: geminiData?.candidates?.[0] ? Object.keys(geminiData.candidates[0]) : null,
        responseKeys: Object.keys(geminiData || {}),
      });
      console.log("Resposta do Gemini (primeiros 1000 chars):", JSON.stringify(geminiData).substring(0, 1000));
      return new Response(
        JSON.stringify({ 
          image: body.image,
          warning: "O modelo não retornou uma imagem processada. Retornando imagem original.",
          debug: {
            hasCandidates: !!geminiData?.candidates,
            responseStructure: Object.keys(geminiData || {}),
          }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Retorna a imagem processada pelo Nano Banana
    console.log("Imagem processada com sucesso pelo Nano Banana!");
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
