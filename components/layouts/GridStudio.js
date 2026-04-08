import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { getDesignClasses } from '../../utils/designSystem';
import { Navbar, ServicesSection, AboutSection, TestimonialsSection, FooterSection, LocationSection, WhatsAppButton } from '../sections/CommonSections';
import { PhotoFrame } from '../PhotoFrame';
import { trackClick } from '../../services/analytics';
export const GridStudio = ({ content, design, visibility, photoUrl, aboutPhotoUrl, briefing, layoutVariant, landingPageId, isEditorMode, hasCustomTestimonials }) => {
    const { p, s, t, r } = getDesignClasses(design);
    const handlePrimaryCtaClick = () => {
        if (landingPageId) {
            try {
                trackClick(landingPageId, 'CTA Hero Principal', 'hero');
            }
            catch (error) {
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
    return (_jsxs("div", { className: `w-full h-full overflow-y-auto preview-scroll bg-white ${t.body} relative`, children: [_jsx(Navbar, { content: content, design: design, briefing: briefing, visibility: visibility, layoutVariant: layoutVariant, landingPageId: landingPageId }), _jsx("header", { className: `py-12 md:py-20 px-6 md:px-12 bg-white`, children: _jsxs("div", { className: "max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center", children: [_jsxs("div", { className: `md:col-span-7 ${p.surface} ${r.box} p-8 md:p-12 flex flex-col justify-center relative overflow-hidden border ${p.border}`, children: [_jsx("div", { className: `absolute top-0 right-0 w-64 h-64 ${s.bg} opacity-5 rounded-full blur-3xl -mr-16 -mt-16` }), _jsx("h1", { className: `${t.hero} ${p.primary} mb-6 relative z-10`, children: content.headline }), _jsx("p", { className: "text-xl text-gray-600 mb-8 max-w-lg relative z-10", children: content.subheadline }), _jsx("div", { className: "flex gap-4 relative z-10", children: _jsx("button", { className: `px-8 py-3 font-bold text-white ${p.accent} ${p.accentHover} ${r.btn}`, onClick: handlePrimaryCtaClick, children: content.ctaText }) })] }), _jsx("div", { className: "md:col-span-5 relative flex justify-center md:justify-end", children: _jsx("div", { className: "relative w-full max-w-sm aspect-[3/4]", children: _jsx(PhotoFrame, { photoUrl: photoUrl, design: design, alt: briefing.name }) }) })] }) }), visibility.services && _jsx(ServicesSection, { content: content, design: design, layoutVariant: layoutVariant }), visibility.about && _jsx(AboutSection, { content: content, design: design, layoutVariant: layoutVariant, aboutPhotoUrl: aboutPhotoUrl }), visibility.testimonials && _jsx(TestimonialsSection, { content: content, design: design, layoutVariant: layoutVariant, isEditorMode: isEditorMode, hasCustomTestimonials: hasCustomTestimonials, visibility: visibility }), _jsx(LocationSection, { content: content, design: design, briefing: briefing, layoutVariant: layoutVariant }), visibility.footer && _jsx(FooterSection, { content: content, design: design, briefing: briefing, layoutVariant: layoutVariant }), _jsx(WhatsAppButton, { phone: content.contactPhone || briefing.contactPhone, landingPageId: landingPageId })] }));
};
