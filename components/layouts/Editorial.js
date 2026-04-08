import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { getDesignClasses } from '../../utils/designSystem';
import { Navbar, ServicesSection, AboutSection, TestimonialsSection, FooterSection, LocationSection, WhatsAppButton } from '../sections/CommonSections';
import { PhotoFrame } from '../PhotoFrame';
import { trackClick } from '../../services/analytics';
export const Editorial = ({ content, design, visibility, photoUrl, aboutPhotoUrl, briefing, layoutVariant, landingPageId, isEditorMode, hasCustomTestimonials }) => {
    const { p, s, t, r } = getDesignClasses(design);
    const handlePrimaryCtaClick = () => {
        if (landingPageId) {
            try {
                trackClick(landingPageId, 'CTA Hero Principal', 'hero');
            }
            catch (error) {
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
    return (_jsxs("div", { className: `w-full h-full overflow-y-auto preview-scroll bg-white ${t.body} relative`, children: [_jsx(Navbar, { content: content, design: design, briefing: briefing, visibility: visibility, layoutVariant: layoutVariant, landingPageId: landingPageId }), _jsx("header", { className: `py-24 px-6 md:px-12 ${p.softBg}`, children: _jsxs("div", { className: "max-w-6xl mx-auto border-b border-gray-200 pb-16", children: [_jsxs("div", { className: "flex flex-col md:flex-row gap-12 items-end", children: [_jsxs("div", { className: "md:w-2/3", children: [_jsxs("p", { className: `text-sm font-bold uppercase tracking-widest mb-4 ${s.text}`, children: [briefing.specialty, " \u2022 ", briefing.addresses?.[0] || ''] }), _jsx("h1", { className: `${t.hero} ${p.primary} leading-none mb-8`, children: content.headline }), _jsxs("div", { className: "flex gap-4", children: [_jsx("button", { className: `px-8 py-4 text-white font-bold ${p.accent} ${r.btn}`, onClick: handlePrimaryCtaClick, children: content.ctaText }), _jsx("button", { className: `px-8 py-4 border ${p.border} font-medium hover:bg-gray-50 ${r.btn}`, onClick: handleSecondaryCtaClick, children: "Ver Especialidades" })] })] }), _jsx("div", { className: "md:w-1/3 text-right", children: _jsx("p", { className: "text-lg text-gray-500 font-light leading-relaxed", children: content.subheadline }) })] }), _jsx("div", { className: "mt-16 w-full h-[500px]", children: _jsx(PhotoFrame, { photoUrl: photoUrl, design: design, alt: briefing.name, className: "object-center" }) })] }) }), visibility.services && _jsx(ServicesSection, { content: content, design: design, layoutVariant: layoutVariant }), visibility.about && _jsx(AboutSection, { content: content, design: design, layoutVariant: layoutVariant, aboutPhotoUrl: aboutPhotoUrl }), visibility.testimonials && _jsx(TestimonialsSection, { content: content, design: design, layoutVariant: layoutVariant, isEditorMode: isEditorMode, hasCustomTestimonials: hasCustomTestimonials, visibility: visibility }), _jsx(LocationSection, { content: content, design: design, briefing: briefing, layoutVariant: layoutVariant }), visibility.footer && _jsx(FooterSection, { content: content, design: design, briefing: briefing, layoutVariant: layoutVariant }), _jsx(WhatsAppButton, { phone: content.contactPhone || briefing.contactPhone, landingPageId: landingPageId })] }));
};
