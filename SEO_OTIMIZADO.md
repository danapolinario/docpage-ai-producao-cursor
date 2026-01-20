# ✅ SEO Otimizado - Tags Personalizadas

## Implementação Completa

Implementei todas as tags SEO solicitadas, totalmente personalizadas com o conteúdo e imagens de cada landing page do médico.

## Tags Implementadas

### 1. SEO Base Tags ✅

- `meta description` - Descrição otimizada (150-160 chars)
- `meta keywords` - Palavras-chave relevantes
- `meta author` - Nome do médico
- `meta robots` - `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`
- `meta language` - `pt-BR`
- `meta revisit-after` - `7 days`
- `meta rating` - `general`
- `meta distribution` - `global`
- `meta copyright` - Ano atual + nome do médico
- `geo.region` - Estado do CRM
- `geo.placename` - Estado do CRM

### 2. Open Graph / Facebook / WhatsApp ✅

- `og:title` - Título otimizado
- `og:description` - Descrição otimizada
- `og:image` - Imagem principal (prioridade: og_image_url > about_photo_url > photo_url)
- `og:image:secure_url` - Versão HTTPS da imagem
- `og:image:type` - `image/jpeg`
- `og:image:width` - `1200`
- `og:image:height` - `630`
- `og:image:alt` - Texto alternativo descritivo
- `og:url` - URL canônica da página
- `og:type` - `website`
- `og:site_name` - `DocPage AI`
- `og:locale` - `pt_BR`
- `og:locale:alternate` - `pt_PT`
- `og:phone_number` - Telefone de contato (se disponível)
- `og:email` - Email de contato (se disponível)

### 3. Twitter Card ✅

- `twitter:card` - `summary_large_image`
- `twitter:title` - Título otimizado
- `twitter:description` - Descrição otimizada
- `twitter:image` - Imagem principal
- `twitter:image:alt` - Texto alternativo
- `twitter:site` - `@DocPageAI` (atualizar se tiver conta)
- `twitter:creator` - `@DocPageAI` (atualizar se tiver conta)
- `twitter:domain` - Domínio da página

### 4. Mobile & PWA ✅

- `viewport` - `width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes`
- `theme-color` - `#3B82F6`
- `msapplication-TileColor` - `#3B82F6`
- `msapplication-config` - `/browserconfig.xml`
- `mobile-web-app-capable` - `yes`
- `apple-mobile-web-app-capable` - `yes`
- `apple-mobile-web-app-status-bar-style` - `default`
- `apple-mobile-web-app-title` - Nome do médico
- `apple-touch-icon` - Ícone da foto do médico (se disponível)
- `icon` - Favicon
- `format-detection` - `telephone=yes`

### 5. Canonical URL ✅

- `canonical` - URL canônica da página (suporta custom domain)
- Suporte para domínios personalizados

## Schema.org JSON-LD (Structured Data)

Implementado schema completo para `Physician` com:
- Informações básicas (nome, descrição, imagem)
- Especialidade médica
- Contato (telefone, email)
- Endereços
- CRM
- Área de atendimento
- Ações potenciais (agendamento)
- Múltiplas imagens (og_image, photo_url, about_photo_url)

## Personalização por Landing Page

Todas as tags são geradas dinamicamente usando:

1. **Dados do Briefing**:
   - Nome do médico
   - Especialidade
   - CRM/Estado
   - Telefone/Email
   - Endereços
   - Serviços principais

2. **Dados do Conteúdo**:
   - Subheadline
   - Descrição personalizada

3. **Imagens**:
   - `og_image_url` (prioridade 1) - Imagem OG gerada
   - `about_photo_url` (prioridade 2) - Foto do consultório
   - `photo_url` (prioridade 3) - Foto de perfil

4. **SEO Customizado**:
   - `meta_title` - Título personalizado (se fornecido)
   - `meta_description` - Descrição personalizada (se fornecida)
   - `meta_keywords` - Palavras-chave personalizadas (se fornecidas)

5. **Domínio**:
   - Suporta `custom_domain` se configurado
   - Fallback para subdomain

## Otimizações SEO

### Títulos
- 50-60 caracteres (ideal para Google)
- Formato: `Nome - Especialidade | CRM X/Estado`

### Descrições
- 150-160 caracteres (ideal para Google)
- Inclui informações essenciais: nome, especialidade, CRM, call-to-action

### Imagens
- Prioriza imagem OG gerada
- Fallback para foto do consultório
- Fallback para foto de perfil
- Dimensões: 1200x630px (ideal para redes sociais)

### Keywords
- Máximo 10-15 palavras-chave
- Inclui: nome, especialidade, localização, serviços

## Como Usar

O componente `SEOHead` é automaticamente usado em `LandingPageViewer` quando uma landing page é visualizada. Não é necessário fazer nada adicional - as tags são injetadas automaticamente no `<head>` da página.

## Verificação

Para verificar se as tags estão corretas:

1. **Visualizar código-fonte** da página (Ctrl+U ou Cmd+Option+U)
2. **Ferramentas de teste**:
   - Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
   - Twitter Card Validator: https://cards-dev.twitter.com/validator
   - Google Rich Results Test: https://search.google.com/test/rich-results
   - Schema.org Validator: https://validator.schema.org/

## Exemplo de Tags Geradas

```html
<!-- SEO Base Tags -->
<meta name="description" content="Dr(a). João Silva, Cardiologia - CRM 12345/SP. São Paulo. Agende sua consulta online.">
<meta name="keywords" content="João Silva, Cardiologia, médico SP, CRM 12345, consulta médica">
<meta name="author" content="João Silva">
<meta name="robots" content="index, follow, max-image-preview:large">

<!-- Open Graph / Facebook / WhatsApp -->
<meta property="og:title" content="João Silva - Cardiologia | CRM 12345/SP">
<meta property="og:description" content="Dr(a). João Silva, Cardiologia - CRM 12345/SP...">
<meta property="og:image" content="https://.../og-image.jpg">
<meta property="og:url" content="https://.../joao-silva">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="João Silva - Cardiologia | CRM 12345/SP">
<meta name="twitter:image" content="https://.../og-image.jpg">

<!-- Mobile & PWA -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#3B82F6">
<meta name="apple-mobile-web-app-capable" content="yes">

<!-- Canonical URL -->
<link rel="canonical" href="https://.../joao-silva">
```

Todas as tags estão implementadas e otimizadas para SEO! 🚀
