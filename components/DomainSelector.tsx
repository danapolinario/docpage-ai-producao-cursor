import React, { useState, useEffect } from 'react';

interface Props {
  onDomainSelected: (domain: string) => void;
  onBack: () => void;
}

export const DomainSelector: React.FC<Props> = ({ onDomainSelected, onBack }) => {
  const [domain, setDomain] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleCheck = () => {
    if (!domain) return;
    setIsSearching(true);
    setIsAvailable(null);

    // Simulate API Check
    setTimeout(() => {
      setIsSearching(false);
      setIsAvailable(true); // Always available for demo effect
      setShowConfetti(true);
    }, 1500);
  };

  const handleContinue = () => {
    onDomainSelected(domain.includes('.') ? domain : `${domain}.com.br`);
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in py-8">
      <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-100 text-center relative overflow-hidden">
        
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none flex justify-center overflow-hidden">
             <div className="absolute top-0 w-full h-full bg-gradient-to-b from-green-50/50 to-transparent"></div>
          </div>
        )}

        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Escolha seu endereço digital</h2>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto">
            Antes de publicar, vamos garantir seu domínio exclusivo. Digite como você quer que seus pacientes te encontrem.
          </p>

          <div className="max-w-xl mx-auto relative mb-8">
             <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 transition-all bg-white shadow-sm h-16">
                <span className="pl-4 text-gray-400 font-bold text-lg">www.</span>
                <input 
                  type="text" 
                  value={domain}
                  onChange={(e) => {
                    setDomain(e.target.value.toLowerCase().replace(/\s/g, ''));
                    setIsAvailable(null);
                    setShowConfetti(false);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                  placeholder="seu-nome"
                  className="flex-1 h-full outline-none px-1 text-lg font-bold text-gray-800 placeholder-gray-300"
                />
                <select className="h-full bg-gray-50 border-l border-gray-200 text-gray-600 font-bold px-4 outline-none">
                  <option>.com.br</option>
                  <option>.med.br</option>
                  <option>.com</option>
                </select>
             </div>
             
             {/* Status Message */}
             <div className="h-8 mt-3 flex items-center justify-center">
               {isSearching && (
                 <span className="text-gray-500 flex items-center gap-2 text-sm font-medium animate-pulse">
                   <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   Verificando disponibilidade...
                 </span>
               )}
               
               {isAvailable && (
                 <span className="text-green-600 flex items-center gap-2 text-sm font-bold bg-green-50 px-3 py-1 rounded-full border border-green-200">
                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                   Disponível! Reserve agora.
                 </span>
               )}
             </div>
          </div>

          <div className="flex justify-center gap-4">
             <button 
               onClick={onBack}
               className="px-6 py-3 text-gray-500 font-medium hover:bg-gray-50 rounded-lg transition-colors"
             >
               Voltar
             </button>
             
             {!isAvailable ? (
               <button 
                 onClick={handleCheck}
                 disabled={!domain}
                 className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 Verificar Disponibilidade
               </button>
             ) : (
               <button 
                 onClick={handleContinue}
                 className="px-10 py-3 bg-green-600 text-white rounded-lg font-bold shadow-lg shadow-green-200 hover:bg-green-700 hover:-translate-y-0.5 transition-all animate-bounce-short"
               >
                 Reservar e Publicar ➔
               </button>
             )}
          </div>

        </div>
      </div>
      
      {/* Social Proof */}
      <div className="mt-8 text-center">
         <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-4">Já garantiram seu domínio</p>
         <div className="flex justify-center -space-x-3">
            <img className="w-10 h-10 rounded-full border-2 border-white" src="https://randomuser.me/api/portraits/men/32.jpg" alt="" />
            <img className="w-10 h-10 rounded-full border-2 border-white" src="https://randomuser.me/api/portraits/women/44.jpg" alt="" />
            <img className="w-10 h-10 rounded-full border-2 border-white" src="https://randomuser.me/api/portraits/men/86.jpg" alt="" />
            <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-bold">+2k</div>
         </div>
      </div>
    </div>
  );
};