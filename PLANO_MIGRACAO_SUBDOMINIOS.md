# 📋 Plano de Migração: Path-based para Subdomínios

## Objetivo
Migrar a estrutura de URLs de `https://docpage.com.br/XXX` para `https://xxx.docpage.com.br`

---

## 📊 Situação Atual vs. Desejada

### Atual
- URL: `https://docpage.com.br/{subdomain}`
- Roteamento: Express roteia `/:subdomain` como path
- Exemplo: `https://docpage.com.br/drjoaosilva`

### Desejado
- URL: `https://{subdomain}.docpage.com.br`
- Roteamento: Express detecta subdomínio do `Host` header
- Exemplo: `https://drjoaosilva.docpage.com.br`

---

## 🔧 Fase 1: Mudanças no Servidor (Backend)

### 1.1 Atualizar `server/index.ts`

**Mudanças necessárias:**

```typescript
// ANTES: Rota path-based
app.get('/:subdomain', async (req, res) => {
  const { subdomain } = req.params;
  // ...
});

// DEPOIS: Detectar subdomínio do Host header
app.use((req, res, next) => {
  const host = req.get('host') || '';
  const subdomain = extractSubdomain(host);
  
  if (subdomain && subdomain !== 'www' && subdomain !== 'docpage') {
    req.subdomain = subdomain;
  }
  
  next();
});

// Rota raiz - verificar se é subdomínio
app.get('/', async (req, res) => {
  if (req.subdomain) {
    // Buscar landing page pelo subdomínio
    // ... lógica SSR existente
  } else {
    // Servir SPA principal
    res.sendFile(join(distPath, 'index.html'));
  }
});
```

**Função auxiliar:**
```typescript
function extractSubdomain(host: string): string | null {
  // Remove porta se houver
  const hostname = host.split(':')[0];
  
  // Verificar se é subdomínio de docpage.com.br
  if (hostname.endsWith('.docpage.com.br')) {
    const parts = hostname.split('.');
    if (parts.length >= 4) {
      return parts[0]; // Retorna o primeiro segmento (subdomínio)
    }
  }
  
  return null;
}
```

### 1.2 Atualizar `server/render.tsx`

**Mudança na geração de URLs:**
```typescript
// ANTES:
const pageUrl = landingPage.custom_domain 
  ? `https://${landingPage.custom_domain}` 
  : `${baseUrl}/${landingPage.subdomain}`;

// DEPOIS:
const pageUrl = landingPage.custom_domain 
  ? `https://${landingPage.custom_domain}` 
  : `https://${landingPage.subdomain}.docpage.com.br`;
```

---

## 🎨 Fase 2: Mudanças no Frontend

### 2.1 Atualizar Geração de URLs

**Arquivos a modificar:**

#### `services/payment-flow.ts` (linha 216)
```typescript
// ANTES:
const landingPageUrl = `${baseUrl}/${landingPage.subdomain}`;

// DEPOIS:
const landingPageUrl = `https://${landingPage.subdomain}.docpage.com.br`;
```

#### `services/dashboard.ts` (linha 114)
```typescript
// ANTES:
domain: `docpage.com.br/${landingPage.subdomain}`,

// DEPOIS:
domain: `${landingPage.subdomain}.docpage.com.br`,
```

#### `components/AdminDashboard.tsx` (linha 91-94)
```typescript
// ANTES:
const getLandingPageUrl = (subdomain: string) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/${subdomain}`;
};

// DEPOIS:
const getLandingPageUrl = (subdomain: string) => {
  return `https://${subdomain}.docpage.com.br`;
};
```

#### `services/landing-pages.ts` (linha 532)
```typescript
// ANTES:
const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://docpage.com.br';

// DEPOIS: (se usado para gerar URLs de landing pages)
// Verificar contexto e usar subdomínio quando apropriado
```

#### `supabase/functions/notify-site-published/index.ts` (linha 164)
```typescript
// ANTES:
: `docpage.com.br/${landingPage.subdomain}`;

// DEPOIS:
: `${landingPage.subdomain}.docpage.com.br`;
```

### 2.2 Atualizar Referências em Componentes

#### `components/SaaSLanding.tsx` (linha 1070)
```typescript
// ANTES:
docpage.com.br/preview

// DEPOIS:
preview.docpage.com.br (ou manter como está se for apenas visual)
```

#### `components/VisualConfig.tsx` (linha 275)
```typescript
// ANTES:
docpage.com.br/preview/...

// DEPOIS:
preview.docpage.com.br/... (ou manter como está se for apenas visual)
```

---

## 🌐 Fase 3: Configuração de DNS

### 3.1 DNS Wildcard

**Registro DNS necessário:**

```
Tipo: A (ou CNAME)
Nome: *.docpage.com.br
Valor: [IP do servidor ou CNAME para docpage.com.br]
TTL: 3600 (ou menor para testes)
```

**Exemplo de configuração:**

#### Opção 1: A Record (se você tem IP fixo)
```
*.docpage.com.br    A     [IP_DO_SERVIDOR]
```

#### Opção 2: CNAME (recomendado se usar serviços como Vercel, Netlify, etc.)
```
*.docpage.com.br    CNAME    docpage.com.br
```

### 3.2 Verificação de Subdomínios

**Teste manual:**
```bash
# Verificar resolução DNS
nslookup drjoaosilva.docpage.com.br

# Testar acesso HTTP
curl -I https://drjoaosilva.docpage.com.br
```

---

## 🚀 Fase 4: Configuração do Provedor de Hospedagem

### 4.1 Vercel (se aplicável)

**No `vercel.json` ou configuração do projeto:**
```json
{
  "domains": ["docpage.com.br", "*.docpage.com.br"]
}
```

**No dashboard da Vercel:**
1. Settings → Domains
2. Adicionar `*.docpage.com.br` como domínio wildcard
3. Configurar DNS conforme instruções

### 4.2 Netlify (se aplicável)

**No `netlify.toml`:**
```toml
[[redirects]]
  from = "https://*.docpage.com.br/*"
  to = "/"
  status = 200
  force = true
```

**No dashboard da Netlify:**
1. Site settings → Domain management
2. Adicionar `*.docpage.com.br`
3. Configurar DNS

### 4.3 Servidor Próprio (Express/Node.js)

**Middleware para detectar subdomínio:**
```typescript
app.use((req, res, next) => {
  const host = req.get('host') || '';
  const subdomain = extractSubdomain(host);
  
  if (subdomain) {
    req.subdomain = subdomain;
  }
  
  next();
});
```

**Certificado SSL:**
- Certificado wildcard: `*.docpage.com.br`
- Ou usar Let's Encrypt com wildcard via DNS challenge

---

## 🔄 Fase 5: Migração de Dados (se necessário)

### 5.1 Verificação

**Query para verificar subdomínios existentes:**
```sql
SELECT subdomain, status, created_at 
FROM landing_pages 
WHERE status = 'published'
ORDER BY created_at DESC;
```

### 5.2 Redirecionamentos (Opcional)

**Se quiser manter compatibilidade temporária:**

```typescript
// Middleware de redirecionamento
app.get('/:subdomain', async (req, res) => {
  const { subdomain } = req.params;
  
  // Ignorar rotas especiais
  if (['admin', 'api', 'assets'].includes(subdomain)) {
    return res.sendFile(join(distPath, 'index.html'));
  }
  
  // Redirecionar para subdomínio
  return res.redirect(301, `https://${subdomain}.docpage.com.br`);
});
```

---

## 📝 Fase 6: Atualização de Documentação

### 6.1 Emails e Notificações

**Atualizar templates de email:**
- `supabase/functions/notify-site-published/index.ts`
- Qualquer outro template que mencione URLs

### 6.2 Documentação Interna

**Atualizar:**
- README.md
- Documentação de API
- Guias de configuração

---

## ✅ Checklist de Implementação

### Backend
- [ ] Atualizar `server/index.ts` para detectar subdomínios
- [ ] Atualizar `server/render.tsx` para gerar URLs corretas
- [ ] Testar roteamento de subdomínios localmente

### Frontend
- [ ] Atualizar `services/payment-flow.ts`
- [ ] Atualizar `services/dashboard.ts`
- [ ] Atualizar `components/AdminDashboard.tsx`
- [ ] Atualizar `supabase/functions/notify-site-published/index.ts`
- [ ] Verificar e atualizar outros arquivos que geram URLs

### DNS e Infraestrutura
- [ ] Configurar registro DNS wildcard `*.docpage.com.br`
- [ ] Configurar certificado SSL wildcard
- [ ] Testar resolução DNS
- [ ] Testar acesso HTTPS aos subdomínios

### Testes
- [ ] Testar criação de nova landing page
- [ ] Testar acesso a landing page existente via subdomínio
- [ ] Testar redirecionamentos (se implementados)
- [ ] Testar emails com novas URLs
- [ ] Testar dashboard com novas URLs

### Documentação
- [ ] Atualizar templates de email
- [ ] Atualizar documentação
- [ ] Comunicar mudança aos usuários (se necessário)

---

## 🔒 Configuração DNS Final para o Usuário

### Quando o usuário quiser usar seu próprio domínio

**Exemplo:** Usuário tem `drjoaosilva.com.br` e quer apontar para `drjoaosilva.docpage.com.br`

### Configuração DNS no domínio do usuário:

#### Opção 1: CNAME (Recomendado)
```
Tipo: CNAME
Nome: @ (ou deixar em branco para raiz)
Valor: drjoaosilva.docpage.com.br
TTL: 3600
```

**Nota:** Alguns provedores não permitem CNAME na raiz. Nesse caso, use a Opção 2.

#### Opção 2: A Record (se CNAME não for possível)
```
Tipo: A
Nome: @ (ou deixar em branco para raiz)
Valor: [IP do servidor docpage.com.br]
TTL: 3600
```

**Para encontrar o IP:**
```bash
dig docpage.com.br +short
# ou
nslookup docpage.com.br
```

#### Opção 3: CNAME em www (Alternativa)
```
Tipo: CNAME
Nome: www
Valor: drjoaosilva.docpage.com.br
TTL: 3600
```

Isso fará `www.drjoaosilva.com.br` apontar para o subdomínio.

### Verificação

**Após configurar DNS, verificar:**
```bash
# Verificar resolução
nslookup drjoaosilva.com.br

# Verificar acesso
curl -I https://drjoaosilva.com.br
```

### Tempo de Propagação

- **TTL baixo (300-600s):** Mudanças mais rápidas, mas mais consultas DNS
- **TTL padrão (3600s):** Balanceamento entre performance e flexibilidade
- **Propagação completa:** Geralmente 24-48 horas (máximo)

---

## 🚨 Considerações Importantes

### 1. Certificado SSL
- Certificado wildcard necessário: `*.docpage.com.br`
- Renovação automática recomendada (Let's Encrypt)

### 2. Limites de Subdomínios
- Verificar limites do provedor de DNS
- Alguns serviços têm limites (ex: 100 subdomínios)

### 3. Performance
- DNS lookup adicional para cada subdomínio
- Cache DNS ajuda a mitigar

### 4. SEO
- Subdomínios são tratados como domínios separados pelo Google
- Considerar impacto no SEO (pode ser positivo ou negativo)

### 5. Cookies e Sessões
- Cookies não são compartilhados entre subdomínios por padrão
- Se necessário, configurar `domain=.docpage.com.br`

### 6. CORS
- Se usar APIs, configurar CORS para aceitar subdomínios:
  ```typescript
  app.use(cors({
    origin: /^https:\/\/.*\.docpage\.com\.br$/
  }));
  ```

---

## 📞 Suporte

**Em caso de dúvidas:**
- Verificar logs do servidor
- Verificar resolução DNS com `dig` ou `nslookup`
- Verificar certificado SSL com `openssl s_client`

---

## 🎯 Resumo da Configuração DNS para o Usuário

**Para o usuário configurar seu domínio próprio:**

1. **Acesse o painel DNS do seu provedor de domínio**
2. **Adicione um registro CNAME:**
   - **Nome:** `@` (ou deixe em branco para raiz)
   - **Tipo:** `CNAME`
   - **Valor:** `{subdomain}.docpage.com.br` (ex: `drjoaosilva.docpage.com.br`)
   - **TTL:** `3600` (ou padrão)

3. **Aguarde a propagação DNS (até 48 horas)**

4. **Verifique o acesso:** `https://seu-dominio.com.br`

**Alternativa (se CNAME na raiz não for suportado):**
- Use registro A apontando para o IP do servidor
- Ou use CNAME em `www` para `www.seu-dominio.com.br`

---

**Data de criação:** 2025-01-XX  
**Versão:** 1.0
