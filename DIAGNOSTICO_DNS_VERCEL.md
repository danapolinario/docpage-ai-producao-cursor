# 🔍 Diagnóstico: Configuração DNS no Vercel

## ⚠️ Problema Identificado

Você tem **dois registros wildcard** (`*`) configurados:

1. **CNAME manual**: `*` → `cname.vercel-dns.com.`
2. **ALIAS automático**: `*` → `cname.vercel-dns-017.com.` (gerenciado pelo Vercel)

Isso pode causar conflito e fazer com que o Vercel não reconheça corretamente os subdomínios.

## ✅ Solução

### Passo 1: Remover o CNAME Manual

O Vercel já está gerenciando automaticamente o wildcard via ALIAS. O registro CNAME manual pode estar causando conflito.

**Ação:**
1. Acesse o painel DNS do Vercel
2. **Remova** o registro CNAME manual:
   - Nome: `*`
   - Tipo: `CNAME`
   - Valor: `cname.vercel-dns.com.`
3. **Mantenha** apenas o ALIAS automático gerenciado pelo Vercel

### Passo 2: Verificar se Domínio Wildcard está Adicionado no Projeto

**CRÍTICO:** O domínio wildcard precisa estar adicionado no projeto, não apenas no DNS.

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Domains**
4. Verifique se `*.docpage.com.br` está listado
5. Se **NÃO estiver**, adicione:
   - Clique em **Add Domain**
   - Digite: `*.docpage.com.br`
   - O Vercel deve detectar automaticamente o DNS

### Passo 3: Verificar Certificado SSL

Os certificados SSL wildcard estão configurados corretamente:
- ✅ `cert_my2Kai6S52UonU9VI1bLEKRZ` - `*.docpage.com.br` (válido até Apr 20 2026)

Isso está correto e não precisa de alteração.

## 🔧 Configuração DNS Recomendada

Após remover o CNAME manual, você deve ter apenas:

```
* (ALIAS) → cname.vercel-dns-017.com. (gerenciado automaticamente pelo Vercel)
```

**Não é necessário** ter o CNAME manual se o Vercel já está gerenciando via ALIAS.

## 🧪 Teste Após Correção

1. **Aguarde 5-10 minutos** após remover o CNAME manual
2. Teste o acesso:
   ```bash
   curl -I https://seu-subdominio.docpage.com.br
   ```
3. Verifique os logs do Vercel:
   - Dashboard → Deployments → último deployment → Functions → Logs
   - Deve aparecer a função sendo executada

## 📝 Checklist Final

- [ ] Removido CNAME manual `*` → `cname.vercel-dns.com.`
- [ ] Mantido apenas ALIAS automático gerenciado pelo Vercel
- [ ] Verificado que `*.docpage.com.br` está adicionado em Settings → Domains
- [ ] Aguardado propagação DNS (5-10 minutos)
- [ ] Testado acesso ao subdomínio
- [ ] Verificado logs do Vercel

## 🚨 Se Ainda Não Funcionar

Se após seguir os passos acima ainda não funcionar:

1. **Verifique os logs do Vercel** para ver se a função está sendo chamada
2. **Teste com um subdomínio específico** que você sabe que existe no banco
3. **Verifique se a landing page está com status `published`** no banco de dados
4. **Confirme que o subdomínio no banco corresponde exatamente** ao que você está acessando

## 💡 Nota Importante

O registro ALIAS automático do Vercel é suficiente para fazer os subdomínios funcionarem. O CNAME manual adicional pode estar causando conflito de resolução DNS.
