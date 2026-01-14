// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  email: string;
  code: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code }: VerifyOTPRequest = await req.json();

    const rawEmail = (email || "").trim().toLowerCase();
    const rawCode = (code || "").trim();

    if (!rawEmail || !rawCode) {
      return new Response(
        JSON.stringify({ error: "Email e código são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Basic email and code validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawEmail) || rawEmail.length > 255) {
      return new Response(
        JSON.stringify({ error: "Formato de email inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const codeRegex = /^\d{6}$/;
    if (!codeRegex.test(rawCode)) {
      // Small delay to make brute force slightly harder
      await sleep(800);
      return new Response(
        JSON.stringify({ error: "Código inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Conectar ao Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar código OTP
    const { data: otpRecord, error: fetchError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", rawEmail)
      .single();

    if (fetchError || !otpRecord) {
      await sleep(800);
      return new Response(
        JSON.stringify({ error: "Código não encontrado. Solicite um novo código." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verificar se código expirou
    if (new Date(otpRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Código expirado. Solicite um novo código." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verificar se código já foi usado
    if (otpRecord.verified) {
      return new Response(
        JSON.stringify({ error: "Código já utilizado. Solicite um novo código." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verificar código
    if (otpRecord.code !== rawCode) {
      await sleep(1000); // Delay on incorrect code to slow brute force
      return new Response(
        JSON.stringify({ error: "Código incorreto. Tente novamente." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Marcar como verificado
    await supabase
      .from("otp_codes")
      .update({ verified: true })
      .eq("email", rawEmail);

    // Criar ou atualizar usuário no Supabase Auth
    // Primeiro, tenta buscar usuário existente
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === rawEmail,
    );

    let userId: string;
    let session = null;

    if (existingUser) {
      userId = existingUser.id;
      // Gerar link de login para usuário existente
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: rawEmail,
      });

      if (linkError) {
        console.error("Erro ao gerar link:", linkError);
      } else if (linkData?.properties?.hashed_token) {
        // Verificar o token para criar sessão
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: linkData.properties.hashed_token,
          type: "magiclink",
        });

        if (!verifyError && verifyData.session) {
          session = verifyData.session;
        }
      }
    } else {
      // Criar novo usuário
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: rawEmail,
        email_confirm: true,
        user_metadata: {
          name: otpRecord.name || rawEmail.split("@")[0],
        },
      });

      if (createError) {
        console.error("Erro ao criar usuário:", createError);
        return new Response(
          JSON.stringify({ error: "Erro ao criar conta" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      userId = newUser.user.id;

      // Gerar link de login para o novo usuário
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: rawEmail,
      });

      if (!linkError && linkData?.properties?.hashed_token) {
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: linkData.properties.hashed_token,
          type: "magiclink",
        });

        if (!verifyError && verifyData.session) {
          session = verifyData.session;
        }
      }
    }

    // Limpar código usado
    await supabase
      .from("otp_codes")
      .delete()
      .eq("email", rawEmail);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Código verificado com sucesso!",
        user_id: userId,
        session: session,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Erro na função verify-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
};

serve(handler);
