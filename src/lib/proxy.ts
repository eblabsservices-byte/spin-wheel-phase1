import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
// 1. Admin Protection (Renamed)
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

// Config removed to avoid conflict with root middleware.ts
