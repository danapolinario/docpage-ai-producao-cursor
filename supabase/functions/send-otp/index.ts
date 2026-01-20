// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  email: string;
  name?: string;
}

// Gera código de 6 dígitos
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: SendOTPRequest = await req.json();

    const rawEmail = (email || "").trim().toLowerCase();
    const rawName = (name || "").trim();

    if (!rawEmail) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawEmail) || rawEmail.length > 255) {
      return new Response(
        JSON.stringify({ error: "Formato de email inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Sanitize and limit name to avoid abuse
    const sanitizedName = rawName
      .replace(/[<>"']/g, "")
      .substring(0, 100) || rawEmail.split("@")[0];

    // Conectar ao Supabase para armazenar o código
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados");
      return new Response(
        JSON.stringify({ error: "Configuração do Supabase ausente. Verifique as variáveis de ambiente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Simple rate limiting: prevent requesting a new code too frequently per email
    const { data: existingRecord } = await supabase
      .from("otp_codes")
      .select("created_at")
      .eq("email", rawEmail)
      .maybeSingle();

    if (existingRecord?.created_at) {
      const lastCreated = new Date(existingRecord.created_at).getTime();
      const now = Date.now();
      const diffMs = now - lastCreated;

      // Block if requesting more than once per 60 seconds
      if (diffMs < 60 * 1000) {
        return new Response(
          JSON.stringify({
            error:
              "Você já solicitou um código recentemente. Aguarde um pouco antes de tentar novamente.",
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Gerar código OTP (6 dígitos)
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Salvar/atualizar código OTP na tabela
    const { error: dbError } = await supabase
      .from("otp_codes")
      .upsert(
        {
          email: rawEmail,
          code: otpCode,
          expires_at: expiresAt.toISOString(),
          verified: false,
          name: sanitizedName,
        },
        { onConflict: "email" },
      );

    if (dbError) {
      console.error("Erro ao salvar OTP no banco:", dbError);
      console.error("Detalhes do erro:", JSON.stringify(dbError, null, 2));
      return new Response(
        JSON.stringify({ 
          error: "Erro ao gerar código",
          details: dbError.message || "Erro ao salvar código no banco de dados. Verifique se a tabela otp_codes existe."
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verificar se Resend está configurado
    if (!resend || !RESEND_API_KEY) {
      console.error("RESEND_API_KEY não configurada");
      // Remover o OTP recém-criado para não deixar código órfão
      await supabase
        .from("otp_codes")
        .delete()
        .eq("email", rawEmail);
      
      return new Response(
        JSON.stringify({
          error: "RESEND_API_KEY não configurada. Configure esta variável no Supabase (Settings > Edge Functions > Secrets).",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Enviar email com Resend
    const emailResponse = await resend.emails.send({
      from: "DocPage AI <noreply@docpage.com.br>",
      to: [rawEmail],
      subject: "Seu código de verificação - DocPage AI",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
          <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="color: #18181b; font-size: 24px; margin: 0 0 24px 0; text-align: center;">
              DocPage AI
            </h1>
            <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
              Segue abaixo o código de verificação para você acessar sua conta:
            </p>
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: white;">
                ${otpCode}
              </span>
            </div>
            <p style="color: #71717a; font-size: 14px; text-align: center; margin: 0 0 16px 0;">
              Este código expira em <strong>10 minutos</strong>.
            </p>
            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
            <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
              Se você não solicitou este código, pode ignorar este email.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    // Resend retorna { data, error }
    console.log("Resposta completa do Resend:", JSON.stringify(emailResponse, null, 2));
    
    if (emailResponse?.error) {
      console.error("Falha ao enviar email:", emailResponse.error);
      
      // Remover o OTP recém-criado para não deixar código órfão
      await supabase
        .from("otp_codes")
        .delete()
        .eq("email", rawEmail);

      const errorMessage = emailResponse.error.message || JSON.stringify(emailResponse.error);
      
      return new Response(
        JSON.stringify({
          error: `Erro ao enviar email: ${errorMessage}. Verifique se o email está verificado no Resend ou configure um domínio.`,
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verificar se realmente foi enviado
    const emailId = emailResponse?.data?.id;
    if (!emailId) {
      console.warn("Resend retornou sucesso mas sem ID de email. Pode estar em modo teste.");
      console.warn("Resposta completa:", JSON.stringify(emailResponse, null, 2));
    }

    console.log("Email enviado com sucesso. ID:", emailId);
    console.log("Destinatário:", rawEmail);
    console.log("Código OTP gerado:", otpCode);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Código enviado para " + rawEmail,
        emailId: emailId,
        // Em modo teste do Resend, só envia para emails verificados
        warning: emailId ? undefined : "Email pode não ter sido entregue. Verifique sua caixa de entrada e spam. Em modo teste do Resend, emails só são enviados para endereços verificados na sua conta."
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Erro na função send-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
};

serve(handler);
