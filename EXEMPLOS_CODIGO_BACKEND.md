# 💻 Exemplos de Código - Backend DocPage AI

Este documento contém exemplos práticos de implementação das funcionalidades principais do backend.

---

## 1. Servidor de Landing Pages (SSR)

```typescript
// server/landing-page-server.ts
import express from 'express';
import { renderToString } from 'react-dom/server';
import { getLandingPageBySubdomain } from './services/landing-page-service';
import { generateMetaTags } from './utils/seo-generator';
import { generateSchemaMarkup } from './utils/schema-generator';
import { recordPageView } from './services/analytics-service';
import React from 'react';
import { Preview } from '../frontend/components/Preview'; // Componente React

const app = express();

// Middleware para extrair subdomínio
app.use((req, res, next) => {
  const hostname = req.hostname || req.headers.host || '';
  const subdomain = hostname.split('.')[0];
  req.subdomain = subdomain;
  next();
});

// Rota principal - renderiza landing page
app.get('*', async (req, res) => {
  try {
    const { subdomain } = req;
    
    // Buscar landing page no banco
    const landingPage = await getLandingPageBySubdomain(subdomain);
    
    if (!landingPage) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Página não encontrada</title></head>
          <body><h1>404 - Página não encontrada</h1></body>
        </html>
      `);
    }
    
    if (landingPage.status !== 'published') {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Página não disponível</title></head>
          <body><h1>Esta página ainda não foi publicada</h1></body>
        </html>
      `);
    }
    
    // Gerar meta tags SEO
    const metaTags = generateMetaTags(landingPage);
    
    // Gerar Schema.org markup
    const schemaMarkup = generateSchemaMarkup(landingPage);
    
    // Renderizar componente React para HTML
    const appHtml = renderToString(
      React.createElement(Preview, {
        content: landingPage.content_data,
        design: landingPage.design_settings,
        visibility: landingPage.section_visibility,
        photoUrl: landingPage.photo_url,
        aboutPhotoUrl: landingPage.about_photo_url,
        briefing: landingPage.briefing_data,
        layoutVariant: landingPage.layout_variant
      })
    );
    
    // HTML completo com SEO
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          
          <!-- SEO Meta Tags -->
          <title>${metaTags.title}</title>
          <meta name="description" content="${metaTags.description}">
          <meta name="keywords" content="${metaTags.keywords}">
          
          <!-- Open Graph -->
          <meta property="og:title" content="${metaTags.og.title}">
          <meta property="og:description" content="${metaTags.og.description}">
          <meta property="og:image" content="${metaTags.og.image}">
          <meta property="og:url" content="${metaTags.og.url}">
          <meta property="og:type" content="${metaTags.og.type}">
          
          <!-- Twitter Card -->
          <meta name="twitter:card" content="${metaTags.twitter.card}">
          <meta name="twitter:title" content="${metaTags.twitter.title}">
          <meta name="twitter:description" content="${metaTags.twitter.description}">
          <meta name="twitter:image" content="${metaTags.twitter.image}">
          
          <!-- Schema.org JSON-LD -->
          <script type="application/ld+json">
            ${JSON.stringify(schemaMarkup)}
          </script>
          
          <!-- Canonical URL -->
          <link rel="canonical" href="${metaTags.og.url}">
          
          <!-- Favicon -->
          <link rel="icon" type="image/x-icon" href="/favicon.ico">
          
          <!-- CSS (Tailwind ou CSS customizado) -->
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
          <div id="root">${appHtml}</div>
          
          <!-- Hydration Script -->
          <script>
            window.__LANDING_PAGE_DATA__ = ${JSON.stringify({
              content: landingPage.content_data,
              design: landingPage.design_settings,
              visibility: landingPage.section_visibility,
              photoUrl: landingPage.photo_url,
              aboutPhotoUrl: landingPage.about_photo_url,
              briefing: landingPage.briefing_data,
              layoutVariant: landingPage.layout_variant
            })};
          </script>
          <script src="/client.js"></script>
          
          <!-- Analytics -->
          <script>
            // Registrar page view
            fetch('/api/analytics/event', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                landingPageId: '${landingPage.id}',
                eventType: 'page_view',
                url: window.location.href
              })
            });
          </script>
        </body>
      </html>
    `;
    
    res.send(html);
    
    // Registrar analytics (async, não bloqueia resposta)
    recordPageView(landingPage.id, req).catch(console.error);
    
  } catch (error) {
    console.error('Erro ao renderizar landing page:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Erro</title></head>
        <body><h1>Erro ao carregar página</h1></body>
      </html>
    `);
  }
});

// Sitemap.xml
app.get('/sitemap.xml', async (req, res) => {
  const { subdomain } = req;
  const landingPage = await getLandingPageBySubdomain(subdomain);
  
  if (!landingPage) {
    return res.status(404).send('');
  }
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${landingPage.subdomain}.docpage.com.br</loc>
    <lastmod>${new Date(landingPage.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
  
  res.set('Content-Type', 'text/xml');
  res.send(sitemap);
});

// Robots.txt
app.get('/robots.txt', async (req, res) => {
  const { subdomain } = req;
  const landingPage = await getLandingPageBySubdomain(subdomain);
  
  if (!landingPage) {
    return res.status(404).send('');
  }
  
  const robots = `User-agent: *
Allow: /
Sitemap: https://${landingPage.subdomain}.docpage.com.br/sitemap.xml`;
  
  res.set('Content-Type', 'text/plain');
  res.send(robots);
});

const PORT = process.env.LANDING_PAGE_PORT || 5000;
app.listen(PORT, () => {
  console.log(`Landing Page Server rodando na porta ${PORT}`);
});
```

---

## 2. Service de Landing Pages

```typescript
// server/services/landing-page.service.ts
import { PrismaClient } from '@prisma/client';
import { LandingPage, BriefingData, LandingPageContent } from '../types';

const prisma = new PrismaClient();

export async function getLandingPageBySubdomain(
  subdomain: string
): Promise<LandingPage | null> {
  return await prisma.landingPage.findUnique({
    where: { subdomain },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
}

export async function createLandingPage(
  userId: string,
  data: {
    subdomain: string;
    briefing: BriefingData;
    content: LandingPageContent;
    design: any;
    visibility: any;
    layoutVariant: number;
  }
): Promise<LandingPage> {
  // Validar subdomínio
  if (!isValidSubdomain(data.subdomain)) {
    throw new Error('Subdomínio inválido');
  }
  
  // Verificar disponibilidade
  const exists = await prisma.landingPage.findUnique({
    where: { subdomain: data.subdomain }
  });
  
  if (exists) {
    throw new Error('Subdomínio já está em uso');
  }
  
  // Gerar slug único
  const slug = generateSlug(data.subdomain);
  
  // Criar landing page
  return await prisma.landingPage.create({
    data: {
      user_id: userId,
      subdomain: data.subdomain,
      slug,
      briefing_data: data.briefing,
      content_data: data.content,
      design_settings: data.design,
      section_visibility: data.visibility,
      layout_variant: data.layoutVariant,
      status: 'draft',
      meta_title: generateMetaTitle(data.briefing, data.content),
      meta_description: generateMetaDescription(data.content),
      meta_keywords: generateKeywords(data.briefing)
    }
  });
}

export async function updateLandingPage(
  id: string,
  userId: string,
  updates: Partial<LandingPage>
): Promise<LandingPage> {
  // Verificar ownership
  const landingPage = await prisma.landingPage.findFirst({
    where: { id, user_id: userId }
  });
  
  if (!landingPage) {
    throw new Error('Landing page não encontrada ou sem permissão');
  }
  
  return await prisma.landingPage.update({
    where: { id },
    data: {
      ...updates,
      updated_at: new Date()
    }
  });
}

export async function publishLandingPage(
  id: string,
  userId: string
): Promise<LandingPage> {
  const landingPage = await updateLandingPage(id, userId, {
    status: 'published',
    published_at: new Date()
  });
  
  // Invalidar cache se houver
  // invalidateCache(landingPage.subdomain);
  
  return landingPage;
}

// Helpers
function isValidSubdomain(subdomain: string): boolean {
  // Apenas letras, números e hífens
  const regex = /^[a-z0-9-]+$/;
  if (!regex.test(subdomain)) return false;
  
  // Não pode começar ou terminar com hífen
  if (subdomain.startsWith('-') || subdomain.endsWith('-')) return false;
  
  // Tamanho mínimo e máximo
  if (subdomain.length < 3 || subdomain.length > 63) return false;
  
  return true;
}

function generateSlug(subdomain: string): string {
  return subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

function generateMetaTitle(
  briefing: BriefingData,
  content: LandingPageContent
): string {
  return `${briefing.name} - ${briefing.specialty} | Agende sua consulta`;
}

function generateMetaDescription(
  content: LandingPageContent
): string {
  return content.subheadline || 
    `Agende sua consulta com ${content.headline}`;
}

function generateKeywords(briefing: BriefingData): string[] {
  return [
    briefing.name,
    briefing.specialty,
    briefing.crmState,
    'médico',
    'consulta',
    'agendamento'
  ];
}
```

---

## 3. Gerador de SEO

```typescript
// server/utils/seo-generator.ts
import { LandingPage, BriefingData, LandingPageContent } from '../types';

export interface MetaTags {
  title: string;
  description: string;
  keywords: string;
  og: {
    title: string;
    description: string;
    image: string;
    url: string;
    type: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image: string;
  };
}

export function generateMetaTags(landingPage: LandingPage): MetaTags {
  const { briefing_data, content_data, meta_title, meta_description, 
          meta_keywords, photo_url, subdomain } = landingPage;
  
  const briefing = briefing_data as BriefingData;
  const content = content_data as LandingPageContent;
  
  const title = meta_title || 
    `${briefing.name} - ${briefing.specialty} | Agende sua consulta`;
  
  const description = meta_description || 
    content.subheadline || 
    `Dr(a). ${briefing.name}, especialista em ${briefing.specialty}. Agende sua consulta online.`;
  
  const keywords = meta_keywords?.join(', ') || [
    briefing.name,
    briefing.specialty,
    briefing.crmState,
    'médico',
    'consulta médica',
    'agendamento online'
  ].join(', ');
  
  const url = `https://${subdomain}.docpage.com.br`;
  const image = photo_url || '/default-og-image.jpg';
  
  return {
    title,
    description,
    keywords,
    og: {
      title,
      description,
      image,
      url,
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      image
    }
  };
}

export function generateSchemaMarkup(landingPage: LandingPage) {
  const { briefing_data, content_data, photo_url, subdomain } = landingPage;
  const briefing = briefing_data as BriefingData;
  const content = content_data as LandingPageContent;
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "Physician",
    "name": briefing.name,
    "medicalSpecialty": {
      "@type": "MedicalSpecialty",
      "name": briefing.specialty
    },
    "description": content.aboutBody || content.subheadline,
    "image": photo_url,
    "url": `https://${subdomain}.docpage.com.br`,
    "telephone": content.contactPhone || briefing.contactPhone,
    "email": content.contactEmail || briefing.contactEmail,
    "address": content.contactAddresses?.map((addr: string) => ({
      "@type": "PostalAddress",
      "streetAddress": addr,
      "addressLocality": briefing.crmState,
      "addressCountry": "BR"
    })) || [],
    "priceRange": "$$",
    "areaServed": {
      "@type": "City",
      "name": briefing.crmState
    }
  };
  
  // Adicionar informações de credenciais se disponíveis
  if (briefing.crm) {
    schema['credential'] = {
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "MedicalLicense",
      "identifier": `CRM-${briefing.crmState}-${briefing.crm}`
    };
  }
  
  return schema;
}
```

---

## 4. Controller de Landing Pages

```typescript
// server/controllers/landing-page.controller.ts
import { Request, Response } from 'express';
import {
  createLandingPage,
  getLandingPageBySubdomain,
  updateLandingPage,
  publishLandingPage
} from '../services/landing-page-service';

export async function createLandingPageController(
  req: Request,
  res: Response
) {
  try {
    const userId = req.user.id; // Do middleware de autenticação
    const {
      subdomain,
      briefing,
      content,
      design,
      visibility,
      layoutVariant
    } = req.body;
    
    // Validação
    if (!subdomain || !briefing || !content) {
      return res.status(400).json({
        error: 'Campos obrigatórios faltando'
      });
    }
    
    const landingPage = await createLandingPage(userId, {
      subdomain,
      briefing,
      content,
      design,
      visibility,
      layoutVariant
    });
    
    res.status(201).json({
      success: true,
      data: landingPage
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message
    });
  }
}

export async function getLandingPageController(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const landingPage = await prisma.landingPage.findFirst({
      where: {
        id,
        user_id: userId
      }
    });
    
    if (!landingPage) {
      return res.status(404).json({
        error: 'Landing page não encontrada'
      });
    }
    
    res.json({
      success: true,
      data: landingPage
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao buscar landing page'
    });
  }
}

export async function publishLandingPageController(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const landingPage = await publishLandingPage(id, userId);
    
    res.json({
      success: true,
      data: landingPage,
      message: 'Landing page publicada com sucesso!'
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message
    });
  }
}
```

---

## 5. Service de Analytics

```typescript
// server/services/analytics.service.ts
import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

const prisma = new PrismaClient();

export async function recordPageView(
  landingPageId: string,
  req: Request
) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const referrer = req.headers['referer'] || null;
  
  await prisma.analyticsEvent.create({
    data: {
      landing_page_id: landingPageId,
      event_type: 'page_view',
      event_data: {
        path: req.path,
        query: req.query
      },
      ip_address: ip,
      user_agent: userAgent,
      referrer: referrer
    }
  });
  
  // Atualizar contador de views
  await prisma.landingPage.update({
    where: { id: landingPageId },
    data: {
      view_count: { increment: 1 },
      last_viewed_at: new Date()
    }
  });
}

export async function recordButtonClick(
  landingPageId: string,
  buttonId: string,
  req: Request
) {
  await prisma.analyticsEvent.create({
    data: {
      landing_page_id: landingPageId,
      event_type: 'button_click',
      event_data: {
        button_id: buttonId,
        button_text: req.body.buttonText
      },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    }
  });
}

export async function getAnalytics(
  landingPageId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = {
    landing_page_id: landingPageId
  };
  
  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) where.created_at.gte = startDate;
    if (endDate) where.created_at.lte = endDate;
  }
  
  const events = await prisma.analyticsEvent.findMany({
    where,
    orderBy: { created_at: 'desc' }
  });
  
  // Agregar dados
  const pageViews = events.filter(e => e.event_type === 'page_view').length;
  const buttonClicks = events.filter(e => e.event_type === 'button_click').length;
  
  return {
    totalEvents: events.length,
    pageViews,
    buttonClicks,
    conversionRate: pageViews > 0 ? (buttonClicks / pageViews) * 100 : 0,
    events
  };
}
```

---

## 6. Validação de Subdomínio

```typescript
// server/utils/subdomain-validator.ts
export function validateSubdomain(subdomain: string): {
  valid: boolean;
  error?: string;
} {
  // Verificar se está vazio
  if (!subdomain || subdomain.trim().length === 0) {
    return {
      valid: false,
      error: 'Subdomínio não pode estar vazio'
    };
  }
  
  // Converter para minúsculas
  const normalized = subdomain.toLowerCase().trim();
  
  // Verificar caracteres permitidos (apenas letras, números e hífens)
  if (!/^[a-z0-9-]+$/.test(normalized)) {
    return {
      valid: false,
      error: 'Subdomínio pode conter apenas letras, números e hífens'
    };
  }
  
  // Não pode começar ou terminar com hífen
  if (normalized.startsWith('-') || normalized.endsWith('-')) {
    return {
      valid: false,
      error: 'Subdomínio não pode começar ou terminar com hífen'
    };
  }
  
  // Tamanho mínimo
  if (normalized.length < 3) {
    return {
      valid: false,
      error: 'Subdomínio deve ter pelo menos 3 caracteres'
    };
  }
  
  // Tamanho máximo (limite DNS)
  if (normalized.length > 63) {
    return {
      valid: false,
      error: 'Subdomínio não pode ter mais de 63 caracteres'
    };
  }
  
  // Palavras reservadas
  const reserved = [
    'www', 'api', 'admin', 'app', 'mail', 'ftp', 'localhost',
    'test', 'staging', 'dev', 'development', 'production'
  ];
  
  if (reserved.includes(normalized)) {
    return {
      valid: false,
      error: 'Este subdomínio está reservado'
    };
  }
  
  return { valid: true };
}
```

---

## 7. Docker Compose para Desenvolvimento

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: docpage
      POSTGRES_PASSWORD: docpage_dev
      POSTGRES_DB: docpage_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  backend:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://docpage:docpage_dev@postgres:5432/docpage_db
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-secret-key
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules
  
  landing-page-server:
    build: ./landing-page-server
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://docpage:docpage_dev@postgres:5432/docpage_db
    depends_on:
      - postgres
      - backend

volumes:
  postgres_data:
```

---

Estes exemplos fornecem uma base sólida para começar a implementação do backend. Adapte conforme suas necessidades específicas!
