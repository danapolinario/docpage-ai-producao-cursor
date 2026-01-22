import React, { useState, useEffect } from 'react';
import { Plan, BriefingData, LandingPageContent, DesignSettings } from '../types';
import { processCompletePaymentFlow } from '../services/payment-flow';
import { sendOTP, verifyCode, resendOTP } from '../services/auth';
import { checkDomainAvailability, updateLandingPage } from '../services/landing-pages';
import SuccessModal from './SuccessModal';
import { supabase } from '../lib/supabase';
import { trackCheckoutStep, trackPaymentComplete } from '../services/google-analytics';

interface Props {
  plan: Plan;
  briefing: BriefingData;
  content: LandingPageContent;
  design: DesignSettings;
  visibility: any;
  layoutVariant: number;
  photoUrl: string | null;
  aboutPhotoUrl: string | null;
  onBack: () => void;
  onSuccess: (data: { landingPageId: string; landingPageUrl: string; domain: string }) => void;
  onError?: (error: string) => void;
}

type CheckoutStep = 1 | 2 | 3;

export const CheckoutFlow: React.FC<Props> = ({ 
  plan, 
  briefing,
  content,
  design,
  visibility,
  layoutVariant,
  photoUrl,
  aboutPhotoUrl,
  onBack, 
  onSuccess,
  onError
}) => {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [pendingSuccess, setPendingSuccess] = useState<{
    landingPageId: string;
    landingPageUrl: string;
    domain: string;
  } | null>(null);
  
  // Step 1: Account States
  const [email, setEmail] = useState(briefing.contactEmail || '');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [canResendCode, setCanResendCode] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Step 2: Domain States
  const [domain, setDomain] = useState('');
  const [domainExtension, setDomainExtension] = useState('.com.br');
  const [isCheckingDomain, setIsCheckingDomain] = useState(false);
  const [isDomainAvailable, setIsDomainAvailable] = useState<boolean | null>(null);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  // Step 3: Payment States
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState('');

  // Pré-preencher dados fake quando entrar no Step 3
  useEffect(() => {
    if (currentStep === 3) {
      // Pré-preencher apenas se os campos estiverem vazios
      if (!cardNumber) {
        setCardNumber('4590 2133 1234 5678'); // Visa test card
      }
      if (!expiry) {
        setExpiry('12/26');
      }
      if (!cvc) {
        setCvc('123');
      }
      if (!cardName) {
        setCardName('João da Silva Santos');
      }
    }
  }, [currentStep, cardNumber, expiry, cvc, cardName]);

  // Validation Logic
  const validateEmails = () => {
    if (email !== confirmEmail && confirmEmail.length > 0) {
      setEmailError('Os emails não coincidem.');
    } else {
      setEmailError('');
    }
  };

  useEffect(() => {
    validateEmails();
  }, [email, confirmEmail]);

  // Countdown para reenvio de código
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0 && isCodeSent) {
      setCanResendCode(true);
    }
  }, [resendCountdown, isCodeSent]);

  // Verificar se já está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Erro ao verificar autenticação no CheckoutFlow:', error);
          setIsAuthenticated(false);
          return;
        }
        
        if (user && user.id) {
          console.log('CheckoutFlow: Usuário já autenticado, pulando para Step 2');
          setIsAuthenticated(true);
          setEmail(user.email || '');
          // Se já está autenticado, avançar automaticamente para o Step 2 (domínio)
          setCurrentStep(2);
        } else {
          console.log('CheckoutFlow: Usuário não autenticado, iniciando no Step 1');
          setIsAuthenticated(false);
          // Garantir que está no Step 1 se não estiver autenticado
          setCurrentStep(1);
        }
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  // Step 1: Enviar código OTP
  const handleSendCode = async () => {
    if (!email || email !== confirmEmail) {
      setEmailError('Os emails não coincidem.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setEmailError('Por favor, insira um email válido.');
      return;
    }

    trackCheckoutStep(1, 'Enviando código OTP');
    setIsSendingCode(true);
    setError(null);
    setEmailError('');
    setCodeError('');

    try {
      await sendOTP(email, briefing.name);
      setIsCodeSent(true);
      setCanResendCode(false);
      setResendCountdown(60); // 60 segundos antes de poder reenviar
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar código. Por favor, tente novamente.');
    } finally {
      setIsSendingCode(false);
    }
  };

  // Step 1: Verificar código OTP
  const handleVerifyCode = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setCodeError('Por favor, insira o código de 6 dígitos.');
      return;
    }

    setIsVerifyingCode(true);
    setError(null);
    setCodeError('');

    try {
      await verifyCode(email, otpCode);
      
      // Verificar se autenticado após verificação
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
        trackCheckoutStep(2, 'Autenticação concluída');
        setCurrentStep(2);
      } else {
        // Aguardar um pouco e verificar novamente
        await new Promise(resolve => setTimeout(resolve, 500));
        const { data: { user: retryUser } } = await supabase.auth.getUser();
        if (retryUser) {
          setIsAuthenticated(true);
          trackCheckoutStep(2, 'Autenticação concluída');
          setCurrentStep(2);
        } else {
          setError('Código verificado, mas não foi possível autenticar. Por favor, tente novamente.');
        }
      }
    } catch (err: any) {
      if (err.message?.includes('token')) {
        setCodeError('Código inválido ou expirado. Por favor, solicite um novo código.');
      } else {
        setCodeError(err.message || 'Erro ao verificar código. Por favor, tente novamente.');
      }
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Reenviar código
  const handleResendCode = async () => {
    if (!canResendCode) return;

    setIsSendingCode(true);
    setError(null);
    setCanResendCode(false);

    try {
      await resendOTP(email);
      setResendCountdown(60);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar código. Por favor, tente novamente.');
    } finally {
      setIsSendingCode(false);
    }
  };

  // Step 2: Verificar domínio via RDAP (Registro.br)
  const handleCheckDomain = async () => {
    if (!domain || domain.length < 2) {
      setDomainError('Digite um domínio válido (mínimo 2 caracteres)');
      return;
    }

    setIsCheckingDomain(true);
    setDomainError(null);
    setIsDomainAvailable(null);

    try {
      // Normalizar nome do domínio (remover www, extensões, caracteres especiais)
      const domainName = domain
        .replace(/^www\./, '')
        .replace(/\.(com|com\.br|med\.br|br)$/, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '-') // Substitui caracteres especiais por hífen
        .replace(/-+/g, '-') // Remove hífens duplicados
        .replace(/^-|-$/g, ''); // Remove hífens do início/fim

      // Verificar se domínio é válido
      if (domainName.length < 2) {
        setDomainError('Domínio muito curto. Use pelo menos 2 caracteres.');
        setIsDomainAvailable(false);
        setIsCheckingDomain(false);
        return;
      }

      // Verificar disponibilidade via RDAP do Registro.br
      const availability = await checkDomainAvailability(domainName);

      if (availability.available) {
        setIsDomainAvailable(true);
        setSelectedDomain(domainName); // Guarda o nome do domínio
        // Não avança automaticamente - usuário deve clicar em "Continuar"
      } else {
        setIsDomainAvailable(false);
        setDomainError(availability.error || 'Este domínio já está registrado. Tente outro nome.');
      }
    } catch (err: any) {
      setDomainError(err.message || 'Erro ao verificar domínio. Por favor, tente novamente.');
      setIsDomainAvailable(false);
    } finally {
      setIsCheckingDomain(false);
    }
  };

  const handleDomainKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCheckDomain();
    }
  };

  // Step 3: Processar pagamento
  const handlePaymentFormat = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    val = val.substring(0, 16);
    val = val.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(val);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    setExpiry(val);
  };

  const isStep1Valid = 
    email.length > 5 &&
    email === confirmEmail &&
    (!isCodeSent || (otpCode.length === 6));

  const isStep2Valid = isDomainAvailable === true && selectedDomain !== null;

  const isStep3Valid = 
    cardNumber.length >= 18 && // accounting for spaces
    expiry.length === 5 &&
    cvc.length >= 3 &&
    cardName.length > 3;

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep3Valid || !selectedDomain) return;

    setIsLoading(true);
    setError(null);

    try {
      if (!selectedDomain) {
        setError('Por favor, escolha um domínio válido.');
        setIsLoading(false);
        return;
      }

      // O selectedDomain já é apenas o subdomínio (sem extensão)
      // No processCompletePaymentFlow, ele será usado como subdomain
      const finalDomain = selectedDomain; // Apenas o subdomínio para o banco
      
      // Processar fluxo completo: Pagamento + Landing Page
      // Usuário já está autenticado no Step 1 (via OTP)
      const result = await processCompletePaymentFlow({
        email,
        name: briefing.name,
        domain: finalDomain, // Subdomínio apenas (ex: "drjoaosilva")
        planId: plan.id,
        planPrice: plan.rawPrice,
        briefing,
        content,
        design,
        visibility,
        layoutVariant,
        photoUrl,
        aboutPhotoUrl,
        cardNumber,
        expiry,
        cvc,
        cardName,
      });

      if (result.success && result.landingPageId && result.landingPageUrl) {
        // Gerar URL completa do domínio (subdomínio + extensão)
        const fullDomain = `${selectedDomain}${domainExtension}`;
        
        // Track pagamento completo
        trackPaymentComplete(plan.name, plan.rawPrice);
        
        // Mostrar modal de sucesso antes de redirecionar
        setPendingSuccess({
          landingPageId: result.landingPageId,
          landingPageUrl: result.landingPageUrl,
          domain: fullDomain,
        });
        setShowSuccessModal(true);
        setIsLoading(false);
      } else {
        const errorMessage = result.error || 'Erro ao processar pagamento';
        setError(errorMessage);
        onError?.(errorMessage);
        setIsLoading(false); // Reset loading state on error
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao processar pagamento';
      setError(errorMessage);
      onError?.(errorMessage);
      setIsLoading(false); // Reset loading state on error
    }
  };

  // Handler para enviar CPF e finalizar
  const handleCPFSubmit = async (cpf: string) => {
    if (!pendingSuccess) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Salvar CPF na landing page diretamente via Supabase
      const { error: updateError } = await supabase
        .from('landing_pages')
        .update({ cpf: cpf })
        .eq('id', pendingSuccess.landingPageId);
      
      if (updateError) {
        console.error('Erro ao atualizar CPF no banco:', updateError);
        throw new Error('Erro ao salvar CPF. Tente novamente.');
      }
      
      // CPF salvo com sucesso - redirecionar imediatamente sem fechar modal
      // A modal continuará aberta mostrando mensagem de redirecionamento
      setIsLoading(false);
      setIsRedirecting(true);
      
      // Redirecionar para dashboard o mais rápido possível
      // Não fechar modal - ela mostrará mensagem de redirecionamento
      onSuccess(pendingSuccess);
    } catch (err: any) {
      console.error('Erro ao salvar CPF:', err);
      setError(err.message || 'Erro ao salvar CPF. Tente novamente.');
      setIsLoading(false);
    }
  };

  // Debug: Log current state
  useEffect(() => {
    console.log('CheckoutFlow State:', {
      currentStep,
      isAuthenticated,
      isLoading,
      isSendingCode,
      isVerifyingCode,
      isCheckingDomain,
      isDomainAvailable
    });
  }, [currentStep, isAuthenticated, isLoading, isSendingCode, isVerifyingCode, isCheckingDomain, isDomainAvailable]);

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-gray-200 animate-fade-in">
      
      {/* Order Summary (Left/Top) */}
      <div className="md:w-5/12 bg-slate-50 p-8 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col">
         <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-8 w-fit">
           ← Voltar aos planos
         </button>
         
         <div className="flex-1">
           <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Resumo do Pedido</h3>
           <div className="flex items-baseline gap-2 mb-1">
             <h2 className="text-3xl font-bold text-slate-900">{plan.price}</h2>
             <span className="text-gray-500">{plan.period}</span>
           </div>
           <h1 className="text-xl font-semibold text-slate-800 mb-6">{plan.name} DocPage AI</h1>
           
           {/* Progress Steps */}
           <div className="mb-8 space-y-4">
             <div className={`flex items-center gap-3 text-sm ${currentStep >= 1 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
               <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                 currentStep >= 1 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
               }`}>
                 {currentStep > 1 ? '✓' : '1'}
               </div>
               <span>Criar Conta</span>
             </div>
             <div className={`flex items-center gap-3 text-sm ${currentStep >= 2 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
               <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                 currentStep >= 2 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
               }`}>
                 {currentStep > 2 ? '✓' : '2'}
               </div>
               <span>Escolher Domínio</span>
             </div>
             <div className={`flex items-center gap-3 text-sm ${currentStep >= 3 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
               <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                 currentStep >= 3 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
               }`}>
                 3
               </div>
               <span>Pagamento</span>
             </div>
           </div>

           <ul className="space-y-3 mb-8">
             {plan.features.slice(0, 4).map((feat, idx) => (
               <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                 <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                 {feat}
               </li>
             ))}
             {selectedDomain && (
               <li className="flex items-start gap-3 text-sm font-bold text-blue-600 animate-fade-in">
                 <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                 Domínio: {selectedDomain}{domainExtension}
               </li>
             )}
           </ul>
         </div>

         <div className="border-t border-gray-200 pt-6">
           <div className="flex justify-between items-center mb-2 text-sm">
             <span className="text-gray-600">Subtotal</span>
             <span className="font-medium">{plan.price}</span>
           </div>
           <div className="flex justify-between items-center mb-4 text-sm">
             <span className="text-gray-600">Taxas</span>
             <span className="font-medium">R$ 0,00</span>
           </div>
           <div className="flex justify-between items-center pt-4 border-t border-gray-200">
             <span className="font-bold text-slate-900">Total</span>
             <span className="font-bold text-xl text-blue-600">{plan.price}</span>
           </div>
         </div>
      </div>

      {/* Form Area (Right/Bottom) */}
      <div className="md:w-7/12 p-8 md:p-12 bg-white relative">
         <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Configuração & Pagamento</h2>
            
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Step 1: Criar Conta com OTP */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">1. Criar sua Conta</h3>

                  {!isCodeSent ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Email de Acesso</label>
                          <input 
                            type="email" 
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              setEmailError('');
                            }}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="seu@email.com"
                            required
                            disabled={isSendingCode || isAuthenticated}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Confirmar Email</label>
                          <input 
                            type="email" 
                            value={confirmEmail}
                            onChange={(e) => {
                              setConfirmEmail(e.target.value);
                              setEmailError('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && email === confirmEmail && email.includes('@')) {
                                handleSendCode();
                              }
                            }}
                            className={`w-full p-3 border rounded-lg outline-none ${emailError ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'}`}
                            placeholder="Repita o email"
                            required
                            disabled={isSendingCode || isAuthenticated}
                          />
                        </div>
                      </div>
                      {emailError && <p className="text-xs text-red-500">{emailError}</p>}

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                        <p className="font-medium mb-1">🔐 Autenticação Segura</p>
                        <p>Enviaremos um código de 6 dígitos para seu email. Não é necessário senha!</p>
                      </div>

                      <button
                        onClick={handleSendCode}
                        disabled={!email || email !== confirmEmail || !email.includes('@') || isSendingCode || isAuthenticated}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSendingCode ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Enviando código...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            Enviar Código
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700 flex items-start gap-3">
                        <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                        <div className="flex-1">
                          <p className="font-medium mb-1">Código enviado!</p>
                          <p>Verifique seu email <strong>{email}</strong> e insira o código de 6 dígitos abaixo.</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Código de Verificação</label>
                        <input 
                          type="text" 
                          value={otpCode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').substring(0, 6);
                            setOtpCode(value);
                            setCodeError('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && otpCode.length === 6) {
                              handleVerifyCode();
                            }
                          }}
                          className={`w-full p-3 border rounded-lg outline-none text-center text-2xl font-mono tracking-widest ${codeError ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'}`}
                          placeholder="000000"
                          maxLength={6}
                          required
                          disabled={isVerifyingCode || isAuthenticated}
                          autoFocus
                        />
                        {codeError && <p className="text-xs text-red-500 mt-1">{codeError}</p>}
                        {!codeError && otpCode.length > 0 && otpCode.length < 6 && (
                          <p className="text-xs text-gray-500 mt-1">Digite o código de 6 dígitos</p>
                        )}
                      </div>

                      <div className="flex gap-3">
                      <button
                        onClick={handleVerifyCode}
                        disabled={otpCode.length !== 6 || isVerifyingCode || isAuthenticated}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                          {isVerifyingCode ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                              Verificando...
                            </>
                          ) : isAuthenticated ? (
                            <>
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                              Verificado - Continuar →
                            </>
                          ) : (
                            'Verificar Código'
                          )}
                        </button>
                        
                        {canResendCode ? (
                          <button
                            onClick={handleResendCode}
                            disabled={isSendingCode}
                            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            {isSendingCode ? 'Enviando...' : 'Reenviar'}
                          </button>
                        ) : (
                          <div className="px-4 py-3 bg-gray-50 text-gray-500 text-sm font-medium rounded-lg flex items-center justify-center min-w-[100px]">
                            {resendCountdown}s
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setIsCodeSent(false);
                          setOtpCode('');
                          setCodeError('');
                          setResendCountdown(0);
                          setCanResendCode(false);
                        }}
                        className="w-full py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                      >
                        ← Alterar email
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Escolher Domínio */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">2. Escolha seu Domínio</h3>
                  <label className="block text-xs font-medium text-gray-700">Qual será o endereço do seu site?</label>
                  
                  {/* Mobile: Layout vertical para melhor usabilidade */}
                  <div className="md:hidden space-y-3">
                    <div className="flex rounded-lg shadow-sm">
                      <span className="inline-flex items-center px-3 md:px-4 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-base font-medium">
                        www.
                      </span>
                      <input
                        type="text"
                        value={domain}
                        onChange={(e) => {
                          setDomain(e.target.value.toLowerCase().replace(/\s/g, ''));
                          setIsDomainAvailable(null);
                          setDomainError(null);
                        }}
                        onKeyDown={handleDomainKeyDown}
                        className={`flex-1 min-w-0 block w-full px-4 py-4 text-base rounded-none border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          isDomainAvailable === true 
                            ? 'border-green-500 text-green-700 bg-green-50' 
                            : isDomainAvailable === false
                            ? 'border-red-500 text-red-700 bg-red-50'
                            : 'border-gray-300 bg-white'
                        }`}
                        placeholder="drjoaosilva"
                        disabled={isCheckingDomain || isDomainAvailable === true}
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select 
                        value={domainExtension}
                        onChange={(e) => {
                          setDomainExtension(e.target.value);
                          setIsDomainAvailable(null);
                        }}
                        className="flex-1 bg-gray-50 border border-gray-300 text-gray-700 text-base font-medium px-4 py-4 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isDomainAvailable === true}
                      >
                        <option>.com.br</option>
                        <option>.med.br</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleCheckDomain}
                        disabled={isCheckingDomain || !domain || isDomainAvailable === true || domain.length < 3}
                        className={`flex-1 inline-flex items-center justify-center px-4 py-4 rounded-lg border text-base font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                          isDomainAvailable === true 
                            ? 'bg-green-50 text-green-700 border-green-500' 
                            : 'bg-gray-50 text-gray-700 border-gray-300'
                        }`}
                      >
                        {isCheckingDomain ? (
                          <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : isDomainAvailable === true ? (
                          <span className="flex items-center gap-1">✓ Disponível</span>
                        ) : (
                          "Verificar"
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Desktop: Layout horizontal */}
                  <div className="hidden md:flex rounded-lg shadow-sm">
                    <span className="inline-flex items-center px-3 md:px-4 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm font-medium">
                      www.
                    </span>
                    <input
                      type="text"
                      value={domain}
                      onChange={(e) => {
                        setDomain(e.target.value.toLowerCase().replace(/\s/g, ''));
                        setIsDomainAvailable(null);
                        setDomainError(null);
                      }}
                      onKeyDown={handleDomainKeyDown}
                      className={`flex-1 min-w-0 block w-full px-3 py-3 rounded-none border focus:ring-blue-500 focus:border-blue-500 text-sm ${
                        isDomainAvailable === true 
                          ? 'border-green-500 text-green-700 bg-green-50' 
                          : isDomainAvailable === false
                          ? 'border-red-500 text-red-700 bg-red-50'
                          : 'border-gray-300'
                      }`}
                      placeholder="drjoaosilva"
                      disabled={isCheckingDomain || isDomainAvailable === true}
                      autoComplete="off"
                      autoCapitalize="off"
                      autoCorrect="off"
                    />
                    <select 
                      value={domainExtension}
                      onChange={(e) => {
                        setDomainExtension(e.target.value);
                        setIsDomainAvailable(null);
                      }}
                      className="bg-gray-50 border border-l-0 border-gray-300 text-gray-500 text-sm px-2 outline-none"
                      disabled={isDomainAvailable === true}
                    >
                      <option>.com.br</option>
                      <option>.med.br</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleCheckDomain}
                      disabled={isCheckingDomain || !domain || isDomainAvailable === true || domain.length < 3}
                      className={`inline-flex items-center px-4 rounded-r-md border border-l-0 border-gray-300 text-sm font-medium hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isDomainAvailable === true 
                          ? 'bg-green-50 text-green-700 border-green-500' 
                          : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      {isCheckingDomain ? (
                        <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ) : isDomainAvailable === true ? (
                        <span className="flex items-center gap-1">✓ Disponível</span>
                      ) : (
                        "Verificar"
                      )}
                    </button>
                  </div>

                  {domainError && (
                    <p className="text-xs text-red-500">{domainError}</p>
                  )}

                  {isDomainAvailable === true && (
                    <div className="flex items-center justify-between text-xs p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-700 font-medium">Domínio disponível e reservado!</p>
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsDomainAvailable(null);
                          setSelectedDomain(null);
                          setDomainError(null);
                        }} 
                        className="text-green-600 hover:text-green-800 underline font-medium"
                      >
                        Alterar
                      </button>
                    </div>
                  )}

                  {isDomainAvailable === false && !domainError && (
                    <p className="text-xs text-red-500">Este domínio não está disponível. Tente outro.</p>
                  )}

                  {isDomainAvailable === true && (
                    <button
                      onClick={() => {
                        trackCheckoutStep(3, 'Dados de pagamento');
                        setCurrentStep(3);
                      }}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 mt-4"
                    >
                      Continuar para Pagamento →
                    </button>
                  )}

                  <button
                    onClick={() => setCurrentStep(1)}
                    className="w-full py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                  >
                    ← Voltar
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Pagamento */}
            {currentStep === 3 && (
              <form onSubmit={handleSubmitPayment} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">3. Pagamento</h3>
                  
                  {/* Alerta discreto sobre simulação */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                    <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="flex-1">
                      <strong className="font-semibold">Essa é uma página de simulação de pagamento com dados fictícios.</strong> Não haverá nenhum tipo de cobrança neste momento de teste com usuários.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <p className="text-blue-900 font-medium mb-1">Domínio selecionado:</p>
                    <p className="text-blue-700">{selectedDomain}{domainExtension}</p>
                  </div>

                  <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                    <div className="p-3 border-b border-gray-200 flex items-center bg-white">
                      <svg className="w-6 h-6 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                      <input 
                        type="text" 
                        placeholder="Número do Cartão" 
                        value={cardNumber}
                        onChange={handlePaymentFormat}
                        className="w-full outline-none text-gray-700 placeholder-gray-400"
                        maxLength={19}
                        required
                        disabled={isLoading}
                      />
                      <div className="flex gap-1 ml-2 opacity-50">
                        <div className="w-8 h-5 bg-blue-900 rounded"></div>
                        <div className="w-8 h-5 bg-orange-500 rounded"></div>
                      </div>
                    </div>
                    <div className="flex bg-white">
                      <div className="w-1/2 p-3 border-r border-gray-200">
                        <input 
                          type="text" 
                          placeholder="MM / AA" 
                          value={expiry}
                          onChange={handleExpiryChange}
                          className="w-full outline-none text-gray-700 placeholder-gray-400"
                          maxLength={5}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="w-1/2 p-3 flex items-center">
                        <input 
                          type="text" 
                          placeholder="CVC" 
                          value={cvc}
                          onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').substring(0,4))}
                          className="w-full outline-none text-gray-700 placeholder-gray-400"
                          maxLength={4}
                          required
                          disabled={isLoading}
                        />
                        <svg className="w-4 h-4 text-gray-400 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <input 
                      type="text" 
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Nome como impresso no cartão"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isLoading || !isStep3Valid}
                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Processando Pagamento...
                      </>
                    ) : (
                      `Pagar ${plan.price}`
                    )}
                  </button>
                  
                  <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    Pagamento 100% seguro com criptografia SSL.
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-full py-2 text-gray-600 hover:text-gray-800 text-sm font-medium mt-4"
                  >
                    ← Voltar
                  </button>
                </div>
              </form>
            )}
         </div>
      </div>
      
      {/* Modal de sucesso com solicitação de CPF */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {}}
        onSubmit={handleCPFSubmit}
        isLoading={isLoading}
        isRedirecting={isRedirecting}
      />
    </div>
  );
};

export default CheckoutFlow;
