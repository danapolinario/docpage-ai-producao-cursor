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

export const ClassicSplit: React.FC<Props> = ({ content, design, visibility, photoUrl, aboutPhotoUrl, briefing, layoutVariant, landingPageId }) => {
  const { p, s, t, r } = getDesignClasses(design);

  const handlePrimaryCtaClick = () => {
    if (landingPageId) {
      trackClick(landingPageId, 'CTA Hero Principal', 'hero');
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
    const aboutSection = document.getElementById('about') || document.getElementById('services');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`w-full h-full overflow-y-auto preview-scroll bg-white ${t.body} relative`}>
      <Navbar content={content} design={design} briefing={briefing} visibility={visibility} layoutVariant={layoutVariant} landingPageId={landingPageId} />

      <header className={`relative pt-12 pb-24 md:pt-24 md:pb-32 px-6 md:px-12 bg-gradient-to-b ${p.gradient} overflow-hidden`}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Content */}
          <div className="md:col-span-6 lg:col-span-7 space-y-8 text-center md:text-left order-2 md:order-1">
            <div className={`inline-flex items-center px-3 py-1 rounded-full border ${p.border} bg-white/50 backdrop-blur`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${s.bg}`}></span>
              <span className={`text-xs font-bold uppercase tracking-wider ${p.primary}`}>{briefing.specialty}</span>
            </div>
            <h1 className={`${t.hero} ${p.primary} leading-[1.1]`}>
              {content.headline}
            </h1>
            <p className="text-xl md:text-2xl font-light text-gray-500 max-w-2xl mx-auto md:mx-0 leading-relaxed">
              {content.subheadline}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
              <button
                className={`px-8 py-4 text-lg font-semibold text-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 ${p.accent} ${p.accentHover} ${r.btn}`}
                onClick={handlePrimaryCtaClick}
              >
                {content.ctaText}
              </button>
              <button
                className={`px-8 py-4 text-lg font-medium border bg-white hover:bg-gray-50 transition-colors ${p.border} ${p.primary} ${r.btn}`}
                onClick={handleSecondaryCtaClick}
              >
                Saiba Mais
              </button>
            </div>
          </div>

          {/* Image Area */}
          <div className="md:col-span-6 lg:col-span-5 relative order-1 md:order-2 flex justify-center md:justify-end">
            <div className="relative w-full max-w-md aspect-[4/5]">
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