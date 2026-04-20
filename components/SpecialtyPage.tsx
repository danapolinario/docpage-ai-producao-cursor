import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SPECIALTIES, SLUG_TO_KEY } from '../lib/specialties-data';

/** Home com modal de captura de lead (evita retomar briefing salvo). */
const HOME_WITH_LEAD_MODAL = '/?openLead=1';

const DocPageLogo = () => (
  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-500 rounded-lg shadow-lg shadow-blue-900/20 flex items-center justify-center">
    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="8" cy="8" r="1.5" fill="currentColor" opacity="0.9" />
      <circle cx="16" cy="8" r="1.5" fill="currentColor" opacity="0.9" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" opacity="0.9" />
      <path d="M8 8 L12 16 M16 8 L12 16 M8 8 L16 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  </div>
);

const CheckIcon = () => (
  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export const SpecialtyPage: React.FC = () => {
  const { especialidade } = useParams<{ especialidade: string }>();
  const navigate = useNavigate();

  const key = especialidade ? SLUG_TO_KEY[especialidade] : undefined;
  const specialty = key ? SPECIALTIES[key] : undefined;

  const handleStart = () => {
    navigate(HOME_WITH_LEAD_MODAL);
  };

  if (!specialty) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-slate-900 px-4">
        <Helmet>
          <title>Especialidade não encontrada | DocPage AI</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <h1 className="text-2xl font-bold mb-4">Especialidade não encontrada</h1>
        <p className="text-slate-600 mb-6">A página que você está buscando não existe.</p>
        <Link to="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
          Voltar ao início
        </Link>
      </div>
    );
  }

  const canonicalUrl = `https://docpage.com.br/site-para/${specialty.slug}`;

  const faqEntities = specialty.faq.map((item) => ({
    '@type': 'Question' as const,
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer' as const,
      text: item.answer,
    },
  }));

  /** Um único FAQPage nomeado; WebPage em paralelo (sem FAQ aninhado) — exige Google Search Console. */
  const schemaOrg = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: specialty.titulo,
        description: specialty.descricao,
        isPartOf: {
          '@type': 'WebSite',
          name: 'DocPage AI',
          url: 'https://docpage.com.br',
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${canonicalUrl}#faq`,
        name: `Perguntas frequentes — site para ${specialty.nomeProfissional}`,
        mainEntity: faqEntities,
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{specialty.titulo}</title>
        <meta name="description" content={specialty.descricao} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={specialty.titulo} />
        <meta property="og:description" content={specialty.descricao} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(schemaOrg)}</script>
      </Helmet>

      <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
            <Link to={HOME_WITH_LEAD_MODAL} className="flex items-center gap-2 text-slate-900 hover:text-blue-600 transition-colors">
              <DocPageLogo />
              <span className="font-bold text-xl tracking-tight">DocPage AI</span>
            </Link>
            <button
              onClick={handleStart}
              className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Criar meu site grátis
            </button>
          </div>
        </nav>

        {/* Hero */}
        <main className="flex-1">
          <section className="bg-gradient-to-b from-blue-50 to-white py-14 md:py-20 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Criado com IA em minutos
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight mb-4">
                {specialty.titulo}
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed">
                {specialty.subtitulo}
              </p>
              <button
                onClick={handleStart}
                className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-8 py-4 rounded-xl text-lg hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/25"
              >
                Criar meu site de {specialty.nomeProfissional} grátis
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <p className="text-sm text-slate-500 mt-3">Sem cartão de crédito · Em conformidade com o CFM</p>
            </div>
          </section>

          {/* Benefícios */}
          <section className="py-14 md:py-20 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-4">
                Por que {specialty.nomeProfissional}s escolhem o DocPage AI
              </h2>
              <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
                Seu site médico pronto em minutos, com conteúdo profissional gerado por IA e totalmente adaptado à sua especialidade.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                {specialty.beneficios.map((beneficio, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all"
                  >
                    <div className="text-3xl mb-4">{beneficio.icon}</div>
                    <h3 className="font-bold text-slate-900 text-lg mb-3 leading-snug">{beneficio.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{beneficio.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Diferenciais DocPage */}
          <section className="bg-blue-600 py-14 md:py-16 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                    Tudo que seu site de {specialty.nomeProfissional} precisa, em um só lugar
                  </h2>
                  <p className="text-blue-100 mb-6 leading-relaxed">
                    O DocPage AI gera automaticamente o conteúdo, o design e as configurações de SEO para que seu site apareça no Google para os pacientes certos.
                  </p>
                  <button
                    onClick={handleStart}
                    className="bg-white text-blue-600 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    Começar agora — é grátis
                  </button>
                </div>
                <div className="space-y-4">
                  {[
                    'Site profissional pronto em minutos com IA',
                    'Conteúdo 100% em conformidade com as normas do CFM',
                    'SEO otimizado para buscas locais da sua especialidade',
                    'Botão de WhatsApp integrado para facilitar agendamentos',
                    'Design responsivo e adaptado para mobile',
                    'Domínio personalizado disponível',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckIcon />
                      <span className="text-white text-sm leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="py-14 md:py-20 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-4">
                Perguntas frequentes
              </h2>
              <p className="text-slate-600 text-center mb-10">
                Tudo o que {specialty.nomeProfissional}s perguntam antes de criar seu site
              </p>
              <div className="space-y-4">
                {specialty.faq.map((item, i) => (
                  <details
                    key={i}
                    className="group border border-slate-200 rounded-xl overflow-hidden"
                  >
                    <summary className="flex justify-between items-center px-6 py-5 cursor-pointer font-semibold text-slate-900 hover:bg-slate-50 transition-colors list-none">
                      <span>{item.question}</span>
                      <svg
                        className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-6 pb-5 text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* CTA final */}
          <section className="bg-slate-900 py-14 md:py-20 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Crie seu site de {specialty.nomeProfissional} agora
              </h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Em minutos, você terá um site profissional, otimizado para o Google e em conformidade com o CFM — pronto para atrair novos pacientes.
              </p>
              <button
                onClick={handleStart}
                className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-8 py-4 rounded-xl text-lg hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/40"
              >
                Criar meu site grátis
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <p className="text-slate-600 text-sm mt-3">Sem cartão de crédito · Sem compromisso</p>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg" />
                <span className="font-bold text-xl text-white">DocPage AI</span>
              </div>
              <div className="flex flex-wrap justify-center gap-6">
                <Link to={HOME_WITH_LEAD_MODAL} className="hover:text-white transition-colors">Início</Link>
                <Link to="/termos-de-uso" className="hover:text-white transition-colors">Termos de Uso</Link>
                <Link to="/politica-de-privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-600">
              © {new Date().getFullYear()} DocPage AI. Todos os direitos reservados.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};
