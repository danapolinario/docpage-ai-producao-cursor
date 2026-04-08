import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createLead, DUPLICATE_LEAD_EMAIL_MESSAGE } from '../services/leads';
import type { LeadData } from '../types';

interface LeadCaptureModalProps {
  onSuccess: (data: LeadData) => void;
  onClose?: () => void;
  /** E-mail já existe em `leads`: fechar captura e abrir login (tratado no pai). */
  onDuplicateEmail?: (email: string) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Máscara celular BR: (DD) 9XXXX-XXXX — até 11 dígitos (DDD + 9 dígitos). */
function formatBrazilMobileMask(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length > 11) {
    digits = digits.slice(2);
  }
  digits = digits.slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  const rest = digits.slice(2);
  if (rest.length <= 5) {
    return `(${digits.slice(0, 2)}) ${rest}`;
  }
  return `(${digits.slice(0, 2)}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}

/** Mesmo tamanho visual nos dois checkboxes (evita diferenças entre browsers). */
const LEAD_CHECKBOX_CLASS =
  'mt-0.5 h-[1.125rem] w-[1.125rem] min-h-[1.125rem] min-w-[1.125rem] shrink-0 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-0 accent-blue-600';

export const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({
  onSuccess,
  onClose,
  onDuplicateEmail,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [privacyAccepted, setPrivacyAccepted] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    name.trim().length > 0 &&
    EMAIL_REGEX.test(email.trim()) &&
    termsAccepted &&
    privacyAccepted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      let waDigits = whatsapp.replace(/\D/g, '');
      if (waDigits.startsWith('55') && waDigits.length > 11) {
        waDigits = waDigits.slice(2);
      }
      const { id, data } = await createLead({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        whatsapp: waDigits.length > 0 ? waDigits : undefined,
        marketingConsent,
        termsAccepted,
        privacyAccepted,
      });

      onSuccess({
        id,
        name: data.name,
        email: data.email,
        whatsapp: data.whatsapp || undefined,
        marketingConsent: data.marketing_consent,
        resumeToken: data.resume_token,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar. Tente novamente.';
      if (
        msg === DUPLICATE_LEAD_EMAIL_MESSAGE ||
        msg.includes('já foi cadastrado')
      ) {
        const addr = email.trim().toLowerCase();
        if (onDuplicateEmail) {
          onDuplicateEmail(addr);
          return;
        }
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm bg-gradient-to-tr from-blue-600/60 to-purple-500/60">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="purple-500  text-2xl font-bold text-slate-800 ">
              Vamos começar?
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-slate-500"
                aria-label="Fechar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Preencha seus dados básicos para não perder o histórico de criação do seu site.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            <span className="font-bold text-purple-700">Atenção!</span> Criar seu site é totalmente gratuito. Não pedimos cartão. Você só assina se gostar e depois de ver o resultado.
          </p>

        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="lead-name" className="block text-sm font-bold text-slate-700 mb-1">
              Seu nome *
            </label>
            <span className="block text-xs text-slate-500 mb-1">Como podemos te chamar.</span>
            <input
              id="lead-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              required
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="lead-email" className="block text-sm font-bold text-slate-700 mb-1">
              E-mail pessoal *
            </label>
            <span className="block text-xs text-slate-500 mb-1">Usado para fazer login e retomar a criação do seu site, caso necessite.</span>
            <input
              id="lead-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              required
              autoComplete="email"
            />

          </div>

          <div>
            
            <label htmlFor="lead-whatsapp" className="block text-sm font-bold text-slate-700 mb-1">
              WhatsApp (opcional)
            </label>
            <span className="block text-xs text-slate-500 mb-1">Conseguimos para darmos um suporte e ajuda mais qualificados.</span>
            <input
              id="lead-whatsapp"
              type="tel"
              inputMode="numeric"
              value={whatsapp}
              onChange={(e) => setWhatsapp(formatBrazilMobileMask(e.target.value))}
              placeholder="(11) 98765-4321"
              maxLength={15}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              autoComplete="tel-national"
            />
            <div className="p-4 border-b border-gray-100"></div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted && privacyAccepted}
                onChange={(e) => {
                  const v = e.target.checked;
                  setTermsAccepted(v);
                  setPrivacyAccepted(v);
                }}
                className={LEAD_CHECKBOX_CLASS}
              />
              <span className="text-sm text-slate-600">
                Li e aceito os{' '}
                <Link to="/termos-de-uso" target="_blank" className="text-blue-600 hover:underline font-medium">
                  Termos de Uso
                </Link>
                {' '}e{' '}
                <Link to="/politica-de-privacidade" target="_blank" className="text-blue-600 hover:underline font-medium">
                  Política de Privacidade
                </Link>
                {' '}*
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className={LEAD_CHECKBOX_CLASS}
              />
              <span className="text-sm text-slate-600">
                Aceito receber novidades, ofertas e ajuda da equipe do DocPage AI (opcional)
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-4"
          >
            {isSubmitting ? 'Enviando...' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  );
};
