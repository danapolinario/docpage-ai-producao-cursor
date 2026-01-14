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

export const GridStudio: React.FC<Props> = ({ content, design, visibility, photoUrl, aboutPhotoUrl, briefing, layoutVariant, landingPageId }) => {
  const { p, s, t, r } = getDesignClasses(design);

  const handlePrimaryCtaClick = () => {
    if (landingPageId) {
      try {
        trackClick(landingPageId, 'CTA Hero Principal', 'hero');
      } catch (error) {
        console.error('Erro ao registrar clique no CTA principal (grid):', error);
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

        <header className={`py-12 md:py-20 px-6 md:px-12 bg-white`}>
           <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
              
              {/* Text Area */}
              <div className={`md:col-span-7 ${p.surface} ${r.box} p-8 md:p-12 flex flex-col justify-center relative overflow-hidden border ${p.border}`}>
                 <div className={`absolute top-0 right-0 w-64 h-64 ${s.bg} opacity-5 rounded-full blur-3xl -mr-16 -mt-16`}></div>
                 <h1 className={`${t.hero} ${p.primary} mb-6 relative z-10`}>{content.headline}</h1>
                 <p className="text-xl text-gray-600 mb-8 max-w-lg relative z-10">{content.subheadline}</p>
                  <div className="flex gap-4 relative z-10">
                     <button
                       className={`px-8 py-3 font-bold text-white ${p.accent} ${p.accentHover} ${r.btn}`}
                       onClick={handlePrimaryCtaClick}
                     >
                       {content.ctaText}
                     </button>
                  </div>
              </div>
              
              {/* Image Area */}
              <div className="md:col-span-5 relative flex justify-center md:justify-end">
                 <div className="relative w-full max-w-sm aspect-[3/4]">
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