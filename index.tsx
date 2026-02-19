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
import { useSearchParams } from 'react-router-dom';

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

// Componente wrapper para rota raiz - detecta subdomínio ou domínio customizado e renderiza componente apropriado
const RootRoute: React.FC = () => {
  const subdomain = extractSubdomainFromHost();
  
  // Se houver subdomínio docpage (ex: drastellamardegan.docpage.com.br), renderizar LandingPageViewer
  if (subdomain) {
    return <LandingPageViewer />;
  }
  
  // Se houver dados da landing page injetados pelo SSR (domínio customizado, ex: www.drastellamardegan.com.br)
  // O API retorna HTML com window.__LANDING_PAGE_DATA__ quando detecta domínio customizado
  if (typeof window !== 'undefined' && (window as any).__LANDING_PAGE_DATA__) {
    return <LandingPageViewer />;
  }
  
  // Caso contrário, renderizar App (home DocPage)
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

// Componente wrapper para rota /checkout - renderiza App e detecta parâmetros da URL
const CheckoutRoute: React.FC = () => {
  // Não redirecionar automaticamente - deixar o App.tsx gerenciar o fluxo
  return <App />;
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
          <Route path="/checkout" element={<CheckoutRoute />} />
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
