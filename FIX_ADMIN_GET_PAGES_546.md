# 🔧 Fix: Erro 546 no /admin (Produção)

## Problema

O painel admin em produção estava retornando erro 546 ao tentar buscar landing pages:
- `POST https://ezbwoibhtwiqzgedoajr.supabase.co/functions/v1/admin-get-pages 546`
- `ERR_QUIC_PROTOCOL_ERROR 200 (OK)`
- `Edge Function returned a non-2xx status code`

## Causa

O erro 546 pode ser causado por:
1. **Falha ao fazer parse do JSON do body** - Body vazio ou malformado
2. **Variáveis de ambiente não configuradas** - `SUPABASE_URL` ou `SUPABASE_SERVICE_ROLE_KEY` ausentes
3. **Timeout na Edge Function** - Processamento muito lento
4. **Erro de rede/protocolo** - Problema com QUIC/HTTP3

## Solução Implementada

Melhorias na Edge Function `admin-get-pages`:

1. ✅ **Validação de variáveis de ambiente** - Verifica se `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão configuradas
2. ✅ **Validação de método HTTP** - Garante que apenas POST é aceito
3. ✅ **Tratamento robusto de parsing do body** - Trata body vazio ou malformado
4. ✅ **Logs detalhados de erro** - Facilita debugging em produção
5. ✅ **Mensagens de erro mais claras** - Ajuda a identificar o problema

## Deploy

### Opção 1: Via npx (Recomendado)

```bash
npx supabase functions deploy admin-get-pages --project-ref ezbwoibhtwiqzgedoajr
```

### Opção 2: Via Supabase CLI (se instalado)

```bash
supabase functions deploy admin-get-pages
```

### Opção 3: Via Dashboard do Supabase

1. Acesse: https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/functions
2. Clique em `admin-get-pages`
3. Cole o conteúdo atualizado de `supabase/functions/admin-get-pages/index.ts`
4. Clique em "Deploy"

## Verificação

Após o deploy:

1. **Verifique os logs da Edge Function**:
   - https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/functions/admin-get-pages/logs

2. **Teste o painel admin**:
   - Acesse `/admin` em produção
   - Faça login com credenciais admin
   - Verifique se as landing pages aparecem

3. **Se ainda houver erro**:
   - Verifique os logs da Edge Function para ver o erro específico
   - Verifique se as variáveis de ambiente estão configuradas:
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`

## Variáveis de Ambiente Necessárias

Certifique-se de que estas variáveis estão configuradas no Supabase:

- ✅ `SUPABASE_URL` - URL do projeto Supabase
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key (com permissões elevadas)

Essas variáveis são configuradas automaticamente pelo Supabase, mas podem ser verificadas em:
- Settings > Edge Functions > Secrets

## Melhorias Implementadas

### 1. Validação de Variáveis de Ambiente
```typescript
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !supabaseServiceKey) {
  return new Response(
    JSON.stringify({ error: 'Configuração do servidor incompleta' }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
```

### 2. Validação de Método HTTP
```typescript
if (req.method !== 'POST') {
  return new Response(
    JSON.stringify({ error: 'Método não permitido. Use POST.' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
```

### 3. Tratamento Robusto de Parsing
```typescript
try {
  body = await req.json()
} catch (parseError: any) {
  // Tratamento específico para body vazio
  if (parseError?.message?.includes('Unexpected end of JSON input')) {
    return new Response(
      JSON.stringify({ error: 'Body vazio. userId é obrigatório.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  // Outros erros de parsing
  return new Response(
    JSON.stringify({ error: 'Body inválido ou malformado', details: parseError?.message }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
```

### 4. Logs Detalhados
```typescript
catch (error: any) {
  console.error('Admin get pages error:', {
    message: error?.message,
    stack: error?.stack,
    name: error?.name,
    error: error
  })
  // ...
}
```

## Troubleshooting

### Erro persiste após deploy

1. **Verifique os logs da Edge Function**:
   - Acesse os logs no dashboard do Supabase
   - Procure por mensagens de erro específicas

2. **Verifique variáveis de ambiente**:
   ```bash
   supabase secrets list
   ```

3. **Teste a função diretamente**:
   ```bash
   curl -X POST https://ezbwoibhtwiqzgedoajr.supabase.co/functions/v1/admin-get-pages \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -d '{"userId": "USER_ID_HERE"}'
   ```

4. **Verifique se o usuário tem role admin**:
   ```sql
   SELECT * FROM user_roles WHERE user_id = 'USER_ID' AND role = 'admin';
   ```
