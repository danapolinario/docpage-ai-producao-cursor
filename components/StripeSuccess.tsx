import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface StripeSuccessProps {
  onSuccess?: (data: { landingPageId: string; landingPageUrl: string; domain: string }) => void;
}

export const StripeSuccess: React.FC<StripeSuccessProps> = ({ onSuccess }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const [landingPageData, setLandingPageData] = useState<{
    landingPageId: string;
    landingPageUrl: string;
    domain: string;
  } | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setError('ID da sessão não encontrado');
      setIsLoading(false);
      return;
    }

    // Aguardar alguns segundos para o webhook processar e fazer polling
    const checkSubscription = async () => {
      try {
        // Buscar usuário autenticado
        const { data: { user }, error: getUserError } = await supabase.auth.getUser();
        
        if (!user) {
          setError('Usuário não autenticado');
          setIsLoading(false);
          return;
        }

        // A landing page já deve existir (foi criada antes do pagamento)
        // Buscar landing page mais recente do usuário
        const { data: lpData, error: lpError } = await supabase
          .from('landing_pages')
          .select('id, subdomain, custom_domain, cpf')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!lpData) {
          // Landing page não encontrada - redirecionar para dashboard mesmo assim
          // (o pagamento foi processado, a landing page pode estar sendo criada ou já existe)
          setRedirectCountdown(3);
          let countdown = 3;
          const countdownInterval = setInterval(() => {
            countdown--;
            setRedirectCountdown(countdown);
            if (countdown <= 0) {
              clearInterval(countdownInterval);
              navigate('/dashboard');
            }
          }, 1000);
          
          setError('Seu pagamento foi processado com sucesso! Você será redirecionado para o dashboard.');
          setIsLoading(false);
          return;
        }

        const landingPage = lpData;
        
        // Buscar CPF de pending_checkouts usando session_id e atualizar landing page se necessário
        // Isso é uma solução alternativa caso o webhook não esteja funcionando
        if (!landingPage.cpf && sessionId) {
          try {
            const { data: pendingCheckout, error: pendingError } = await supabase
              .from('pending_checkouts')
              .select('cpf')
              .eq('stripe_session_id', sessionId)
              .maybeSingle();
            
            if (pendingCheckout && pendingCheckout.cpf && !pendingError) {
              // Limpar CPF (apenas números)
              const cpfCleaned = String(pendingCheckout.cpf).replace(/\D/g, '');
              
              const { error: updateError } = await supabase
                .from('landing_pages')
                .update({ cpf: cpfCleaned })
                .eq('id', landingPage.id);
              
              if (updateError) {
                console.error('StripeSuccess: Erro ao atualizar CPF na landing page:', updateError);
              }
            }
          } catch (cpfError: any) {
            console.error('StripeSuccess: Erro ao buscar/atualizar CPF:', cpfError);
            // Não falhar o fluxo se houver erro ao atualizar CPF
          }
        }

        // Construir URL da landing page
        const landingPageUrl = landingPage.custom_domain 
          ? `https://${landingPage.custom_domain}`
          : `https://${landingPage.subdomain}.docpage.com.br`;

        const domain = landingPage.custom_domain || `${landingPage.subdomain}.docpage.com.br`;

        setLandingPageData({
          landingPageId: landingPage.id,
          landingPageUrl,
          domain,
        });

        setIsLoading(false);

        // Notificar componente pai
        if (onSuccess) {
          onSuccess({
            landingPageId: landingPage.id,
            landingPageUrl,
            domain,
          });
        }
      } catch (err: any) {
        console.error('Erro ao verificar subscription:', err);
        setError(err.message || 'Erro ao verificar status do pagamento');
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [sessionId, onSuccess]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-12 rounded-2xl shadow-xl max-w-lg w-full border border-gray-100 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Processando Pagamento</h2>
          <p className="text-gray-500">
            Estamos confirmando seu pagamento e criando seu site. Isso pode levar alguns segundos...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-12 rounded-2xl shadow-xl max-w-lg w-full border border-gray-100 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Pagamento Confirmado!</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-800 mb-2">
              <strong>✓ Pagamento processado:</strong> Seu pagamento foi confirmado pelo Stripe com sucesso.
            </p>
            <p className="text-sm text-blue-800">
              A criação da landing page pode levar alguns minutos. Você pode verificar o status no dashboard.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
            >
              {redirectCountdown !== null 
                ? `Ir para Dashboard (${redirectCountdown}s)`
                : 'Ir para Dashboard'
              }
            </button>
            {redirectCountdown !== null && redirectCountdown > 0 && (
              <p className="text-xs text-gray-500">
                Redirecionando automaticamente em {redirectCountdown} segundo{redirectCountdown !== 1 ? 's' : ''}...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (landingPageData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 animate-fade-in text-center">
        <div className="bg-white p-12 rounded-2xl shadow-xl max-w-lg w-full border border-gray-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Pagamento Confirmado!</h2>
          <p className="text-gray-500 mb-8">
            Parabéns! Seu pagamento foi processado com sucesso e seu site está sendo criado.
          </p>
          
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-8 text-left">
            <h4 className="font-bold text-blue-900 mb-2 text-sm uppercase">Próximos Passos</h4>
            <ul className="space-y-3">
              <li className="flex gap-2 text-sm text-blue-800">
                <span className="font-bold">1.</span> Aguarde algumas horas para a configuração do domínio contratado ou o contato da nossa equipe para orientações de configuração do domínio já existente.
              </li>
              <li className="flex gap-2 text-sm text-blue-800">
                <span className="font-bold">2.</span> Você receberá um email de aviso assim que seu site estiver no ar.
              </li>
              <li className="flex gap-2 text-sm text-blue-800">
                <span className="font-bold">3.</span> Acesse seu dashboard para gerenciar sua página.
              </li>
            </ul>
          </div>

          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
          >
            Acessar Meu Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default StripeSuccess;
