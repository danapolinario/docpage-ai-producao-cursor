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

// Carregar variáveis de ambiente (dotenv é opcional)
// Se dotenv não estiver instalado, use variáveis de ambiente do sistema
if (typeof process !== 'undefined' && process.env) {
  // Variáveis já estão disponíveis via process.env
  // Se quiser usar dotenv, instale: npm install dotenv
  // e descomente as linhas abaixo:
  // import dotenv from 'dotenv';
  // dotenv.config();
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

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

    const FUNCTIONS_BASE_URL = `${supabaseUrl.replace('/rest/v1', '')}/functions/v1`;
    const results: Array<{ landingPageId: string; subdomain: string; success: boolean; error?: string; publicUrl?: string }> = [];

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
          },
          body: JSON.stringify({ landingPageId: landingPage.id }),
        });

        const htmlData = await htmlResponse.json();

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
          console.error(`  ✗ Erro: ${landingPage.subdomain} - ${htmlData.error || 'Erro desconhecido'}`);
          results.push({
            landingPageId: landingPage.id,
            subdomain: landingPage.subdomain,
            success: false,
            error: htmlData.error || 'Erro desconhecido'
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
