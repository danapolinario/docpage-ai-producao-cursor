# 📧 Troubleshooting - Email não chega mesmo com mensagem de sucesso

## Problema

Você recebe a mensagem "Código enviado para [email]", mas o email não chega na caixa de entrada.

## Causas Comuns

### 1. Resend em Modo Teste (Mais Comum)

O Resend em modo teste **só envia emails para endereços verificados** na sua conta.

**Solução:**
1. Acesse o dashboard do Resend: https://resend.com/emails
2. Vá em **Settings** > **API Keys**
3. Verifique se sua conta está em modo teste
4. **Opção A**: Adicione o email como verificado na conta do Resend
5. **Opção B**: Configure um domínio verificado (recomendado para produção)

### 2. Email na Pasta de Spam

**Solução:**
- Verifique a pasta de **Spam/Lixo Eletrônico**
- Verifique a pasta de **Promoções** (Gmail)
- Adicione `noreply@resend.dev` aos contatos

### 3. Domínio não Verificado

Usando `noreply@resend.dev` tem limitações. Para produção, configure um domínio:

**Solução:**
1. No Resend, vá em **Domains**
2. Clique em **"Add Domain"**
3. Siga as instruções para verificar
4. Configure os registros DNS
5. Após verificação, atualize a função:

```typescript
// Em supabase/functions/send-otp/index.ts
from: "DocPage AI <noreply@seudominio.com>",
```

### 4. Verificar Status do Email no Resend

**Solução:**
1. Acesse: https://resend.com/emails
2. Veja a lista de emails enviados
3. Clique no email para ver detalhes:
   - Status (delivered, bounced, etc.)
   - Se foi entregue
   - Se foi bloqueado

## Como Verificar

### 1. Verificar Logs do Supabase

1. Acesse: https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/functions
2. Clique em **"send-otp"**
3. Vá em **"Logs"**
4. Procure por:
   - "Email enviado com sucesso. ID:"
   - "Resposta completa do Resend:"
   - Verifique se há `emailId` na resposta

### 2. Verificar Dashboard do Resend

1. Acesse: https://resend.com/emails
2. Veja se o email aparece na lista
3. Clique para ver detalhes:
   - **Status**: delivered, pending, bounced?
   - **Destinatário**: está correto?
   - **Data/Hora**: quando foi enviado?

### 3. Testar com Email Verificado

1. No Resend, vá em **Settings**
2. Adicione seu email como verificado
3. Tente enviar código novamente
4. Deve chegar normalmente

## Soluções Rápidas

### Solução 1: Adicionar Email como Verificado (Teste)

1. Dashboard Resend > Settings
2. Adicione o email que você quer testar
3. Confirme o email
4. Tente novamente

### Solução 2: Configurar Domínio (Produção)

1. Dashboard Resend > Domains > Add Domain
2. Configure DNS conforme instruções
3. Aguarde verificação
4. Atualize a função para usar seu domínio
5. Faça deploy: `supabase functions deploy send-otp`

### Solução 3: Verificar Código no Banco (Temporário)

Se o email não chegar, você pode verificar o código diretamente no banco:

1. SQL Editor no Supabase
2. Execute:
```sql
SELECT email, code, created_at, expires_at 
FROM otp_codes 
WHERE email = 'seu@email.com' 
ORDER BY created_at DESC 
LIMIT 1;
```

⚠️ **Atenção**: Isso é apenas para testes. Em produção, sempre use emails.

## Próximos Passos

1. **Verifique os logs** do Supabase para ver o `emailId`
2. **Verifique o dashboard** do Resend para ver o status
3. **Configure domínio** se for para produção
4. **Adicione email verificado** se for apenas teste

## Informações para Debug

Após fazer deploy da função atualizada, os logs mostrarão:
- ID do email enviado
- Resposta completa do Resend
- Se há warnings sobre modo teste

Com essas informações, você pode identificar exatamente o problema.
