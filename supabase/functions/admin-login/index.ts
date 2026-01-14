// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// @ts-ignore
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Admin credentials are now provided via environment variables (ADMIN_EMAIL / ADMIN_PASSWORD)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { email, password } = await req.json();

    const inputEmail = (email || '').trim().toLowerCase();
    const inputPassword = (password || '').trim();

    const ADMIN_EMAIL = (Deno.env.get('ADMIN_EMAIL') || '').trim().toLowerCase();
    const ADMIN_PASSWORD = (Deno.env.get('ADMIN_PASSWORD') || '').trim();

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error('Admin credentials not configured in environment variables');
      return new Response(
        JSON.stringify({ error: 'Admin não configurado. Contate o suporte.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Basic email validation to avoid obvious abuse
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inputEmail)) {
      return new Response(
        JSON.stringify({ error: 'Formato de email inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Validate admin credentials with small delay on failure to slow brute-force
    if (inputEmail !== ADMIN_EMAIL || inputPassword !== ADMIN_PASSWORD) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return new Response(
        JSON.stringify({ error: 'Credenciais inválidas' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Check if admin user exists in auth.users
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    let adminUser = existingUsers?.users?.find(u => u.email === ADMIN_EMAIL)
    
    if (!adminUser) {
      // Create admin user if doesn't exist
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { name: 'Administrador', is_admin: true }
      })
      
      if (createError) {
        console.error('Error creating admin user:', createError)
        return new Response(
          JSON.stringify({ error: 'Erro ao criar usuário admin' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      adminUser = newUser.user
      
      // Add admin role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: adminUser.id, role: 'admin' })
      
      if (roleError) {
        console.error('Error creating admin role:', roleError)
      }
    }
    
    // Check if user has admin role
    const { data: roleData, error: roleCheckError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id)
      .eq('role', 'admin')
      .single()
    
    if (!roleData) {
      // Add admin role if missing
      await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: adminUser.id, role: 'admin' })
    }

    // Generate session for admin user
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: ADMIN_EMAIL,
    })
    
    if (signInError) {
      console.error('Error generating session:', signInError)
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar sessão' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sign in the admin user to get a session
    const { data: session, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    })
    
    if (sessionError) {
      console.error('Error signing in admin:', sessionError)
      return new Response(
        JSON.stringify({ error: 'Erro ao autenticar admin' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        session: session.session,
        user: session.user,
        isAdmin: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Admin login error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
