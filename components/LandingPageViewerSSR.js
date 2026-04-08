import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Preview } from './Preview';
import { SEOHead } from './SEOHead';
// Componente SSR-friendly que recebe dados diretamente (sem hooks de fetch)
export const LandingPageViewerSSR = ({ landingPage, requestHost }) => {
    return (_jsxs("div", { className: "min-h-screen", children: [_jsx(SEOHead, { briefing: landingPage.briefing_data, content: landingPage.content_data, subdomain: landingPage.subdomain, photoUrl: landingPage.photo_url, aboutPhotoUrl: landingPage.about_photo_url, ogImageUrl: landingPage.og_image_url, metaTitle: landingPage.meta_title, metaDescription: landingPage.meta_description, metaKeywords: landingPage.meta_keywords, customDomain: landingPage.custom_domain, chosenDomain: landingPage.chosen_domain, requestHost: requestHost, noIndex: !!(landingPage.chosen_domain || landingPage.custom_domain) && typeof window !== 'undefined' && window.location.hostname.endsWith('.docpage.com.br') }), _jsx(Preview, { content: landingPage.content_data, design: landingPage.design_settings, visibility: landingPage.section_visibility, photoUrl: landingPage.photo_url, aboutPhotoUrl: landingPage.about_photo_url, briefing: landingPage.briefing_data, layoutVariant: landingPage.layout_variant, landingPageId: landingPage.id, isPreview: false })] }));
};
