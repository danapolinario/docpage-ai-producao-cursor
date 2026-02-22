
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Confetti } from './common/Confetti';

interface Props {
  onStart: () => void;
  onDevNavigation?: (step: number, mode?: 'plans' | 'checkout' | 'dashboard') => void;
  onLoginClick?: () => void;
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

// --- Helper Hook for Scroll Animation ---
const useOnScreen = (options: any) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [ref, options]);

  return [ref, isVisible] as const;
};

// --- Timeline Item Component ---
interface TimelineItemProps {
  step: {
    title: string;
    desc: string;
    time?: string;
    icon: React.ReactNode;
  };
  index: number;
  isLast: boolean;
  onVisible?: (index: number) => void;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ step, index, isLast, onVisible }) => {
  const [ref, isVisible] = useOnScreen({ threshold: 0.6 });
  const isEven = index % 2 === 0;

  useEffect(() => {
    if (isVisible && onVisible) {
      onVisible(index);
    }
  }, [isVisible, index, onVisible]);

  return (
    <div ref={ref} className={`relative flex items-center justify-between md:justify-center ${isLast ? '' : 'mb-12'} z-10 w-full`}>
      
      {/* Left Side (Content for Even, Empty for Odd) */}
      <div className={`hidden md:block w-5/12 ${isEven ? 'text-right pr-8' : ''}`}>
        {isEven && (
          <div className={`transition-all duration-700 transform ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}`}>
             <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl hover:border-blue-300 transition-all group relative overflow-hidden z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {step.time && (
                  <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-1 rounded-full border border-slate-200">
                    {step.time}
                  </span>
                )}
                <div className="flex justify-end mb-3 relative z-10">
                   <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shadow-sm">
                      {step.icon}
                   </div>
                </div>
                <h3 className="font-bold text-xl text-slate-800 mb-2 relative z-10">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed relative z-10">{step.desc}</p>
             </div>
          </div>
        )}
      </div>

      {/* Center Marker - Handled by Parent Line, just the dot here */}
      <div className="absolute left-6 md:left-1/2 -translate-x-1/2 flex items-center justify-center z-20">
         <div className={`w-10 h-10 rounded-full border-4 border-white shadow-md flex items-center justify-center transition-all duration-500 ${isVisible ? 'bg-blue-600 scale-110 ring-4 ring-blue-100' : 'bg-slate-200 scale-100'}`}>
            <span className={`text-xs font-bold ${isVisible ? 'text-white' : 'text-slate-400'}`}>{index + 1}</span>
         </div>
      </div>

      {/* Right Side (Content for Odd, Empty for Even) */}
      <div className={`w-[calc(100%-80px)] ml-20 md:ml-0 md:w-5/12 ${!isEven ? 'text-left md:pl-8' : ''}`}>
        {!isEven ? (
           <div className={`transition-all duration-700 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}>
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl hover:border-blue-300 transition-all group relative overflow-hidden z-10">
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 {step.time && (
                    <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-1 rounded-full border border-slate-200">
                      {step.time}
                    </span>
                 )}
                 <div className="flex justify-start mb-3 relative z-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shadow-sm">
                       {step.icon}
                    </div>
                 </div>
                 <h3 className="font-bold text-xl text-slate-800 mb-2 relative z-10">{step.title}</h3>
                 <p className="text-sm text-slate-500 leading-relaxed relative z-10">{step.desc}</p>
              </div>
           </div>
        ) : (
           /* Mobile Only View for Even items */
           <div className={`md:hidden transition-all duration-700 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}>
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 group relative overflow-hidden my-4 z-10">
                 {step.time && (
                    <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-1 rounded-full border border-slate-200">
                      {step.time}
                    </span>
                 )}
                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-3">
                       {step.icon}
                    </div>
                    <h3 className="font-bold text-xl text-slate-800 mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                 </div>
              </div>
           </div>
        )}
      </div>

    </div>
  );
};

export const SaaSLanding: React.FC<Props> = ({ onStart, onDevNavigation, onLoginClick, isAuthenticated, onLogout }) => {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<'none' | 'terms' | 'privacy'>('none');
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Confetti & Notification States
  const [showTimelineConfetti, setShowTimelineConfetti] = useState(false);
  const [confettiPlayed, setConfettiPlayed] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [messageCount, setMessageCount] = useState(1);
  const [messageIndex, setMessageIndex] = useState(0);
  
  // Timeline Progress
  const [maxVisibleStep, setMaxVisibleStep] = useState(0);

  // Refs
  const sectionRef = useRef<HTMLDivElement>(null); 
  const marqueeRef = useRef<HTMLDivElement>(null);

  // --- Marquee Logic (Move on Scroll Only) ---
  useEffect(() => {
    let scrollTimeout: ReturnType<typeof setTimeout>;
    let lastScrollY = window.scrollY;
    let lastScrollTime = Date.now();
    const baseDuration = 10; // Duração base em segundos (mais rápido = menor duração)
    const minDuration = 10; // Duração mínima (velocidade máxima)
    const maxDuration = 10; // Duração máxima (velocidade mínima/pausada)

    // Initialize as paused
    if (marqueeRef.current) {
      marqueeRef.current.style.animationPlayState = 'paused';
      marqueeRef.current.style.animationDuration = `${maxDuration}s`;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const currentTime = Date.now();
      const timeDelta = currentTime - lastScrollTime;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY);
      
      // Calcular velocidade do scroll (pixels por segundo)
      const scrollVelocity = timeDelta > 0 ? scrollDelta / (timeDelta / 1000) : 0;
      
      // Aumentar velocidade baseada na velocidade do scroll
      // Scroll rápido = animação mais rápida (menor duração)
      // Scroll lento = animação mais lenta (maior duração)
      if (marqueeRef.current && scrollVelocity > 0) {
        // Normalizar velocidade (ajustar esses valores conforme necessário)
        // Velocidade de 0-500px/s mapeia para duração de 20s a 5s
        const normalizedVelocity = Math.min(scrollVelocity / 500, 1); // Limitar entre 0 e 1
        const newDuration = maxDuration - (normalizedVelocity * (maxDuration - minDuration));
        
        marqueeRef.current.style.animationDuration = `${newDuration}s`;
        marqueeRef.current.style.animationPlayState = 'running';
      }

      lastScrollY = currentScrollY;
      lastScrollTime = currentTime;

      clearTimeout(scrollTimeout);
      
      // Pause animation after scrolling stops
      scrollTimeout = setTimeout(() => {
        if (marqueeRef.current) {
          marqueeRef.current.style.animationPlayState = 'paused';
          marqueeRef.current.style.animationDuration = `${maxDuration}s`; // Reset para velocidade normal
        }
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- Typewriter Logic ---
  const [suffixIndex, setSuffixIndex] = useState(0);
  const [displayedSuffix, setDisplayedSuffix] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const prefix = "Sua Presença Digital Médica";
  const suffixes = [
    " com *Site Profissional em Minutos*.",
    " com *Agenda Cheia*.",
    " no *Topo do Google*.",
    " com *Posts para Instagram*."
  ];

  const whatsappMessages = [
    "Olá, gostaria de agendar uma consulta...",
    "Bom dia, quero agendar uma consulta...",
    "Boa tarde, preciso agendar uma consulta..."
  ];

  useEffect(() => {
    const currentFullSuffix = suffixes[suffixIndex];
    
    const handleTyping = () => {
      if (isDeleting) {
        setDisplayedSuffix(prev => prev.substring(0, prev.length - 1));
      } else {
        setDisplayedSuffix(currentFullSuffix.substring(0, displayedSuffix.length + 1));
      }

      if (!isDeleting && displayedSuffix === currentFullSuffix) {
        setTimeout(() => setIsDeleting(true), 2000); // Pause when full
      } else if (isDeleting && displayedSuffix === '') {
        setIsDeleting(false);
        setSuffixIndex((prev) => (prev + 1) % suffixes.length);
      }
    };

    const timer = setTimeout(handleTyping, isDeleting ? 30 : 60);
    return () => clearTimeout(timer);
  }, [displayedSuffix, isDeleting, suffixIndex]);

  // --- Notification Logic ---
  useEffect(() => {
    if (showNotification) {
      // Counter increment
      const countInterval = setInterval(() => {
        setMessageCount(prev => prev + 1);
      }, 1500);

      // Message cycling
      const messageInterval = setInterval(() => {
        setMessageIndex(prev => (prev + 1) % whatsappMessages.length);
      }, 3500);

      return () => {
        clearInterval(countInterval);
        clearInterval(messageInterval);
      };
    } else {
      setMessageCount(1);
      setMessageIndex(0);
    }
  }, [showNotification]);

  const renderSuffix = (text: string) => {
    const parts = text.split('*');
    return (
      <>
        {parts.map((part, index) => {
          if (index % 2 === 1) {
            return (
              <span key={index} className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600 font-extrabold">
                {part}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
        <span className="animate-pulse text-blue-600 ml-1">|</span>
      </>
    );
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false); // Fechar menu mobile após clicar
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleDevClick = (step: number, mode?: 'plans' | 'checkout' | 'dashboard') => {
    if (onDevNavigation) {
      onDevNavigation(step, mode);
      setShowDevMenu(false);
      setIsMobileMenuOpen(false); // Fechar menu mobile também
    }
  };

  const specialtiesList = [
    "Cardiologia", "Dermatologia", "Pediatria", "Ortopedia", "Ginecologia", 
    "Oftalmologia", "Psiquiatria", "Neurologia", "Endocrinologia", "Nutrologia", 
    "Cirurgia Plástica", "Urologia", "Geriatria", "Otorrinolaringologia"
  ];

  const examples = [
    {
      author: "Dra. Tereza Wagner",
      specialty: "Nefrologista",
      theme: "Plano Autoridade",
      image: "/dra-tereza-wagner-site.jpg",
      tagColor: "bg-blue-100 text-blue-700",
      link: "https://draterezawagner.com.br"
    },
    {
      author: "Dra. Stella Maris Osmo Mardegan",
      specialty: "Pediatria",
      theme: "Estilo Acolhedor",
      image: "/dra-stella.jpg",
      tagColor: "bg-green-100 text-green-700",
      link: "https://draterezawagner.com.br"
    },
    {
      author: "Instituto Cuidar",
      specialty: "Pediatria",
      theme: "Estilo Moderno",
      image: "https://images.unsplash.com/photo-1504813184591-01572f98c85f?auto=format&fit=crop&w=800&q=80",
      tagColor: "bg-purple-100 text-purple-700"
    }
  ];

  const plans = [
    {
      name: 'Starter',
      price: 'R$ 97',
      oldPrice: 'R$ 147',
      period: '/mês',
      periodDetail: '(plano anual)',
      description: 'Para quem está começando e quer presença digital rápida.',
      features: ['Hospedagem inclusa', 'Domínio .com.br grátis (1 ano)', 'Botão WhatsApp', 'Estatísticas de acesso'],
      highlight: false,
      color: 'border-slate-200',
      cta: 'Escolher Plano',
      ctaColor: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
    },
    {
      name: 'Profissional',
      price: 'R$ 197',
      oldPrice: 'R$ 297',
      period: '/mês',
      periodDetail: '(plano anual)',
      description: 'Para especialistas que buscam autoridade e agendamentos.',
      features: ['Tudo do Starter', 'Estatísticas de acesso avançadas', 'Sugestões periódicas da nossa equipe para melhoria de desempenho', 'Plano estratégico para otimizar resultados', 'Pacote de posts para Redes Sociais'],
      highlight: true,
      color: 'border-blue-500 ring-2 ring-blue-500 shadow-xl',
      cta: 'Escolher Plano',
      ctaColor: 'bg-blue-600 text-white hover:bg-blue-700'
    },
    {
      name: 'Autoridade',
      price: 'Consulte',
      period: '',
      periodDetail: '',
      description: 'Para profissionais que são referência e buscam presença sólida.',
      features: ['Tudo do Profissional', 'Customização humana', 'Gestão de Tráfego (Ads)', 'Consultoria Mensal', 'Posts sob demanda (Redes Sociais)'],
      highlight: false,
      color: 'border-slate-200',
      cta: 'Falar com Consultor',
      ctaColor: 'bg-slate-800 text-white hover:bg-slate-900'
    }
  ];

  const faqs = [
    { q: "Preciso saber programar?", a: "Não. É como usar o WhatsApp. Você conversa, clica e pronto." },
    { q: "E se o CFM não aprovar meu conteúdo?", a: "Impossível. Nossa IA bloqueia automaticamente qualquer termo proibido pela Resolução 2.336/2023." },
    { q: "Posso cancelar a qualquer momento?", a: "Sim. Sem multas, sem burocracia. Seu site fica no ar até o fim do mês pago." },
    { q: "O domínio é meu?", a: "Sim. Se você cancelar, pode transferir o domínio para onde quiser." }
  ];

  // Arguments List
  const argumentsList = [
    {
      title: "Alta Conversão",
      desc: "Site com técnicas para alta conversão e gerar novos agendamentos.",
      bg: "bg-gradient-to-br from-blue-500 to-blue-600",
      text: "text-white"
    },
    {
      title: "Carreira Atualizada",
      desc: "Site ajustado rapidamente com novidades da sua carreira.",
      bg: "bg-gradient-to-br from-teal-400 to-teal-600",
      text: "text-white"
    },
    {
      title: "Posts Redes Sociais",
      desc: "Pacote de posts prontos para manter seu Instagram ativo.",
      bg: "bg-gradient-to-br from-purple-500 to-purple-600",
      text: "text-white"
    },
    {
      title: "Conteúdo Ético & IA",
      desc: "Conteúdo ético agregado pelas IAs, com segurança.",
      bg: "bg-gradient-to-br from-slate-700 to-slate-800",
      text: "text-white"
    },
    {
      title: "Melhor Ranking Google",
      desc: "SEO estruturado para que pacientes te encontrem.",
      bg: "bg-gradient-to-br from-orange-400 to-orange-500",
      text: "text-white"
    }
  ];

  // --- Simplified Mobile Slider Logic ---
  const [currentArgIndex, setCurrentArgIndex] = useState(0);

  const nextArg = () => {
    setCurrentArgIndex((prev) => (prev + 1) % argumentsList.length);
  };

  const prevArg = () => {
    setCurrentArgIndex((prev) => (prev - 1 + argumentsList.length) % argumentsList.length);
  };

  const stepsTimeline = [
    { 
      title: "Seus Dados", 
      desc: "Briefing rápido da sua especialidade e público alvo. Apenas o essencial.", 
      time: "3-5 min",
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> 
    },
    { 
      title: "IA Escreve por Você", 
      desc: "Nossa IA gera textos persuasivos, empáticos e 100% adequados ao CFM.", 
      time: "1 min",
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> 
    },
    { 
      title: "Foto Profissional", 
      desc: "Nossa IA transforma sua selfie casual em foto profissional.", 
      time: "1 min",
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> 
    },
    { 
      title: "Escolha o Visual", 
      desc: "Selecione entre 5 layouts e faça inúmeras combinações possíveis em tempo real.", 
      time: "2-5 min",
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg> 
    },
    { 
      title: "Ajustes Finais", 
      desc: "Use o IA Copilot para refinar textos ou design conversando com o editor.", 
      time: "2-5 min",
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg> 
    },
    { 
      title: "No Ar!", 
      desc: "Escolha seu domínio .com.br e publique seu site instantaneamente.", 
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> 
    },
    { 
      title: "Divulgue", 
      desc: "Baixe o pacote de posts para Instagram e anuncie sua novidade.", 
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg> 
    }
  ];

  // Logic to handle visibility of items
  const handleTimelineItemVisible = (index: number) => {
    if (index > maxVisibleStep) {
      setMaxVisibleStep(index);
    }
    
    // Notification logic: Trigger when Item 7 (index 6) is visible
    if (index === 6 && !showNotification) {
      setShowNotification(true);
    }

    // Confetti logic: Trigger when Item 7 (index 6) is visible ("Divulgue")
    if (index === 6 && !confettiPlayed) {
      setShowTimelineConfetti(true);
      setConfettiPlayed(true);
      setTimeout(() => setShowTimelineConfetti(false), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-white font-startup text-slate-900">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-teal-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-50"></div>

        <nav className="relative z-50 max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-500 rounded-lg shadow-lg shadow-blue-900/20 flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <svg className="w-4 h-4 relative z-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="8" cy="8" r="1.5" fill="currentColor" opacity="0.9" />
                <circle cx="16" cy="8" r="1.5" fill="currentColor" opacity="0.9" />
                <circle cx="12" cy="16" r="1.5" fill="currentColor" opacity="0.9" />
                <path d="M8 8 L12 16 M16 8 L12 16 M8 8 L16 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                <circle cx="6" cy="6" r="0.5" fill="currentColor" opacity="0.7">
                  <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="18" cy="6" r="0.5" fill="currentColor" opacity="0.7">
                  <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" begin="0.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="12" cy="18" r="0.5" fill="currentColor" opacity="0.7">
                  <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" begin="1s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight">DocPage AI</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
             <button onClick={() => scrollToSection('how-it-works')} className="hover:text-blue-600 transition-colors">Como funciona</button>
             <button onClick={() => scrollToSection('examples')} className="hover:text-blue-600 transition-colors">Exemplos</button>
             <button onClick={() => scrollToSection('pricing')} className="hover:text-blue-600 transition-colors">Planos</button>
             <button onClick={() => scrollToSection('faq')} className="hover:text-blue-600 transition-colors">FAQ</button>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
             {/* DEV MENU */}
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
                           <button onClick={() => handleDevClick(0)} className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100">Step 1: Dados</button>
                           <button onClick={() => handleDevClick(1)} className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100">Step 2: Conteúdo</button>
                           <button onClick={() => handleDevClick(2)} className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100">Step 3: Foto</button>
                           <button onClick={() => handleDevClick(3)} className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100">Step 4: Visual</button>
                           <button onClick={() => handleDevClick(4)} className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100">Step 5: Editor</button>
                           <div className="border-t border-gray-100 my-1"></div>
                           <button onClick={() => handleDevClick(5, 'plans')} className="block w-full text-left px-4 py-2 text-xs text-blue-600 hover:bg-blue-50 font-bold">Step 6: Planos</button>
                           <button onClick={() => handleDevClick(5, 'checkout')} className="block w-full text-left px-4 py-2 text-xs text-green-600 hover:bg-green-50 font-bold">Checkout (Demo)</button>
                           <button onClick={() => handleDevClick(5, 'dashboard')} className="block w-full text-left px-4 py-2 text-xs text-purple-600 hover:bg-purple-50 font-bold">Dashboard</button>
                        </div>
                     </div>
                   )}
                </div>
             )}
             {isAuthenticated ? (
                <>
                  <button 
                    onClick={() => navigate('/dashboard')} 
                    className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full transition-colors"
                  >
                    Meu Painel
                  </button>
                  <button 
                    onClick={onLogout} 
                    className="text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 px-4 py-2 rounded-full transition-colors hover:bg-slate-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="hidden sm:inline">Sair</span>
                  </button>
                </>
              ) : (
                <>
                  {onLoginClick && (
                    <button 
                      onClick={onLoginClick} 
                      className="text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 px-4 py-2 rounded-full transition-colors hover:bg-slate-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Login
                    </button>
                  )}
                  <button 
                    onClick={onStart} 
                    className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full transition-colors"
                  >
                    Começar
                  </button>
                </>
              )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {isAuthenticated && (
              <button 
                onClick={() => navigate('/dashboard')} 
                className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-full transition-colors"
              >
                Painel
              </button>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 transition-colors"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu Overlay */}
          {isMobileMenuOpen && (
            <>
              <div 
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-in-out">
                <div className="flex flex-col h-full">
                  {/* Mobile Menu Header */}
                  <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <span className="font-bold text-xl text-slate-900">Menu</span>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Mobile Menu Items */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <button
                      onClick={() => scrollToSection('how-it-works')}
                      className="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                    >
                      Como funciona
                    </button>
                    <button
                      onClick={() => scrollToSection('examples')}
                      className="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                    >
                      Exemplos
                    </button>
                    <button
                      onClick={() => scrollToSection('pricing')}
                      className="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                    >
                      Planos
                    </button>
                    <button
                      onClick={() => scrollToSection('faq')}
                      className="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                    >
                      FAQ
                    </button>

                    {/* Dev Menu */}
                    {onDevNavigation && (
                      <>
                        <div className="border-t border-gray-200 my-2"></div>
                        <button
                          onClick={() => {
                            setShowDevMenu(!showDevMenu);
                          }}
                          className="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium flex items-center justify-between"
                        >
                          <span>Dev Menu</span>
                          <svg 
                            className={`w-5 h-5 transform transition-transform ${showDevMenu ? 'rotate-180' : ''}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {showDevMenu && (
                          <div className="pl-4 space-y-1">
                            <button onClick={() => handleDevClick(0)} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Step 1: Dados</button>
                            <button onClick={() => handleDevClick(1)} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Step 2: Conteúdo</button>
                            <button onClick={() => handleDevClick(2)} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Step 3: Foto</button>
                            <button onClick={() => handleDevClick(3)} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Step 4: Visual</button>
                            <button onClick={() => handleDevClick(4)} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Step 5: Editor</button>
                            <div className="border-t border-gray-200 my-1"></div>
                            <button onClick={() => handleDevClick(5, 'plans')} className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-semibold">Step 6: Planos</button>
                            <button onClick={() => handleDevClick(5, 'checkout')} className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg font-semibold">Checkout (Demo)</button>
                            <button onClick={() => handleDevClick(5, 'dashboard')} className="w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg font-semibold">Dashboard</button>
                          </div>
                        )}
                      </>
                    )}

                    <div className="border-t border-gray-200 my-2"></div>

                    {/* Login/Auth Actions */}
                    {isAuthenticated ? (
                      <>
                        <button
                          onClick={() => {
                            navigate('/dashboard');
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 bg-blue-600 text-white rounded-lg transition-colors font-semibold hover:bg-blue-700"
                        >
                          Meu Painel
                        </button>
                        <button
                          onClick={() => {
                            if (onLogout) onLogout();
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sair
                        </button>
                      </>
                    ) : (
                      <>
                        {onLoginClick && (
                          <button
                            onClick={() => {
                              if (onLoginClick) onLoginClick();
                              setIsMobileMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            Login
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onStart();
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 bg-blue-600 text-white rounded-lg transition-colors font-semibold hover:bg-blue-700"
                        >
                          Começar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-8 pb-12 text-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 mb-6">
            <div className="inline-block px-4 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold uppercase tracking-wider">
              ✨ O Novo Padrão para Médicos
            </div>
            <div className="inline-block px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
              Adequado ao CFM
            </div>
          </div>
          
          {/* Typewriter Headline */}
          <div className="min-h-[160px] md:min-h-[200px] flex items-center justify-center mb-4">
             <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                {prefix}<br/>
                {renderSuffix(displayedSuffix)}
             </h1>
          </div>

          <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-500 mb-10 leading-relaxed">
            Crie um site profissional para médicos que atrai pacientes e respeita 100% as normas éticas do CFM. Veja o resultado final grátis em minutos, publique e assine apenas quando estiver satisfeito.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onStart}
              className="px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Experimentar Grátis
            </button>
            <button 
              onClick={() => scrollToSection('examples')}
              className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-bold text-lg hover:bg-slate-50 transition-colors"
            >
              Ver Exemplos
            </button>
          </div>
        </div>
      </div>

      {/* Specialties Marquee - Updated Visuals */}
      <div className="w-full bg-gradient-to-r from-blue-600 via-teal-500 to-blue-600 py-3 overflow-hidden relative border-b border-slate-800">
         <div 
           ref={marqueeRef}
           className="flex gap-8 whitespace-nowrap animate-scroll-x"
           style={{ animationDuration: '20s', animationPlayState: 'paused' }} // Será ajustado dinamicamente no scroll
         >
            {[...specialtiesList, ...specialtiesList, ...specialtiesList].map((spec, i) => (
               <span key={i} className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-8">
                  {spec} <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
               </span>
            ))}
         </div>
      </div>

      {/* Arguments Section (Desktop Grid / Mobile Slider) */}
      <div className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-16">
             <h2 className="text-3xl font-bold text-slate-900">Por que escolher o DocPage AI para criar seu site médico?</h2>
             <p className="text-slate-600 mt-4 max-w-2xl mx-auto">
               A melhor plataforma de criação de sites para médicos com marketing médico otimizado e presença online profissional.
             </p>
           </div>
           
           {/* Desktop View: Grid (Reduced Height & Larger Font) */}
           <div className="hidden md:grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {argumentsList.map((arg, idx) => (
                <div key={idx} className={`p-6 rounded-3xl shadow-lg relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500 ${arg.bg} h-full flex flex-col justify-between`}>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-10 rounded-full -mr-16 -mt-16 blur-xl group-hover:scale-110 transition-transform"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black opacity-10 rounded-full -ml-10 -mb-10 blur-xl"></div>
                    <div className="relative z-10">
                        <div>
                          <h3 className={`font-bold text-2xl mb-3 ${arg.text}`}>{arg.title}</h3>
                          <p className={`text-lg opacity-90 leading-relaxed font-medium ${arg.text}`}>{arg.desc}</p>
                        </div>
                    </div>
                    <div className="relative z-10 mt-6 opacity-50 group-hover:opacity-100 transition-opacity">
                      <svg className={`w-6 h-6 ${arg.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </div>
                </div>
              ))}
           </div>

           {/* Mobile View: Simplified Slider */}
           <div className="md:hidden relative">
             <div className="overflow-hidden py-4 px-2">
               <div className="relative h-[220px]">
                  {argumentsList.map((arg, idx) => (
                    <div 
                      key={idx} 
                      className={`absolute top-0 left-0 w-full h-full transition-all duration-300 ease-in-out transform ${
                        idx === currentArgIndex ? 'translate-x-0 opacity-100' : idx < currentArgIndex ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'
                      }`}
                    >
                        <div className={`p-6 rounded-3xl shadow-lg relative overflow-hidden ${arg.bg} h-full flex flex-col justify-center items-center text-center`}>
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                            <div className="relative z-10">
                                <h3 className={`font-bold text-xl mb-3 ${arg.text}`}>{arg.title}</h3>
                                <p className={`text-sm opacity-90 leading-relaxed font-medium ${arg.text}`}>{arg.desc}</p>
                            </div>
                        </div>
                    </div>
                  ))}
               </div>
             </div>
             
             {/* Navigation Arrows */}
             <div className="flex justify-between items-center px-4 mt-2">
               <button 
                 onClick={prevArg}
                 className="bg-white text-slate-700 p-3 rounded-full shadow-md hover:bg-slate-50 transition-all border border-slate-100 active:scale-95"
               >
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
               </button>
               
               {/* Pagination Dots */}
               <div className="flex justify-center gap-2">
                 {argumentsList.map((_, idx) => (
                   <div 
                     key={idx}
                     className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentArgIndex ? 'bg-blue-600 w-4' : 'bg-slate-300'}`}
                   />
                 ))}
               </div>

               <button 
                 onClick={nextArg}
                 className="bg-white text-slate-700 p-3 rounded-full shadow-md hover:bg-slate-50 transition-all border border-slate-100 active:scale-95"
               >
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
               </button>
             </div>
           </div>
        </div>
      </div>

      {/* How It Works (Updated with Progress Line & Confetti & Notification) */}
      <div id="how-it-works" ref={sectionRef} className="relative bg-slate-50/50 py-16 border-b border-slate-200 overflow-hidden">
         {showTimelineConfetti && (
             <Confetti className="absolute inset-0 pointer-events-none z-[0] w-full h-full" />
         )}
         <div className="relative z-10 max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900">Como funciona</h2>
              <p className="text-xl text-slate-500">Do zero ao topo em 7 passos simples.</p>
            </div>
            
            <div className="relative">
               {/* Vertical Background Line (Gray) - Extends full height */}
               <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-1 bg-slate-200 md:-translate-x-1/2 rounded-full h-full"></div>
               
               {/* Progress Line (Gradient) */}
               <div 
                 className="absolute left-6 md:left-1/2 top-0 w-1 bg-gradient-to-b from-teal-400 to-blue-600 md:-translate-x-1/2 rounded-full transition-all duration-1000 ease-out"
                 style={{ height: `${(maxVisibleStep / (stepsTimeline.length - 1)) * 100}%` }}
               ></div>

               <div className="space-y-0">
                 {stepsTimeline.map((step, i) => (
                   <TimelineItem 
                     key={i} 
                     step={step} 
                     index={i} 
                     isLast={i === stepsTimeline.length - 1} 
                     onVisible={handleTimelineItemVisible}
                   />
                 ))}
               </div>

               {/* Push Notification Simulation - Centered in Timeline Flow */}
               {showNotification && (
                 <div className="relative z-20 flex flex-col items-center mt-8 md:mt-12 animate-slide-up">
                    {/* Connecting Line to Notification */}
                    <div className="w-1 h-8 bg-blue-600 mb-[-2px] relative z-0"></div>
                    
                    <div className="cursor-pointer hover:scale-105 transition-transform max-w-[300px] md:max-w-sm w-full relative z-10">
                      {/* Stacked cards effect */}
                      <div className="absolute top-0 left-0 w-full h-full bg-white/50 rounded-xl transform translate-y-[-8px] scale-90 border border-gray-200 shadow-sm"></div>
                      <div className="absolute top-0 left-0 w-full h-full bg-white/70 rounded-xl transform translate-y-[-4px] scale-95 border border-gray-200 shadow-sm"></div>
                      
                      {/* Main Card */}
                      <div className="relative bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border-l-4 border-green-500 w-full border-y border-r border-gray-100">
                        <div className="flex items-start gap-3">
                           <div className="relative bg-green-100 p-2 rounded-full flex-shrink-0">
                              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                              {/* Notification Count Badge */}
                              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white animate-pulse">
                                {messageCount}
                              </div>
                           </div>
                           <div className="flex-1 overflow-hidden">
                              <div className="flex justify-between items-center mb-1">
                                 <h4 className="font-bold text-gray-800 text-sm">WhatsApp</h4>
                                 <span className="text-[10px] text-gray-400">Agora</span>
                              </div>
                              <p className="text-sm font-semibold text-gray-700">{messageCount} novas mensagens</p>
                              <div className="h-5 relative w-full">
                                <p key={messageIndex} className="text-xs text-gray-500 truncate absolute w-full animate-slide-up">
                                  Paciente: {whatsappMessages[messageIndex]}
                                </p>
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                 </div>
               )}
            </div>

            <div className="text-center mt-12 relative z-10">
              <button 
                onClick={onStart} 
                className="px-12 py-5 bg-green-600 text-white rounded-full font-bold text-xl shadow-xl shadow-green-200 hover:bg-green-700 transition-all hover:-translate-y-1 hover:shadow-2xl"
              >
                Comece Agora - É Grátis!
              </button>
            </div>
         </div>
      </div>

      {/* Pricing Section (Gradient Background) */}
      <div id="pricing" className="py-24 bg-gradient-to-r from-teal-500 to-blue-600 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 drop-shadow-sm">Investimento que se paga</h2>
            <p className="text-blue-100 max-w-2xl mx-auto text-lg">
              Planos acessíveis e sem surpresas. Escolha a opção ideal para o seu momento profissional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
             {plans.map((plan, idx) => (
                <div key={idx} className={`relative p-8 bg-white rounded-2xl shadow-2xl transition-transform hover:-translate-y-2`}>
                   {plan.highlight && (
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-400 text-blue-900 text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-lg border border-yellow-300">
                       Mais Popular
                     </div>
                   )}
                   <h3 className="text-xl font-bold text-slate-800 mb-2">{plan.name}</h3>
                   <p className="text-xs text-slate-500 mb-6 h-8">{plan.description}</p>
                   
                   <div className="mb-6">
                     {plan.oldPrice && <span className="text-xs text-red-400 font-bold line-through block">De {plan.oldPrice}</span>}
                     <div className="flex items-baseline">
                        {plan.oldPrice && <span className="text-sm font-bold text-gray-500 mr-1">Por</span>}
                        <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                        <span className="text-slate-500 ml-1">{plan.period}</span>
                     </div>
                     {plan.periodDetail && <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded">{plan.periodDetail}</span>}
                   </div>

                   <ul className="space-y-4 mb-8">
                     {plan.features.map((feature, i) => (
                       <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                         <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                         {feature}
                       </li>
                     ))}
                   </ul>
                   <button 
                     onClick={onStart}
                     className={`w-full py-3 rounded-lg font-bold transition-colors ${plan.ctaColor}`}
                   >
                     {plan.cta}
                   </button>
                </div>
             ))}
          </div>
        </div>
      </div>

      {/* Examples Section */}
      <div id="examples" className="py-24 bg-white border-b border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Exemplos de Sites Médicos Criados com DocPage AI</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              Veja exemplos de sites profissionais para médicos de diversas especialidades criados em poucos minutos com nossa plataforma de criação de landing pages médicas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {examples.map((ex, idx) => (
              <div key={idx} className="group relative rounded-2xl overflow-hidden shadow-soft border border-slate-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white">
                <div className="h-8 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                  <div className="ml-4 h-4 bg-white rounded-sm w-32 opacity-50 text-[8px] flex items-center px-2 text-slate-400">
                    docpage.com.br/preview
                  </div>
                </div>
                <div className="relative h-64 overflow-hidden">
                   <a href={ex.link} target="blank">
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-60"></div>
                   <img 
                     src={ex.image} 
                     alt={`Site profissional criado com DocPage AI - ${ex.author}, ${ex.specialty}`} 
                     loading="lazy"
                     width={800}
                     height={400}
                     className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                   /></a>
                   <div className="absolute bottom-0 left-0 p-6 z-20 text-white">
                      <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">{ex.specialty}</p>
                      <h3 className="text-xl font-bold">{ex.author}</h3>
                   </div>
                </div>
                <div className="p-4 flex items-center justify-between bg-white">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${ex.tagColor}`}>
                    {ex.theme}
                  </span>
                  <span className="text-slate-400 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    Preview
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq" className="py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Perguntas Frequentes sobre o DocPage AI</h2>
            <p className="text-slate-500">
              Tire suas dúvidas sobre criação de sites para médicos, marketing médico e nossa plataforma antes de começar.
            </p>
          </div>
          
          <div className="space-y-4">
             {faqs.map((item, idx) => (
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
      </div>

      {/* Final CTA Banner (V1 Style) */}
      <section className="py-24 bg-slate-900 text-white text-center relative overflow-hidden">
         <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500 to-slate-900"></div>
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500 rounded-full blur-[128px] opacity-20"></div>
         <div className="max-w-4xl mx-auto px-6 relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">Comece Hoje. <br/>Veja o Resultado Antes de Pagar.</h2>
            <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">Centenas de médicos já descobriram que autoridade digital não precisa ser cara nem complicada.</p>
            <button onClick={onStart} className="px-12 py-5 bg-green-500 text-white rounded-full font-bold text-xl hover:bg-green-600 transition-all shadow-xl hover:scale-105">
               Criar Meu Site Grátis
            </button>
         </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800 text-sm">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          
          <div className="col-span-1 md:col-span-1">
             <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg"></div>
                <span className="font-bold text-xl text-white">DocPage AI</span>
             </div>
             <p className="text-slate-500 mb-6 leading-relaxed">
               A plataforma líder em criação de sites éticos para médicos e profissionais da saúde.
             </p>
             <div className="flex gap-4">
                <a href="https://www.instagram.com/docpage.ai" target="_blank" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-instagram" viewBox="0 0 16 16"> <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"/> @DocPage.ai</svg></a>
             </div>
          </div>

          <div>
             <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Produto</h4>
             <ul className="space-y-3">
               <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-blue-400 transition-colors">Como Funciona</button></li>
               <li><button onClick={() => scrollToSection('examples')} className="hover:text-blue-400 transition-colors">Exemplos</button></li>
               <li><button onClick={() => scrollToSection('pricing')} className="hover:text-blue-400 transition-colors">Planos e Preços</button></li>
               <li><button onClick={() => scrollToSection('faq')} className="hover:text-blue-400 transition-colors">Dúvidas Frequentes</button></li>
             </ul>
          </div>

          <div>
             <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Legal</h4>
             <ul className="space-y-3">
               <li><button onClick={() => setActiveModal('terms')} className="hover:text-blue-400 transition-colors">Termos de Uso</button></li>
               <li><button onClick={() => setActiveModal('privacy')} className="hover:text-blue-400 transition-colors">Política de Privacidade</button></li>
               <li><span className="text-slate-600 cursor-default">Compliance CFM</span></li>
             </ul>
          </div>

          <div>
             <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Contato</h4>
             <ul className="space-y-3">
               <li className="flex items-center gap-3">
                 <span className="text-slate-600 bg-slate-800 p-1.5 rounded">✉</span> suporte@docpage.com.br
               </li>
               <li className="flex items-center gap-3">
                 <span className="text-slate-600 bg-slate-800 p-1.5 rounded">📍</span> São Paulo, SP
               </li>
             </ul>
          </div>

        </div>
        
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
            <div>
              © 2026 DocPage AI Tecnologia Ltda. Todos os direitos reservados.
            </div>
            <div className="flex gap-6">
              <a href="/termos-de-uso" className="hover:text-white transition-colors">Termos de Uso</a>
              <a href="/politica-de-privacidade" className="hover:text-white transition-colors">Política de Privacidade</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Legal Modals (Keep existing code) */}
      {activeModal !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
             <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
               <h3 className="text-xl font-bold text-slate-800">
                 {activeModal === 'terms' ? 'Termos de Uso' : 'Política de Privacidade'}
               </h3>
               <button onClick={() => setActiveModal('none')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                 <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
             </div>
             <div className="p-8 prose prose-slate max-w-none">
               {activeModal === 'terms' ? (
                 <div className="space-y-6 text-gray-700">
                   <p className="text-sm text-gray-500 mb-6">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
                   
                   <section>
                     <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Aceitação dos Termos</h2>
                     <p>
                       Ao acessar e usar o DocPage AI, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso.
                     </p>
                   </section>

                   <section>
                     <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Descrição do Serviço</h2>
                     <p>
                       O DocPage AI é uma plataforma SaaS que permite a criação de sites profissionais para médicos.
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
               ) : (
                 <div className="space-y-6 text-gray-700">
                   <p className="text-sm text-gray-500 mb-6">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
                   
                   <section>
                     <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Informações que Coletamos</h2>
                     <p>
                       Coletamos informações que você nos fornece diretamente, como nome, email, telefone e informações profissionais quando você cria uma conta ou usa nossos serviços.
                     </p>
                   </section>

                   <section>
                     <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Como Usamos suas Informações</h2>
                     <p>
                       Usamos as informações coletadas para fornecer, manter e melhorar nossos serviços, processar transações, enviar notificações e comunicar-nos com você.
                     </p>
                   </section>

                   <section>
                     <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Compartilhamento de Informações</h2>
                     <p>
                       Não vendemos suas informações pessoais. Podemos compartilhar suas informações apenas com prestadores de serviços confiáveis que nos ajudam a operar nossa plataforma.
                     </p>
                   </section>

                   <section>
                     <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Segurança dos Dados</h2>
                     <p>
                       Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
                     </p>
                   </section>

                   <section>
                     <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Seus Direitos (LGPD)</h2>
                     <p>
                       De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a acessar, corrigir, excluir ou portar seus dados pessoais. Você também pode se opor ao processamento de seus dados.
                     </p>
                   </section>

                   <section>
                     <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookies e Tecnologias Similares</h2>
                     <p>
                       Usamos cookies e tecnologias similares para melhorar sua experiência, analisar como você usa nossos serviços e personalizar conteúdo.
                     </p>
                   </section>

                   <section>
                     <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Alterações nesta Política</h2>
                     <p>
                       Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas publicando a nova política nesta página.
                     </p>
                   </section>

                   <section>
                     <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contato</h2>
                     <p>
                       Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos seus dados pessoais, entre em contato conosco através do email: privacidade@docpage.com.br
                     </p>
                   </section>
                 </div>
               )}
             </div>
             <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end sticky bottom-0">
               <button 
                 onClick={() => setActiveModal('none')}
                 className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800"
               >
                 Entendi e Fechar
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
