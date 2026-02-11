/**
 * Script para migrar fotos base64 para Supabase Storage
 * 
 * Este script:
 * 1. Busca todas as landing pages com fotos em base64
 * 2. Converte base64 para arquivo
 * 3. Faz upload para Supabase Storage
 * 4. Atualiza o banco de dados com as URLs do Storage
 * 
 * Uso:
 *   npm run migrate:photos -- drlazaronitest
 *   npm run migrate:photos -- all
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Carregar variáveis de ambiente do arquivo .env.local se existir
try {
  const envPath = join(process.cwd(), '.env.local');
  if (existsSync(envPath)) {
    const envFile = readFileSync(envPath, 'utf-8');
    const envLines = envFile.split('\n');
    
    for (const line of envLines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  }
} catch (error: any) {
  // Ignorar se .env.local não existir
}

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  '';

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = 'landing-pages';

/**
 * Extrair dados de base64 (Node.js)
 */
function extractBase64Data(base64Data: string): { buffer: Buffer; mimeType: string } {
  // Extrair mime type e dados
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Formato base64 inválido');
  }

  const mimeType = matches[1];
  const base64String = matches[2];
  
  // Em Node.js, usar Buffer para decodificar base64
  const buffer = Buffer.from(base64String, 'base64');
  
  return { buffer, mimeType };
}

/**
 * Fazer upload de foto base64 para Storage
 */
async function uploadBase64ToStorage(
  base64Data: string,
  landingPageId: string,
  type: 'profile' | 'about'
): Promise<string> {
  try {
    // Determinar extensão do arquivo baseado no mime type
    const mimeTypeMatch = base64Data.match(/^data:([A-Za-z-+\/]+);base64/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
    
    const filename = `${type}-${Date.now()}.${ext}`;
    const filePath = `${landingPageId}/${filename}`;
    
    // Extrair dados do base64
    const { buffer, mimeType: extractedMimeType } = extractBase64Data(base64Data);
    const finalMimeType = mimeType || extractedMimeType;
    
    console.log(`   📤 Fazendo upload de ${type} (${(buffer.length / 1024).toFixed(2)} KB)...`);
    
    // Upload para Storage (Supabase aceita Buffer diretamente)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        upsert: true,
        contentType: finalMimeType,
        cacheControl: '3600',
      });
    
    if (uploadError) {
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }
    
    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
    
    console.log(`   ✅ Upload concluído: ${publicUrl.substring(0, 80)}...`);
    
    return publicUrl;
  } catch (error: any) {
    console.error(`   ❌ Erro ao fazer upload de ${type}:`, error.message);
    throw error;
  }
}

/**
 * Migrar fotos de uma landing page específica
 */
async function migrateLandingPagePhotos(identifier: string) {
  try {
    console.log(`\n🔍 Buscando landing page: ${identifier}\n`);

    let landingPage: any;
    let fetchError: any;

    // Tentar buscar por ID ou subdomain
    if (identifier.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
      ({ data: landingPage, error: fetchError } = await supabase
        .from('landing_pages')
        .select('id, subdomain, photo_url, about_photo_url, og_image_url')
        .eq('id', identifier)
        .single());
    } else {
      ({ data: landingPage, error: fetchError } = await supabase
        .from('landing_pages')
        .select('id, subdomain, photo_url, about_photo_url, og_image_url')
        .eq('subdomain', identifier)
        .single());
    }

    if (fetchError || !landingPage) {
      console.error('❌ Erro ao buscar landing page:', fetchError?.message || 'Landing page não encontrada.');
      process.exit(1);
    }

    console.log(`📋 Landing page encontrada: ${landingPage.subdomain} (${landingPage.id})\n`);

    const updates: { photo_url?: string; about_photo_url?: string; og_image_url?: string } = {};
    let hasChanges = false;

    // Verificar e migrar photo_url
    if (landingPage.photo_url && landingPage.photo_url.startsWith('data:image')) {
      console.log('🖼️  Migrando photo_url (base64)...');
      try {
        const newUrl = await uploadBase64ToStorage(landingPage.photo_url, landingPage.id, 'profile');
        updates.photo_url = newUrl;
        hasChanges = true;
      } catch (error: any) {
        console.error('   ❌ Falha ao migrar photo_url:', error.message);
      }
    } else if (landingPage.photo_url) {
      console.log('   ℹ️  photo_url já é uma URL válida, pulando...');
    } else {
      console.log('   ℹ️  photo_url não existe, pulando...');
    }

    // Verificar e migrar about_photo_url
    if (landingPage.about_photo_url && landingPage.about_photo_url.startsWith('data:image')) {
      console.log('\n🖼️  Migrando about_photo_url (base64)...');
      try {
        const newUrl = await uploadBase64ToStorage(landingPage.about_photo_url, landingPage.id, 'about');
        updates.about_photo_url = newUrl;
        hasChanges = true;
      } catch (error: any) {
        console.error('   ❌ Falha ao migrar about_photo_url:', error.message);
      }
    } else if (landingPage.about_photo_url) {
      console.log('   ℹ️  about_photo_url já é uma URL válida, pulando...');
    } else {
      console.log('   ℹ️  about_photo_url não existe, pulando...');
    }

    // Verificar e migrar og_image_url (se for base64)
    if (landingPage.og_image_url && landingPage.og_image_url.startsWith('data:image')) {
      console.log('\n🖼️  Migrando og_image_url (base64)...');
      try {
        // Usar photo_url ou about_photo_url como og_image_url se disponível
        if (updates.photo_url) {
          updates.og_image_url = updates.photo_url;
          hasChanges = true;
          console.log('   ✅ Usando photo_url como og_image_url');
        } else if (updates.about_photo_url) {
          updates.og_image_url = updates.about_photo_url;
          hasChanges = true;
          console.log('   ✅ Usando about_photo_url como og_image_url');
        } else {
          // Se não houver photo_url ou about_photo_url, fazer upload do og_image_url
          const newUrl = await uploadBase64ToStorage(landingPage.og_image_url, landingPage.id, 'og-image');
          updates.og_image_url = newUrl;
          hasChanges = true;
        }
      } catch (error: any) {
        console.error('   ❌ Falha ao migrar og_image_url:', error.message);
      }
    } else if (landingPage.og_image_url && landingPage.og_image_url.includes('og-default.png')) {
      // Se og_image_url for o padrão, tentar usar photo_url ou about_photo_url
      if (updates.photo_url) {
        updates.og_image_url = updates.photo_url;
        hasChanges = true;
        console.log('\n🔄 Atualizando og_image_url para usar photo_url');
      } else if (updates.about_photo_url) {
        updates.og_image_url = updates.about_photo_url;
        hasChanges = true;
        console.log('\n🔄 Atualizando og_image_url para usar about_photo_url');
      }
    }

    // Atualizar banco de dados se houver mudanças
    if (hasChanges) {
      console.log('\n💾 Atualizando banco de dados...');
      const { error: updateError } = await supabase
        .from('landing_pages')
        .update(updates)
        .eq('id', landingPage.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar banco de dados:', updateError.message);
        process.exit(1);
      }

      console.log('✅ Banco de dados atualizado com sucesso!');
      console.log('\n📊 Resumo das atualizações:');
      if (updates.photo_url) console.log(`   - photo_url: ${updates.photo_url.substring(0, 80)}...`);
      if (updates.about_photo_url) console.log(`   - about_photo_url: ${updates.about_photo_url.substring(0, 80)}...`);
      if (updates.og_image_url) console.log(`   - og_image_url: ${updates.og_image_url.substring(0, 80)}...`);
    } else {
      console.log('\n✅ Nenhuma migração necessária. Todas as fotos já estão em formato de URL.');
    }

    console.log('\n✨ Migração concluída!');
  } catch (error: any) {
    console.error('❌ Erro fatal:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Migrar fotos de todas as landing pages
 */
async function migrateAllLandingPages() {
  try {
    console.log('\n🔍 Buscando todas as landing pages com fotos em base64...\n');

    const { data: landingPages, error: fetchError } = await supabase
      .from('landing_pages')
      .select('id, subdomain, photo_url, about_photo_url, og_image_url')
      .or('photo_url.like.data:image%,about_photo_url.like.data:image%,og_image_url.like.data:image%');

    if (fetchError) {
      console.error('❌ Erro ao buscar landing pages:', fetchError.message);
      process.exit(1);
    }

    if (!landingPages || landingPages.length === 0) {
      console.log('✅ Nenhuma landing page com fotos em base64 encontrada.');
      return;
    }

    console.log(`📋 Encontradas ${landingPages.length} landing pages com fotos em base64\n`);

    for (let i = 0; i < landingPages.length; i++) {
      const lp = landingPages[i];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`[${i + 1}/${landingPages.length}] Processando: ${lp.subdomain}`);
      console.log('='.repeat(60));
      
      await migrateLandingPagePhotos(lp.id);
      
      // Pequeno delay para não sobrecarregar
      if (i < landingPages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Migração de todas as landing pages concluída!');
    console.log('='.repeat(60));
  } catch (error: any) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

// Executar
const identifier = process.argv[2];

if (!identifier) {
  console.error('Uso: npm run migrate:photos -- <subdomain_ou_id|all>');
  console.error('Exemplo: npm run migrate:photos -- drlazaronitest');
  console.error('Exemplo: npm run migrate:photos -- e101999e-d852-4e00-bee4-f9eac9960f14');
  console.error('Exemplo: npm run migrate:photos -- all');
  process.exit(1);
}

if (identifier.toLowerCase() === 'all') {
  migrateAllLandingPages();
} else {
  migrateLandingPagePhotos(identifier);
}
