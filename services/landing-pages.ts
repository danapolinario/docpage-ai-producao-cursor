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
 * Verificar disponibilidade de domínio usando RDAP do Registro.br
 */
export async function checkDomainAvailability(
  domain: string
): Promise<{ available: boolean; error?: string; fullDomain?: string }> {
  // Validação básica
  const domainName = domain.toLowerCase().trim();
  
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(domainName)) {
    return { 
      available: false, 
      error: 'Formato de domínio inválido. Use apenas letras, números e hífens.' 
    };
  }

  if (domainName.length < 2 || domainName.length > 63) {
    return { 
      available: false, 
      error: 'Domínio deve ter entre 2 e 63 caracteres.' 
    };
  }

  // Palavras reservadas
  const reserved = [
    'www', 'api', 'admin', 'app', 'mail', 'ftp', 'localhost',
    'test', 'staging', 'dev', 'development', 'production'
  ];
  
  if (reserved.includes(domainName)) {
    return { 
      available: false, 
      error: 'Este domínio está reservado' 
    };
  }

  try {
    // Chamar Edge Function para verificar via RDAP
    const { data, error } = await supabase.functions.invoke('check-domain-rdap', {
      body: { domain: domainName }
    });

    if (error) {
      console.error('Erro ao chamar check-domain-rdap:', error);
      return { 
        available: false, 
        error: 'Erro ao verificar disponibilidade. Tente novamente.' 
      };
    }

    return {
      available: data.available === true,
      error: data.error,
      fullDomain: data.fullDomain
    };
  } catch (err: any) {
    console.error('Erro ao verificar domínio:', err);
    return { 
      available: false, 
      error: 'Erro ao verificar disponibilidade. Tente novamente.' 
    };
  }
}

/**
 * Verificar disponibilidade de subdomínio (uso interno - verifica na tabela landing_pages)
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

  // Verificar se já existe usando função SQL
  try {
    const { data: result, error } = await supabase.rpc('check_subdomain_available', {
      check_subdomain: subdomain.toLowerCase()
    });

    if (error) {
      const { data: existing } = await supabase
        .from('landing_pages')
        .select('id')
        .eq('subdomain', subdomain.toLowerCase())
        .maybeSingle();

      return { available: !existing };
    }

    return { available: result === true };
  } catch (err: any) {
    return { 
      available: false, 
      error: 'Erro ao verificar disponibilidade' 
    };
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

  // Verificar se publicação automática está habilitada
  let initialStatus: 'draft' | 'published' = 'draft';
  let shouldAutoPublish = false;
  
  try {
    const { getAutoPublishSetting } = await import('./admin');
    shouldAutoPublish = await getAutoPublishSetting();
    console.log('Configuração de publicação automática:', {
      enabled: shouldAutoPublish,
      userId: userIdToUse
    });
    
    if (shouldAutoPublish) {
      initialStatus = 'published';
      console.log('Publicação automática habilitada - criando landing page com status "published"');
    } else {
      console.log('Publicação automática desabilitada - criando landing page com status "draft"');
    }
  } catch (error: any) {
    console.error('Erro ao verificar configuração de publicação automática:', error);
    console.error('Detalhes do erro:', {
      message: error?.message,
      error: error
    });
    // Em caso de erro, manter status 'draft' (padrão seguro)
    console.warn('Usando padrão (draft) devido ao erro na verificação');
  }

  console.log('Criando landing page com os seguintes dados:', {
    subdomain: data.subdomain.toLowerCase(),
    status: initialStatus,
    shouldAutoPublish,
    published_at: shouldAutoPublish ? new Date().toISOString() : null
  });

  const insertData = {
    user_id: userIdToUse,
    subdomain: data.subdomain.toLowerCase(),
    slug: data.subdomain.toLowerCase(),
    briefing_data: data.briefing,
    content_data: data.content,
    design_settings: data.design,
    section_visibility: data.visibility,
    layout_variant: data.layoutVariant,
    status: initialStatus,
    published_at: shouldAutoPublish ? new Date().toISOString() : null,
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

  console.log('Landing page criada com sucesso:', {
    id: landingPage.id,
    subdomain: landingPage.subdomain,
    status: landingPage.status,
    published_at: landingPage.published_at,
    expectedStatus: initialStatus
  });

  // Verificar se a landing page foi criada corretamente com o user_id correto
  if (landingPage.user_id !== userIdToUse) {
    console.error('ERRO: Landing page criada com user_id diferente!', {
      expected: userIdToUse,
      actual: landingPage.user_id,
      landingPageId: landingPage.id
    });
    throw new Error('Erro ao criar landing page: user_id não corresponde');
  }

  // Verificar se o status foi aplicado corretamente
  if (landingPage.status !== initialStatus) {
    console.warn('ATENÇÃO: Status da landing page diferente do esperado:', {
      expected: initialStatus,
      actual: landingPage.status,
      landingPageId: landingPage.id
    });
  }

  // Se foi criada como 'published', enviar email de notificação
  if (shouldAutoPublish && landingPage.status === 'published') {
    try {
      console.log('Enviando email de notificação de publicação para landing page:', landingPage.id);
      const FUNCTIONS_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
      const notifyResponse = await fetch(`${FUNCTIONS_BASE_URL}/notify-site-published`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ landingPageId: landingPage.id }),
      });
      
      const notifyData = await notifyResponse.json();
      
      if (!notifyResponse.ok) {
        console.error('Erro ao enviar email de notificação:', {
          status: notifyResponse.status,
          statusText: notifyResponse.statusText,
          error: notifyData.error || notifyData,
        });
      } else {
        console.log('Email de publicação enviado com sucesso:', {
          landingPageId: landingPage.id,
          response: notifyData,
        });
      }
    } catch (notifyError: any) {
      console.error('Erro ao enviar email de notificação de publicação:', {
        landingPageId: landingPage.id,
        error: notifyError.message || notifyError,
        stack: notifyError.stack,
      });
      // Não lançar erro aqui para não quebrar o fluxo de criação
    }
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
 * Gerar OG Image para compartilhamento em redes sociais
 */
export async function generateOGImage(
  briefing: BriefingData,
  subdomain: string,
  photoUrl?: string | null
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-og-image', {
      body: {
        name: briefing.name,
        specialty: briefing.specialty,
        crm: briefing.crm,
        crmState: briefing.crmState,
        photoUrl: photoUrl,
        subdomain: subdomain
      }
    });

    if (error) {
      console.error('Erro ao gerar OG image:', error);
      return null;
    }

    return data.imageUrl || null;
  } catch (err) {
    console.error('Erro ao chamar generate-og-image:', err);
    return null;
  }
}

/**
 * Gerar Schema.org markup para médico
 */
export function generateSchemaMarkup(
  briefing: BriefingData,
  content: LandingPageContent,
  subdomain: string,
  photoUrl?: string | null
): object {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://docpage.com.br';
  const pageUrl = `${baseUrl}/${subdomain}`;
  
  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    "name": briefing.name,
    "description": content.subheadline || `Especialista em ${briefing.specialty}`,
    "image": photoUrl || undefined,
    "url": pageUrl,
    "medicalSpecialty": {
      "@type": "MedicalSpecialty",
      "name": briefing.specialty
    },
    "telephone": briefing.contactPhone || content.contactPhone,
    "email": briefing.contactEmail || content.contactEmail,
    "address": briefing.addresses?.length > 0 ? {
      "@type": "PostalAddress",
      "streetAddress": briefing.addresses[0],
      "addressCountry": "BR"
    } : undefined,
    "identifier": {
      "@type": "PropertyValue",
      "name": "CRM",
      "value": `${briefing.crm}/${briefing.crmState}`
    },
    "priceRange": "$$",
    "areaServed": {
      "@type": "State",
      "name": briefing.crmState
    },
    "availableService": content.services?.map(service => ({
      "@type": "MedicalProcedure",
      "name": service.title,
      "description": service.description
    })),
    "review": content.testimonials?.map(testimonial => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": testimonial.name
      },
      "reviewBody": testimonial.text,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5"
      }
    })),
    "potentialAction": {
      "@type": "ReserveAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": pageUrl,
        "actionPlatform": [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform"
        ]
      },
      "result": {
        "@type": "Reservation",
        "name": "Consulta Médica"
      }
    }
  };
}

/**
 * Gerar metadados SEO otimizados
 */
export function generateSEOMetadata(
  briefing: BriefingData,
  content: LandingPageContent
): { title: string; description: string; keywords: string[] } {
  // Title otimizado (máximo 60 caracteres para Google)
  const baseTitle = `${briefing.name} - ${briefing.specialty}`;
  const title = baseTitle.length > 50 
    ? `${baseTitle.substring(0, 47)}...` 
    : `${baseTitle} | Agende`;
  
  // Description otimizada (máximo 160 caracteres)
  const rawDescription = content.subheadline || 
    `Dr(a). ${briefing.name}, especialista em ${briefing.specialty}. CRM/${briefing.crmState} ${briefing.crm}. Agende sua consulta online.`;
  const description = rawDescription.length > 160 
    ? rawDescription.substring(0, 157) + '...' 
    : rawDescription;
  
  // Keywords relevantes
  const keywords = [
    briefing.name,
    briefing.specialty,
    `médico ${briefing.specialty.toLowerCase()}`,
    `${briefing.specialty.toLowerCase()} ${briefing.crmState}`,
    'consulta médica',
    'agendar consulta',
    'médico online',
    `CRM ${briefing.crmState}`,
    ...(briefing.mainServices?.split(',').map(s => s.trim()) || []),
    ...(briefing.addresses?.map(addr => {
      // Extrair cidade do endereço
      const parts = addr.split(',');
      return parts.length > 1 ? parts[parts.length - 1].trim().split('-')[0].trim() : '';
    }).filter(Boolean) || [])
  ].filter((k, i, arr) => k && arr.indexOf(k) === i); // Remove duplicatas e vazios
  
  return { title, description, keywords };
}

/**
 * Publicar landing page com geração de SEO completo
 */
export async function publishLandingPage(id: string): Promise<LandingPageRow> {
  // Primeiro, buscar dados atuais da landing page para gerar SEO
  const { data: currentPage, error: fetchError } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('id', id)
    .single();
  
  if (fetchError || !currentPage) {
    throw new Error('Landing page não encontrada');
  }
  
  // Gerar metadados SEO
  const seoMeta = generateSEOMetadata(
    currentPage.briefing_data as BriefingData,
    currentPage.content_data as LandingPageContent
  );
  
  // Gerar Schema.org markup
  const schemaMarkup = generateSchemaMarkup(
    currentPage.briefing_data as BriefingData,
    currentPage.content_data as LandingPageContent,
    currentPage.subdomain,
    currentPage.photo_url
  );
  
  // Tentar gerar OG image (não bloqueia publicação se falhar)
  let ogImageUrl = currentPage.og_image_url;
  if (!ogImageUrl) {
    try {
      ogImageUrl = await generateOGImage(
        currentPage.briefing_data as BriefingData,
        currentPage.subdomain,
        currentPage.photo_url
      );
    } catch (err) {
      console.warn('Não foi possível gerar OG image, continuando sem ela:', err);
    }
  }
  
  return updateLandingPage(id, {
    status: 'published',
    published_at: new Date().toISOString(),
    meta_title: seoMeta.title,
    meta_description: seoMeta.description,
    meta_keywords: seoMeta.keywords,
    schema_markup: schemaMarkup,
    og_image_url: ogImageUrl,
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
