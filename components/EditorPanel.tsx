
import React, { useState } from 'react';
import { LandingPageContent, DesignSettings, SectionVisibility, LayoutVariant, ThemeType } from '../types';

interface Props {
  content: LandingPageContent;
  design: DesignSettings;
  visibility: SectionVisibility;
  layoutVariant: LayoutVariant;
  onUpdateContent: (key: keyof LandingPageContent, value: any) => void;
  onUpdateDesign: (key: keyof DesignSettings, value: any) => void;
  onUpdateLayout: (variant: LayoutVariant) => void;
  onToggleSection: (key: keyof SectionVisibility) => void;
  onRefineWithAI: (instruction: string) => void;
  modificationsLeft: number;
  isLoading: boolean;
  onPublish: () => void;
  onHide: () => void;
  onThemeSelect: (theme: ThemeType) => void;
  hasCustomTestimonials?: boolean; // NOVO: Flag para indicar se depoimentos são customizados
}


type Tab = 'content' | 'design';

export const EditorPanel: React.FC<Props> = ({
  content,
  design,
  visibility,
  layoutVariant,
  onUpdateContent,
  onUpdateDesign,
  onUpdateLayout,
  onToggleSection,
  onRefineWithAI,
  modificationsLeft,
  isLoading,
  onPublish,
  onHide,
  onThemeSelect,
  hasCustomTestimonials,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('content');
  const [expandedSection, setExpandedSection] = useState<keyof SectionVisibility | null>(null);

  const toggleAccordion = (section: keyof SectionVisibility) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // --- Array Handlers ---
  const handleServiceChange = (index: number, field: 'title' | 'description', value: string) => {
    const newServices = [...content.services];
    newServices[index] = { ...newServices[index], [field]: value };
    onUpdateContent('services', newServices);
  };

  const handleDeleteService = (index: number) => {
    onUpdateContent('services', content.services.filter((_, i) => i !== index));
  };

  const handleAddService = () => {
    onUpdateContent('services', [...content.services, { title: 'Novo Serviço', description: 'Descrição...' }]);
  };

  const handleTestimonialChange = (index: number, field: 'name' | 'text', value: string) => {
    const newTestimonials = [...content.testimonials];
    newTestimonials[index] = { ...newTestimonials[index], [field]: value };
    onUpdateContent('testimonials', newTestimonials);
  };

  const handleDeleteTestimonial = (index: number) => {
    onUpdateContent('testimonials', content.testimonials.filter((_, i) => i !== index));
  };

  const handleAddTestimonial = () => {
    onUpdateContent('testimonials', [...content.testimonials, { name: 'Paciente', text: 'Depoimento...' }]);
  };

  // --- Address Handlers ---
  const addresses = content.contactAddresses || (content.contactAddress ? [content.contactAddress] : []);

  const handleAddAddress = () => {
    const newAddr = prompt("Digite o novo endereço:");
    if (newAddr) {
      onUpdateContent('contactAddresses', [...addresses, newAddr]);
    }
  };

  const handleRemoveAddress = (index: number) => {
    onUpdateContent('contactAddresses', addresses.filter((_, i) => i !== index));
  };

  const layouts = [
    { id: 1, name: 'Clássico Dividido', desc: 'Foto e texto lado a lado.' },
    { id: 2, name: 'Moderno Central', desc: 'Foco no centro, foto abaixo.' },
    { id: 3, name: 'Fluxo Orgânico', desc: 'Layout fluido com máscaras.' },
    { id: 4, name: 'Grid Studio', desc: 'Estilo revista com bordas.' },
    { id: 5, name: 'Editorial Luxo', desc: 'Tipografia grande e elegante.' },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-xl overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h3 className="font-bold text-gray-800">Editor</h3>
        <button onClick={onHide} className="text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-200 px-2 py-1 rounded flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          Ocultar
        </button>
      </div>

      <div className="flex border-b border-gray-200">
        <button onClick={() => setActiveTab('content')} className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'content' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}>Conteúdo</button>
        <button onClick={() => setActiveTab('design')} className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'design' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}>Design</button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {activeTab === 'content' && (
          <div className="space-y-6 animate-fade-in">
            {/* Hero Inputs */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Cabeçalho</h4>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Título</label>
                <input type="text" value={content.headline} onChange={(e) => onUpdateContent('headline', e.target.value)} className="w-full text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Subtítulo</label>
                <textarea value={content.subheadline} onChange={(e) => onUpdateContent('subheadline', e.target.value)} className="w-full text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 h-20" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">CTA</label>
                <input type="text" value={content.ctaText} onChange={(e) => onUpdateContent('ctaText', e.target.value)} className="w-full text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Sections Accordion */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Seções</h4>
              
              {/* About */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={visibility.about} onChange={() => onToggleSection('about')} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm font-medium text-gray-700">Sobre</span>
                  </div>
                  <button onClick={() => toggleAccordion('about')}><svg className={`w-4 h-4 transform ${expandedSection === 'about' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
                </div>
                {expandedSection === 'about' && visibility.about && (
                  <div className="p-3 bg-white border-t border-gray-200 space-y-2">
                     <input
                       type="text"
                       value={content.aboutTitle}
                       onChange={(e) => onUpdateContent('aboutTitle', e.target.value)}
                       className="w-full text-sm p-2 border border-gray-300 rounded"
                       placeholder="Título da seção"
                     />
                     <textarea
                       value={content.aboutBody}
                       onChange={(e) => onUpdateContent('aboutBody', e.target.value)}
                       className="w-full text-sm p-2 border border-gray-300 rounded h-24"
                       placeholder="Bio / apresentação do médico"
                     />

                     <div className="pt-2 border-t border-gray-100 space-y-2">
                       <p className="text-[11px] font-semibold text-gray-600">
                         Destaques em números (opcional)
                       </p>
                       <p className="text-[10px] text-gray-500">
                         Use para mostrar números como "15+ anos de experiência" e "5k+ pacientes atendidos". Deixe em branco se não quiser exibir.
                       </p>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                         <div className="space-y-1">
                           <label className="block text-[11px] font-medium text-gray-500">
                             Valor 1 (ex.: 15+)
                           </label>
                           <input
                             type="text"
                             value={content.aboutExperienceValue || ''}
                             onChange={(e) => onUpdateContent('aboutExperienceValue', e.target.value)}
                             className="w-full text-xs p-2 border border-gray-200 rounded"
                             placeholder="Deixe em branco para ocultar"
                           />
                           <input
                             type="text"
                             value={content.aboutExperienceLabel || ''}
                             onChange={(e) => onUpdateContent('aboutExperienceLabel', e.target.value)}
                             className="w-full text-xs p-2 border border-gray-200 rounded"
                             placeholder="Texto (ex.: Anos de Experiência)"
                           />
                         </div>
                         <div className="space-y-1">
                           <label className="block text-[11px] font-medium text-gray-500">
                             Valor 2 (ex.: 5k+)
                           </label>
                           <input
                             type="text"
                             value={content.aboutPatientsValue || ''}
                             onChange={(e) => onUpdateContent('aboutPatientsValue', e.target.value)}
                             className="w-full text-xs p-2 border border-gray-200 rounded"
                             placeholder="Deixe em branco para ocultar"
                           />
                           <input
                             type="text"
                             value={content.aboutPatientsLabel || ''}
                             onChange={(e) => onUpdateContent('aboutPatientsLabel', e.target.value)}
                             className="w-full text-xs p-2 border border-gray-200 rounded"
                             placeholder="Texto (ex.: Pacientes Atendidos)"
                           />
                         </div>
                       </div>
                     </div>
                  </div>
                )}

              </div>

              {/* Services */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={visibility.services} onChange={() => onToggleSection('services')} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm font-medium text-gray-700">Serviços ({content.services.length})</span>
                  </div>
                  <button onClick={() => toggleAccordion('services')}><svg className={`w-4 h-4 transform ${expandedSection === 'services' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
                </div>
                {expandedSection === 'services' && visibility.services && (
                  <div className="p-3 bg-white border-t border-gray-200 space-y-4">
                     <input type="text" value={content.servicesTitle} onChange={(e) => onUpdateContent('servicesTitle', e.target.value)} className="w-full text-sm p-2 border border-gray-300 rounded" placeholder="Título Seção" />
                     {content.services.map((service, idx) => (
                       <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-100 relative group">
                          <button onClick={() => handleDeleteService(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100">✕</button>
                          <input className="w-full text-sm font-bold bg-transparent border-b border-transparent focus:border-blue-300 outline-none mb-1" value={service.title} onChange={(e) => handleServiceChange(idx, 'title', e.target.value)} />
                          <textarea className="w-full text-xs text-gray-600 bg-transparent resize-none outline-none" value={service.description} onChange={(e) => handleServiceChange(idx, 'description', e.target.value)} rows={2} />
                       </div>
                     ))}
                     <button onClick={handleAddService} className="w-full py-2 text-xs font-bold text-blue-600 border border-dashed border-blue-300 rounded hover:bg-blue-50">+ Add Serviço</button>
                  </div>
                )}
              </div>
              
              {/* Testimonials */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                 <div className="flex items-center justify-between p-3 bg-gray-50">
                    <div className="flex items-center gap-2">
                       <input type="checkbox" checked={visibility.testimonials} onChange={() => onToggleSection('testimonials')} className="w-4 h-4 text-blue-600 rounded" />
                       <span className="text-sm font-medium text-gray-700">Depoimentos ({content.testimonials.length})</span>
                       {!hasCustomTestimonials && (
                         <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
                           </svg>
                           Atenção
                         </span>
                       )}
                    </div>
                    <button onClick={() => toggleAccordion('testimonials')}><svg className={`w-4 h-4 transform ${expandedSection === 'testimonials' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
                 </div>
                 {expandedSection === 'testimonials' && visibility.testimonials && (
                    <div className="p-3 bg-white border-t border-gray-200 space-y-4">
                       {!hasCustomTestimonials && (
                         <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200">
                           <svg className="w-4 h-4 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
                           </svg>
                           <p className="text-xs text-amber-800">
                             Os depoimentos abaixo são <strong>ilustrativos</strong>. Altere os textos com experiências reais dos seus pacientes ou desative a seção de depoimentos para seguir em conformidade com o CFM.
                           </p>
                         </div>
                       )}
                       {content.testimonials.map((t, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-100 relative group">
                             <button onClick={() => handleDeleteTestimonial(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100">✕</button>
                             <input className="w-full text-sm font-bold bg-transparent border-b border-transparent focus:border-blue-300 outline-none mb-1" value={t.name} onChange={(e) => handleTestimonialChange(idx, 'name', e.target.value)} />
                             <textarea className="w-full text-xs text-gray-600 bg-transparent resize-none outline-none italic" value={t.text} onChange={(e) => handleTestimonialChange(idx, 'text', e.target.value)} rows={3} />
                          </div>
                       ))}
                       <button onClick={handleAddTestimonial} className="w-full py-2 text-xs font-bold text-blue-600 border border-dashed border-blue-300 rounded hover:bg-blue-50">+ Adicionar Depoimento</button>
                    </div>
                 )}
              </div>

               <label className="flex items-center justify-between cursor-pointer p-3 border border-gray-200 bg-gray-50 rounded-lg hover:bg-gray-100">
                <div className="flex items-center gap-2">
                   <input type="checkbox" checked={visibility.footer} onChange={() => onToggleSection('footer')} className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm font-medium text-gray-700">Rodapé</span>
                </div>
              </label>
            </div>

            <hr className="border-gray-100" />

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Contato e Endereços</h4>
              <input type="text" value={content.contactEmail || ''} onChange={(e) => onUpdateContent('contactEmail', e.target.value)} className="w-full text-sm p-2 border border-gray-300 rounded" placeholder="Email" />
              <input type="text" value={content.contactPhone || ''} onChange={(e) => onUpdateContent('contactPhone', e.target.value)} className="w-full text-sm p-2 border border-gray-300 rounded" placeholder="Telefone" />
              
              <div className="space-y-2">
                <label className="text-xs text-gray-500">Endereços ({addresses.length})</label>
                {addresses.map((addr, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input disabled value={addr} className="w-full text-xs bg-gray-50 border border-gray-200 rounded p-2 text-gray-600" />
                    <button onClick={() => handleRemoveAddress(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded">✕</button>
                  </div>
                ))}
                <button onClick={handleAddAddress} className="w-full py-2 text-xs border border-blue-200 text-blue-600 rounded hover:bg-blue-50">
                  + Adicionar Endereço
                </button>
              </div>
              
              <input type="text" value={content.footerText} onChange={(e) => onUpdateContent('footerText', e.target.value)} className="w-full text-sm p-2 border border-gray-300 rounded" placeholder="Texto Rodapé" />
            </div>

          </div>
        )}

        {activeTab === 'design' && (
           <div className="space-y-6 animate-fade-in">
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">Tema Visual</h4>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => {
                      console.log('[EditorPanel] Tema Visual: Clínico & Limpo clicado');
                      onThemeSelect(ThemeType.CLINICAL);
                    }}
                    className={`w-full p-3 text-left border rounded-lg text-xs transition-all ${design.colorPalette === 'blue' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="font-semibold text-gray-800">Clínico &amp; Limpo</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">Azuis, branco e sensação de segurança. Ideal para cardiologia e clínica geral.</div>
                  </button>
                  <button
                    onClick={() => {
                      console.log('[EditorPanel] Tema Visual: Acolhedor & Natural clicado');
                      onThemeSelect(ThemeType.CARING);
                    }}
                    className={`w-full p-3 text-left border rounded-lg text-xs transition-all ${design.colorPalette === 'green' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="font-semibold text-gray-800">Acolhedor &amp; Natural</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">Tons suaves e arredondados. Indicado para pediatria, psicologia e geriatria.</div>
                  </button>
                  <button
                    onClick={() => {
                      console.log('[EditorPanel] Tema Visual: Moderno & Tech clicado');
                      onThemeSelect(ThemeType.MODERN);
                    }}
                    className={`w-full p-3 text-left border rounded-lg text-xs transition-all ${design.colorPalette === 'slate' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="font-semibold text-gray-800">Moderno &amp; Tech</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">Visual mais escuro, com vidro e contraste forte. Ótimo para estética e tecnologia.</div>
                  </button>
                </div>
              </div>
              <hr className="border-gray-100" />
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">Estrutura (Layout)</h4>
                <div className="grid grid-cols-1 gap-2">
                  {layouts.map((l) => (
                    <button key={l.id} onClick={() => onUpdateLayout(l.id as LayoutVariant)} className={`w-full p-2 text-left border rounded-lg transition-all flex items-center justify-between ${layoutVariant === l.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div><span className={`block text-sm font-bold ${layoutVariant === l.id ? 'text-blue-700' : 'text-gray-800'}`}>{l.name}</span><span className="text-xs text-gray-500">{l.desc}</span></div>
                      {layoutVariant === l.id && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                    </button>
                  ))}
                </div>
              </div>
              <hr className="border-gray-100" />
              <div>
                 <h4 className="text-sm font-bold text-gray-700 mb-3">Estilo da Foto</h4>
                 <select value={design.photoStyle || 'minimal'} onChange={(e) => onUpdateDesign('photoStyle', e.target.value)} className="w-full p-2 text-sm border border-gray-300 rounded-lg">
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
              <hr className="border-gray-100" />
              <div>
                 <h4 className="text-sm font-bold text-gray-700 mb-3">Cor Principal</h4>
                 <div className="grid grid-cols-5 gap-2">
                   {[{ id: 'blue', bg: 'bg-blue-500' }, { id: 'green', bg: 'bg-emerald-500' }, { id: 'rose', bg: 'bg-rose-500' }, { id: 'indigo', bg: 'bg-indigo-600' }, { id: 'slate', bg: 'bg-slate-600' }].map(c => (
                     <button key={c.id} onClick={() => onUpdateDesign('colorPalette', c.id)} className={`h-8 w-8 rounded-full ${c.bg} transition-all ${design.colorPalette === c.id ? 'ring-2 ring-blue-500 scale-110' : 'hover:scale-105'}`} />
                   ))}
                 </div>
              </div>
              <div>
                 <h4 className="text-sm font-bold text-gray-700 mb-3">Estilo de Botões</h4>
                 <div className="flex gap-2">
                   <button onClick={() => onUpdateDesign('borderRadius', 'none')} className={`flex-1 p-2 border text-xs bg-gray-100 ${design.borderRadius === 'none' ? 'border-blue-500 text-blue-700 font-bold' : ''}`}>Quadrado</button>
                   <button onClick={() => onUpdateDesign('borderRadius', 'medium')} className={`flex-1 p-2 border text-xs bg-gray-100 rounded-lg ${design.borderRadius === 'medium' ? 'border-blue-500 text-blue-700 font-bold' : ''}`}>Suave</button>
                   <button onClick={() => onUpdateDesign('borderRadius', 'full')} className={`flex-1 p-2 border text-xs bg-gray-100 rounded-full ${design.borderRadius === 'full' ? 'border-blue-500 text-blue-700 font-bold' : ''}`}>Redondo</button>
                 </div>
              </div>
           </div>
        )}


      </div>
    </div>
  );
};
