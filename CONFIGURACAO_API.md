# 🔑 Guia de Configuração da API Gemini

Este guia explica passo a passo como obter e configurar sua chave da API do Google Gemini para usar esta aplicação.

## 📋 Pré-requisitos

- Conta Google (Gmail)
- Acesso à internet

## 🚀 Passo 1: Obter a Chave da API

### 1.1 Acesse o Google AI Studio

1. Abra seu navegador e acesse: **https://aistudio.google.com/**
2. Faça login com sua conta Google, se necessário

### 1.2 Criar uma Nova Chave de API

1. No Google AI Studio, procure por **"Get API Key"** ou **"Obter chave de API"**
2. Clique em **"Create API Key"** ou **"Criar chave de API"**
3. Se solicitado, escolha um projeto Google Cloud:
   - Se você já tem um projeto, selecione-o
   - Se não tem, clique em **"Create new project"** (Criar novo projeto)
4. Aguarde a criação da chave
5. **Copie a chave gerada** - ela será exibida apenas uma vez!

> ⚠️ **IMPORTANTE**: Guarde sua chave em local seguro. Se você perder, precisará criar uma nova.

## 🔧 Passo 2: Configurar a Chave no Projeto

### 2.1 Criar o Arquivo de Configuração

1. Na raiz do projeto (`DocPage-AI-main`), crie um arquivo chamado `.env.local`
2. Se o arquivo já existir, abra-o para edição

### 2.2 Adicionar a Chave da API

Abra o arquivo `.env.local` e adicione a seguinte linha:

```env
GEMINI_API_KEY=sua_chave_aqui
```

**Exemplo:**
```env
GEMINI_API_KEY=AIzaSyB1234567890abcdefghijklmnopqrstuvwxyz
```

> 💡 **Dica**: Substitua `sua_chave_aqui` pela chave real que você copiou do Google AI Studio.

### 2.3 Salvar o Arquivo

Salve o arquivo `.env.local` na raiz do projeto (mesmo diretório onde está o `package.json`).

## ✅ Passo 3: Verificar a Configuração

### 3.1 Estrutura de Arquivos

Certifique-se de que a estrutura está assim:

```
DocPage-AI-main/
├── .env.local          ← Seu arquivo de configuração
├── package.json
├── vite.config.ts
├── App.tsx
└── ...
```

### 3.2 Reiniciar o Servidor

Se o servidor de desenvolvimento já estiver rodando:

1. Pare o servidor (pressione `Ctrl + C` no terminal)
2. Inicie novamente com:
   ```bash
   npm run dev
   ```

O Vite carregará automaticamente as variáveis do arquivo `.env.local`.

## 🧪 Passo 4: Testar a Configuração

1. Acesse a aplicação em: **http://localhost:3000**
2. Tente usar uma funcionalidade que requer a API (como gerar conteúdo)
3. Se funcionar, a configuração está correta! ✅

## 🔒 Segurança e Boas Práticas

### ⚠️ NUNCA faça:

- ❌ Compartilhar sua chave da API publicamente
- ❌ Fazer commit do arquivo `.env.local` no Git
- ❌ Enviar a chave por email ou mensagens não seguras

### ✅ SEMPRE faça:

- ✅ Mantenha o arquivo `.env.local` no `.gitignore`
- ✅ Use chaves diferentes para desenvolvimento e produção
- ✅ Revogue chaves antigas se suspeitar de comprometimento

## 🐛 Solução de Problemas

### Erro: "API key not found" ou "Invalid API key"

**Solução:**
1. Verifique se o arquivo `.env.local` está na raiz do projeto
2. Confirme que a variável está escrita como `GEMINI_API_KEY` (sem espaços)
3. Verifique se não há espaços antes ou depois do `=`
4. Reinicie o servidor após criar/editar o arquivo

### Erro: "Quota exceeded" ou "Rate limit"

**Solução:**
- A API do Gemini tem limites de uso gratuito
- Aguarde alguns minutos antes de tentar novamente
- Considere verificar seus limites em: https://aistudio.google.com/app/apikey

### A chave não está sendo carregada

**Solução:**
1. Certifique-se de que o arquivo se chama exatamente `.env.local` (com o ponto no início)
2. Verifique se não há erros de digitação na variável
3. Reinicie o servidor completamente (feche e abra novamente)

## 📚 Recursos Adicionais

- **Documentação oficial do Gemini API**: https://ai.google.dev/docs
- **Google AI Studio**: https://aistudio.google.com/
- **Limites e preços**: https://ai.google.dev/pricing

## 💡 Dica Final

Se você estiver trabalhando em equipe, compartilhe este guia com seus colegas, mas **nunca compartilhe sua chave da API diretamente**. Cada pessoa deve criar sua própria chave.

---

**Pronto!** Agora você está configurado para usar a API do Gemini nesta aplicação. 🎉
