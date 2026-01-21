# 🚀 Plano de Implementação do Backend - DocPage AI

## 📋 Visão Geral

Este documento descreve o plano completo para implementar o backend que permitirá:
- ✅ Armazenar landing pages criadas pelos usuários
- ✅ Servir landing pages em subdomínios (ex: `dr-joao-silva.docpage.com.br`)
- ✅ Implementar SEO robusto para cada landing page
- ✅ Gerenciar domínios e subdomínios
- ✅ API para criação, edição e publicação de landing pages

---

## 🏗️ Arquitetura Proposta

### Stack Tecnológica Recomendada

#### Backend API
- **Node.js** com **Express** ou **Fastify** (alta performance)
- **TypeScript** (consistência com frontend)
- **Prisma** ou **TypeORM** (ORM para banco de dados)
- **PostgreSQL** (banco de dados principal)
- **Redis** (cache e sessões)

#### Infraestrutura
- **Nginx** (reverse proxy e roteamento de subdomínios)
- **Docker** (containerização)
- **AWS/GCP/Azure** ou **VPS** (hospedagem)
- **Cloudflare** (CDN, SSL automático, proteção DDoS)

#### SEO e Performance
- **Next.js** ou **React SSR** (renderização server-side)
- **Sitemap.xml** dinâmico
- **robots.txt** por subdomínio
- **Schema.org** (dados estruturados JSON-LD)
- **Open Graph** e **Twitter Cards**

---

## 📊 Modelo de Dados

### Schema do Banco de Dados

```sql
-- Tabela de Usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Landing Pages
CREATE TABLE landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Identificação
  subdomain VARCHAR(100) UNIQUE NOT NULL, -- ex: "dr-joao-silva"
  custom_domain VARCHAR(255) UNIQUE, -- ex: "drjoaosilva.com.br" (opcional)
  slug VARCHAR(255) UNIQUE NOT NULL, -- identificador único
  
  -- Dados do Briefing
  briefing_data JSONB NOT NULL, -- BriefingData completo
  
  -- Conteúdo Gerado
  content_data JSONB NOT NULL, -- LandingPageContent completo
  
  -- Configurações de Design
  design_settings JSONB NOT NULL, -- DesignSettings completo
  section_visibility JSONB NOT NULL, -- SectionVisibility completo
  layout_variant INTEGER NOT NULL DEFAULT 1, -- LayoutVariant
  
  -- Fotos
  photo_url TEXT, -- URL da foto de perfil
  about_photo_url TEXT, -- URL da foto do consultório
  photo_storage_path TEXT, -- caminho no storage
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT[],
  og_image_url TEXT,
  schema_markup JSONB, -- dados estruturados Schema.org
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, archived
  published_at TIMESTAMP,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Índices
  INDEX idx_subdomain (subdomain),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_published_at (published_at)
);

-- Tabela de Planos/Assinaturas
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  landing_page_id UUID REFERENCES landing_pages(id) ON DELETE CASCADE,
  
  plan_type VARCHAR(50) NOT NULL, -- basic, professional, enterprise
  price DECIMAL(10, 2) NOT NULL,
  billing_period VARCHAR(20) NOT NULL, -- monthly, yearly
  
  status VARCHAR(50) DEFAULT 'active', -- active, cancelled, expired
  starts_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Analytics
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID REFERENCES landing_pages(id) ON DELETE CASCADE,
  
  event_type VARCHAR(50) NOT NULL, -- page_view, button_click, form_submit
  event_data JSONB,
  
  -- Informações do visitante
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Geolocalização
  country VARCHAR(2),
  city VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_landing_page_id (landing_page_id),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at)
);

-- Tabela de Domínios Customizados
CREATE TABLE custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID REFERENCES landing_pages(id) ON DELETE CASCADE,
  
  domain VARCHAR(255) UNIQUE NOT NULL,
  ssl_certificate_path TEXT,
  ssl_status VARCHAR(50) DEFAULT 'pending', -- pending, active, expired
  
  dns_configured BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔌 API Endpoints

### Autenticação
```
POST   /api/auth/register       - Registrar novo usuário
POST   /api/auth/login          - Login
POST   /api/auth/logout         - Logout
GET    /api/auth/me             - Obter usuário atual
```

### Landing Pages
```
GET    /api/landing-pages                    - Listar landing pages do usuário
POST   /api/landing-pages                    - Criar nova landing page
GET    /api/landing-pages/:id                - Obter landing page específica
PUT    /api/landing-pages/:id                - Atualizar landing page
DELETE /api/landing-pages/:id                - Deletar landing page
POST   /api/landing-pages/:id/publish        - Publicar landing page
POST   /api/landing-pages/:id/unpublish      - Despublicar landing page
```

### Domínios
```
GET    /api/domains/check/:subdomain         - Verificar disponibilidade de subdomínio
POST   /api/domains/custom                   - Adicionar domínio customizado
GET    /api/domains/custom/:id/verify        - Verificar configuração DNS
DELETE /api/domains/custom/:id               - Remover domínio customizado
```

### Analytics
```
GET    /api/analytics/:landingPageId         - Obter analytics de uma landing page
GET    /api/analytics/:landingPageId/events  - Obter eventos de analytics
POST   /api/analytics/event                 - Registrar evento (público)
```

### SEO
```
GET    /api/seo/:landingPageId/sitemap       - Gerar sitemap.xml
GET    /api/seo/:landingPageId/robots       - Gerar robots.txt
GET    /api/seo/:landingPageId/metadata     - Obter metadados SEO
```

---

## 🌐 Sistema de Subdomínios

### Configuração Nginx

```nginx
# /etc/nginx/sites-available/docpage.conf

# Servidor principal (app.docpage.com.br)
server {
    listen 80;
    server_name app.docpage.com.br www.app.docpage.com.br;
    
    location / {
        proxy_pass http://localhost:3000; # Frontend React
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# API Backend
server {
    listen 80;
    server_name api.docpage.com.br;
    
    location / {
        proxy_pass http://localhost:4000; # Backend API
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Wildcard para subdomínios das landing pages
server {
    listen 80;
    server_name *.docpage.com.br;
    
    # Resolver subdomínio dinamicamente
    set $subdomain "";
    if ($host ~* ^([^.]+)\.docpage\.com\.br$) {
        set $subdomain $1;
    }
    
    location / {
        proxy_pass http://localhost:5000; # Servidor de landing pages
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Subdomain $subdomain;
    }
}
```

### Servidor de Landing Pages (Node.js)

```typescript
// server/landing-page-server.ts
import express from 'express';
import { getLandingPageBySubdomain } from './services/landing-page-service';

const app = express();

app.get('*', async (req, res) => {
  const subdomain = req.headers['x-subdomain'] || 
                    req.hostname.split('.')[0];
  
  try {
    const landingPage = await getLandingPageBySubdomain(subdomain);
    
    if (!landingPage || landingPage.status !== 'published') {
      return res.status(404).send('Página não encontrada');
    }
    
    // Renderizar React SSR com dados da landing page
    const html = await renderLandingPage(landingPage);
    res.send(html);
    
    // Registrar analytics
    await recordPageView(landingPage.id, req);
  } catch (error) {
    res.status(500).send('Erro ao carregar página');
  }
});
```

---

## 🔍 SEO Robusto - Implementação

### 1. Meta Tags Dinâmicas

```typescript
// server/utils/seo-generator.ts
export function generateMetaTags(landingPage: LandingPage) {
  const { briefing, content, meta_title, meta_description } = landingPage;
  
  const title = meta_title || 
    `${briefing.name} - ${briefing.specialty} | Agende sua consulta`;
  
  const description = meta_description || 
    content.subheadline || 
    `Dr(a). ${briefing.name}, especialista em ${briefing.specialty}. Agende sua consulta.`;
  
  return {
    title,
    description,
    keywords: [
      briefing.name,
      briefing.specialty,
      briefing.crmState,
      ...(meta_keywords || [])
    ].join(', '),
    og: {
      title,
      description,
      image: landingPage.og_image_url || landingPage.photo_url,
      url: `https://${landingPage.subdomain}.docpage.com.br`,
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      image: landingPage.og_image_url || landingPage.photo_url
    }
  };
}
```

### 2. Schema.org (Dados Estruturados)

```typescript
// server/utils/schema-generator.ts
export function generateSchemaMarkup(landingPage: LandingPage) {
  const { briefing, content, contactEmail, contactPhone, contactAddresses } = landingPage;
  
  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    "name": briefing.name,
    "medicalSpecialty": briefing.specialty,
    "description": content.aboutBody,
    "image": landingPage.photo_url,
    "url": `https://${landingPage.subdomain}.docpage.com.br`,
    "telephone": contactPhone,
    "email": contactEmail,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": contactAddresses?.[0] || "",
      "addressLocality": briefing.crmState,
      "addressCountry": "BR"
    },
    "sameAs": [
      // Redes sociais se houver
    ],
    "priceRange": "$$",
    "areaServed": {
      "@type": "City",
      "name": briefing.crmState
    }
  };
}
```

### 3. Sitemap.xml Dinâmico

```typescript
// server/routes/seo.ts
app.get('/sitemap.xml', async (req, res) => {
  const subdomain = extractSubdomain(req);
  const landingPage = await getLandingPageBySubdomain(subdomain);
  
  if (!landingPage) return res.status(404).send('');
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${landingPage.subdomain}.docpage.com.br</loc>
    <lastmod>${landingPage.updated_at.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
  
  res.set('Content-Type', 'text/xml');
  res.send(sitemap);
});
```

### 4. Robots.txt Dinâmico

```typescript
// server/routes/seo.ts
app.get('/robots.txt', async (req, res) => {
  const subdomain = extractSubdomain(req);
  const landingPage = await getLandingPageBySubdomain(subdomain);
  
  const robots = `User-agent: *
Allow: /
Sitemap: https://${landingPage.subdomain}.docpage.com.br/sitemap.xml`;
  
  res.set('Content-Type', 'text/plain');
  res.send(robots);
});
```

### 5. Performance e Core Web Vitals

- **Lazy Loading** de imagens
- **Preload** de recursos críticos
- **Compressão** de imagens (WebP)
- **CDN** para assets estáticos
- **Service Worker** para cache
- **Minificação** de CSS/JS

---

## 📁 Estrutura de Arquivos do Backend

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── env.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── landing-page.controller.ts
│   │   ├── domain.controller.ts
│   │   ├── analytics.controller.ts
│   │   └── seo.controller.ts
│   ├── services/
│   │   ├── landing-page.service.ts
│   │   ├── domain.service.ts
│   │   ├── storage.service.ts (S3/Cloud Storage)
│   │   ├── seo.service.ts
│   │   └── analytics.service.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── LandingPage.ts
│   │   ├── Subscription.ts
│   │   └── AnalyticsEvent.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── landing-page.routes.ts
│   │   ├── domain.routes.ts
│   │   ├── analytics.routes.ts
│   │   └── seo.routes.ts
│   ├── utils/
│   │   ├── seo-generator.ts
│   │   ├── schema-generator.ts
│   │   ├── subdomain-extractor.ts
│   │   └── image-optimizer.ts
│   ├── types/
│   │   └── index.ts
│   └── app.ts
├── prisma/
│   └── schema.prisma
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── nginx/
│   └── docpage.conf
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🚀 Passos de Implementação

### Fase 1: Setup Inicial (Semana 1)
- [ ] Configurar projeto Node.js/TypeScript
- [ ] Configurar banco de dados PostgreSQL
- [ ] Configurar Prisma/TypeORM
- [ ] Criar modelos de dados
- [ ] Configurar autenticação (JWT)
- [ ] Setup Docker básico

### Fase 2: API Core (Semana 2-3)
- [ ] Implementar endpoints de autenticação
- [ ] Implementar CRUD de landing pages
- [ ] Implementar upload de imagens (S3/Cloud Storage)
- [ ] Implementar validação de subdomínios
- [ ] Testes unitários básicos

### Fase 3: Sistema de Subdomínios (Semana 4)
- [ ] Configurar Nginx com wildcard
- [ ] Criar servidor de landing pages (SSR)
- [ ] Implementar roteamento dinâmico
- [ ] Testar subdomínios em desenvolvimento

### Fase 4: SEO (Semana 5)
- [ ] Implementar geração de meta tags
- [ ] Implementar Schema.org
- [ ] Implementar sitemap.xml dinâmico
- [ ] Implementar robots.txt
- [ ] Otimizar imagens e performance

### Fase 5: Analytics e Domínios Customizados (Semana 6)
- [ ] Implementar sistema de analytics
- [ ] Implementar tracking de eventos
- [ ] Implementar suporte a domínios customizados
- [ ] Integração com serviços de DNS

### Fase 6: Deploy e Infraestrutura (Semana 7)
- [ ] Configurar ambiente de produção
- [ ] Setup SSL automático (Let's Encrypt)
- [ ] Configurar CDN (Cloudflare)
- [ ] Monitoramento e logs
- [ ] Backup automático do banco

### Fase 7: Testes e Otimização (Semana 8)
- [ ] Testes de carga
- [ ] Otimização de queries
- [ ] Cache com Redis
- [ ] Documentação da API
- [ ] Testes end-to-end

---

## 🔐 Segurança

### Implementações Necessárias

1. **Autenticação**
   - JWT com refresh tokens
   - Rate limiting
   - CORS configurado

2. **Validação**
   - Validação de entrada (Zod/Yup)
   - Sanitização de dados
   - Proteção contra SQL injection (ORM)

3. **Subdomínios**
   - Validação de caracteres permitidos
   - Proteção contra subdomain takeover
   - Rate limiting por subdomínio

4. **Uploads**
   - Validação de tipo de arquivo
   - Limite de tamanho
   - Scan de vírus (opcional)

5. **SSL/TLS**
   - Certificados automáticos (Let's Encrypt)
   - HSTS headers
   - TLS 1.3

---

## 📈 Monitoramento e Analytics

### Métricas a Implementar

1. **Performance**
   - Tempo de resposta da API
   - Tempo de carregamento das landing pages
   - Core Web Vitals

2. **Uso**
   - Landing pages criadas
   - Landing pages publicadas
   - Tráfego por subdomínio

3. **Erros**
   - Logs de erros
   - Alertas de downtime
   - Monitoramento de banco de dados

### Ferramentas Recomendadas
- **Sentry** (erros)
- **New Relic** ou **Datadog** (APM)
- **Google Analytics** (opcional)
- **Plausible** (analytics privado)

---

## 💰 Considerações de Custos

### Infraestrutura Estimada (Mensal)

- **VPS/Cloud**: $20-50 (dependendo do tráfego)
- **PostgreSQL**: $0-25 (managed service)
- **Storage (S3)**: $5-20 (imagens)
- **CDN (Cloudflare)**: $0-20 (plano Pro opcional)
- **Domínio**: $10-15/ano
- **SSL**: Grátis (Let's Encrypt)

**Total estimado**: $35-120/mês inicialmente

---

## 🎯 Próximos Passos

1. **Revisar este plano** e ajustar conforme necessário
2. **Escolher stack tecnológica** definitiva
3. **Criar repositório** separado para o backend
4. **Começar pela Fase 1** (Setup Inicial)
5. **Integrar com frontend** existente progressivamente

---

## 📚 Recursos Úteis

- [Prisma Documentation](https://www.prisma.io/docs)
- [Nginx Subdomain Routing](https://nginx.org/en/docs/http/server_names.html)
- [Schema.org Medical Types](https://schema.org/Physician)
- [Google Search Central](https://developers.google.com/search)
- [Core Web Vitals](https://web.dev/vitals/)

---

**Documento criado em**: 2026
**Versão**: 1.0
**Autor**: Plano de Implementação DocPage AI
