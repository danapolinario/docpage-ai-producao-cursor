# 🔍 Guia: Verificar Configuração de Subdomínios no Vercel

## Problema
Subdomínios não estão funcionando - retorna 404: DEPLOYMENT_NOT_FOUND

## ✅ Checklist de Verificação

### 1. Verificar se Domínio Wildcard está Adicionado

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Domains**
4. Verifique se `*.docpage.com.br` está listado
5. Se NÃO estiver:
   - Clique em **Add Domain**
   - Digite: `*.docpage.com.br`
   - O Vercel deve detectar automaticamente o DNS (já configurado)
   - Aguarde alguns minutos para processar

### 2. Verificar Logs do Vercel

1. Dashboard → **Deployments** → último deployment
2. Clique em **Functions** → **Logs**
3. Procure por logs que começam com `[DEBUG]`
4. Verifique:
   - Se a função está sendo chamada
   - Qual é o valor do Host header
   - Se o subdomínio está sendo extraído

### 3. Verificar Headers do Vercel

Os logs devem mostrar todos os headers. Verifique se algum destes contém o subdomínio:
- `host`
- `x-forwarded-host`
- `x-vercel-original-host`
- `x-host`

### 4. Testar Acesso Direto

```bash
# Teste com curl
curl -I https://seu-subdominio.docpage.com.br

# Deve retornar status 200, não 404
```

### 5. Verificar DNS

```bash
# Verificar se DNS está resolvendo
dig seu-subdominio.docpage.com.br

# Deve apontar para cname.vercel-dns.com
```

## 🐛 Problemas Comuns

### Problema 1: Domínio não adicionado no Vercel
**Sintoma:** Erro 404: DEPLOYMENT_NOT_FOUND
**Solução:** Adicione `*.docpage.com.br` em Settings → Domains

### Problema 2: Função não está sendo executada
**Sintoma:** Nenhum log `[DEBUG]` aparece
**Solução:** Verifique se o `vercel.json` está correto e se o deploy foi feito

### Problema 3: Host header não contém subdomínio
**Sintoma:** Logs mostram host diferente do esperado
**Solução:** Verifique se o domínio wildcard está configurado corretamente no DNS

## 📝 Próximos Passos

Após verificar os logs do Vercel, envie:
1. Screenshot dos logs mostrando os headers
2. Resultado do `curl -I https://seu-subdominio.docpage.com.br`
3. Confirmação se `*.docpage.com.br` está adicionado no Vercel
