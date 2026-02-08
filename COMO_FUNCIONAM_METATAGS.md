# Como Funcionam as Metatags das Landing Pages

## ✅ Resposta Rápida

**SIM**, os ajustes mudam as metatags de **TODAS** as landing pages já criadas, automaticamente!

## 🔄 Como Funciona

### 1. Metatags Geradas Dinamicamente

As metatags **NÃO** são armazenadas no banco de dados. Elas são geradas **em tempo de execução** a partir dos dados do `briefing_data`:

```typescript
// Exemplo do código (SEOHead.tsx)
const siteName = `Dr(a). ${briefing.name} - ${briefing.specialty} | CRM ${briefing.crm}/${briefing.crmState}`;
```

### 2. Quando as Metatags São Geradas

#### A) Server-Side Rendering (SSR)
Quando a página é renderizada no servidor:
- `server/render.tsx` gera o HTML com metatags no `<head>`
- Usa dados do `briefing_data` da landing page
- **Funciona para todas as landing pages**, novas e antigas

#### B) Client-Side (JavaScript)
Quando a página carrega no navegador:
- `SEOHead.tsx` (React Helmet) atualiza as metatags
- Usa dados do `briefing_data` da landing page
- **Funciona para todas as landing pages**, novas e antigas

### 3. Dados Usados

As metatags são geradas a partir de:
- `briefing_data.name` - Nome do médico
- `briefing_data.specialty` - Especialidade
- `briefing_data.crm` - Número do CRM
- `briefing_data.crmState` - Estado do CRM

**Esses dados já existem em todas as landing pages criadas!**

## 📊 Fluxo de Dados

```
Landing Page (banco de dados)
    ↓
briefing_data (JSONB)
    ↓
Código gera metatags dinamicamente
    ↓
HTML renderizado com metatags corretas
```

## ✅ O Que Foi Alterado

### Arquivos Modificados (afetam TODAS as landing pages):

1. **`components/SEOHead.tsx`**
   - Gera `og:site_name` com dados do médico
   - Remove tags Twitter do DocPage
   - ✅ Afeta todas as landing pages

2. **`server/render.tsx`**
   - Gera `og:site_name` com dados do médico no HTML
   - Remove tags Twitter do DocPage
   - ✅ Afeta todas as landing pages

3. **`api/render.tsx`**
   - Gera `og:site_name` com dados do médico no HTML
   - Remove tags Twitter do DocPage
   - ✅ Afeta todas as landing pages

## 🗄️ Sobre o SQL de Migração

O SQL que criamos (`20260205000000_update_seo_metatags.sql`) é **OPCIONAL** e serve apenas para:

- Atualizar campos `meta_title` e `meta_description` **armazenados no banco**
- Esses campos são usados como **fallback** se não existirem
- **NÃO é necessário** para as metatags funcionarem

### Por que o SQL é opcional?

As metatags são geradas dinamicamente. O código sempre usa:
```typescript
const title = meta_title || `${briefing.name} - ${briefing.specialty}...`;
```

Se `meta_title` não existir ou estiver vazio, o código gera automaticamente a partir do `briefing_data`.

## 🎯 Resultado

### Antes das Alterações:
```html
<meta property="og:site_name" content="DocPage AI" />
<meta name="twitter:site" content="@DocPageAI" />
```

### Depois das Alterações (TODAS as landing pages):
```html
<meta property="og:site_name" content="Dr(a). João Silva - Cardiologia | CRM 12345/SP" />
<!-- Tags Twitter removidas -->
```

## 🔍 Como Verificar

1. **Acesse qualquer landing page** (nova ou antiga)
2. **Visualize o código-fonte** (Ctrl+U / Cmd+U)
3. **Procure por** `<meta property="og:site_name"`
4. **Deve mostrar** o nome do médico, não "DocPage AI"

## ⚠️ Importante

- ✅ **Não precisa atualizar o banco de dados**
- ✅ **Não precisa executar o SQL** (é opcional)
- ✅ **Todas as landing pages já usam as novas metatags**
- ✅ **Funciona automaticamente para landing pages antigas e novas**

## 🚀 Quando as Mudanças Entram em Efeito?

- **Imediatamente** após fazer deploy do código atualizado
- **Não requer** nenhuma ação manual
- **Não requer** atualização de dados no banco

## 📝 Resumo

| Item | Status |
|------|--------|
| Metatags geradas dinamicamente | ✅ Sim |
| Afeta landing pages antigas | ✅ Sim |
| Afeta landing pages novas | ✅ Sim |
| Precisa atualizar banco | ❌ Não |
| SQL é obrigatório | ❌ Não (opcional) |
| Funciona automaticamente | ✅ Sim |
