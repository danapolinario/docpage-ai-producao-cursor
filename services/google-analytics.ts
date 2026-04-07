/**
 * Serviço de Google Analytics (GA4)
 *
 * Separação de streams:
 * - Produto DocPage (web app)
 * - Landing pages publicadas
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    __docpageGaLoaded?: boolean;
  }
}

export type GATarget = 'product' | 'landing';

const PRODUCT_GA_ID = import.meta.env.VITE_GA_PRODUCT_ID || 'G-X8RK63KDBN';
const LANDING_GA_ID = import.meta.env.VITE_GA_LANDING_ID || 'G-CGYZDECJRT';
const configuredTargets = new Set<GATarget>();

function getMeasurementId(target: GATarget): string {
  return target === 'landing' ? LANDING_GA_ID : PRODUCT_GA_ID;
}

export function shouldTrackPath(pathname?: string): boolean {
  const path = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
  return !/^\/(admin|dev)(\/|$)/i.test(path);
}

function ensureGtagLoaded() {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  if (!window.__docpageGaLoaded) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${PRODUCT_GA_ID}`;
    document.head.appendChild(script);
    window.gtag('js', new Date());
    window.__docpageGaLoaded = true;
  }
}

function ensureTargetConfigured(target: GATarget) {
  ensureGtagLoaded();
  if (typeof window === 'undefined') return;
  if (configuredTargets.has(target)) return;

  const measurementId = getMeasurementId(target);
  window.gtag('config', measurementId, { send_page_view: false });
  configuredTargets.add(target);
}

export function initGoogleAnalytics(target: GATarget = 'product') {
  ensureTargetConfigured(target);
}

function sendEvent(eventName: string, eventParams: Record<string, any>, target: GATarget) {
  ensureTargetConfigured(target);
  if (typeof window === 'undefined' || !window.gtag) return;

  const measurementId = getMeasurementId(target);
  window.gtag('event', eventName, {
    ...eventParams,
    send_to: measurementId,
  });
}

export function trackPageView(path: string, title?: string, target: GATarget = 'product') {
  if (!shouldTrackPath(path)) return;
  if (!shouldTrackPath(typeof window !== 'undefined' ? window.location.pathname : path)) return;

  sendEvent(
    'page_view',
    {
      page_path: path,
      page_title: title || (typeof document !== 'undefined' ? document.title : path),
    },
    target
  );
}

export function trackEvent(
  eventName: string,
  eventParams?: {
    [key: string]: any;
  },
  target: GATarget = 'product'
) {
  const pathFromEvent = eventParams?.page_path || eventParams?.pathname;
  if (!shouldTrackPath(pathFromEvent)) return;
  if (!shouldTrackPath(typeof window !== 'undefined' ? window.location.pathname : pathFromEvent)) return;
  sendEvent(eventName, eventParams || {}, target);
}

export function trackProductPageView(path: string, title?: string) {
  trackPageView(path, title, 'product');
}

export function trackProductEvent(eventName: string, eventParams?: Record<string, any>) {
  trackEvent(eventName, eventParams, 'product');
}

export function trackLandingEvent(eventName: string, eventParams?: Record<string, any>) {
  trackEvent(eventName, eventParams, 'landing');
}

export function trackHomeClick(params: {
  element_type: 'button' | 'link';
  element_label: string;
  section: string;
  destination?: string;
  is_external: boolean;
}) {
  trackProductEvent('home_click', {
    event_category: 'home',
    ...params,
  });
}

/**
 * Eventos específicos do fluxo de criação
 */

// Step 1: Briefing
export function trackBriefingStart() {
  trackProductEvent('briefing_start', {
    event_category: 'user_journey',
    event_label: 'Briefing iniciado',
  });
}

export function trackBriefingComplete(briefingData: {
  specialty?: string;
  name?: string;
}) {
  trackProductEvent('briefing_complete', {
    event_category: 'user_journey',
    event_label: 'Briefing concluído',
    specialty: briefingData.specialty,
    doctor_name: briefingData.name,
  });
}

// Step 2: Estilo
export function trackStyleSelect(style: string) {
  trackProductEvent('style_select', {
    event_category: 'user_journey',
    event_label: 'Estilo selecionado',
    style_name: style,
  });
}

// Step 3: Foto
export function trackPhotoUpload() {
  trackProductEvent('photo_upload', {
    event_category: 'user_journey',
    event_label: 'Foto enviada',
  });
}

export function trackPhotoEnhance() {
  trackProductEvent('photo_enhance', {
    event_category: 'user_journey',
    event_label: 'Foto melhorada com IA',
  });
}

// Step 4: Preview/Editor
export function trackPreviewView() {
  trackProductEvent('preview_view', {
    event_category: 'user_journey',
    event_label: 'Preview visualizado',
  });
}

export function trackContentEdit(section: string) {
  trackProductEvent('content_edit', {
    event_category: 'user_journey',
    event_label: 'Conteúdo editado',
    section: section,
  });
}

// Step 5: Pricing/Checkout
export function trackPricingView() {
  trackProductEvent('pricing_view', {
    event_category: 'user_journey',
    event_label: 'Página de planos visualizada',
  });
}

export function trackPlanSelect(planName: string, planPrice: string) {
  trackProductEvent('plan_select', {
    event_category: 'user_journey',
    event_label: 'Plano selecionado',
    plan_name: planName,
    plan_price: planPrice,
  });
}

export function trackCheckoutStart(planName: string) {
  trackProductEvent('checkout_start', {
    event_category: 'conversion',
    event_label: 'Checkout iniciado',
    plan_name: planName,
  });
}

export function trackCheckoutStep(step: number, stepName: string) {
  trackProductEvent('checkout_step', {
    event_category: 'conversion',
    event_label: `Checkout - ${stepName}`,
    step_number: step,
    step_name: stepName,
  });
}

export function trackPaymentComplete(planName: string, value?: number) {
  trackProductEvent('purchase', {
    event_category: 'conversion',
    event_label: 'Pagamento concluído',
    plan_name: planName,
    value: value,
    currency: 'BRL',
  });
}

// Landing Pages - Acessos e Cliques
export function trackLandingPageView(landingPageId: string, subdomain: string) {
  trackLandingEvent('landing_page_view', {
    event_category: 'landing_page',
    event_label: 'Acesso à landing page',
    landing_page_id: landingPageId,
    subdomain: subdomain,
  });
  
  // Também enviar como page_view
  trackPageView(`/${subdomain}`, `Landing Page - ${subdomain}`, 'landing');
}

export function trackLandingPageClick(
  landingPageId: string,
  action: string,
  section?: string
) {
  trackLandingEvent('landing_page_click', {
    event_category: 'landing_page',
    event_label: 'Clique na landing page',
    landing_page_id: landingPageId,
    action: action,
    section: section,
  });
}

export function trackWhatsAppClick(landingPageId: string, phone?: string) {
  trackLandingEvent('whatsapp_click', {
    event_category: 'landing_page',
    event_label: 'Clique no WhatsApp',
    landing_page_id: landingPageId,
    phone: phone,
  });
}

export function trackPhoneClick(landingPageId: string, phone?: string) {
  trackLandingEvent('phone_click', {
    event_category: 'landing_page',
    event_label: 'Clique no telefone',
    landing_page_id: landingPageId,
    phone: phone,
  });
}

export function trackEmailClick(landingPageId: string, email?: string) {
  trackLandingEvent('email_click', {
    event_category: 'landing_page',
    event_label: 'Clique no email',
    landing_page_id: landingPageId,
    email: email,
  });
}

// Dashboard
export function trackDashboardView() {
  trackProductEvent('dashboard_view', {
    event_category: 'user_journey',
    event_label: 'Dashboard visualizado',
  });
}

// Erros
export function trackError(errorType: string, errorMessage: string) {
  trackProductEvent('error', {
    event_category: 'error',
    event_label: errorType,
    error_message: errorMessage,
  });
}
