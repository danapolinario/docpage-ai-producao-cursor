# 🔐 Configurar Usuário Administrativo

## Credenciais do Admin

- **Email**: `admin@admin.com`
- **Senha**: `admin123!@#`

## Como Configurar

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/ezbwoibhtwiqzgedoajr
2. Vá em **Settings** > **Edge Functions**
3. Clique em **"Add new secret"** para cada variável:

**Primeira variável:**
- **Name**: `ADMIN_EMAIL`
- **Value**: `admin@admin.com`
- Clique em **"Save"**

**Segunda variável:**
- **Name**: `ADMIN_PASSWORD`
- **Value**: `admin123!@#`
- Clique em **"Save"**

### Opção 2: Via CLI

```bash
supabase secrets set ADMIN_EMAIL=admin@admin.com
supabase secrets set ADMIN_PASSWORD=admin123!@#
```

## Verificar Configuração

Após configurar, verifique se as variáveis estão configuradas:

```bash
supabase secrets list
```

Você deve ver:
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## Deploy da Função (se necessário)

Se a função `admin-login` ainda não foi deployada:

```bash
supabase functions deploy admin-login
```

## Como Funciona

1. A função `admin-login` verifica as credenciais contra `ADMIN_EMAIL` e `ADMIN_PASSWORD`
2. Se as credenciais estiverem corretas, cria o usuário automaticamente (se não existir)
3. Adiciona a role `admin` na tabela `user_roles`
4. Retorna uma sessão autenticada

## Testar

1. Acesse: `http://localhost:8080/admin`
2. Digite:
   - Email: `admin@admin.com`
   - Senha: `admin123!@#`
3. Clique em "Entrar como Admin"
4. Deve acessar o painel administrativo

## Segurança

⚠️ **IMPORTANTE**: 
- As credenciais são armazenadas como secrets no Supabase (não no código)
- A função tem proteção contra brute-force (delay de 1 segundo em falhas)
- O usuário admin é criado automaticamente na primeira vez que faz login
- A role `admin` é adicionada automaticamente na tabela `user_roles`

## Troubleshooting

### Erro: "Admin não configurado"

**Solução**: Verifique se `ADMIN_EMAIL` e `ADMIN_PASSWORD` estão configurados no Supabase

### Erro: "Credenciais inválidas"

**Solução**: 
- Verifique se digitou exatamente: `admin@admin.com` e `admin123!@#`
- Verifique se as variáveis estão configuradas corretamente
- Verifique os logs da função `admin-login` no Supabase

### Usuário não tem acesso ao painel

**Solução**: 
- Verifique se a role `admin` foi adicionada na tabela `user_roles`
- Execute este SQL para verificar:

```sql
SELECT ur.*, u.email 
FROM user_roles ur 
JOIN auth.users u ON ur.user_id = u.id 
WHERE ur.role = 'admin';
```
