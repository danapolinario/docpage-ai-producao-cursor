# 🔍 Debug - Erro 400 na função photo-enhance

## Problema

Erro 400 ao tentar usar o modelo `gemini-2.5-flash-image` via API REST do Gemini.

## Possíveis Causas

1. **Modelo não disponível via API REST**
   - O modelo `gemini-2.5-flash-image` pode não estar disponível via `generativelanguage.googleapis.com`
   - Pode requerer Vertex AI ou outro endpoint

2. **Formato da requisição incorreto**
   - O formato para geração de imagens pode ser diferente
   - Pode precisar de parâmetros adicionais

3. **Modelo não suporta geração de imagens via REST**
   - Pode ser que apenas análise de imagens funcione via REST
   - Geração de imagens pode requerer Vertex AI

## O que foi feito

1. ✅ Adicionado fallback para tentar diferentes endpoints (v1, v1beta)
2. ✅ Adicionado fallback para modelo alternativo (gemini-2.0-flash-exp)
3. ✅ Melhorado logging para ver erro completo
4. ✅ Removido `responseModalities` que pode não ser suportado

## Próximos Passos

1. **Fazer deploy da função atualizada:**
   ```bash
   supabase functions deploy photo-enhance
   ```

2. **Testar novamente e verificar logs:**
   - Dashboard Supabase > Functions > photo-enhance > Logs
   - Veja a mensagem de erro completa

3. **Verificar se o modelo está disponível:**
   - O modelo pode não estar disponível via API REST
   - Pode ser necessário usar Vertex AI

## Alternativas

Se o modelo não funcionar via API REST, considere:

1. **Usar Vertex AI** (requer projeto Google Cloud)
2. **Usar outro serviço de geração de imagens**
3. **Processar imagens localmente** (sem IA, apenas ajustes básicos)

## Logs para Verificar

Após o deploy, nos logs do Supabase você deve ver:
- "Gemini API error: 400"
- "Error details: [mensagem completa]"
- "Parsed error: [JSON com detalhes]"

Com essas informações, podemos identificar exatamente o problema.
