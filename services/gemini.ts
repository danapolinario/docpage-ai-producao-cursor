import { BriefingData, LandingPageContent, DesignSettings, SectionVisibility, AIModificationResponse } from "../types";
import { supabase } from "../lib/supabase";

export const generateLandingPageContent = async (
  briefing: BriefingData
): Promise<LandingPageContent> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-content', {
      body: { type: 'generate', briefing }
    });

    if (error) throw error;
    return sanitizeContent(data);
  } catch (error) {
    console.error("Error generating LP content:", error);
    throw error;
  }
};

export const enhancePhoto = async (base64Image: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('photo-enhance', {
      body: { image: base64Image, type: 'profile' },
    });

    if (error) {
      console.error('Erro na IA ao melhorar foto de perfil:', error);
      return base64Image;
    }

    const enhanced = (data as any)?.image as string | undefined;
    return enhanced || base64Image;
  } catch (err) {
    console.error('Erro inesperado em enhancePhoto:', err);
    return base64Image;
  }
};

export const generateOfficePhoto = async (base64Image: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('photo-enhance', {
      body: { image: base64Image, type: 'office' },
    });

    if (error) {
      console.error('Erro na IA ao gerar foto de consultório:', error);
      return base64Image;
    }

    const office = (data as any)?.image as string | undefined;
    return office || base64Image;
  } catch (err) {
    console.error('Erro inesperado em generateOfficePhoto:', err);
    return base64Image;
  }
};

export const refineLandingPage = async (
  currentContent: LandingPageContent,
  currentDesign: DesignSettings,
  currentVisibility: SectionVisibility,
  instruction: string
): Promise<AIModificationResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-content', {
      body: { 
        type: 'refine', 
        currentContent, 
        currentDesign, 
        currentVisibility, 
        instruction 
      }
    });

    if (error) throw error;
    return data as AIModificationResponse;
  } catch (error) {
    console.error("Error refining content:", error);
    throw error;
  }
};

const FORBIDDEN_TERMS = [
  { regex: /\b(garantido|garantia|garantimos)\b/gi, replacement: "focado em resultados" },
  { regex: /\b(cura|curar|cura definitiva)\b/gi, replacement: "tratamento" },
  { regex: /\b(100%|cem por cento|totalmente eficaz)\b/gi, replacement: "eficaz" },
  { regex: /\b(o melhor|a melhor|o único|a única)\b/gi, replacement: "referência" },
  { regex: /\b(sem riscos|sem dor|sem efeitos colaterais)\b/gi, replacement: "minimamente invasivo" },
  { regex: /\b(promoção|desconto|off|imperdível|compre agora)\b/gi, replacement: "condições especiais" },
  { regex: /\b(milagre|milagroso|mágico|imediato)\b/gi, replacement: "avançado" },
  { regex: /\b(antes e depois)\b/gi, replacement: "casos clínicos" },
];

const scrubText = (text: string): string => {
  if (!text) return "";
  let cleaned = text;
  FORBIDDEN_TERMS.forEach(({ regex, replacement }) => {
    cleaned = cleaned.replace(regex, replacement);
  });
  return cleaned;
};

export const sanitizeContent = (data: any): LandingPageContent => {
  return {
    headline: scrubText(typeof data?.headline === 'string' ? data.headline : ""),
    subheadline: scrubText(typeof data?.subheadline === 'string' ? data.subheadline : ""),
    ctaText: scrubText(typeof data?.ctaText === 'string' ? data.ctaText : ""),
    aboutTitle: scrubText(typeof data?.aboutTitle === 'string' ? data.aboutTitle : ""),
    aboutBody: scrubText(typeof data?.aboutBody === 'string' ? data.aboutBody : ""),
    servicesTitle: scrubText(typeof data?.servicesTitle === 'string' ? data.servicesTitle : ""),
    services: Array.isArray(data?.services) 
      ? data.services.map((s: any) => ({
          title: scrubText(s.title),
          description: scrubText(s.description)
        })) 
      : [],
    testimonials: Array.isArray(data?.testimonials) 
      ? data.testimonials.map((t: any) => ({
          name: t.name,
          text: scrubText(t.text)
        })) 
      : [],
    footerText: typeof data?.footerText === 'string' ? data.footerText : "",
    contactEmail: typeof data?.contactEmail === 'string' ? data.contactEmail : undefined,
    contactPhone: typeof data?.contactPhone === 'string' ? data.contactPhone : undefined,
    contactAddresses: Array.isArray(data?.contactAddresses) 
      ? data.contactAddresses 
      : (typeof data?.contactAddress === 'string' ? [data.contactAddress] : []),
    contactAddress: typeof data?.contactAddress === 'string' ? data.contactAddress : undefined
  };
};
