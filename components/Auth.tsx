import React, { useState } from 'react';
import { sendOTP, verifyCode, resendOTP } from '../services/auth';

interface Props {
  onSuccess?: () => void;
}

export const Auth: React.FC<Props> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [name, setName] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [canResendCode, setCanResendCode] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Countdown para reenvio de código
  React.useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0 && isCodeSent) {
      setCanResendCode(true);
    }
  }, [resendCountdown, isCodeSent]);

  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!email || !email.includes('@')) {
      setError('Por favor, insira um email válido.');
      setLoading(false);
      return;
    }

    try {
      await sendOTP(email, name || undefined);
      setIsCodeSent(true);
      setCanResendCode(false);
      setResendCountdown(60); // 60 segundos antes de poder reenviar
      setSuccess('Código enviado! Verifique seu email.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar código. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!otpCode || otpCode.length !== 6) {
      setError('Por favor, insira o código de 6 dígitos.');
      setLoading(false);
      return;
    }

    try {
      await verifyCode(email, otpCode);
      setSuccess('Autenticação realizada com sucesso!');
      setTimeout(() => {
        onSuccess?.();
      }, 500);
    } catch (err: any) {
      if (err.message?.includes('token') || err.message?.includes('código')) {
        setError('Código inválido ou expirado. Por favor, solicite um novo código.');
      } else {
        setError(err.message || 'Erro ao verificar código. Por favor, tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResendCode) return;
    
    setLoading(true);
    setError(null);
    setCanResendCode(false);

    try {
      await resendOTP(email);
      setResendCountdown(60);
      setSuccess('Código reenviado! Verifique seu email.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar código. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-8">
      <div className="w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-500 rounded-xl shadow-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">DP</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {isCodeSent ? 'Verificar Código' : 'Acessar Conta'}
          </h2>
          <p className="text-gray-500">
            {isCodeSent
              ? 'Digite o código de 6 dígitos enviado para seu email'
              : 'Digite seu email para receber um código de acesso'}
          </p>
        </div>

        {/* Mensagens de Erro/Sucesso */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Formulário */}
        {!isCodeSent ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome (opcional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Seu nome"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="seu@email.com"
                required
                disabled={loading}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
              <p className="font-medium mb-1">🔐 Autenticação Segura</p>
              <p>Enviaremos um código de 6 dígitos para seu email. Não é necessário senha!</p>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !email.includes('@')}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Enviando código...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Enviar Código
                </span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700 flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              <div className="flex-1">
                <p className="font-medium mb-1">Código enviado!</p>
                <p>Verifique seu email <strong>{email}</strong> e insira o código de 6 dígitos abaixo.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código de Verificação
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').substring(0, 6);
                  setOtpCode(value);
                  setError(null);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl font-mono tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
                disabled={loading}
                autoFocus
              />
              {otpCode.length > 0 && otpCode.length < 6 && (
                <p className="mt-1 text-xs text-gray-500">Digite o código de 6 dígitos</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-bold hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verificando...
                  </span>
                ) : (
                  'Verificar Código'
                )}
              </button>

              {canResendCode ? (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : 'Reenviar'}
                </button>
              ) : (
                <div className="px-4 py-3 bg-gray-50 text-gray-500 text-sm font-medium rounded-lg flex items-center justify-center min-w-[80px]">
                  {resendCountdown}s
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsCodeSent(false);
                setOtpCode('');
                setError(null);
                setSuccess(null);
                setResendCountdown(0);
                setCanResendCode(false);
              }}
              className="w-full py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              disabled={loading}
            >
              ← Alterar email
            </button>
          </form>
        )}

        {/* Info adicional */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade
          </p>
        </div>
      </div>
    </div>
  );
};
