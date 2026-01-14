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

export const ImmersiveOverlay: React.FC<Props> = ({ content, design, visibility, photoUrl, aboutPhotoUrl, briefing, layoutVariant, landingPageId }) => {
  const { p, s, t, r } = getDesignClasses(design);

  const handlePrimaryCtaClick = () => {
    if (landingPageId) {
      try {
        trackClick(landingPageId, 'CTA Hero Principal', 'hero');
      } catch (error) {
        console.error('Erro ao registrar clique no CTA principal (overlay):', error);
      }
    }

    const phone = content.contactPhone || briefing.contactPhone;
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      window.open(`https://wa.me/55${cleanPhone}`, '_blank');
      return;
    }

    const contactSection = document.getElementById('contact') || document.getElementById('location');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`w-full h-full overflow-y-auto preview-scroll bg-white ${t.body} relative`}>
       <Navbar content={content} design={design} briefing={briefing} visibility={visibility} layoutVariant={layoutVariant} landingPageId={landingPageId} />

       <header className={`py-12 md:py-24 px-6 md:px-12 bg-gradient-to-br ${p.gradient} overflow-hidden`}>
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-20">
           
           {/* Text Content - Left */}
           <div className="md:w-1/2 relative z-10 order-2 md:order-1 text-center md:text-left">
             <div className={`inline-block px-4 py-1.5 mb-6 border ${p.border} ${p.surface} rounded-full`}>
               <span className={`text-xs font-bold uppercase tracking-wider ${p.primary}`}>{briefing.specialty}</span>
             </div>
             <h1 className={`${t.hero} ${p.primary} mb-6 leading-tight`}>{content.headline}</h1>
             <p className="text-lg md:text-xl text-gray-600 mb-8 font-light leading-relaxed">{content.subheadline}</p>
               <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <button
                    className={`px-8 py-4 text-lg font-bold text-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 ${p.accent} ${p.accentHover} ${r.btn}`}
                    onClick={handlePrimaryCtaClick}
                  >
                    {content.ctaText}
                  </button>
               </div>
           </div>

           {/* Image Right */}
           <div className="md:w-1/2 relative order-1 md:order-2 flex justify-center">
              <div className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px]">
                <PhotoFrame photoUrl={photoUrl} design={design} alt={briefing.name} />
              </div>
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