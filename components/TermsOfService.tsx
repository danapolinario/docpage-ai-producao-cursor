import React from 'react';
import { Helmet } from 'react-helmet-async';

export const TermsOfService: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Termos de Uso - DocPage AI</title>
        <meta name="description" content="Termos de uso do DocPage AI - Plataforma de criação de sites profissionais para médicos" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Termos de Uso</h1>
          <p className="text-sm text-gray-500 mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          
          <div className="prose prose-slate max-w-none">
            
            <div className="space-y-6 text-gray-700">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Aceitação dos Termos</h2>
                <p>
                  Ao acessar e usar o DocPage AI, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Descrição do Serviço</h2>
                <p>
                  O DocPage AI é uma plataforma SaaS que permite a criação de sites profissionais para médicos e profissionais da saúde.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Uso do Serviço</h2>
                <p>
                  Você concorda em usar o serviço apenas para fins legais e de acordo com estes termos. É proibido usar o serviço para qualquer propósito ilegal ou não autorizado.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Conta do Usuário</h2>
                <p>
                  Você é responsável por manter a confidencialidade de sua conta e senha. Você concorda em notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Propriedade Intelectual</h2>
                <p>
                  Todo o conteúdo do DocPage AI, incluindo mas não limitado a textos, gráficos, logos, ícones, imagens e software, é propriedade do DocPage AI ou de seus fornecedores de conteúdo.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Limitação de Responsabilidade</h2>
                <p>
                  O DocPage AI não será responsável por quaisquer danos diretos, indiretos, incidentais, especiais ou consequenciais resultantes do uso ou incapacidade de usar o serviço.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Modificações dos Termos</h2>
                <p>
                  Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após a publicação.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contato</h2>
                <p>
                  Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco através do email: docpageai@gmail.com
                </p>
              </section>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <a 
              href="/"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar para o início
            </a>
          </div>
        </div>
      </div>
    </>
  );
};
