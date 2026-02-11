/**
 * Script para gerar HTML estático para todas as landing pages publicadas
 * 
 * Uso:
 * 1. Configure as variáveis de ambiente no .env:
 *    - VITE_SUPABASE_URL
 *    - SUPABASE_SERVICE_ROLE_KEY (ou VITE_SUPABASE_ANON_KEY como fallback)
 * 
 * 2. Execute:
 *    npx tsx scripts/generate-all-static-html.ts
 * 
 * Ou via Node.js:
 *    node --loader ts-node/esm scripts/generate-all-static-html.ts
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
    console.log('✓ Arquivo .env.local carregado\n');
  }
} catch (error: any) {
  // Arquivo .env.local não existe ou não pode ser lido - usar variáveis do sistema
  if (error.code !== 'ENOENT') {
    console.log('⚠️  Aviso: Não foi possível carregar .env.local, usando variáveis do sistema\n');
  }
}

// Tentar carregar variáveis de ambiente de múltiplas fontes
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
  console.error('📝 Configure as variáveis de ambiente de uma das seguintes formas:\n');
  
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('Opção 1: Criar arquivo .env.local na raiz do projeto (RECOMENDADO)\n');
  console.error('   1. Crie o arquivo .env.local na raiz do projeto:\n');
  console.error('   2. Edite o arquivo .env.local e preencha os valores:\n');
  console.error('      VITE_SUPABASE_URL=https://seu-projeto.supabase.co');
  console.error('      SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key\n');
  
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('Opção 2: Exportar variáveis no terminal\n');
  console.error('   export VITE_SUPABASE_URL=https://seu-projeto.supabase.co');
  console.error('   export SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key');
  console.error('   npm run generate:static-html\n');
  
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('📍 Onde encontrar os valores:\n');
  console.error('   1. Acesse: https://supabase.com/dashboard');
  console.error('   2. Selecione seu projeto');
  console.error('   3. Vá em Settings > API\n');
  console.error('   - VITE_SUPABASE_URL: Project URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY: service_role key (secret) ⚠️\n');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.error('⚠️  IMPORTANTE: A Service Role Key é sensível - NUNCA compartilhe ou commite no git!');
  process.exit(1);
}

console.log('✓ Variáveis de ambiente configuradas');
console.log(`  URL: ${supabaseUrl.substring(0, 30)}...`);
console.log(`  Key: ${supabaseServiceKey.substring(0, 20)}...\n`);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateAllStaticHTML() {
  try {
    console.log('🚀 Iniciando geração de HTML estático para todas as landing pages publicadas...\n');

    // Buscar todas as landing pages publicadas
    const { data: landingPages, error: fetchError } = await supabase
      .from('landing_pages')
      .select('id, subdomain, status')
      .eq('status', 'published');

    if (fetchError) {
      console.error('❌ Erro ao buscar landing pages:', fetchError);
      process.exit(1);
    }

    if (!landingPages || landingPages.length === 0) {
      console.log('ℹ️  Nenhuma landing page publicada encontrada.');
      return;
    }

    console.log(`📋 Encontradas ${landingPages.length} landing pages publicadas\n`);

    // Construir URL da função corretamente
    let FUNCTIONS_BASE_URL: string;
    if (supabaseUrl.includes('/rest/v1')) {
      FUNCTIONS_BASE_URL = supabaseUrl.replace('/rest/v1', '/functions/v1');
    } else if (supabaseUrl.endsWith('/')) {
      FUNCTIONS_BASE_URL = `${supabaseUrl}functions/v1`;
    } else {
      FUNCTIONS_BASE_URL = `${supabaseUrl}/functions/v1`;
    }
    
    console.log(`🔗 URL da função: ${FUNCTIONS_BASE_URL}/generate-static-html\n`);
    
    const results: Array<{ landingPageId: string; subdomain: string; success: boolean; error?: string; publicUrl?: string }> = [];
    
    // Testar a primeira landing page para verificar se a função está funcionando
    if (landingPages.length > 0) {
      const testPage = landingPages[0];
      console.log(`🧪 Testando função com primeira landing page: ${testPage.subdomain}...`);
      
      try {
        const testResponse = await fetch(`${FUNCTIONS_BASE_URL}/generate-static-html`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
          },
          body: JSON.stringify({ landingPageId: testPage.id }),
        });
        
        const testText = await testResponse.text();
        let testData: any;
        try {
          testData = testText ? JSON.parse(testText) : {};
        } catch {
          testData = { raw: testText.substring(0, 200) };
        }
        
        console.log(`   Status: ${testResponse.status} ${testResponse.statusText}`);
        console.log(`   Response: ${JSON.stringify(testData, null, 2).substring(0, 300)}...\n`);
        
        if (!testResponse.ok) {
          console.error('⚠️  A Edge Function está retornando erro. Possíveis causas:\n');
          console.error('   1. Função não deployada:');
          console.error('      Execute: supabase functions deploy generate-static-html\n');
          console.error('   2. Service Role Key incorreta:');
          console.error('      Verifique em: Supabase Dashboard > Settings > API > service_role\n');
          console.error('   3. Bucket não permite HTML:');
          console.error('      Execute a migration: 20260210000001_allow_html_in_storage.sql\n');
          console.error('   4. Verifique os logs:');
          console.error('      Supabase Dashboard > Edge Functions > generate-static-html > Logs\n');
          
          // Perguntar se quer continuar mesmo assim
          console.error('❓ Deseja continuar mesmo assim? (Pode ser que a função não esteja deployada)\n');
        } else {
          console.log('✓ Função está funcionando! Continuando com todas as landing pages...\n');
        }
      } catch (testError: any) {
        console.error(`   ✗ Erro de rede ao testar: ${testError.message}`);
        console.error(`   Verifique se a URL está correta: ${FUNCTIONS_BASE_URL}/generate-static-html\n`);
      }
    }

    // Gerar HTML estático para cada landing page
    for (let i = 0; i < landingPages.length; i++) {
      const landingPage = landingPages[i];
      const progress = `[${i + 1}/${landingPages.length}]`;
      
      try {
        console.log(`${progress} Gerando HTML para: ${landingPage.subdomain} (${landingPage.id})`);
        
        const htmlResponse = await fetch(`${FUNCTIONS_BASE_URL}/generate-static-html`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey, // Algumas Edge Functions podem precisar disso
          },
          body: JSON.stringify({ landingPageId: landingPage.id }),
        });
        
        // Log detalhado para debug
        if (!htmlResponse.ok && i === 0) {
          console.error(`   Headers da resposta:`, Object.fromEntries(htmlResponse.headers.entries()));
        }

        let htmlData: any;
        try {
          const responseText = await htmlResponse.text();
          htmlData = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
          htmlData = { error: `Erro ao parsear resposta: ${htmlResponse.status} ${htmlResponse.statusText}` };
        }

        if (htmlResponse.ok) {
          console.log(`  ✓ Sucesso: ${landingPage.subdomain}`);
          if (htmlData.publicUrl) {
            console.log(`    URL: ${htmlData.publicUrl}`);
          }
          results.push({
            landingPageId: landingPage.id,
            subdomain: landingPage.subdomain,
            success: true,
            publicUrl: htmlData.publicUrl
          });
        } else {
          const errorMsg = htmlData.error || htmlData.message || `HTTP ${htmlResponse.status}: ${htmlResponse.statusText}`;
          console.error(`  ✗ Erro: ${landingPage.subdomain}`);
          console.error(`    Status: ${htmlResponse.status}`);
          console.error(`    Detalhes: ${errorMsg}`);
          if (htmlData.details) {
            console.error(`    Mais info: ${JSON.stringify(htmlData.details)}`);
          }
          results.push({
            landingPageId: landingPage.id,
            subdomain: landingPage.subdomain,
            success: false,
            error: errorMsg
          });
        }
      } catch (error: any) {
        console.error(`  ✗ Exceção: ${landingPage.subdomain} - ${error.message}`);
        results.push({
          landingPageId: landingPage.id,
          subdomain: landingPage.subdomain,
          success: false,
          error: error.message || 'Exceção ao gerar HTML'
        });
      }

      // Pequeno delay para não sobrecarregar
      if (i < landingPages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Resumo
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO');
    console.log('='.repeat(60));
    console.log(`Total de landing pages: ${landingPages.length}`);
    console.log(`✓ Sucessos: ${successCount}`);
    console.log(`✗ Erros: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\n❌ Landing pages com erro:');
      results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.subdomain}: ${r.error}`);
        });
    }

    if (successCount > 0) {
      console.log('\n✅ Landing pages geradas com sucesso:');
      results
        .filter(r => r.success)
        .forEach(r => {
          console.log(`  - ${r.subdomain}${r.publicUrl ? ` (${r.publicUrl})` : ''}`);
        });
    }

    console.log('\n✨ Processamento concluído!');
  } catch (error: any) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

// Executar
generateAllStaticHTML();
