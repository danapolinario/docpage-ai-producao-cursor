# 📦 Instalar Dependências SSR

Execute o comando abaixo para instalar as dependências necessárias para SSR:

```bash
npm install express @types/express tsx --save-dev
```

Se der erro de permissão, tente:

```bash
npm install express @types/express tsx --save-dev --legacy-peer-deps
```

Ou instale manualmente editando o `package.json` e depois:

```bash
npm install
```

## Dependências Necessárias

- `express` - Servidor HTTP para SSR
- `@types/express` - Tipos TypeScript
- `tsx` - Executor TypeScript para desenvolvimento

Após instalar, você pode:

1. **Desenvolvimento SSR**:
   ```bash
   npm run dev:ssr
   ```

2. **Build completo**:
   ```bash
   npm run build:ssr
   ```

3. **Produção**:
   ```bash
   npm start
   ```
