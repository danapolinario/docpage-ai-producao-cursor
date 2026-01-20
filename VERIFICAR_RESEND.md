# 🔍 Guia: Como Verificar e Configurar o Resend para docpage.com.br

Este guia te ajuda a verificar se o domínio `docpage.com.br` está configurado corretamente no Resend e como resolver problemas de envio de emails.

---

## 📋 Pré-requisitos

1. Conta no Resend: https://resend.com
2. Domínio `docpage.com.br` registrado
3. Acesso ao painel de DNS do domínio

---

## ✅ Passo 1: Verificar Status do Domínio no Resend

1. Acesse o **Dashboard do Resend**: https://resend.com/domains
2. Faça login na sua conta
3. Procure por `docpage.com.br` na lista de domínios
4. Verifique o **status** do domínio:
   - ✅ **Verified** (Verificado): Domínio está pronto para uso
   - ⏳ **Pending** (Pendente): Aguardando verificação DNS
   - ❌ **Failed** (Falhou): Problema na verificação

---

## 🔧 Passo 2: Verificar Registros DNS

Se o domínio estiver **Pending** ou **Failed**, você precisa configurar os registros DNS:

### 2.1 Obter os Registros DNS do Resend

1. No dashboard do Resend, clique no domínio `docpage.com.br`
2. Você verá uma lista de registros DNS que precisam ser configurados:
   - **SPF Record** (TXT)
   - **DKIM Records** (3 registros CNAME)
   - **DMARC Record** (TXT - opcional mas recomendado)

### 2.2 Configurar os Registros no Seu Provedor DNS

1. Acesse o painel de DNS do seu domínio (onde você registrou `docpage.com.br`)
2. Adicione cada registro conforme mostrado no Resend:

**Exemplo de registros SPF:**
```
Tipo: TXT
Nome: @ (ou docpage.com.br)
Valor: v=spf1 include:resend.com ~all
TTL: 3600 (ou padrão)
```

**Exemplo de registros DKIM:**
```
Tipo: CNAME
Nome: [valor_fornecido_pelo_resend] (ex: resend._domainkey)
Valor: [valor_fornecido_pelo_resend]
TTL: 3600
```

3. **Aguarde a propagação DNS** (pode levar de alguns minutos até 48 horas)

---

## 📧 Passo 3: Verificar Remetente Autorizado

O código usa `noreply@docpage.com.br` como remetente. Verifique se este email pode ser usado:

1. No dashboard do Resend, vá em **Domains** → `docpage.com.br`
2. Procure por **"Authorized Senders"** ou **"From Addresses"**
3. Verifique se `noreply@docpage.com.br` está listado como autorizado
4. Se não estiver:
   - Adicione manualmente, OU
   - O Resend geralmente autoriza qualquer email do domínio verificado

---

## 🔍 Passo 4: Testar o Envio

Após configurar tudo, teste o envio:

### 4.1 Via Dashboard do Resend

1. Vá em **Emails** → **Send Email**
2. Configure:
   - **From**: `noreply@docpage.com.br`
   - **To**: Seu email de teste
   - **Subject**: "Teste DocPage AI"
   - **Body**: Texto qualquer
3. Clique em **Send**
4. Verifique se o email chega na caixa de entrada

### 4.2 Via Código

Após fazer deploy da Edge Function atualizada, tente enviar um código OTP pela aplicação.

---

## ❌ Resolução de Problemas

### Erro: "restricted_to_test_environment"

**Causa:** O Resend está em modo teste.

**Solução:**
1. Verifique se o domínio está completamente verificado
2. Verifique se os registros DNS estão corretos e propagados
3. Aguarde até 48 horas para propagação completa do DNS
4. Verifique se não está usando uma API Key de teste

### Erro: 403 Forbidden

**Causa:** O domínio não está verificado ou o remetente não está autorizado.

**Solução:**
1. Confirme que `docpage.com.br` está com status **Verified** no Resend
2. Verifique se todos os registros DNS estão configurados
3. Confirme que `noreply@docpage.com.br` pode ser usado como remetente
4. Verifique se está usando a API Key correta (não uma key de teste)

### Erro: "Domain not verified"

**Causa:** Os registros DNS não foram configurados ou ainda não propagaram.

**Solução:**
1. Configure todos os registros DNS conforme mostrado no Resend
2. Aguarde a propagação DNS (use ferramentas como https://dnschecker.org)
3. No Resend, clique em **"Verify Domain"** novamente após configurar DNS

---

## 📝 Checklist de Verificação

Use esta checklist para garantir que tudo está configurado:

- [ ] Domínio `docpage.com.br` adicionado no Resend
- [ ] Status do domínio é **Verified** (não Pending ou Failed)
- [ ] Registro SPF configurado no DNS
- [ ] 3 registros DKIM configurados no DNS
- [ ] Registro DMARC configurado (opcional mas recomendado)
- [ ] Aguardou propagação DNS (verificado com dnschecker.org)
- [ ] Remetente `noreply@docpage.com.br` está autorizado
- [ ] API Key do Resend está configurada no Supabase (Settings > Edge Functions > Secrets > RESEND_API_KEY)
- [ ] Edge Function `send-otp` foi deployada após alteração do remetente
- [ ] Teste de envio funcionou via dashboard do Resend

---

## 🔗 Links Úteis

- **Dashboard Resend**: https://resend.com/domains
- **Documentação Resend**: https://resend.com/docs
- **Verificador DNS**: https://dnschecker.org
- **Supabase Edge Functions**: https://supabase.com/dashboard/project/[seu-project-id]/functions

---

## 💡 Dica Importante

Se você acabou de configurar o domínio, **aguarde até 48 horas** para a propagação completa do DNS antes de considerar que há um problema. Alguns provedores DNS propagam rapidamente, outros podem levar mais tempo.

---

## 🆘 Se Ainda Não Funcionar

1. Verifique os logs da Edge Function no Supabase:
   - Dashboard > Edge Functions > send-otp > Logs
   - Procure por mensagens de erro detalhadas

2. Verifique o console do navegador para ver a resposta completa do erro

3. Entre em contato com o suporte do Resend se o domínio está verificado mas ainda dá erro 403

---

**Última atualização:** Após fazer deploy da função `send-otp` atualizada, verifique os logs para mensagens de erro mais detalhadas.
