import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
  };
}

const FUNCTIONS_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

/**
 * Enviar código OTP para o email via backend
 */
export async function sendOTP(email: string, name?: string) {
  const response = await fetch(`${FUNCTIONS_BASE_URL}/send-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, name }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Erro ao enviar código');
  }
  
  return data;
}

/**
 * Verificar código OTP via Edge Function customizada
 */
export async function verifyOTP(email: string, token: string) {
  const response = await fetch(`${FUNCTIONS_BASE_URL}/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, code: token }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Erro ao verificar código');
  }
  
  // Se a sessão foi retornada, setar no cliente Supabase
  if (data.session) {
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  }
  
  return data;
}

/**
 * Reenviar código OTP
 */
export async function resendOTP(email: string) {
  return sendOTP(email);
}

/**
 * Registrar novo usuário (agora usa OTP)
 * Envia código para email
 */
export async function signUp(
  email: string,
  name?: string
) {
  // Com OTP, signUp apenas envia o código
  // O usuário será criado quando verificar o código
  return sendOTP(email, name);
}

/**
 * Login com OTP (enviar código)
 * Para login e cadastro, o fluxo é o mesmo: enviar código
 */
export async function signIn(email: string) {
  // Com OTP, signIn apenas envia o código
  return sendOTP(email);
}

/**
 * Verificar código e autenticar (comum para login e cadastro)
 */
export async function verifyCode(email: string, code: string) {
  return verifyOTP(email, code);
}

/**
 * Logout
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Obter usuário atual
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Verificar se está autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

/**
 * Observar mudanças de autenticação
 * Útil para atualizar UI quando usuário faz login/logout
 */
export function onAuthStateChange(
  callback: (user: User | null) => void
) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
}

/**
 * Obter sessão atual
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
