/**
 * Fluxo completo de pagamento e criação de landing page
 * 
 * Este serviço gerencia todo o processo após o pagamento:
 * 1. Processar pagamento (Stripe)
 * 2. Criar conta do usuário (se não existir)
 * 3. Autenticar usuário
 * 4. Criar landing page no Supabase
 * 5. Fazer upload de fotos (se houver)
 * 6. Publicar landing page
 */

// Não precisamos mais de signUp/signIn aqui, o usuário já está autenticado no Step 1
import { createLandingPage, updateLandingPage, generateSubdomain, checkSubdomainAvailability } from './landing-pages';
import { uploadPhotoFromBase64 } from './storage';
import { processPayment } from './stripe';
import { supabase } from '../lib/supabase';
import { BriefingData, LandingPageContent, DesignSettings } from '../types';

export interface PaymentFlowData {
  email: string;
  // Password removido - autenticação agora é via OTP
  name: string;
  domain: string;
  planId: string;
  planPrice: number;
  briefing: BriefingData;
  content: LandingPageContent;
  design: DesignSettings;
  visibility: any;
  layoutVariant: number;
  photoUrl: string | null;
  aboutPhotoUrl: string | null;
  cardNumber: string;
  expiry: string;
  cvc: string;
  cardName: string;
}

export interface PaymentFlowResult {
  success: boolean;
  landingPageId?: string;
  landingPageUrl?: string;
  error?: string;
}

/**
 * Processar fluxo completo: Pagamento + Criação de Conta + Landing Page
 */
export async function processCompletePaymentFlow(
  data: PaymentFlowData
): Promise<PaymentFlowResult> {
  try {
    // 1. Processar pagamento com Stripe
    const paymentResult = await processPayment({
      planId: data.planId,
      planPrice: data.planPrice,
      email: data.email,
      name: data.name,
      domain: data.domain,
      landingPageData: {
        briefing: data.briefing,
        content: data.content,
        design: data.design,
      },
    });

    if (!paymentResult.success) {
      return {
        success: false,
        error: paymentResult.error || 'Erro ao processar pagamento',
      };
    }

    // 2. Verificar se usuário está autenticado (já deve estar autenticado do Step 1)
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    
    if (!user || !user.id) {
      // Tentar obter da sessão
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return {
          success: false,
          error: 'Usuário não autenticado. Por favor, faça login novamente.',
        };
      }
      
      // Refresh da sessão se necessário
      if (!user) {
        await supabase.auth.refreshSession();
        const { data: { user: refreshedUser } } = await supabase.auth.getUser();
        
        if (!refreshedUser) {
          return {
            success: false,
            error: 'Sessão inválida. Por favor, faça login novamente.',
          };
        }
      }
    }
    
    const userId = user?.id;

    // 3. Gerar subdomínio a partir do domínio escolhido
    const subdomain = data.domain
      .replace(/^www\./, '')
      .replace(/\.(com|com\.br|med\.br)$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Validar disponibilidade do subdomínio (já foi verificado no Step 2, mas verificamos novamente por segurança)
    const availability = await checkSubdomainAvailability(subdomain);
    
    if (!availability.available) {
      // Domínio não disponível - retornar erro (já foi verificado no Step 2, mas alguém pode ter reservado entre o tempo)
      return {
        success: false,
        error: availability.error || 'Este domínio não está mais disponível. Por favor, escolha outro.',
      };
    }
    
    const finalSubdomain = subdomain; // Usar o subdomínio escolhido

    // 4. Fazer upload de fotos se houver (base64 -> Supabase Storage)
    let uploadedPhotoUrl = data.photoUrl;
    let uploadedAboutPhotoUrl = data.aboutPhotoUrl;

    // Verificar novamente autenticação antes de criar landing page
    const { data: { user: currentUser }, error: getUserError2 } = await supabase.auth.getUser();
    
    if (!currentUser || currentUser.id !== userId) {
      return {
        success: false,
        error: 'Sessão de autenticação inválida. Por favor, faça login novamente.',
      };
    }

    // Criar landing page primeiro para ter um ID
    const landingPage = await createLandingPage({
      subdomain: finalSubdomain,
      briefing: data.briefing,
      content: data.content,
      design: data.design,
      visibility: data.visibility,
      layoutVariant: data.layoutVariant,
    });

    // Upload de fotos após criar landing page (precisa do ID)
    if (data.photoUrl) {
      try {
        if (data.photoUrl.startsWith('data:')) {
          // Foto em base64 (upload para Storage)
          uploadedPhotoUrl = await uploadPhotoFromBase64(
            data.photoUrl,
            landingPage.id,
            'profile'
          );
        } else {
          // Já é uma URL (por exemplo, gerada pela IA) – apenas persistir no banco
          uploadedPhotoUrl = data.photoUrl;
        }
      } catch (error) {
        console.error('Erro ao processar foto de perfil:', error);
      }
    }

    if (data.aboutPhotoUrl) {
      try {
        if (data.aboutPhotoUrl.startsWith('data:')) {
          uploadedAboutPhotoUrl = await uploadPhotoFromBase64(
            data.aboutPhotoUrl,
            landingPage.id,
            'about'
          );
        } else {
          uploadedAboutPhotoUrl = data.aboutPhotoUrl;
        }
      } catch (error) {
        console.error('Erro ao processar foto do consultório:', error);
      }
    }

    // 5. Atualizar landing page com URLs das fotos (sempre que houver valores)
    await updateLandingPage(landingPage.id, {
      photo_url: uploadedPhotoUrl || null,
      about_photo_url: uploadedAboutPhotoUrl || null,
    });

    // 6. Landing page criada com status 'draft'
    // Admin precisa alterar para 'published' para a landing page ficar visível
    // (Não chamamos publishLandingPage aqui)

    // 7. Garantir que a sessão está ativa após criar a landing page
    // Refresh da sessão para garantir que está sincronizada
    await supabase.auth.refreshSession();
    
    // Verificar novamente se usuário está autenticado
    const { data: { user: finalUser } } = await supabase.auth.getUser();
    if (!finalUser || !finalUser.id) {
      console.error('Erro: Usuário não autenticado após criar landing page');
      throw new Error('Erro ao manter sessão. Por favor, faça login novamente.');
    }
    
    console.log('Landing page criada com sucesso (aguardando publicação pelo admin):', {
      landingPageId: landingPage.id,
      userId: finalUser.id,
      subdomain: landingPage.subdomain,
      status: 'draft'
    });

    // 8. Construir URL final (será acessível após admin publicar)
    const landingPageUrl = `https://${landingPage.subdomain}.docpage.com.br`;

    return {
      success: true,
      landingPageId: landingPage.id,
      landingPageUrl,
    };
  } catch (error: any) {
    console.error('Erro no fluxo de pagamento completo:', error);
    return {
      success: false,
      error: error.message || 'Erro ao processar pagamento e criar landing page',
    };
  }
}
