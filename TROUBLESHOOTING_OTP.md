# 🔧 Troubleshooting - Erro ao Gerar Código OTP

## Problema

Ao clicar em "Enviar código" na etapa de "Configuração & Pagamento", aparece: **"Erro ao gerar código"**

## Possíveis Causas e Soluções

### 1. RESEND_API_KEY não configurada

**Sintoma:** Erro ao enviar código

**Solução:**
1. Acesse o dashboard do Supabase: https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr
2. Vá em **Settings** > **Edge Functions**
3. Clique em **"Add new secret"**
4. Nome: `RESEND_API_KEY`
5. Valor: Sua chave do Resend (obtenha em https://resend.com/api-keys)
6. Clique em **"Save"**

**Ou via CLI:**
```bash
supabase secrets set RESEND_API_KEY=sua_chave_resend_aqui
```

### 2. Tabela `otp_codes` não existe

**Sintoma:** Erro ao salvar código no banco

**Solução:**
1. Acesse o SQL Editor no Supabase
2. Execute o conteúdo do arquivo `supabase/migrations/20260114134439_a31baff6-987b-4ce4-9368-182d8aed2b0c.sql`
3. Ou execute este SQL:

```sql
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  code VARCHAR(6) NOT NULL,
  name VARCHAR(100),
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes(expires_at);
```

### 3. Função `send-otp` não deployada

**Sintoma:** Erro 404 ou função não encontrada

**Solução:**
```bash
supabase functions deploy send-otp
```

### 4. Verificar logs detalhados

Após fazer as correções acima, verifique os logs:

1. Acesse: https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/functions
2. Clique em **"send-otp"**
3. Vá em **"Logs"**
4. Veja os erros detalhados

## Checklist de Verificação

- [ ] `RESEND_API_KEY` configurada no Supabase (Settings > Edge Functions > Secrets)
- [ ] Tabela `otp_codes` existe no banco de dados
- [ ] Função `send-otp` foi deployada (`supabase functions deploy send-otp`)
- [ ] Verificou os logs do Supabase para ver erro específico

## Como Testar

1. Tente enviar código novamente
2. Verifique o console do navegador (F12) para ver erros
3. Verifique os logs do Supabase para ver detalhes do erro

## Próximos Passos

Após corrigir, faça deploy da função atualizada:

```bash
supabase functions deploy send-otp
```

A função agora tem melhor tratamento de erros e mostrará mensagens mais específicas sobre o que está faltando.
