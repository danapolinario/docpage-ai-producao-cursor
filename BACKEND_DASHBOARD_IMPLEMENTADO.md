# ✅ Backend do Dashboard Implementado

## 🎉 O que foi implementado

### 1. ✅ Serviço de Analytics (`services/analytics.ts`)

#### Funcionalidades:
- ✅ **trackEvent()** - Registrar qualquer evento de analytics
- ✅ **trackPageView()** - Registrar visualização de página
- ✅ **trackClick()** - Registrar clique em botões/ações
- ✅ **getEvents()** - Obter eventos de uma landing page (com filtros)
- ✅ **getDashboardStats()** - Obter estatísticas agregadas

#### Tipos de Eventos Suportados:
- `page_view` - Visualização de página
- `click` - Cliques em botões/ações
- `form_submit` - Submissão de formulários
- `phone_call` - Chamadas telefônicas
- `whatsapp_click` - Cliques no WhatsApp

#### Dados Rastreados:
- Tipo de evento
- Dados do evento (ação, elemento, seção)
- IP do visitante
- User Agent
- Referrer (origem)
- País e cidade (geolocalização)
- Timestamp

### 2. ✅ Serviço de Dashboard (`services/dashboard.ts`)

#### Funcionalidades:
- ✅ **getDashboardData()** - Obter dados completos do dashboard
- ✅ **getAllDashboardsData()** - Obter dados de todas as landing pages do usuário

#### Dados Retornados:
- Informações da landing page
- Estatísticas (visitas, cliques, taxa de conversão)
- Gráficos de visitas por dia (últimos 30 dias)
- Gráficos de cliques por dia (últimos 30 dias)
- Cliques por ação (agrupados)
- Cliques por canal (agrupados por origem)
- Eventos recentes
- Informações do domínio

### 3. ✅ Integração com Componente Dashboard

#### Modificações no `components/Dashboard.tsx`:
- ✅ Suporte para `landingPageId` (prop opcional)
- ✅ Carregamento automático de dados do backend quando `landingPageId` fornecido
- ✅ Estado de loading durante carregamento
- ✅ Tratamento de erros
- ✅ Fallback para dados mock quando não há `landingPageId` (compatibilidade)
- ✅ Exibição de dados reais:
  - Visitas únicas
  - Cliques totais
  - Taxa de conversão (30 dias, 7 dias, geral)
  - Gráficos de visitas/cliques
  - Tabela de eventos recentes
  - Informações do domínio (status, SSL, renovação)

### 4. ✅ Integração no Fluxo de Checkout

- ✅ `PricingPage` passa `landingPageId` para o `Dashboard` após checkout bem-sucedido
- ✅ Dashboard carrega dados automaticamente quando recebe `landingPageId`

---

## 📊 Estrutura de Dados

### AnalyticsEvent
```typescript
interface AnalyticsEvent {
  id?: string;
  landing_page_id: string;
  event_type: 'page_view' | 'click' | 'form_submit' | 'phone_call' | 'whatsapp_click';
  event_data?: {
    action?: string;      // Nome do botão/ação
    element?: string;     // ID ou seletor do elemento
    section?: string;     // Seção da página
    value?: any;          // Valor adicional
  };
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  country?: string;
  city?: string;
  created_at?: string;
}
```

### DashboardStats
```typescript
interface DashboardStats {
  totalVisits: number;
  totalClicks: number;
  conversionRate: number;
  visitsByDay: { date: string; count: number }[];
  clicksByDay: { date: string; count: number }[];
  clicksByAction: { action: string; count: number }[];
  clicksByChannel: { channel: string; count: number }[];
  recentEvents: AnalyticsEvent[];
}
```

---

## 🔄 Como Usar

### 1. Registrar Eventos de Analytics

#### Visualização de Página:
```typescript
import { trackPageView } from './services/analytics';

await trackPageView(landingPageId, {
  ip_address: 'xxx.xxx.xxx.xxx',
  user_agent: navigator.userAgent,
  referrer: document.referrer,
});
```

#### Clique em Botão:
```typescript
import { trackClick } from './services/analytics';

await trackClick(
  landingPageId,
  'Botão WhatsApp (Flu)',  // Nome da ação
  'hero',                   // Seção da página
  {
    referrer: document.referrer,
  }
);
```

### 2. Carregar Dados do Dashboard

```typescript
import { getDashboardData } from './services/dashboard';

const data = await getDashboardData(landingPageId);

console.log(data.stats.totalVisits);      // Total de visitas
console.log(data.stats.totalClicks);      // Total de cliques
console.log(data.stats.conversionRate);   // Taxa de conversão
console.log(data.stats.visitsByDay);      // Visitantes por dia
```

### 3. Usar no Componente Dashboard

```tsx
<Dashboard
  landingPageId="uuid-da-landing-page"
  doctorName="Dr. João Silva"
  domain="dr-joao-silva.docpage.com.br"
  // ... outras props
/>
```

---

## 📋 Próximos Passos

### Para Implementar Tracking Completo:

1. **Adicionar Script de Tracking na Landing Page**
   - Inserir script que detecta cliques automaticamente
   - Registrar visualizações ao carregar a página
   - Enviar eventos para o backend

2. **Implementar Geolocalização**
   - Usar serviço de geolocalização por IP (ex: ipapi.co, MaxMind)
   - Adicionar país e cidade automaticamente

3. **Detecção de Canal de Origem**
   - Melhorar detecção de origem (Google Ads, Facebook Ads, etc)
   - Adicionar UTM parameters

4. **Otimizações**
   - Criar função SQL para incrementar view_count (mais eficiente)
   - Adicionar cache para estatísticas (Redis ou similar)
   - Agregar dados em batch (processamento em background)

---

## 🐛 Notas Importantes

### Segurança
- ✅ Eventos podem ser inseridos sem autenticação (RLS permite)
- ✅ Usuários só podem VER eventos de suas próprias landing pages
- ⚠️ **Importante**: Validação de `landing_page_id` no frontend antes de inserir

### Performance
- Estatísticas são calculadas em tempo real (pode ser lento com muitos eventos)
- Para produção, considere:
  - Agregar dados periodicamente (cron job)
  - Usar materialized views
  - Cache de estatísticas

### Limites do Supabase Free Tier
- 500MB de banco de dados
- Para muitos eventos, considere:
  - Limpar eventos antigos (manter apenas últimos 90 dias)
  - Agregar eventos diários em tabela separada

---

## ✅ Checklist de Implementação

- [x] Serviço de analytics criado
- [x] Serviço de dashboard criado
- [x] Integração com componente Dashboard
- [x] Suporte para landingPageId
- [x] Carregamento automático de dados
- [x] Estado de loading
- [x] Tratamento de erros
- [x] Fallback para dados mock
- [x] Integração no fluxo de checkout
- [ ] Script de tracking na landing page (TODO)
- [ ] Geolocalização automática (TODO)
- [ ] Agregação em batch (TODO)
- [ ] Cache de estatísticas (TODO)

---

**Implementado em**: 2024
**Status**: ✅ Funcional
**Próximo passo**: Implementar script de tracking na landing page
