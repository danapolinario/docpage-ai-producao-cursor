import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const SEO_TITLE = 'Como Divulgar seu Site Médico: Guia Pós-Publicação | DocPage AI';
const SEO_DESCRIPTION =
  'Acabou de criar seu site médico? Veja como colocar seu link no Instagram, WhatsApp e configurar o Google Meu Negócio para atrair mais pacientes hoje mesmo.';

export const GuiaSucessoPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>{SEO_TITLE}</title>
        <meta name="description" content={SEO_DESCRIPTION} />
      </Helmet>

      <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
            <Link
              to="/"
              className="flex items-center gap-2 text-slate-900 hover:text-blue-600 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-500 rounded-lg shadow-lg shadow-blue-900/20 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="8" cy="8" r="1.5" fill="currentColor" opacity="0.9" />
                  <circle cx="16" cy="8" r="1.5" fill="currentColor" opacity="0.9" />
                  <circle cx="12" cy="16" r="1.5" fill="currentColor" opacity="0.9" />
                  <path
                    d="M8 8 L12 16 M16 8 L12 16 M8 8 L16 8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                </svg>
              </div>
              <span className="font-bold text-xl tracking-tight">DocPage AI</span>
            </Link>
            <Link
              to="/"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar ao início
            </Link>
          </div>
        </nav>

        {/* Conteúdo */}
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 md:py-14">
          <article className="prose prose-slate prose-lg max-w-none">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Guia de Sucesso Digital para Médicos
            </h1>
            <p className="text-slate-600 text-lg mb-8">
              🚀 Parabéns, Doutor(a)! Seu site está no ar.
            </p>
            <p className="text-slate-700 leading-relaxed mb-8">
              Agora que o DocPage AI gerou sua estrutura, o próximo passo é garantir que seus pacientes te encontrem. Siga este checklist de ouro:
            </p>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                1. Onde divulgar seu novo link (Visibilidade Imediata)
              </h2>
              <p className="text-slate-700 mb-4">
                Seu site é seu novo cartão de visitas digital. Certifique-se de que ele esteja em todos os pontos de contato:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>
                  <strong>Bio do Instagram:</strong> Altere o &quot;link na bio&quot;. Use uma chamada clara: &quot;Agende sua consulta e conheça minha trajetória aqui: [URL]&quot;.
                </li>
                <li>
                  <strong>WhatsApp (Pessoal e Business):</strong> No perfil do WhatsApp, há um campo específico para &quot;Site&quot;. Isso transmite confiança imediata antes mesmo da primeira mensagem.
                </li>
                <li>
                  <strong>Assinatura de E-mail:</strong> Adicione o link abaixo do seu nome em todos os e-mails enviados. Ex: &quot;Dr. [Nome] | [Especialidade] | www.seusite.com.br&quot;.
                </li>
                <li>
                  <strong>LinkedIn:</strong> Atualize sua seção de &quot;Informações de Contato&quot; e publique um post contando a novidade para sua rede profissional.
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                2. Domine o Google Local (Google Meu Negócio)
              </h2>
              <p className="text-slate-700 mb-4">
                Aparecer no mapa do Google é o que diferencia médicos com agenda cheia.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>
                  <strong>Crie ou Reivindique sua ficha:</strong> Vá ao Google Business Profile e insira o link do seu site DocPage lá. Isso ajuda o Google a entender que você é uma autoridade local.
                </li>
                <li>
                  <strong>Unificação de Dados:</strong> Garanta que o telefone e o endereço no Google sejam exatamente os mesmos que você colocou no DocPage. O Google ama essa consistência para o SEO.
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                3. Ciclo de Prova Social (Avaliações)
              </h2>
              <p className="text-slate-700 mb-4">
                Depoimentos reais são o maior gatilho de decisão para um paciente.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>
                  <strong>Peça avaliações:</strong> Envie uma mensagem após a consulta.
                </li>
                <li>
                  <strong>Mensagem padrão sugerida:</strong> &quot;Olá, aqui é do consultório do Dr(a). [Nome]. Ficamos muito felizes em atender você! Poderia dedicar 30 segundos para avaliar nosso atendimento no Google? Sua opinião ajuda outros pacientes: [Link do Google]&quot;
                </li>
                <li>
                  <strong>Exiba no seu site:</strong> Assim que receber um feedback positivo, você pode transcrevê-lo para a seção de avaliações do seu painel DocPage (respeitando sempre as normas éticas do CFM).
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                4. Explore seu Painel DocPage AI
              </h2>
              <p className="text-slate-700 mb-4">
                Seu site não é estático; ele cresce com você. No seu login, você tem controle total:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>
                  <strong>Estatísticas de Acesso:</strong> Veja quantas pessoas visitaram seu site e quantos cliques o botão do WhatsApp recebeu. Use isso para entender se seu tráfego está crescendo.
                </li>
                <li>
                  <strong>Edição em Tempo Real:</strong> Mudou de consultório? Adicionou um novo serviço? Você mesmo edita os textos e fotos em segundos, sem depender de programadores.
                </li>
                <li>
                  <strong>Gestão de Depoimentos:</strong> Ative ou desative depoimentos conforme novos pacientes enviarem feedbacks, mantendo sua vitrine sempre atualizada.
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-3 text-slate-800">
                ➕ Sugestões de Conteúdo Extra (Foco em SEO e Valor)
              </h2>
              <p className="text-slate-700 mb-6">
                Para tornar a página completa e atrair tráfego orgânico para o DocPage, adicione estas seções:
              </p>

              <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-2">5. QR Code no Consultório (Conexão Físico-Digital)</h3>
              <p className="text-slate-700 mb-2">
                <strong>Conteúdo:</strong> &quot;Coloque um pequeno display na sua recepção ou cartão de visitas com um QR Code levando para o seu site. Isso facilita que o paciente veja seu currículo, convênios atendidos e prepare as dúvidas para a consulta.&quot;
              </p>
              <p className="text-slate-600 text-sm">
                <strong>Ganho:</strong> Resolve a dúvida do médico sobre como usar o site no &quot;mundo real&quot;.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-2">6. Guia Rápido de Ética Médica (CFM)</h3>
              <p className="text-slate-700 mb-2">
                <strong>Conteúdo:</strong> &quot;Lembre-se: no seu site, evite fotos de &apos;antes e depois&apos; de pacientes ou promessas de resultados garantidos. O DocPage AI já te ajuda com isso, mas manter o conteúdo focado em educação e informação é a chave para o compliance.&quot;
              </p>
              <p className="text-slate-600 text-sm">
                <strong>SEO:</strong> Excelente para palavras-chave como &quot;Publicidade Médica CFM&quot; e &quot;Regras de Marketing para Médicos&quot;.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-2">7. Otimização de Conteúdo para Google (SEO Local)</h3>
              <p className="text-slate-700 mb-2">
                <strong>Conteúdo:</strong> &quot;Sempre que editar sua bio ou serviços, tente incluir o nome da sua cidade e região. Ex: &apos;Pediatra em Pinheiros, São Paulo&apos;. Isso ajuda o Google a te mostrar para quem está por perto.&quot;
              </p>
            </section>

            <section className="mb-10 pt-6 border-t border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Onde inserir o link do seu site médico?
              </h2>
              <p className="text-slate-700 mb-4">
                Use os canais acima (Instagram, WhatsApp, e-mail, LinkedIn) para que pacientes e colegas acessem seu site com um clique.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Como configurar o Google Meu Negócio para Médicos
              </h2>
              <p className="text-slate-700">
                Vincule o perfil do seu consultório ao site DocPage, mantenha telefone e endereço iguais em todos os lugares e peça avaliações após as consultas para fortalecer sua presença local.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Como gerenciar avaliações de pacientes de forma ética
              </h2>
              <p className="text-slate-700">
                Solicite avaliações no Google após o atendimento e, com o consentimento do paciente, transcreva depoimentos positivos para a seção de avaliações do seu site, sempre em conformidade com as normas do CFM.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Maximizando os recursos do seu painel DocPage
              </h2>
              <p className="text-slate-700">
                Aproveite as estatísticas de acesso, a edição em tempo real e a gestão de depoimentos no painel para manter seu site sempre atualizado e alinhado ao crescimento do seu consultório.
              </p>
            </section>
          </article>
        </main>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-sm mt-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg" />
                <span className="font-bold text-xl text-white">DocPage AI</span>
              </div>
              <div className="flex flex-wrap justify-center gap-6">
                <Link to="/" className="hover:text-white transition-colors">
                  Início
                </Link>
                <Link to="/termos-de-uso" className="hover:text-white transition-colors">
                  Termos de Uso
                </Link>
                <Link to="/politica-de-privacidade" className="hover:text-white transition-colors">
                  Política de Privacidade
                </Link>
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
