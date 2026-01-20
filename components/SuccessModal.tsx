import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Loader2 } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cpf: string) => void;
  isLoading?: boolean;
  isRedirecting?: boolean;
}

export default function SuccessModal({ isOpen, onClose, onSubmit, isLoading = false, isRedirecting = false }: SuccessModalProps) {
  const [cpf, setCpf] = useState('');
  const [error, setError] = useState('');
  const [cpfSubmitted, setCpfSubmitted] = useState(false);

  // Resetar estado quando modal abrir
  useEffect(() => {
    if (isOpen) {
      setCpfSubmitted(false);
      setCpf('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatCPF = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limited = numbers.slice(0, 11);
    
    // Formata: 000.000.000-00
    if (limited.length <= 3) return limited;
    if (limited.length <= 6) return `${limited.slice(0, 3)}.${limited.slice(3)}`;
    if (limited.length <= 9) return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
  };

  const validateCPF = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, '');
    
    if (numbers.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(numbers)) return false;
    
    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(numbers.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(numbers.charAt(10))) return false;
    
    return true;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cpf) {
      setError('Por favor, insira seu CPF');
      return;
    }
    
    if (!validateCPF(cpf)) {
      setError('CPF inválido. Verifique os números digitados.');
      return;
    }
    
    // Remove formatação antes de enviar
    const cleanCPF = cpf.replace(/\D/g, '');
    setCpfSubmitted(true);
    onSubmit(cleanCPF);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header com ícone de sucesso */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Assinatura Concluída!
          </h2>
          <p className="text-green-50 text-sm">
            Seu site está sendo preparado
          </p>
        </div>

        {/* Corpo do modal */}
        {cpfSubmitted || isRedirecting ? (
          <div className="px-6 py-8 text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              CPF salvo com sucesso!
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Redirecionando para o dashboard...
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-xs text-blue-800">
                Aguarde enquanto preparamos seu painel de controle.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-6">
            <div className="mb-6">
              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                Para finalizar, precisamos do seu <span className="font-semibold">CPF</span> para que o domínio escolhido fique registrado em seu nome.
              </p>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPF
              </label>
              <input
                type="text"
                value={cpf}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  error 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                disabled={isLoading}
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {isLoading ? 'Salvando...' : 'Continuar'}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Seus dados estão protegidos e serão usados apenas para fins de registro do domínio.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
