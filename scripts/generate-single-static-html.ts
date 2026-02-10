/**
 * Script para gerar HTML estático de uma landing page específica
 * 
 * Uso:
 *   npm run generate:static-html:single -- drlazaronitest
 *   npm run generate:static-html:single -- e101999e-d852-4e00-bee4-f9eac9960f14
 * 
 * Ou diretamente:
 *   npx tsx scripts/generate-single-static-html.ts drlazaronitest
 *   npx tsx scripts/generate-single-static-html.ts e101999e-d852-4e00-bee4-f9eac9960f14
 */

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

const supabaseServiceKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY || 
  '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas\n');
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  console.error('Ou exporte as variáveis no terminal antes de executar\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateSingleStaticHTML(identifier: string) {
  try {
    console.log(`🚀 Gerando HTML estático para: ${identifier}\n`);

    // Construir URL da função
    let FUNCTIONS_BASE_URL: string;
    if (supabaseUrl.includes('/rest/v1')) {
      FUNCTIONS_BASE_URL = supabaseUrl.replace('/rest/v1', '/functions/v1');
    } else if (supabaseUrl.endsWith('/')) {
      FUNCTIONS_BASE_URL = `${supabaseUrl}functions/v1`;
    } else {
      FUNCTIONS_BASE_URL = `${supabaseUrl}/functions/v1`;
    }

    // Buscar landing page por ID ou subdomain
    let landingPageId: string;
    
    // Verificar se é UUID (tem hífens e tem 36 caracteres)
    if (identifier.includes('-') && identifier.length === 36) {
      // É um ID (UUID)
      landingPageId = identifier;
      console.log(`📋 Usando ID: ${landingPageId}`);
    } else {
      // É um subdomain, buscar pelo subdomain
      console.log(`📋 Buscando landing page pelo subdomain: ${identifier}`);
      const { data: landingPage, error: fetchError } = await supabase
        .from('landing_pages')
        .select('id, subdomain, status')
        .eq('subdomain', identifier.toLowerCase())
        .single();

      if (fetchError || !landingPage) {
        console.error('❌ Landing page não encontrada:', fetchError?.message || 'Não encontrada');
        process.exit(1);
      }

      landingPageId = landingPage.id;
      console.log(`✓ Landing page encontrada: ${landingPage.subdomain} (${landingPage.id})`);
      console.log(`  Status: ${landingPage.status}\n`);
    }

    // Chamar Edge Function
    console.log(`🔗 Chamando Edge Function: ${FUNCTIONS_BASE_URL}/generate-static-html\n`);
    
    const htmlResponse = await fetch(`${FUNCTIONS_BASE_URL}/generate-static-html`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
      },
      body: JSON.stringify({ landingPageId }),
    });

    const responseText = await htmlResponse.text();
    let htmlData: any;
    try {
      htmlData = responseText ? JSON.parse(responseText) : {};
    } catch {
      htmlData = { raw: responseText };
    }

    if (htmlResponse.ok) {
      console.log('✅ HTML estático gerado com sucesso!\n');
      console.log('📊 Detalhes:');
      console.log(`   Subdomain: ${htmlData.subdomain || 'N/A'}`);
      console.log(`   URL pública: ${htmlData.publicUrl || 'N/A'}\n`);
      
      if (htmlData.publicUrl) {
        console.log('🔗 Você pode acessar o HTML em:');
        console.log(`   ${htmlData.publicUrl}\n`);
      }
      
      return htmlData;
    } else {
      console.error('❌ Erro ao gerar HTML estático\n');
      console.error(`   Status: ${htmlResponse.status} ${htmlResponse.statusText}`);
      console.error(`   Erro: ${htmlData.error || 'Erro desconhecido'}`);
      if (htmlData.details) {
        console.error(`   Detalhes: ${htmlData.details}`);
      }
      console.error(`   Resposta completa: ${JSON.stringify(htmlData, null, 2)}\n`);
      
      // Sugestões de troubleshooting
      if (htmlData.details?.includes('Bucket not found')) {
        console.error('💡 Solução: Execute a migration para criar o bucket:');
        console.error('   supabase/migrations/20260210000002_create_bucket_landing_pages.sql\n');
      } else if (htmlResponse.status === 404) {
        console.error('💡 Verifique se a Edge Function generate-static-html está deployada\n');
      }
      
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Erro fatal:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

// Obter identificador da linha de comando
const identifier = process.argv[2];

if (!identifier) {
  console.error('❌ Erro: Identificador não fornecido\n');
  console.error('Uso:');
  console.error('   npm run generate:static-html:single -- SUBDOMAIN_OU_ID');
  console.error('   npm run generate:static-html:single -- drlazaronitest');
  console.error('   npm run generate:static-html:single -- e101999e-d852-4e00-bee4-f9eac9960f14\n');
  process.exit(1);
}

// Executar
generateSingleStaticHTML(identifier);
