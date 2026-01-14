# ✅ Setup Supabase - Resumo

## O que foi configurado

### ✅ Dependências
- `@supabase/supabase-js` instalado

### ✅ Arquivos Criados

1. **`lib/supabase.ts`** - Cliente Supabase configurado
2. **`services/auth.ts`** - Serviço de autenticação
3. **`services/landing-pages.ts`** - CRUD de landing pages
4. **`services/storage.ts`** - Upload de imagens
5. **`supabase/schema.sql`** - SQL para criar tabelas
6. **`supabase/storage-policies.sql`** - Políticas de storage
7. **`SETUP_SUPABASE.md`** - Guia passo a passo completo

---

## 🚀 Próximos Passos

### 1. Criar Projeto no Supabase
Siga o guia em **`SETUP_SUPABASE.md`**:
- Criar conta em https://supabase.com
- Criar novo projeto
- Copiar credenciais (URL e anon key)

### 2. Configurar Variáveis de Ambiente
Crie/edite `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

### 3. Executar SQL no Supabase
1. Acesse SQL Editor no dashboard
2. Execute o conteúdo de `supabase/schema.sql`
3. Execute o conteúdo de `supabase/storage-policies.sql`

### 4. Criar Bucket de Storage
1. Vá em Storage no dashboard
2. Crie bucket `landing-page-photos` (público)

### 5. Testar
```bash
npm run dev
```

---

## 📚 Documentação

- **Guia Completo**: `SETUP_SUPABASE.md`
- **Exemplos de Código**: `EXEMPLOS_SUPABASE.md`
- **Plano Completo**: `PLANO_BACKEND_SUPABASE.md`

---

## 🔧 Serviços Disponíveis

### Autenticação (`services/auth.ts`)
- `signUp()` - Registrar usuário
- `signIn()` - Login
- `signOut()` - Logout
- `getCurrentUser()` - Obter usuário atual
- `isAuthenticated()` - Verificar autenticação

### Landing Pages (`services/landing-pages.ts`)
- `createLandingPage()` - Criar nova landing page
- `getMyLandingPages()` - Listar minhas landing pages
- `getLandingPageById()` - Obter por ID
- `getLandingPageBySubdomain()` - Obter por subdomínio (público)
- `updateLandingPage()` - Atualizar
- `publishLandingPage()` - Publicar
- `unpublishLandingPage()` - Despublicar
- `deleteLandingPage()` - Deletar
- `checkSubdomainAvailability()` - Verificar disponibilidade

### Storage (`services/storage.ts`)
- `uploadPhoto()` - Upload de arquivo
- `uploadPhotoFromBase64()` - Upload de base64 (IA)
- `deletePhoto()` - Deletar foto
- `listPhotos()` - Listar fotos

---

## ⚠️ Importante

1. **Nunca commite o arquivo `.env.local`** (já está no .gitignore)
2. **Use apenas a `anon key`** no frontend (nunca a `service_role key`)
3. **As políticas RLS** já estão configuradas no SQL
4. **O bucket de storage** deve ser público para as fotos aparecerem

---

**Pronto para começar!** 🎉
