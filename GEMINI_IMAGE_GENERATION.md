# 🖼️ Geração de Imagens com Gemini API - Nano Banana

## ✅ Implementação Atual

A funcionalidade **"Melhorar com IA"** agora usa o **Nano Banana** (`gemini-2.5-flash-image`) diretamente via API REST do Gemini.

### Como Funciona

- ✅ Usa o modelo `gemini-2.5-flash-image` (Nano Banana)
- ✅ Processa imagens de entrada e gera imagens melhoradas
- ✅ Usa apenas `GEMINI_API_KEY` (sem necessidade de LOVABLE_API_KEY)
- ✅ Suporta dois tipos: "profile" (melhoria de perfil) e "office" (cena de consultório)

## 🔍 Por que isso acontece?

A API REST do Gemini é focada em processamento de texto e análise de imagens, mas não em geração de imagens. Para gerar imagens, é necessário usar:

1. **Vertex AI** (Google Cloud) - Requer projeto Google Cloud configurado
2. **Serviços de terceiros** - Como o gateway Lovable (que usa LOVABLE_API_KEY)
3. **Bibliotecas de processamento de imagem** - Para melhorias básicas (ajuste de brilho, contraste, etc.)

## 💡 Alternativas

### Opção 1: Usar Vertex AI (Recomendado para produção)

Se você quiser usar apenas serviços do Google, pode configurar Vertex AI:

1. Crie um projeto no Google Cloud
2. Ative a API do Vertex AI
3. Use o SDK do Vertex AI para gerar imagens

**Exemplo de código:**
```typescript
import { VertexAI } from '@google-cloud/vertexai';

const vertexAI = new VertexAI({
  project: 'seu-projeto',
  location: 'us-central1',
});

const model = vertexAI.getGenerativeModel({
  model: 'gemini-2.5-flash-image',
});

const result = await model.generateContent({
  contents: [{
    role: 'user',
    parts: [
      { text: prompt },
      { inlineData: { mimeType, data: base64Data } }
    ]
  }]
});
```

### Opção 2: Processamento Básico de Imagem

Para melhorias simples (sem IA), você pode usar bibliotecas como:
- **Sharp** (Node.js) - Para ajustes de brilho, contraste, nitidez
- **Canvas API** - Para processamento básico
- **ImageMagick** - Para transformações mais complexas

### Opção 3: Desabilitar a Funcionalidade

Se não for essencial, você pode:
- Remover o botão "Melhorar com IA"
- Ou fazer ele retornar a imagem original sem processamento

## 🔧 Implementação Atual

A função `photo-enhance` agora:
1. ✅ Usa o modelo `gemini-2.5-flash-image` (Nano Banana) diretamente
2. ✅ Envia a imagem de entrada + prompt para o modelo
3. ✅ Recebe e retorna a imagem processada
4. ✅ Tem fallback para retornar imagem original se houver erro

### Endpoint Usado

```
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent
```

### Configuração Necessária

Apenas a `GEMINI_API_KEY` precisa estar configurada no Supabase:
```bash
supabase secrets set GEMINI_API_KEY=sua_chave_aqui
```

## 📝 Próximos Passos

Se você quiser implementar geração de imagens real:

1. **Configurar Vertex AI** (mais complexo, mas usa apenas Google)
2. **Usar um serviço de terceiros** (mais simples, mas requer API key adicional)
3. **Implementar processamento básico** (sem IA, mas funcional)

Qual opção você prefere? Posso ajudar a implementar qualquer uma delas.
