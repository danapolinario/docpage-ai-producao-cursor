import React, { useState, useEffect } from 'react';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { checkIsAdmin } from '../services/admin';
import { getCurrentUser, onAuthStateChange } from '../services/auth';

export const AdminPage: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setIsLoggedIn(true);
          const adminStatus = await checkIsAdmin();
          setIsAdmin(adminStatus);
        } else {
          setIsLoggedIn(false);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsLoggedIn(false);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (user) => {
      if (user) {
        setIsLoggedIn(true);
        const adminStatus = await checkIsAdmin();
        setIsAdmin(adminStatus);
      } else {
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLoginSuccess = async () => {
    setIsLoggedIn(true);
    const adminStatus = await checkIsAdmin();
    setIsAdmin(adminStatus);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
  };

  const handleBack = () => {
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return <AdminLogin onSuccess={handleLoginSuccess} onBack={handleBack} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
};
