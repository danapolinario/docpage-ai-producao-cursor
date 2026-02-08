/**
 * Script para atualizar metatags SEO das landing pages existentes
 * 
 * Este script atualiza os campos meta_title e meta_description
 * das landing pages existentes para remover referências ao DocPage
 * e usar dados específicos de cada landing page.
 * 
 * Execute com: npx tsx scripts/update-existing-seo-metatags.ts
 */

import { createClient } from '@supabase/supabase-js';

// Carregar variáveis de ambiente
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas:');
  console.error('  - VITE_SUPABASE_URL ou SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface BriefingData {
  name?: string;
  specialty?: string;
  crm?: string;
  crmState?: string;
  contactPhone?: string;
  contactEmail?: string;
  mainServices?: string;
  addresses?: string[];
}

async function updateSEOMetatags() {
  console.log('🔄 Buscando landing pages existentes...\n');

  // Buscar todas as landing pages
  const { data: landingPages, error: fetchError } = await supabase
    .from('landing_pages')
    .select('id, subdomain, briefing_data, meta_title, meta_description')
    .not('briefing_data', 'is', null);

  if (fetchError) {
    console.error('❌ Erro ao buscar landing pages:', fetchError);
    process.exit(1);
  }

  if (!landingPages || landingPages.length === 0) {
    console.log('ℹ️  Nenhuma landing page encontrada.');
    return;
  }

  console.log(`📄 Encontradas ${landingPages.length} landing pages\n`);

  let updated = 0;
  let skipped = 0;
  const errors: Array<{ id: string; subdomain: string; error: string }> = [];

  for (const page of landingPages) {
    try {
      const briefing = page.briefing_data as BriefingData;

      // Validar dados necessários
      if (!briefing?.name || !briefing?.specialty || !briefing?.crm || !briefing?.crmState) {
        console.log(`⏭️  Pulando ${page.subdomain}: dados incompletos`);
        skipped++;
        continue;
      }

      // Gerar novo meta_title
      const newMetaTitle = `${briefing.name} - ${briefing.specialty} | CRM ${briefing.crm}/${briefing.crmState}`;

      // Gerar novo meta_description se não existir ou contiver "DocPage"
      const currentDescription = page.meta_description || '';
      const needsDescriptionUpdate = !currentDescription || 
        currentDescription.toLowerCase().includes('docpage') ||
        currentDescription.toLowerCase().includes('landing page');

      const newMetaDescription = needsDescriptionUpdate
        ? `Dr(a). ${briefing.name}, ${briefing.specialty} - CRM ${briefing.crm}/${briefing.crmState}. ${briefing.crmState}. Agende sua consulta online.`
        : currentDescription;

      // Verificar se precisa atualizar
      const needsTitleUpdate = !page.meta_title || 
        page.meta_title.toLowerCase().includes('docpage') ||
        page.meta_title !== newMetaTitle;

      if (!needsTitleUpdate && !needsDescriptionUpdate) {
        console.log(`✓ ${page.subdomain}: já está atualizado`);
        skipped++;
        continue;
      }

      // Atualizar landing page
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (needsTitleUpdate) {
        updateData.meta_title = newMetaTitle;
      }

      if (needsDescriptionUpdate) {
        updateData.meta_description = newMetaDescription;
      }

      const { error: updateError } = await supabase
        .from('landing_pages')
        .update(updateData)
        .eq('id', page.id);

      if (updateError) {
        throw updateError;
      }

      console.log(`✅ ${page.subdomain}: atualizado`);
      updated++;

    } catch (error: any) {
      console.error(`❌ Erro ao atualizar ${page.subdomain}:`, error.message);
      errors.push({
        id: page.id,
        subdomain: page.subdomain,
        error: error.message
      });
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Resumo da atualização:');
  console.log(`   ✅ Atualizadas: ${updated}`);
  console.log(`   ⏭️  Puladas: ${skipped}`);
  console.log(`   ❌ Erros: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n❌ Erros encontrados:');
    errors.forEach(e => {
      console.log(`   - ${e.subdomain}: ${e.error}`);
    });
  }

  console.log('\n✨ Atualização concluída!');
}

// Executar script
updateSEOMetatags()
  .then(() => {
    console.log('\n🎉 Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
  });
