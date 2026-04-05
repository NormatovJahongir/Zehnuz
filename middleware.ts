import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from './lib/auth';

// 1. Ochiq yo'llar ro'yxati
const PUBLIC_EXACT_PATHS = ['/', '/login', '/register'];
const PUBLIC_PREFIX_PATHS = ['/api/login', '/api/register', '/api/bot', '/api/health', '/api/market/centers'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 2. Statik fayllar va Next.js ichki so'rovlarini birinchi navbatda o'tkazib yuboramiz
  // Bu qism sayt tezligiga to'g'ridan-to'g'ri ta'sir qiladi
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/static') ||
    pathname.startsWith('/public') ||
    pathname.includes('favicon.ico') ||
    pathname.match(/\.(.*)$/) // Har qanday .jpg, .png, .css fayllar uchun
  ) {
    return NextResponse.next();
  }

  // 3. Ochiq sahifalar va ochiq API larni tekshiramiz
  const isPublicExact = PUBLIC_EXACT_PATHS.includes(pathname);
  const isPublicPrefix = PUBLIC_PREFIX_PATHS.some(p => pathname.startsWith(p));

  if (isPublicExact || isPublicPrefix) {
    return NextResponse.next();
  }

  // 4. Sessiyani tekshirish (JWT decode)
  const session = await getSessionFromRequest(req);

  // 5. Sessiya bo'lmasa - Login sahifasiga qaytarish
  if (!session) {
    // Agar foydalanuvchi allaqachon login sahifasida bo'lmasa (cheksiz loopni oldini olish)
    if (pathname !== '/login') {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      // Qayerdan kelayotganini saqlab qolamiz (keyinchalik qaytarish uchun)
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 6. Role-based (Ruxsatlar) himoyasi
  const { role } = session;

  // Admin yo'llari
  if (pathname.startsWith('/admin') && role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Center yo'llari
  if (pathname.startsWith('/center') && !['ADMIN', 'SUPER_ADMIN'].includes(role)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Teacher yo'llari
  if (pathname.startsWith('/teacher') && !['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Student yo'llari
  if (pathname.startsWith('/student') && role !== 'STUDENT') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 7. Sessiya ma'lumotlarini Header orqali uzatish (API yo'llari uchun juda qulay)
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', String(session.userId));
  requestHeaders.set('x-user-role', session.role);
  if (session.centerId) {
    requestHeaders.set('x-center-id', String(session.centerId));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// 8. Matcher - Middleware qaysi yo'llarda ishlashini belgilaydi
export const config = {
  matcher: [
    /*
     * Quyidagi yo'llardan tashqari barcha yo'llarda ishlaydi:
     * - api (ochiq API lardan tashqari hamma API himoyalangan)
     * - _next/static (statik fayllar)
     * - _next/image (rasmlar)
     * - favicon.ico (belgi)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|static).*)',
  ],
};
