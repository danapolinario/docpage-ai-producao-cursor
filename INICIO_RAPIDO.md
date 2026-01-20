# ⚡ Início Rápido - Configuração Local

Guia rápido para começar a rodar o projeto localmente em 5 minutos.

## 🚀 Passos Rápidos

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Supabase

1. Crie conta em https://supabase.com
2. Crie um novo projeto
3. Vá em **Settings** > **API** e copie:
   - Project URL
   - anon public key

### 3. Configurar Gemini

1. Acesse https://aistudio.google.com/app/apikey
2. Crie uma API Key
3. Copie a chave

### 4. Configurar Resend

1. Crie conta em https://resend.com
2. Vá em **API Keys** e crie uma chave
3. **IMPORTANTE**: Configure no Supabase (não no .env.local):
   - Dashboard Supabase > **Settings** > **Edge Functions**
   - Adicione secret: `RESEND_API_KEY` = sua chave

### 4.1 Funcionalidade "Melhorar com IA"

✅ A funcionalidade "Melhorar com IA" usa o **Nano Banana** (`gemini-2.5-flash-image`) diretamente via API do Gemini.

- Usa apenas `GEMINI_API_KEY` (já configurada)
- Melhora fotos de perfil e gera cenas de consultório
- Funciona automaticamente após configurar a `GEMINI_API_KEY` no Supabase

### 5. Criar .env.local

Na raiz do projeto, crie `.env.local`:

```env
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anon-publica
GEMINI_API_KEY=sua-chave-gemini
```

### 6. Configurar Banco de Dados

1. No Supabase Dashboard, vá em **SQL Editor**
2. Execute o conteúdo de `supabase/schema.sql`
3. Execute o conteúdo de `supabase/storage-policies.sql`
4. Crie bucket de storage:
   - Vá em **Storage** > **New bucket**
   - Nome: `landing-page-photos`
   - Marque como **Public**

### 7. Deploy Edge Functions

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Login
supabase login

# Linkar projeto
supabase link --project-ref seu-projeto-id

# Deploy das funções
supabase functions deploy
```

### 8. Configurar Secrets no Supabase

```bash
# Ou via dashboard: Settings > Edge Functions > Add new secret
supabase secrets set GEMINI_API_KEY=sua-chave-gemini
supabase secrets set RESEND_API_KEY=sua-chave-resend
# Nota: LOVABLE_API_KEY não é mais necessária - a função usa GEMINI_API_KEY diretamente
```

### 9. Rodar Localmente

```bash
npm run dev
```

Acesse: http://localhost:8080

## ✅ Checklist

- [ ] Dependências instaladas (`npm install`)
- [ ] Projeto Supabase criado
- [ ] Credenciais Supabase no `.env.local`
- [ ] Chave Gemini no `.env.local` e no Supabase (secrets)
- [ ] Chave Resend configurada no Supabase (secrets)
- [ ] Banco de dados configurado (schema.sql executado)
- [ ] Storage bucket criado
- [ ] Edge Functions deployadas
- [ ] Servidor rodando (`npm run dev`)

## 🐛 Problemas Comuns

**Erro: "Configuração do backend ausente"**
- Verifique se `.env.local` existe e tem as variáveis corretas
- Reinicie o servidor

**Emails não funcionam**
- Verifique se `RESEND_API_KEY` está configurada no Supabase
- Em modo teste, só envia para emails verificados

**Edge Functions não funcionam**
- Verifique se fez deploy: `supabase functions deploy`
- Verifique se os secrets estão configurados

## 📚 Documentação Completa

Para mais detalhes, veja:
- **SETUP_LOCAL.md** - Guia completo e detalhado
- **ENV_EXAMPLE.md** - Exemplo de variáveis de ambiente
