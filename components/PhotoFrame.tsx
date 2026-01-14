import React from 'react';
import { PhotoStyle, DesignSettings } from '../types';
import { getDesignClasses } from '../utils/designSystem';

interface Props {
  photoUrl: string | null;
  design: DesignSettings;
  className?: string;
  alt?: string;
  mode?: 'normal' | 'schematic';
}

export const PhotoFrame: React.FC<Props> = ({ photoUrl, design, className = "", alt = "Foto", mode = 'normal' }) => {
  const { p, s, r } = getDesignClasses(design);
  const src = photoUrl || "https://picsum.photos/800/800";
  const style = design.photoStyle || 'minimal';

  // Helper to render content based on mode
  const renderContent = () => {
    if (mode === 'schematic') {
      return (
        <div className={`w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 ${className}`}>
          <svg className="w-1/3 h-1/3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      );
    }
    return (
      <img 
        src={src} 
        alt={alt} 
        className={`w-full h-full object-cover transition-transform duration-700 hover:scale-105 ${className}`} 
      />
    );
  };

  switch (style) {
    case 'organic':
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Blobs */}
          <div className={`absolute top-0 right-0 w-full h-full ${s.bg} opacity-20 blur-3xl rounded-full mix-blend-multiply animate-pulse`}></div>
          <div className={`absolute bottom-0 left-0 w-full h-full ${p.accent} opacity-20 blur-3xl rounded-full mix-blend-multiply animate-pulse delay-700`}></div>
          
          <div className="relative w-full h-full overflow-hidden shadow-2xl" 
               style={{ 
                 borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                 animation: 'blob 7s infinite ease-in-out'
               }}>
            {renderContent()}
          </div>
        </div>
      );

    case 'framed':
      return (
        <div className="relative w-full h-full p-2 md:p-4">
           {/* Offset Border */}
           <div className={`absolute top-0 left-0 w-full h-full border-2 ${p.border} rounded-xl translate-x-1 translate-y-1 md:translate-x-2 md:translate-y-2 z-0`}></div>
           <div className={`absolute top-0 left-0 w-full h-full border-2 ${s.border} rounded-xl -translate-x-1 -translate-y-1 md:-translate-x-2 md:-translate-y-2 z-0 opacity-50`}></div>
           <div className={`relative z-10 w-full h-full rounded-lg overflow-hidden shadow-lg bg-white p-1 md:p-2`}>
             <div className="w-full h-full rounded overflow-hidden">
               {renderContent()}
             </div>
           </div>
        </div>
      );

    case 'glass':
      return (
        <div className="relative w-full h-full">
           <div className={`absolute inset-0 ${p.accent} opacity-20 blur-2xl rounded-full transform translate-y-4`}></div>
           <div className={`relative z-10 w-full h-full rounded-2xl overflow-hidden border border-white/40 shadow-2xl`}>
             {renderContent()}
             <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
           </div>
        </div>
      );

    case 'floating':
      return (
        <div className="relative w-full h-full animate-float-1">
           <div className={`absolute -bottom-8 -right-8 w-24 h-24 ${s.bg} rounded-full opacity-20 blur-xl`}></div>
           <div className={`relative w-full h-full rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)]`}>
             {renderContent()}
           </div>
           {/* Floating Chip */}
           <div className={`absolute -bottom-4 -left-4 bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg shadow-lg border ${p.border} flex items-center gap-2 animate-float-2`}>
              <div className={`w-2 h-2 rounded-full ${s.bg}`}></div>
              <span className="text-[10px] md:text-xs font-bold text-gray-800">Verificado</span>
           </div>
        </div>
      );

    case 'arch':
      return (
        <div className="w-full h-full relative">
          <div className={`absolute top-1 left-1 md:top-2 md:left-2 w-full h-full border-2 ${p.border} rounded-t-[5rem] md:rounded-t-[10rem] rounded-b-xl z-0`}></div>
          <div className={`relative z-10 w-full h-full overflow-hidden rounded-t-[5rem] md:rounded-t-[10rem] rounded-b-xl shadow-lg ${r.box}`}>
            {renderContent()}
          </div>
        </div>
      );

    case 'rotate':
      return (
        <div className="w-full h-full relative flex items-center justify-center p-4">
          <div className={`absolute inset-0 ${s.bg} rounded-xl rotate-6 opacity-20 scale-95`}></div>
           <div className={`relative w-full h-full shadow-xl rotate-[-3deg] transition-transform hover:rotate-0 duration-500 ${r.box} overflow-hidden`}>
             {renderContent()}
           </div>
        </div>
      );

    case 'collage':
       return (
         <div className="w-full h-full relative p-2">
            <div className={`absolute top-0 right-0 w-12 h-12 md:w-20 md:h-20 ${s.bg} rounded-full mix-blend-multiply opacity-50`}></div>
            <div className={`absolute bottom-0 left-0 w-10 h-10 md:w-16 md:h-16 ${p.accent} rounded-lg mix-blend-multiply opacity-50 rotate-12`}></div>
            <div className={`relative w-full h-full border-4 border-white shadow-xl ${r.box} overflow-hidden`}>
               {renderContent()}
            </div>
         </div>
       );

    case 'minimal':
    default:
      return (
        <div className={`w-full h-full overflow-hidden ${r.box} shadow-xl`}>
          {renderContent()}
        </div>
      );
  }
};