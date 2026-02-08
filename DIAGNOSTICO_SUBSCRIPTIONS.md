# 🔍 Diagnóstico: Tabela subscriptions não está sendo populada

## Problemas Identificados e Correções Aplicadas

### 0. ✅ **CRÍTICO: Erro na Validação do Webhook (CORRIGIDO)**
**Problema:** O webhook estava usando `stripe.webhooks.constructEvent()` (síncrono), mas no ambiente Deno/Edge Functions do Supabase é necessário usar a versão assíncrona.

**Erro nos logs:**
```
Erro ao validar assinatura do webhook: SubtleCryptoProvider cannot be used in a synchronous context. Use `await constructEventAsync(...)` instead of `constructEvent(...)`
```

**Correção:** Alterado para `await stripe.webhooks.constructEventAsync()` no arquivo `supabase/functions/stripe-webhook/index.ts`.

**Status:** ✅ CORRIGIDO

### 0.1. ⚠️ **ATENÇÃO: Erro de Assinatura do Webhook**
**Problema:** O webhook está falhando na validação da assinatura:
```
No signatures found matching the expected signature for payload. Are you passing the raw request body you received from Stripe?
```

**Possíveis Causas:**
1. **STRIPE_WEBHOOK_SECRET incorreto ou não configurado**
   - O secret deve ser obtido do Stripe Dashboard após criar o webhook endpoint
   - Cada webhook endpoint tem seu próprio secret único
   - O secret de teste é diferente do secret de produção

a s
**Solução:**
1. Acesse o Stripe Dashboard: https://dashboard.stripe.com/webhooks
2. Encontre o webhook endpoint que aponta para sua Edge Function
3. Clique no webhook e copie o **"Signing secret"** (começa com `whsec_...`)
4. Configure no Supabase:
   - Dashboard Supabase > Settings > Edge Functions > Secrets
   - Adicione: `STRIPE_WEBHOOK_SECRET` = `whsec_...`
5. Ou via CLI:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_seu_secret_aqui
   ```
6. **IMPORTANTE:** Se você tem webhooks de teste e produção, use secrets diferentes ou endpoints diferentes

**Status:** ⚠️ REQUER CONFIGURAÇÃO - Verifique se o STRIPE_WEBHOOK_SECRET está correto

### 1. ✅ CHECK Constraint Restritivo
**Problema:** A tabela `subscriptions` tinha um CHECK constraint que aceitava apenas 5 status, mas o Stripe pode retornar mais status.

**Correção:** Migração `20260204083454_fix_subscriptions_rls.sql` atualiza o constraint para aceitar:
- `active`, `canceled`, `past_due`, `unpaid`, `trialing`
- `incomplete`, `incomplete_expired`, `paused`

### 2. ✅ Logs Detalhados Adicionados
**Problema:** Erros estavam sendo silenciados, dificultando o diagnóstico.

**Correção:** Adicionados logs detalhados em `upsertSubscription`:
- Logs de entrada com todos os parâmetros
- Logs de validação de dados
- Logs de erros com código, mensagem, detalhes e hint
- Logs de sucesso com IDs criados

### 3. ✅ Validação de Dados
**Problema:** Falta de validação de `customerId` e `userId` antes de inserir.

**Correção:** Adicionadas validações explícitas antes de chamar `upsertSubscription`.

### 4. ✅ Propagação de Erros
**Problema:** Erros estavam sendo capturados mas não propagados.

**Correção:** Erros agora são propagados para que o webhook retorne erro ao Stripe.

## Próximos Passos para Diagnóstico

### Passo 1: Aplicar a Migração
```bash
# No terminal, execute:
supabase db push

# OU aplique manualmente no SQL Editor do Supabase Dashboard:
# https://supabase.com/dashboard/project/[seu-projeto]/sql/new
# Cole o conteúdo de: supabase/migrations/20260204083454_fix_subscriptions_rls.sql
```

### Passo 2: Verificar Logs do Webhook
1. Acesse o Supabase Dashboard
2. Vá em **Edge Functions** > **stripe-webhook** > **Logs**
3. Procure por logs que contenham:
   - `stripe-webhook: checkout.session.completed recebido`
   - `stripe-webhook: upsertSubscription iniciado`
   - `stripe-webhook: Erro ao criar subscription`

### Passo 3: Verificar se o Webhook está sendo Chamado
1. Acesse o Stripe Dashboard
2. Vá em **Developers** > **Webhooks**
3. Verifique se há eventos `checkout.session.completed` sendo enviados
4. Clique em um evento e verifique:
   - Se o webhook retornou 200 (sucesso) ou erro
   - Se há mensagens de erro no payload de resposta

### Passo 4: Testar Manualmente
Execute este SQL no Supabase SQL Editor para verificar se a tabela está acessível:

```sql
-- Verificar se a tabela existe e tem a estrutura correta
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar constraints
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'subscriptions'
AND table_schema = 'public';

-- Verificar políticas RLS
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'subscriptions'
AND schemaname = 'public';

-- Tentar inserir um registro de teste (deve falhar por validação, mas não por RLS)
-- IMPORTANTE: Use um UUID válido de um usuário existente
INSERT INTO public.subscriptions (
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  plan_id,
  billing_period,
  status,
  current_period_start,
  current_period_end
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid, -- Substitua por um UUID válido
  'cus_test_123',
  'sub_test_123',
  'price_test_123',
  'starter',
  'monthly',
  'active',
  NOW(),
  NOW() + INTERVAL '1 month'
);
```

### Passo 5: Verificar Variáveis de Ambiente
Certifique-se de que o webhook tem acesso às variáveis de ambiente:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

No Supabase Dashboard:
1. Vá em **Edge Functions** > **stripe-webhook** > **Settings**
2. Verifique se todas as variáveis estão configuradas

## Possíveis Causas Restantes

1. **Webhook não está sendo chamado pelo Stripe**
   - Verifique se o webhook está configurado no Stripe Dashboard
   - Verifique se a URL do webhook está correta
   - Verifique se o webhook está deployado

2. **Erro de validação de dados**
   - Verifique os logs para ver qual campo está causando erro
   - Verifique se `userId` está sendo passado corretamente na metadata da sessão

3. **Problema com RLS (improvável, mas possível)**
   - O service role deveria bypassar RLS automaticamente
   - Verifique se o webhook está usando `SUPABASE_SERVICE_ROLE_KEY`

4. **Constraint ainda não atualizado**
   - A migração pode não ter sido aplicada
   - Execute a migração manualmente se necessário

## Como Verificar se Funcionou

Após aplicar as correções e fazer um novo pagamento:

1. Verifique os logs do webhook para confirmar que `upsertSubscription` foi chamado
2. Execute este SQL para verificar se a subscription foi criada:
```sql
SELECT 
  id,
  user_id,
  stripe_subscription_id,
  status,
  plan_id,
  billing_period,
  created_at
FROM public.subscriptions
ORDER BY created_at DESC
LIMIT 10;
```

3. Se ainda não funcionar, os logs detalhados mostrarão exatamente qual erro está ocorrendo.
