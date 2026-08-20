import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Bypass static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/02.png' ||
    pathname === '/logo.png' ||
    pathname === '/favicon.ico' ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js')
  ) {
    return NextResponse.next();
  }

  // 2. Route Bypass for Maintenance Check
  const isAuthOrAdminRoute = 
    pathname.startsWith('/maintenance') ||
    pathname.startsWith('/api/maintenance') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/admin');

  // 3. Extract Client IP
  const xForwardedFor = request.headers.get('x-forwarded-for');
  let clientIp = '127.0.0.1';
  if (xForwardedFor) {
    clientIp = xForwardedFor.split(',')[0].trim();
  } else {
    const realIp = request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip');
    if (realIp) clientIp = realIp.trim();
  }

  // 4. Maintenance Mode Check
  const isMaintenanceActive = request.cookies.get('hanzoro_maintenance_active')?.value === 'true';
  const isAdminSession = request.cookies.get('hanzoro_master_admin')?.value === 'true' || request.cookies.get('admin_bypass')?.value === 'true';

  if (isMaintenanceActive && !isAdminSession && !isAuthOrAdminRoute) {
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }

  // 5. Forward request with x-client-ip header
  const response = NextResponse.next();
  response.headers.set('x-client-ip', clientIp);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|02.png|logo.png).*)',
  ],
};
