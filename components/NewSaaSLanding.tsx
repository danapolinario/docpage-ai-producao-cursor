
import React, { useState, useEffect } from 'react';

interface Props {
  onStart: () => void;
  onDevNavigation?: (step: number, mode?: 'plans' | 'checkout' | 'dashboard') => void;
  onSwitchVersion: () => void;
}

export const NewSaaSLanding: React.FC<Props> = ({ onStart, onDevNavigation, onSwitchVersion }) => {
  const [specialty, setSpecialty] = useState('');
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleDevClick = (step: number, mode?: 'plans' | 'checkout' | 'dashboard') => {
    if (onDevNavigation) {
      onDevNavigation(step, mode);
      setShowDevMenu(false);
    }
  };

  // Mockup Text Animation based on Input
  const displaySpecialty = specialty || "Dermatologia";

  const specialtiesList = [
    "Cardiologia", "Dermatologia", "Pediatria", "Ortopedia", "Ginecologia", 
    "Oftalmologia", "Psiquiatria", "Neurologia", "Endocrinologia", "Nutrologia", 
    "Cirurgia Plástica", "Urologia", "Geriatria", "Otorrinolaringologia"
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-[#0A4D8C]">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all duration-300 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-8 h-8 bg-gradient-to-br from-[#0A4D8C] to-[#00A86B] rounded-lg shadow-lg shadow-blue-900/10"></div>
            <span className="font-bold text-xl tracking-tight text-[#0A4D8C]">DocPage AI</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#solucao" className="hover:text-[#0A4D8C] transition-colors">Como Funciona</a>
            <a href="#comparativo" className="hover:text-[#0A4D8C] transition-colors">Diferenciais</a>
            <a href="#precos" className="hover:text-[#0A4D8C] transition-colors">Preços</a>
          </div>

          <div className="flex items-center gap-4">
             {/* DEV MENU REPLICATED */}
             {onDevNavigation && (
                <div className="relative">
                   <button 
                     onClick={() => setShowDevMenu(!showDevMenu)}
                     className={`text-xs font-mono flex items-center gap-1 transition-colors px-2 py-1 rounded ${showDevMenu ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}
                   >
                     Dev Menu 🛠️
                   </button>
                   {showDevMenu && (
                     <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 animate-fade-in">
                        <div className="py-1">
                           <button onClick={onSwitchVersion} className="block w-full text-left px-4 py-2 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100">
                             ↺ Voltar para V1 (Antiga)
                           </button>
                           <div className="border-t border-gray-100 my-1"></div>
                           <button onClick={() => handleDevClick(0)} className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100">Step 1: Dados</button>
                           <button onClick={() => handleDevClick(1)} className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100">Step 2: Conteúdo</button>
                           <button onClick={() => handleDevClick(2)} className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100">Step 3: Foto</button>
                           <button onClick={() => handleDevClick(3)} className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100">Step 4: Visual</button>
                           <button onClick={() => handleDevClick(4)} className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100">Step 5: Editor</button>
                           <div className="border-t border-gray-100 my-1"></div>
                           <button onClick={() => handleDevClick(5, 'dashboard')} className="block w-full text-left px-4 py-2 text-xs text-purple-600 hover:bg-purple-50 font-bold">Dashboard</button>
                        </div>
                     </div>
                   )}
                </div>
             )}
             <button onClick={onStart} className="text-sm font-bold text-[#0A4D8C] hover:bg-blue-50 px-5 py-2.5 rounded-full transition-colors">
               Login
             </button>
             <button onClick={onStart} className="hidden md:block text-sm font-bold text-white bg-[#0A4D8C] hover:bg-[#083d70] px-6 py-2.5 rounded-full shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 hover:shadow-blue-900/30">
               Criar Grátis
             </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        
        {/* Visual Improvement 1: Technical Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white"></div>

        {/* Blobs */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-3xl -mr-40 -mt-40 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-green-50/40 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          
          {/* Left: Copy */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/80 backdrop-blur border border-green-200 rounded-full text-[#00A86B] text-xs font-bold uppercase tracking-wider animate-fade-in shadow-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
              Conforme Resolução CFM 2.336/2023
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#0A4D8C] leading-[1.1] drop-shadow-sm">
              Sua Presença Digital Médica em <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00A86B] to-teal-400">5 Minutos</span>.
            </h1>
            
            <p className="text-lg md:text-xl text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Crie um site profissional que atrai pacientes e respeita 100% as normas éticas. Comece grátis, publique apenas quando estiver pronto.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button onClick={onStart} className="px-8 py-4 bg-[#0A4D8C] text-white rounded-full font-bold text-lg shadow-xl shadow-blue-900/20 hover:bg-[#083d70] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group">
                Criar Meu Site Grátis
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </button>
              <a href="#como-funciona" className="px-8 py-4 bg-white text-slate-600 border border-slate-200 rounded-full font-bold text-lg hover:bg-slate-50 transition-colors flex items-center justify-center hover:border-slate-300">
                Ver Como Funciona
              </a>
            </div>
            
            <p className="text-xs text-slate-400 font-medium">
              🔒 Seus dados são protegidos. Não pedimos cartão para começar.
            </p>
          </div>

          {/* Right: Live Preview Generator */}
          <div className="relative group perspective-1000">
             {/* Interactive Input Card */}
             <div className="absolute -top-12 -left-8 md:-left-12 z-30 bg-white/90 p-4 rounded-xl shadow-2xl border border-white/50 ring-1 ring-black/5 backdrop-blur-xl animate-float-2 max-w-[280px]">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Teste agora: Sua Especialidade</label>
                <div className="flex items-center gap-2 border-b-2 border-[#0A4D8C] pb-1">
                   <span className="text-xl">🩺</span>
                   <input 
                     type="text" 
                     value={specialty}
                     onChange={(e) => setSpecialty(e.target.value)}
                     placeholder="Ex: Cardiologia" 
                     className="w-full bg-transparent outline-none font-bold text-slate-800 placeholder-slate-300"
                     autoFocus
                   />
                </div>
             </div>

             {/* Mockup */}
             <div className="relative bg-slate-900 rounded-[2.5rem] border-[8px] border-slate-900 shadow-2xl overflow-hidden aspect-[9/16] md:aspect-[3/4] transform rotate-[-2deg] group-hover:rotate-0 transition-transform duration-700 mx-auto max-w-md">
                {/* Simulated Screen */}
                <div className="absolute inset-0 bg-white flex flex-col">
                   {/* Navbar */}
                   <div className="h-14 flex items-center justify-between px-6 border-b border-gray-100">
                      <div className="font-bold text-[#0A4D8C]">Dr. Silva</div>
                      <div className="w-6 h-6 bg-gray-100 rounded-full"></div>
                   </div>
                   {/* Hero Content */}
                   <div className="flex-1 bg-gradient-to-br from-blue-50 to-white p-8 flex flex-col justify-center text-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00A86B] opacity-10 rounded-full blur-2xl"></div>
                      <span className="inline-block mx-auto px-3 py-1 bg-blue-100 text-[#0A4D8C] text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">
                        {displaySpecialty}
                      </span>
                      <h2 className="text-3xl font-bold text-slate-900 mb-4 leading-tight transition-all">
                        Cuidando da sua saúde com excelência em <span className="text-[#0A4D8C]">{displaySpecialty}</span>.
                      </h2>
                      <p className="text-sm text-slate-500 mb-8">
                        Atendimento humanizado e tratamentos baseados em evidências. Agende sua consulta.
                      </p>
                      <button className="bg-[#00A86B] text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg shadow-green-500/30 w-full">
                        Agendar Consulta
                      </button>
                      
                      {/* Doctor Image Placeholder */}
                      <div className="mt-8 mx-auto w-32 h-32 rounded-full bg-gray-200 border-4 border-white shadow-lg overflow-hidden relative">
                         <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=300&q=80" className="w-full h-full object-cover" alt="Doctor" />
                      </div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </section>

      {/* --- VISUAL IMPROVEMENT 2: SCROLLING MARQUEE --- */}
      <div className="w-full bg-[#0A4D8C] py-4 overflow-hidden relative border-y border-blue-900">
         <div className="absolute inset-0 bg-gradient-to-r from-[#0A4D8C] via-transparent to-[#0A4D8C] z-10 pointer-events-none"></div>
         <div className="flex gap-8 whitespace-nowrap animate-scroll-x hover:pause">
            {[...specialtiesList, ...specialtiesList, ...specialtiesList].map((spec, i) => (
               <span key={i} className="text-white/80 text-sm font-bold uppercase tracking-widest flex items-center gap-8">
                  {spec} <span className="w-2 h-2 rounded-full bg-[#00A86B]"></span>
               </span>
            ))}
         </div>
      </div>

      {/* --- PAIN SECTION --- */}
      <section className="py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Você Não Está Sozinho Nessas Frustrações</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Construir autoridade digital não deveria ser mais difícil do que um plantão de 24 horas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "⏰",
                title: "Sem Tempo para Tecnologia",
                desc: "Atender pacientes já consome todo seu dia. Aprender WordPress ou gerenciar agências demora meses.",
                emoji: "😓"
              },
              {
                icon: "⚖️",
                title: "Medo de Processos Éticos",
                desc: "Um 'antes e depois' mal feito ou uma promessa exagerada pode te levar a uma sindicância no CRM.",
                emoji: "😨"
              },
              {
                icon: "💸",
                title: "Custos Imprevisíveis",
                desc: "Agências cobram R$ 5.000+ e ainda pedem mensalidades. Você nunca sabe o valor final.",
                emoji: "📉"
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative group overflow-hidden">
                <div className="text-4xl mb-6 bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">
                  {item.desc}
                </p>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 text-2xl">
                  {item.emoji}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-16">
             <p className="text-xl font-medium text-[#0A4D8C] bg-blue-50 inline-block px-6 py-2 rounded-full border border-blue-100">
               E se existisse uma forma de resolver tudo isso em <span className="font-bold border-b-2 border-[#00A86B]">uma tarde?</span>
             </p>
          </div>
        </div>
      </section>

      {/* --- SOLUTION / TIMELINE --- */}
      <section id="solucao" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">O Caminho Mais Simples para Sua Autoridade</h2>
            <p className="text-slate-500">6 passos gamificados. Zero código.</p>
          </div>

          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-slate-100 md:-translate-x-1/2 rounded-full"></div>
            <div className="absolute left-4 md:left-1/2 top-0 h-1/3 w-1 bg-gradient-to-b from-[#0A4D8C] to-transparent md:-translate-x-1/2 rounded-full"></div>

            {[
              { title: "Seus Dados", time: "2 min", desc: "Informe especialidade, CRM e público-alvo. Só o essencial.", side: "left" },
              { title: "IA Escreve por Você", time: "1 min", desc: "Textos persuasivos e éticos gerados automaticamente.", side: "right", highlight: true },
              { title: "Foto Profissional", time: "30 seg", desc: "Suba uma selfie. Nossa IA cria um headshot de estúdio.", side: "left" },
              { title: "Escolha o Visual", time: "1 min", desc: "5 layouts modernos. Veja em tempo real.", side: "right" },
              { title: "Ajustes Finais", time: "30 seg", desc: "Peça mudanças conversando com a IA.", side: "left" },
              { title: "No Ar!", time: "Instantâneo", desc: "Escolha seu domínio e publique.", side: "right", final: true }
            ].map((step, idx) => (
              <div key={idx} className={`relative flex items-center justify-between mb-12 md:mb-24 ${step.side === 'right' ? 'md:flex-row-reverse' : ''}`}>
                
                {/* Empty Space for alignment */}
                <div className="hidden md:block w-5/12"></div>

                {/* Node */}
                <div className={`absolute left-0 md:left-1/2 w-9 h-9 md:w-12 md:h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center z-10 md:-translate-x-1/2 font-bold text-sm ${step.final ? 'bg-[#00A86B] text-white' : 'bg-[#0A4D8C] text-white'}`}>
                  {idx + 1}
                </div>

                {/* Content Card */}
                <div className="w-full pl-16 md:pl-0 md:w-5/12">
                  <div className={`bg-white p-6 rounded-2xl border ${step.highlight ? 'border-blue-200 shadow-lg ring-1 ring-blue-100' : 'border-slate-100 shadow-sm'} hover:shadow-md transition-shadow relative`}>
                    <div className="absolute -top-3 right-4 bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                      {step.time}
                    </div>
                    <h3 className={`font-bold text-lg mb-2 ${step.final ? 'text-[#00A86B]' : 'text-slate-800'}`}>{step.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
             <button onClick={onStart} className="px-10 py-4 bg-[#00A86B] text-white rounded-full font-bold text-lg shadow-lg hover:bg-[#008f5b] hover:shadow-green-500/30 transition-all hover:scale-105">
               Começar Agora - É Grátis
             </button>
          </div>
        </div>
      </section>

      {/* --- COMPARISON SECTION --- */}
      <section id="comparativo" className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Por Que DocPage ≠ Outras Soluções?</h2>
            <p className="text-slate-400">Compare e veja porque somos a escolha nº 1 dos médicos.</p>
          </div>

          <div className="overflow-x-auto pb-8">
            <div className="min-w-[800px] bg-slate-800 rounded-2xl border border-slate-700 p-8">
              <div className="grid grid-cols-4 gap-4 mb-6 border-b border-slate-700 pb-6 text-sm font-bold uppercase tracking-wider text-slate-400">
                <div>Recurso</div>
                <div className="text-center">Agências</div>
                <div className="text-center">Wix / WordPress</div>
                <div className="text-center text-[#00A86B]">DocPage AI</div>
              </div>

              {[
                { label: 'Tempo de criação', agency: '30-60 dias', diy: '7-15 dias', doc: '5 minutos' },
                { label: 'Conhecimento técnico', agency: 'Nenhum', diy: 'Médio / Alto', doc: 'Zero' },
                { label: 'Compliance CFM', agency: 'Manual (se souberem)', diy: 'Você decide', doc: 'Automático' },
                { label: 'Custo inicial', agency: 'R$ 5.000+', diy: 'R$ 0', doc: 'R$ 0' },
                { label: 'Fotos profissionais', agency: 'R$ 800+ (Fotógrafo)', diy: 'Você contrata', doc: 'Incluído (IA)' },
              ].map((row, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-4 py-6 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 transition-colors rounded-lg px-2">
                  <div className="font-bold text-slate-200">{row.label}</div>
                  <div className="text-center text-slate-400">{row.agency}</div>
                  <div className="text-center text-slate-400">{row.diy}</div>
                  <div className="text-center font-bold text-[#00A86B] flex items-center justify-center gap-2">
                    {row.doc}
                    {idx === 2 && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- VISUAL IMPROVEMENT 3: BENTO GRID TECH SECTION --- */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Inteligência Artificial que Trabalha Para Você</h2>
            <p className="text-slate-500">Tecnologia de ponta simplificada para profissionais da saúde.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Main Feature - Spans 2 cols */}
            <div className="md:col-span-2 bg-gradient-to-br from-blue-50 to-white p-10 rounded-3xl border border-blue-100 relative overflow-hidden group hover:shadow-lg transition-shadow">
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200 rounded-full blur-3xl opacity-30 -mr-20 -mt-20 group-hover:opacity-50 transition-opacity"></div>
               <div className="flex flex-col md:flex-row gap-8 items-center h-full relative z-10">
                  <div className="flex-1 space-y-4">
                     <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl text-blue-600 shadow-sm">📝</div>
                     <h3 className="text-2xl font-bold text-[#0A4D8C]">Texto Inteligente & Ético</h3>
                     <p className="text-slate-600 leading-relaxed">
                       O Google Gemini estuda milhares de sites médicos e cria textos que convertem — mas sem nunca prometer curas ou usar termos sensacionalistas proibidos pelo CFM.
                     </p>
                  </div>
                  {/* Decorative UI Preview */}
                  <div className="w-full md:w-1/2 bg-white rounded-xl shadow-lg border border-gray-100 p-4 transform rotate-2 group-hover:rotate-0 transition-transform duration-500">
                     <div className="space-y-2">
                        <div className="h-2 w-1/3 bg-gray-200 rounded"></div>
                        <div className="h-2 w-full bg-blue-100 rounded"></div>
                        <div className="h-2 w-5/6 bg-blue-100 rounded"></div>
                        <div className="h-2 w-full bg-blue-100 rounded"></div>
                     </div>
                     <div className="mt-3 flex items-center gap-2 text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded w-fit">
                        ✓ CFM Aprovado
                     </div>
                  </div>
               </div>
            </div>

            {/* Bento Item 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-3xl border border-purple-100 relative overflow-hidden group hover:shadow-lg transition-shadow">
               <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-30 -mr-10 -mb-10"></div>
               <div className="text-4xl mb-4 bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm">📸</div>
               <h3 className="text-xl font-bold text-[#0A4D8C] mb-2">Nano Banana Studio</h3>
               <p className="text-slate-600 text-sm leading-relaxed mb-4">
                 Suba uma foto casual. Nossa IA remove o fundo, ajusta iluminação e cria uma imagem profissional digna de revista.
               </p>
               <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white shadow-sm"></div>
                  <span className="text-gray-400">→</span>
                  <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-white shadow-sm"></div>
               </div>
            </div>

            {/* Bento Item 3 */}
            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-3xl border border-green-100 relative overflow-hidden group hover:shadow-lg transition-shadow">
               <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full blur-3xl opacity-30 -mr-10 -mt-10"></div>
               <div className="text-4xl mb-4 bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm">🛡️</div>
               <h3 className="text-xl font-bold text-[#0A4D8C] mb-2">Validação em Tempo Real</h3>
               <p className="text-slate-600 text-sm leading-relaxed">
                 Toda palavra é escaneada. Se algo violar a resolução do CFM, bloqueamos automaticamente e sugerimos alternativas.
               </p>
            </div>

            {/* Bento Item 4 - Spans 2 cols */}
            <div className="md:col-span-2 bg-slate-900 p-8 rounded-3xl border border-slate-800 relative overflow-hidden flex items-center justify-between text-white hover:shadow-xl transition-shadow group">
               <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-slate-800"></div>
               <div className="relative z-10 max-w-lg">
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    SEO Automático 
                    <span className="bg-white/20 text-xs px-2 py-0.5 rounded font-normal">Google Ready</span>
                  </h3>
                  <p className="text-slate-400 text-sm">Seu site já nasce otimizado para o Google, ajudando pacientes da sua região a te encontrarem sem você precisar gastar com especialistas.</p>
               </div>
               <div className="text-6xl opacity-20 transform group-hover:scale-110 transition-transform">🔍</div>
            </div>

          </div>
        </div>
      </section>

      {/* --- PRICING (Visual Improvement 4: Shimmer Effect) --- */}
      <section id="precos" className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Preços Justos. Sem Surpresas.</h2>
            <p className="text-slate-500">Crie grátis. Pague só se publicar. Cancele quando quiser.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Starter */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all">
              <h3 className="text-lg font-bold text-slate-600 mb-2">Starter</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-slate-900">R$ 97</span>
                <span className="text-slate-500">/mês</span>
              </div>
              <ul className="space-y-4 mb-8 text-sm text-slate-600">
                <li className="flex gap-2">✓ Site completo + Hospedagem</li>
                <li className="flex gap-2">✓ Domínio Grátis (1 ano)</li>
                <li className="flex gap-2">✓ Atualizações ilimitadas</li>
                <li className="flex gap-2">✓ Suporte por email</li>
              </ul>
              <button onClick={onStart} className="w-full py-3 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors">Começar Agora</button>
            </div>

            {/* Professional (Visual Upgrade: Shimmer & Glow) */}
            <div className="bg-white p-8 rounded-2xl border-2 border-[#0A4D8C] shadow-2xl relative transform md:-translate-y-4 ring-4 ring-blue-50/50">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0A4D8C] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                Mais Popular
              </div>
              <h3 className="text-lg font-bold text-[#0A4D8C] mb-2">Profissional</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-slate-900">R$ 197</span>
                <span className="text-slate-500">/mês</span>
              </div>
              <p className="text-xs text-slate-400 mb-6">Melhor custo-benefício</p>
              <ul className="space-y-4 mb-8 text-sm text-slate-600 font-medium">
                <li className="flex gap-2 text-[#0A4D8C]">✓ Tudo do Starter</li>
                <li className="flex gap-2">✓ SEO Otimizado (Google)</li>
                <li className="flex gap-2">✓ Integração Doctoralia</li>
                <li className="flex gap-2">✓ Email Profissional</li>
                <li className="flex gap-2">✓ 4 posts/mês para Instagram</li>
              </ul>
              {/* Shimmer Button */}
              <button onClick={onStart} className="w-full py-3 bg-[#0A4D8C] text-white rounded-xl font-bold hover:bg-[#083d70] shadow-lg shadow-blue-900/20 transition-all relative overflow-hidden group">
                 <span className="relative z-10">Começar Agora</span>
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            </div>

            {/* Authority */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all">
              <h3 className="text-lg font-bold text-slate-600 mb-2">Autoridade</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-slate-900">R$ 497</span>
                <span className="text-slate-500">/mês</span>
              </div>
              <ul className="space-y-4 mb-8 text-sm text-slate-600">
                <li className="flex gap-2">✓ Tudo do Profissional</li>
                <li className="flex gap-2">✓ Gestão de Tráfego Pago</li>
                <li className="flex gap-2">✓ Consultoria Mensal</li>
                <li className="flex gap-2">✓ Posts diários</li>
              </ul>
              <button onClick={onStart} className="w-full py-3 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors">Falar com Consultor</button>
            </div>
          </div>
        </div>
      </section>

      {/* --- SOCIAL PROOF --- */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
           <div>
             <h2 className="text-3xl font-bold text-slate-900 mb-6">Médicos que já transformaram sua presença digital</h2>
             <div className="flex gap-8 mb-8">
               <div>
                 <span className="block text-3xl font-black text-[#0A4D8C]">347</span>
                 <span className="text-sm text-slate-500">Médicos ativos</span>
               </div>
               <div>
                 <span className="block text-3xl font-black text-[#00A86B]">98%</span>
                 <span className="text-sm text-slate-500">Conformidade CFM</span>
               </div>
               <div>
                 <span className="block text-3xl font-black text-yellow-500">4.8</span>
                 <span className="text-sm text-slate-500">Satisfação</span>
               </div>
             </div>
           </div>
           
           <div className="bg-slate-50 p-8 rounded-2xl relative border border-slate-100 hover:shadow-md transition-shadow">
              <div className="text-4xl text-[#0A4D8C] opacity-20 font-serif absolute top-4 left-6">“</div>
              <p className="text-lg text-slate-700 italic mb-6 relative z-10">
                Criei meu site em 6 minutos no intervalo de uma consulta. O melhor é saber que não corro riscos com o CFM. Já recebi 12 agendamentos pelo botão do WhatsApp na primeira semana.
              </p>
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-blue-200 rounded-full overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=100&q=80" alt="Dra. Ana" />
                 </div>
                 <div>
                    <div className="font-bold text-slate-900">Dra. Ana Paula</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Dermatologista • SP</div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Perguntas Frequentes</h2>
          <div className="space-y-4">
            {[
              { q: "Preciso saber programar?", a: "Não. É como usar o WhatsApp. Você conversa, clica e pronto." },
              { q: "E se o CFM não aprovar meu conteúdo?", a: "Impossível. Nossa IA bloqueia automaticamente qualquer termo proibido pela Resolução 2.336/2023." },
              { q: "Posso cancelar a qualquer momento?", a: "Sim. Sem multas, sem burocracia. Seu site fica no ar até o fim do mês pago." },
              { q: "O domínio é meu?", a: "Sim. Se você cancelar, pode transferir o domínio para onde quiser." }
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button 
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-6 text-left font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {item.q}
                  <span className={`transform transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {activeFaq === idx && (
                  <div className="p-6 pt-0 text-slate-600 leading-relaxed border-t border-slate-100 animate-slide-up">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-32 bg-[#0A4D8C] text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400 rounded-full blur-[100px] opacity-20 animate-pulse"></div>
        
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Comece Hoje. Veja o Resultado Antes de Pagar.</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Centenas de médicos já descobriram que autoridade digital não precisa ser cara nem complicada.
          </p>
          <button onClick={onStart} className="px-12 py-5 bg-[#00A86B] text-white rounded-full font-bold text-xl shadow-2xl hover:bg-[#008f5b] hover:scale-105 transition-all">
            Criar Meu Site Grátis
          </button>
          <p className="mt-6 text-sm text-blue-200 opacity-80">Leva menos de 5 minutos</p>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-700 rounded"></div>
            <span className="font-bold text-white">DocPage AI</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-white transition-colors">Política de Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Compliance CFM</a>
          </div>
          <div className="text-slate-600">
            © 2024 DocPage AI
          </div>
        </div>
      </footer>

    </div>
  );
};
