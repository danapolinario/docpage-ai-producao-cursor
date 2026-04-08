/**
 * Remove dados sensíveis antes de serializar landing page em HTML público
 * (window.__LANDING_PAGE_DATA__). CPF e user_id nunca devem aparecer no view-source.
 */
const SENSITIVE_TOP_LEVEL_KEYS = ['cpf', 'user_id'] as const;

export function sanitizeLandingPageForPublicHtml<T extends object>(lp: T): T {
  const out = { ...(lp as Record<string, unknown>) };
  for (const key of SENSITIVE_TOP_LEVEL_KEYS) {
    delete out[key];
  }
  return out as T;
}
