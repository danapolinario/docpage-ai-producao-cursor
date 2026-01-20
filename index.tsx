import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { initGoogleAnalytics } from './services/google-analytics';
import App from './App';
import { AdminPage } from './components/AdminPage';
import { LandingPageViewer } from './components/LandingPageViewer';
import { DashboardPage } from './components/DashboardPage';

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
          <Route path="/:subdomain" element={<LandingPageViewer />} />
          <Route path="/" element={<App />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
