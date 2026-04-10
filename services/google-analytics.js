/**
 * Serviço de Google Analytics (GA4)
 *
 * Separação de streams:
 * - Produto DocPage (web app)
 * - Landing pages publicadas
 */
const PRODUCT_GA_ID = import.meta.env.VITE_GA_PRODUCT_ID || 'G-X8RK63KDBN';
const LANDING_GA_ID = import.meta.env.VITE_GA_LANDING_ID || 'G-CGYZDECJRT';
const configuredTargets = new Set();
function getMeasurementId(target) {
    return target === 'landing' ? LANDING_GA_ID : PRODUCT_GA_ID;
}
export function shouldTrackPath(pathname) {
    const path = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
    return !/^\/(admin|dev)(\/|$)/i.test(path);
}
function ensureGtagLoaded() {
    if (typeof window === 'undefined')
        return;
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
function ensureTargetConfigured(target) {
    ensureGtagLoaded();
    if (typeof window === 'undefined')
        return;
    if (configuredTargets.has(target))
        return;
    const measurementId = getMeasurementId(target);
    window.gtag('config', measurementId, { send_page_view: false });
    configuredTargets.add(target);
}
export function initGoogleAnalytics(target = 'product') {
    ensureTargetConfigured(target);
}
function sendEvent(eventName, eventParams, target) {
    ensureTargetConfigured(target);
    if (typeof window === 'undefined' || !window.gtag)
        return;
    const measurementId = getMeasurementId(target);
    window.gtag('event', eventName, {
        ...eventParams,
        send_to: measurementId,
    });
}
export function trackPageView(path, title, target = 'product') {
    if (!shouldTrackPath(path))
        return;
    if (!shouldTrackPath(typeof window !== 'undefined' ? window.location.pathname : path))
        return;
    sendEvent('page_view', {
        page_path: path,
        page_title: title || (typeof document !== 'undefined' ? document.title : path),
    }, target);
}
export function trackEvent(eventName, eventParams, target = 'product') {
    const pathFromEvent = eventParams?.page_path || eventParams?.pathname;
    if (!shouldTrackPath(pathFromEvent))
        return;
    if (!shouldTrackPath(typeof window !== 'undefined' ? window.location.pathname : pathFromEvent))
        return;
    sendEvent(eventName, eventParams || {}, target);
}
export function trackProductPageView(path, title) {
    trackPageView(path, title, 'product');
}
export function trackProductEvent(eventName, eventParams) {
    trackEvent(eventName, eventParams, 'product');
}
export function trackLandingEvent(eventName, eventParams) {
    trackEvent(eventName, eventParams, 'landing');
}
export function trackHomeClick(params) {
    trackProductEvent('home_click', {
        event_category: 'home',
        ...params,
    });
}
/** Modal de captura de lead na home SaaS */
export function trackLeadModalOpen() {
    trackProductEvent('lead_modal_open', {
        event_category: 'home',
        event_label: 'Modal de lead exibida',
    });
}
export function trackLeadModalFill(firstField) {
    trackProductEvent('lead_modal_fill', {
        event_category: 'home',
        event_label: 'Utilizador começou a preencher a modal de lead',
        first_field: firstField,
    });
}
export function trackLeadModalClose(reason) {
    trackProductEvent('lead_modal_close', {
        event_category: 'home',
        event_label: 'Modal de lead fechada',
        close_reason: reason,
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
export function trackBriefingComplete(briefingData) {
    trackProductEvent('briefing_complete', {
        event_category: 'user_journey',
        event_label: 'Briefing concluído',
        specialty: briefingData.specialty,
        doctor_name: briefingData.name,
    });
}
// Step 2: Estilo
export function trackStyleSelect(style) {
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
export function trackContentEdit(section) {
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
export function trackPlanSelect(planName, planPrice) {
    trackProductEvent('plan_select', {
        event_category: 'user_journey',
        event_label: 'Plano selecionado',
        plan_name: planName,
        plan_price: planPrice,
    });
}
export function trackCheckoutStart(planName) {
    trackProductEvent('checkout_start', {
        event_category: 'conversion',
        event_label: 'Checkout iniciado',
        plan_name: planName,
    });
}
export function trackCheckoutStep(step, stepName) {
    trackProductEvent('checkout_step', {
        event_category: 'conversion',
        event_label: `Checkout - ${stepName}`,
        step_number: step,
        step_name: stepName,
    });
}
export function trackPaymentComplete(planName, value) {
    trackProductEvent('purchase', {
        event_category: 'conversion',
        event_label: 'Pagamento concluído',
        plan_name: planName,
        value: value,
        currency: 'BRL',
    });
}
// Landing Pages - Acessos e Cliques
export function trackLandingPageView(landingPageId, subdomain) {
    trackLandingEvent('landing_page_view', {
        event_category: 'landing_page',
        event_label: 'Acesso à landing page',
        landing_page_id: landingPageId,
        subdomain: subdomain,
    });
    // Também enviar como page_view
    trackPageView(`/${subdomain}`, `Landing Page - ${subdomain}`, 'landing');
}
export function trackLandingPageClick(landingPageId, action, section) {
    trackLandingEvent('landing_page_click', {
        event_category: 'landing_page',
        event_label: 'Clique na landing page',
        landing_page_id: landingPageId,
        action: action,
        section: section,
    });
}
export function trackWhatsAppClick(landingPageId, phone) {
    trackLandingEvent('whatsapp_click', {
        event_category: 'landing_page',
        event_label: 'Clique no WhatsApp',
        landing_page_id: landingPageId,
        phone: phone,
    });
}
export function trackPhoneClick(landingPageId, phone) {
    trackLandingEvent('phone_click', {
        event_category: 'landing_page',
        event_label: 'Clique no telefone',
        landing_page_id: landingPageId,
        phone: phone,
    });
}
export function trackEmailClick(landingPageId, email) {
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
export function trackError(errorType, errorMessage) {
    trackProductEvent('error', {
        event_category: 'error',
        event_label: errorType,
        error_message: errorMessage,
    });
}
