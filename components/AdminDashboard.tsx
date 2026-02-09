import React, { useState, useEffect } from 'react';
import { 
  getAllLandingPages, 
  updateLandingPageStatus, 
  getAdminStats,
  getAutoPublishSetting,
  updateAutoPublishSetting,
  LandingPageWithUser,
  LandingPageStatus 
} from '../services/admin';
import { signOut } from '../services/auth';
import { syncSubscriptionsWithStripe } from '../services/subscriptions';

interface Props {
  onLogout: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Rascunho', color: 'text-gray-600', bg: 'bg-gray-100' },
  published: { label: 'Publicado', color: 'text-green-700', bg: 'bg-green-100' },
};

const SUBSCRIPTION_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Ativa', color: 'text-green-700', bg: 'bg-green-100' },
  canceled: { label: 'Cancelada', color: 'text-red-700', bg: 'bg-red-100' },
  past_due: { label: 'Atrasada', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  unpaid: { label: 'Não Paga', color: 'text-red-700', bg: 'bg-red-100' },
  trialing: { label: 'Teste', color: 'text-blue-700', bg: 'bg-blue-100' },
  incomplete: { label: 'Incompleta', color: 'text-orange-700', bg: 'bg-orange-100' },
  incomplete_expired: { label: 'Incompleta Expirada', color: 'text-red-700', bg: 'bg-red-100' },
  paused: { label: 'Pausada', color: 'text-gray-700', bg: 'bg-gray-100' },
};

export const AdminDashboard: React.FC<Props> = ({ onLogout }) => {
  const [landingPages, setLandingPages] = useState<LandingPageWithUser[]>([]);
  const [stats, setStats] = useState({ total: 0, published: 0, pending: 0, draft: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoPublishEnabled, setAutoPublishEnabled] = useState(false);
  const [updatingAutoPublish, setUpdatingAutoPublish] = useState(false);
  const [syncingStripe, setSyncingStripe] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  const loadData = async (syncStripe = false) => {
    try {
      setLoading(true);
      
      // Sincronizar com Stripe se solicitado
      if (syncStripe) {
        try {
          setSyncingStripe(true);
          setSyncSuccess(null);
          setError(null);
          const syncResult = await syncSubscriptionsWithStripe();
          console.log('Sincronização concluída:', syncResult);
          // Mostrar mensagem de sucesso
          if (syncResult.updated > 0) {
            setSyncSuccess(`${syncResult.updated} de ${syncResult.total} assinaturas atualizadas com sucesso!`);
            setError(null);
          } else {
            setSyncSuccess('Nenhuma assinatura precisou ser atualizada.');
          }
          // Limpar mensagem após 5 segundos
          setTimeout(() => setSyncSuccess(null), 5000);
        } catch (syncError: any) {
          console.error('Erro ao sincronizar subscriptions com Stripe:', syncError);
          setError(`Erro ao sincronizar: ${syncError.message || 'Erro desconhecido'}`);
          setSyncSuccess(null);
        } finally {
          setSyncingStripe(false);
        }
      }
      
      const [pages, statsData, autoPublish] = await Promise.all([
        getAllLandingPages(),
        getAdminStats(),
        getAutoPublishSetting(),
      ]);
      
      // As subscriptions já vêm junto com as landing pages da função admin-get-pages
      console.log('Total landing pages:', pages.length);
      const pagesWithSubs = pages.filter(p => p.subscription);
      const pagesWithoutSubs = pages.filter(p => !p.subscription);
      console.log(`Resumo: ${pagesWithSubs.length} landing pages COM subscription, ${pagesWithoutSubs.length} SEM subscription`);
      
      setLandingPages(pages);
      setStats(statsData);
      setAutoPublishEnabled(autoPublish);
      setError(null);
    } catch (err: any) {
      console.error('Error loading admin data:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (pageId: string, newStatus: LandingPageStatus) => {
    try {
      setUpdatingId(pageId);
      await updateLandingPageStatus(pageId, newStatus);
      await loadData(); // Reload data
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.message || 'Erro ao atualizar status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  const handleToggleAutoPublish = async () => {
    try {
      setUpdatingAutoPublish(true);
      const newValue = !autoPublishEnabled;
      await updateAutoPublishSetting(newValue);
      setAutoPublishEnabled(newValue);
      setError(null);
    } catch (err: any) {
      console.error('Error updating auto publish setting:', err);
      setError(err.message || 'Erro ao atualizar configuração');
    } finally {
      setUpdatingAutoPublish(false);
    }
  };

  // Get URL for landing page
  const getLandingPageUrl = (page: LandingPageWithUser) => {
    const isPublished = page.status === 'published';
    
    // Se é domínio novo (has_custom_domain === false) e tem chosen_domain
    // Para domínio novo, SEMPRE usar exatamente o que o usuário digitou (independente do status)
    if (page.has_custom_domain === false && page.chosen_domain) {
      return `https://${page.chosen_domain.replace(/^https?:\/\//, '')}`;
    }
    
    // Se tem chosen_domain mas não é domínio próprio (fallback para casos onde has_custom_domain não está definido)
    if (page.chosen_domain && page.has_custom_domain !== true && !page.custom_domain) {
      // Para domínio novo, usar exatamente o que o usuário digitou
      return `https://${page.chosen_domain.replace(/^https?:\/\//, '')}`;
    }
    
    // Se tem custom_domain (domínio próprio)
    if (page.custom_domain || page.has_custom_domain === true) {
      if (isPublished) {
        return `https://${page.custom_domain || page.chosen_domain?.replace(/^https?:\/\//, '') || ''}`;
      } else {
        const domainName = page.custom_domain
          ? page.custom_domain.replace(/^www\./, '').replace(/\.(com\.br|com|med\.br|net|org|br)$/, '').toLowerCase()
          : page.chosen_domain?.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\.(com\.br|com|med\.br|net|org|br)$/, '').toLowerCase() || '';
        return `https://${domainName}.docpage.com.br`;
      }
    }
    
    // Fallback: subdomain.docpage.com.br
    return `https://${page.subdomain}.docpage.com.br`;
  };
  
  // Get display domain for landing page (exatamente como o usuário digitou)
  const getDisplayDomain = (page: LandingPageWithUser) => {
    // Usar display_domain se disponível (já vem formatado da API)
    if (page.display_domain) {
      return page.display_domain.replace(/^https?:\/\//, '');
    }
    // Fallback: prioridade: 1) chosen_domain, 2) custom_domain, 3) subdomain.docpage.com.br
    if (page.chosen_domain) {
      return page.chosen_domain.replace(/^https?:\/\//, '');
    } else if (page.custom_domain) {
      return page.custom_domain;
    } else {
      return `${page.subdomain}.docpage.com.br`;
    }
  };
  
  // Get domain type label (domínio próprio ou domínio novo)
  const getDomainTypeLabel = (page: LandingPageWithUser) => {
    // Se has_custom_domain está definido, usar ele
    if (page.has_custom_domain !== undefined) {
      return page.has_custom_domain ? 'Domínio próprio' : 'Domínio novo';
    }
    // Fallback: se tem custom_domain, é próprio; senão, é novo
    return page.custom_domain ? 'Domínio próprio' : 'Domínio novo';
  };
  
  // Format CPF for display
  const formatCPF = (cpf: string | null | undefined) => {
    if (!cpf) return 'N/A';
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return cpf;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };
  
  // Format WhatsApp for display
  const formatWhatsApp = (whatsapp: string | null | undefined) => {
    if (!whatsapp) return 'N/A';
    // Remover caracteres não numéricos e formatar
    const digits = whatsapp.replace(/\D/g, '');
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return whatsapp;
  };

  // Filter and search
  const filteredPages = landingPages.filter(page => {
    const matchesStatus = filterStatus === 'all' || page.status === filterStatus;
    const displayDomain = getDisplayDomain(page);
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      page.subdomain.toLowerCase().includes(searchLower) ||
      displayDomain.toLowerCase().includes(searchLower) ||
      page.briefing_data?.name?.toLowerCase().includes(searchLower) ||
      page.user_email?.toLowerCase().includes(searchLower) ||
      page.whatsapp?.toLowerCase().includes(searchLower) ||
      (page.cpf && page.cpf.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, ''))) ||
      page.briefing_data?.contactEmail?.toLowerCase().includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando painel admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">Painel Administrativo</h1>
              <p className="text-slate-400 text-sm">Gerenciamento de Landing Pages</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Success Message */}
        {syncSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{syncSuccess}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Auto Publish Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Publicação Automática</h3>
              <p className="text-sm text-gray-600">
                Quando habilitado, as landing pages criadas pelos usuários serão automaticamente publicadas com status "Publicado"
              </p>
            </div>
            <button
              onClick={handleToggleAutoPublish}
              disabled={updatingAutoPublish}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                autoPublishEnabled ? 'bg-amber-600' : 'bg-gray-300'
              } ${updatingAutoPublish ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoPublishEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {autoPublishEnabled && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                ✓ Publicação automática está <strong>HABILITADA</strong>. Novas landing pages serão automaticamente publicadas.
              </p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Em Publicação</p>
                <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Publicados</p>
                <p className="text-3xl font-bold text-green-600">{stats.published}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Rascunhos</p>
                <p className="text-3xl font-bold text-gray-600">{stats.draft}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por domínio, nome ou email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={() => loadData(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Atualizar
              </button>
              <button
                onClick={() => loadData(true)}
                disabled={syncingStripe}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Sincronizar status das assinaturas com o Stripe"
              >
                {syncingStripe ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sincronizar Stripe
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Landing Pages Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Domínio</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Usuário</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Assinatura</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Criado em</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'Nenhuma landing page encontrada com os filtros aplicados.'
                        : 'Nenhuma landing page cadastrada ainda.'}
                    </td>
                  </tr>
                ) : (
                  filteredPages.map((page) => (
                    <tr key={page.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex flex-col gap-1">
                            <p className="font-medium text-gray-900">
                              {getDisplayDomain(page)}
                            </p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit ${
                              page.has_custom_domain 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {getDomainTypeLabel(page)}
                            </span>
                          </div>
                          {/* Para domínio novo, mostrar exatamente o que o usuário digitou */}
                          {page.has_custom_domain === false && page.chosen_domain ? (
                            <p className="text-xs text-gray-500 mt-1">
                              {`https://${page.chosen_domain.replace(/^https?:\/\//, '')}`}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500 mt-1">
                              {getLandingPageUrl(page)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900">{page.briefing_data?.name || 'N/A'}</p>
                          <div className="text-xs text-gray-600 space-y-0.5">
                            <p>
                              <span className="font-medium">E-mail:</span>{' '}
                              <span className="text-gray-500">{page.user_email || 'N/A'}</span>
                            </p>
                            <p>
                              <span className="font-medium">WhatsApp:</span>{' '}
                              <span className="text-gray-500">{formatWhatsApp(page.whatsapp)}</span>
                            </p>
                            <p>
                              <span className="font-medium">CPF:</span>{' '}
                              <span className="text-gray-500">{formatCPF(page.cpf)}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[page.status]?.bg || 'bg-gray-100'} ${STATUS_LABELS[page.status]?.color || 'text-gray-600'}`}>
                          {STATUS_LABELS[page.status]?.label || page.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {page.subscription ? (
                          <div className="space-y-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SUBSCRIPTION_STATUS_LABELS[page.subscription.status]?.bg || 'bg-gray-100'} ${SUBSCRIPTION_STATUS_LABELS[page.subscription.status]?.color || 'text-gray-600'}`}>
                              {SUBSCRIPTION_STATUS_LABELS[page.subscription.status]?.label || page.subscription.status}
                            </span>
                            <div className="text-xs text-gray-500">
                              <div className="capitalize">{page.subscription.plan_id} - {page.subscription.billing_period === 'monthly' ? 'Mensal' : 'Anual'}</div>
                              {page.subscription.current_period_end && (
                                <div>Vence: {new Date(page.subscription.current_period_end).toLocaleDateString('pt-BR')}</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Sem assinatura</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(page.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {page.status !== 'published' && (
                            <button
                              onClick={() => handleStatusChange(page.id, 'published')}
                              disabled={updatingId === page.id}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                              {updatingId === page.id ? 'Publicando...' : 'Publicar'}
                            </button>
                          )}
                          {page.status === 'published' && (
                            <button
                              onClick={() => handleStatusChange(page.id, 'draft')}
                              disabled={updatingId === page.id}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                              {updatingId === page.id ? 'Alterando...' : 'Despublicar'}
                            </button>
                          )}
                          <a
                            href={getLandingPageUrl(page)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                          >
                            Ver
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
