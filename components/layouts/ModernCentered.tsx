import React from 'react';
import { LandingPageContent, DesignSettings, SectionVisibility, BriefingData, LayoutVariant } from '../../types';
import { getDesignClasses } from '../../utils/designSystem';
import { Navbar, ServicesSection, AboutSection, TestimonialsSection, FooterSection, LocationSection, WhatsAppButton } from '../sections/CommonSections';
import { PhotoFrame } from '../PhotoFrame';
import { trackClick } from '../../services/analytics';

interface Props {
  content: LandingPageContent;
  design: DesignSettings;
  visibility: SectionVisibility;
  photoUrl: string | null;
  aboutPhotoUrl?: string | null; // Added prop
  briefing: BriefingData;
  layoutVariant: LayoutVariant;
  landingPageId?: string;
}

export const ModernCentered: React.FC<Props> = ({ content, design, visibility, photoUrl, aboutPhotoUrl, briefing, layoutVariant, landingPageId }) => {
  const { p, s, t, r } = getDesignClasses(design);

  const handleCtaClick = () => {
    if (landingPageId) {
      try {
        trackClick(landingPageId, 'CTA Hero Principal', 'hero');
      } catch (error) {
        console.error('Erro ao registrar clique no CTA principal:', error);
      }
    }

    const contactSection = document.getElementById('contact') || document.getElementById('location');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`w-full h-full overflow-y-auto preview-scroll bg-white ${t.body} relative`}>
      <Navbar content={content} design={design} briefing={briefing} visibility={visibility} layoutVariant={layoutVariant} landingPageId={landingPageId} />

      <header className={`relative pt-20 pb-0 px-6 md:px-12 bg-gradient-to-br ${p.gradient} text-center overflow-hidden`}>
         <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center">
           
           <div className={`inline-flex items-center px-4 py-1.5 rounded-full border ${p.border} bg-white/60 backdrop-blur mb-8 shadow-sm`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${s.bg}`}></span>
              <span className={`text-xs font-bold uppercase tracking-wider ${p.primary}`}>{briefing.specialty}</span>
           </div>
           
           <h1 className={`${t.hero} ${p.primary} mb-8 leading-tight`}>{content.headline}</h1>
           
           <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">{content.subheadline}</p>
           
           <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button 
                onClick={handleCtaClick}
                className={`px-10 py-4 text-lg font-bold text-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 ${p.accent} ${p.accentHover} ${r.btn}`}
              >
                {content.ctaText}
              </button>
           </div>
           
           {/* Image Container */}
           <div className="relative w-full max-w-xl mx-auto mt-auto h-[400px] md:h-[500px]">
              <PhotoFrame photoUrl={photoUrl} design={design} alt={briefing.name} className="object-top" />
           </div>

         </div>
      </header>

      {visibility.services && <ServicesSection content={content} design={design} layoutVariant={layoutVariant} />}
      {visibility.about && <AboutSection content={content} design={design} layoutVariant={layoutVariant} aboutPhotoUrl={aboutPhotoUrl} />}
      {visibility.testimonials && <TestimonialsSection content={content} design={design} layoutVariant={layoutVariant} />}
      <LocationSection content={content} design={design} briefing={briefing} layoutVariant={layoutVariant} />
      {visibility.footer && <FooterSection content={content} design={design} briefing={briefing} layoutVariant={layoutVariant} />}
      
      <WhatsAppButton phone={content.contactPhone || briefing.contactPhone} landingPageId={landingPageId} />
    </div>
  );
};