# 🚀 Configuração SSR (Server-Side Rendering)

## ✅ Implementação Completa

Implementei SSR completo para que as tags SEO apareçam no HTML inicial, otimizando para crawlers e compartilhamento social.

## 📦 Dependências Instaladas

- `express` - Servidor HTTP
- `@types/express` - Tipos TypeScript para Express
- `tsx` - Executor TypeScript para desenvolvimento

## 🏗️ Estrutura Criada

```
server/
├── index.ts          # Servidor Express principal
└── render.tsx        # Função de renderização SSR

components/
└── LandingPageViewerSSR.tsx  # Componente SSR-friendly

tsconfig.server.json  # Configuração TypeScript para servidor
```

## 🔧 Como Funciona

### 1. **Servidor Express** (`server/index.ts`)
- Serve arquivos estáticos do build (`dist/`)
- Intercepta rotas `/:subdomain`
- Busca dados da landing page no Supabase
- Renderiza HTML com tags SEO no servidor
- Fallback para SPA se não encontrar landing page

### 2. **Renderização SSR** (`server/render.tsx`)
- Gera todas as tags SEO no `<head>`
- Renderiza componente React para HTML
- Injeta dados no `window.__LANDING_PAGE_DATA__` para hidratação
- Retorna HTML completo pronto para crawlers

### 3. **Componente SSR-Friendly** (`LandingPageViewerSSR.tsx`)
- Recebe dados diretamente (sem hooks de fetch)
- Renderiza Preview e SEOHead
- Usado apenas no servidor

### 4. **Hidratação Client-Side**
- `LandingPageViewer` verifica `window.__LANDING_PAGE_DATA__`
- Se existir, usa dados do SSR (não faz fetch)
- Hidrata o React sem re-renderizar tudo

## 🚀 Scripts Disponíveis

### Desenvolvimento

```bash
# Modo normal (SPA)
npm run dev

# Modo SSR (com watch)
npm run dev:ssr
```

### Build e Produção

```bash
# Build completo (frontend + servidor)
npm run build:ssr

# Apenas build do servidor
npm run build:server

# Iniciar servidor de produção
npm start
```

## 📝 Variáveis de Ambiente

O servidor SSR precisa das mesmas variáveis do frontend:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anon-publica
PORT=8081  # Porta do servidor (opcional, padrão: 8081)
```

## 🎯 Fluxo de Requisição

1. **Usuário acessa** `http://localhost:8081/seodocpage`
2. **Servidor Express** intercepta a rota
3. **Busca dados** no Supabase para `subdomain = "seodocpage"`
4. **Renderiza HTML** com tags SEO personalizadas
5. **Envia HTML** completo para o navegador
6. **React hidrata** usando dados injetados
7. **Navegação client-side** funciona normalmente (SPA)

## ✅ Vantagens do SSR

1. **SEO Real**: Tags aparecem no HTML inicial (view-source)
2. **Crawlers**: Google, Facebook, Twitter veem tags corretas
3. **Performance**: HTML pronto, menos JavaScript inicial
4. **Compartilhamento**: Links compartilhados mostram preview correto
5. **Fallback**: Se SSR falhar, serve SPA normal

## 🔍 Verificação

### 1. Ver HTML Inicial

```bash
# Iniciar servidor SSR
npm run dev:ssr

# Em outro terminal, ver HTML
curl http://localhost:8081/seodocpage | grep -A 5 "og:title"
```

### 2. Ver no Navegador

1. Acesse `http://localhost:8081/seodocpage`
2. Clique direito > "Ver código-fonte"
3. Procure por `<meta property="og:title"` - deve ter o título personalizado!

### 3. Testar com Ferramentas

- **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
- **Google Rich Results Test**: https://search.google.com/test/rich-results

## 🐛 Troubleshooting

### Erro: "Cannot find module"

```bash
# Instalar dependências
npm install

# Rebuild
npm run build:ssr
```

### Erro: "Port already in use"

```bash
# Mudar porta
PORT=8082 npm start
```

### Tags não aparecem

1. Verifique se a landing page está `published`
2. Verifique variáveis de ambiente
3. Verifique logs do servidor
4. Limpe cache do navegador (Ctrl+Shift+R)

## 📦 Deploy

Para produção, você precisa:

1. **Build completo**:
   ```bash
   npm run build:ssr
   ```

2. **Iniciar servidor**:
   ```bash
   npm start
   ```

3. **Ou usar PM2**:
   ```bash
   pm2 start dist/server/index.js --name docpage-ssr
   ```

4. **Configurar Nginx** (opcional):
   ```nginx
   server {
       listen 80;
       server_name seu-dominio.com;
       
       location / {
           proxy_pass http://localhost:8081;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## 🎉 Resultado

Agora as tags SEO aparecem no HTML inicial! Crawlers e ferramentas de compartilhamento social verão as tags corretas desde o primeiro acesso.
