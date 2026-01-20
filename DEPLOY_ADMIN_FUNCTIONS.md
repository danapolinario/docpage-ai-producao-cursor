# 🚀 Deploy das Funções Admin

## Problema

O painel admin não mostra landing pages porque as queries estão sendo bloqueadas por RLS (Row Level Security).

## Solução

Criamos Edge Functions que usam `SUPABASE_SERVICE_ROLE_KEY` para bypassar RLS e buscar todas as landing pages.

## Deploy

### Opção 1: Usando npx (recomendado se não tem Supabase CLI instalado)

```bash
# Deploy da função para buscar landing pages
npx supabase functions deploy admin-get-pages --project-ref ezbwoibhtwiqzgedoajr

# Deploy da função para atualizar status
npx supabase functions deploy admin-update-status --project-ref ezbwoibhtwiqzgedoajr
```

### Opção 2: Usando Supabase CLI (se instalado)

```bash
# Deploy da função para buscar landing pages
supabase functions deploy admin-get-pages

# Deploy da função para atualizar status
supabase functions deploy admin-update-status
```

### Opção 3: Via Dashboard do Supabase

1. Acesse: https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/functions
2. Clique em "Create a new function"
3. Nome: `admin-get-pages`
4. Cole o conteúdo de `supabase/functions/admin-get-pages/index.ts`
5. Clique em "Deploy"
6. Repita para `admin-update-status`

## Variáveis de Ambiente Necessárias

As funções usam automaticamente:
- `SUPABASE_URL` (já configurado)
- `SUPABASE_SERVICE_ROLE_KEY` (já configurado)
- `SUPABASE_ANON_KEY` (já configurado)

Não é necessário configurar nada adicional.

## Teste

Após o deploy:

1. Faça logout do painel admin
2. Faça login novamente
3. As landing pages devem aparecer agora!

## Como Funciona

1. O frontend chama `getAllLandingPages()` do `services/admin.ts`
2. A função faz uma requisição para a Edge Function `admin-get-pages`
3. A Edge Function:
   - Verifica se o usuário está autenticado
   - Verifica se o usuário tem role 'admin' na tabela `user_roles`
   - Se sim, usa `SUPABASE_SERVICE_ROLE_KEY` para buscar todas as landing pages (bypass RLS)
   - Retorna os dados

Isso garante que apenas admins autenticados possam ver todas as landing pages, mas sem depender das políticas RLS que podem estar com problemas.
