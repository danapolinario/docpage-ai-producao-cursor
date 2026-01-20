import React from 'react';
import { Stethoscope, HeartHandshake, Sparkles } from 'lucide-react';
import { DesignSettings, BriefingData, LayoutVariant, ThemeType } from '../types';
import { LayoutSchematic } from './LayoutSchematic';

interface Props {
  design: DesignSettings;
  photoUrl: string | null;
  briefing: BriefingData;
  layoutVariant: LayoutVariant;
  onUpdateDesign: (key: keyof DesignSettings, value: any) => void;
  onUpdateLayout: (variant: LayoutVariant) => void;
  onThemeSelect: (theme: ThemeType) => void;
  onNext: () => void;
  onBack: () => void;
}

export const VisualConfig: React.FC<Props> = ({
  design,
  photoUrl,
  briefing,
  layoutVariant,
  onUpdateDesign,
  onUpdateLayout,
  onThemeSelect,
  onNext,
  onBack
}) => {
  const layouts = [
    { id: 1, name: 'Clássico', desc: 'Equilíbrio e segurança' },
    { id: 2, name: 'Moderno', desc: 'Tecnologia e foco' },
    { id: 3, name: 'Orgânico', desc: 'Fluidez e acolhimento' },
    { id: 4, name: 'Studio', desc: 'Estrutura e força' },
    { id: 5, name: 'Editorial', desc: 'Elegância e tipografia' },
  ];

  const themeRecommendations: Record<string, ThemeType> = {
    'Cardiologia': ThemeType.CLINICAL,
    'Clínica Geral': ThemeType.CLINICAL,
    'Medicina Interna': ThemeType.CLINICAL,
    'Cirurgia': ThemeType.CLINICAL,
    'Pediatria': ThemeType.CARING,
    'Psiquiatria': ThemeType.CARING,
    'Geriatria': ThemeType.CARING,
    'Psicologia': ThemeType.CARING,
    'Dermatologia': ThemeType.MODERN,
    'Cirurgia Plástica': ThemeType.MODERN,
    'Medicina Esportiva': ThemeType.MODERN,
  };

  const themes = [
    {
      id: ThemeType.CLINICAL,
      name: 'Clínico & Limpo',
      description: 'Ideal para hospitais, cardiologia e clínica geral. Azul, branco e sensação de segurança.',
      colors: ['bg-blue-500', 'bg-white', 'bg-slate-200'],
      icon: Stethoscope,
    },
    {
      id: ThemeType.CARING,
      name: 'Acolhedor & Natural',
      description: 'Para pediatria e psicologia. Tons suaves e formas mais arredondadas, focadas em acolhimento.',
      colors: ['bg-emerald-500', 'bg-amber-100', 'bg-white'],
      icon: HeartHandshake,
    },
    {
      id: ThemeType.MODERN,
      name: 'Moderno & Tech',
      description: 'Para estética e tecnologia. Visual mais escuro, com vidro e sensação de inovação.',
      colors: ['bg-slate-900', 'bg-purple-500', 'bg-gray-800'],
      icon: Sparkles,
    },
  ];

  const recommendedTheme = themeRecommendations[briefing.specialty] || null;

  return (
    <div className="h-[calc(100vh-64px)] w-full bg-gray-100 flex items-center justify-center p-4 md:p-8 animate-fade-in font-sans">
      
      {/* Floating Container */}
      <div className="w-full max-w-7xl h-full max-h-[900px] bg-white rounded-2xl shadow-2xl overflow-hidden flex border border-gray-200">
        
        {/* LEFT SIDEBAR: CONTROLS */}
        <aside className="w-[340px] flex-none bg-white border-r border-gray-100 overflow-y-auto z-20 flex flex-col h-full">
          <div className="p-6 space-y-8 flex-1">
            
            <div>
               <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-1">
                <span className="bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">4</span>
                Identidade Visual
              </h2>
              <p className="text-sm text-gray-500 leading-tight">Defina a estrutura e o estilo da sua página. Os textos serão ajustados no próximo passo.</p>
            </div>

            {/* 1. Layouts */}
            <section>
               <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                 Estrutura
               </h3>
               <div className="space-y-2">
                 {layouts.map((l) => (
                   <button
                     key={l.id}
                     onClick={() => onUpdateLayout(l.id as LayoutVariant)}
                     className={`w-full relative p-3 rounded-lg border-2 transition-all text-left flex items-center justify-between group ${
                       layoutVariant === l.id 
                         ? 'border-blue-600 bg-blue-50/50 shadow-sm' 
                         : 'border-transparent bg-gray-50 hover:bg-white hover:border-gray-200 hover:shadow-md'
                     }`}
                   >
                     <div>
                       <span className={`block font-bold text-sm ${layoutVariant === l.id ? 'text-blue-700' : 'text-gray-700'}`}>
                         {l.name}
                       </span>
                       <span className="text-[10px] text-gray-500">{l.desc}</span>
                     </div>
                     {layoutVariant === l.id && (
                       <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-sm">
                         <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                       </div>
                     )}
                   </button>
                 ))}
               </div>
            </section>

            <hr className="border-gray-100" />

            {/* 2. Theme Presets */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                 Temas de Cor
              </h3>
              {recommendedTheme && (
                <p className="text-[11px] text-emerald-700 mb-2 font-medium">
                  ✨ Recomendado para {briefing.specialty}: <span className="font-semibold">{themes.find(t => t.id === recommendedTheme)?.name}</span>
                </p>
              )}
              <div className="grid grid-cols-1 gap-3">
                {themes.map(t => {
                  const isSelected = design.colorPalette ===
                    (t.id === ThemeType.CLINICAL ? 'blue' : t.id === ThemeType.CARING ? 'green' : 'slate');
                  const isRecommended = recommendedTheme === t.id;

                  return (
                    <button 
                      key={t.id} 
                      onClick={() => onThemeSelect(t.id)}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all bg-white hover:shadow-md ${
                        isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col items-center mt-1 flex-none">
                        <div className="flex items-center justify-center mb-2 rounded-full w-8 h-8 bg-gray-50 border border-gray-200">
                          <t.icon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex -space-x-1 justify-center mb-1">
                          {t.colors.map((c, i) => (
                            <div key={i} className={`w-3 h-3 rounded-full ${c} border border-white shadow-sm`}></div>
                          ))}
                        </div>
                        {isSelected && (
                          <span className="text-[9px] font-semibold text-blue-600 whitespace-nowrap">Selecionado</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 min-w-0">
                          <span className={`text-xs font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-800'} break-words`}>{t.name}</span>
                          {isRecommended && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100 whitespace-nowrap">
                              Recomendado
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 leading-snug break-words">
                          {t.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* 3. Details */}
            <section className="space-y-4">
               <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                 Ajustes Finos
               </h3>
               
               <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Paleta de Cores</label>
                  <div className="flex gap-2 flex-wrap">
                    {[{ id: 'blue', bg: 'bg-blue-500' }, { id: 'green', bg: 'bg-emerald-500' }, { id: 'rose', bg: 'bg-rose-500' }, { id: 'indigo', bg: 'bg-indigo-600' }, { id: 'slate', bg: 'bg-slate-600' }].map(c => (
                      <button 
                      key={c.id} 
                      onClick={() => onUpdateDesign('colorPalette', c.id)} 
                      className={`w-6 h-6 rounded-full ${c.bg} shadow-sm transition-all flex items-center justify-center ${design.colorPalette === c.id ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105 hover:opacity-90'}`}
                      >
                        {design.colorPalette === c.id && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                      </button>
                    ))}
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Estilo da Foto</label>
                  <select 
                    value={design.photoStyle} 
                    onChange={(e) => onUpdateDesign('photoStyle', e.target.value)}
                    className="w-full p-2 text-xs border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="minimal">Minimalista (Quadrado)</option>
                    <option value="organic">Orgânico (Fluido)</option>
                    <option value="framed">Moldura Deslocada</option>
                    <option value="glass">Vidro (Glassmorphism)</option>
                    <option value="floating">Flutuante 3D</option>
                    <option value="arch">Arco Moderno</option>
                    <option value="rotate">Inclinado (Dinâmico)</option>
                    <option value="collage">Colagem Geométrica</option>
                  </select>
               </div>
            </section>

          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-gray-200 bg-white flex gap-3 sticky bottom-0 z-20">
            <button
              onClick={onBack}
              className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200 text-sm"
            >
              Voltar
            </button>
            <button
              onClick={onNext}
              className="flex-[2] px-4 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
            >
              Próximo
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </aside>

        {/* RIGHT AREA: PREVIEW CANVAS (Centered & Contained) */}
        <main className="flex-1 bg-gray-50/50 relative flex items-center justify-center p-8 overflow-hidden">
           
           {/* The Mockup Container */}
           <div className="w-full max-w-4xl h-full max-h-[800px] flex flex-col">
              
              <div className="flex items-center justify-between mb-3 px-1">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                   Pré-visualização (Esquemática)
                 </h3>
              </div>

              {/* BROWSER FRAME */}
              <div className="w-full flex-1 bg-white rounded-xl shadow-2xl border border-gray-300 overflow-hidden flex flex-col ring-1 ring-gray-200">
                 {/* Browser Header */}
                 <div className="bg-gray-50 border-b border-gray-200 h-9 flex items-center px-4 gap-3 flex-none select-none">
                    <div className="flex gap-1.5">
                       <div className="w-2.5 h-2.5 rounded-full bg-red-400 border border-red-500/20"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-500/20"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-green-400 border border-green-500/20"></div>
                    </div>
                    {/* Address Bar */}
                    <div className="flex-1 max-w-md mx-auto bg-white border border-gray-200 rounded-md h-6 flex items-center px-3 shadow-sm">
                       <div className="w-3 h-3 text-gray-400 mr-2">
                         <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                       </div>
                       <span className="text-[10px] text-gray-500 font-medium truncate">docpage.com.br/preview/{briefing.name.toLowerCase().replace(/\s/g, '').replace(/[^\w]/g, '')}</span>
                    </div>
                 </div>
                 
                 {/* SCROLLABLE CONTENT AREA */}
                 <div className="flex-1 relative overflow-y-auto bg-white scroll-smooth custom-scrollbar">
                   <LayoutSchematic 
                     design={design} 
                     layoutVariant={layoutVariant} 
                     photoUrl={photoUrl} 
                   />
                 </div>
              </div>

              <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">
                 * Layout estrutural. Conteúdos finais serão aplicados no próximo passo.
              </p>
           </div>
        </main>
      </div>
    </div>
  );
};