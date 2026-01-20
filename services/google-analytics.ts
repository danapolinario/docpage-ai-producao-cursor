/**
 * Serviço de Google Analytics
 * 
 * Integração com Google Analytics 4 (GA4) usando gtag
 * Código de medição: G-X8RK63KDBN
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

const GA_MEASUREMENT_ID = 'G-X8RK63KDBN';

/**
 * Inicializar Google Analytics
 */
export function initGoogleAnalytics() {
  // Verificar se já foi inicializado
  if (window.gtag) {
    return;
  }

  // Criar script do Google Analytics
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script1);

  // Inicializar dataLayer e gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // Vamos enviar manualmente para ter mais controle
  });
}

/**
 * Enviar evento de visualização de página
 */
export function trackPageView(path: string, title?: string) {
  if (!window.gtag) {
    initGoogleAnalytics();
    // Aguardar um pouco para garantir que o script carregou
    setTimeout(() => {
      window.gtag?.('event', 'page_view', {
        page_path: path,
        page_title: title || document.title,
      });
    }, 100);
    return;
  }

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
  });
}

/**
 * Enviar evento customizado
 */
export function trackEvent(
  eventName: string,
  eventParams?: {
    [key: string]: any;
  }
) {
  if (!window.gtag) {
    initGoogleAnalytics();
    setTimeout(() => {
      window.gtag?.('event', eventName, eventParams || {});
    }, 100);
    return;
  }

  window.gtag('event', eventName, eventParams || {});
}

/**
 * Eventos específicos do fluxo de criação
 */

// Step 1: Briefing
export function trackBriefingStart() {
  trackEvent('briefing_start', {
    event_category: 'user_journey',
    event_label: 'Briefing iniciado',
  });
}

export function trackBriefingComplete(briefingData: {
  specialty?: string;
  name?: string;
}) {
  trackEvent('briefing_complete', {
    event_category: 'user_journey',
    event_label: 'Briefing concluído',
    specialty: briefingData.specialty,
    doctor_name: briefingData.name,
  });
}

// Step 2: Estilo
export function trackStyleSelect(style: string) {
  trackEvent('style_select', {
    event_category: 'user_journey',
    event_label: 'Estilo selecionado',
    style_name: style,
  });
}

// Step 3: Foto
export function trackPhotoUpload() {
  trackEvent('photo_upload', {
    event_category: 'user_journey',
    event_label: 'Foto enviada',
  });
}

export function trackPhotoEnhance() {
  trackEvent('photo_enhance', {
    event_category: 'user_journey',
    event_label: 'Foto melhorada com IA',
  });
}

// Step 4: Preview/Editor
export function trackPreviewView() {
  trackEvent('preview_view', {
    event_category: 'user_journey',
    event_label: 'Preview visualizado',
  });
}

export function trackContentEdit(section: string) {
  trackEvent('content_edit', {
    event_category: 'user_journey',
    event_label: 'Conteúdo editado',
    section: section,
  });
}

// Step 5: Pricing/Checkout
export function trackPricingView() {
  trackEvent('pricing_view', {
    event_category: 'user_journey',
    event_label: 'Página de planos visualizada',
  });
}

export function trackPlanSelect(planName: string, planPrice: string) {
  trackEvent('plan_select', {
    event_category: 'user_journey',
    event_label: 'Plano selecionado',
    plan_name: planName,
    plan_price: planPrice,
  });
}

export function trackCheckoutStart(planName: string) {
  trackEvent('checkout_start', {
    event_category: 'conversion',
    event_label: 'Checkout iniciado',
    plan_name: planName,
  });
}

export function trackCheckoutStep(step: number, stepName: string) {
  trackEvent('checkout_step', {
    event_category: 'conversion',
    event_label: `Checkout - ${stepName}`,
    step_number: step,
    step_name: stepName,
  });
}

export function trackPaymentComplete(planName: string, value?: number) {
  trackEvent('purchase', {
    event_category: 'conversion',
    event_label: 'Pagamento concluído',
    plan_name: planName,
    value: value,
    currency: 'BRL',
  });
}

// Landing Pages - Acessos e Cliques
export function trackLandingPageView(landingPageId: string, subdomain: string) {
  trackEvent('landing_page_view', {
    event_category: 'landing_page',
    event_label: 'Acesso à landing page',
    landing_page_id: landingPageId,
    subdomain: subdomain,
  });
  
  // Também enviar como page_view
  trackPageView(`/${subdomain}`, `Landing Page - ${subdomain}`);
}

export function trackLandingPageClick(
  landingPageId: string,
  action: string,
  section?: string
) {
  trackEvent('landing_page_click', {
    event_category: 'landing_page',
    event_label: 'Clique na landing page',
    landing_page_id: landingPageId,
    action: action,
    section: section,
  });
}

export function trackWhatsAppClick(landingPageId: string, phone?: string) {
  trackEvent('whatsapp_click', {
    event_category: 'landing_page',
    event_label: 'Clique no WhatsApp',
    landing_page_id: landingPageId,
    phone: phone,
  });
}

export function trackPhoneClick(landingPageId: string, phone?: string) {
  trackEvent('phone_click', {
    event_category: 'landing_page',
    event_label: 'Clique no telefone',
    landing_page_id: landingPageId,
    phone: phone,
  });
}

export function trackEmailClick(landingPageId: string, email?: string) {
  trackEvent('email_click', {
    event_category: 'landing_page',
    event_label: 'Clique no email',
    landing_page_id: landingPageId,
    email: email,
  });
}

// Dashboard
export function trackDashboardView() {
  trackEvent('dashboard_view', {
    event_category: 'user_journey',
    event_label: 'Dashboard visualizado',
  });
}

// Erros
export function trackError(errorType: string, errorMessage: string) {
  trackEvent('error', {
    event_category: 'error',
    event_label: errorType,
    error_message: errorMessage,
  });
}
