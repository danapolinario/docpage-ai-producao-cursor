# 💻 Exemplos Práticos - Integração Supabase

Este documento contém exemplos práticos de como integrar o Supabase com o frontend atual do DocPage AI.

---

## 1. Setup Inicial

### Instalar Dependências

```bash
npm install @supabase/supabase-js
```

### Configurar Cliente Supabase

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
```

### Variáveis de Ambiente

```env
# .env.local
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

---

## 2. Integração com App.tsx Existente

### Modificar App.tsx para Salvar no Supabase

```typescript
// App.tsx (modificações)
import { supabase } from './lib/supabase';
import { createLandingPage, updateLandingPage, publishLandingPage } from './services/landing-pages';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [currentLandingPageId, setCurrentLandingPageId] = useState<string | null>(null);

  // Salvar rascunho automaticamente
  useEffect(() => {
    if (currentLandingPageId && state.generatedContent) {
      const saveDraft = async () => {
        try {
          await updateLandingPage(currentLandingPageId, {
            briefing_data: state.briefing,
            content_data: state.generatedContent,
            design_settings: state.designSettings,
            section_visibility: state.sectionVisibility,
            layout_variant: state.layoutVariant,
            photo_url: state.photoUrl,
            about_photo_url: state.aboutPhotoUrl,
          });
        } catch (error) {
          console.error('Erro ao salvar rascunho:', error);
        }
      };

      // Debounce para não salvar a cada keystroke
      const timeoutId = setTimeout(saveDraft, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [state, currentLandingPageId]);

  // Criar nova landing page quando o usuário finalizar o briefing
  const handleCreateLandingPage = async () => {
    if (!state.generatedContent) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user) {
        // Redirecionar para login
        return;
      }

      // Gerar subdomínio único
      const subdomain = generateSubdomain(state.briefing.name);

      const landingPage = await createLandingPage({
        subdomain,
        briefing: state.briefing,
        content: state.generatedContent,
        design: state.designSettings,
        visibility: state.sectionVisibility,
        layoutVariant: state.layoutVariant,
      });

      setCurrentLandingPageId(landingPage.id);
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
    }
  };

  // Publicar landing page
  const handleEditorFinish = async () => {
    if (!currentLandingPageId) {
      // Criar primeiro se não existir
      await handleCreateLandingPage();
      return;
    }

    try {
      await publishLandingPage(currentLandingPageId);
      setState(prev => ({ ...prev, step: 5 }));
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
    }
  };

  // ... resto do código
};

function generateSubdomain(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9-]/g, '-') // Substitui caracteres especiais por hífen
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, ''); // Remove hífens do início/fim
}
```

---

## 3. Service de Landing Pages Completo

```typescript
// services/landing-pages.ts
import { supabase } from '../lib/supabase';
import { BriefingData, LandingPageContent, DesignSettings } from '../types';

export interface LandingPageRow {
  id: string;
  user_id: string;
  subdomain: string;
  custom_domain: string | null;
  slug: string;
  briefing_data: BriefingData;
  content_data: LandingPageContent;
  design_settings: DesignSettings;
  section_visibility: any;
  layout_variant: number;
  photo_url: string | null;
  about_photo_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string[] | null;
  og_image_url: string | null;
  schema_markup: any;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Verificar disponibilidade de subdomínio
export async function checkSubdomainAvailability(
  subdomain: string
): Promise<{ available: boolean; error?: string }> {
  // Validação básica
  if (!/^[a-z0-9-]+$/.test(subdomain)) {
    return { available: false, error: 'Subdomínio inválido' };
  }

  if (subdomain.length < 3 || subdomain.length > 63) {
    return { available: false, error: 'Subdomínio deve ter entre 3 e 63 caracteres' };
  }

  // Verificar se já existe
  const { data, error } = await supabase
    .from('landing_pages')
    .select('id')
    .eq('subdomain', subdomain)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = nenhum resultado encontrado (é bom!)
    return { available: false, error: 'Erro ao verificar disponibilidade' };
  }

  return { available: !data };
}

// Criar landing page
export async function createLandingPage(data: {
  subdomain: string;
  briefing: BriefingData;
  content: LandingPageContent;
  design: DesignSettings;
  visibility: any;
  layoutVariant: number;
}): Promise<LandingPageRow> {
  const { data: user } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Verificar disponibilidade
  const availability = await checkSubdomainAvailability(data.subdomain);
  if (!availability.available) {
    throw new Error(availability.error || 'Subdomínio não disponível');
  }

  // Gerar meta tags básicas
  const metaTitle = `${data.briefing.name} - ${data.briefing.specialty} | Agende sua consulta`;
  const metaDescription = data.content.subheadline || 
    `Dr(a). ${data.briefing.name}, especialista em ${data.briefing.specialty}. Agende sua consulta online.`;

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
      meta_title: metaTitle,
      meta_description: metaDescription,
      meta_keywords: [
        data.briefing.name,
        data.briefing.specialty,
        data.briefing.crmState,
        'médico',
        'consulta médica',
      ],
    })
    .select()
    .single();

  if (error) throw error;
  return landingPage;
}

// Listar landing pages do usuário
export async function getMyLandingPages(): Promise<LandingPageRow[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Obter landing page por ID
export async function getLandingPageById(id: string): Promise<LandingPageRow> {
  const { data, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Obter landing page por subdomínio (público)
export async function getLandingPageBySubdomain(
  subdomain: string
): Promise<LandingPageRow> {
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
  updates: Partial<LandingPageRow>
): Promise<LandingPageRow> {
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
export async function publishLandingPage(id: string): Promise<LandingPageRow> {
  return updateLandingPage(id, {
    status: 'published',
    published_at: new Date().toISOString(),
  });
}

// Despublicar landing page
export async function unpublishLandingPage(id: string): Promise<LandingPageRow> {
  return updateLandingPage(id, {
    status: 'draft',
  });
}

// Deletar landing page
export async function deleteLandingPage(id: string): Promise<void> {
  const { error } = await supabase
    .from('landing_pages')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
```

---

## 4. Upload de Imagens com Supabase Storage

```typescript
// services/storage.ts
import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'landing-page-photos';

// Upload de foto
export async function uploadPhoto(
  file: File,
  landingPageId: string,
  type: 'profile' | 'about'
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Validar tipo de arquivo
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Tipo de arquivo inválido. Use JPG, PNG ou WebP');
  }

  // Validar tamanho (máximo 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('Arquivo muito grande. Máximo 5MB');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${landingPageId}/${type}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  // Upload
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  // Obter URL pública
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return publicUrl;
}

// Upload de foto a partir de base64 (para fotos geradas pela IA)
export async function uploadPhotoFromBase64(
  base64Data: string,
  landingPageId: string,
  type: 'profile' | 'about'
): Promise<string> {
  // Converter base64 para blob
  const response = await fetch(base64Data);
  const blob = await response.blob();
  
  // Criar arquivo a partir do blob
  const file = new File([blob], `${type}.jpg`, { type: 'image/jpeg' });
  
  return uploadPhoto(file, landingPageId, type);
}

// Deletar foto
export async function deletePhoto(fileUrl: string): Promise<void> {
  // Extrair caminho da URL
  const url = new URL(fileUrl);
  const pathParts = url.pathname.split('/');
  const filePath = pathParts.slice(pathParts.indexOf(BUCKET_NAME) + 1).join('/');

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) throw error;
}

// Listar fotos de uma landing page
export async function listPhotos(landingPageId: string): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(landingPageId);

  if (error) throw error;
  return (data || []).map(file => 
    supabase.storage.from(BUCKET_NAME).getPublicUrl(`${landingPageId}/${file.name}`).data.publicUrl
  );
}
```

---

## 5. Integração com PhotoUploader Existente

```typescript
// components/PhotoUploader.tsx (modificações)
import { uploadPhoto, uploadPhotoFromBase64 } from '../services/storage';

// Adicionar ao componente PhotoUploader
const handlePhotoChange = async (file: File) => {
  if (!currentLandingPageId) {
    // Criar landing page primeiro se necessário
    await handleCreateLandingPage();
  }

  try {
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Upload para Supabase Storage
    const photoUrl = await uploadPhoto(file, currentLandingPageId, 'profile');
    
    setState(prev => ({ 
      ...prev, 
      photoUrl,
      isLoading: false 
    }));

    // Atualizar no banco
    await updateLandingPage(currentLandingPageId, { photo_url: photoUrl });
  } catch (error: any) {
    setState(prev => ({ 
      ...prev, 
      isLoading: false, 
      error: error.message 
    }));
  }
};

// Para fotos geradas pela IA (base64)
const handleEnhancePhoto = async (originalUrl: string) => {
  setState(prev => ({ 
    ...prev, 
    isLoading: true, 
    loadingMessage: 'IA está criando suas fotos...' 
  }));

  try {
    const [enhancedUrl, officeUrl] = await Promise.all([
      enhancePhoto(originalUrl),
      generateOfficePhoto(originalUrl)
    ]);

    // Upload das fotos geradas
    if (currentLandingPageId) {
      const [uploadedProfile, uploadedAbout] = await Promise.all([
        uploadPhotoFromBase64(enhancedUrl, currentLandingPageId, 'profile'),
        uploadPhotoFromBase64(officeUrl, currentLandingPageId, 'about')
      ]);

      setState(prev => ({ 
        ...prev, 
        photoUrl: uploadedProfile,
        aboutPhotoUrl: uploadedAbout,
        isPhotoAIEnhanced: true,
        isLoading: false 
      }));

      // Atualizar no banco
      await updateLandingPage(currentLandingPageId, {
        photo_url: uploadedProfile,
        about_photo_url: uploadedAbout,
      });
    }
  } catch (error: any) {
    setState(prev => ({ 
      ...prev, 
      isLoading: false, 
      error: error.message 
    }));
  }
};
```

---

## 6. Sistema de Autenticação

```typescript
// services/auth.ts
import { supabase } from '../lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
  };
}

// Registrar novo usuário
export async function signUp(
  email: string,
  password: string,
  name?: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || email.split('@')[0],
      },
    },
  });

  if (error) throw error;
  return data;
}

// Login
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

// Logout
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Obter usuário atual
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Verificar se está autenticado
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

// Observar mudanças de autenticação
export function onAuthStateChange(
  callback: (user: AuthUser | null) => void
) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
}
```

---

## 7. Componente de Login/Registro

```typescript
// components/Auth.tsx
import { useState } from 'react';
import { signUp, signIn } from '../services/auth';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
      }
      // Redirecionar ou atualizar estado
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {isLogin ? 'Entrar' : 'Criar Conta'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar Conta'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {isLogin
              ? 'Não tem conta? Criar conta'
              : 'Já tem conta? Entrar'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 8. Analytics com Supabase

```typescript
// services/analytics.ts
import { supabase } from '../lib/supabase';

// Registrar page view
export async function recordPageView(landingPageId: string) {
  const { error } = await supabase.from('analytics_events').insert({
    landing_page_id: landingPageId,
    event_type: 'page_view',
    event_data: {
      url: window.location.href,
      path: window.location.pathname,
      timestamp: new Date().toISOString(),
    },
  });

  if (error) console.error('Erro ao registrar page view:', error);
}

// Registrar click em botão
export async function recordButtonClick(
  landingPageId: string,
  buttonId: string,
  buttonText: string
) {
  const { error } = await supabase.from('analytics_events').insert({
    landing_page_id: landingPageId,
    event_type: 'button_click',
    event_data: {
      button_id: buttonId,
      button_text: buttonText,
      timestamp: new Date().toISOString(),
    },
  });

  if (error) console.error('Erro ao registrar click:', error);
}

// Obter analytics de uma landing page
export async function getAnalytics(landingPageId: string) {
  const { data, error } = await supabase
    .from('analytics_events')
    .select('*')
    .eq('landing_page_id', landingPageId)
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) throw error;

  // Agregar dados
  const pageViews = data.filter((e) => e.event_type === 'page_view').length;
  const buttonClicks = data.filter((e) => e.event_type === 'button_click').length;

  return {
    totalEvents: data.length,
    pageViews,
    buttonClicks,
    conversionRate: pageViews > 0 ? (buttonClicks / pageViews) * 100 : 0,
    events: data,
  };
}
```

---

## 9. Hook para Gerenciar Landing Page Atual

```typescript
// hooks/useLandingPage.ts
import { useState, useEffect } from 'react';
import { getLandingPageById, updateLandingPage } from '../services/landing-pages';
import { LandingPageRow } from '../services/landing-pages';

export function useLandingPage(landingPageId: string | null) {
  const [landingPage, setLandingPage] = useState<LandingPageRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!landingPageId) {
      setLandingPage(null);
      return;
    }

    const loadLandingPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getLandingPageById(landingPageId);
        setLandingPage(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadLandingPage();
  }, [landingPageId]);

  const update = async (updates: Partial<LandingPageRow>) => {
    if (!landingPageId) return;

    try {
      const updated = await updateLandingPage(landingPageId, updates);
      setLandingPage(updated);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return { landingPage, loading, error, update };
}
```

---

## 10. Configuração do Storage no Supabase

### No Dashboard do Supabase:

1. Vá em **Storage**
2. Crie um novo bucket chamado `landing-page-photos`
3. Configure as políticas:

```sql
-- Política: Usuários podem fazer upload de fotos
CREATE POLICY "Users can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'landing-page-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política: Fotos são públicas (para exibição)
CREATE POLICY "Photos are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'landing-page-photos');

-- Política: Usuários podem deletar suas próprias fotos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'landing-page-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

Estes exemplos mostram como integrar o Supabase com o frontend existente. A integração é relativamente simples e permite começar rapidamente! 🚀
