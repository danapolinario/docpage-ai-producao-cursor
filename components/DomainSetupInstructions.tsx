import React from 'react';

interface Props {
  domain?: string;
  onClose?: () => void;
}

/**
 * Guia de configuração de domínio para o admin DocPage.
 * Ordem: 1) Vercel, 2) Registro.br
 */
export const DomainSetupInstructions: React.FC<Props> = ({ domain, onClose }) => {
  const exampleDomain = domain || 'drfulano.com.br';

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Guia de configuração de domínio</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-6 space-y-4">
        <p className="text-sm text-gray-600">
          Siga os passos na ordem. O domínio precisa estar configurado no Vercel e no Registro.br antes de publicar.
        </p>

        {/* 1. Vercel */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-slate-50">
            <span className="font-medium text-gray-900">1. Vercel</span>
          </div>
          <div className="px-4 py-3 border-t border-gray-200 bg-white">
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>
                Acessar <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Vercel Dashboard</a> e selecionar o projeto DocPage AI
              </li>
              <li>Ir em <strong>Settings</strong> → <strong>Domains</strong></li>
              <li>Clicar em <strong>Add</strong> e informar o domínio (ex: <code className="bg-gray-100 px-1 rounded">{exampleDomain}</code>)</li>
              <li>Adicionar também <code className="bg-gray-100 px-1 rounded">www.{exampleDomain}</code> se o Vercel sugerir</li>
              <li>Copiar os registros DNS exibidos pelo Vercel</li>
              <li>Configurar esses registros no Registro.br (passo 2 abaixo)</li>
              <li>Aguardar verificação no Vercel (status &quot;Valid Configuration&quot;)</li>
            </ol>
            <p className="mt-2 text-xs text-gray-500">
              Valores genéricos: CNAME → <code>cname.vercel-dns.com</code>, A → <code>76.76.21.21</code>. O Vercel pode exibir valores específicos do projeto.
            </p>
          </div>
        </div>

        {/* 2. Registro.br */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-slate-50">
            <span className="font-medium text-gray-900">2. Registro.br</span>
          </div>
          <div className="px-4 py-3 border-t border-gray-200 bg-white">
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>
                Acessar <a href="https://registro.br" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">registro.br</a> e fazer login (com credenciais do domínio)
              </li>
              <li>Selecionar o domínio na lista</li>
              <li>Ir em &quot;Alterar zona&quot; ou &quot;Editar zona DNS&quot; e ativar &quot;Modo avançado&quot;</li>
              <li>
                Adicionar registros conforme o Vercel indicar:
                <ul className="mt-2 ml-4 list-disc list-inside space-y-1 text-gray-600">
                  <li><strong>Para www:</strong> CNAME | Nome: <code>www</code> | Destino: <code>cname.vercel-dns.com</code></li>
                  <li><strong>Para domínio raiz (apex):</strong> A | Nome: <code>@</code> | Destino: <code>76.76.21.21</code></li>
                </ul>
              </li>
              <li>Salvar e aguardar propagação (até 48h)</li>
              <li>
                Verificar em <a href="https://www.whatsmydns.net" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">whatsmydns.net</a>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
