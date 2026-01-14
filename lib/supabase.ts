import { createClient } from '@supabase/supabase-js';

// Lovable Cloud runtime config (publishable values). Use environment variables
// provided by the platform so the app always talks to the correct backend.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Configuração do backend ausente. Verifique as variáveis de ambiente.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
