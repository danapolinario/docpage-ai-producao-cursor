import React, { useState, useEffect } from 'react';
import { Plan, BriefingData, LandingPageContent, DesignSettings } from '../types';
import { createCheckoutSession } from '../services/stripe';
import { sendOTP, verifyCode, resendOTP } from '../services/auth';
import { checkDomainAvailability, updateLandingPage, createLandingPage } from '../services/landing-pages';
import { linkLeadToLandingPage } from '../services/leads';
import { uploadPhotoFromBase64 } from '../services/storage';
import SuccessModal from './SuccessModal';
import { supabase } from '../lib/supabase';
import { trackCheckoutStep, trackPaymentComplete } from '../services/google-analytics';

interface Props {
  plan: Plan;
  billingPeriod?: 'monthly' | 'annual';
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
  // Dados pré-preenchidos quando vem do dashboard
  prefilledDomain?: string | null;
  prefilledCpf?: string | null;
  prefilledHasCustomDomain?: boolean;
  prefilledEmail?: string; // E-mail do lead para pré-preencher
  leadId?: string; // ID do lead para vincular à landing page ao criar
}

type CheckoutStep = 1 | 2 | 3;

export const CheckoutFlow: React.FC<Props> = ({ 
  plan,
  billingPeriod: initialBillingPeriod,
  briefing,
  content,
  design,
  visibility,
  layoutVariant,
  photoUrl,
  aboutPhotoUrl,
  onBack, 
  onSuccess,
  onError,
  prefilledDomain,
  prefilledCpf,
  prefilledHasCustomDomain = false,
  prefilledEmail,
  leadId
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
  const [email, setEmail] = useState(prefilledEmail || '');
  const [confirmEmail, setConfirmEmail] = useState(prefilledEmail || '');
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
  const [hasCustomDomain, setHasCustomDomain] = useState(false);
  const [customDomainValue, setCustomDomainValue] = useState('');
  const [cpf, setCpf] = useState('');
  const [cpfError, setCpfError] = useState('');

  // Step 3: Payment States
  const [couponCode, setCouponCode] = useState('');
  // Usar billingPeriod diretamente da prop, não de um estado local
  // Isso garante que mudanças no toggle do PricingPage sejam refletidas
  // Se não for fornecido, usar 'annual' como padrão
  const billingPeriod: 'monthly' | 'annual' = (initialBillingPeriod || 'annual') as 'monthly' | 'annual';

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

  // Preencher dados pré-preenchidos quando disponíveis
  useEffect(() => {
    if (prefilledDomain) {
      // Se tem domínio pré-preenchido, verificar se é custom domain
      if (prefilledHasCustomDomain) {
        setHasCustomDomain(true);
        setCustomDomainValue(prefilledDomain);
      } else {
        // Extrair nome do domínio e extensão
        const domainMatch = prefilledDomain.match(/^(.+?)(\.(com\.br|med\.br|com|br|net|org))$/);
        if (domainMatch) {
          setDomain(domainMatch[1]); // Nome do domínio sem extensão
          setDomainExtension(domainMatch[2]); // Extensão
          setSelectedDomain(domainMatch[1]);
          setIsDomainAvailable(true);
        } else {
          // Se não tem extensão, assumir .com.br
          setDomain(prefilledDomain);
          setDomainExtension('.com.br');
          setSelectedDomain(prefilledDomain);
          setIsDomainAvailable(true);
        }
      }
    }

    if (prefilledCpf) {
      setCpf(prefilledCpf);
    }
  }, [prefilledDomain, prefilledCpf, prefilledHasCustomDomain]);

  // Verificar se já está autenticado e pular steps se dados estiverem pré-preenchidos
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          // Não logar erro se for apenas sessão ausente (usuário ainda não autenticado)
          if (error.message && !error.message.includes('Auth session missing')) {
            console.error('Erro ao verificar autenticação no CheckoutFlow:', error);
          }
          setIsAuthenticated(false);
          return;
        }
        
        if (user && user.id) {
          setIsAuthenticated(true);
          // SEMPRE preencher email do usuário autenticado quando vem do dashboard
          // Isso garante que o email esteja preenchido antes de pular para Step 3
          if (user.email) {
            setEmail(user.email);
            setConfirmEmail(user.email); // Preencher também o campo de confirmação
          }
          
          // Se tem dados pré-preenchidos (domínio e CPF), pular direto para Step 3
          if (prefilledDomain && (prefilledCpf || prefilledHasCustomDomain)) {
            console.log('[CHECKOUT FLOW] Dados pré-preenchidos detectados, pulando para Step 3', {
              prefilledDomain,
              prefilledCpf: !!prefilledCpf,
              prefilledHasCustomDomain,
              userEmail: user.email
            });
            setCurrentStep(3);
          } else {
            // Se já está autenticado mas não tem dados pré-preenchidos, avançar para Step 2
            setCurrentStep(2);
          }
        } else {
          setIsAuthenticated(false);
          // Garantir que está no Step 1 se não estiver autenticado
          setCurrentStep(1);
        }
      } catch (err: any) {
        // Não logar erro se for apenas sessão ausente (usuário ainda não autenticado)
        if (err?.message && !err.message.includes('Auth session missing')) {
          console.error('Erro ao verificar autenticação:', err);
        }
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [prefilledDomain, prefilledCpf, prefilledHasCustomDomain]);

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

    // Validação: verificar se contém .com.br ou .med.br quando toggle está desabilitado
    if (!hasCustomDomain) {
      const normalizedDomain = domain.toLowerCase().trim();
      if (!normalizedDomain.includes('.com.br') && !normalizedDomain.includes('.med.br')) {
        setDomainError('O domínio deve conter .com.br ou .med.br');
        setIsDomainAvailable(false);
        return;
      }
    }

    setIsCheckingDomain(true);
    setDomainError(null);
    setIsDomainAvailable(null);

    try {
      // Normalizar domínio completo (remover www, espaços)
      const normalizedDomain = domain
        .replace(/^www\./, '')
        .toLowerCase()
        .trim();

      // Extrair nome do domínio (sem extensão) e extensão
      let domainName: string;
      let extractedExtension: string = '.com.br'; // Padrão

      // Tentar extrair extensão do domínio digitado
      const extensionMatch = normalizedDomain.match(/\.(com\.br|med\.br|com|br|net|org)$/);
      if (extensionMatch) {
        extractedExtension = extensionMatch[0];
        domainName = normalizedDomain.replace(extensionMatch[0], '');
      } else {
        // Se não tiver extensão, usar o que foi digitado
        domainName = normalizedDomain;
      }

      // Limpar nome do domínio (remover caracteres especiais)
      domainName = domainName
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
      // Passar o nome do domínio e a extensão extraída
      const availability = await checkDomainAvailability(domainName, extractedExtension);

      if (availability.available) {
        setIsDomainAvailable(true);
        setSelectedDomain(domainName); // Guarda o nome do domínio (sem extensão)
        setDomainExtension(extractedExtension); // Guarda a extensão extraída
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

  const isStep1Valid = 
    email.length > 5 &&
    email === confirmEmail &&
    (!isCodeSent || (otpCode.length === 6));

  const isStep2Valid = hasCustomDomain 
    ? customDomainValue.length > 0 
    : (isDomainAvailable === true && selectedDomain !== null);

  const isStep3Valid = true; // Sempre válido, apenas precisa ter domínio selecionado

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar domínio (considerando domínio próprio)
    const hasValidDomain = hasCustomDomain 
      ? customDomainValue.length > 0 
      : selectedDomain !== null;
    
    if (!hasValidDomain) {
      setError(hasCustomDomain 
        ? 'Por favor, informe seu domínio próprio.' 
        : 'Por favor, escolha um domínio válido.');
      return;
    }

    // Verificar se usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !user.id) {
      setError('Você precisa estar autenticado para continuar. Por favor, volte ao Step 1.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Se tem domínio próprio, usar o valor informado; senão, usar o subdomínio verificado
      const finalDomain = hasCustomDomain 
        ? customDomainValue 
        : selectedDomain; // Subdomínio apenas (ex: "drjoaosilva")
      
      // Domínio completo escolhido pelo usuário (com extensão) - SEMPRE deve ter extensão
      // Este é o valor que será armazenado em pending_checkouts.domain e usado para exibição
      let chosenDomainForEmail: string;
      if (hasCustomDomain) {
        // Domínio próprio: usar o valor informado (já deve ter extensão)
        chosenDomainForEmail = customDomainValue;
      } else if (domain && (domain.includes('.com.br') || domain.includes('.med.br') || domain.includes('.com') || domain.includes('.br'))) {
        // Usar o domínio completo digitado pelo usuário (já contém extensão)
        chosenDomainForEmail = domain;
      } else if (selectedDomain && domainExtension) {
        // Construir a partir de selectedDomain + domainExtension (extraídos durante verificação)
        chosenDomainForEmail = `${selectedDomain}${domainExtension}`;
      } else {
        // Fallback: garantir que sempre tenha extensão
        const baseDomain = selectedDomain || finalDomain;
        chosenDomainForEmail = baseDomain.includes('.') ? baseDomain : `${baseDomain}.com.br`;
        console.warn('CheckoutFlow: Construindo chosenDomain com extensão padrão .com.br');
      }
      
      if (!finalDomain) {
        setError('Por favor, informe um domínio válido.');
        setIsLoading(false);
        return;
      }

      // Usar billingPeriod diretamente da prop (vem do toggle do PricingPage)
      const period: 'monthly' | 'annual' = billingPeriod;
      
      const cpfToSend = !hasCustomDomain ? cpf.replace(/\D/g, '') : undefined;
      
      // Validar que temos um email válido
      if (!email || !email.includes('@')) {
        setError('Por favor, informe um email válido no Step 1.');
        setIsLoading(false);
        return;
      }

      
      // Verificar se o email está vazio ou inválido
      if (!email || !email.includes('@')) {
        console.error('CheckoutFlow: Email inválido ou vazio!', { email, userEmail: user.email });
        setError('Por favor, informe um email válido no Step 1.');
        setIsLoading(false);
        return;
      }
      
      // Validar CPF quando não há domínio próprio
      if (!hasCustomDomain && (!cpf || cpf.replace(/\D/g, '').length !== 11)) {
        setError('Por favor, informe um CPF válido (11 dígitos) no Step 2.');
        setIsLoading(false);
        return;
      }

      // CRIAR LANDING PAGE ANTES DO PAGAMENTO
      // Verificar se já existe uma landing page para este usuário
      const { data: existingLp } = await supabase
        .from('landing_pages')
        .select('id, subdomain, custom_domain, cpf')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let landingPageId: string;
      let landingPageSubdomain: string;
      let landingPageCustomDomain: string | null = null;

      if (existingLp) {
        // Landing page já existe, usar ela
        landingPageId = existingLp.id;
        landingPageSubdomain = existingLp.subdomain;
        landingPageCustomDomain = existingLp.custom_domain;
        
        // Atualizar CPF na landing page existente se não tiver e tivermos CPF
        if (cpfToSend && !existingLp.cpf) {
          try {
            const { error: updateError } = await supabase
              .from('landing_pages')
              .update({ cpf: cpfToSend })
              .eq('id', landingPageId);
            
            if (updateError) {
              console.error('CheckoutFlow: Erro ao atualizar CPF na landing page existente:', updateError);
            }
          } catch (cpfUpdateError: any) {
            console.error('CheckoutFlow: Erro ao atualizar CPF:', cpfUpdateError);
            // Não falhar o fluxo se houver erro ao atualizar CPF
          }
        }
      } else {
        // Criar nova landing page
        
        // Preparar subdomínio
        let finalSubdomain: string;
        let customDomainToSave: string | null = null;

        if (hasCustomDomain && customDomainValue) {
          // Domínio próprio - gerar subdomínio temporário único
          customDomainToSave = customDomainValue.trim();
          const timestamp = Date.now().toString(36);
          const emailHash = email.split('@')[0].substring(0, 8).toLowerCase().replace(/[^a-z0-9]/g, '');
          finalSubdomain = `custom-${emailHash}-${timestamp}`.substring(0, 50);
        } else {
          // Usar subdomínio verificado
          finalSubdomain = finalDomain;
        }

        // Criar landing page primeiro
        const newLp = await createLandingPage({
          subdomain: finalSubdomain,
          customDomain: customDomainToSave,
          chosenDomain: chosenDomainForEmail, // Domínio completo escolhido pelo usuário (com extensão)
          cpf: cpfToSend || null, // CPF apenas quando não há domínio próprio (já validado e limpo acima)
          briefing,
          content,
          design,
          visibility,
          layoutVariant,
        });
        landingPageId = newLp.id;
        landingPageSubdomain = newLp.subdomain;
        landingPageCustomDomain = newLp.custom_domain || null;

        // Fazer upload de fotos se necessário (após criar a landing page)
        let uploadedPhotoUrl = photoUrl;
        let uploadedAboutPhotoUrl = aboutPhotoUrl;

        if (photoUrl && photoUrl.startsWith('data:')) {
          try {
            uploadedPhotoUrl = await uploadPhotoFromBase64(photoUrl, landingPageId, 'profile');
          } catch (photoError) {
            console.error('Erro ao fazer upload da foto de perfil:', photoError);
            // Continuar sem foto se der erro
          }
        }

        if (aboutPhotoUrl && aboutPhotoUrl.startsWith('data:')) {
          try {
            uploadedAboutPhotoUrl = await uploadPhotoFromBase64(aboutPhotoUrl, landingPageId, 'about');
          } catch (photoError) {
            console.error('Erro ao fazer upload da foto do consultório:', photoError);
            // Continuar sem foto se der erro
          }
        }

        // Atualizar landing page com URLs das fotos (sempre atualizar para garantir que as URLs estão salvas)
        await updateLandingPage(landingPageId, {
          photo_url: uploadedPhotoUrl || null,
          about_photo_url: uploadedAboutPhotoUrl || null,
        });

      }

      // Vincular lead à landing page quando disponível
      if (leadId && leadId !== 'dev-lead-id') {
        try {
          await linkLeadToLandingPage(leadId, landingPageId);
        } catch (linkError) {
          console.warn('Erro ao vincular lead à landing page:', linkError);
        }
      }

      // Criar Checkout Session no Stripe
      const landingPageDataPayload = {
        briefing,
        content,
        design,
        visibility,
        layoutVariant,
        photoUrl,
        aboutPhotoUrl,
        domain: finalDomain, // Subdomínio apenas (para criar landing page)
        chosenDomain: chosenDomainForEmail, // Domínio completo escolhido (com extensão: ex: "testefinaldocpage.com.br")
        hasCustomDomain,
        customDomain: hasCustomDomain ? customDomainValue : null,
      };
      
      const checkoutSession = await createCheckoutSession({
        planId: plan.id,
        billingPeriod: period,
        couponCode: couponCode.trim() || undefined,
        userId: user.id,
        userEmail: email, // SEMPRE usar email informado no Step 1 (campo "Email de Acesso")
        cpf: cpfToSend, // CPF apenas quando não há domínio próprio (já validado e limpo acima)
        landingPageData: landingPageDataPayload,
      });

      trackCheckoutStep(4, 'Redirecionando para Stripe Checkout');
      
      // Salvar estado no localStorage antes de redirecionar para o Stripe
      // Isso permite restaurar o estado quando o usuário voltar com canceled=true
      try {
        const stateToSave = {
          briefing,
          content,
          design,
          visibility,
          layoutVariant,
          photoUrl,
          aboutPhotoUrl,
          step: 5,
          pricingViewMode: 'checkout',
          selectedPlan: plan,
          billingPeriod: period,
        };
        localStorage.setItem('checkout_state', JSON.stringify(stateToSave));
      } catch (saveError) {
        console.warn('Erro ao salvar estado no localStorage:', saveError);
      }
      
      // Redirecionar para Stripe Checkout
      if (checkoutSession.url) {
        window.location.href = checkoutSession.url;
      } else {
        throw new Error('URL de checkout não retornada');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar sessão de checkout';
      setError(errorMessage);
      onError?.(errorMessage);
      setIsLoading(false);
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
                 Domínio: {domain && (domain.includes('.com.br') || domain.includes('.med.br') || domain.includes('.com') || domain.includes('.br')) ? domain : `${selectedDomain}${domainExtension}`}
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
                  
                  {/* Toggle para domínio próprio */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700 cursor-pointer" htmlFor="hasCustomDomain">
                        Já tenho domínio próprio
                      </label>
                      <button
                        type="button"
                        id="hasCustomDomain"
                        onClick={() => {
                          setHasCustomDomain(!hasCustomDomain);
                          if (!hasCustomDomain) {
                            // Ao ativar, limpar estados de verificação
                            setIsDomainAvailable(null);
                            setSelectedDomain(null);
                            setDomainError(null);
                            setDomain('');
                            setCustomDomainValue('');
                          } else {
                            // Ao desativar, limpar domínio customizado
                            setCustomDomainValue('');
                          }
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          hasCustomDomain ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            hasCustomDomain ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Mensagem de alerta quando toggle está ativo */}
                  {hasCustomDomain && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-amber-800">
                          Como você já possui o domínio próprio, nossa equipe de atendimento irá entrar em contato com você para realizar as configurações necessárias para seu domínio exibir o seu novo site.
                        </p>
                      </div>
                    </div>
                  )}

                  {!hasCustomDomain && (
                    <label className="block text-xs font-medium text-gray-700">Qual será o endereço do seu site? (Incluir a extensão. Ex: .com.br)</label>
                  )}

                  {hasCustomDomain ? (
                    /* Campo para domínio próprio */
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-700">Informe seu domínio:</label>
                      <input
                        type="text"
                        value={customDomainValue}
                        onChange={(e) => {
                          setCustomDomainValue(e.target.value.trim());
                        }}
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="exemplo.com.br"
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                      />
                    </div>
                  ) : (
                    <>
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
                        placeholder="drjoaosilva.com.br"
                        disabled={isCheckingDomain || isDomainAvailable === true || hasCustomDomain}
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCheckDomain}
                      disabled={isCheckingDomain || !domain || isDomainAvailable === true || domain.length < 3 || hasCustomDomain}
                      className={`w-full inline-flex items-center justify-center px-4 py-4 rounded-lg border text-base font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
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
                      placeholder="drjoaosilva.com.br"
                      disabled={isCheckingDomain || isDomainAvailable === true || hasCustomDomain}
                      autoComplete="off"
                      autoCapitalize="off"
                      autoCorrect="off"
                    />
                    <button
                      type="button"
                      onClick={handleCheckDomain}
                      disabled={isCheckingDomain || !domain || isDomainAvailable === true || domain.length < 3 || hasCustomDomain}
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
                    </>
                  )}

                  {!hasCustomDomain && (
                    <>
                      {domainError && (
                        <p className="text-xs text-red-500">{domainError}</p>
                      )}

                      {isDomainAvailable === true && (
                        <>
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

                          {/* Campo de CPF */}
                          <div className="mt-4 space-y-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              CPF <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={cpf ? cpf.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2') : ''}
                              onChange={(e) => {
                                // Formatar CPF (apenas números)
                                const value = e.target.value.replace(/\D/g, '');
                                if (value.length <= 11) {
                                  setCpf(value);
                                  setCpfError('');
                                }
                              }}
                              onBlur={() => {
                                // Validar CPF quando sair do campo
                                const cpfDigits = cpf.replace(/\D/g, '');
                                if (cpfDigits.length !== 11) {
                                  setCpfError('CPF deve ter 11 dígitos');
                                } else {
                                  setCpfError('');
                                }
                              }}
                              className={`w-full p-3 border rounded-lg outline-none ${
                                cpfError ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                              }`}
                              placeholder="000.000.000-00"
                              maxLength={14}
                              required
                            />
                            {cpfError && (
                              <p className="text-xs text-red-500">{cpfError}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              Vamos utilizar esse dado pessoal para registrar o domínio escolhido em seu nome.
                            </p>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {!hasCustomDomain && (
                    <>
                      {isDomainAvailable === false && !domainError && (
                        <p className="text-xs text-red-500">Este domínio não está disponível. Tente outro.</p>
                      )}

                      {isDomainAvailable === true && (
                        <button
                          onClick={() => {
                            // Validar CPF antes de continuar
                            const cpfDigits = cpf.replace(/\D/g, '');
                            if (cpfDigits.length !== 11) {
                              setCpfError('Por favor, informe um CPF válido (11 dígitos)');
                              return;
                            }
                            setCpfError('');
                            trackCheckoutStep(3, 'Dados de pagamento');
                            setCurrentStep(3);
                          }}
                          disabled={cpf.replace(/\D/g, '').length !== 11}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Próximo →
                        </button>
                      )}
                    </>
                  )}

                  {hasCustomDomain && customDomainValue && (
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
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">3. Finalizar Pagamento</h3>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <p className="text-blue-900 font-medium mb-1">Domínio selecionado:</p>
                    <p className="text-blue-700">
                      {hasCustomDomain 
                        ? customDomainValue 
                        : (domain && (domain.includes('.com.br') || domain.includes('.med.br') || domain.includes('.com') || domain.includes('.br')) ? domain : `${selectedDomain}${domainExtension}`)}
                    </p>
                    {hasCustomDomain && (
                      <p className="text-xs text-blue-600 mt-1 italic">
                        Domínio próprio - nossa equipe entrará em contato
                      </p>
                    )}
                  </div>

                  {/* Campo de cupom */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Código de Cupom (opcional)
                    </label>
                    <input 
                      type="text" 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Ex: CUPOM10"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tem um cupom de desconto? Digite aqui.
                    </p>
                  </div>

                  {/* Informação sobre Stripe Checkout */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <div>
                        <p className="font-medium text-green-900 mb-1">Pagamento Seguro</p>
                        <p className="text-green-700 text-xs">
                          Você será redirecionado para a página segura do Stripe para finalizar o pagamento. 
                          Aceitamos cartões de crédito e débito.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={
                      isLoading || 
                      (hasCustomDomain ? !customDomainValue : !selectedDomain)
                    }
                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Preparando checkout...
                      </>
                    ) : (
                      <>
                        Ir para Pagamento Seguro
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </button>
                  
                  <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    Pagamento processado pelo Stripe - 100% seguro
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
