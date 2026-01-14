import React from 'react';
import { DesignSettings, LayoutVariant } from '../types';
import { getDesignClasses } from '../utils/designSystem';
import { PhotoFrame } from './PhotoFrame';

interface Props {
  design: DesignSettings;
  layoutVariant: LayoutVariant;
  photoUrl: string | null;
}

export const LayoutSchematic: React.FC<Props> = ({ design, layoutVariant, photoUrl }) => {
  const { p, s, r } = getDesignClasses(design);

  // --- Helper Blocks ---
  const TextBlock = ({ width = "w-full", height = "h-2", className = "", color = "bg-gray-200" }) => (
    <div className={`${width} ${height} rounded ${color} opacity-60 ${className}`}></div>
  );

  const ButtonBlock = ({ width = "w-32" }) => (
    <div className={`${width} h-8 md:h-10 ${p.accent} ${r.btn} shadow-md`}></div>
  );

  const TitleBlock = ({ width = "w-3/4", height = "h-6 md:h-8", color = p.primary.replace('text-', 'bg-') }) => (
    <div className={`${width} ${height} ${color} rounded mb-3 md:mb-4 opacity-80`}></div>
  );

  // --- Common Sections Abstraction ---

  const ServicesRow = () => (
    <div className="py-6 px-4 md:py-8 md:px-6 bg-white">
      <div className="flex justify-center gap-2 md:gap-4 overflow-hidden">
        {[1, 2, 3].map(i => (
          <div key={i} className={`flex-1 h-24 md:h-32 border ${p.border} ${r.box} p-2 md:p-3 flex flex-col items-center justify-center gap-1 md:gap-2 shadow-sm`}>
             <div className={`w-6 h-6 md:w-8 md:h-8 ${p.accent} opacity-20 rounded-full`}></div>
             <div className={`w-10 h-2 md:w-16 md:h-3 ${p.primary.replace('text-', 'bg-')} opacity-60 rounded`}></div>
             <div className="w-full space-y-1 hidden md:block">
                <TextBlock height="h-1" />
                <TextBlock height="h-1" width="w-2/3" className="mx-auto" />
             </div>
          </div>
        ))}
      </div>
    </div>
  );

  const AboutAbstract = () => (
    <div className={`py-8 px-4 md:py-12 md:px-6 ${p.surface} flex gap-4 md:gap-6 items-center`}>
      <div className="w-1/2 space-y-2 md:space-y-3">
         <TitleBlock width="w-2/3" height="h-4 md:h-6" />
         <TextBlock />
         <TextBlock />
         <TextBlock width="w-4/5" />
      </div>
      <div className="w-1/2 h-24 md:h-32 bg-gray-300 rounded-lg opacity-50 relative overflow-hidden">
         <PhotoFrame photoUrl={photoUrl} design={design} mode="schematic" className="opacity-50" />
      </div>
    </div>
  );
  
  const TestimonialsRow = () => (
     <div className="py-8 px-4 md:py-12 md:px-6 bg-white">
        <div className="grid grid-cols-2 gap-2 md:gap-4">
           {[1, 2].map(i => (
             <div key={i} className={`p-3 md:p-4 border ${p.border} ${r.box} bg-gray-50`}>
                <TextBlock width="w-4 md:w-6" height="h-3 md:h-4" className="mb-2" color="bg-gray-400" />
                <TextBlock className="mb-2" />
                <div className="flex gap-2 items-center mt-2">
                   <div className={`w-4 h-4 md:w-6 md:h-6 rounded-full ${p.accent}`}></div>
                   <TextBlock width="w-10 md:w-16" height="h-2" />
                </div>
             </div>
           ))}
        </div>
     </div>
  );

  const FooterBlock = () => (
    <div className={`py-6 px-4 md:py-8 md:px-6 ${p.surfaceDark} text-white`}>
      <div className="grid grid-cols-3 gap-2 md:gap-4">
         <div className="col-span-1 space-y-2">
            <div className={`w-12 md:w-20 h-3 md:h-4 bg-white opacity-20 rounded`}></div>
            <TextBlock width="w-full" color="bg-gray-500" />
         </div>
         <div className="col-span-1 space-y-2">
            <div className={`w-8 md:w-12 h-2 md:h-3 bg-white opacity-20 rounded`}></div>
            <TextBlock width="w-full" color="bg-gray-500" />
         </div>
         <div className="col-span-1 space-y-2">
            <div className={`w-8 md:w-12 h-2 md:h-3 bg-white opacity-20 rounded`}></div>
            <TextBlock width="w-full" color="bg-gray-500" />
         </div>
      </div>
    </div>
  );

  // --- Main Render Switch ---

  const renderContent = () => {
    switch (layoutVariant) {
      // --- Layout 2: Modern Centered ---
      case 2:
        return (
          <div className={`w-full min-h-full bg-white flex flex-col`}>
             {/* Navbar */}
             <div className="h-10 md:h-14 border-b border-gray-100 flex items-center justify-between px-4 md:px-6">
                <div className={`w-16 md:w-24 h-3 md:h-4 ${p.primary.replace('text-', 'bg-')} opacity-80 rounded`}></div>
                <div className="flex gap-2">
                   <div className="w-8 md:w-16 h-2 md:h-3 bg-gray-100 rounded"></div>
                   <div className="w-8 md:w-16 h-2 md:h-3 bg-gray-100 rounded"></div>
                </div>
             </div>
             
             {/* Hero */}
             <div className={`pt-6 pb-6 px-4 md:pt-10 md:pb-10 md:px-6 bg-gradient-to-br ${p.gradient} text-center`}>
                <div className="flex flex-col items-center max-w-lg mx-auto">
                   <div className={`w-12 md:w-20 h-3 md:h-4 ${p.surface} border ${p.border} rounded-full mb-3 md:mb-4`}></div>
                   <TitleBlock width="w-full" height="h-6 md:h-8" />
                   <TitleBlock width="w-2/3" height="h-6 md:h-8" />
                   <div className="w-full max-w-xs space-y-1 md:space-y-2 mt-2 mb-4 flex flex-col items-center">
                      <TextBlock width="w-full" />
                      <TextBlock width="w-5/6" />
                   </div>
                   <ButtonBlock />
                   
                   <div className="mt-6 md:mt-8 w-32 h-32 md:w-48 md:h-48 relative">
                      <PhotoFrame photoUrl={photoUrl} design={design} mode="schematic" className="object-top" />
                   </div>
                </div>
             </div>

             <ServicesRow />
             
             {/* About (Modern Style) */}
             <div className={`py-8 px-4 md:py-12 md:px-6 ${p.surfaceDark} text-white`}>
                <div className="flex flex-col items-center text-center gap-3 md:gap-4">
                   <TitleBlock width="w-1/2" height="h-4 md:h-6" color="bg-white" />
                   <TextBlock width="w-3/4" color="bg-gray-500" />
                   <TextBlock width="w-2/3" color="bg-gray-500" />
                </div>
             </div>

             <TestimonialsRow />
             <FooterBlock />
          </div>
        );

      // --- Layout 3: Organic/Immersive ---
      case 3:
        return (
           <div className={`w-full min-h-full bg-white flex flex-col`}>
              <div className="h-10 md:h-14 border-b border-gray-100 flex items-center justify-between px-4 md:px-6">
                <div className={`w-16 md:w-24 h-3 md:h-4 ${p.primary.replace('text-', 'bg-')} opacity-80 rounded`}></div>
              </div>
              <div className={`p-6 md:p-8 bg-gradient-to-br ${p.gradient} flex items-center gap-4 md:gap-6 overflow-hidden`}>
                 <div className="w-1/2 flex flex-col items-start gap-2 md:gap-4">
                    <div className={`w-12 md:w-16 h-3 md:h-4 ${p.surface} border ${p.border} rounded-full`}></div>
                    <div className="w-full">
                       <TitleBlock width="w-full" />
                       <TitleBlock width="w-3/4" />
                    </div>
                    <div className="w-full space-y-1 md:space-y-2">
                       <TextBlock />
                       <TextBlock />
                       <TextBlock width="w-2/3" />
                    </div>
                    <ButtonBlock />
                 </div>
                 <div className="w-1/2 flex justify-center">
                    <div className="w-24 h-24 md:w-40 md:h-40">
                       <PhotoFrame photoUrl={photoUrl} design={design} mode="schematic" />
                    </div>
                 </div>
              </div>

              {/* Services (Organic) */}
              <div className="py-8 px-4 md:py-12 md:px-6">
                 <div className="grid grid-cols-2 gap-2 md:gap-4">
                    <div className={`p-3 md:p-4 ${p.surface} rounded-tl-3xl rounded-br-3xl`}>
                       <div className={`w-6 h-6 md:w-8 md:h-8 ${s.bg} rounded-full mb-2 opacity-30`}></div>
                       <TextBlock width="w-2/3" height="h-3 md:h-4" />
                    </div>
                    <div className={`p-3 md:p-4 ${p.surface} rounded-tr-3xl rounded-bl-3xl`}>
                       <div className={`w-6 h-6 md:w-8 md:h-8 ${s.bg} rounded-full mb-2 opacity-30`}></div>
                       <TextBlock width="w-2/3" height="h-3 md:h-4" />
                    </div>
                 </div>
              </div>

              <AboutAbstract />
              
              {/* Testimonials (Bubbles) */}
              <div className="py-8 px-4 md:py-12 md:px-6">
                 <div className={`p-4 md:p-6 ${p.surface} rounded-3xl mb-2 md:mb-4`}>
                    <TextBlock />
                 </div>
              </div>

              <FooterBlock />
           </div>
        );

      // --- Layout 4: Grid Studio ---
      case 4:
         return (
            <div className={`w-full min-h-full bg-white flex flex-col`}>
               <div className="h-10 md:h-14 border-b-2 border-black flex items-center justify-between px-4 md:px-6">
                  <div className={`w-16 md:w-24 h-3 md:h-4 bg-black rounded-none`}></div>
               </div>
               
               {/* Hero */}
               <div className="p-4 md:p-8 grid grid-cols-12 gap-2 md:gap-4 border-b-2 border-black">
                  <div className={`col-span-7 ${p.surface} ${r.box} border ${p.border} p-4 md:p-6 flex flex-col justify-center`}>
                     <TitleBlock width="w-full" color="bg-black" />
                     <TitleBlock width="w-2/3" color="bg-black" />
                     <div className="w-full space-y-1 md:space-y-2 mb-2 md:mb-4 mt-2">
                        <TextBlock />
                        <TextBlock width="w-4/5" />
                     </div>
                     <div className={`w-16 md:w-24 h-6 md:h-8 ${p.accent} rounded-none`}></div>
                  </div>
                  <div className="col-span-5 flex items-center justify-center">
                     <div className="w-20 h-24 md:w-32 md:h-40">
                        <PhotoFrame photoUrl={photoUrl} design={design} mode="schematic" />
                     </div>
                  </div>
               </div>

               {/* Services (Grid) */}
               <div className="bg-gray-100 p-4 md:p-8 grid grid-cols-3 gap-1 border-b-2 border-black">
                  {[1, 2, 3].map(i => (
                     <div key={i} className="bg-white p-2 md:p-3 border border-transparent hover:border-black transition-all">
                        <div className="text-xl md:text-2xl font-black text-gray-200 mb-1 md:mb-2">{i}.</div>
                        <div className="w-8 md:w-12 h-2 md:h-3 bg-black mb-2"></div>
                        <TextBlock height="h-1" />
                     </div>
                  ))}
               </div>

               {/* About Grid */}
               <div className="grid grid-cols-2 border-b-2 border-black">
                  <div className={`p-4 md:p-8 ${p.surface} flex flex-col justify-center`}>
                     <TitleBlock width="w-1/2" height="h-4 md:h-6" color="bg-black" />
                     <TextBlock />
                     <TextBlock width="w-4/5" />
                  </div>
                  <div className="h-32 md:h-48 bg-gray-300">
                     <PhotoFrame photoUrl={photoUrl} design={design} mode="schematic" className="opacity-50" />
                  </div>
               </div>

               <FooterBlock />
            </div>
         );

      // --- Layout 5: Editorial ---
      case 5:
         return (
            <div className={`w-full min-h-full ${p.softBg} flex flex-col`}>
               <div className="h-10 md:h-14 border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
                  <div className={`w-16 md:w-24 h-3 md:h-4 bg-black`}></div>
               </div>
               
               {/* Hero */}
               <div className="p-4 md:p-8 border-b border-gray-200">
                  <div className="flex gap-4 md:gap-6 items-end">
                     <div className="w-2/3">
                        <div className={`w-20 md:w-32 h-2 ${s.bg} mb-2 opacity-50`}></div>
                        <div className={`w-full h-8 md:h-10 ${p.primary.replace('text-', 'bg-')} mb-2`}></div>
                        <div className={`w-2/3 h-8 md:h-10 ${p.primary.replace('text-', 'bg-')} mb-4 md:mb-6`}></div>
                        <div className="flex gap-2">
                           <div className={`w-16 md:w-24 h-6 md:h-8 ${p.accent}`}></div>
                           <div className={`w-16 md:w-24 h-6 md:h-8 border border-black`}></div>
                        </div>
                     </div>
                     <div className="w-1/3 space-y-2">
                        <TextBlock />
                        <TextBlock />
                        <TextBlock />
                     </div>
                  </div>
                  <div className="mt-4 md:mt-8 w-full h-24 md:h-32">
                     <PhotoFrame photoUrl={photoUrl} design={design} mode="schematic" className="object-center" />
                  </div>
               </div>

               {/* Services List */}
               <div className="py-4 md:py-8 px-4 md:px-6 bg-white border-b border-gray-200">
                  {[1, 2, 3].map(i => (
                     <div key={i} className="border-b border-gray-100 py-2 md:py-4 last:border-0">
                        <div className="flex justify-between items-center">
                           <div className="flex gap-4">
                              <span className="font-serif italic text-gray-400">0{i}</span>
                              <TextBlock width="w-24 md:w-40" height="h-3 md:h-4" color="bg-black" />
                           </div>
                           <div className="w-3 h-3 md:w-4 md:h-4 rounded-full border border-black"></div>
                        </div>
                     </div>
                  ))}
               </div>

               <FooterBlock />
            </div>
         );

      // --- Layout 1: Classic (Default) ---
      case 1:
      default:
        return (
          <div className={`w-full min-h-full bg-white flex flex-col`}>
             {/* Navbar */}
             <div className={`h-10 md:h-14 border-b ${p.border} flex items-center justify-between px-4 md:px-6 bg-white`}>
                <div className={`w-16 md:w-24 h-3 md:h-4 ${p.primary.replace('text-', 'bg-')} opacity-80 rounded`}></div>
                <div className={`w-12 md:w-20 h-6 md:h-8 ${p.accent} ${r.btn} opacity-80`}></div>
             </div>
             
             {/* Hero */}
             <div className={`p-4 md:p-8 bg-gradient-to-b ${p.gradient} grid grid-cols-2 gap-4 md:gap-6 items-center`}>
                <div className="space-y-2 md:space-y-4">
                   <div className={`w-12 md:w-16 h-3 md:h-4 ${p.surface} border ${p.border} rounded-full`}></div>
                   <div className="space-y-1">
                      <TitleBlock width="w-full" />
                      <TitleBlock width="w-3/4" />
                   </div>
                   <div className="w-full space-y-1 md:space-y-2">
                      <TextBlock />
                      <TextBlock />
                   </div>
                   <div className="flex gap-2 pt-2">
                      <ButtonBlock width="w-16 md:w-24" />
                      <div className={`w-16 md:w-24 h-8 md:h-10 border ${p.border} bg-white ${r.btn}`}></div>
                   </div>
                </div>
                <div className="flex justify-center">
                   <div className="w-20 h-24 md:w-32 md:h-40">
                      <PhotoFrame photoUrl={photoUrl} design={design} mode="schematic" />
                   </div>
                </div>
             </div>

             {/* Services Strip */}
             <ServicesRow />

             <AboutAbstract />

             <TestimonialsRow />

             <FooterBlock />
          </div>
        );
    }
  };

  return (
    <div className={`w-full min-h-full bg-gray-50 relative shadow-inner overflow-hidden`}>
       {renderContent()}
    </div>
  );
};