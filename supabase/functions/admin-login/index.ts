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
  console.log('admin-login: Request recebido', {
    method: req.method,
    url: req.url,
    hasBody: !!req.body
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Validar método HTTP
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método não permitido. Use POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('admin-login: Variáveis de ambiente não configuradas', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      });
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Fazer parse do body com tratamento de erro
    let body: any = {};
    try {
      body = await req.json();
    } catch (parseError: any) {
      console.error('admin-login: Erro ao fazer parse do body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Body inválido ou malformado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { email, password } = body;

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
    // Buscar usuário pelo email
    let adminUser = null;
    try {
      console.log('admin-login: Buscando usuário admin...', { email: ADMIN_EMAIL });
      const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error('admin-login: Erro ao listar usuários:', {
          error: listError.message,
          name: listError.name
        });
        // Se for erro de timeout ou muitos usuários, continuar sem buscar
        // O usuário será encontrado ou criado no próximo passo
        if (listError.message?.includes('timeout') || listError.message?.includes('Too many')) {
          console.warn('admin-login: Timeout ou muitos usuários, pulando busca. Tentando criar/buscar usuário diretamente.');
        }
      } else if (usersData && usersData.users) {
        adminUser = usersData.users.find((u: any) => u.email?.toLowerCase() === ADMIN_EMAIL);
        console.log('admin-login: Resultado da busca:', { 
          found: !!adminUser, 
          userId: adminUser?.id,
          totalUsers: usersData.users.length 
        });
      }
    } catch (listError: any) {
      console.error('admin-login: Exceção ao buscar usuário admin:', {
        error: listError.message,
        name: listError.name,
        stack: listError.stack
      });
      // Continuar - o usuário será encontrado ou criado no próximo passo
    }
    
    if (!adminUser) {
      console.log('admin-login: Usuário admin não encontrado na busca, tentando criar...');
      // Create admin user if doesn't exist
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { name: 'Administrador', is_admin: true }
      })
      
      if (createError) {
        // Se o erro for que o usuário já existe (422), continuar o fluxo
        // O usuário existe, então podemos tentar fazer login diretamente
        // Não precisamos do objeto adminUser para fazer login
        if (createError.status === 422 && createError.message?.includes('already been registered')) {
          console.log('admin-login: Usuário já existe (erro 422). Continuando com login direto sem buscar usuário...');
          // Não retornar erro - vamos tentar fazer login diretamente
          // O signInWithPassword vai funcionar e retornar o user na sessão
        } else {
          // Outro tipo de erro
          console.error('admin-login: Erro ao criar usuário admin:', {
            error: createError.message,
            status: createError.status,
            name: createError.name
          });
          return new Response(
            JSON.stringify({ 
              error: 'Erro ao criar usuário admin',
              details: createError.message 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } else if (newUser && newUser.user) {
        // Usuário criado com sucesso
        adminUser = newUser.user
        console.log('admin-login: Usuário admin criado com sucesso:', { userId: adminUser.id });
      }
      
      // Se temos adminUser (criado ou encontrado), adicionar role admin
      if (adminUser) {
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: adminUser.id, role: 'admin' })
        
        if (roleError) {
          console.error('admin-login: Erro ao criar role admin:', {
            error: roleError.message,
            code: roleError.code,
            details: roleError.details
          });
          // Não falhar aqui - a role pode já existir ou ser adicionada depois
        } else {
          console.log('admin-login: Role admin criada com sucesso');
        }
      } else {
        console.warn('admin-login: adminUser não disponível para adicionar role. A role será verificada/adicionada após login.');
      }
    }

    // Sign in the admin user to get a session
    // Se não temos adminUser (porque o usuário já existe mas não foi encontrado na busca),
    // vamos fazer login diretamente e obter o user da sessão
    console.log('admin-login: Tentando fazer login do usuário admin...', {
      email: ADMIN_EMAIL,
      userId: adminUser?.id,
      hasAdminUser: !!adminUser
    });
    
    const { data: session, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    })
    
    // Se o login foi bem-sucedido mas não tínhamos adminUser, usar o user da sessão
    if (session && session.user && !adminUser) {
      adminUser = session.user;
      console.log('admin-login: Usuário obtido da sessão:', { userId: adminUser.id });
      
      // Agora que temos o adminUser, verificar e adicionar role admin se necessário
      const { data: roleData, error: roleCheckError } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', adminUser.id)
        .eq('role', 'admin')
        .maybeSingle()
      
      if (!roleData) {
        console.log('admin-login: Role admin não encontrada para usuário da sessão, adicionando...');
        const { error: insertRoleError } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: adminUser.id, role: 'admin' })
        
        if (insertRoleError) {
          console.error('admin-login: Erro ao inserir role admin para usuário da sessão:', {
            error: insertRoleError.message,
            code: insertRoleError.code
          });
        } else {
          console.log('admin-login: Role admin adicionada com sucesso para usuário da sessão');
        }
      } else {
        console.log('admin-login: Usuário da sessão já possui role admin');
      }
    }
    
    if (sessionError) {
      console.error('admin-login: Erro ao fazer login:', {
        error: sessionError.message,
        status: sessionError.status,
        name: sessionError.name
      });
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao autenticar admin',
          details: sessionError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!session || !session.session) {
      console.error('admin-login: Sessão não retornada após login');
      return new Response(
        JSON.stringify({ error: 'Erro ao criar sessão de autenticação' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('admin-login: Login bem-sucedido', {
      userId: session.user?.id,
      email: session.user?.email
    });

    return new Response(
      JSON.stringify({
        success: true,
        session: session.session,
        user: session.user,
        isAdmin: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('admin-login: Erro inesperado:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      error: error
    });
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error?.message || 'Erro desconhecido'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
