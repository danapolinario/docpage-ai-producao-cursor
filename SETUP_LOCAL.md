# 🚀 Guia Completo: Configuração Local e Deploy

Este guia te ajudará a configurar o projeto DocPage AI para rodar localmente e depois fazer deploy em um servidor.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do Supabase](#1-configuração-do-supabase)
3. [Configuração do Resend](#2-configuração-do-resend)
4. [Configuração do Gemini](#3-configuração-do-gemini)
5. [Configuração Local](#4-configuração-local)
6. [Testando Localmente](#5-testando-localmente)
7. [Preparação para Deploy](#6-preparação-para-deploy)

---

## 📦 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- Conta no **Supabase** (grátis): https://supabase.com
- Conta no **Resend** (grátis): https://resend.com
- Conta no **Google AI Studio** (grátis): https://aistudio.google.com

---

## 1. Configuração do Supabase

### 1.1 Criar Projeto no Supabase

1. Acesse https://supabase.com e faça login
2. Clique em **"New Project"**
3. Preencha:
   - **Name**: `DocPage AI` (ou o nome que preferir)
   - **Database Password**: Crie uma senha forte (guarde em local seguro!)
   - **Region**: Escolha a mais próxima (ex: `South America (São Paulo)`)
   - **Pricing Plan**: Free (para começar)
4. Clique em **"Create new project"**
5. Aguarde 2-3 minutos enquanto o projeto é criado

### 1.2 Obter Credenciais da API

1. No dashboard do projeto, vá em **Settings** (ícone de engrenagem)
2. Clique em **API** no menu lateral
3. Copie as seguintes informações:
   - **Project URL**: Algo como `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: Uma chave longa começando com `eyJ...`

> ⚠️ **IMPORTANTE**: Use a **anon public key**, nunca a **service_role key** no frontend!

### 1.3 Configurar Banco de Dados

1. No dashboard, vá em **SQL Editor**
2. Clique em **"New query"**
3. Abra o arquivo `supabase/schema.sql` do projeto
4. **Copie TODO o conteúdo** e cole no SQL Editor
5. Clique em **"Run"** (ou `Ctrl+Enter` / `Cmd+Enter`)
6. Verifique se as tabelas foram criadas em **Table Editor**

### 1.4 Configurar Storage (Para Fotos)

1. No dashboard, vá em **Storage**
2. Clique em **"New bucket"**
3. Preencha:
   - **Name**: `landing-page-photos`
   - **Public bucket**: ✅ **Marque esta opção** (fotos precisam ser públicas)
4. Clique em **"Create bucket"**
5. No **SQL Editor**, abra o arquivo `supabase/storage-policies.sql`
6. Copie TODO o conteúdo e execute no SQL Editor

### 1.5 Configurar Edge Functions

As Edge Functions são funções serverless que rodam no Supabase. Elas precisam de variáveis de ambiente configuradas.

#### 1.5.1 Instalar Supabase CLI (Opcional, mas Recomendado)

Para facilitar o deploy das Edge Functions:

```bash
# macOS
brew install supabase/tap/supabase

# Ou via npm
npm install -g supabase
```

#### 1.5.2 Fazer Login no Supabase CLI

```bash
supabase login
```

#### 1.5.3 Linkar Projeto Local ao Projeto Remoto

```bash
# No diretório do projeto
supabase link --project-ref seu-projeto-id
```

> O `project-ref` é a parte do ID do projeto na URL: `https://[project-ref].supabase.co`

#### 1.5.4 Deploy das Edge Functions

```bash
# Deploy de todas as funções
supabase functions deploy

# Ou deploy de uma função específica
supabase functions deploy send-otp
supabase functions deploy verify-otp
supabase functions deploy generate-content
supabase functions deploy photo-enhance
supabase functions deploy notify-site-published
supabase functions deploy generate-og-image
supabase functions deploy check-domain-rdap
supabase functions deploy admin-login
```

#### 1.5.5 Configurar Variáveis de Ambiente nas Edge Functions

As Edge Functions precisam de variáveis de ambiente. Configure-as no dashboard do Supabase:

1. No dashboard, vá em **Settings** > **Edge Functions**
2. Clique em **"Add new secret"** para cada variável:

**Variáveis necessárias:**

- `GEMINI_API_KEY`: Sua chave da API do Gemini (veja seção 3)
- `RESEND_API_KEY`: Sua chave da API do Resend (veja seção 2)
- `SUPABASE_URL`: A URL do seu projeto (já configurada automaticamente)
- `SUPABASE_SERVICE_ROLE_KEY`: A service_role key (já configurada automaticamente)

> 💡 **Dica**: Você também pode configurar via CLI:
> ```bash
> supabase secrets set GEMINI_API_KEY=sua-chave-aqui
> supabase secrets set RESEND_API_KEY=sua-chave-aqui
> ```

---

## 2. Configuração do Resend

O Resend é usado para enviar emails (OTP de autenticação e notificações).

### 2.1 Criar Conta no Resend

1. Acesse https://resend.com
2. Clique em **"Sign Up"** (pode usar GitHub, Google ou email)
3. Confirme seu email se necessário

### 2.2 Obter API Key

1. No dashboard do Resend, vá em **API Keys**
2. Clique em **"Create API Key"**
3. Dê um nome (ex: "DocPage AI Production")
4. Selecione as permissões necessárias (geralmente "Full Access" para começar)
5. **Copie a chave** - ela será exibida apenas uma vez!

### 2.3 Configurar Domínio (Opcional, mas Recomendado)

Para enviar emails para qualquer destinatário (não apenas emails verificados):

1. No dashboard, vá em **Domains**
2. Clique em **"Add Domain"**
3. Siga as instruções para verificar seu domínio
4. Configure os registros DNS conforme solicitado
5. Após verificação, atualize as Edge Functions para usar seu domínio:

   No arquivo `supabase/functions/send-otp/index.ts`, altere:
   ```typescript
   from: "DocPage AI <noreply@resend.dev>",
   ```
   Para:
   ```typescript
   from: "DocPage AI <noreply@seudominio.com>",
   ```

   Faça o mesmo em `supabase/functions/notify-site-published/index.ts`

### 2.4 Adicionar API Key no Supabase

1. No dashboard do Supabase, vá em **Settings** > **Edge Functions**
2. Clique em **"Add new secret"**
3. Nome: `RESEND_API_KEY`
4. Valor: Cole a chave que você copiou
5. Clique em **"Save"**

> 💡 **Alternativa via CLI:**
> ```bash
> supabase secrets set RESEND_API_KEY=re_sua_chave_aqui
> ```

---

## 3. Configuração do Gemini

O Gemini é usado para gerar conteúdo das landing pages usando IA.

### 3.1 Obter API Key do Gemini

1. Acesse https://aistudio.google.com/
2. Faça login com sua conta Google
3. Clique em **"Get API Key"** ou **"Obter chave de API"**
4. Clique em **"Create API Key"**
5. Se solicitado, escolha ou crie um projeto Google Cloud
6. **Copie a chave gerada** - ela será exibida apenas uma vez!

### 3.2 Adicionar API Key no Supabase

1. No dashboard do Supabase, vá em **Settings** > **Edge Functions**
2. Clique em **"Add new secret"**
3. Nome: `GEMINI_API_KEY`
4. Valor: Cole a chave que você copiou
5. Clique em **"Save"**

> 💡 **Alternativa via CLI:**
> ```bash
> supabase secrets set GEMINI_API_KEY=AIzaSySua_chave_aqui
> ```

> ⚠️ **Nota**: A chave do Gemini também é usada no frontend via `vite.config.ts`, mas para as Edge Functions ela deve estar configurada no Supabase.

---

## 3.3 Funcionalidade "Melhorar com IA" (Nano Banana)

A funcionalidade **"Melhorar com IA"** após upload de fotos usa o **Nano Banana** (`gemini-2.5-flash-image`) diretamente via API do Gemini.

### Como Funciona

- ✅ Usa o modelo `gemini-2.5-flash-image` (Nano Banana) para processar imagens
- ✅ Melhora fotos de perfil e gera cenas de consultório
- ✅ Usa apenas `GEMINI_API_KEY` (já configurada na seção 3.2)

### Verificação

A função `photo-enhance` está configurada para usar o Nano Banana. Certifique-se de que:

1. ✅ `GEMINI_API_KEY` está configurada no Supabase
2. ✅ A Edge Function `photo-enhance` foi deployada
3. ✅ O modelo `gemini-2.5-flash-image` está disponível na sua região

### Troubleshooting

Se a funcionalidade não funcionar:

- Verifique os logs do Supabase (Settings > Edge Functions > Logs)
- Confirme que o modelo está disponível na sua região
- Verifique se há limites de quota na sua conta do Gemini

Veja `GEMINI_IMAGE_GENERATION.md` para mais detalhes técnicos.

---

## 4. Configuração Local

### 4.1 Instalar Dependências

```bash
npm install
```

### 4.2 Criar Arquivo .env.local

Na raiz do projeto, crie o arquivo `.env.local`:

```bash
cp .env.example .env.local
```

### 4.3 Preencher Variáveis de Ambiente

Abra o arquivo `.env.local` e preencha com suas credenciais:

```env
# ============================================
# CONFIGURAÇÃO DO SUPABASE
# ============================================
# Obtenha essas credenciais em: https://supabase.com/dashboard
# Settings > API > Project URL e anon public key

VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anon-publica-aqui

# ============================================
# CONFIGURAÇÃO DO GEMINI (Google AI)
# ============================================
# Obtenha sua chave em: https://aistudio.google.com/app/apikey

GEMINI_API_KEY=sua-chave-gemini-aqui

# ============================================
# NOTA: RESEND API KEY
# ============================================
# A chave do Resend NÃO vai aqui no .env.local
# Ela deve ser configurada nas Edge Functions do Supabase
# Veja a seção 2 (Configuração do Resend) para mais detalhes
```

> ⚠️ **IMPORTANTE**: 
> - Substitua `seu-projeto-id` pela URL do seu projeto Supabase
> - Substitua `sua-chave-anon-publica-aqui` pela anon key do Supabase
> - Substitua `sua-chave-gemini-aqui` pela chave do Gemini
> - A chave do Resend vai no Supabase, não aqui (veja seção 2)

### 4.4 Verificar Estrutura

Seu projeto deve ter esta estrutura:

```
docpage-ai-producao-cursor/
├── .env.local          ← Seu arquivo de configuração (NÃO commitar!)
├── .env.example        ← Template de exemplo
├── package.json
├── vite.config.ts
├── lib/
│   └── supabase.ts
├── services/
├── supabase/
│   ├── functions/      ← Edge Functions
│   ├── schema.sql      ← Schema do banco
│   └── storage-policies.sql
└── ...
```

---

## 5. Testando Localmente

### 5.1 Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

O servidor deve iniciar em `http://localhost:8080` (ou outra porta se 8080 estiver ocupada).

### 5.2 Verificar Funcionalidades

Teste as seguintes funcionalidades:

1. **Autenticação OTP**:
   - Tente fazer login/cadastro
   - Verifique se recebe email com código OTP
   - Verifique se consegue fazer login com o código

2. **Criação de Landing Page**:
   - Crie uma nova landing page
   - Verifique se o conteúdo é gerado pela IA (Gemini)
   - Verifique se as fotos são salvas no storage

3. **Publicação**:
   - Publique uma landing page
   - Verifique se recebe email de notificação (se configurou Resend)

### 5.3 Verificar Logs

- **Console do navegador**: Abra DevTools (F12) e veja erros no console
- **Terminal**: Veja logs do servidor de desenvolvimento
- **Supabase Dashboard**: Vá em **Logs** > **Edge Functions** para ver logs das funções

---

## 6. Preparação para Deploy

### 6.1 Build de Produção

Antes de fazer deploy, teste o build de produção localmente:

```bash
npm run build
```

Isso criará uma pasta `dist/` com os arquivos otimizados.

### 6.2 Verificar Build

```bash
npm run preview
```

Isso iniciará um servidor local com o build de produção para testar.

### 6.3 Variáveis de Ambiente para Produção

No servidor de produção, você precisará configurar as mesmas variáveis de ambiente:

**No servidor/hosting:**

```env
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anon-publica
GEMINI_API_KEY=sua-chave-gemini
```

> ⚠️ **IMPORTANTE**: 
> - Use as mesmas credenciais do Supabase (ou crie um projeto separado para produção)
> - As Edge Functions já estão configuradas no Supabase, então funcionarão automaticamente
> - Considere usar variáveis de ambiente diferentes para produção (projeto Supabase separado)

### 6.4 Opções de Deploy

#### Opção 1: Vercel (Recomendado para React/Vite)

1. Instale Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Faça deploy:
   ```bash
   vercel
   ```

3. Configure variáveis de ambiente no dashboard da Vercel:
   - Vá em **Settings** > **Environment Variables**
   - Adicione todas as variáveis do `.env.local`

#### Opção 2: Netlify

1. Instale Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Faça deploy:
   ```bash
   netlify deploy --prod
   ```

3. Configure variáveis de ambiente no dashboard da Netlify

#### Opção 3: Servidor Próprio (VPS, etc.)

1. Faça build:
   ```bash
   npm run build
   ```

2. Copie a pasta `dist/` para o servidor

3. Configure um servidor web (Nginx, Apache, etc.) para servir os arquivos estáticos

4. Configure variáveis de ambiente no servidor (ou use um arquivo `.env`)

### 6.5 Checklist de Deploy

Antes de fazer deploy em produção, verifique:

- [ ] Todas as Edge Functions foram deployadas no Supabase
- [ ] Variáveis de ambiente configuradas no Supabase (GEMINI_API_KEY, RESEND_API_KEY)
- [ ] Variáveis de ambiente configuradas no servidor/hosting (VITE_SUPABASE_URL, etc.)
- [ ] Domínio do Resend verificado (se quiser enviar para qualquer email)
- [ ] Build de produção testado localmente
- [ ] Funcionalidades testadas em ambiente de staging (se tiver)

---

## 🐛 Solução de Problemas

### Erro: "Configuração do backend ausente"

**Solução:**
- Verifique se o arquivo `.env.local` existe na raiz
- Verifique se as variáveis começam com `VITE_`
- Reinicie o servidor (`npm run dev`)

### Erro: "GEMINI_API_KEY is not configured" (nas Edge Functions)

**Solução:**
- Verifique se configurou a variável no Supabase (Settings > Edge Functions)
- Ou via CLI: `supabase secrets set GEMINI_API_KEY=sua-chave`

### Emails não estão sendo enviados

**Solução:**
- Verifique se configurou `RESEND_API_KEY` no Supabase
- Se estiver em modo teste do Resend, só envia para emails verificados
- Para produção, verifique um domínio no Resend

### Edge Functions não funcionam

**Solução:**
- Verifique se fez deploy das funções: `supabase functions deploy`
- Verifique logs no dashboard do Supabase (Logs > Edge Functions)
- Verifique se as variáveis de ambiente estão configuradas

### Erro de CORS

**Solução:**
- As Edge Functions já têm headers CORS configurados
- Se persistir, verifique se está chamando a URL correta do Supabase

---

## 📚 Recursos Úteis

- **Documentação Supabase**: https://supabase.com/docs
- **Documentação Resend**: https://resend.com/docs
- **Documentação Gemini**: https://ai.google.dev/docs
- **Supabase CLI**: https://supabase.com/docs/guides/cli
- **Vite Deploy Guide**: https://vitejs.dev/guide/static-deploy.html

---

## ✅ Próximos Passos

Após configurar tudo:

1. Teste todas as funcionalidades localmente
2. Faça deploy das Edge Functions no Supabase
3. Configure variáveis de ambiente no servidor de produção
4. Faça deploy do frontend
5. Teste em produção
6. Configure domínio customizado (se necessário)

---

**Pronto!** Agora você tem tudo configurado para rodar localmente e fazer deploy! 🎉
