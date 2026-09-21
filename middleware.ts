import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/session-crypto';

// Public endpoints that do not require an active admin session
const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/time',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow login page (redirect to dashboard if already authenticated)
  if (pathname === '/login') {
    const session = request.cookies.get('admin_session');
    if (session?.value) {
      try {
        const sessionData = await verifySessionToken(session.value);
        if (sessionData?.email && sessionData?.isAdmin) {
          return NextResponse.redirect(new URL('/', request.url));
        }
      } catch {
        // Invalid session, allow access to login page
      }
    }
    return NextResponse.next();
  }

  // 2. Allow whitelisted public API routes
  if (PUBLIC_API_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.next();
  }

  // 3. For all other routes (pages and API routes), check session cookie
  const isApiRoute = pathname.startsWith('/api/');
  const session = request.cookies.get('admin_session');

  if (!session?.value) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const sessionData = await verifySessionToken(session.value);
    if (!sessionData || !sessionData.email || !sessionData.isAdmin) {
      if (isApiRoute) {
        return NextResponse.json({ error: 'Unauthorized. Invalid session.' }, { status: 401 });
      }
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized. Session verification failed.' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
