# 🔧 Troubleshooting - Funcionalidade "Melhorar com IA"

## Problemas Comuns e Soluções

### 1. A foto não está sendo melhorada / retorna imagem original

**Possíveis causas:**

#### A) Modelo não disponível na região
O modelo `gemini-2.5-flash-image` pode não estar disponível em todas as regiões.

**Solução:**
- Verifique os logs do Supabase para ver se há erro 404
- Tente usar outro modelo ou endpoint

#### B) GEMINI_API_KEY não configurada
**Solução:**
```bash
supabase secrets set GEMINI_API_KEY=sua_chave_aqui
```

#### C) Formato da resposta diferente
O Gemini pode estar retornando a imagem em um formato diferente do esperado.

**Solução:**
- Verifique os logs detalhados que foram adicionados
- A resposta completa será logada no console

### 2. Erro 404 - Modelo não encontrado

**Causa:** O modelo `gemini-2.5-flash-image` pode não estar disponível via API REST direta.

**Soluções possíveis:**

#### Opção 1: Usar modelo alternativo
Tente usar `gemini-2.0-flash-exp` ou `gemini-1.5-flash`:

```typescript
// Em photo-enhance/index.ts, altere:
const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
```

#### Opção 2: Verificar disponibilidade do modelo
O modelo pode estar disponível apenas via Vertex AI, não via API REST.

### 3. Erro 402/403 - Pagamento ou Permissões

**Causa:** O modelo pode requerer plano pago ou permissões especiais.

**Solução:**
- Verifique seu billing no Google Cloud
- Confirme se o modelo está disponível no seu plano

### 4. A foto do consultório não é gerada automaticamente

**Verificar:**
1. Console do navegador (F12) - veja se há erros
2. Se a função `updatePhoto` está sendo chamada corretamente
3. Se `generateOfficePhoto` está retornando erro

**Solução:**
- Verifique os logs no console
- A função deve logar "Gerando foto ambientada no consultório..."

### 5. Como verificar os logs

#### No Navegador:
1. Abra DevTools (F12)
2. Vá em "Console"
3. Procure por mensagens de erro ou logs

#### No Supabase:
1. Acesse: https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr/functions
2. Clique em "photo-enhance"
3. Vá em "Logs"
4. Veja as mensagens de erro ou logs detalhados

### 6. Testar a função diretamente

Você pode testar a função via curl:

```bash
# Substitua YOUR_ANON_KEY pela sua anon key do Supabase
curl -X POST \
  'https://ezbwoibhtwiqzgedoajr.supabase.co/functions/v1/photo-enhance' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "image": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "type": "profile"
  }'
```

## Próximos Passos

1. **Verifique os logs** (navegador e Supabase)
2. **Compartilhe os erros** que aparecem
3. **Teste a função diretamente** via curl se possível

## Informações para Debug

Quando reportar o problema, inclua:

1. **Erro exato** que aparece (se houver)
2. **Logs do console** do navegador
3. **Logs do Supabase** (primeiras linhas)
4. **O que acontece** (retorna original? erro? nada?)
5. **Quando acontece** (no upload? ao clicar em "Melhorar com IA"?)
