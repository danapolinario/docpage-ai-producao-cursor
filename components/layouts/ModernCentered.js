import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { getDesignClasses } from '../../utils/designSystem';
import { Navbar, ServicesSection, AboutSection, TestimonialsSection, FooterSection, LocationSection, WhatsAppButton } from '../sections/CommonSections';
import { PhotoFrame } from '../PhotoFrame';
import { trackClick } from '../../services/analytics';
export const ModernCentered = ({ content, design, visibility, photoUrl, aboutPhotoUrl, briefing, layoutVariant, landingPageId, isEditorMode, hasCustomTestimonials }) => {
    const { p, s, t, r } = getDesignClasses(design);
    const handleCtaClick = () => {
        if (landingPageId) {
            try {
                trackClick(landingPageId, 'CTA Hero Principal', 'hero');
            }
            catch (error) {
                console.error('Erro ao registrar clique no CTA principal:', error);
            }
        }
        const contactSection = document.getElementById('contact') || document.getElementById('location');
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
        }
    };
    return (_jsxs("div", { className: `w-full h-full overflow-y-auto preview-scroll bg-white ${t.body} relative`, children: [_jsx(Navbar, { content: content, design: design, briefing: briefing, visibility: visibility, layoutVariant: layoutVariant, landingPageId: landingPageId }), _jsx("header", { className: `relative pt-20 pb-0 px-6 md:px-12 bg-gradient-to-br ${p.gradient} text-center overflow-hidden`, children: _jsxs("div", { className: "max-w-4xl mx-auto relative z-10 flex flex-col items-center", children: [_jsxs("div", { className: `inline-flex items-center px-4 py-1.5 rounded-full border ${p.border} bg-white/60 backdrop-blur mb-8 shadow-sm`, children: [_jsx("span", { className: `w-2 h-2 rounded-full mr-2 ${s.bg}` }), _jsx("span", { className: `text-xs font-bold uppercase tracking-wider ${p.primary}`, children: briefing.specialty })] }), _jsx("h1", { className: `${t.hero} ${p.primary} mb-8 leading-tight`, children: content.headline }), _jsx("p", { className: "text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed", children: content.subheadline }), _jsx("div", { className: "flex flex-col sm:flex-row gap-4 justify-center mb-16", children: _jsx("button", { onClick: handleCtaClick, className: `px-10 py-4 text-lg font-bold text-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 ${p.accent} ${p.accentHover} ${r.btn}`, children: content.ctaText }) }), _jsx("div", { className: "relative w-full max-w-xl mx-auto mt-auto h-[400px] md:h-[500px]", children: _jsx(PhotoFrame, { photoUrl: photoUrl, design: design, alt: briefing.name, className: "object-top" }) })] }) }), visibility.services && _jsx(ServicesSection, { content: content, design: design, layoutVariant: layoutVariant }), visibility.about && _jsx(AboutSection, { content: content, design: design, layoutVariant: layoutVariant, aboutPhotoUrl: aboutPhotoUrl }), visibility.testimonials && _jsx(TestimonialsSection, { content: content, design: design, layoutVariant: layoutVariant, isEditorMode: isEditorMode, hasCustomTestimonials: hasCustomTestimonials, visibility: visibility }), _jsx(LocationSection, { content: content, design: design, briefing: briefing, layoutVariant: layoutVariant }), visibility.footer && _jsx(FooterSection, { content: content, design: design, briefing: briefing, layoutVariant: layoutVariant }), _jsx(WhatsAppButton, { phone: content.contactPhone || briefing.contactPhone, landingPageId: landingPageId })] }));
};
