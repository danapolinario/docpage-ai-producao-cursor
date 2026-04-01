import { supabase } from '../lib/supabase';
import type { AppState, LeadData, LeadProgressPayload } from '../types';

export type LeadStatus =
  | 'lead_captured'
  | 'briefing_started'
  | 'content_generated'
  | 'photo_uploaded'
  | 'visual_configured'
  | 'editor_completed'
  | 'checkout_started'
  | 'subscription_completed';

export interface CreateLeadInput {
  name: string;
  email: string;
  whatsapp?: string;
  marketingConsent: boolean;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

/** E-mail único em `leads`; UI pode redirecionar para login com esta mensagem. */
export const DUPLICATE_LEAD_EMAIL_MESSAGE =
  'Este e-mail já foi cadastrado. Faça login ou use outro e-mail.';

export interface LeadRow {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  marketing_consent: boolean;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  status: LeadStatus;
  user_id: string | null;
  landing_page_id: string | null;
  progress_data: LeadProgressPayload | null;
  resume_token: string;
  created_at: string;
  updated_at: string;
}

const DATA_URL_PREFIX = 'data:';

/** Remove data URLs do payload para não inflar progress_data na BD. */
export function buildLeadProgressPayload(
  state: AppState,
  pricingViewMode: 'plans' | 'checkout' | 'success' | 'dashboard'
): LeadProgressPayload {
  const stripDataUrl = (url: string | null): string | null =>
    url && url.startsWith(DATA_URL_PREFIX) ? null : url;

  return {
    step: state.step,
    briefing: state.briefing,
    theme: state.theme,
    designSettings: state.designSettings,
    sectionVisibility: state.sectionVisibility,
    layoutVariant: state.layoutVariant,
    photoUrl: stripDataUrl(state.photoUrl),
    aboutPhotoUrl: stripDataUrl(state.aboutPhotoUrl),
    isPhotoAIEnhanced: state.isPhotoAIEnhanced,
    generatedContent: state.generatedContent,
    modificationsLeft: state.modificationsLeft,
    pricingViewMode,
  };
}

export function clearLeadResumeLocalStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('lead_resume_token');
  localStorage.removeItem('lead_id');
  localStorage.removeItem('lead_data');
}

export async function getLeadByResumeToken(token: string): Promise<LeadRow | null> {
  const { data, error } = await supabase.rpc('get_lead_by_resume_token', {
    token_input: token,
  });

  if (error) {
    throw new Error(error.message || 'Erro ao retomar lead');
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return row as LeadRow;
}

/** Após login: lead cujo e-mail em `leads` coincide com `auth.users` (sessão atual). */
export async function getLeadForFunnelResume(): Promise<LeadRow | null> {
  const { data, error } = await supabase.rpc('get_lead_for_funnel_resume');

  if (error) {
    console.warn('getLeadForFunnelResume:', error.message);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  return row ? (row as LeadRow) : null;
}

export function leadRowToLeadData(row: LeadRow): LeadData {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    whatsapp: row.whatsapp || undefined,
    marketingConsent: row.marketing_consent,
    resumeToken: row.resume_token,
  };
}

export async function updateLeadProgress(
  resumeToken: string,
  payload: LeadProgressPayload
): Promise<void> {
  const { error } = await supabase.rpc('update_lead_funnel_by_token', {
    token_input: resumeToken,
    p_progress: payload as unknown as Record<string, unknown>,
    p_status: null,
  });

  if (error) {
    console.error('Erro ao persistir progresso do lead:', error);
    throw new Error(error.message || 'Erro ao persistir progresso');
  }
}

/**
 * Cria um novo lead na tabela leads (via RPC SECURITY DEFINER).
 * Insert direto + .select() falha com RLS: leads anónimos têm user_id NULL e a política
 * de SELECT exige auth.uid() = user_id, impossibilitando ler a linha recém-inserida.
 */
export async function createLead(data: CreateLeadInput): Promise<{ id: string; data: LeadRow }> {
  const { data: raw, error } = await supabase.rpc('create_lead_public', {
    p_name: data.name,
    p_email: data.email,
    p_whatsapp: data.whatsapp?.trim() || null,
    p_marketing_consent: data.marketingConsent,
    p_terms_accepted: data.termsAccepted,
    p_privacy_accepted: data.privacyAccepted,
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error(DUPLICATE_LEAD_EMAIL_MESSAGE);
    }
    throw new Error(error.message || 'Erro ao criar lead');
  }

  const row = (Array.isArray(raw) ? raw[0] : raw) as LeadRow | undefined;
  if (!row?.id) {
    throw new Error('Resposta inválida ao criar lead');
  }

  return { id: row.id, data: row };
}

/**
 * Atualiza o status do lead.
 */
export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
  resumeToken?: string | null
): Promise<void> {
  if (resumeToken) {
    const { error } = await supabase.rpc('update_lead_funnel_by_token', {
      token_input: resumeToken,
      p_progress: null,
      p_status: status,
    });

    if (error) {
      console.error('Erro ao atualizar status do lead:', error);
      throw new Error(error.message || 'Erro ao atualizar status');
    }
    return;
  }

  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', leadId);

  if (error) {
    console.error('Erro ao atualizar status do lead:', error);
    throw new Error(error.message || 'Erro ao atualizar status');
  }
}

/**
 * Associa o lead ao usuário após login.
 */
export async function linkLeadToUser(
  leadId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update({ user_id: userId })
    .eq('id', leadId);

  if (error) {
    console.error('Erro ao vincular lead ao usuário:', error);
    throw new Error(error.message || 'Erro ao vincular lead');
  }
}

/**
 * Associa o lead à landing page criada.
 */
export async function linkLeadToLandingPage(
  leadId: string,
  landingPageId: string
): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update({ landing_page_id: landingPageId })
    .eq('id', leadId);

  if (error) {
    console.error('Erro ao vincular lead à landing page:', error);
    throw new Error(error.message || 'Erro ao vincular lead');
  }
}
