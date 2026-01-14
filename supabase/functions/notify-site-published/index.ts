// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotifySitePublishedRequest {
  landingPageId: string;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { landingPageId }: NotifySitePublishedRequest = await req.json();

    if (!landingPageId) {
      return new Response(
        JSON.stringify({ error: "landingPageId é obrigatório" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const { data: landingPage, error } = await supabase
      .from("landing_pages")
      .select("id, subdomain, custom_domain, briefing_data")
      .eq("id", landingPageId)
      .single();

    if (error || !landingPage) {
      console.error("Erro ao buscar landing page:", error);
      return new Response(
        JSON.stringify({ error: "Landing page não encontrada" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const briefing: any = landingPage.briefing_data || {};
    const toEmail: string | undefined =
      briefing.contactEmail || briefing.email;

    if (!toEmail) {
      console.warn(
        "Nenhum email encontrado no briefing para landing page",
        landingPageId,
      );
      return new Response(
        JSON.stringify({ message: "Nenhum email para notificar" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const displayDomain = landingPage.custom_domain
      ? landingPage.custom_domain
      : `${landingPage.subdomain}.docpage.com.br`;

    const siteUrl = `https://${displayDomain}`;

    const doctorName = briefing.name || "Doutor(a)";

    const emailResponse = await resend.emails.send({
      from: "DocPage AI <noreply@resend.dev>",
      to: [toEmail],
      subject: "Seu site está no ar!",
      html: `
        <h1>Parabéns, ${doctorName}!</h1>
        <p>Seu novo site profissional acaba de ser publicado e já está disponível no endereço:</p>
        <p><a href="${siteUrl}">${siteUrl}</a></p>
        <p>Agora você já pode divulgar o link para seus pacientes e em todas as suas redes.</p>
        <p style="margin-top: 24px; font-size: 14px; color: #555;">Este é um email automático enviado pela plataforma DocPage AI.</p>
      `,
    });

    if (emailResponse?.error) {
      // Log the error but don't fail the request - site was published successfully
      console.warn("Email de notificação não enviado (modo teste Resend):", emailResponse.error);
      return new Response(
        JSON.stringify({ 
          success: true, 
          warning: "Site publicado, mas email não enviado (configure domínio no Resend)" 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    console.log("Email de site publicado enviado com sucesso:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Erro na função notify-site-published:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
};

serve(handler);
