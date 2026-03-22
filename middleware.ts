import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from './lib/auth';

const PUBLIC_PATHS = ['/login', '/register', '/api/login', '/api/register', '/api/bot','/api/health'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(req);

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Role-based route protection
  const { role, centerId } = session;

  if (pathname.startsWith('/admin') && role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (pathname.startsWith('/center') && !['ADMIN', 'SUPER_ADMIN'].includes(role)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (pathname.startsWith('/teacher') && !['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (pathname.startsWith('/student') && role !== 'STUDENT') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Forward session info to API routes
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', String(session.userId));
  requestHeaders.set('x-user-role', session.role);
  if (session.centerId) requestHeaders.set('x-center-id', session.centerId);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
