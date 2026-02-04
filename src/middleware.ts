import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Helper function containing original Proxy logic (Inlined to avoid build/trace issues)
function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // 1. Admin Protection
  if (path.startsWith('/sys_9e4a') || path.startsWith('/api/sys_9e4a')) {
    const adminSession = request.cookies.get('admin_session');
    
    // Allow public access to login page and login API
    if (path === '/sys_9e4a' || path === '/api/sys_9e4a/login') {
      // If going to login page but already logged in, redirect to dashboard
      if (path === '/sys_9e4a' && adminSession) {
        return NextResponse.redirect(new URL('/sys_9e4a/dashboard', request.url));
      }
      return NextResponse.next();
    }

    // Protect all other admin routes
    if (!adminSession) {
      if (path.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/sys_9e4a', request.url));
    }
  }

  // 2. API "Hiding" / Basic Protection (Obfuscation)
  if (path.startsWith('/api/Participant')) {
    const userAgent = request.headers.get('user-agent');
    if (!userAgent) {
       return NextResponse.json({ error: 'Access Denied: Missing Headers' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export function middleware(request: NextRequest) {
  // 1. Run the existing proxy logic first
  const response = proxy(request);

  // 2. SEO Check: Prevent Indexing on Staging/Vercel domains
  // We check the HOST header.
  const host = request.headers.get('host') || '';
  const prodDomain = 'game.yesbharath.org';
  
  // Apply noindex tag if NOT production domain (and not localhost)
  if (host !== prodDomain && !host.includes('localhost')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  // 3. Security Headers (CSP)
  // Allow GA, Fonts, and internal scripts
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://www.googletagmanager.com;
    connect-src 'self' https://www.google-analytics.com https://analytics.google.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' data: https://fonts.gstatic.com;
    img-src 'self' data: blob: https://*.googletagmanager.com https://www.googletagmanager.com https://*.transparenttextures.com https://www.transparenttextures.com;
    frame-src 'self';
  `;

  response.headers.set(
    'Content-Security-Policy',
    cspHeader.replace(/\s{2,}/g, ' ').trim()
  );

  return response;
}

// Override config to run on ALL routes for SEO protection
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
