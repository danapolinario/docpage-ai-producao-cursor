# 📊 Documentação de Eventos - Google Analytics

**Código de Medição:** `G-X8RK63KDBN`  
**Plataforma:** Google Analytics 4 (GA4)

---

## 📋 Índice

1. [Eventos de Navegação](#eventos-de-navegação)
2. [Eventos do Fluxo de Criação](#eventos-do-fluxo-de-criação)
3. [Eventos de Conversão](#eventos-de-conversão)
4. [Eventos de Landing Pages](#eventos-de-landing-pages)
5. [Eventos do Dashboard](#eventos-do-dashboard)
6. [Eventos de Erro](#eventos-de-erro)

---

## 🌐 Eventos de Navegação

### `page_view`
**Descrição:** Registra visualizações de páginas do site principal.

**Parâmetros:**
- `page_path` (string): Caminho da página (ex: `/`, `/step/content`)
- `page_title` (string): Título da página (ex: "DocPage AI - Landing Pages para Médicos")

**Onde é disparado:**
- Página inicial (`/`)
- Cada step do wizard (`/step/content`, `/step/photo`, `/step/visual`, `/step/editor`, `/step/pricing`)
- Página de geração de conteúdo (`/step/content/generate`)

**Exemplo:**
trackPageView('/', 'DocPage AI - Landing Pages para Médicos');


🎯 Eventos do Fluxo de Criação
briefing_start
Descrição: Disparado quando o usuário inicia o processo de criação de landing page (Step 1: Briefing).
Categoria: user_journey
Label: "Briefing iniciado"
Parâmetros:
Nenhum parâmetro adicional
Onde é disparado:
Quando o usuário clica em "Começar" ou inicia o wizard de criação
Exemplo:
trackBriefingStart();
briefing_complete
Descrição: Disparado quando o usuário completa o formulário de briefing.
Categoria: user_journey
Label: "Briefing concluído"
Parâmetros:
specialty (string, opcional): Especialidade médica informada
doctor_name (string, opcional): Nome do médico informado
Onde é disparado:
Após o usuário preencher e submeter o formulário de briefing
Exemplo:
trackBriefingComplete({  specialty: 'Cardiologia',  name: 'Dr. João Silva'});
style_select
Descrição: Disparado quando o usuário seleciona ou altera um estilo visual.
Categoria: user_journey
Label: "Estilo selecionado"
Parâmetros:
style_name (string): Nome do estilo selecionado (ex: "colorPalette:blue", "fontPairing:sans")
Onde é disparado:
Quando o usuário altera cores, fontes, bordas ou estilos de foto no Step 3 (Visual Config)
Exemplo:
trackStyleSelect('colorPalette:blue');
photo_upload
Descrição: Disparado quando o usuário faz upload de uma foto.
Categoria: user_journey
Label: "Foto enviada"
Parâmetros:
Nenhum parâmetro adicional
Onde é disparado:
Após upload bem-sucedido de foto no Step 3 (Photo Uploader)
Exemplo:
trackPhotoUpload();
photo_enhance
Descrição: Disparado quando o usuário clica em "Melhorar com IA" para melhorar a foto.
Categoria: user_journey
Label: "Foto melhorada com IA"
Parâmetros:
Nenhum parâmetro adicional
Onde é disparado:
Quando o usuário clica no botão "Melhorar com IA" após fazer upload da foto
Exemplo:
trackPhotoEnhance();
preview_view
Descrição: Disparado quando o usuário visualiza o preview da landing page.
Categoria: user_journey
Label: "Preview visualizado"
Parâmetros:
Nenhum parâmetro adicional
Onde é disparado:
Quando o usuário acessa o Step 4 (Preview/Editor)
Quando o preview é exibido pela primeira vez
Exemplo:
trackPreviewView();
content_edit
Descrição: Disparado quando o usuário edita conteúdo no editor.
Categoria: user_journey
Label: "Conteúdo editado"
Parâmetros:
section (string): Seção editada (ex: "headline", "aboutBody", "services")
Onde é disparado:
Quando o usuário modifica qualquer campo de conteúdo no editor
Exemplo:
trackContentEdit('headline');
pricing_view
Descrição: Disparado quando o usuário visualiza a página de planos e preços.
Categoria: user_journey
Label: "Página de planos visualizada"
Parâmetros:
Nenhum parâmetro adicional
Onde é disparado:
Quando o usuário acessa o Step 5 (Pricing Page)
Exemplo:
trackPricingView();
💰 Eventos de Conversão
plan_select
Descrição: Disparado quando o usuário seleciona um plano de assinatura.
Categoria: user_journey
Label: "Plano selecionado"
Parâmetros:
plan_name (string): Nome do plano (ex: "Starter", "Profissional", "Autoridade")
plan_price (string): Preço formatado do plano (ex: "R$ 97", "R$ 197")
Onde é disparado:
Quando o usuário clica em um plano na página de preços
Exemplo:
trackPlanSelect('Profissional', 'R$ 197');
checkout_start
Descrição: Disparado quando o usuário inicia o processo de checkout.
Categoria: conversion
Label: "Checkout iniciado"
Parâmetros:
plan_name (string): Nome do plano selecionado
Onde é disparado:
Quando o usuário clica em "Assinar" ou "Começar Agora" após selecionar um plano
Exemplo:
trackCheckoutStart('Profissional');
checkout_step
Descrição: Disparado em cada etapa do processo de checkout.
Categoria: conversion
Label: "Checkout - {stepName}"
Parâmetros:
step_number (number): Número da etapa (1, 2, 3...)
step_name (string): Nome da etapa (ex: "Enviando código OTP", "Autenticação concluída", "Dados de pagamento")
Onde é disparado:
Step 1: Envio de código OTP por email
Step 2: Verificação de código e autenticação
Step 3: Preenchimento de dados de pagamento
Exemplo:
trackCheckoutStep(1, 'Enviando código OTP');trackCheckoutStep(2, 'Autenticação concluída');trackCheckoutStep(3, 'Dados de pagamento');
purchase
Descrição: Disparado quando o pagamento é concluído com sucesso.
Categoria: conversion
Label: "Pagamento concluído"
Parâmetros:
plan_name (string): Nome do plano adquirido
value (number, opcional): Valor do pagamento em BRL
currency (string): Moeda (sempre "BRL")
Onde é disparado:
Após confirmação bem-sucedida do pagamento
Exemplo:
trackPaymentComplete('Profissional', 197);
📄 Eventos de Landing Pages
landing_page_view
Descrição: Registra visualizações de landing pages criadas pelos usuários.
Categoria: landing_page
Label: "Acesso à landing page"
Parâmetros:
landing_page_id (string): ID único da landing page
subdomain (string): Subdomínio da landing page (ex: "drjoaosilva")
Observação: Também dispara um evento page_view automaticamente.
Onde é disparado:
Quando alguém acessa uma landing page pública via subdomínio
Exemplo:
trackLandingPageView('67f8517c-0360-4722-a081-45ca4634858d', 'drjoaosilva');
landing_page_click
Descrição: Registra cliques em elementos da landing page.
Categoria: landing_page
Label: "Clique na landing page"
Parâmetros:
landing_page_id (string): ID único da landing page
action (string): Ação clicada (ex: "CTA Hero Principal", "Botão WhatsApp (Flu)")
section (string, opcional): Seção da página (ex: "hero", "footer", "navbar")
Onde é disparado:
Cliques em CTAs principais
Cliques em botões de agendamento
Cliques em links de navegação
Exemplo:
trackLandingPageClick('67f8517c-0360-4722-a081-45ca4634858d', 'CTA Hero Principal', 'hero');
whatsapp_click
Descrição: Registra cliques específicos em botões/links do WhatsApp.
Categoria: landing_page
Label: "Clique no WhatsApp"
Parâmetros:
landing_page_id (string): ID único da landing page
phone (string, opcional): Número de telefone do WhatsApp
Onde é disparado:
Quando alguém clica em qualquer botão/link do WhatsApp na landing page
Exemplo:
trackWhatsAppClick('67f8517c-0360-4722-a081-45ca4634858d', '(11) 99999-9999');
phone_click
Descrição: Registra cliques em números de telefone (ligação direta).
Categoria: landing_page
Label: "Clique no telefone"
Parâmetros:
landing_page_id (string): ID único da landing page
phone (string, opcional): Número de telefone clicado
Onde é disparado:
Quando alguém clica em um link tel: para fazer ligação
Exemplo:
trackPhoneClick('67f8517c-0360-4722-a081-45ca4634858d', '(11) 99999-9999');
email_click
Descrição: Registra cliques em links de email.
Categoria: landing_page
Label: "Clique no email"
Parâmetros:
landing_page_id (string): ID único da landing page
email (string, opcional): Endereço de email clicado
Onde é disparado:
Quando alguém clica em um link mailto: para enviar email
Exemplo:
trackEmailClick('67f8517c-0360-4722-a081-45ca4634858d', 'contato@medico.com.br');
📊 Eventos do Dashboard
dashboard_view
Descrição: Registra visualizações do dashboard do usuário.
Categoria: user_journey
Label: "Dashboard visualizado"
Parâmetros:
Nenhum parâmetro adicional
Onde é disparado:
Quando o usuário acessa o dashboard (/dashboard)
Quando o dashboard é carregado após login
Exemplo:
trackDashboardView();
⚠️ Eventos de Erro
error
Descrição: Registra erros que ocorrem na aplicação.
Categoria: error
Label: {errorType}
Parâmetros:
error_type (string): Tipo do erro (via event_label)
error_message (string): Mensagem de erro detalhada
Onde é disparado:
Quando ocorrem erros críticos na aplicação
Erros de API
Erros de validação
Erros de processamento
Exemplo:
trackError('API Error', 'Failed to fetch landing page data');
📈 Métricas e Relatórios Recomendados
Funil de Conversão
briefing_start → briefing_complete → preview_view → pricing_view → plan_select → checkout_start → purchase
Taxa de Conversão de Landing Pages
Visualizações: landing_page_view
Cliques: landing_page_click, whatsapp_click, phone_click, email_click
Taxa = (Total de Cliques / Total de Visualizações) × 100
Engajamento por Etapa
Taxa de conclusão de briefing: briefing_complete / briefing_start
Taxa de seleção de plano: plan_select / pricing_view
Taxa de conclusão de checkout: purchase / checkout_start
🔧 Como Visualizar no Google Analytics
Acesse: https://analytics.google.com
Selecione a propriedade com ID G-X8RK63KDBN
Vá em Relatórios → Engajamento → Eventos
Filtre por categoria ou nome do evento
Use Exploração para criar relatórios customizados
📝 Notas Importantes
Todos os eventos são enviados para o Google Analytics 4 (GA4)
Os eventos também podem ser salvos no Supabase (analytics_events) para análise interna
O código de medição está configurado no arquivo index.html e inicializado em services/google-analytics.ts
Os eventos são enviados de forma assíncrona e não bloqueiam a experiência do usuário
Em caso de falha no envio, o erro é logado no console mas não interrompe o fluxo
