import { supabase } from '../lib/supabase';
import { BriefingData, LandingPageContent, DesignSettings } from '../types';

/**
 * Interface para uma linha da tabela landing_pages
 */
export interface LandingPageRow {
  id: string;
  user_id: string;
  subdomain: string;
  custom_domain: string | null;
  slug: string;
  briefing_data: BriefingData;
  content_data: LandingPageContent;
  design_settings: DesignSettings;
  section_visibility: any;
  layout_variant: number;
  photo_url: string | null;
  about_photo_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string[] | null;
  og_image_url: string | null;
  schema_markup: any;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Verificar disponibilidade de subdomínio
 */
export async function checkSubdomainAvailability(
  subdomain: string
): Promise<{ available: boolean; error?: string }> {
  // Validação básica
  if (!/^[a-z0-9-]+$/.test(subdomain)) {
    return { 
      available: false, 
      error: 'Subdomínio pode conter apenas letras minúsculas, números e hífens' 
    };
  }

  if (subdomain.length < 3 || subdomain.length > 63) {
    return { 
      available: false, 
      error: 'Subdomínio deve ter entre 3 e 63 caracteres' 
    };
  }

  // Palavras reservadas
  const reserved = [
    'www', 'api', 'admin', 'app', 'mail', 'ftp', 'localhost',
    'test', 'staging', 'dev', 'development', 'production'
  ];
  
  if (reserved.includes(subdomain.toLowerCase())) {
    return { 
      available: false, 
      error: 'Este subdomínio está reservado' 
    };
  }

  // Verificar se já existe usando função SQL (permite verificação pública)
  try {
    const { data: result, error } = await supabase.rpc('check_subdomain_available', {
      check_subdomain: subdomain.toLowerCase()
    });

    if (error) {
      // Se a função não existir, tentar método direto (pode falhar com RLS)
      const { data: existing, error: queryError } = await supabase
        .from('landing_pages')
        .select('id')
        .eq('subdomain', subdomain.toLowerCase())
        .maybeSingle();

      if (queryError && queryError.code !== 'PGRST116' && queryError.code !== 'PGRST103') {
        return { 
          available: false, 
          error: 'Erro ao verificar disponibilidade' 
        };
      }

      // Se não encontrou (PGRST116 ou data null), está disponível
      return { available: !existing };
    }

    // Função retorna true se disponível, false se não
    return { available: result === true };
  } catch (err: any) {
    // Fallback: tentar método direto
    const { data: existing, error: queryError } = await supabase
      .from('landing_pages')
      .select('id')
      .eq('subdomain', subdomain.toLowerCase())
      .maybeSingle();

    if (queryError && queryError.code !== 'PGRST116' && queryError.code !== 'PGRST103') {
      return { 
        available: false, 
        error: 'Erro ao verificar disponibilidade' 
      };
    }

    return { available: !existing };
  }
}

/**
 * Gerar subdomínio a partir do nome
 */
export function generateSubdomain(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9-]/g, '-') // Substitui caracteres especiais por hífen
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, ''); // Remove hífens do início/fim
}

/**
 * Criar nova landing page
 */
export async function createLandingPage(data: {
  subdomain: string;
  briefing: BriefingData;
  content: LandingPageContent;
  design: DesignSettings;
  visibility: any;
  layoutVariant: number;
}): Promise<LandingPageRow> {
  // Verificar autenticação
  let { data: { user }, error: getUserError } = await supabase.auth.getUser();
  
  if (!user || !user.id) {
    // Tentar refresh da sessão
    await supabase.auth.refreshSession();
    const { data: { user: refreshedUser } } = await supabase.auth.getUser();
    
    if (!refreshedUser || !refreshedUser.id) {
      throw new Error('Usuário não autenticado. Por favor, faça login novamente.');
    }
    
    user = refreshedUser;
  }

  // Verificar sessão antes do insert
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    // Tentar refresh
    await supabase.auth.refreshSession();
    const { data: { session: newSession } } = await supabase.auth.getSession();
    
    if (!newSession) {
      throw new Error('Sessão não disponível. Por favor, faça login novamente.');
    }
  }

  // Verificar disponibilidade do subdomínio (já foi verificado no Step 2, mas verificamos novamente por segurança)
  const availability = await checkSubdomainAvailability(data.subdomain);
  if (!availability.available) {
    throw new Error(availability.error || 'Subdomínio não disponível');
  }

  // Gerar meta tags básicas
  const metaTitle = `${data.briefing.name} - ${data.briefing.specialty} | Agende sua consulta`;
  const metaDescription = data.content.subheadline || 
    `Dr(a). ${data.briefing.name}, especialista em ${data.briefing.specialty}. Agende sua consulta online.`;

  // Verificar novamente o usuário antes do insert (garantir que ainda está autenticado)
  const { data: { user: finalUser } } = await supabase.auth.getUser();
  if (!finalUser || !finalUser.id) {
    throw new Error('Usuário não autenticado. Por favor, faça login novamente.');
  }

  // Usar o usuário final (pode ter mudado entre verificações)
  const userIdToUse = finalUser.id;

  const insertData = {
    user_id: userIdToUse,
    subdomain: data.subdomain.toLowerCase(),
    slug: data.subdomain.toLowerCase(),
    briefing_data: data.briefing,
    content_data: data.content,
    design_settings: data.design,
    section_visibility: data.visibility,
    layout_variant: data.layoutVariant,
    status: 'draft', // Status inicial - rascunho, aguardando publicação pelo admin
    meta_title: metaTitle,
    meta_description: metaDescription,
    meta_keywords: [
      data.briefing.name,
      data.briefing.specialty,
      data.briefing.crmState,
      'médico',
      'consulta médica',
    ],
  };

  const { data: landingPage, error } = await supabase
    .from('landing_pages')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar landing page:', error);
    console.error('User ID usado:', userIdToUse);
    console.error('Insert data:', { ...insertData, briefing_data: '[OBJETO]', content_data: '[OBJETO]', design_settings: '[OBJETO]', section_visibility: '[OBJETO]' });
    throw new Error(error.message || 'Erro ao criar landing page');
  }

  // Verificar se a landing page foi criada corretamente com o user_id correto
  if (landingPage.user_id !== userIdToUse) {
    console.error('ERRO: Landing page criada com user_id diferente!', {
      expected: userIdToUse,
      actual: landingPage.user_id,
      landingPageId: landingPage.id
    });
    throw new Error('Erro ao criar landing page: user_id não corresponde');
  }
  
  return landingPage;
}

/**
 * Listar todas as landing pages do usuário atual
 */
export async function getMyLandingPages(): Promise<LandingPageRow[]> {
  // Verificar autenticação primeiro
  let { data: { user }, error: getUserError } = await supabase.auth.getUser();
  
  if (!user || !user.id) {
    // Tentar refresh da sessão
    console.log('getMyLandingPages: Usuário não autenticado, tentando refresh...');
    const { data: { session: refreshResult }, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error('Erro ao refresh da sessão no getMyLandingPages:', refreshError);
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!refreshResult) {
      console.error('Refresh da sessão retornou null no getMyLandingPages');
      throw new Error('Sessão inválida. Por favor, faça login novamente.');
    }
    
    // Aguardar um pouco após refresh
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verificar novamente após refresh
    const { data: { user: refreshedUser }, error: getUserError2 } = await supabase.auth.getUser();
    
    if (!refreshedUser || !refreshedUser.id) {
      console.error('Usuário ainda não autenticado após refresh no getMyLandingPages:', getUserError2);
      throw new Error('Não foi possível autenticar. Por favor, faça login novamente.');
    }
    
    user = refreshedUser;
    console.log('getMyLandingPages: Usuário autenticado após refresh:', user.id);
  } else {
    console.log('getMyLandingPages: Usuário já autenticado:', user.id);
  }

  const { data, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar landing pages:', error);
    throw error;
  }
  
  console.log('getMyLandingPages: Landing pages encontradas:', data?.length || 0);
  return data || [];
}

/**
 * Obter landing page por ID
 * Verifica se a landing page pertence ao usuário autenticado
 */
export async function getLandingPageById(id: string): Promise<LandingPageRow> {
  // Verificar autenticação primeiro
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();
  
  if (!user || !user.id) {
    throw new Error('Usuário não autenticado');
  }

  // Buscar landing page e verificar se pertence ao usuário
  const { data, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id) // Garantir que só retorna se pertencer ao usuário
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Nenhum resultado encontrado - pode não existir ou não pertencer ao usuário
      throw new Error('Landing page não encontrada ou não pertence ao usuário');
    }
    throw error;
  }

  // Verificação adicional (se RLS permitir retornar mesmo sem user_id match)
  if (data.user_id !== user.id) {
    throw new Error('Landing page não pertence ao usuário');
  }

  return data;
}

/**
 * Obter landing page por subdomínio (público - apenas páginas publicadas)
 */
export async function getLandingPageBySubdomain(
  subdomain: string
): Promise<LandingPageRow> {
  const { data, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('subdomain', subdomain.toLowerCase())
    .eq('status', 'published')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Atualizar landing page
 */
export async function updateLandingPage(
  id: string,
  updates: Partial<LandingPageRow>
): Promise<LandingPageRow> {
  const { data, error } = await supabase
    .from('landing_pages')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Publicar landing page
 */
export async function publishLandingPage(id: string): Promise<LandingPageRow> {
  return updateLandingPage(id, {
    status: 'published',
    published_at: new Date().toISOString(),
  });
}

/**
 * Despublicar landing page
 */
export async function unpublishLandingPage(id: string): Promise<LandingPageRow> {
  return updateLandingPage(id, {
    status: 'draft',
  });
}

/**
 * Deletar landing page
 */
export async function deleteLandingPage(id: string): Promise<void> {
  const { error } = await supabase
    .from('landing_pages')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
