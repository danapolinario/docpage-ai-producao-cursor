# 🚀 Guia Passo a Passo - Setup Supabase

Este guia vai te ajudar a configurar o Supabase do zero para o DocPage AI.

---

## 📋 Pré-requisitos

- Conta no Supabase (grátis)
- Node.js instalado
- Navegador web

---

## 🎯 Passo 1: Criar Projeto no Supabase

### 1.1 Acessar Supabase

1. Acesse: **https://supabase.com**
2. Clique em **"Start your project"** ou **"Sign In"**
3. Faça login com GitHub, Google ou email

### 1.2 Criar Novo Projeto

1. Clique em **"New Project"**
2. Preencha os dados:
   - **Name**: `DocPage AI` (ou o nome que preferir)
   - **Database Password**: Crie uma senha forte (anote em local seguro!)
   - **Region**: Escolha a mais próxima (ex: `South America (São Paulo)`)
   - **Pricing Plan**: Free (para começar)
3. Clique em **"Create new project"**
4. Aguarde 2-3 minutos enquanto o projeto é criado

---

## 🔑 Passo 2: Obter Credenciais da API

### 2.1 Acessar Settings da API

1. No dashboard do projeto, vá em **Settings** (ícone de engrenagem)
2. Clique em **API** no menu lateral

### 2.2 Copiar Credenciais

Você verá duas informações importantes:

1. **Project URL**: Algo como `https://xxxxxxxxxxxxx.supabase.co`
2. **anon public key**: Uma chave longa começando com `eyJ...`

**Copie essas duas informações!** Você vai precisar delas.

---

## 📝 Passo 3: Configurar Variáveis de Ambiente

### 3.1 Criar Arquivo .env.local

Na raiz do projeto, crie ou edite o arquivo `.env.local`:

```bash
# Se já existe, adicione as linhas do Supabase
# Se não existe, crie o arquivo
```

### 3.2 Adicionar Credenciais

Adicione as seguintes linhas no arquivo `.env.local`:

```env
# Configuração do Supabase
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica-aqui
```

**Substitua:**
- `https://seu-projeto-id.supabase.co` pela **Project URL** que você copiou
- `sua-chave-anon-publica-aqui` pela **anon public key** que você copiou

**Exemplo:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🗄️ Passo 4: Criar Tabelas no Banco de Dados

### 4.1 Acessar SQL Editor

1. No dashboard do Supabase, clique em **SQL Editor** no menu lateral
2. Clique em **"New query"**

### 4.2 Executar Script SQL

1. Abra o arquivo `supabase/schema.sql` que foi criado no projeto
2. **Copie TODO o conteúdo** do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)

### 4.3 Verificar se Funcionou

Você deve ver uma mensagem de sucesso. Para verificar:

1. Vá em **Table Editor** no menu lateral
2. Você deve ver 3 tabelas:
   - `landing_pages`
   - `analytics_events`
   - `custom_domains`

✅ **Se apareceram as 3 tabelas, está tudo certo!**

---

## 📦 Passo 5: Configurar Storage (Para Fotos)

### 5.1 Criar Bucket

1. No dashboard, vá em **Storage** no menu lateral
2. Clique em **"New bucket"**
3. Preencha:
   - **Name**: `landing-page-photos`
   - **Public bucket**: ✅ **Marque esta opção** (fotos precisam ser públicas)
4. Clique em **"Create bucket"**

### 5.2 Configurar Políticas de Storage

1. Ainda no **SQL Editor**, abra o arquivo `supabase/storage-policies.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor
4. Clique em **"Run"**

✅ **Storage configurado!**

---

## ✅ Passo 6: Verificar Instalação

### 6.1 Verificar Dependência

Execute no terminal:

```bash
npm list @supabase/supabase-js
```

Deve mostrar a versão instalada.

### 6.2 Testar Conexão

Crie um arquivo de teste temporário:

```typescript
// test-supabase.ts (temporário, pode deletar depois)
import { supabase } from './lib/supabase';

async function testConnection() {
  try {
    const { data, error } = await supabase.from('landing_pages').select('count');
    console.log('✅ Conexão com Supabase funcionando!', data);
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
  }
}

testConnection();
```

Ou simplesmente inicie o servidor:

```bash
npm run dev
```

Se não houver erros no console sobre Supabase, está funcionando! ✅

---

## 🎉 Próximos Passos

Agora que o Supabase está configurado, você pode:

1. **Implementar autenticação** - Ver `services/auth.ts`
2. **Criar landing pages** - Ver `services/landing-pages.ts`
3. **Fazer upload de fotos** - Ver `services/storage.ts`

---

## 🐛 Solução de Problemas

### Erro: "Variáveis de ambiente do Supabase não configuradas"

**Solução:**
- Verifique se o arquivo `.env.local` existe na raiz do projeto
- Verifique se as variáveis começam com `VITE_`
- Reinicie o servidor de desenvolvimento (`npm run dev`)

### Erro: "Invalid API key"

**Solução:**
- Verifique se copiou a chave correta (anon key, não service_role key)
- Verifique se não há espaços extras nas variáveis
- Verifique se o arquivo `.env.local` está na raiz do projeto

### Erro ao executar SQL

**Solução:**
- Execute o SQL em partes menores
- Verifique se não há erros de sintaxe
- Certifique-se de estar no projeto correto no Supabase

### Tabelas não aparecem

**Solução:**
- Recarregue a página do Table Editor
- Verifique se o SQL foi executado com sucesso
- Verifique se está no projeto correto

---

## 📚 Recursos Úteis

- **Documentação Supabase**: https://supabase.com/docs
- **Dashboard do Projeto**: https://supabase.com/dashboard
- **SQL Editor**: Disponível no dashboard do projeto

---

**Pronto!** Seu Supabase está configurado e pronto para uso! 🚀
