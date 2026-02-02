# 🌐 Configuração DNS para Domínio do Usuário

## Objetivo
Este documento explica como o usuário deve configurar o DNS do seu domínio próprio para apontar para o subdomínio criado no DocPage AI.

---

## 📋 Cenário

**Situação:**
- Usuário criou uma landing page no DocPage AI
- Subdomínio criado: `drjoaosilva.docpage.com.br`
- Usuário possui o domínio: `drjoaosilva.com.br`
- Usuário quer que `drjoaosilva.com.br` aponte para `drjoaosilva.docpage.com.br`

---

## 🔧 Configuração DNS

### Opção 1: CNAME (Recomendado) ⭐

**Configuração no painel DNS do provedor do domínio:**

```
Tipo:     CNAME
Nome:     @ (ou deixar em branco)
Valor:    drjoaosilva.docpage.com.br
TTL:      3600 (ou padrão)
```

**Explicação:**
- `@` representa a raiz do domínio (sem www)
- `CNAME` cria um alias que aponta para outro domínio
- Quando alguém acessa `drjoaosilva.com.br`, será redirecionado para `drjoaosilva.docpage.com.br`

**Vantagens:**
- ✅ Fácil de configurar
- ✅ Se o IP do servidor mudar, não precisa atualizar
- ✅ Funciona automaticamente com SSL

**Limitações:**
- ⚠️ Alguns provedores não permitem CNAME na raiz (@)
- ⚠️ Se não funcionar, use a Opção 2

---

### Opção 2: A Record (Alternativa)

**Quando usar:**
- Seu provedor não permite CNAME na raiz
- Você precisa de mais controle

**Passo 1: Descobrir o IP do servidor**

Execute no terminal:
```bash
dig docpage.com.br +short
# ou
nslookup docpage.com.br
```

**Exemplo de resultado:**
```
192.0.2.1
```

**Passo 2: Configurar no painel DNS**

```
Tipo:     A
Nome:     @ (ou deixar em branco)
Valor:    192.0.2.1 (use o IP obtido acima)
TTL:      3600 (ou padrão)
```

**Vantagens:**
- ✅ Funciona em todos os provedores
- ✅ Permite CNAME na raiz

**Desvantagens:**
- ⚠️ Se o IP mudar, precisa atualizar manualmente
- ⚠️ Pode não funcionar se o servidor usar load balancer

---

### Opção 3: CNAME em www (Alternativa)

**Quando usar:**
- Você quer que `www.drjoaosilva.com.br` funcione
- CNAME na raiz não é suportado

**Configuração:**

```
Tipo:     CNAME
Nome:     www
Valor:    drjoaosilva.docpage.com.br
TTL:      3600
```

**Resultado:**
- `www.drjoaosilva.com.br` → `drjoaosilva.docpage.com.br`
- `drjoaosilva.com.br` (sem www) não funcionará (a menos que configure A Record também)

---

## 📝 Exemplos por Provedor

### Cloudflare

1. Acesse o dashboard do Cloudflare
2. Selecione seu domínio
3. Vá em **DNS** → **Records**
4. Clique em **Add record**
5. Configure:
   - **Type:** `CNAME`
   - **Name:** `@` (ou deixe em branco)
   - **Target:** `drjoaosilva.docpage.com.br`
   - **Proxy status:** 🟠 DNS only (desligue o proxy laranja)
   - **TTL:** Auto
6. Salve

### Registro.br

1. Acesse o painel do Registro.br
2. Vá em **DNS** → **Gerenciar DNS**
3. Clique em **Adicionar registro**
4. Configure:
   - **Tipo:** `CNAME`
   - **Nome:** `@` (ou deixe em branco)
   - **Valor:** `drjoaosilva.docpage.com.br`
   - **TTL:** `3600`
5. Salve

### GoDaddy

1. Acesse o painel do GoDaddy
2. Vá em **DNS** → **Manage DNS**
3. Na seção **Records**, clique em **Add**
4. Configure:
   - **Type:** `CNAME`
   - **Name:** `@`
   - **Value:** `drjoaosilva.docpage.com.br`
   - **TTL:** `1 Hour`
5. Salve

### Namecheap

1. Acesse o painel do Namecheap
2. Vá em **Domain List** → **Manage**
3. Clique em **Advanced DNS**
4. Na seção **Host Records**, clique em **Add New Record**
5. Configure:
   - **Type:** `CNAME Record`
   - **Host:** `@`
   - **Value:** `drjoaosilva.docpage.com.br`
   - **TTL:** `Automatic`
6. Salve

---

## ✅ Verificação

### Passo 1: Verificar Resolução DNS

Execute no terminal:
```bash
# Linux/Mac
dig drjoaosilva.com.br +short
# ou
nslookup drjoaosilva.com.br

# Windows
nslookup drjoaosilva.com.br
```

**Resultado esperado (CNAME):**
```
drjoaosilva.docpage.com.br.
```

**Resultado esperado (A Record):**
```
192.0.2.1
```

### Passo 2: Verificar Acesso HTTP/HTTPS

```bash
# Verificar se o site está acessível
curl -I https://drjoaosilva.com.br

# Deve retornar status 200 ou 301/302
```

### Passo 3: Testar no Navegador

1. Abra o navegador
2. Acesse `https://drjoaosilva.com.br`
3. Verifique se carrega a landing page corretamente
4. Verifique se o certificado SSL está válido (cadeado verde)

---

## ⏱️ Tempo de Propagação

### TTL (Time To Live)

O TTL define quanto tempo os servidores DNS mantêm o registro em cache:

- **TTL Baixo (300-600s):** Mudanças mais rápidas, mas mais consultas DNS
- **TTL Padrão (3600s):** Balanceamento entre performance e flexibilidade
- **TTL Alto (86400s+):** Melhor performance, mas mudanças demoram mais

### Tempo de Propagação

- **Mínimo:** 5-15 minutos (com TTL baixo)
- **Médio:** 1-4 horas (com TTL padrão)
- **Máximo:** 24-48 horas (em casos raros)

**Dica:** Use ferramentas online para verificar propagação:
- https://www.whatsmydns.net
- https://dnschecker.org

---

## 🔒 Certificado SSL

### Automático (Recomendado)

O DocPage AI gerencia certificados SSL automaticamente via Let's Encrypt. Assim que o DNS estiver configurado corretamente:

1. O sistema detecta o novo domínio
2. Solicita certificado SSL automaticamente
3. Instala o certificado (pode levar alguns minutos)

**Tempo de ativação:** 5-30 minutos após DNS configurado

### Verificação Manual

```bash
# Verificar certificado SSL
openssl s_client -connect drjoaosilva.com.br:443 -servername drjoaosilva.com.br
```

---

## 🚨 Problemas Comuns

### Problema 1: "DNS não resolve"

**Sintomas:**
- Navegador mostra "Este site não pode ser alcançado"
- `nslookup` não retorna resultado

**Soluções:**
1. Verifique se o registro DNS foi salvo corretamente
2. Aguarde a propagação DNS (pode levar até 48h)
3. Verifique se não há erros de digitação no valor
4. Limpe o cache DNS do seu computador:
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Mac/Linux
   sudo dscacheutil -flushcache
   ```

### Problema 2: "Certificado SSL inválido"

**Sintomas:**
- Navegador mostra aviso de certificado
- Certificado não corresponde ao domínio

**Soluções:**
1. Aguarde a geração automática do certificado (5-30 min)
2. Verifique se o DNS está apontando corretamente
3. Entre em contato com o suporte se persistir

### Problema 3: "Redirecionamento infinito"

**Sintomas:**
- Site fica carregando infinitamente
- Erro "ERR_TOO_MANY_REDIRECTS"

**Soluções:**
1. Verifique se não há redirecionamentos configurados no painel DNS
2. Verifique se o CNAME está apontando para o subdomínio correto
3. Limpe cache do navegador

### Problema 4: "CNAME na raiz não permitido"

**Sintomas:**
- Provedor DNS não permite salvar CNAME com nome `@`

**Soluções:**
1. Use A Record (Opção 2) em vez de CNAME
2. Ou use CNAME em `www` (Opção 3) e configure A Record para raiz

---

## 📞 Suporte

**Se precisar de ajuda:**

1. **Verifique os logs:**
   - Confirme que o DNS está configurado corretamente
   - Verifique o tempo de propagação

2. **Informações para o suporte:**
   - Domínio do usuário
   - Subdomínio no DocPage AI
   - Tipo de registro DNS usado
   - Resultado de `nslookup` ou `dig`
   - Screenshot do painel DNS

3. **Contato:**
   - Email: suporte@docpage.com.br
   - Inclua todas as informações acima

---

## 📚 Glossário

- **DNS:** Sistema de Nomes de Domínio (Domain Name System)
- **CNAME:** Registro que cria um alias para outro domínio
- **A Record:** Registro que aponta para um endereço IP
- **TTL:** Time To Live - tempo que o registro fica em cache
- **Propagação:** Processo de atualização dos servidores DNS
- **SSL/TLS:** Protocolo de segurança para conexões HTTPS
- **Wildcard:** Certificado que cobre todos os subdomínios

---

**Última atualização:** 2025-01-XX
