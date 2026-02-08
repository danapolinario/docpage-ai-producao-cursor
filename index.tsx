import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { initGoogleAnalytics } from './services/google-analytics';
import App from './App';
import { AdminPage } from './components/AdminPage';
import { LandingPageViewer } from './components/LandingPageViewer';
import { DashboardPage } from './components/DashboardPage';
import { StripeSuccess } from './components/StripeSuccess';
import { TermsOfService } from './components/TermsOfService';
import { PrivacyPolicy } from './components/PrivacyPolicy';

// Função para extrair subdomínio do hostname
function extractSubdomainFromHost(): string | null {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.endsWith('.docpage.com.br')) {
    const parts = hostname.split('.');
    if (parts.length >= 4) {
      const subdomain = parts[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'docpage') {
        return subdomain;
      }
    }
  }
  return null;
}

// Componente wrapper para rota raiz - detecta subdomínio e renderiza componente apropriado
const RootRoute: React.FC = () => {
  const subdomain = extractSubdomainFromHost();
  
  // Se houver subdomínio, renderizar LandingPageViewer
  if (subdomain) {
    return <LandingPageViewer />;
  }
  
  // Caso contrário, renderizar App (home)
  return <App />;
};

// Componente wrapper para rota /dev - renderiza App com modo dev habilitado
const DevRoute: React.FC = () => {
  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <App isDevMode={true} />
    </>
  );
};

// Inicializar Google Analytics
initGoogleAnalytics();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/checkout/success" element={<StripeSuccess />} />
          <Route path="/termos-de-uso" element={<TermsOfService />} />
          <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
          <Route path="/dev" element={<DevRoute />} />
          <Route path="/:subdomain" element={<LandingPageViewer />} />
          <Route path="/" element={<RootRoute />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
