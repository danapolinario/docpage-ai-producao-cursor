// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CheckDomainRequest {
  domain: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain }: CheckDomainRequest = await req.json();

    if (!domain) {
      return new Response(
        JSON.stringify({ error: "Domínio é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validar formato do domínio (apenas o nome, sem extensão)
    const domainName = domain.toLowerCase().trim();
    
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(domainName)) {
      return new Response(
        JSON.stringify({ 
          available: false, 
          error: "Formato de domínio inválido. Use apenas letras, números e hífens." 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (domainName.length < 2 || domainName.length > 63) {
      return new Response(
        JSON.stringify({ 
          available: false, 
          error: "Domínio deve ter entre 2 e 63 caracteres." 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Construir o domínio completo (.com.br)
    const fullDomain = `${domainName}.com.br`;
    
    console.log(`Verificando domínio via RDAP: ${fullDomain}`);

    // Consultar API RDAP do Registro.br
    const rdapUrl = `https://rdap.registro.br/domain/${fullDomain}`;
    
    const rdapResponse = await fetch(rdapUrl, {
      method: "GET",
      headers: {
        "Accept": "application/rdap+json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
      },
    });

    console.log(`RDAP Response status: ${rdapResponse.status}`);

    if (rdapResponse.status === 404) {
      // Domínio NÃO existe no Registro.br = DISPONÍVEL
      console.log(`Domínio ${fullDomain} está DISPONÍVEL`);
      return new Response(
        JSON.stringify({ 
          available: true, 
          domain: domainName,
          fullDomain: fullDomain,
          message: "Domínio disponível para registro!" 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (rdapResponse.ok) {
      // Domínio existe = NÃO DISPONÍVEL
      const rdapData = await rdapResponse.json();
      console.log(`Domínio ${fullDomain} NÃO está disponível:`, rdapData.handle || rdapData.ldhName);
      
      return new Response(
        JSON.stringify({ 
          available: false, 
          domain: domainName,
          fullDomain: fullDomain,
          error: "Este domínio já está registrado. Por favor, escolha outro nome." 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Status 403 pode ser rate limiting - tentar DNS como fallback
    if (rdapResponse.status === 403) {
      console.log(`RDAP retornou 403 para ${fullDomain}, usando DNS lookup como fallback`);
      
      try {
        // Tentar resolver DNS - se resolver, domínio existe
        const dnsResponse = await fetch(`https://dns.google/resolve?name=${fullDomain}&type=A`);
        const dnsData = await dnsResponse.json();
        
        if (dnsData.Answer && dnsData.Answer.length > 0) {
          // DNS resolveu = domínio existe
          console.log(`DNS encontrou ${fullDomain} - domínio NÃO disponível`);
          return new Response(
            JSON.stringify({ 
              available: false, 
              domain: domainName,
              fullDomain: fullDomain,
              error: "Este domínio já está registrado. Por favor, escolha outro nome." 
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        
        // DNS não resolveu - provavelmente disponível
        console.log(`DNS não encontrou ${fullDomain} - provavelmente DISPONÍVEL`);
        return new Response(
          JSON.stringify({ 
            available: true, 
            domain: domainName,
            fullDomain: fullDomain,
            message: "Domínio provavelmente disponível! Confirme no Registro.br" 
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } catch (dnsError) {
        console.log(`Erro no DNS lookup, assumindo disponível:`, dnsError);
        return new Response(
          JSON.stringify({ 
            available: true, 
            domain: domainName,
            fullDomain: fullDomain,
            message: "Domínio provavelmente disponível! Confirme no Registro.br" 
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Outros status - tratar como erro
    console.error(`RDAP retornou status inesperado: ${rdapResponse.status}`);
    return new Response(
      JSON.stringify({ 
        available: false, 
        error: "Erro ao verificar disponibilidade. Tente novamente." 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("Erro ao verificar domínio RDAP:", error);
    return new Response(
      JSON.stringify({ 
        available: false, 
        error: "Erro ao verificar domínio. Tente novamente." 
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
