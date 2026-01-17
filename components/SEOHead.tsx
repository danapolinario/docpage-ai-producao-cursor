import React, { useEffect } from 'react';
import { BriefingData, LandingPageContent } from '../types';

interface SEOHeadProps {
  briefing: BriefingData;
  content: LandingPageContent;
  subdomain: string;
  photoUrl?: string | null;
  ogImageUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string[] | null;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  briefing,
  content,
  subdomain,
  photoUrl,
  ogImageUrl,
  metaTitle,
  metaDescription,
  metaKeywords,
}) => {
  useEffect(() => {
    const baseUrl = window.location.origin;
    const pageUrl = `${baseUrl}/${subdomain}`;
    
    // Generate SEO-optimized title
    const title = metaTitle || 
      `${briefing.name} - ${briefing.specialty} | ${briefing.crmState} | Agende sua Consulta`;
    
    // Generate SEO-optimized description (max 160 chars)
    const rawDescription = metaDescription || content.subheadline || 
      `Dr(a). ${briefing.name}, especialista em ${briefing.specialty}. ${briefing.crm}/${briefing.crmState}. Agende sua consulta online com facilidade.`;
    const description = rawDescription.length > 160 
      ? rawDescription.substring(0, 157) + '...' 
      : rawDescription;
    
    // Keywords
    const keywords = metaKeywords?.join(', ') || 
      `${briefing.name}, ${briefing.specialty}, médico, consulta médica, ${briefing.crmState}, agendar consulta, ${briefing.mainServices}`;
    
    // OG Image - use provided URL or generate from Supabase storage
    const ogImage = ogImageUrl || photoUrl || `${baseUrl}/og-default.png`;
    
    // Update document title
    document.title = title;
    
    // Helper function to update or create meta tag
    const updateMetaTag = (selector: string, attribute: string, value: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        if (selector.includes('property=')) {
          element.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
        } else if (selector.includes('name=')) {
          element.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, value);
    };
    
    // Helper function to update or create link tag
    const updateLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!element) {
        element = document.createElement('link');
        element.rel = rel;
        document.head.appendChild(element);
      }
      element.href = href;
    };
    
    // Basic SEO meta tags
    updateMetaTag('meta[name="description"]', 'content', description);
    updateMetaTag('meta[name="keywords"]', 'content', keywords);
    updateMetaTag('meta[name="author"]', 'content', briefing.name);
    updateMetaTag('meta[name="robots"]', 'content', 'index, follow');
    
    // Open Graph tags for social sharing (Facebook, WhatsApp, LinkedIn)
    updateMetaTag('meta[property="og:title"]', 'content', title);
    updateMetaTag('meta[property="og:description"]', 'content', description);
    updateMetaTag('meta[property="og:image"]', 'content', ogImage);
    updateMetaTag('meta[property="og:image:width"]', 'content', '1200');
    updateMetaTag('meta[property="og:image:height"]', 'content', '630');
    updateMetaTag('meta[property="og:image:alt"]', 'content', `${briefing.name} - ${briefing.specialty}`);
    updateMetaTag('meta[property="og:url"]', 'content', pageUrl);
    updateMetaTag('meta[property="og:type"]', 'content', 'website');
    updateMetaTag('meta[property="og:site_name"]', 'content', 'DocPage AI');
    updateMetaTag('meta[property="og:locale"]', 'content', 'pt_BR');
    
    // Twitter Card tags
    updateMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
    updateMetaTag('meta[name="twitter:title"]', 'content', title);
    updateMetaTag('meta[name="twitter:description"]', 'content', description);
    updateMetaTag('meta[name="twitter:image"]', 'content', ogImage);
    updateMetaTag('meta[name="twitter:image:alt"]', 'content', `${briefing.name} - ${briefing.specialty}`);
    
    // Canonical URL
    updateLinkTag('canonical', pageUrl);
    
    // Schema.org JSON-LD for Physician/Medical Business
    const schemaMarkup = {
      "@context": "https://schema.org",
      "@type": "Physician",
      "name": briefing.name,
      "description": description,
      "image": ogImage,
      "url": pageUrl,
      "medicalSpecialty": {
        "@type": "MedicalSpecialty",
        "name": briefing.specialty
      },
      "telephone": briefing.contactPhone || content.contactPhone,
      "email": briefing.contactEmail || content.contactEmail,
      "address": briefing.addresses?.length > 0 ? {
        "@type": "PostalAddress",
        "streetAddress": briefing.addresses[0]
      } : undefined,
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
      "sameAs": [],
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
    const cleanSchema = JSON.parse(JSON.stringify(schemaMarkup));
    
    // Update or create JSON-LD script
    let schemaScript = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement | null;
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.type = 'application/ld+json';
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = JSON.stringify(cleanSchema, null, 2);
    
    // Additional meta tags for better SEO
    updateMetaTag('meta[name="geo.region"]', 'content', `BR-${briefing.crmState}`);
    updateMetaTag('meta[name="geo.placename"]', 'content', briefing.crmState);
    
    // Mobile optimization
    updateMetaTag('meta[name="theme-color"]', 'content', '#3B82F6');
    updateMetaTag('meta[name="mobile-web-app-capable"]', 'content', 'yes');
    updateMetaTag('meta[name="apple-mobile-web-app-capable"]', 'content', 'yes');
    updateMetaTag('meta[name="apple-mobile-web-app-status-bar-style"]', 'content', 'default');
    updateMetaTag('meta[name="apple-mobile-web-app-title"]', 'content', briefing.name);
    
    // Cleanup on unmount - reset to default
    return () => {
      document.title = 'DocPage AI - Landing Pages para Médicos';
    };
  }, [briefing, content, subdomain, photoUrl, ogImageUrl, metaTitle, metaDescription, metaKeywords]);
  
  // This component doesn't render anything visible
  return null;
};
