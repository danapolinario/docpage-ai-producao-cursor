# Debug: HTML Estático não está sendo servido

## Problema
O HTML estático foi gerado com sucesso, mas ao acessar o subdomínio, ainda aparece o `index.html` padrão da home do DocPage.

## Possíveis Causas

### 1. Vercel está servindo index.html antes da API processar

**Sintoma:** Ao acessar o subdomínio, você vê o HTML padrão do DocPage.

**Verificação:**
1. Acesse o Vercel Dashboard > Seu Projeto > Functions > Logs
2. Acesse o subdomínio (ex: `drlazaronitest.docpage.com.br`)
3. Veja se aparecem logs da API (`[API/INDEX]` ou `[SSR]`)

**Se NÃO aparecerem logs:**
- O Vercel está servindo o `index.html` estático antes da API processar
- Solução: Verificar configuração do `vercel.json`

**Se aparecerem logs:**
- A API está sendo chamada, mas pode estar retornando o HTML errado
- Verificar os logs para ver qual caminho está sendo executado

### 2. Cache do navegador

**Sintoma:** Mesmo após gerar o HTML estático, ainda vê o HTML antigo.

**Solução:**
1. Faça um hard refresh: `Ctrl+Shift+R` (Windows/Linux) ou `Cmd+Shift+R` (Mac)
2. Ou abra em aba anônima/privada
3. Ou limpe o cache do navegador

### 3. HTML estático não está sendo encontrado

**Sintoma:** Logs mostram "HTML estático não encontrado"

**Verificação:**
1. Verifique se o arquivo existe no Supabase Storage:
   - Supabase Dashboard > Storage > landing-pages > html
   - Deve existir: `drlazaronitest.html`

2. Verifique se o bucket permite leitura pública:
   - Supabase Dashboard > Storage > landing-pages > Policies
   - Deve ter política "Public can view landing-pages files"

### 4. API está retornando HTML errado

**Sintoma:** Logs mostram que a API está sendo chamada, mas retorna HTML padrão.

**Verificação:**
1. Veja os logs do Vercel para ver qual caminho está sendo executado
2. Procure por:
   - `[SSR] ✓ HTML estático encontrado` - HTML estático está sendo servido
   - `[SSR] HTML estático não encontrado` - HTML estático não foi encontrado
   - `[SSR] Renderizando HTML com dados do médico (SSR dinâmico)` - Está fazendo SSR dinâmico

## Como debugar

### Passo 1: Verificar se a API está sendo chamada

1. Acesse: Vercel Dashboard > Seu Projeto > Functions > Logs
2. Acesse o subdomínio: `drlazaronitest.docpage.com.br`
3. Veja se aparecem logs começando com `[API/INDEX]` ou `[SSR]`

### Passo 2: Verificar o HTML estático

1. Execute o script para gerar o HTML estático:
   ```bash
   npm run generate:static-html:single -- drlazaronitest
   ```

2. Verifique se o arquivo foi criado:
   - Supabase Dashboard > Storage > landing-pages > html > `drlazaronitest.html`

3. Acesse a URL pública diretamente:
   - A URL será mostrada no output do script
   - Exemplo: `https://seu-projeto.supabase.co/storage/v1/object/public/landing-pages/html/drlazaronitest.html`
   - Deve mostrar o HTML da landing page, não o HTML padrão

### Passo 3: Verificar headers da resposta

1. Abra o DevTools do navegador (F12)
2. Vá na aba Network
3. Acesse o subdomínio
4. Veja a requisição para `/` ou `index.html`
5. Verifique os headers da resposta:
   - `X-Served-From: static-html` - HTML estático foi servido
   - `X-Served-From: ssr-dynamic` - SSR dinâmico foi usado
   - `X-Served-From: static-html-generated` - HTML estático foi gerado na hora

### Passo 4: Verificar o conteúdo da resposta

1. No DevTools > Network, clique na requisição
2. Vá na aba "Response" ou "Preview"
3. Veja o HTML retornado
4. Procure por:
   - Dados do médico (nome, especialidade) - HTML correto
   - "DocPage AI - Crie Site Profissional" - HTML padrão (erro)

## Soluções

### Se a API não está sendo chamada:

1. Verifique o `vercel.json` - as rewrites devem direcionar `/` para `/api`
2. Verifique se há algum middleware ou configuração que está interceptando antes

### Se a API está sendo chamada mas retorna HTML errado:

1. Verifique os logs para ver qual caminho está sendo executado
2. Verifique se o HTML estático existe e está acessível
3. Verifique se há algum erro na lógica de verificação do HTML estático

### Se o HTML estático não está sendo encontrado:

1. Execute a migration para criar o bucket: `20260210000002_create_bucket_landing_pages.sql`
2. Execute a migration para permitir HTML: `20260210000001_allow_html_in_storage.sql`
3. Gere o HTML estático novamente: `npm run generate:static-html:single -- drlazaronitest`
