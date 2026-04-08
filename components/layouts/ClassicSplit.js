import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { getDesignClasses } from '../../utils/designSystem';
import { Navbar, ServicesSection, AboutSection, TestimonialsSection, FooterSection, LocationSection, WhatsAppButton } from '../sections/CommonSections';
import { PhotoFrame } from '../PhotoFrame';
import { trackClick } from '../../services/analytics';
export const ClassicSplit = ({ content, design, visibility, photoUrl, aboutPhotoUrl, briefing, layoutVariant, landingPageId, isEditorMode, hasCustomTestimonials }) => {
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
    return (_jsxs("div", { className: `w-full h-full overflow-y-auto preview-scroll bg-white ${t.body} relative`, children: [_jsx(Navbar, { content: content, design: design, briefing: briefing, visibility: visibility, layoutVariant: layoutVariant, landingPageId: landingPageId }), _jsx("header", { className: `relative pt-12 pb-24 md:pt-24 md:pb-32 px-6 md:px-12 bg-gradient-to-b ${p.gradient} overflow-hidden`, children: _jsxs("div", { className: "max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center relative z-10", children: [_jsxs("div", { className: "md:col-span-6 lg:col-span-7 space-y-8 text-center md:text-left order-2 md:order-1", children: [_jsxs("div", { className: `inline-flex items-center px-3 py-1 rounded-full border ${p.border} bg-white/50 backdrop-blur`, children: [_jsx("span", { className: `w-2 h-2 rounded-full mr-2 ${s.bg}` }), _jsx("span", { className: `text-xs font-bold uppercase tracking-wider ${p.primary}`, children: briefing.specialty })] }), _jsx("h1", { className: `${t.hero} ${p.primary} leading-[1.1]`, children: content.headline }), _jsx("p", { className: "text-xl md:text-2xl font-light text-gray-500 max-w-2xl mx-auto md:mx-0 leading-relaxed", children: content.subheadline }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4", children: [_jsx("button", { className: `px-8 py-4 text-lg font-semibold text-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 ${p.accent} ${p.accentHover} ${r.btn}`, onClick: handlePrimaryCtaClick, children: content.ctaText }), _jsx("button", { className: `px-8 py-4 text-lg font-medium border bg-white hover:bg-gray-50 transition-colors ${p.border} ${p.primary} ${r.btn}`, onClick: handleSecondaryCtaClick, children: "Saiba Mais" })] })] }), _jsx("div", { className: "md:col-span-6 lg:col-span-5 relative order-1 md:order-2 flex justify-center md:justify-end", children: _jsx("div", { className: "relative w-full max-w-md aspect-[4/5]", children: _jsx(PhotoFrame, { photoUrl: photoUrl, design: design, alt: briefing.name }) }) })] }) }), visibility.services && _jsx(ServicesSection, { content: content, design: design, layoutVariant: layoutVariant }), visibility.about && _jsx(AboutSection, { content: content, design: design, layoutVariant: layoutVariant, aboutPhotoUrl: aboutPhotoUrl }), visibility.testimonials && _jsx(TestimonialsSection, { content: content, design: design, layoutVariant: layoutVariant, isEditorMode: isEditorMode, hasCustomTestimonials: hasCustomTestimonials, visibility: visibility }), _jsx(LocationSection, { content: content, design: design, briefing: briefing, layoutVariant: layoutVariant }), visibility.footer && _jsx(FooterSection, { content: content, design: design, briefing: briefing, layoutVariant: layoutVariant }), _jsx(WhatsAppButton, { phone: content.contactPhone || briefing.contactPhone, landingPageId: landingPageId })] }));
};
