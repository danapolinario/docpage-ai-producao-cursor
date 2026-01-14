
import React from 'react';
import { BriefingData } from '../types';
import { MultiSelect, SeoRating, AddressManager } from './common/FormComponents';

interface Props {
  data: BriefingData;
  onChange: (data: BriefingData) => void;
  onNext: () => void;
}

const SPECIALTIES = ['Cardiologia', 'Dermatologia', 'Pediatria', 'Psicologia', 'Odontologia', 'Ortopedia', 'Ginecologia', 'Nutrição', 'Fisioterapia', 'Oftalmologia', 'Cirurgia Plástica', 'Endocrinologia'];
const AUDIENCES = ['Idosos', 'Crianças', 'Atletas', 'Mulheres', 'Gestantes', 'Executivos', 'Adolescentes'];
const SERVICES = ['Consulta de Rotina', 'Check-up', 'Cirurgia', 'Exames', 'Terapia', 'Clareamento', 'Harmonização Facial', 'Implantes', 'Reabilitação'];
const STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export const BriefingForm: React.FC<Props> = ({ data, onChange, onNext }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  const handleMultiSelectChange = (name: keyof BriefingData) => (value: string) => {
    onChange({ ...data, [name]: value });
  };

  const handleAddressChange = (addresses: string[]) => {
    onChange({ ...data, addresses });
  };

  const fillDemoData = () => {
    onChange({
      name: 'Dr. Ricardo Mendes',
      crm: '123456',
      crmState: 'SP',
      rqe: '54321',
      specialty: 'Cardiologia, Medicina Esportiva',
      targetAudience: 'Atletas, Executivos, Idosos',
      mainServices: 'Check-up Cardiológico, Teste Ergométrico, Mapa 24h, Avaliação Pré-operatória',
      bio: 'Formado pela USP com especialização em Cardiologia do Esporte. Dedico minha carreira a ajudar pacientes a viverem mais e melhor através da prevenção cardiovascular.',
      tone: 'Profissional e Seguro',
      addresses: ['Av. Paulista, 1000, São Paulo - SP', 'Rua Oscar Freire, 500, São Paulo - SP'],
      contactPhone: '(11) 99876-5432',
      contactEmail: 'contato@drricardo.com.br'
    });
  };

  const isFormValid = data.name && data.crm && data.crmState && data.specialty && data.mainServices;

  return (
    <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 animate-fade-in items-start">
      
      {/* Form Area */}
      <div className="flex-1 bg-white p-8 rounded-xl shadow-lg border border-gray-100 relative">
        <button 
          onClick={fillDemoData}
          className="absolute top-8 right-8 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
        >
          ✨ Preencher Exemplo
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
          Informações Básicas
        </h2>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
            <input
              type="text"
              name="name"
              value={data.name}
              onChange={handleChange}
              placeholder="Dr. João Silva"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Compliance Section */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
             <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Credenciais (Obrigatório CFM)</h3>
             </div>
             <div className="grid grid-cols-4 gap-3">
               <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">CRM *</label>
                  <input
                    type="text"
                    name="crm"
                    value={data.crm || ''}
                    onChange={handleChange}
                    placeholder="000000"
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  />
               </div>
               <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">UF *</label>
                  <select
                    name="crmState"
                    value={data.crmState || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
                  >
                    <option value="">--</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
               </div>
               <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">RQE</label>
                  <input
                    type="text"
                    name="rqe"
                    value={data.rqe || ''}
                    onChange={handleChange}
                    placeholder="00000"
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  />
               </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <MultiSelect 
               label="Especialidade(s)"
               value={data.specialty}
               onChange={handleMultiSelectChange('specialty')}
               suggestions={SPECIALTIES}
               placeholder="Digite vírgula para adicionar..."
             />
             <MultiSelect 
               label="Público Alvo"
               value={data.targetAudience}
               onChange={handleMultiSelectChange('targetAudience')}
               suggestions={AUDIENCES}
               placeholder="Quem você atende?"
             />
          </div>

          <MultiSelect 
             label="Principais Serviços"
             value={data.mainServices}
             onChange={handleMultiSelectChange('mainServices')}
             suggestions={SERVICES}
             placeholder="Separe os tratamentos por vírgula..."
          />

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Mini-Bio Profissional
             </label>
             <textarea
               name="bio"
               value={data.bio || ''}
               onChange={handleChange}
               placeholder="Formado na USP, com 15 anos de experiência..."
               className="w-full p-3 border border-gray-300 rounded-lg h-24 focus:ring-2 focus:ring-blue-500 resize-none text-sm"
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AddressManager 
              addresses={data.addresses || []}
              onChange={handleAddressChange}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tom de Voz</label>
              <select
                name="tone"
                value={data.tone}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Profissional e Seguro">Profissional e Seguro</option>
                <option value="Empático e Acolhedor">Empático e Acolhedor</option>
                <option value="Moderno e Objetivo">Moderno e Objetivo</option>
                <option value="Educativo e Explicativo">Educativo e Explicativo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-gray-100">
             <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email Profissional</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={data.contactEmail}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-200 rounded text-sm"
                />
             </div>
             <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">WhatsApp / Telefone</label>
                <input
                  type="text"
                  name="contactPhone"
                  value={data.contactPhone}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-200 rounded text-sm"
                />
             </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onNext}
            disabled={!isFormValid}
            className={`px-6 py-2.5 rounded-lg font-semibold text-white transition-all shadow-md ${
              isFormValid 
                ? 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Próximo: Estilo Visual
          </button>
        </div>
      </div>

      {/* Sticky Sidebar */}
      <div className="w-full md:w-80 flex flex-col gap-6 sticky top-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-2">Dica do Especialista</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Use vírgulas para separar especialidades e serviços. Adicione todos os endereços onde você atende para que o sistema gere os mapas corretamente.
          </p>
          <SeoRating data={data} />
        </div>
      </div>

    </div>
  );
};
