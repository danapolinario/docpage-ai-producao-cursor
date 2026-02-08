# Teste de Metatags no Localhost

## Como Testar

### 1. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

### 2. Acessar uma Landing Page

No navegador, acesse:
```
http://localhost:8080/[subdomain]
```

Onde `[subdomain]` é o subdomínio de uma landing page existente.

### 3. Verificar Metatags

#### Opção A: Visualizar Código-Fonte
1. Clique com botão direito na página
2. Selecione "Ver código-fonte da página" (ou Ctrl+U / Cmd+U)
3. Procure por `<meta property="og:site_name"`
4. Deve mostrar: `content="Dr(a). [Nome] - [Especialidade] | CRM [CRM]/[Estado]"`

#### Opção B: DevTools
1. Abra DevTools (F12)
2. Vá para a aba "Elements" (ou "Elementos")
3. Expanda `<head>`
4. Procure por `<meta property="og:site_name"`
5. Verifique o atributo `content`

#### Opção C: Console JavaScript
No console do navegador (F12 > Console), execute:

```javascript
// Verificar og:site_name
const ogSiteName = document.querySelector('meta[property="og:site_name"]');
console.log('og:site_name:', ogSiteName?.getAttribute('content'));

// Verificar se tags Twitter do DocPage foram removidas
const twitterSite = document.querySelector('meta[name="twitter:site"]');
const twitterCreator = document.querySelector('meta[name="twitter:creator"]');
console.log('twitter:site:', twitterSite?.getAttribute('content'));
console.log('twitter:creator:', twitterCreator?.getAttribute('content'));
```

### 4. Testar com SSR (Opcional)

Se quiser testar com SSR completo:

```bash
# Build primeiro
npm run build

# Iniciar servidor SSR
npm run dev:ssr
```

Depois acesse via subdomínio (se configurado no hosts) ou via rota.

## Problemas Comuns

### Metatags não aparecem no código-fonte
- **Causa**: React Helmet atualiza metatags após o carregamento
- **Solução**: Use DevTools (Opção B) ou Console (Opção C) para verificar

### Metatags ainda mostram "DocPage AI"
- **Causa**: Cache do navegador ou React Helmet não atualizou
- **Solução**: 
  1. Limpe o cache (Ctrl+Shift+Delete / Cmd+Shift+Delete)
  2. Recarregue a página (Ctrl+F5 / Cmd+Shift+R)
  3. Verifique no console se há erros

### Componente SEOHead não está sendo renderizado
- **Causa**: Landing page não foi encontrada ou está com erro
- **Solução**: 
  1. Verifique o console do navegador para erros
  2. Verifique se a landing page existe e está publicada
  3. Verifique se o subdomain está correto

## Verificação Rápida

Execute este código no console do navegador:

```javascript
// Verificar todas as metatags importantes
const checks = {
  'og:site_name': document.querySelector('meta[property="og:site_name"]')?.getAttribute('content'),
  'og:title': document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
  'og:description': document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
  'twitter:site': document.querySelector('meta[name="twitter:site"]')?.getAttribute('content'),
  'twitter:creator': document.querySelector('meta[name="twitter:creator"]')?.getAttribute('content'),
};

console.table(checks);

// Verificar se og:site_name contém "DocPage"
if (checks['og:site_name']?.includes('DocPage')) {
  console.error('❌ og:site_name ainda contém "DocPage"');
} else {
  console.log('✅ og:site_name está correto');
}

// Verificar se tags Twitter foram removidas
if (checks['twitter:site'] === '@DocPageAI' || checks['twitter:creator'] === '@DocPageAI') {
  console.error('❌ Tags Twitter do DocPage ainda existem');
} else {
  console.log('✅ Tags Twitter do DocPage foram removidas');
}
```
