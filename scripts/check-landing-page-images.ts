import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Carregar variáveis de ambiente do arquivo .env se existir
try {
  const envPath = join(process.cwd(), '.env');
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
  // Ignorar se .env não existir
}

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  '';

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLandingPageImages(identifier: string) {
  try {
    console.log(`🔍 Verificando imagens da landing page: ${identifier}\n`);

    let landingPage: any;
    let fetchError: any;

    // Tentar buscar por ID ou subdomain
    if (identifier.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
      // É um UUID
      ({ data: landingPage, error: fetchError } = await supabase
        .from('landing_pages')
        .select('id, subdomain, photo_url, about_photo_url, og_image_url, status')
        .eq('id', identifier)
        .single());
    } else {
      // É um subdomain
      ({ data: landingPage, error: fetchError } = await supabase
        .from('landing_pages')
        .select('id, subdomain, photo_url, about_photo_url, og_image_url, status')
        .eq('subdomain', identifier)
        .single());
    }

    if (fetchError || !landingPage) {
      console.error('❌ Erro ao buscar landing page:', fetchError?.message || 'Landing page não encontrada.');
      process.exit(1);
    }

    console.log('📋 Dados da landing page:');
    console.log(`   ID: ${landingPage.id}`);
    console.log(`   Subdomain: ${landingPage.subdomain}`);
    console.log(`   Status: ${landingPage.status}\n`);

    console.log('🖼️  Imagens disponíveis:\n');

    // Verificar og_image_url
    const isOgImageGeneric = landingPage.og_image_url ? landingPage.og_image_url.includes('og-default.png') : false;
    const isOgImageBase64 = landingPage.og_image_url ? landingPage.og_image_url.startsWith('data:image') : false;
    const hasValidOgImage = landingPage.og_image_url && 
                            typeof landingPage.og_image_url === 'string' &&
                            landingPage.og_image_url.trim().length > 0 &&
                            !isOgImageGeneric && 
                            !isOgImageBase64;

    console.log('   og_image_url:');
    console.log(`     Valor: ${landingPage.og_image_url || 'null/undefined'}`);
    console.log(`     Tipo: ${typeof landingPage.og_image_url}`);
    console.log(`     Tamanho: ${landingPage.og_image_url?.length || 0}`);
    console.log(`     É genérico (og-default.png): ${isOgImageGeneric}`);
    console.log(`     É base64: ${isOgImageBase64}`);
    console.log(`     ✅ Válido: ${hasValidOgImage}\n`);

    // Verificar about_photo_url
    const isAboutPhotoBase64 = landingPage.about_photo_url ? landingPage.about_photo_url.startsWith('data:image') : false;
    const hasValidAboutPhoto = landingPage.about_photo_url && 
                               typeof landingPage.about_photo_url === 'string' &&
                               landingPage.about_photo_url.trim().length > 0 &&
                               !isAboutPhotoBase64;

    console.log('   about_photo_url:');
    console.log(`     Valor: ${landingPage.about_photo_url || 'null/undefined'}`);
    console.log(`     Tipo: ${typeof landingPage.about_photo_url}`);
    console.log(`     Tamanho: ${landingPage.about_photo_url?.length || 0}`);
    console.log(`     É base64: ${isAboutPhotoBase64}`);
    console.log(`     ✅ Válido: ${hasValidAboutPhoto}\n`);

    // Verificar photo_url
    const isPhotoBase64 = landingPage.photo_url ? landingPage.photo_url.startsWith('data:image') : false;
    const hasValidPhoto = landingPage.photo_url && 
                          typeof landingPage.photo_url === 'string' &&
                          landingPage.photo_url.trim().length > 0 &&
                          !isPhotoBase64;

    console.log('   photo_url:');
    console.log(`     Valor: ${landingPage.photo_url || 'null/undefined'}`);
    console.log(`     Tipo: ${typeof landingPage.photo_url}`);
    console.log(`     Tamanho: ${landingPage.photo_url?.length || 0}`);
    console.log(`     É base64: ${isPhotoBase64}`);
    console.log(`     ✅ Válido: ${hasValidPhoto}\n`);

    // Determinar qual imagem será usada
    let selectedImage: string;
    if (hasValidOgImage) {
      selectedImage = landingPage.og_image_url;
      console.log('✅ Imagem OG selecionada: og_image_url');
    } else if (hasValidAboutPhoto) {
      selectedImage = landingPage.about_photo_url;
      console.log('✅ Imagem OG selecionada: about_photo_url');
    } else if (hasValidPhoto) {
      selectedImage = landingPage.photo_url;
      console.log('✅ Imagem OG selecionada: photo_url');
    } else {
      selectedImage = 'og-default.png (fallback)';
      console.log('⚠️  Nenhuma imagem válida encontrada, será usado og-default.png');
    }

    console.log(`\n📸 Imagem OG que será usada: ${selectedImage.substring(0, 100)}${selectedImage.length > 100 ? '...' : ''}\n`);

    if (!hasValidOgImage && !hasValidAboutPhoto && !hasValidPhoto) {
      console.log('⚠️  ATENÇÃO: Nenhuma imagem válida foi encontrada!');
      console.log('   A landing page usará og-default.png como imagem OG.');
      console.log('   Para corrigir, certifique-se de que pelo menos uma das seguintes URLs está preenchida:');
      console.log('   - photo_url');
      console.log('   - about_photo_url');
      console.log('   - og_image_url (e não seja og-default.png)');
    }

  } catch (error: any) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

const identifier = process.argv[2];
if (!identifier) {
  console.error('Uso: npm run check:images -- <subdomain_ou_id>');
  console.error('Exemplo: npm run check:images -- drlazaronitest');
  console.error('Exemplo: npm run check:images -- e101999e-d852-4e00-bee4-f9eac9960f14');
  process.exit(1);
}

checkLandingPageImages(identifier);
