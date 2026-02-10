import { supabase } from '../lib/supabase';
import { renderLandingPage } from '../api/render';

const BUCKET_NAME = 'landing-pages';
const HTML_FOLDER = 'html';

/**
 * Gerar e armazenar HTML estático para uma landing page
 * @param landingPageId - ID da landing page
 * @returns URL pública do HTML estático gerado
 */
export async function generateAndStoreStaticHTML(landingPageId: string): Promise<string> {
  try {
    console.log('[STATIC HTML] Iniciando geração de HTML estático para landing page:', landingPageId);

    // 1. Buscar dados completos da landing page
    const { data: landingPage, error: fetchError } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('id', landingPageId)
      .single();

    if (fetchError || !landingPage) {
      throw new Error(`Landing page não encontrada: ${fetchError?.message || 'Não encontrada'}`);
    }

    // 2. Verificar se status é 'published' (só gerar HTML para landing pages publicadas)
    if (landingPage.status !== 'published') {
      console.log('[STATIC HTML] Landing page não está publicada, pulando geração:', {
        landingPageId,
        status: landingPage.status
      });
      throw new Error(`Landing page não está publicada (status: ${landingPage.status})`);
    }

    console.log('[STATIC HTML] Dados da landing page encontrados:', {
      subdomain: landingPage.subdomain,
      status: landingPage.status,
      hasBriefing: !!landingPage.briefing_data,
      hasContent: !!landingPage.content_data
    });

    // 3. Criar objeto req mock para renderLandingPage
    const mockReq = {
      protocol: 'https',
      get: (header: string) => {
        if (header === 'host') {
          return `${landingPage.subdomain}.docpage.com.br`;
        }
        return '';
      },
      headers: {} as Record<string, string>
    };

    // 4. Gerar HTML usando renderLandingPage
    console.log('[STATIC HTML] Gerando HTML...');
    const html = await renderLandingPage(landingPage, mockReq);

    if (!html || html.length === 0) {
      throw new Error('HTML gerado está vazio');
    }

    console.log('[STATIC HTML] HTML gerado com sucesso:', {
      htmlLength: html.length,
      subdomain: landingPage.subdomain
    });

    // 5. Converter HTML para Blob/File
    const htmlBlob = new Blob([html], { type: 'text/html; charset=utf-8' });
    const htmlFile = new File([htmlBlob], `${landingPage.subdomain}.html`, {
      type: 'text/html; charset=utf-8'
    });

    // 6. Upload para Supabase Storage
    const filePath = `${HTML_FOLDER}/${landingPage.subdomain}.html`;
    
    console.log('[STATIC HTML] Fazendo upload para Storage:', {
      bucket: BUCKET_NAME,
      path: filePath
    });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, htmlFile, {
        upsert: true, // Substituir se já existir
        contentType: 'text/html; charset=utf-8',
        cacheControl: '3600' // Cache de 1 hora
      });

    if (uploadError) {
      console.error('[STATIC HTML] Erro ao fazer upload:', uploadError);
      throw new Error(`Erro ao fazer upload do HTML: ${uploadError.message}`);
    }

    // 7. Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    console.log('[STATIC HTML] HTML estático gerado e armazenado com sucesso:', {
      landingPageId,
      subdomain: landingPage.subdomain,
      publicUrl,
      filePath
    });

    return publicUrl;
  } catch (error: any) {
    console.error('[STATIC HTML] Erro ao gerar HTML estático:', error);
    throw error;
  }
}

/**
 * Verificar se HTML estático existe para um subdomínio
 * @param subdomain - Subdomínio da landing page
 * @returns URL pública do HTML estático ou null se não existir
 */
export async function getStaticHTMLUrl(subdomain: string): Promise<string | null> {
  try {
    const filePath = `${HTML_FOLDER}/${subdomain}.html`;
    
    // Verificar se arquivo existe listando o diretório
    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(HTML_FOLDER, {
        search: `${subdomain}.html`
      });

    if (error) {
      console.error('[STATIC HTML] Erro ao verificar HTML estático:', error);
      return null;
    }

    if (!files || files.length === 0) {
      return null;
    }

    // Retornar URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error: any) {
    console.error('[STATIC HTML] Erro ao obter URL do HTML estático:', error);
    return null;
  }
}

/**
 * Deletar HTML estático de uma landing page
 * @param subdomain - Subdomínio da landing page
 */
export async function deleteStaticHTML(subdomain: string): Promise<void> {
  try {
    const filePath = `${HTML_FOLDER}/${subdomain}.html`;
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('[STATIC HTML] Erro ao deletar HTML estático:', error);
      throw new Error(`Erro ao deletar HTML estático: ${error.message}`);
    }

    console.log('[STATIC HTML] HTML estático deletado:', subdomain);
  } catch (error: any) {
    console.error('[STATIC HTML] Erro ao deletar HTML estático:', error);
    throw error;
  }
}
