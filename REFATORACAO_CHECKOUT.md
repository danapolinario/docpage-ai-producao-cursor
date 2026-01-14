# ✅ Refatoração do Checkout - Fluxo em Etapas

## 🎯 O que foi implementado

### Novo Fluxo em 3 Etapas

1. **Step 1: Criar Conta e Autenticar**
   - Usuário preenche email, senha e confirmações
   - Sistema tenta fazer login (se já tem conta) ou criar nova conta
   - Após autenticação bem-sucedida, avança automaticamente para Step 2

2. **Step 2: Escolher e Verificar Domínio**
   - Usuário escolhe o domínio desejado
   - Sistema verifica disponibilidade **real** usando `checkSubdomainAvailability()`
   - Mostra feedback visual (disponível/não disponível)
   - Após domínio validado, avança automaticamente para Step 3

3. **Step 3: Dados de Pagamento**
   - Usuário insere dados do cartão
   - Sistema processa pagamento (mock) e cria landing page
   - Após sucesso, redireciona para dashboard

---

## 📋 Arquivos Modificados

### 1. `components/CheckoutFlow.tsx` - Refatorado Completo

**Mudanças principais:**
- ✅ Sistema de steps (currentStep: 1 | 2 | 3)
- ✅ Step 1: Criação de conta e autenticação
- ✅ Step 2: Seleção e verificação de domínio
- ✅ Step 3: Dados de pagamento
- ✅ Navegação entre steps
- ✅ Indicador de progresso no sidebar
- ✅ Validação por step

**Funcionalidades:**
- `handleCreateAccount()` - Cria conta ou faz login
- `handleCheckDomain()` - Verifica disponibilidade real do domínio
- `handleSubmitPayment()` - Processa pagamento e cria landing page

### 2. `services/payment-flow.ts` - Simplificado

**Mudanças:**
- ✅ Removido fluxo de criação de conta (agora é no Step 1)
- ✅ Assume que usuário já está autenticado quando chega ao pagamento
- ✅ Apenas verifica autenticação (não cria conta)

### 3. `services/landing-pages.ts` - Melhorado

**Mudanças:**
- ✅ `checkSubdomainAvailability()` agora usa função SQL `check_subdomain_available()`
- ✅ Fallback para método direto se função não existir
- ✅ `createLandingPage()` melhorado com verificação de sessão

### 4. `supabase/schema.sql` - Nova Função SQL

**Adicionado:**
- ✅ Função `check_subdomain_available(TEXT)` - permite verificação pública
- ✅ Permissão `GRANT EXECUTE` para anon e authenticated

---

## 🔧 Configuração Necessária no Supabase

### Executar SQL no Supabase Dashboard

Você precisa executar este SQL no SQL Editor do Supabase:

```sql
-- Criar função SQL para verificar disponibilidade de subdomínio
CREATE OR REPLACE FUNCTION check_subdomain_available(check_subdomain TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 
    FROM landing_pages 
    WHERE subdomain = LOWER(check_subdomain)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir execução pública da função
GRANT EXECUTE ON FUNCTION check_subdomain_available(TEXT) TO anon, authenticated;
```

**Onde executar:**
1. Acesse https://supabase.com/dashboard/project/[seu-projeto]/sql/new
2. Cole o SQL acima
3. Execute (Run)

---

## 🎨 Interface do Usuário

### Indicador de Progresso
- Sidebar mostra 3 steps com checkmarks
- Step atual destacado em azul
- Steps completados mostram ✓
- Step atual mostra número

### Feedback Visual
- **Step 1**: Botão muda para "Conta Criada - Continuar →" após sucesso
- **Step 2**: Domínio disponível mostra verde com checkmark
- **Step 2**: Domínio não disponível mostra vermelho com mensagem de erro
- **Step 3**: Botão de pagamento apenas habilitado quando válido

### Navegação
- Botão "Voltar" em cada step (exceto Step 1)
- Navegação automática após completar step
- Não permite avançar sem completar step anterior

---

## 🔄 Fluxo Completo

```
┌─────────────────────┐
│  Step 1: Criar Conta│
│  - Email            │
│  - Senha            │
│  └── Autentica      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Step 2: Domínio    │
│  - Escolhe domínio  │
│  - Verifica real    │
│  └── Reserva        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Step 3: Pagamento  │
│  - Dados cartão     │
│  - Processa         │
│  └── Cria Landing   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    Dashboard        │
└─────────────────────┘
```

---

## ✅ Validações Implementadas

### Step 1: Conta
- ✅ Email válido e emails coincidem
- ✅ Senha mínimo 6 caracteres
- ✅ Senhas coincidem
- ✅ Tenta login primeiro, depois cria conta

### Step 2: Domínio
- ✅ Domínio mínimo 3 caracteres
- ✅ Verifica disponibilidade real no banco
- ✅ Valida formato (apenas letras, números, hífens)
- ✅ Verifica palavras reservadas
- ✅ Mostra erro se não disponível

### Step 3: Pagamento
- ✅ Número do cartão formatado (16 dígitos)
- ✅ Data de validade (MM/AA)
- ✅ CVC (3-4 dígitos)
- ✅ Nome no cartão

---

## 🐛 Correções Aplicadas

### Problema RLS (Row Level Security)
- ✅ Verificação de sessão antes de criar landing page
- ✅ Refresh de sessão se necessário
- ✅ Garantir que `auth.uid()` está disponível no momento do insert

### Verificação de Domínio
- ✅ Usa função SQL `check_subdomain_available()` (permite verificação pública)
- ✅ Fallback para método direto se função não existir
- ✅ Tratamento de erros adequado

---

## 📝 Próximos Passos

### Para Produção:
1. **Executar SQL no Supabase** - Criar função `check_subdomain_available()`
2. **Testar fluxo completo** - Verificar que tudo funciona
3. **Integrar Stripe real** - Substituir mock por integração real
4. **Adicionar validações** - Validação de email já existe, validação de domínio real

---

**Refatorado em**: 2024
**Status**: ✅ Completo
**Próximo passo**: Executar SQL no Supabase e testar fluxo completo
