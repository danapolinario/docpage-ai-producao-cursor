import React from 'react';
import { LandingPageContent, DesignSettings, BriefingData, SectionVisibility, LayoutVariant } from '../../types';
import { getDesignClasses } from '../../utils/designSystem';
import { trackClick } from '../../services/analytics';

interface SectionProps {
  content: LandingPageContent;
  design: DesignSettings;
  briefing?: BriefingData;
  visibility?: SectionVisibility;
  layoutVariant?: LayoutVariant;
  aboutPhotoUrl?: string | null; // Added prop
  landingPageId?: string;
}

// --- Helper Functions & Components ---

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

const MapEmbed = ({ address, className = "", heightClass = "h-64" }: { address: string, className?: string, heightClass?: string }) => (
  <div className={`w-full ${heightClass} overflow-hidden shadow-sm bg-gray-100 ${className}`}>
     <iframe
       width="100%"
       height="100%"
       frameBorder="0"
       style={{ border: 0 }}
       src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
       allowFullScreen
       loading="lazy"
       title={`Mapa para ${address}`}
     ></iframe>
  </div>
);

export const WhatsAppButton: React.FC<{ phone?: string; landingPageId?: string }> = ({ phone, landingPageId }) => {
  if (!phone) return null;
  
  // Clean phone for link (remove non-numeric chars)
  const cleanPhone = phone.replace(/\D/g, '');

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();

    if (landingPageId) {
      try {
        trackClick(landingPageId, 'WhatsApp Flutuante', 'whatsapp_floating', {
          referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        });
      } catch (error) {
        console.error('Erro ao registrar clique no WhatsApp flutuante:', error);
      }
    }
  };
  
  return (
    <a 
      href={`https://wa.me/55${cleanPhone}`} 
      target="_blank" 
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20bd5a] text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 group flex items-center gap-2 animate-fade-in"
      aria-label="Falar no WhatsApp"
      onClick={handleClick}
    >
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
      </svg>
      <span className="hidden md:block font-bold pr-2">Agendar</span>
    </a>
  );
}

// --- Existing Components ---

export const Navbar: React.FC<SectionProps> = ({ design, briefing, visibility, layoutVariant = 1, content, landingPageId }) => {
  const { p, s } = getDesignClasses(design);
  if (!briefing || !visibility) return null;

  const handleLinkClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    scrollToSection(id);
  };

  const handleCtaClick = () => {
    if (landingPageId) {
      try {
        trackClick(landingPageId, 'CTA Navbar - Agendar', 'navbar', {
          referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        });
      } catch (error) {
        console.error('Erro ao registrar clique no CTA do Navbar:', error);
      }
    }

    if (content.contactPhone) {
        const cleanPhone = content.contactPhone.replace(/\D/g, '');
        window.open(`https://wa.me/55${cleanPhone}`, '_blank');
    } else {
        scrollToSection('contact');
    }
  };

  const CrmBadge = () => (
    <div className="flex flex-col md:flex-row md:items-center md:gap-2">
      <span className="font-bold">{briefing.name}</span>
      {briefing.crm && (
        <span className="text-[10px] uppercase tracking-wider opacity-70 bg-gray-100 px-1 rounded text-gray-600 font-sans border border-gray-200">
           CRM/{briefing.crmState || 'UF'} {briefing.crm}
        </span>
      )}
    </div>
  );

  if (layoutVariant === 5) {
    return (
      <nav className={`py-8 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center bg-white border-b-2 border-black`}>
        <div className={`text-2xl font-serif font-bold tracking-tighter ${p.primary} text-center md:text-left mb-4 md:mb-0`}>
          <CrmBadge />
        </div>
        <div className="flex gap-4 md:gap-8 text-xs font-bold uppercase tracking-widest">
           {visibility.about && <button onClick={(e) => handleLinkClick(e, 'about')} className="hover:underline">Sobre</button>}
           {visibility.services && <button onClick={(e) => handleLinkClick(e, 'services')} className="hover:underline">Serviços</button>}
           <button onClick={handleCtaClick} className="border px-4 py-1 border-black cursor-pointer hover:bg-black hover:text-white transition-colors">Agendar</button>
        </div>
      </nav>
    );
  }

  if (layoutVariant === 2) {
    return (
      <div className="flex justify-center pt-6 sticky top-0 z-50 pointer-events-none px-4">
        <nav className={`pointer-events-auto px-6 py-3 rounded-full flex items-center justify-between md:justify-start gap-4 md:gap-6 bg-white/80 backdrop-blur-lg border border-white/50 shadow-lg w-full md:w-auto`}>
          <div className={`font-bold ${p.primary} truncate`}>
            <div className="flex items-center gap-2">
              <span className="text-sm md:text-base">{briefing.name}</span>
              {briefing.crm && <span className="hidden md:inline text-[9px] text-gray-400 font-normal border px-1 rounded">CRM {briefing.crm}</span>}
            </div>
          </div>
          <div className="hidden md:flex gap-4 text-sm text-gray-600">
            {visibility.services && <button onClick={(e) => handleLinkClick(e, 'services')} className="hover:text-black">Serviços</button>}
            {visibility.testimonials && <button onClick={(e) => handleLinkClick(e, 'testimonials')} className="hover:text-black">Depoimentos</button>}
          </div>
          <button onClick={handleCtaClick} className={`px-4 py-1.5 text-xs font-bold text-white rounded-full ${p.accent} flex-shrink-0`}>
            Agendar
          </button>
        </nav>
      </div>
    );
  }

  return (
    <nav className={`py-6 px-6 md:px-12 flex justify-between items-center sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b ${p.border}`}>
      <div className={`text-lg font-bold tracking-tight ${p.primary} flex items-center gap-2`}>
        <div className={`w-3 h-3 ${s.bg} rounded-full`}></div>
        <CrmBadge />
      </div>
      <div className="hidden md:flex gap-8 text-sm font-medium text-gray-500">
        {visibility.about && <button onClick={(e) => handleLinkClick(e, 'about')} className={`hover:${s.text} transition-colors`}>Sobre</button>}
        {visibility.services && <button onClick={(e) => handleLinkClick(e, 'services')} className={`hover:${s.text} transition-colors`}>Especialidades</button>}
        {visibility.testimonials && <button onClick={(e) => handleLinkClick(e, 'testimonials')} className={`hover:${s.text} transition-colors`}>Depoimentos</button>}
      </div>
      <button onClick={handleCtaClick} className={`px-4 py-2 md:px-5 md:py-2.5 text-sm font-semibold text-white shadow-lg shadow-${design.colorPalette}-500/20 transition-all hover:-translate-y-0.5 ${p.accent} ${p.accentHover}`}>
        Agendar
      </button>
    </nav>
  );
};

export const ServicesSection: React.FC<SectionProps> = ({ content, design, layoutVariant = 1 }) => {
  const { p, s, t, r } = getDesignClasses(design);

  if (layoutVariant === 5) {
    return (
      <section id="services" className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-xs font-bold uppercase tracking-widest mb-12 border-b border-black pb-4 ${s.text}`}>
            Especialidades
          </h2>
          <div className="space-y-12">
            {content.services.map((service, idx) => (
              <div key={idx} className="group cursor-pointer">
                 <h3 className={`text-2xl md:text-5xl font-serif font-light mb-4 group-hover:pl-4 transition-all duration-300 ${p.primary}`}>
                   <span className="text-sm align-top mr-4 text-gray-400 font-sans font-bold">0{idx + 1}</span>
                   {service.title}
                 </h3>
                 <p className="text-gray-500 max-w-xl ml-10 pl-4 border-l border-gray-200 text-sm md:text-base">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (layoutVariant === 4) {
    return (
      <section id="services" className={`py-20 px-6 ${p.softBg}`}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 flex items-end gap-4">
             <h2 className={`text-3xl md:text-4xl font-bold ${p.primary}`}>Serviços</h2>
             <div className={`h-1 flex-1 ${s.bg}`}></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
             {content.services.map((service, idx) => (
               <div key={idx} className={`bg-white p-8 md:p-10 border-2 border-transparent hover:border-black transition-all duration-300 group`}>
                  <span className={`text-4xl md:text-5xl font-black text-gray-100 group-hover:${s.text} transition-colors`}>{idx + 1}.</span>
                  <h3 className="text-xl font-bold mt-4 mb-2">{service.title}</h3>
                  <p className="text-sm text-gray-500">{service.description}</p>
               </div>
             ))}
          </div>
        </div>
      </section>
    );
  }

  if (layoutVariant === 2) {
    return (
      <section id="services" className={`py-24 px-6 relative overflow-hidden bg-gradient-to-b ${p.gradient}`}>
         <div className={`absolute top-1/4 left-10 w-64 h-64 ${s.bg} opacity-10 blur-3xl rounded-full`}></div>
         <div className={`absolute bottom-1/4 right-10 w-80 h-80 ${p.accent} opacity-10 blur-3xl rounded-full`}></div>
         
         <div className="max-w-7xl mx-auto relative z-10">
           <div className="text-center mb-16">
             <span className={`text-xs font-bold uppercase tracking-wider ${s.text} mb-2 block`}>O que oferecemos</span>
             <h2 className={`text-3xl md:text-4xl font-bold ${p.primary}`}>{content.servicesTitle}</h2>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {content.services.map((service, idx) => (
               <div key={idx} className={`bg-white/60 backdrop-blur-md p-8 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${r.box}`}>
                 <div className={`w-12 h-12 rounded-2xl ${p.accent} bg-opacity-10 flex items-center justify-center mb-6 text-2xl`}>
                   {idx === 0 ? '🔬' : idx === 1 ? '💊' : '🩺'}
                 </div>
                 <h3 className={`text-xl font-bold mb-3 ${p.primary}`}>{service.title}</h3>
                 <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>
               </div>
             ))}
           </div>
         </div>
      </section>
    );
  }

  return (
    <section id="services" className={`py-24 px-6 md:px-12 ${p.softBg}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className={`text-3xl md:text-4xl mb-6 ${p.primary} ${t.head}`}>
            {content.servicesTitle}
          </h2>
          <div className={`w-24 h-1 mx-auto ${s.bg} rounded-full opacity-40`}></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {content.services.map((service, idx) => (
            <div key={idx} className={`group bg-white p-8 md:p-10 border ${p.border} ${r.box} hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-300 relative overflow-hidden`}>
              <div className={`absolute top-0 right-0 w-32 h-32 ${p.surface} rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`}></div>
              <div className={`relative w-14 h-14 flex items-center justify-center mb-8 text-2xl ${s.light} ${s.text} ${r.btn}`}>
                {idx === 0 ? '✦' : idx === 1 ? '✚' : '★'}
              </div>
              <h3 className={`text-xl font-bold mb-4 relative z-10 ${p.primary}`}>{service.title}</h3>
              <p className="text-gray-500 leading-relaxed relative z-10">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const AboutSection: React.FC<SectionProps> = ({ content, design, layoutVariant = 1, aboutPhotoUrl }) => {
  const { p, s, t, r } = getDesignClasses(design);
  const photoSrc = aboutPhotoUrl || "https://picsum.photos/seed/doctor_work/800/800";

  if (layoutVariant === 4) {
    return (
      <section id="about" className={`border-y-2 border-black`}>
         <div className="grid grid-cols-1 md:grid-cols-2">
            <div className={`p-8 md:p-24 ${p.surface} flex flex-col justify-center order-2 md:order-1`}>
               <h2 className={`text-3xl md:text-4xl font-bold mb-8 uppercase tracking-tight`}>{content.aboutTitle}</h2>
               <p className="text-base md:text-lg font-medium leading-relaxed">{content.aboutBody}</p>
               <div className="mt-12 flex gap-8">
                  <div>
                    <span className="block text-3xl font-black">15+</span>
                    <span className="text-xs uppercase">Anos</span>
                  </div>
                  <div>
                    <span className="block text-3xl font-black">5k</span>
                    <span className="text-xs uppercase">Pacientes</span>
                  </div>
               </div>
            </div>
            <div className="h-64 md:h-full min-h-[300px] md:min-h-[400px] order-1 md:order-2">
               <img src={photoSrc} className="w-full h-full object-cover grayscale contrast-125" alt="About" />
            </div>
         </div>
      </section>
    );
  }

  if (layoutVariant === 3) {
    return (
      <section id="about" className="py-24 px-6 overflow-hidden">
         <div className="max-w-6xl mx-auto relative">
            <div className={`absolute top-0 right-0 w-full md:w-2/3 h-full ${p.surface} rounded-l-none md:rounded-l-[100px] -z-10`}></div>
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
               <div className="w-full md:w-1/2">
                  <div className="relative">
                     <div className={`absolute inset-0 ${s.bg} rounded-[2rem] rotate-3 opacity-20`}></div>
                     <img src={photoSrc} className={`relative rounded-[2rem] shadow-xl w-full h-64 md:h-auto object-cover rotate-[-2deg] hover:rotate-0 transition-transform duration-500`} alt="About" />
                  </div>
               </div>
               <div className="w-full md:w-1/2 text-center md:text-left">
                  <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${p.primary}`}>{content.aboutTitle}</h2>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8">{content.aboutBody}</p>
               </div>
            </div>
         </div>
      </section>
    );
  }

  return (
    <section id="about" className={`py-24 px-6 md:px-12 ${p.surface} relative overflow-hidden`}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 md:gap-16 items-center">
        <div className="w-full md:w-1/2 order-2 md:order-1">
            <div className="space-y-8">
              <h2 className={`text-3xl md:text-5xl ${t.head} ${p.primary}`}>
                {content.aboutTitle}
              </h2>
              <div className={`prose prose-lg text-gray-600 ${t.body}`}>
                <p>{content.aboutBody}</p>
              </div>
              
              {((content.aboutExperienceLabel && content.aboutExperienceValue) || (content.aboutPatientsLabel && content.aboutPatientsValue)) && (
                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-200/50">
                  {content.aboutExperienceLabel && content.aboutExperienceValue && (
                    <div>
                      <span className={`block text-4xl font-bold mb-1 ${s.text}`}>
                        {content.aboutExperienceValue}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        {content.aboutExperienceLabel}
                      </span>
                    </div>
                  )}
                  {content.aboutPatientsLabel && content.aboutPatientsValue && (
                    <div>
                      <span className={`block text-4xl font-bold mb-1 ${s.text}`}>
                        {content.aboutPatientsValue}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        {content.aboutPatientsLabel}
                      </span>
                    </div>
                  )}
                </div>
              )}

            </div>
        </div>
        <div className="w-full md:w-1/2 order-1 md:order-2 relative h-64 md:h-auto">
            <div className={`absolute inset-0 border-2 ${p.border} transform translate-x-4 translate-y-4 ${r.box}`}></div>
            <img 
              src={photoSrc} 
              alt="Consultório" 
              className={`relative w-full h-full object-cover shadow-xl grayscale hover:grayscale-0 transition-all duration-700 ${r.box}`}
            />
        </div>
      </div>
    </section>
  );
};

export const TestimonialsSection: React.FC<SectionProps> = ({ content, design, layoutVariant = 1 }) => {
  const { p, s, t, r } = getDesignClasses(design);

  if (layoutVariant === 5) {
     return (
       <section id="testimonials" className="py-24 md:py-32 px-6 bg-stone-50 text-center">
          <div className="max-w-3xl mx-auto">
             <div className="text-6xl font-serif text-gray-300 mb-8">“</div>
             <p className="text-2xl md:text-4xl font-serif leading-tight mb-10 text-gray-800">
               {content.testimonials[0]?.text}
             </p>
             <cite className="not-italic font-sans text-sm font-bold uppercase tracking-widest text-gray-500">
               — {content.testimonials[0]?.name}
             </cite>
             <p className="text-[10px] text-gray-400 mt-2 uppercase">Relato de paciente - Resultados individuais podem variar</p>
          </div>
       </section>
     );
  }

  if (layoutVariant === 2) {
    return (
      <section id="testimonials" className={`py-20 px-6 ${p.softBg}`}>
         <div className="max-w-7xl mx-auto">
            <h2 className="text-center text-3xl font-bold mb-12">O que dizem nossos pacientes</h2>
            <div className="flex flex-col md:flex-row gap-6 overflow-x-auto pb-8 snap-x">
               {content.testimonials.map((testi, idx) => (
                 <div key={idx} className={`flex-1 min-w-[280px] snap-center bg-white p-8 rounded-2xl shadow-lg border border-gray-100`}>
                    <div className="flex items-center gap-1 text-yellow-400 mb-4">★★★★★</div>
                    <p className="text-gray-600 mb-6">"{testi.text}"</p>
                    <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-full ${p.accent} flex items-center justify-center text-white font-bold`}>
                         {testi.name[0]}
                       </div>
                       <div>
                          <p className="font-bold text-sm">{testi.name}</p>
                          <p className="text-xs text-gray-400">Paciente Verificado</p>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">* Relatos reais. Não garantimos os mesmos resultados para todos os pacientes.</p>
         </div>
      </section>
    );
  }

  return (
    <section id="testimonials" className="py-24 px-6 md:px-12 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className={`text-center text-3xl md:text-4xl mb-16 ${t.head} ${p.primary}`}>
          Histórias de Sucesso
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {content.testimonials.map((testi, idx) => (
            <div key={idx} className={`p-8 ${p.surface} ${r.box} relative group border ${p.border} hover:border-${design.secondaryColor}-200 transition-colors`}>
                <div className={`text-6xl absolute -top-4 -left-2 opacity-20 font-serif ${s.text}`}>“</div>
                <p className="text-lg text-gray-600 mb-8 relative z-10 italic leading-relaxed">
                  {testi.text}
                </p>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 flex items-center justify-center font-bold text-white shadow-md ${p.accent} ${r.btn}`}>
                    {testi.name.charAt(0)}
                  </div>
                  <div>
                    <div className={`font-bold ${p.primary}`}>{testi.name}</div>
                    <div className={`text-xs font-semibold uppercase tracking-wider ${s.text}`}>Paciente Verificado</div>
                  </div>
                </div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-8">
           * Imagens e depoimentos ilustrativos. Resultados variam conforme o caso clínico.
        </p>
      </div>
    </section>
  );
};

export const LocationSection: React.FC<SectionProps> = ({ content, design, briefing, layoutVariant = 1 }) => {
  const { p, s, r } = getDesignClasses(design);
  if (!briefing) return null;

  const addresses = content.contactAddresses && content.contactAddresses.length > 0 
    ? content.contactAddresses 
    : (content.contactAddress ? [content.contactAddress] : [briefing.addresses?.[0] || '']);

  const addressCount = addresses.length;

  // Layout 5: Editorial - Clean Minimal
  if (layoutVariant === 5) {
    return (
      <section id="location" className="py-16 px-6 bg-white border-t border-gray-100">
         <div className={`mx-auto ${addressCount === 1 ? 'max-w-4xl' : 'max-w-6xl'}`}>
            <h3 className="text-center text-xs font-bold uppercase tracking-widest mb-10 text-gray-400">Nossas Unidades</h3>
            <div className={`${addressCount === 1 ? 'w-full' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'}`}>
              {addresses.map((addr, idx) => (
                <div key={idx} className={`flex flex-col ${addressCount === 1 ? 'text-center' : ''}`}>
                  <p className="text-sm font-bold text-gray-900 mb-2">{addr}</p>
                  <MapEmbed address={addr} className="rounded-none border border-gray-200" heightClass={addressCount === 1 ? "h-64 md:h-96" : "h-64"} />
                </div>
              ))}
            </div>
         </div>
      </section>
    );
  }

  // Layout 4: Grid Studio - Brutalist
  if (layoutVariant === 4) {
    return (
      <section id="location" className="border-t-2 border-black">
        <div className={`grid ${addressCount === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {addresses.map((addr, idx) => (
            <div key={idx} className="border-b md:border-b-0 md:border-r border-black p-8 last:border-r-0">
               <h4 className="font-bold uppercase mb-4 text-sm">Unidade {idx + 1}</h4>
               <p className="font-mono text-sm mb-4 truncate">{addr}</p>
               <MapEmbed address={addr} className="border-2 border-black" heightClass={addressCount === 1 ? "h-64 md:h-96" : "h-64"} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Layout 2: Modern - Dark/Gradient
  if (layoutVariant === 2) {
    return (
      <section id="location" className={`py-16 px-6 ${p.surfaceDark} relative overflow-hidden`}>
         <div className={`mx-auto relative z-10 ${addressCount === 1 ? 'max-w-5xl' : 'max-w-7xl'}`}>
            <h3 className="text-center text-xl font-bold text-white mb-10">Onde nos encontrar</h3>
            <div className={`${addressCount === 1 ? 'w-full' : addressCount === 2 ? 'flex flex-col md:flex-row justify-center gap-8' : 'grid grid-cols-1 md:grid-cols-3 gap-8'}`}>
              {addresses.map((addr, idx) => (
                <div key={idx} className={`bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm ${addressCount === 2 ? 'w-full md:w-1/2 max-w-lg' : ''}`}>
                   <p className="text-gray-300 text-sm mb-3 flex items-center gap-2">
                     <span className="text-white">📍</span> {addr}
                   </p>
                   <MapEmbed address={addr} className="rounded-lg opacity-80 hover:opacity-100 transition-opacity" heightClass={addressCount === 1 ? "h-64 md:h-96" : "h-64"} />
                </div>
              ))}
            </div>
         </div>
      </section>
    );
  }

  // Default / Organic / Classic
  return (
    <section id="location" className={`py-16 px-6 ${p.softBg}`}>
      <div className={`mx-auto ${addressCount === 1 ? 'max-w-5xl' : 'max-w-7xl'}`}>
        <div className="text-center mb-10">
           <h3 className={`text-2xl font-bold ${p.primary}`}>Localização</h3>
           <div className={`w-16 h-1 mx-auto ${s.bg} rounded-full mt-2`}></div>
        </div>
        
        {addressCount === 1 ? (
          // Full width single address layout
          <div className={`bg-white p-6 shadow-sm border ${p.border} ${r.box}`}>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-4 justify-center">
              <div className={`mt-1 p-1.5 rounded-full ${s.light} text-${design.secondaryColor}-600`}>
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <p className="text-gray-700 font-medium text-lg text-center md:text-left">{addresses[0]}</p>
            </div>
            <MapEmbed address={addresses[0]} className={`${r.box}`} heightClass="h-64 md:h-96" />
          </div>
        ) : (
          // Grid or Flex for multiple
          <div className={`${addressCount === 2 ? 'flex flex-col md:flex-row justify-center gap-8' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'}`}>
             {addresses.map((addr, idx) => (
               <div key={idx} className={`bg-white p-4 shadow-sm border ${p.border} ${r.box} ${addressCount === 2 ? 'w-full md:w-1/2 max-w-lg' : ''}`}>
                  <div className="flex items-start gap-3 mb-4">
                     <div className={`mt-1 p-1.5 rounded-full ${s.light} text-${design.secondaryColor}-600`}>
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                     </div>
                     <p className="text-gray-700 font-medium">{addr}</p>
                  </div>
                  <MapEmbed address={addr} className={`${r.box}`} />
               </div>
             ))}
          </div>
        )}
      </div>
    </section>
  );
};

export const FooterSection: React.FC<SectionProps> = ({ content, design, briefing, layoutVariant = 1 }) => {
  const { p, s } = getDesignClasses(design);
  if (!briefing) return null;

  const addresses = content.contactAddresses && content.contactAddresses.length > 0 
    ? content.contactAddresses 
    : (content.contactAddress ? [content.contactAddress] : [briefing.addresses?.[0] || '']);

  const Credentials = () => (
    <div className="mt-4 pt-4 border-t border-gray-200/20 text-xs opacity-70 font-mono">
       <div className="font-bold">Responsável Técnico:</div>
       <div>{briefing.name}</div>
       <div>CRM/{briefing.crmState || 'UF'} {briefing.crm || '0000'}</div>
       {briefing.rqe && <div>RQE {briefing.rqe}</div>}
    </div>
  );

  if (layoutVariant === 5) {
     return (
        <footer id="contact" className="py-16 bg-white text-center border-t border-black px-6">
           <h2 className="font-serif text-2xl mb-4">{briefing.name}</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-8 text-sm">
             <div>
                <h4 className="font-bold uppercase tracking-widest text-xs mb-2 text-gray-400">Contato</h4>
                {content.contactPhone && (
                  <p>
                    <a href={`tel:${content.contactPhone.replace(/[^+\d]/g, '')}`} className="hover:underline">
                      {content.contactPhone}
                    </a>
                  </p>
                )}
                {content.contactEmail && (
                  <p>
                    <a href={`mailto:${content.contactEmail}`} className="hover:underline">
                      {content.contactEmail}
                    </a>
                  </p>
                )}
             </div>
             {addresses.map((addr, idx) => (
               <div key={idx}>
                 <p className="text-xs uppercase tracking-widest text-gray-400 mb-1 font-bold">Unidade {idx + 1}</p>
                 <p className="text-gray-800">{addr}</p>
               </div>
             ))}
           </div>

           <div className="text-xs text-gray-400 mb-8">
             CRM/{briefing.crmState} {briefing.crm} {briefing.rqe && `• RQE ${briefing.rqe}`}
           </div>
           <p className="text-sm text-gray-400">© 2024 {briefing.name}. Todos os direitos reservados.</p>
        </footer>
     )
   }

  if (layoutVariant === 4) {
    return (
      <footer id="contact" className="border-t-4 border-black bg-white text-black">
        <div className="grid grid-cols-1 md:grid-cols-2">
           <div className="p-12 border-b md:border-b-0 md:border-r border-black">
             <h3 className="text-3xl font-black uppercase mb-4">{briefing.name}</h3>
             <p className="font-mono text-sm mb-4">{briefing.specialty}</p>
             <div className="text-xs font-mono border-t border-black pt-2">
                CRM/{briefing.crmState} {briefing.crm} <br/> {briefing.rqe && <>RQE {briefing.rqe}</>}
             </div>
           </div>
           <div className="p-12">
             <h4 className="font-bold uppercase mb-4">Contato & Endereço</h4>
             <ul className="space-y-2 font-medium">
               {content.contactEmail && (
                 <li>
                   <a href={`mailto:${content.contactEmail}`} className="hover:underline">
                     {content.contactEmail}
                   </a>
                 </li>
               )}
               {content.contactPhone && (
                 <li>
                   <a href={`tel:${content.contactPhone.replace(/[^+\d]/g, '')}`} className="hover:underline">
                     {content.contactPhone}
                   </a>
                 </li>
               )}
             </ul>
             <div className="mt-6 space-y-2">
                {addresses.map((addr, idx) => (
                  <p key={idx} className="font-mono text-sm">{addr}</p>
                ))}
             </div>
           </div>
        </div>
        <div className="bg-black text-white p-4 text-center font-mono text-xs uppercase">
          Powered by DocPage AI
        </div>
      </footer>
    );
  }

  if (layoutVariant === 3) {
    return (
      <footer id="contact" className={`relative pt-24 pb-12 ${p.surface} text-gray-800`}>
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-none">
            <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block h-[60px] w-[calc(100%+1.3px)] fill-white">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
            </svg>
        </div>
        
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
           <div>
             <h3 className={`text-2xl font-bold mb-4 ${p.primary}`}>{briefing.name}</h3>
             <p className="text-gray-600 mb-6">Cuidando de você com atenção e carinho.</p>
             <div className="text-xs text-gray-500 font-medium">
                CRM/{briefing.crmState} {briefing.crm} <br/>
                {briefing.rqe && `RQE ${briefing.rqe}`}
             </div>
           </div>
           
            <div>
               <h4 className="font-bold mb-4 text-gray-900">Fale Conosco</h4>
               {content.contactPhone && (
                 <p className="text-gray-600 mb-2">
                   <a href={`tel:${content.contactPhone.replace(/[^+\d]/g, '')}`} className="hover:underline">
                     {content.contactPhone}
                   </a>
                 </p>
               )}
               {content.contactEmail && (
                 <p className="text-gray-600">
                   <a href={`mailto:${content.contactEmail}`} className="hover:underline">
                     {content.contactEmail}
                   </a>
                 </p>
               )}
            </div>

           <div>
              <h4 className="font-bold mb-4 text-gray-900">Endereços</h4>
              <div className="space-y-4">
                 {addresses.map((addr, idx) => (
                   <div key={idx}>
                     <p className="text-gray-600 text-sm mb-1">{addr}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>
        <div className="text-center mt-12 pt-8 border-t border-gray-200 text-sm text-gray-500">
           &copy; {new Date().getFullYear()} {briefing.name}
        </div>
      </footer>
    );
  }

  // DEFAULT & MODERN
  return (
    <footer id="contact" className={`${p.surfaceDark} text-white py-20 px-6`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-2">
          <h3 className="text-2xl font-bold mb-6 tracking-tight flex items-center gap-2">
              <div className={`w-3 h-3 ${s.bg} rounded-full`}></div>
              {briefing.name}
          </h3>
          <p className="text-gray-400 max-w-sm mb-8 leading-relaxed">
            Medicina integrada com foco no seu bem-estar.
          </p>
          <Credentials />
        </div>
        
        <div>
          <h4 className={`font-bold mb-6 ${s.text} uppercase text-xs tracking-widest`}>Contato</h4>
          <ul className="space-y-4 text-gray-400">
            <li className="flex items-center gap-3">
              <span className="text-white">✉</span>
              {content.contactEmail || briefing.contactEmail ? (
                <a
                  href={`mailto:${content.contactEmail || briefing.contactEmail}`}
                  className="hover:underline"
                >
                  {content.contactEmail || briefing.contactEmail}
                </a>
              ) : (
                <span>-</span>
              )}
            </li>
            <li className="flex items-center gap-3">
              <span className="text-white">☎</span>
              {content.contactPhone || briefing.contactPhone ? (
                <a
                  href={`tel:${(content.contactPhone || briefing.contactPhone || '').replace(/[^+\d]/g, '')}`}
                  className="hover:underline"
                >
                  {content.contactPhone || briefing.contactPhone}
                </a>
              ) : (
                <span>-</span>
              )}
            </li>
          </ul>
        </div>

        <div>
            <h4 className={`font-bold mb-6 ${s.text} uppercase text-xs tracking-widest`}>Localização</h4>
            <div className="space-y-6">
               {addresses.map((addr, idx) => (
                 <div key={idx}>
                   <p className="text-gray-400 leading-relaxed text-sm mb-2">{addr}</p>
                 </div>
               ))}
            </div>
        </div>
      </div>
      <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
        <span>Powered by DocPage AI</span>
      </div>
    </footer>
  );
};