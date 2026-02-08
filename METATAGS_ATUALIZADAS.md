# ✅ Metatags SEO Atualizadas

## Alterações Realizadas

Todas as metatags de SEO e compartilhamento foram atualizadas para usar dados específicos de cada landing page ao invés de dados genéricos do DocPage.

### Arquivos Atualizados

#### 1. `components/SEOHead.tsx` ✅
- **og:site_name**: Agora usa `Dr(a). [Nome] - [Especialidade] | CRM [CRM]/[Estado]`
- **twitter:site** e **twitter:creator**: Removidas (eram específicas do DocPage)

#### 2. `server/render.tsx` ✅
- **og:site_name**: Atualizado para usar dados do médico
- **twitter:site** e **twitter:creator**: Removidas

#### 3. `api/render.tsx` ✅
- **og:site_name**: Atualizado para usar dados do médico
- **twitter:site** e **twitter:creator**: Removidas

## Como Funciona

### Renderização SSR (Server-Side)
As landing pages são renderizadas no servidor usando:
- `server/render.tsx` - Para servidor Express
- `api/render.tsx` - Para Vercel Serverless Functions

Ambos agora geram HTML com metatags personalizadas no `<head>`.

### Renderização Client-Side
Quando a página carrega no navegador, o componente `SEOHead` (via React Helmet) atualiza as metatags dinamicamente.

## Resultado

### Antes:
```html
<meta property="og:site_name" content="DocPage AI" />
<meta name="twitter:site" content="@DocPageAI" />
<meta name="twitter:creator" content="@DocPageAI" />
```

### Depois:
```html
<meta property="og:site_name" content="Dr(a). João Silva - Cardiologia | CRM 12345/SP" />
<!-- Tags Twitter removidas -->
```

## Verificação

Para verificar se está funcionando:

1. **Acesse uma landing page publicada**
2. **Visualize o código-fonte** (Ctrl+U / Cmd+U)
3. **Procure por**:
   - `<meta property="og:site_name"` - deve mostrar nome do médico
   - Não deve haver `<meta name="twitter:site"` ou `<meta name="twitter:creator"`

4. **Teste compartilhamento**:
   - Compartilhe a URL no WhatsApp/Facebook
   - O preview deve mostrar o nome do médico, não "DocPage AI"

## Cache

⚠️ **Importante**: Se você já compartilhou a URL antes, as redes sociais podem ter cacheado as metatags antigas.

Para forçar atualização:
- **Facebook**: https://developers.facebook.com/tools/debug/
- **LinkedIn**: https://www.linkedin.com/post-inspector/
- **Twitter**: https://cards-dev.twitter.com/validator

## Notas

- As metatags são geradas **dinamicamente** em tempo de execução
- Não é necessário atualizar o banco de dados
- Todas as landing pages (novas e existentes) já usam as novas metatags
- A atualização é automática - não requer ação manual
