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
      .select("id, subdomain, custom_domain, briefing_data, user_id")
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

    if (!landingPage.user_id) {
      console.error("Landing page sem user_id:", landingPageId);
      return new Response(
        JSON.stringify({ error: "Landing page sem usuário associado" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Buscar email do usuário autenticado (usado na etapa de Configuração & Pagamento)
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(landingPage.user_id);

    if (userError || !user || !user.user?.email) {
      console.error("Erro ao buscar email do usuário:", {
        error: userError,
        userId: landingPage.user_id,
        user: user,
      });

      // Fallback: tentar pegar do briefing_data como backup
      const briefing: any = landingPage.briefing_data || {};
      const fallbackEmail = briefing.contactEmail || briefing.email;

      if (!fallbackEmail) {
        return new Response(
          JSON.stringify({ 
            error: "Não foi possível encontrar email do usuário",
            details: {
              landingPageId,
              userId: landingPage.user_id,
              userError: userError?.message,
            }
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      console.warn("Usando email do briefing_data como fallback:", fallbackEmail);
      var toEmail = fallbackEmail;
    } else {
      // Usar email do usuário autenticado (correto - da etapa Configuração & Pagamento)
      var toEmail = user.user.email;
    }

    const briefing: any = landingPage.briefing_data || {};
    const doctorName = briefing.name || "Doutor(a)";

    console.log('Dados da landing page para notificação:', {
      landingPageId,
      subdomain: landingPage.subdomain,
      customDomain: landingPage.custom_domain,
      userId: landingPage.user_id,
      userEmail: user?.user?.email || 'NÃO ENCONTRADO',
      briefingName: briefing.name,
      hasContactEmail: !!briefing.contactEmail,
      hasEmail: !!briefing.email,
      toEmail: toEmail || 'NÃO ENCONTRADO',
      emailSource: user?.user?.email ? 'auth.users (correto)' : 'briefing_data (fallback)',
    });

    if (!toEmail) {
      console.error(
        "Nenhum email encontrado para enviar notificação",
        {
          landingPageId,
          userId: landingPage.user_id,
          userError: userError?.message,
          briefingKeys: Object.keys(briefing),
        }
      );
      return new Response(
        JSON.stringify({ 
          error: "Nenhum email encontrado para enviar notificação",
          details: {
            landingPageId,
            userId: landingPage.user_id,
            userError: userError?.message,
            availableFields: Object.keys(briefing),
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Usar formato path-based: https://docpage.com.br/xxx
    const displayDomain = landingPage.custom_domain
      ? landingPage.custom_domain
      : `docpage.com.br/${landingPage.subdomain}`;

    const siteUrl = `https://${displayDomain}`;

    console.log("Tentando enviar email via Resend:", {
      from: "DocPage AI <noreply@docpage.com.br>",
      to: toEmail,
      subject: "🎉 Seu site está no ar! - DocPage AI",
      hasResendApiKey: !!Deno.env.get("RESEND_API_KEY"),
    });

    const emailResponse = await resend.emails.send({
      from: "DocPage AI <noreply@docpage.com.br>",
      to: [toEmail],
      subject: "🎉 Seu site está no ar! - DocPage AI",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="color: #18181b; font-size: 28px; margin: 0 0 24px 0; text-align: center;">
              🎉 Parabéns, ${doctorName}!
            </h1>
            <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Seu novo site profissional acaba de ser publicado e já está disponível no ar!
            </p>
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 8px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
              <p style="color: white; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">Seu site está disponível em:</p>
              <a href="${siteUrl}" style="color: white; font-size: 18px; font-weight: bold; text-decoration: none; word-break: break-all;">${siteUrl}</a>
            </div>
            <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
              Agora você pode:
            </p>
            <ul style="color: #52525b; font-size: 16px; line-height: 1.8; margin: 0 0 24px 0; padding-left: 20px;">
              <li>Divulgar o link para seus pacientes</li>
              <li>Compartilhar nas suas redes sociais</li>
              <li>Adicionar o link nas suas assinaturas de email</li>
              <li>Usar em materiais de marketing</li>
            </ul>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${siteUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Ver Meu Site
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0 24px 0;">
            <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0 0 8px 0;">
              Este é um email automático enviado pela plataforma DocPage AI.
            </p>
            <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
              Em caso de dúvidas, entre em contato: <a href="mailto:suporte@docpage.com.br" style="color: #6366f1;">suporte@docpage.com.br</a>
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Resposta completa do Resend:", JSON.stringify(emailResponse, null, 2));

    // Verificar se há erro explícito
    if (emailResponse?.error) {
      console.error("Email de notificação não enviado - Erro do Resend:", {
        error: emailResponse.error,
        landingPageId,
        toEmail,
        errorName: emailResponse.error?.name,
        errorMessage: emailResponse.error?.message,
        fullError: emailResponse.error,
      });
      return new Response(
        JSON.stringify({ 
          success: false,
          error: emailResponse.error?.message || JSON.stringify(emailResponse.error),
          warning: "Site publicado, mas email não enviado. Verifique a configuração do Resend.",
          details: emailResponse.error,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Verificar se a resposta tem data.id (confirmação de envio bem-sucedido)
    const emailId = emailResponse?.data?.id;
    if (!emailId) {
      console.error("Email não foi enviado - Resposta do Resend sem data.id:", {
        landingPageId,
        toEmail,
        emailResponse,
        hasData: !!emailResponse?.data,
        dataKeys: emailResponse?.data ? Object.keys(emailResponse.data) : [],
      });
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Resposta do Resend inválida - email não foi enviado",
          warning: "Site publicado, mas email não foi enviado. Verifique a configuração do Resend.",
          details: {
            response: emailResponse,
            message: "A resposta do Resend não contém data.id, indicando que o email não foi enviado.",
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    console.log("Email de site publicado enviado com sucesso:", {
      landingPageId,
      toEmail,
      emailId,
      response: emailResponse,
    });

    return new Response(JSON.stringify({ 
      success: true,
      emailId: emailId,
      to: toEmail,
    }), {
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
