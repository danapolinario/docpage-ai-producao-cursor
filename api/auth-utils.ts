import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

interface AuthResult {
  userId: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

/**
 * Verificar autenticação a partir de cookies ou headers
 * Extrai a sessão do Supabase dos cookies ou headers Authorization
 */
export async function verifyAuthFromRequest(
  cookies?: string | Record<string, string>,
  authHeader?: string
): Promise<AuthResult> {
  try {
    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Tentar extrair token de autenticação
    let accessToken: string | null = null;
    let refreshToken: string | null = null;

    // 1. Tentar extrair do header Authorization
    if (authHeader) {
      const match = authHeader.match(/Bearer\s+(.+)/);
      if (match) {
        accessToken = match[1];
      }
    }

    // 2. Tentar extrair dos cookies
    if (!accessToken && cookies) {
      const cookieString = typeof cookies === 'string' ? cookies : 
        Object.entries(cookies)
          .map(([key, value]) => `${key}=${value}`)
          .join('; ');

      // Supabase pode armazenar tokens em diferentes formatos de cookies
      // Formato 1: sb-{project-ref}-auth-token (JSON com access_token e refresh_token)
      const cookieMatch = cookieString.match(/(?:^|;\s*)sb-[^=]+-auth-token=([^;]+)/);
      if (cookieMatch) {
        try {
          const decoded = decodeURIComponent(cookieMatch[1]);
          // Tentar parsear como JSON
          const tokenData = JSON.parse(decoded);
          accessToken = tokenData.access_token || tokenData.accessToken;
          refreshToken = tokenData.refresh_token || tokenData.refreshToken;
        } catch {
          // Se não for JSON, pode ser apenas o access token
          accessToken = decodeURIComponent(cookieMatch[1]);
        }
      }

      // Formato 2: Cookies individuais sb-{project-ref}-auth-token-access-token e refresh-token
      const accessTokenMatch = cookieString.match(/(?:^|;\s*)sb-[^=]+-auth-token-access-token=([^;]+)/);
      const refreshTokenMatch = cookieString.match(/(?:^|;\s*)sb-[^=]+-auth-token-refresh-token=([^;]+)/);
      
      if (accessTokenMatch) {
        accessToken = decodeURIComponent(accessTokenMatch[1]);
      }
      if (refreshTokenMatch) {
        refreshToken = decodeURIComponent(refreshTokenMatch[1]);
      }

      // Formato 3: Tentar usar a sessão diretamente se disponível
      // O Supabase pode ter uma sessão armazenada que podemos usar
      if (!accessToken && refreshToken) {
        // Tentar usar refresh token para obter nova sessão
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession({
            refresh_token: refreshToken
          });
          if (!sessionError && sessionData?.session?.access_token) {
            accessToken = sessionData.session.access_token;
          }
        } catch (refreshError) {
          // Ignorar erro de refresh
        }
      }
    }

    // Se não encontrou token, retornar não autenticado
    if (!accessToken) {
      return {
        userId: null,
        isAdmin: false,
        isAuthenticated: false,
      };
    }

    // Verificar sessão com o token
    // Usar getUser diretamente com o accessToken
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return {
        userId: null,
        isAdmin: false,
        isAuthenticated: false,
      };
    }

    // Verificar se é admin
    let isAdmin = false;
    try {
      // Usar service role key para verificar admin (bypass RLS)
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
      if (serviceRoleKey) {
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });

        const { data: adminData, error: adminError } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (!adminError && adminData) {
          isAdmin = true;
        }
      }
    } catch (adminError) {
      console.error('Error checking admin status:', adminError);
      // Continuar sem permissão de admin se houver erro
    }

    return {
      userId: user.id,
      isAdmin,
      isAuthenticated: true,
    };
  } catch (error: any) {
    console.error('Error verifying auth:', error);
    return {
      userId: null,
      isAdmin: false,
      isAuthenticated: false,
    };
  }
}
