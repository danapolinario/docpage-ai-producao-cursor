# 🔍 Diagnóstico - Erro 500 no Stripe Checkout (Produção)

## Problema
Ao clicar em "Ir para Pagamento Seguro", aparece erro: **"Edge Function returned a non-2xx status code"**

## Possíveis Causas

### 1. STRIPE_SECRET_KEY não configurada ou incorreta

**Verificar:**
1. Acesse: https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/settings/functions
2. Verifique se existe o secret `STRIPE_SECRET_KEY`
3. Verifique se a chave começa com `sk_live_` (produção) e não `sk_test_` (teste)

**Corrigir:**
```bash
# Via CLI do Supabase
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_sua_chave_aqui --project-ref ezbwoibhtwiqzgedoajr
```

**Ou via Dashboard:**
1. Supabase Dashboard > Settings > Edge Functions > Secrets
2. Adicione ou edite `STRIPE_SECRET_KEY`
3. Cole a chave de produção do Stripe (começa com `sk_live_`)

### 2. Price IDs incorretos ou não existem no Stripe (modo Live)

**Verificar no Stripe Dashboard (modo Live):**
1. Acesse: https://dashboard.stripe.com/products (modo Live)
2. Verifique se os seguintes Price IDs existem e estão ativos:

**Price IDs esperados:**
- Starter mensal: `price_1SxQTF1zmyrvN5yEs7pJHOOX`
- Starter anual: `price_1SxQTL1zmyrvN5yEwtG3azA7`
- Pro mensal: `price_1SxDwP1zmyrvN5yEJRZuIwyt`
- Pro anual: `price_1SxQTC1zmyrvN5yECtoyxRWm`

**Se os Price IDs estiverem diferentes:**
1. Atualize o arquivo `supabase/functions/stripe-create-checkout/index.ts`
2. Atualize o mapeamento `PLAN_PRICE_MAP` (linhas 25-38)
3. Faça deploy da Edge Function:
```bash
npx supabase functions deploy stripe-create-checkout --project-ref ezbwoibhtwiqzgedoajr
```

### 3. Verificar logs da Edge Function

**Para ver os logs detalhados:**
1. Acesse: https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/logs/edge-functions
2. Selecione a função `stripe-create-checkout`
3. Procure por erros recentes
4. Os logs agora incluem:
   - Se a chave está configurada
   - Se é chave de produção ou teste
   - Qual Price ID está sendo usado
   - Erro detalhado do Stripe

### 4. Problema do Bucket de Storage (erro secundário)

**Erro nos logs:**
```
StorageApiError: Bucket not found
```

**Verificar:**
1. Acesse: https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/storage/buckets
2. Verifique se existe o bucket `landing-pages`
3. Se não existir, crie:
   - Nome: `landing-pages`
   - Público: Sim (para permitir acesso às imagens)

**Criar bucket via SQL:**
```sql
-- Criar bucket landing-pages
INSERT INTO storage.buckets (id, name, public)
VALUES ('landing-pages', 'landing-pages', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload (authenticated users)
CREATE POLICY "Users can upload to landing-pages"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'landing-pages');

-- Política para permitir leitura (public)
CREATE POLICY "Public can read landing-pages"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'landing-pages');
```

## Checklist de Verificação

- [ ] `STRIPE_SECRET_KEY` configurada no Supabase (Edge Functions Secrets)
- [ ] Chave começa com `sk_live_` (não `sk_test_`)
- [ ] Price IDs existem e estão ativos no Stripe Dashboard (modo Live)
- [ ] Price IDs no código correspondem aos do Stripe Dashboard
- [ ] Edge Function `stripe-create-checkout` foi deployada após atualizar Price IDs
- [ ] Bucket `landing-pages` existe no Storage do Supabase
- [ ] Verificou os logs da Edge Function para ver erro específico

## Próximos Passos

1. **Verifique os logs** da Edge Function no Supabase Dashboard
2. **Confirme a chave** do Stripe está configurada corretamente
3. **Confirme os Price IDs** no Stripe Dashboard (modo Live)
4. **Faça deploy** da Edge Function atualizada:
   ```bash
   npx supabase functions deploy stripe-create-checkout --project-ref ezbwoibhtwiqzgedoajr
   ```

## Melhorias Implementadas

- ✅ Logs mais detalhados na Edge Function
- ✅ Verificação se chave é de produção ou teste
- ✅ Mensagens de erro mais específicas
- ✅ Tratamento melhor de erros de Price ID inválido
