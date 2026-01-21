# 💳 Supabase Free Tier - Limites e Créditos

## 📊 Limites do Free Tier

O Supabase oferece um **Free Tier generoso** que é perfeito para desenvolvimento e MVP:

### ✅ O que está incluído (GRÁTIS)

#### Banco de Dados PostgreSQL
- **500 MB** de armazenamento
- **2 GB** de transferência de dados por mês
- **Concurrent connections**: Limitado (suficiente para desenvolvimento)

#### Armazenamento de Arquivos (Storage)
- **1 GB** de armazenamento total
- **2 GB** de transferência (bandwidth) por mês

#### Autenticação
- **50,000** usuários mensais ativos (MAU)
- **Unlimited** autenticações (não há limite de requests)

#### API Requests
- **Unlimited** API requests (sem limite!)

#### Edge Functions (Serverless)
- **500,000** invocações por mês
- **2 GB** de transferência

#### Realtime
- **200** conexões simultâneas
- **2 GB** de transferência por mês

---

## 🚀 É possível conseguir mais créditos?

### Opções Disponíveis:

#### 1. **Upgrade para Pro Plan** ($25/mês)
- **8 GB** de banco de dados
- **100 GB** de storage
- **250 GB** de transferência
- **Daily backups**
- **Priority support**

#### 2. **Programa de Partners**
- Se você é uma organização educacional, pode solicitar créditos adicionais
- Contate o suporte do Supabase

#### 3. **Referral Program**
- Convide amigos e ganhe créditos (quando disponível)
- Verifique o dashboard do Supabase

#### 4. **Community Sponsorship**
- Para projetos open-source, podem haver sponsorships
- Veja a documentação do Supabase para mais informações

---

## 💡 Otimizações para Usar Melhor o Free Tier

### 1. Otimizar Armazenamento de Banco
```sql
-- Remover dados antigos periodicamente
DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days';

-- Compactar tabelas
VACUUM FULL landing_pages;
```

### 2. Otimizar Storage de Imagens
- Comprimir imagens antes de upload
- Usar formatos eficientes (WebP)
- Implementar lazy loading
- Limitar tamanho máximo de upload (5MB)

### 3. Implementar Cache
- Cachear queries frequentes
- Usar CDN para assets estáticos
- Implementar cache no frontend

### 4. Limpar Dados Inativos
- Deletar landing pages arquivadas antigas
- Limpar eventos de analytics antigos
- Remover fotos não utilizadas

---

## 📈 Quando Considerar Upgrade

Considere fazer upgrade para o **Pro Plan ($25/mês)** quando:

- ✅ Banco de dados próximo de **500 MB**
- ✅ Storage próximo de **1 GB**
- ✅ Muitos usuários (próximo de 50k MAU)
- ✅ Precisa de backups diários
- ✅ Precisa de suporte prioritário
- ✅ Quer remover branding do Supabase

---

## 💰 Comparação de Planos

| Recurso | Free | Pro ($25/mês) | Team ($599/mês) |
|---------|------|---------------|-----------------|
| Database | 500 MB | 8 GB | 32 GB+ |
| Storage | 1 GB | 100 GB | 1 TB+ |
| Bandwidth | 2 GB | 250 GB | 5 TB+ |
| MAU | 50k | 100k | Unlimited |
| Backups | Manual | Daily | Point-in-time |
| Support | Community | Email | Priority |

---

## 🎯 Estimativa para DocPage AI

### Free Tier é suficiente para:
- ✅ **Até 500 landing pages** (assumindo ~1MB por página)
- ✅ **Até 1000 fotos** (assumindo ~1MB por foto)
- ✅ **Até 50.000 usuários** por mês
- ✅ **Desenvolvimento e MVP**

### Considere upgrade quando:
- 📊 Mais de 500 landing pages ativas
- 📊 Mais de 1000 fotos
- 📊 Mais de 50k usuários/mês
- 📊 Necessidade de backups automáticos

---

## 🔄 Estratégias de Otimização

### 1. Compressão de Imagens
```typescript
// Antes de upload, comprimir imagens
function compressImage(file: File, maxSize: number = 500000): Promise<Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Redimensionar se necessário
        if (width > 1920) {
          height = (height * 1920) / width;
          width = 1920;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(resolve, 'image/jpeg', 0.85);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
```

### 2. Limpeza Automática
```typescript
// Limpar analytics antigos (exemplo)
export async function cleanupOldAnalytics() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { error } = await supabase
    .from('analytics_events')
    .delete()
    .lt('created_at', thirtyDaysAgo.toISOString());
    
  if (error) console.error('Erro ao limpar analytics:', error);
}
```

### 3. Monitoramento de Uso
```typescript
// Verificar uso de storage
export async function getStorageUsage() {
  const { data, error } = await supabase.storage
    .from('landing-page-photos')
    .list();
    
  if (error) return { error };
  
  const totalSize = data?.reduce((acc, file) => acc + (file.metadata?.size || 0), 0) || 0;
  return {
    files: data?.length || 0,
    totalSize,
    totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
  };
}
```

---

## 📞 Suporte

Se precisar de mais recursos ou tiver dúvidas:
- **Documentação**: https://supabase.com/docs
- **Community**: https://github.com/supabase/supabase/discussions
- **Status**: https://status.supabase.com

---

## ✅ Conclusão

O **Free Tier do Supabase é muito generoso** e perfeito para:
- ✅ Desenvolvimento
- ✅ MVP
- ✅ Projetos pequenos/médios
- ✅ Até ~500 landing pages

Para produção em escala, considere o **Pro Plan ($25/mês)** que oferece recursos muito mais amplos.

---

**Última atualização**: 2026
**Fonte**: https://supabase.com/pricing
