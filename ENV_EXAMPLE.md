# 📝 Exemplo de Variáveis de Ambiente

Este arquivo mostra um exemplo de como deve ser o arquivo `.env.local` na raiz do projeto.

## Criar o arquivo

Na raiz do projeto, crie um arquivo chamado `.env.local` (com o ponto no início) e copie o conteúdo abaixo:

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
# CONFIGURAÇÃO DO STRIPE (Frontend)
# ============================================
# Obtenha sua chave pública em: https://dashboard.stripe.com/apikeys
# Use a chave de TESTE para desenvolvimento e PRODUÇÃO para produção

VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SuWPG1zmyrvN5yEcq4WZP14ZZPM9d10LSt75TSDJXD9pGwcmvCnaccaVK7N6mtjcJki4Lb0QWDJDR0FI9ioERb700bvJjcLJO

# ============================================
# NOTA: RESEND API KEY e STRIPE SECRET KEY
# ============================================
# As chaves secretas NÃO vão aqui no .env.local
# Elas devem ser configuradas nas Edge Functions do Supabase:
# 1. Dashboard do Supabase > Settings > Edge Functions
# 2. Clique em "Add new secret"
# 3. Adicione:
#    - RESEND_API_KEY: Sua chave do Resend
#    - STRIPE_SECRET_KEY: sk_test_51SuWPG1zmyrvN5yEOk6OomUgeTGKE1JYamztnjMkNeoJ6N1N8lokV19FWSH5S0gl3MyKpXoiSKR7X7iOZjDpvBjT00mhFQ5BsU
#    - STRIPE_WEBHOOK_SECRET: Obtenha após configurar webhook no Stripe Dashboard
# Veja o guia SETUP_LOCAL.md para mais detalhes
```

## Como obter cada credencial

### VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_PUBLISHABLE_KEY`

### GEMINI_API_KEY

1. Acesse https://aistudio.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em **"Create API Key"**
4. Copie a chave gerada → `GEMINI_API_KEY`

### VITE_STRIPE_PUBLISHABLE_KEY

1. Acesse https://dashboard.stripe.com/apikeys
2. Faça login na sua conta Stripe
3. Copie a **Publishable key** (chave pública)
4. Para desenvolvimento, use a chave de **TESTE** (começa com `pk_test_`)
5. Para produção, use a chave de **PRODUÇÃO** (começa com `pk_live_`)

### RESEND_API_KEY e STRIPE_SECRET_KEY

⚠️ **IMPORTANTE**: As chaves secretas **NÃO** vão no `.env.local`!

Elas devem ser configuradas no Supabase:
1. Dashboard do Supabase > **Settings** > **Edge Functions**
2. Clique em **"Add new secret"**
3. Adicione os seguintes secrets:
   - **RESEND_API_KEY**: Sua chave do Resend (obtenha em https://resend.com/api-keys)
   - **STRIPE_SECRET_KEY**: Sua chave secreta do Stripe (obtenha em https://dashboard.stripe.com/apikeys)
   - **STRIPE_WEBHOOK_SECRET**: Secret do webhook (obtenha após configurar webhook no Stripe Dashboard)

**Como configurar o webhook do Stripe:**
1. Acesse https://dashboard.stripe.com/webhooks
2. Clique em **"Add endpoint"**
3. URL: `https://[seu-projeto-id].supabase.co/functions/v1/stripe-webhook`
4. Selecione os eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
5. Copie o **Signing secret** e adicione como `STRIPE_WEBHOOK_SECRET` no Supabase

Veja mais detalhes no guia `SETUP_LOCAL.md`.

## Exemplo completo preenchido

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyB1234567890abcdefghijklmnopqrstuvwxyz
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SuWPG1zmyrvN5yEcq4WZP14ZZPM9d10LSt75TSDJXD9pGwcmvCnaccaVK7N6mtjcJki4Lb0QWDJDR0FI9ioERb700bvJjcLJO
```

## ⚠️ Segurança

- **NUNCA** commite o arquivo `.env.local` no Git
- O arquivo já está no `.gitignore` por padrão
- **NUNCA** compartilhe suas chaves de API publicamente
- Use chaves diferentes para desenvolvimento e produção
