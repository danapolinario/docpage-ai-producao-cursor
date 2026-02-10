/**
 * Script para deletar landing pages de teste e tudo relacionado
 * 
 * Este script:
 * 1. Identifica landing pages de teste (por subdomain, email, data, etc)
 * 2. Deleta imagens do Storage (pasta {landingPageId}/)
 * 3. Deleta HTML estático do Storage (html/{subdomain}.html)
 * 4. Deleta landing page do banco (cascata deleta analytics e custom_domains)
 * 5. Opcionalmente deleta o usuário também
 * 
 * Uso:
 *   npm run delete:test-pages -- --subdomains teste1,teste2,teste3
 *   npm run delete:test-pages -- --email-contains test
 *   npm run delete:test-pages -- --older-than-days 30
 *   npm run delete:test-pages -- --status draft
 *   npm run delete:test-pages -- --delete-users
 *   npm run delete:test-pages -- --subdomains teste1 --dry-run
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

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = 'landing-pages';

/**
 * Parse argumentos da linha de comando
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options: {
    subdomains?: string[];
    emailContains?: string;
    olderThanDays?: number;
    status?: string;
    deleteUsers?: boolean;
    dryRun?: boolean;
  } = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--subdomains' && args[i + 1]) {
      options.subdomains = args[i + 1].split(',').map(s => s.trim());
      i++;
    } else if (arg === '--email-contains' && args[i + 1]) {
      options.emailContains = args[i + 1];
      i++;
    } else if (arg === '--older-than-days' && args[i + 1]) {
      options.olderThanDays = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--status' && args[i + 1]) {
      options.status = args[i + 1];
      i++;
    } else if (arg === '--delete-users') {
      options.deleteUsers = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  }

  return options;
}

/**
 * Buscar landing pages baseado nos critérios
 */
async function findTestLandingPages(options: any) {
  let query = supabase
    .from('landing_pages')
    .select('id, subdomain, user_id, status, created_at, photo_url, about_photo_url, og_image_url');

  // Filtrar por subdomains
  if (options.subdomains && options.subdomains.length > 0) {
    query = query.in('subdomain', options.subdomains);
  }

  // Filtrar por status
  if (options.status) {
    query = query.eq('status', options.status);
  }

  // Filtrar por data (mais antigas que X dias)
  if (options.olderThanDays) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - options.olderThanDays);
    query = query.lt('created_at', cutoffDate.toISOString());
  }

  const { data: landingPages, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar landing pages: ${error.message}`);
  }

  // Filtrar por email do usuário se especificado
  if (options.emailContains && landingPages) {
    const filtered: any[] = [];
    
    for (const lp of landingPages) {
      try {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(lp.user_id);
        if (!userError && userData?.user?.email?.toLowerCase().includes(options.emailContains.toLowerCase())) {
          filtered.push(lp);
        }
      } catch (err: any) {
        console.warn(`   ⚠️  Erro ao buscar usuário ${lp.user_id}: ${err.message}`);
      }
    }
    
    return filtered;
  }

  return landingPages || [];
}

/**
 * Deletar arquivos do Storage de uma landing page
 */
async function deleteStorageFiles(landingPageId: string, subdomain: string, dryRun: boolean = false) {
  const deletedFiles: string[] = [];

  try {
    // 1. Deletar pasta de imagens da landing page ({landingPageId}/)
    console.log(`   📁 Deletando imagens da pasta ${landingPageId}/...`);
    
    if (!dryRun) {
      const { data: files, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(landingPageId);

      if (!listError && files && files.length > 0) {
        const filePaths = files.map(f => `${landingPageId}/${f.name}`);
        const { error: deleteError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove(filePaths);

        if (deleteError) {
          console.error(`   ⚠️  Erro ao deletar imagens: ${deleteError.message}`);
        } else {
          deletedFiles.push(...filePaths);
          console.log(`   ✅ ${files.length} arquivo(s) de imagem deletado(s)`);
        }
      } else {
        console.log(`   ℹ️  Nenhuma imagem encontrada na pasta ${landingPageId}/`);
      }
    } else {
      console.log(`   [DRY RUN] Deletaria imagens da pasta ${landingPageId}/`);
    }

    // 2. Deletar HTML estático (html/{subdomain}.html)
    const htmlPath = `html/${subdomain}.html`;
    console.log(`   📄 Deletando HTML estático: ${htmlPath}...`);
    
    if (!dryRun) {
      const { error: deleteHtmlError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([htmlPath]);

      if (deleteHtmlError) {
        // HTML pode não existir, não é erro crítico
        console.log(`   ℹ️  HTML estático não encontrado ou já deletado`);
      } else {
        deletedFiles.push(htmlPath);
        console.log(`   ✅ HTML estático deletado`);
      }
    } else {
      console.log(`   [DRY RUN] Deletaria HTML estático: ${htmlPath}`);
    }

  } catch (error: any) {
    console.error(`   ❌ Erro ao deletar arquivos do Storage: ${error.message}`);
  }

  return deletedFiles;
}

/**
 * Deletar landing page e dados relacionados
 */
async function deleteLandingPage(landingPageId: string, subdomain: string, userId: string, deleteUser: boolean, dryRun: boolean = false) {
  console.log(`\n🗑️  Deletando landing page: ${subdomain} (${landingPageId})`);

  // 1. Deletar arquivos do Storage
  const deletedFiles = await deleteStorageFiles(landingPageId, subdomain, dryRun);

  // 2. Deletar landing page do banco (cascata deleta analytics e custom_domains)
  console.log(`   💾 Deletando registro do banco de dados...`);
  
  if (!dryRun) {
    const { error: deleteError } = await supabase
      .from('landing_pages')
      .delete()
      .eq('id', landingPageId);

    if (deleteError) {
      throw new Error(`Erro ao deletar landing page: ${deleteError.message}`);
    }
    console.log(`   ✅ Landing page deletada do banco de dados`);
  } else {
    console.log(`   [DRY RUN] Deletaria landing page do banco de dados`);
  }

  // 3. Deletar usuário se solicitado
  if (deleteUser) {
    console.log(`   👤 Deletando usuário ${userId}...`);
    
    if (!dryRun) {
      const { error: userDeleteError } = await supabase.auth.admin.deleteUser(userId);
      
      if (userDeleteError) {
        console.error(`   ⚠️  Erro ao deletar usuário: ${userDeleteError.message}`);
      } else {
        console.log(`   ✅ Usuário deletado`);
      }
    } else {
      console.log(`   [DRY RUN] Deletaria usuário ${userId}`);
    }
  }

  return {
    landingPageId,
    subdomain,
    deletedFiles: deletedFiles.length,
    userDeleted: deleteUser
  };
}

/**
 * Função principal
 */
async function main() {
  const options = parseArgs();

  // Validar que pelo menos um critério foi especificado
  if (!options.subdomains && !options.emailContains && !options.olderThanDays && !options.status) {
    console.error('❌ Erro: Você deve especificar pelo menos um critério de busca');
    console.error('\nOpções disponíveis:');
    console.error('  --subdomains teste1,teste2,teste3  (lista de subdomains separados por vírgula)');
    console.error('  --email-contains test              (email do usuário contém)');
    console.error('  --older-than-days 30               (mais antigas que X dias)');
    console.error('  --status draft                     (status: draft, published, archived)');
    console.error('  --delete-users                     (também deletar usuários)');
    console.error('  --dry-run                          (apenas simular, não deletar)');
    console.error('\nExemplos:');
    console.error('  npm run delete:test-pages -- --subdomains teste1,teste2 --dry-run');
    console.error('  npm run delete:test-pages -- --email-contains test --status draft');
    console.error('  npm run delete:test-pages -- --older-than-days 30 --delete-users');
    process.exit(1);
  }

  if (options.dryRun) {
    console.log('🔍 [MODO DRY RUN - Nenhuma alteração será feita]\n');
  }

  try {
    console.log('🔍 Buscando landing pages de teste...\n');
    const landingPages = await findTestLandingPages(options);

    if (!landingPages || landingPages.length === 0) {
      console.log('✅ Nenhuma landing page encontrada com os critérios especificados.');
      return;
    }

    console.log(`📋 Encontradas ${landingPages.length} landing page(s) de teste:\n`);
    landingPages.forEach((lp, i) => {
      console.log(`   ${i + 1}. ${lp.subdomain} (${lp.id}) - Status: ${lp.status} - Criada em: ${new Date(lp.created_at).toLocaleDateString('pt-BR')}`);
    });

    if (!options.dryRun) {
      console.log('\n⚠️  ATENÇÃO: Esta operação é IRREVERSÍVEL!');
      console.log('   Você está prestes a deletar:');
      console.log('   - Landing pages do banco de dados');
      console.log('   - Todas as imagens do Storage');
      console.log('   - HTML estático do Storage');
      console.log('   - Analytics e custom domains (cascata)');
      if (options.deleteUsers) {
        console.log('   - Usuários associados');
      }
      console.log('\n   Pressione Ctrl+C para cancelar ou aguarde 5 segundos...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    const results = [];
    for (let i = 0; i < landingPages.length; i++) {
      const lp = landingPages[i];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`[${i + 1}/${landingPages.length}] Processando: ${lp.subdomain}`);
      console.log('='.repeat(60));

      try {
        const result = await deleteLandingPage(
          lp.id,
          lp.subdomain,
          lp.user_id,
          options.deleteUsers || false,
          options.dryRun || false
        );
        results.push(result);
      } catch (error: any) {
        console.error(`❌ Erro ao processar ${lp.subdomain}: ${error.message}`);
        results.push({
          landingPageId: lp.id,
          subdomain: lp.subdomain,
          error: error.message
        });
      }

      // Pequeno delay entre operações
      if (i < landingPages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO');
    console.log('='.repeat(60));
    console.log(`Total processado: ${landingPages.length}`);
    console.log(`Sucessos: ${results.filter(r => !r.error).length}`);
    console.log(`Erros: ${results.filter(r => r.error).length}`);
    
    if (results.some(r => r.deletedFiles)) {
      const totalFiles = results.reduce((sum, r) => sum + (r.deletedFiles || 0), 0);
      console.log(`Arquivos deletados do Storage: ${totalFiles}`);
    }
    
    if (options.deleteUsers) {
      const usersDeleted = results.filter(r => r.userDeleted).length;
      console.log(`Usuários deletados: ${usersDeleted}`);
    }

    if (options.dryRun) {
      console.log('\n🔍 [DRY RUN] Nenhuma alteração foi feita. Execute sem --dry-run para aplicar.');
    } else {
      console.log('\n✨ Processo concluído!');
    }
  } catch (error: any) {
    console.error('❌ Erro fatal:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
