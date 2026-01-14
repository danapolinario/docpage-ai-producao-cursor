import React, { useState, useEffect, useRef } from 'react';

// --- MultiSelect Component ---

interface MultiSelectProps {
  label: string;
  value: string; // Comma separated values
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ 
  label, 
  value, 
  onChange, 
  suggestions, 
  placeholder 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const items = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addItem = (item: string) => {
    const cleanItem = item.trim().replace(/,$/, ''); // Remove trailing comma if present
    if (cleanItem && !items.includes(cleanItem)) {
      const newItems = [...items, cleanItem];
      onChange(newItems.join(', '));
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeItem = (itemToRemove: string) => {
    const newItems = items.filter(item => item !== itemToRemove);
    onChange(newItems.join(', '));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Check if last char is comma
    if (val.includes(',')) {
      const parts = val.split(',');
      // Add all parts except the last empty one if it exists
      parts.forEach(part => {
        if (part.trim()) addItem(part);
      });
    } else {
      setInputValue(val);
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addItem(inputValue);
    }
  };

  const filteredSuggestions = suggestions.filter(s => 
    s.toLowerCase().includes(inputValue.toLowerCase()) && !items.includes(s)
  );

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="min-h-[42px] p-1.5 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <span key={idx} className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-md flex items-center gap-1 animate-fade-in">
            {item}
            <button 
              onClick={() => removeItem(item)}
              className="hover:text-blue-900 focus:outline-none"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setShowSuggestions(true)}
          placeholder={items.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none text-sm p-1 bg-transparent"
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-1">Separe os itens por vírgula</p>

      {showSuggestions && inputValue.length > 0 && filteredSuggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredSuggestions.map((suggestion, idx) => (
            <li 
              key={idx}
              onMouseDown={(e) => { e.preventDefault(); addItem(suggestion); }}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// --- Address Manager Component ---

interface AddressManagerProps {
  addresses: string[];
  onChange: (addresses: string[]) => void;
}

export const AddressManager: React.FC<AddressManagerProps> = ({ addresses, onChange }) => {
  const [inputValue, setInputValue] = useState('');
  const [showPredictions, setShowPredictions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Simulated Google Maps Predictions
  const predictions = [
    inputValue + ", Centro",
    inputValue + ", Jardins",
    inputValue + ", Zona Sul",
    "Av. Paulista, 1000 - Bela Vista",
    "Rua Oscar Freire, 500 - Cerqueira César",
    "Av. Copacabana, 200 - Rio de Janeiro",
  ].filter(p => p.toLowerCase().includes(inputValue.toLowerCase()) && inputValue.length > 3);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowPredictions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addAddress = (addr: string) => {
    if (addr && !addresses.includes(addr)) {
      onChange([...addresses, addr]);
    }
    setInputValue('');
    setShowPredictions(false);
  };

  const removeAddress = (index: number) => {
    onChange(addresses.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700">Endereço(s) da Clínica</label>
      
      {/* Input Area */}
      <div className="relative">
        <div className="flex items-center border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <div className="pl-3 text-gray-400">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowPredictions(true);
            }}
            onFocus={() => setShowPredictions(true)}
            placeholder="Digite o endereço para buscar..."
            className="flex-1 p-2.5 outline-none text-sm bg-transparent"
          />
          {inputValue && (
            <button 
              onClick={() => addAddress(inputValue)}
              className="mr-2 text-xs font-bold text-blue-600 hover:text-blue-800 uppercase px-2 py-1 bg-blue-50 rounded"
            >
              Adicionar
            </button>
          )}
        </div>

        {/* Fake Google Maps Autocomplete Dropdown */}
        {showPredictions && inputValue.length > 2 && (
          <div className="absolute z-50 w-full bg-white border border-gray-200 mt-1 rounded-lg shadow-xl overflow-hidden">
             <div className="flex items-center gap-2 p-2 bg-gray-50 border-b border-gray-100">
               <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Google_Maps_icon_%282020%29.svg/1200px-Google_Maps_icon_%282020%29.svg.png" className="w-4 h-4" alt="Google" />
               <span className="text-[10px] text-gray-500 font-medium">Sugestões do Google Maps</span>
             </div>
             <ul>
               {predictions.map((pred, idx) => (
                 <li 
                   key={idx}
                   onMouseDown={() => addAddress(pred)}
                   className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm flex items-center gap-3 border-b border-gray-50 last:border-0"
                 >
                   <div className="bg-gray-100 p-1 rounded-full">
                     <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                   </div>
                   <span className="text-gray-700">{pred}</span>
                 </li>
               ))}
               <li 
                 onMouseDown={() => addAddress(inputValue)} 
                 className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-blue-600 font-medium flex items-center gap-3"
               >
                 <span className="text-xs">+</span> Usar "{inputValue}" manualmente
               </li>
             </ul>
          </div>
        )}
      </div>

      {/* List of Added Addresses */}
      {addresses.length > 0 && (
        <div className="space-y-2">
          {addresses.map((addr, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg group animate-fade-in">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                <span className="text-sm text-blue-900 font-medium">{addr}</span>
              </div>
              <button 
                onClick={() => removeAddress(idx)}
                className="text-blue-400 hover:text-red-500 transition-colors p-1"
                title="Remover endereço"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- SEO Rating Component (Unchanged) ---
export const SeoRating: React.FC<SeoRatingProps> = ({ data }) => {
  const calculateScore = () => {
    let score = 0;
    if (data.name?.length > 3) score += 10;
    if (data.specialty?.length > 3) score += 20;
    if (data.targetAudience?.length > 5) score += 15;
    if (data.mainServices?.length > 10) score += 20;
    if (data.bio?.length > 50) score += 20;
    if (data.addresses?.length > 0) score += 15; // Updated to check addresses array
    return Math.min(100, score);
  };

  const score = calculateScore();
  
  let label = 'Baixo';
  let color = 'bg-red-500';
  let feedback = 'Preencha mais detalhes para o Google encontrar sua página.';

  if (score >= 80) {
    label = 'Excelente';
    color = 'bg-green-500';
    feedback = 'Ótimo! Sua página terá alta relevância para o Google.';
  } else if (score >= 50) {
    label = 'Bom';
    color = 'bg-yellow-500';
    feedback = 'Bom começo. Adicione mais detalhes na Bio e Serviços para melhorar.';
  }

  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-6">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-gray-700 text-sm flex items-center gap-2">
          <span className="text-lg">⚡</span> Potencial de SEO & Conversão
        </h4>
        <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${color}`}>
          {label}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div className={`h-2.5 rounded-full transition-all duration-1000 ${color}`} style={{ width: `${score}%` }}></div>
      </div>
      
      <p className="text-xs text-gray-500 leading-tight">
        <span className="font-bold">O que é SEO?</span> SEO (Search Engine Optimization) ajuda sua página a aparecer nas buscas do Google quando pacientes procuram por sua especialidade. {feedback}
      </p>
    </div>
  );
};

interface SeoRatingProps {
  data: any;
}