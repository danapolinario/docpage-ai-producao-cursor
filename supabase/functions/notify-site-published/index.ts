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
      .select("id, subdomain, custom_domain, chosen_domain, briefing_data, user_id")
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

    // Determinar o domínio escolhido pelo usuário
    // SEMPRE deve ser o domínio completo escolhido (com extensão), seja domínio próprio ou novo
    // NUNCA usar subdomain.docpage.com.br se o usuário escolheu um domínio
    let displayDomain: string | null = null;
    
    console.log('============================================');
    console.log('notify-site-published: INICIANDO determinação do domínio');
    console.log('notify-site-published: Dados da landing page:', {
      landingPageId,
      subdomain: landingPage.subdomain,
      custom_domain: landingPage.custom_domain,
      chosen_domain: landingPage.chosen_domain,
      user_id: landingPage.user_id,
    });
    console.log('============================================');
    
    // Prioridade 1: chosen_domain da landing_pages (campo que armazena o domínio escolhido)
    if (landingPage.chosen_domain) {
      displayDomain = landingPage.chosen_domain;
      console.log('notify-site-published: ✓✓✓ Usando chosen_domain da landing_pages:', displayDomain);
    } 
    // Prioridade 2: custom_domain (domínio próprio informado pelo usuário)
    else if (landingPage.custom_domain) {
      displayDomain = landingPage.custom_domain;
      console.log('notify-site-published: ✓✓✓ Usando custom_domain da landing page:', displayDomain);
    }
    
    // Prioridade 3: Buscar de pending_checkouts (fallback para casos antigos)
    // IMPORTANTE: SEMPRE buscar em pending_checkouts se chosen_domain estiver NULL
    // Isso garante que mesmo landing pages antigas tenham o domínio correto
    if (!displayDomain && landingPage.user_id) {
      console.log('notify-site-published: chosen_domain está NULL, buscando em pending_checkouts...');
      console.log('notify-site-published: Buscando domínio escolhido no pending_checkouts (fallback)', {
        landingPageId,
        userId: landingPage.user_id,
      });
      
      // Buscar em pending_checkouts pelo landing_page_id primeiro, depois pelo user_id
      let pendingCheckout = null;
      
      // Tentar buscar pelo landing_page_id primeiro (mais específico)
      const { data: byLandingPageId, error: errorById } = await supabase
        .from("pending_checkouts")
        .select("domain, has_custom_domain, custom_domain")
        .eq("landing_page_id", landingPageId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (errorById) {
        console.error('notify-site-published: Erro ao buscar por landing_page_id:', errorById);
      }
      
      if (byLandingPageId) {
        pendingCheckout = byLandingPageId;
        console.log('notify-site-published: Domínio encontrado por landing_page_id:', pendingCheckout);
      } else {
        // Se não encontrou, buscar pelo user_id (mais recente primeiro)
        const { data: byUserId, error: errorByUserId } = await supabase
          .from("pending_checkouts")
          .select("domain, has_custom_domain, custom_domain")
          .eq("user_id", landingPage.user_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (errorByUserId) {
          console.error('notify-site-published: Erro ao buscar por user_id:', errorByUserId);
        }
        
        if (byUserId) {
          pendingCheckout = byUserId;
          console.log('notify-site-published: Domínio encontrado por user_id:', pendingCheckout);
        } else {
          console.log('notify-site-published: Nenhum registro encontrado em pending_checkouts');
        }
      }
      
      if (pendingCheckout) {
        // Se tem domínio customizado, usar ele; senão, usar o domínio escolhido (com extensão)
        const domainFromPending = pendingCheckout.has_custom_domain && pendingCheckout.custom_domain
          ? pendingCheckout.custom_domain
          : pendingCheckout.domain; // Este é o domínio escolhido pelo usuário (ex: "meudominio.com.br")
        
        // Validar que o domínio tem extensão antes de usar
        if (domainFromPending && (domainFromPending.includes('.com.br') || domainFromPending.includes('.med.br') || domainFromPending.includes('.com') || domainFromPending.includes('.br'))) {
          displayDomain = domainFromPending;
          console.log('notify-site-published: ✓ Domínio escolhido determinado de pending_checkouts:', displayDomain);
          
          // IMPORTANTE: Atualizar chosen_domain na landing page para evitar buscar novamente
          // Isso garante que futuras chamadas já tenham o chosen_domain preenchido
          const { error: updateError } = await supabase
            .from("landing_pages")
            .update({ chosen_domain: domainFromPending })
            .eq("id", landingPageId);
          
          if (updateError) {
            console.warn('notify-site-published: Erro ao atualizar chosen_domain na landing page:', updateError);
          } else {
            console.log('notify-site-published: ✓ chosen_domain atualizado na landing page:', domainFromPending);
            // Atualizar o objeto landingPage localmente para refletir a mudança
            landingPage.chosen_domain = domainFromPending;
          }
        } else {
          console.warn('notify-site-published: Domínio de pending_checkouts sem extensão válida:', domainFromPending);
        }
      }
    }
    
    // Se ainda não encontrou, usar subdomain como último recurso
    // MAS apenas se realmente não houver nenhum domínio escolhido (casos muito antigos)
    if (!displayDomain) {
      displayDomain = `${landingPage.subdomain}.docpage.com.br`;
      console.error('============================================');
      console.error('notify-site-published: ⚠⚠⚠ ERRO: Usando fallback subdomain.docpage.com.br');
      console.error('notify-site-published: ⚠ Isso indica que chosen_domain não foi salvo corretamente');
      console.error('notify-site-published: ⚠ Dados disponíveis:', {
        chosen_domain: landingPage.chosen_domain,
        custom_domain: landingPage.custom_domain,
        subdomain: landingPage.subdomain,
        user_id: landingPage.user_id,
      });
      console.error('============================================');
    }

    // Log final do displayDomain determinado - SEMPRE APARECERÁ
    console.log('============================================');
    console.log('notify-site-published: displayDomain FINAL determinado:', displayDomain);
    console.log('notify-site-published: chosen_domain:', landingPage.chosen_domain);
    console.log('notify-site-published: custom_domain:', landingPage.custom_domain);
    console.log('notify-site-published: subdomain:', landingPage.subdomain);
    console.log('notify-site-published: URL que será enviada no email:', `https://${displayDomain}`);
    console.log('============================================');

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

    // Log ANTES de determinar displayDomain (para debug)
    console.log('notify-site-published: Dados da landing page ANTES de determinar displayDomain:', {
      landingPageId,
      subdomain: landingPage.subdomain,
      custom_domain: landingPage.custom_domain,
      chosen_domain: landingPage.chosen_domain,
      user_id: landingPage.user_id,
    });
    
    // displayDomain já foi determinado acima, mas vamos garantir que está correto
    // Log DEPOIS de determinar displayDomain
    console.log('notify-site-published: displayDomain determinado:', displayDomain);
    
    console.log('notify-site-published: Dados completos para notificação:', {
      landingPageId,
      subdomain: landingPage.subdomain,
      customDomain: landingPage.custom_domain,
      chosenDomain: landingPage.chosen_domain,
      displayDomain, // Domínio que será usado no email
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

    // Garantir que o domínio não tenha protocolo
    displayDomain = displayDomain.replace(/^https?:\/\//, '');
    
    // Validar que o domínio escolhido tem extensão (não deve ser apenas o subdomain)
    // Se não tiver extensão e não for docpage.com.br, pode ser um problema nos dados
    if (!displayDomain.includes('.') && !displayDomain.includes('docpage')) {
      console.error('notify-site-published: ERRO - Domínio escolhido sem extensão detectado:', displayDomain);
      console.error('notify-site-published: Dados da landing page:', {
        chosen_domain: landingPage.chosen_domain,
        custom_domain: landingPage.custom_domain,
        subdomain: landingPage.subdomain,
      });
    }

    const siteUrl = `https://${displayDomain}`;
    
    console.log('notify-site-published: ============================================');
    console.log('notify-site-published: URL FINAL QUE SERÁ ENVIADA NO EMAIL:', siteUrl);
    console.log('notify-site-published: displayDomain:', displayDomain);
    console.log('notify-site-published: chosen_domain:', landingPage.chosen_domain);
    console.log('notify-site-published: custom_domain:', landingPage.custom_domain);
    console.log('notify-site-published: subdomain:', landingPage.subdomain);
    console.log('notify-site-published: ============================================');

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
