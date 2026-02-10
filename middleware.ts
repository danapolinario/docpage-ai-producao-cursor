import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware do Vercel Edge para interceptar requisições de subdomínios
 * e garantir que passem pela API antes de servir arquivos estáticos
 * 
 * Este middleware é executado ANTES do Vercel servir arquivos estáticos,
 * garantindo que subdomínios sempre passem pela API
 */

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - já estão corretas)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - static assets (images, fonts, etc)
     */
    '/((?!api|_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0].toLowerCase();
  
  // Verificar se é subdomínio de docpage.com.br
  if (hostname.endsWith('.docpage.com.br')) {
    const parts = hostname.split('.');
    if (parts.length >= 4) {
      const subdomain = parts[0];
      // Ignorar subdomínios especiais
      if (subdomain && subdomain !== 'www' && subdomain !== 'docpage') {
        const pathname = request.nextUrl.pathname;
        
        // Se for index.html ou raiz, reescrever para /api
        if (pathname === '/' || pathname === '/index.html') {
          const url = request.nextUrl.clone();
          url.pathname = '/api';
          return NextResponse.rewrite(url);
        }
        
        // Para outros caminhos que não começam com /api, reescrever para /api/:path
        if (!pathname.startsWith('/api')) {
          const url = request.nextUrl.clone();
          url.pathname = `/api${pathname}`;
          return NextResponse.rewrite(url);
        }
      }
    }
  }
  
  // Para outros hosts, permitir comportamento padrão
  return NextResponse.next();
}
