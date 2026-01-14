import React, { useEffect, useState } from 'react';
import { LandingPageContent, SectionVisibility } from '../types';

interface Props {
  content: LandingPageContent | null;
  visibility: SectionVisibility;
  onUpdateContent: (key: keyof LandingPageContent, value: any) => void;
  onToggleSection: (key: keyof SectionVisibility) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
  onGenerate: () => void;
}

// Loading Messages Sequence
const LOADING_MESSAGES = [
  "Analisando sua especialidade...",
  "Aplicando técnicas de Neuromarketing...",
  "Otimizando palavras-chave para o Google (SEO)...",
  "Estruturando oferta de alta conversão...",
  "Escrevendo textos éticos conforme CFM...",
  "Finalizando sua Landing Page..."
];

const COMPLIANCE_RULES = [
  { regex: /\b(garantido|garantia|garantimos)\b/i, message: "Promessa de resultado (Garantia) é vetada pelo CFM." },
  { regex: /\b(cura|curar|cura definitiva)\b/i, message: "Promessa de cura é proibida (Art. 112)." },
  { regex: /\b(100%|cem por cento|totalmente eficaz)\b/i, message: "Alegação de eficácia absoluta é vetada." },
  { regex: /\b(o melhor|a melhor|o único|a única)\b/i, message: "Autopromoção com exclusividade/superioridade é vetada." },
  { regex: /\b(sem riscos|sem dor|sem efeitos colaterais)\b/i, message: "Não existe procedimento médico isento de riscos." },
  { regex: /\b(promoção|desconto|off|imperdível|compre agora)\b/i, message: "Mercantilização da medicina é proibida." },
  { regex: /\b(milagre|milagroso|mágico|imediato)\b/i, message: "Sensacionalismo é vedado pelo Código de Ética." },
  { regex: /\b(antes e depois)\b/i, message: "Cuidado: 'Antes e depois' exige regras específicas e consentimento." },
];

export const ContentConfig: React.FC<Props> = ({
  content,
  visibility,
  onUpdateContent,
  onToggleSection,
  onNext,
  onBack,
  isLoading,
  onGenerate
}) => {
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  const [isCompliant, setIsCompliant] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);

  // Rotating loading messages
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
      return () => clearInterval(interval);
    } else {
      setLoadingStep(0);
    }
  }, [isLoading]);

  // Trigger generation on mount if no content
  useEffect(() => {
    if (!content && !isLoading) {
      onGenerate();
    }
  }, []);

  // Real-time validation
  useEffect(() => {
    if (!content) return;

    const newErrors: { [key: string]: string | null } = {};
    let hasError = false;

    const validateField = (text: string, fieldName: string) => {
      if (!text) return;
      for (const rule of COMPLIANCE_RULES) {
        if (rule.regex.test(text)) {
          newErrors[fieldName] = rule.message;
          hasError = true;
          break;
        }
      }
    };

    validateField(content.headline, 'headline');
    validateField(content.subheadline, 'subheadline');
    validateField(content.aboutBody, 'aboutBody');

    setErrors(newErrors);
    setIsCompliant(!hasError);

  }, [content?.headline, content?.subheadline, content?.aboutBody]);

  if (isLoading || !content) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-12 rounded-xl shadow-lg border border-gray-100 min-h-[400px] flex flex-col items-center justify-center animate-fade-in relative overflow-hidden">
         {/* Background pulse */}
         <div className="absolute inset-0 bg-blue-50 opacity-50 animate-pulse"></div>
         
         <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-8 shadow-lg"></div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2 transition-all duration-500 transform">
              Criando sua Copy...
            </h2>
            
            <div className="h-8 overflow-hidden relative w-full text-center">
               <p key={loadingStep} className="text-gray-600 font-medium text-lg animate-slide-up">
                 {LOADING_MESSAGES[loadingStep]}
               </p>
            </div>
            
            <p className="text-xs text-gray-400 mt-8 max-w-md text-center">
              Nossa IA está analisando normas do CFM e as melhores práticas de SEO para sua especialidade.
            </p>
         </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">3</span>
          Revisão de Conteúdo
        </h2>
        
        <p className="text-gray-600 mb-8">
          A IA gerou o conteúdo abaixo. Você pode ajustar agora ou editar visualmente depois.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Content Fields */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Manchete Principal (Hero)</label>
              <input 
                type="text"
                value={content.headline}
                onChange={(e) => onUpdateContent('headline', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.headline ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300'
                }`}
              />
              {errors.headline && (
                <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                  ⚠ {errors.headline}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Subtítulo</label>
              <textarea 
                value={content.subheadline}
                onChange={(e) => onUpdateContent('subheadline', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 h-24 resize-none ${
                  errors.subheadline ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300'
                }`}
              />
              {errors.subheadline && (
                <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                  ⚠ {errors.subheadline}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Sobre o Médico (Bio)</label>
              <textarea 
                value={content.aboutBody}
                onChange={(e) => onUpdateContent('aboutBody', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 h-32 resize-none ${
                  errors.aboutBody ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300'
                }`}
              />
              {errors.aboutBody && (
                <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                   ⚠ {errors.aboutBody}
                </p>
              )}
            </div>
          </div>

          {/* Sidebar - Visibility Toggles */}
          <div className="md:col-span-1 bg-gray-50 p-6 rounded-xl h-fit border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4">Estrutura da Página</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer p-2 bg-white rounded border border-gray-200 opacity-60">
                <span className="text-sm font-medium text-gray-700">Banner Principal</span>
                <input type="checkbox" checked={true} disabled className="w-4 h-4 text-blue-600" />
              </label>
              
              <label className="flex items-center justify-between cursor-pointer p-2 bg-white rounded border border-gray-200 hover:border-blue-300 transition-colors">
                <span className="text-sm font-medium text-gray-700">Sobre</span>
                <input 
                  type="checkbox" 
                  checked={visibility.about} 
                  onChange={() => onToggleSection('about')}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" 
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2 bg-white rounded border border-gray-200 hover:border-blue-300 transition-colors">
                <span className="text-sm font-medium text-gray-700">Serviços</span>
                <input 
                  type="checkbox" 
                  checked={visibility.services} 
                  onChange={() => onToggleSection('services')}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" 
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2 bg-white rounded border border-gray-200 hover:border-blue-300 transition-colors">
                <span className="text-sm font-medium text-gray-700">Depoimentos</span>
                <input 
                  type="checkbox" 
                  checked={visibility.testimonials} 
                  onChange={() => onToggleSection('testimonials')}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" 
                />
              </label>

               <label className="flex items-center justify-between cursor-pointer p-2 bg-white rounded border border-gray-200 hover:border-blue-300 transition-colors">
                <span className="text-sm font-medium text-gray-700">Rodapé</span>
                <input 
                  type="checkbox" 
                  checked={visibility.footer} 
                  onChange={() => onToggleSection('footer')}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" 
                />
              </label>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
               <div className="flex items-center gap-2 text-green-600 text-xs font-bold bg-green-50 p-2 rounded leading-tight">
                 <span className="text-base">✓</span> Copywriting Aprovado
               </div>
               
               {isCompliant ? (
                 <div className="flex items-center gap-2 text-green-600 text-xs font-bold bg-green-50 p-2 rounded leading-tight transition-colors">
                   <span className="text-base">✓</span> Conteúdo ético (CFM)
                 </div>
               ) : (
                 <div className="flex items-center gap-2 text-red-600 text-xs font-bold bg-red-50 p-2 rounded leading-tight transition-colors border border-red-100">
                   <span className="text-base">✕</span> Violação de Regras do CFM
                 </div>
               )}
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={onBack}
            className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={onNext}
            disabled={!isCompliant}
            className={`px-6 py-2 rounded-lg font-semibold text-white transition-colors shadow-lg ${
              isCompliant 
                ? 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-xl' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {isCompliant ? 'Aprovar e Continuar' : 'Corrija os erros'}
          </button>
        </div>
      </div>
    </div>
  );
};