# 🔍 Diagnóstico - Email de Publicação Não Está Chegando

## Problema
O email de notificação de publicação não está chegando, mesmo quando o console mostra `success: true`.

## O que foi corrigido

### 1. Validação melhorada na Edge Function
A Edge Function `notify-site-published` agora:
- ✅ Verifica se o Resend retornou `data.id` (confirmação de envio)
- ✅ Retorna erro explícito se não houver `data.id`
- ✅ Loga a resposta completa do Resend
- ✅ Verifica se `RESEND_API_KEY` está configurada

### 2. Logs detalhados
Agora você verá nos logs:
- Dados completos da landing page
- Email de destino
- Resposta completa do Resend
- Erros específicos se o envio falhar

## Como diagnosticar

### 1. Verificar logs do Supabase Edge Function

1. Acesse: https://supabase.com/dashboard/project/[seu-project-id]/functions
2. Clique em `notify-site-published`
3. Abra a aba **Logs**
4. Procure por:
   - `Tentando enviar email via Resend:`
   - `Resposta completa do Resend:`
   - `Email de site publicado enviado com sucesso:`
   - Ou erros específicos

### 2. Verificar logs do Resend

1. Acesse: https://resend.com/emails
2. Verifique se há tentativas de envio
3. Verifique o status de cada email:
   - ✅ **Delivered**: Email entregue
   - ⚠️ **Bounced**: Email retornou (email inválido)
   - ⚠️ **Complained**: Email marcado como spam
   - ❌ **Failed**: Falha no envio

### 3. Verificar configuração do Resend

1. Acesse: https://resend.com/domains
2. Verifique se `docpage.com.br` está verificado
3. Verifique os DNS records:
   - ✅ **SPF**: `v=spf1 include:_spf.resend.com ~all`
   - ✅ **DKIM**: Registros CNAME corretos
   - ✅ **DMARC**: Política configurada

### 4. Verificar Secrets do Supabase

1. Acesse: https://supabase.com/dashboard/project/[seu-project-id]/settings/secrets
2. Verifique se `RESEND_API_KEY` está configurada
3. A chave deve começar com `re_`

### 5. Verificar se o email está no briefing_data

Nos logs do Supabase, procure por:
```
Dados da landing page para notificação: {
  toEmail: 'email@exemplo.com' ou 'NÃO ENCONTRADO'
}
```

Se aparecer `NÃO ENCONTRADO`, o problema é que o email não foi salvo no `briefing_data`.

## Possíveis causas

### 1. Email não encontrado no briefing_data
**Sintoma**: Log mostra `toEmail: 'NÃO ENCONTRADO'`

**Solução**:
- Verifique se o formulário de briefing está salvando `contactEmail`
- Verifique o console do navegador ao criar a landing page

### 2. Resend retornando sucesso sem enviar
**Sintoma**: Resposta do Resend não tem `data.id`

**Solução**:
- Verifique os logs completos do Resend
- Verifique se o domínio está verificado
- Verifique se a API key está correta

### 3. Email bloqueado pelo provedor
**Sintoma**: Resend mostra "Delivered" mas email não chega

**Solução**:
- Verifique a pasta de spam
- Verifique se o email de destino está bloqueando emails do domínio
- Adicione `noreply@docpage.com.br` aos contatos

### 4. Domínio não verificado no Resend
**Sintoma**: Resend retorna erro sobre domínio não verificado

**Solução**:
- Verifique e complete a verificação do domínio no Resend
- Configure os DNS records corretamente

## Próximos passos

1. **Faça deploy da Edge Function atualizada**:
   ```bash
   supabase functions deploy notify-site-published
   ```

2. **Teste novamente** criando uma landing page ou publicando pelo admin

3. **Verifique os logs** no Supabase e no Resend

4. **Compartilhe os logs** se o problema persistir:
   - Logs do Supabase (Edge Function)
   - Logs do Resend Dashboard
   - Console do navegador (erros no frontend)

## Melhorias implementadas

✅ Validação rigorosa da resposta do Resend
✅ Logs completos de diagnóstico
✅ Verificação de `data.id` antes de retornar sucesso
✅ Mensagens de erro mais específicas
✅ Logs mostrando email de destino e dados da landing page
