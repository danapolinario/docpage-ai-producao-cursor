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

export const Editorial: React.FC<Props> = ({ content, design, visibility, photoUrl, aboutPhotoUrl, briefing, layoutVariant, landingPageId }) => {
  const { p, s, t, r } = getDesignClasses(design);

  const handlePrimaryCtaClick = () => {
    if (landingPageId) {
      try {
        trackClick(landingPageId, 'CTA Hero Principal', 'hero');
      } catch (error) {
        console.error('Erro ao registrar clique no CTA principal (editorial):', error);
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

  const handleSecondaryCtaClick = () => {
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`w-full h-full overflow-y-auto preview-scroll bg-white ${t.body} relative`}>
       <Navbar content={content} design={design} briefing={briefing} visibility={visibility} layoutVariant={layoutVariant} landingPageId={landingPageId} />

      <header className={`py-24 px-6 md:px-12 ${p.softBg}`}>
         <div className="max-w-6xl mx-auto border-b border-gray-200 pb-16">
            <div className="flex flex-col md:flex-row gap-12 items-end">
               <div className="md:w-2/3">
                  <p className={`text-sm font-bold uppercase tracking-widest mb-4 ${s.text}`}>{briefing.specialty} • {briefing.addresses?.[0] || ''}</p>
                  <h1 className={`${t.hero} ${p.primary} leading-none mb-8`}>{content.headline}</h1>
                   <div className="flex gap-4">
                     <button
                       className={`px-8 py-4 text-white font-bold ${p.accent} ${r.btn}`}
                       onClick={handlePrimaryCtaClick}
                     >
                       {content.ctaText}
                     </button>
                     <button
                       className={`px-8 py-4 border ${p.border} font-medium hover:bg-gray-50 ${r.btn}`}
                       onClick={handleSecondaryCtaClick}
                     >
                       Ver Especialidades
                     </button>
                   </div>
               </div>
               <div className="md:w-1/3 text-right">
                  <p className="text-lg text-gray-500 font-light leading-relaxed">{content.subheadline}</p>
               </div>
            </div>
            <div className="mt-16 w-full h-[500px]">
               <PhotoFrame photoUrl={photoUrl} design={design} alt={briefing.name} className="object-center" />
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