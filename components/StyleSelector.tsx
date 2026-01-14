import React from 'react';
import { ThemeType } from '../types';

interface Props {
  selectedTheme: ThemeType;
  onSelect: (theme: ThemeType) => void;
  onNext: () => void;
  onBack: () => void;
}

export const StyleSelector: React.FC<Props> = ({ selectedTheme, onSelect, onNext, onBack }) => {
  const themes = [
    {
      id: ThemeType.CLINICAL,
      name: 'Clínico & Limpo',
      description: 'Ideal para hospitais e cirurgiões. Foco em azul, branco e segurança.',
      renderThumbnail: () => (
        <div className="w-full h-full bg-slate-50 relative overflow-hidden flex flex-col font-sans">
           <div className="h-6 bg-white border-b border-gray-100 flex items-center px-2 gap-1">
             <div className="w-2 h-2 rounded-full bg-blue-500"></div>
             <div className="w-12 h-1 bg-gray-200 rounded"></div>
           </div>
           <div className="flex-1 p-3 flex gap-2">
             <div className="flex-1 space-y-2">
               <div className="w-3/4 h-3 bg-blue-900 rounded-sm"></div>
               <div className="w-full h-1 bg-gray-200 rounded"></div>
               <div className="w-5/6 h-1 bg-gray-200 rounded"></div>
               <div className="w-12 h-4 bg-blue-600 rounded-md mt-2"></div>
             </div>
             <div className="w-1/3 h-20 bg-white border border-gray-200 rounded-lg shadow-sm"></div>
           </div>
        </div>
      )
    },
    {
      id: ThemeType.CARING,
      name: 'Acolhedor & Natural',
      description: 'Para pediatria e psicologia. Tons suaves e formas arredondadas.',
      renderThumbnail: () => (
        <div className="w-full h-full bg-[#f8fafc] relative overflow-hidden flex flex-col font-serif">
           <div className="absolute top-0 right-0 w-24 h-24 bg-green-100 rounded-full blur-xl opacity-50 -mr-8 -mt-8"></div>
           <div className="h-8 flex justify-center items-center">
             <div className="w-16 h-1 bg-emerald-700 rounded-full opacity-20"></div>
           </div>
           <div className="flex-1 p-3 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-emerald-200 mb-2 border-2 border-white shadow-sm"></div>
              <div className="w-20 h-2 bg-emerald-900 rounded-full mb-1"></div>
              <div className="w-16 h-1 bg-emerald-700/30 rounded-full"></div>
              <div className="w-16 h-4 bg-emerald-600 rounded-full mt-2"></div>
           </div>
        </div>
      )
    },
    {
      id: ThemeType.MODERN,
      name: 'Moderno & Tech',
      description: 'Para estética e tecnologia. Minimalista, dark mode e vidro.',
      renderThumbnail: () => (
        <div className="w-full h-full bg-slate-900 relative overflow-hidden flex flex-col">
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20"></div>
           <div className="h-full p-4 flex flex-col justify-center items-center relative z-10">
              <div className="w-full h-24 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-3 flex flex-col justify-center">
                 <div className="w-1/2 h-2 bg-white rounded-full mb-2"></div>
                 <div className="w-3/4 h-1 bg-gray-400 rounded-full"></div>
                 <div className="flex gap-2 mt-3">
                   <div className="flex-1 h-5 bg-indigo-500 rounded-md"></div>
                   <div className="flex-1 h-5 bg-white/10 rounded-md border border-white/20"></div>
                 </div>
              </div>
           </div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
          Escolha o Estilo Visual
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {themes.map((theme) => (
            <div
              key={theme.id}
              onClick={() => onSelect(theme.id)}
              className={`cursor-pointer group relative rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                selectedTheme === theme.id
                  ? 'border-blue-600 ring-4 ring-blue-50 shadow-xl scale-[1.02]'
                  : 'border-gray-100 hover:border-blue-300 hover:shadow-lg'
              }`}
            >
              {/* Thumbnail Area */}
              <div className="h-40 w-full border-b border-gray-100 transition-transform duration-500 group-hover:scale-105 origin-top">
                {theme.renderThumbnail()}
              </div>

              {/* Text Area */}
              <div className="p-5">
                <div className="flex justify-between items-center mb-2">
                   <h3 className={`font-bold text-lg ${selectedTheme === theme.id ? 'text-blue-700' : 'text-gray-800'}`}>
                     {theme.name}
                   </h3>
                   {selectedTheme === theme.id && (
                     <div className="bg-blue-600 text-white p-1 rounded-full">
                       <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                     </div>
                   )}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{theme.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={onBack}
            className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={onNext}
            className="px-6 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform"
          >
            Próximo: Foto Profissional
          </button>
        </div>
      </div>
    </div>
  );
};