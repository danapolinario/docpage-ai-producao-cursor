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
# NOTA: RESEND API KEY
# ============================================
# A chave do Resend NÃO vai aqui no .env.local
# Ela deve ser configurada nas Edge Functions do Supabase
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

### RESEND_API_KEY

⚠️ **IMPORTANTE**: A chave do Resend **NÃO** vai no `.env.local`!

Ela deve ser configurada no Supabase:
1. Dashboard do Supabase > **Settings** > **Edge Functions**
2. Clique em **"Add new secret"**
3. Nome: `RESEND_API_KEY`
4. Valor: Sua chave do Resend (obtenha em https://resend.com/api-keys)

Veja mais detalhes no guia `SETUP_LOCAL.md`.

## Exemplo completo preenchido

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyB1234567890abcdefghijklmnopqrstuvwxyz
```

## ⚠️ Segurança

- **NUNCA** commite o arquivo `.env.local` no Git
- O arquivo já está no `.gitignore` por padrão
- **NUNCA** compartilhe suas chaves de API publicamente
- Use chaves diferentes para desenvolvimento e produção
