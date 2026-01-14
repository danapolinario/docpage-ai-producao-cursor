
export enum ThemeType {
  CLINICAL = 'clinical',
  CARING = 'caring',
  MODERN = 'modern'
}

export type PhotoStyle = 'minimal' | 'organic' | 'framed' | 'glass' | 'floating' | 'arch' | 'rotate' | 'collage';

export interface BriefingData {
  name: string;
  crm: string;
  crmState: string;
  rqe: string;
  specialty: string; 
  targetAudience: string;
  mainServices: string;
  bio: string; 
  tone: string;
  contactPhone: string;
  contactEmail: string;
  addresses: string[]; 
}

export interface LandingPageContent {
  headline: string;
  subheadline: string;
  ctaText: string;
  aboutTitle: string;
  aboutBody: string;
  /**
   * Estatísticas da seção Sobre (experiência e pacientes), editáveis/removíveis no editor.
   * Se qualquer um desses campos estiver vazio, o respectivo card não é exibido.
   */
  aboutExperienceLabel?: string; // ex: "Anos de Experiência"
  aboutExperienceValue?: string; // ex: "15+"
  aboutPatientsLabel?: string;   // ex: "Pacientes Atendidos"
  aboutPatientsValue?: string;   // ex: "5k+"
  servicesTitle: string;
  services: Array<{ title: string; description: string }>;
  testimonials: Array<{ name: string; text: string }>;
  footerText: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddresses?: string[];
  contactAddress?: string;
}


export interface DesignSettings {
  colorPalette: 'blue' | 'green' | 'slate' | 'rose' | 'indigo';
  secondaryColor: 'orange' | 'teal' | 'purple' | 'gold' | 'gray';
  fontPairing: 'sans' | 'serif-sans' | 'mono-sans';
  borderRadius: 'none' | 'medium' | 'full';
  photoStyle: PhotoStyle;
}

export interface SectionVisibility {
  hero: boolean;
  services: boolean;
  about: boolean;
  testimonials: boolean;
  footer: boolean;
}

export type LayoutVariant = 1 | 2 | 3 | 4 | 5;

export interface Plan {
  id: string;
  name: string;
  price: string;
  oldPrice?: string; // Added optional old price
  rawPrice: number;
  period: string;
  description?: string; // Added optional description
  features: string[];
  popular: boolean;
  color: string;
  cta: string;
}

export interface AppState {
  step: number; 
  briefing: BriefingData;
  theme: ThemeType; 
  designSettings: DesignSettings;
  sectionVisibility: SectionVisibility;
  layoutVariant: LayoutVariant;
  photoUrl: string | null;
  aboutPhotoUrl: string | null;
  isPhotoAIEnhanced: boolean;
  generatedContent: LandingPageContent | null;
  modificationsLeft: number;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
}

export interface AIModificationResponse {
  content?: LandingPageContent;
  design?: Partial<DesignSettings>;
  visibility?: Partial<SectionVisibility>;
  explanation?: string;
}

export interface SeoScore {
  score: number;
  label: 'Baixo' | 'Bom' | 'Excelente';
  color: string;
  feedback: string;
}
