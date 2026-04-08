import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { resolveCanonicalHostname } from '../lib/seo-canonical';
export const SEOHead = ({ briefing, content, subdomain, photoUrl, aboutPhotoUrl, ogImageUrl, metaTitle, metaDescription, metaKeywords, customDomain, chosenDomain, requestHost, noIndex, }) => {
    const hostForCanon = requestHost ??
        (typeof window !== 'undefined' ? window.location.hostname : undefined);
    const canonicalDomain = resolveCanonicalHostname({
        chosen_domain: chosenDomain,
        custom_domain: customDomain,
        subdomain,
    }, hostForCanon ?? null);
    const pageUrl = `https://${canonicalDomain}`;
    // Base URL para recursos estáticos
    const baseUrl = canonicalDomain
        ? `https://${canonicalDomain}`
        : 'https://docpage.com.br';
    // Generate SEO-optimized title (50-60 chars ideal)
    const title = metaTitle ||
        `${briefing.name} - ${briefing.specialty} | CRM ${briefing.crm}/${briefing.crmState}`;
    // Generate SEO-optimized description (150-160 chars ideal)
    const rawDescription = metaDescription || content.subheadline ||
        `Dr(a). ${briefing.name}, ${briefing.specialty} - CRM ${briefing.crm}/${briefing.crmState}. ${briefing.crmState}. Agende sua consulta online.`;
    const description = rawDescription.length > 160
        ? rawDescription.substring(0, 157) + '...'
        : rawDescription;
    // Keywords (comma-separated, max 10-15 keywords)
    const keywords = metaKeywords?.join(', ') ||
        `${briefing.name}, ${briefing.specialty}, médico ${briefing.crmState}, CRM ${briefing.crm}, consulta médica, agendar consulta, ${briefing.mainServices?.split(',').slice(0, 3).join(', ') || ''}`;
    // OG Image - prioritize ogImageUrl, then aboutPhotoUrl (office), then photoUrl (profile)
    const ogImage = ogImageUrl || aboutPhotoUrl || photoUrl || `${baseUrl}/og-default.png`;
    const ogImageSecure = ogImage.replace('http://', 'https://');
    // Generate SEO-optimized site name for og:site_name
    // Uses doctor name and specialty for better SEO and branding
    const siteName = `Dr(a). ${briefing.name} - ${briefing.specialty} | CRM ${briefing.crm}/${briefing.crmState}`;
    // Schema.org JSON-LD
    const schemaMarkup = {
        "@context": "https://schema.org",
        "@type": "Physician",
        "@id": pageUrl,
        "name": briefing.name,
        "alternateName": `Dr(a). ${briefing.name}`,
        "description": description,
        "image": [
            ogImage,
            ...(photoUrl ? [photoUrl] : []),
            ...(aboutPhotoUrl ? [aboutPhotoUrl] : [])
        ].filter(Boolean),
        "url": pageUrl,
        "sameAs": [],
        "medicalSpecialty": {
            "@type": "MedicalSpecialty",
            "name": briefing.specialty
        },
        "telephone": briefing.contactPhone || content.contactPhone,
        "email": briefing.contactEmail || content.contactEmail,
        "address": briefing.addresses?.length > 0 ? briefing.addresses.map((addr) => ({
            "@type": "PostalAddress",
            "streetAddress": addr,
            "addressLocality": briefing.crmState,
            "addressCountry": "BR"
        })) : undefined,
        "identifier": {
            "@type": "PropertyValue",
            "name": "CRM",
            "value": `${briefing.crm}/${briefing.crmState}`
        },
        "priceRange": "$$",
        "areaServed": {
            "@type": "State",
            "name": briefing.crmState
        },
        "potentialAction": {
            "@type": "ReserveAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": pageUrl,
                "actionPlatform": [
                    "http://schema.org/DesktopWebPlatform",
                    "http://schema.org/MobileWebPlatform"
                ]
            },
            "result": {
                "@type": "Reservation",
                "name": "Consulta Médica"
            }
        }
    };
    // Remove undefined fields
    const cleanSchema = JSON.parse(JSON.stringify(schemaMarkup, (key, value) => value === undefined ? undefined : value));
    // Atualizar metatags diretamente no DOM como fallback (para garantir que funcionem no localhost)
    React.useEffect(() => {
        // Função helper para atualizar ou criar meta tag por property
        const updateOrCreateOGMeta = (property, content) => {
            const existing = document.querySelector(`meta[property="${property}"]`);
            if (existing) {
                existing.setAttribute('content', content);
            }
            else {
                const meta = document.createElement('meta');
                meta.setAttribute('property', property);
                meta.setAttribute('content', content);
                document.head.appendChild(meta);
            }
        };
        // Função helper para atualizar ou criar meta tag por name
        const updateOrCreateNameMeta = (name, content) => {
            const existing = document.querySelector(`meta[name="${name}"]`);
            if (existing) {
                existing.setAttribute('content', content);
            }
            else {
                const meta = document.createElement('meta');
                meta.setAttribute('name', name);
                meta.setAttribute('content', content);
                document.head.appendChild(meta);
            }
        };
        // Atualizar title
        const titleTag = document.querySelector('title');
        if (titleTag) {
            titleTag.textContent = title;
        }
        // Atualizar todas as tags Open Graph
        updateOrCreateOGMeta('og:title', title);
        updateOrCreateOGMeta('og:description', description);
        updateOrCreateOGMeta('og:image', ogImage);
        updateOrCreateOGMeta('og:image:secure_url', ogImageSecure);
        updateOrCreateOGMeta('og:image:alt', `${briefing.name} - ${briefing.specialty} | CRM ${briefing.crm}/${briefing.crmState}`);
        updateOrCreateOGMeta('og:url', pageUrl);
        updateOrCreateOGMeta('og:site_name', siteName);
        // Atualizar tags Twitter
        updateOrCreateNameMeta('twitter:title', title);
        updateOrCreateNameMeta('twitter:description', description);
        updateOrCreateNameMeta('twitter:image', ogImage);
        updateOrCreateNameMeta('twitter:image:alt', `${briefing.name} - ${briefing.specialty}`);
        // Atualizar tags SEO básicas
        updateOrCreateNameMeta('description', description);
        updateOrCreateNameMeta('keywords', keywords);
        updateOrCreateNameMeta('author', briefing.name);
        // Remover tags Twitter do DocPage se existirem
        const twitterSite = document.querySelector('meta[name="twitter:site"]');
        const twitterCreator = document.querySelector('meta[name="twitter:creator"]');
        if (twitterSite && twitterSite.getAttribute('content') === '@DocPageAI') {
            twitterSite.remove();
        }
        if (twitterCreator && twitterCreator.getAttribute('content') === '@DocPageAI') {
            twitterCreator.remove();
        }
    }, [title, description, keywords, ogImage, ogImageSecure, siteName, pageUrl, briefing.name, briefing.specialty, briefing.crm, briefing.crmState]);
    return (_jsxs(Helmet, { children: [_jsx("title", { children: title }), _jsx("meta", { name: "description", content: description }), _jsx("meta", { name: "keywords", content: keywords }), _jsx("meta", { name: "author", content: briefing.name }), _jsx("meta", { name: "robots", content: noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" }), _jsx("meta", { name: "language", content: "pt-BR" }), _jsx("meta", { name: "revisit-after", content: "7 days" }), _jsx("meta", { name: "rating", content: "general" }), _jsx("meta", { name: "distribution", content: "global" }), _jsx("meta", { name: "copyright", content: `© ${new Date().getFullYear()} ${briefing.name}` }), _jsx("meta", { name: "geo.region", content: `BR-${briefing.crmState}` }), _jsx("meta", { name: "geo.placename", content: briefing.crmState }), _jsx("meta", { httpEquiv: "X-UA-Compatible", content: "IE=edge" }), _jsx("meta", { name: "format-detection", content: "telephone=yes" }), _jsx("meta", { property: "og:title", content: title }), _jsx("meta", { property: "og:description", content: description }), _jsx("meta", { property: "og:image", content: ogImage }), _jsx("meta", { property: "og:image:secure_url", content: ogImageSecure }), _jsx("meta", { property: "og:image:type", content: "image/jpeg" }), _jsx("meta", { property: "og:image:width", content: "1200" }), _jsx("meta", { property: "og:image:height", content: "630" }), _jsx("meta", { property: "og:image:alt", content: `${briefing.name} - ${briefing.specialty} | CRM ${briefing.crm}/${briefing.crmState}` }), _jsx("meta", { property: "og:url", content: pageUrl }), _jsx("meta", { property: "og:type", content: "website" }), _jsx("meta", { property: "og:site_name", content: siteName }), _jsx("meta", { property: "og:locale", content: "pt_BR" }), _jsx("meta", { property: "og:locale:alternate", content: "pt_PT" }), briefing.contactPhone && (_jsx("meta", { property: "og:phone_number", content: briefing.contactPhone })), briefing.contactEmail && (_jsx("meta", { property: "og:email", content: briefing.contactEmail })), _jsx("meta", { name: "twitter:card", content: "summary_large_image" }), _jsx("meta", { name: "twitter:title", content: title }), _jsx("meta", { name: "twitter:description", content: description }), _jsx("meta", { name: "twitter:image", content: ogImage }), _jsx("meta", { name: "twitter:image:alt", content: `${briefing.name} - ${briefing.specialty}` }), _jsx("meta", { name: "twitter:domain", content: canonicalDomain || `${subdomain}.docpage.com.br` }), _jsx("meta", { name: "theme-color", content: "#3B82F6" }), _jsx("meta", { name: "msapplication-TileColor", content: "#3B82F6" }), _jsx("meta", { name: "msapplication-config", content: "/browserconfig.xml" }), _jsx("meta", { name: "mobile-web-app-capable", content: "yes" }), _jsx("meta", { name: "apple-mobile-web-app-capable", content: "yes" }), _jsx("meta", { name: "apple-mobile-web-app-status-bar-style", content: "default" }), _jsx("meta", { name: "apple-mobile-web-app-title", content: briefing.name }), photoUrl && (_jsx("link", { rel: "apple-touch-icon", href: photoUrl, sizes: "180x180" })), _jsx("link", { rel: "icon", href: photoUrl || `${baseUrl}/favicon.ico`, type: "image/x-icon" }), _jsx("link", { rel: "canonical", href: pageUrl }), _jsx("script", { type: "application/ld+json", children: JSON.stringify(cleanSchema, null, 2) })] }));
};
