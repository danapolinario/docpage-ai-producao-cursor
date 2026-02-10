import { Plugin } from 'vite';
import { writeFileSync, renameSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Plugin do Vite para renomear index.html após o build
 * Isso impede que o Vercel sirva o index.html estático antes das rewrites
 */
export function renameIndexHtml(): Plugin {
  return {
    name: 'rename-index-html',
    closeBundle() {
      const distPath = join(process.cwd(), 'dist');
      const indexPath = join(distPath, 'index.html');
      const spaPath = join(distPath, 'spa.html');
      
      // Renomear index.html para spa.html após o build
      if (existsSync(indexPath)) {
        try {
          renameSync(indexPath, spaPath);
          console.log('✓ index.html renomeado para spa.html');
        } catch (error: any) {
          console.error('Erro ao renomear index.html:', error.message);
        }
      }
    },
  };
}
