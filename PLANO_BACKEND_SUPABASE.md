# 🚀 Plano de Backend com Supabase - DocPage AI

## 📋 Visão Geral

Este documento descreve a implementação do backend usando **Supabase** como solução inicial. O Supabase oferece PostgreSQL gerenciado, autenticação, storage e API REST automática, ideal para MVP e crescimento inicial.

---

## ✅ Por que Supabase?

### Vantagens
- ✅ **PostgreSQL gerenciado** (banco de dados robusto)
- ✅ **Autenticação pronta** (email, OAuth, magic links)
- ✅ **Storage para imagens** (S3-compatible)
- ✅ **API REST automática** (gerada automaticamente)
- ✅ **Real-time subscriptions** (WebSockets)
- ✅ **Free tier generoso** (500MB database, 1GB storage)
- ✅ **Row Level Security (RLS)** (segurança nativa)
- ✅ **Edge Functions** (serverless functions)
- ✅ **Dashboard visual** (gerenciamento fácil)
- ✅ **TypeScript SDK** (tipagem automática)

### Limitações
- ⚠️ Free tier tem limites (500MB DB, 1GB storage)
- ⚠️ Menos controle sobre infraestrutura
- ⚠️ Vendor lock-in (mas PostgreSQL é padrão)
- ⚠️ Customizações avançadas podem ser limitadas

---

## 🏗️ Arquitetura com Supabase

```
┌─────────────────┐
│   Frontend      │
│   (React/Vite)  │
└────────┬────────┘
         │
         ├─── Supabase Client SDK
         │
┌────────▼────────────────────────────┐
│         SUPABASE                    │
│  ┌──────────────────────────────┐  │
│  │  PostgreSQL Database         │  │
│  │  - landing_pages            │  │
│  │  - users                     │  │
│  │  - analytics_events           │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  Authentication              │  │
│  │  - Email/Password            │  │
│  │  - OAuth (Google, etc)       │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  Storage                     │  │
│  │  - photos/                   │  │
│  │  - about-photos/             │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  Edge Functions (Opcional)  │  │
│  │  - generate-seo             │  │
│  │  - publish-landing-page     │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
         │
         ├─── Custom Domain
         │    (Nginx/Cloudflare)
         │
┌────────▼────────┐
│  Subdomínios    │
│  *.docpage.com  │
└─────────────────┘
```

---

## 📊 Schema do Banco de Dados (Supabase)

### SQL para criar as tabelas

```sql
-- Habilitar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para busca full-text

-- Tabela de Landing Pages
CREATE TABLE landing_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identificação
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  custom_domain VARCHAR(255) UNIQUE,
  slug VARCHAR(255) UNIQUE NOT NULL,
  
  -- Dados (JSONB para flexibilidade)
  briefing_data JSONB NOT NULL,
  content_data JSONB NOT NULL,
  design_settings JSONB NOT NULL,
  section_visibility JSONB NOT NULL,
  layout_variant INTEGER NOT NULL DEFAULT 1,
  
  -- Fotos (URLs do Storage)
  photo_url TEXT,
  about_photo_url TEXT,
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT[],
  og_image_url TEXT,
  schema_markup JSONB,
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_landing_pages_subdomain ON landing_pages(subdomain);
CREATE INDEX idx_landing_pages_user_id ON landing_pages(user_id);
CREATE INDEX idx_landing_pages_status ON landing_pages(status);
CREATE INDEX idx_landing_pages_published_at ON landing_pages(published_at);
CREATE INDEX idx_landing_pages_created_at ON landing_pages(created_at DESC);

-- Índice GIN para busca em JSONB
CREATE INDEX idx_landing_pages_briefing_gin ON landing_pages USING GIN (briefing_data);
CREATE INDEX idx_landing_pages_content_gin ON landing_pages USING GIN (content_data);

-- Tabela de Analytics
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landing_page_id UUID REFERENCES landing_pages(id) ON DELETE CASCADE,
  
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  
  -- Informações do visitante
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Geolocalização
  country VARCHAR(2),
  city VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_landing_page_id ON analytics_events(landing_page_id);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at DESC);

-- Tabela de Domínios Customizados
CREATE TABLE custom_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landing_page_id UUID REFERENCES landing_pages(id) ON DELETE CASCADE,
  
  domain VARCHAR(255) UNIQUE NOT NULL,
  ssl_status VARCHAR(50) DEFAULT 'pending',
  dns_configured BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_landing_pages_updated_at 
  BEFORE UPDATE ON landing_pages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_domains_updated_at 
  BEFORE UPDATE ON custom_domains 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 🔐 Row Level Security (RLS) Policies

### Políticas de Segurança

```sql
-- Habilitar RLS
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;

-- Landing Pages: Usuários só podem ver/editar suas próprias páginas
CREATE POLICY "Users can view own landing pages"
  ON landing_pages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own landing pages"
  ON landing_pages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own landing pages"
  ON landing_pages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own landing pages"
  ON landing_pages FOR DELETE
  USING (auth.uid() = user_id);

-- Landing Pages públicas: Qualquer um pode ler páginas publicadas
CREATE POLICY "Public can view published landing pages"
  ON landing_pages FOR SELECT
  USING (status = 'published');

-- Analytics: Usuários podem ver analytics de suas próprias páginas
CREATE POLICY "Users can view own analytics"
  ON analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM landing_pages
      WHERE landing_pages.id = analytics_events.landing_page_id
      AND landing_pages.user_id = auth.uid()
    )
  );

-- Analytics: Qualquer um pode inserir eventos (para tracking público)
CREATE POLICY "Public can insert analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- Custom Domains: Usuários só podem gerenciar seus próprios domínios
CREATE POLICY "Users can manage own custom domains"
  ON custom_domains FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM landing_pages
      WHERE landing_pages.id = custom_domains.landing_page_id
      AND landing_pages.user_id = auth.uid()
    )
  );
```

---

## 📦 Setup do Supabase

### 1. Criar Projeto Supabase

1. Acesse: https://supabase.com
2. Crie uma conta (grátis)
3. Crie um novo projeto
4. Anote as credenciais:
   - Project URL
   - anon/public key
   - service_role key (secret)

### 2. Instalar Dependências no Frontend

```bash
npm install @supabase/supabase-js
```

### 3. Configurar Cliente Supabase

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos TypeScript (gerados automaticamente)
export type Database = {
  public: {
    Tables: {
      landing_pages: {
        Row: {
          id: string;
          user_id: string;
          subdomain: string;
          briefing_data: any;
          content_data: any;
          // ... outros campos
        };
        Insert: {
          // ... tipos para insert
        };
        Update: {
          // ... tipos para update
        };
      };
      // ... outras tabelas
    };
  };
};
```

### 4. Variáveis de Ambiente

```env
# .env.local
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

---

## 🔌 Integração com Frontend

### 1. Autenticação

```typescript
// services/auth.ts
import { supabase } from '../lib/supabase';

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
```

### 2. CRUD de Landing Pages

```typescript
// services/landing-pages.ts
import { supabase } from '../lib/supabase';
import { BriefingData, LandingPageContent, DesignSettings } from '../types';

export interface LandingPage {
  id: string;
  user_id: string;
  subdomain: string;
  briefing_data: BriefingData;
  content_data: LandingPageContent;
  design_settings: DesignSettings;
  section_visibility: any;
  layout_variant: number;
  photo_url: string | null;
  about_photo_url: string | null;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

// Criar landing page
export async function createLandingPage(data: {
  subdomain: string;
  briefing: BriefingData;
  content: LandingPageContent;
  design: DesignSettings;
  visibility: any;
  layoutVariant: number;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Validar subdomínio
  const { data: existing } = await supabase
    .from('landing_pages')
    .select('id')
    .eq('subdomain', data.subdomain)
    .single();

  if (existing) {
    throw new Error('Subdomínio já está em uso');
  }

  const { data: landingPage, error } = await supabase
    .from('landing_pages')
    .insert({
      user_id: user.id,
      subdomain: data.subdomain,
      slug: data.subdomain.toLowerCase(),
      briefing_data: data.briefing,
      content_data: data.content,
      design_settings: data.design,
      section_visibility: data.visibility,
      layout_variant: data.layoutVariant,
      status: 'draft',
      meta_title: `${data.briefing.name} - ${data.briefing.specialty}`,
      meta_description: data.content.subheadline,
    })
    .select()
    .single();

  if (error) throw error;
  return landingPage;
}

// Listar landing pages do usuário
export async function getMyLandingPages() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Obter landing page por subdomínio (público)
export async function getLandingPageBySubdomain(subdomain: string) {
  const { data, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('subdomain', subdomain)
    .eq('status', 'published')
    .single();

  if (error) throw error;
  return data;
}

// Atualizar landing page
export async function updateLandingPage(
  id: string,
  updates: Partial<LandingPage>
) {
  const { data, error } = await supabase
    .from('landing_pages')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Publicar landing page
export async function publishLandingPage(id: string) {
  return updateLandingPage(id, {
    status: 'published',
    published_at: new Date().toISOString(),
  });
}
```

### 3. Upload de Imagens

```typescript
// services/storage.ts
import { supabase } from '../lib/supabase';

export async function uploadPhoto(
  file: File,
  landingPageId: string,
  type: 'profile' | 'about'
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const fileExt = file.name.split('.').pop();
  const fileName = `${landingPageId}/${type}-${Date.now()}.${fileExt}`;
  const filePath = `photos/${fileName}`;

  // Upload para Supabase Storage
  const { data, error } = await supabase.storage
    .from('landing-page-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  // Obter URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('landing-page-photos')
    .getPublicUrl(filePath);

  return publicUrl;
}

// Deletar foto
export async function deletePhoto(filePath: string) {
  const { error } = await supabase.storage
    .from('landing-page-photos')
    .remove([filePath]);

  if (error) throw error;
}
```

### 4. Analytics

```typescript
// services/analytics.ts
import { supabase } from '../lib/supabase';

export async function recordPageView(landingPageId: string) {
  const { data, error } = await supabase
    .from('analytics_events')
    .insert({
      landing_page_id: landingPageId,
      event_type: 'page_view',
      event_data: {
        url: window.location.href,
        path: window.location.pathname,
      },
    });

  if (error) console.error('Erro ao registrar page view:', error);
}

export async function recordButtonClick(
  landingPageId: string,
  buttonId: string,
  buttonText: string
) {
  const { data, error } = await supabase
    .from('analytics_events')
    .insert({
      landing_page_id: landingPageId,
      event_type: 'button_click',
      event_data: {
        button_id: buttonId,
        button_text: buttonText,
      },
    });

  if (error) console.error('Erro ao registrar click:', error);
}

export async function getAnalytics(landingPageId: string) {
  const { data, error } = await supabase
    .from('analytics_events')
    .select('*')
    .eq('landing_page_id', landingPageId)
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) throw error;
  return data;
}
```

---

## 🌐 Sistema de Subdomínios com Supabase

### Opção 1: Edge Function (Recomendado)

Criar uma Edge Function no Supabase que serve as landing pages:

```typescript
// supabase/functions/serve-landing-page/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const url = new URL(req.url);
  const subdomain = url.hostname.split('.')[0];

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  // Buscar landing page
  const { data: landingPage, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('subdomain', subdomain)
    .eq('status', 'published')
    .single();

  if (error || !landingPage) {
    return new Response('Página não encontrada', { status: 404 });
  }

  // Renderizar HTML (usar template ou SSR)
  const html = renderLandingPage(landingPage);

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
});
```

### Opção 2: Nginx + API Supabase

Manter Nginx para roteamento e usar Supabase apenas como backend:

```nginx
# Nginx configuração
server {
    listen 80;
    server_name *.docpage.com.br;

    location / {
        proxy_pass http://localhost:3000; # Frontend React
        proxy_set_header Host $host;
        proxy_set_header X-Subdomain $subdomain;
    }
}
```

---

## 📊 Comparação: Supabase vs Backend Customizado

| Aspecto | Supabase | Backend Customizado |
|---------|----------|---------------------|
| **Setup** | ⭐⭐⭐⭐⭐ (5 min) | ⭐⭐⭐ (horas) |
| **Custo Inicial** | $0 (free tier) | $12-24/mês |
| **Escalabilidade** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Controle** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Customização** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Manutenção** | ⭐⭐⭐⭐⭐ (gerenciado) | ⭐⭐⭐ (você gerencia) |
| **Migração** | Fácil (PostgreSQL padrão) | N/A |

---

## 🚀 Plano de Implementação com Supabase

### Fase 1: Setup (Dia 1)
- [ ] Criar projeto Supabase
- [ ] Executar SQL para criar tabelas
- [ ] Configurar RLS policies
- [ ] Configurar Storage buckets
- [ ] Instalar SDK no frontend

### Fase 2: Autenticação (Dia 2-3)
- [ ] Integrar sign up/sign in
- [ ] Proteger rotas
- [ ] Adicionar middleware de auth

### Fase 3: CRUD Landing Pages (Dia 4-5)
- [ ] Criar service de landing pages
- [ ] Integrar com formulários existentes
- [ ] Implementar upload de imagens

### Fase 4: Publicação (Dia 6-7)
- [ ] Sistema de subdomínios
- [ ] Renderização de landing pages
- [ ] SEO básico

### Fase 5: Analytics (Dia 8-9)
- [ ] Tracking de eventos
- [ ] Dashboard de analytics
- [ ] Relatórios

---

## 💰 Custos com Supabase

### Free Tier
- ✅ 500MB database
- ✅ 1GB file storage
- ✅ 2GB bandwidth
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests

### Pro Plan ($25/mês)
- ✅ 8GB database
- ✅ 100GB file storage
- ✅ 250GB bandwidth
- ✅ Daily backups
- ✅ Email support

### Team Plan ($599/mês)
- Para empresas maiores

**Recomendação**: Começar com Free, migrar para Pro quando necessário.

---

## 🔄 Migração Futura

Se precisar migrar do Supabase para backend customizado:

1. **Exportar dados**: PostgreSQL dump
2. **Migrar storage**: S3/Cloud Storage
3. **Reimplementar auth**: JWT próprio
4. **Manter compatibilidade**: Mesma estrutura de dados

**Vantagem**: Supabase usa PostgreSQL padrão, migração é relativamente simples.

---

## ✅ Checklist de Implementação

### Setup Supabase
- [ ] Criar conta e projeto
- [ ] Configurar variáveis de ambiente
- [ ] Criar tabelas no banco
- [ ] Configurar RLS policies
- [ ] Criar buckets de storage

### Frontend
- [ ] Instalar @supabase/supabase-js
- [ ] Configurar cliente Supabase
- [ ] Implementar autenticação
- [ ] Integrar CRUD de landing pages
- [ ] Implementar upload de imagens

### Subdomínios
- [ ] Configurar Nginx ou Edge Function
- [ ] Testar roteamento
- [ ] Implementar renderização SSR

### Produção
- [ ] Configurar domínio customizado
- [ ] SSL/HTTPS
- [ ] Monitoramento
- [ ] Backup automático

---

**Pronto para começar!** O Supabase é uma excelente escolha para MVP e crescimento inicial. 🚀
