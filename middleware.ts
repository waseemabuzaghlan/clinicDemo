import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isTokenExpired, parseToken } from './lib/auth-server';

// Define route access patterns
const publicRoutes = ['/login', '/api/auth/login'];
const adminRoutes = ['/admin'];
const doctorRoutes = [
  '/',
  '/patients',
  '/visits',
  '/appointments',
  '/doctor-availability',
  '/doctor-slots'
];
const receptionistRoutes = [
  '/',
  '/appointments',
  '/patients',
  '/visits',
  '/doctor-availability',
  '/doctor-slots'
];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicPath = publicRoutes.some(route => path.startsWith(route));
  const token = request.cookies.get('token')?.value;
  const isLoginPage = path === '/login';

  // Check if token exists and is not expired
  const isValidToken = token && !isTokenExpired(token);

  // Allow access to public paths without authentication
  if (isPublicPath && !isValidToken) {
    return NextResponse.next();
  }

  // Redirect to login if no valid token and trying to access protected route
  if (!isValidToken && !isLoginPage) {
    const returnUrl = encodeURIComponent(request.nextUrl.pathname);
    return NextResponse.redirect(new URL(`/login?returnUrl=${returnUrl}`, request.url));
  }

  // Redirect to home if user is logged in and tries to access login page
  if (isValidToken && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Check role-based access
  if (isValidToken && token) {
    const decoded = parseToken(token);
    const userRole = decoded?.role?.toLowerCase();

    if (userRole) {
      // Admin has access to everything
      if (userRole === 'admin') {
        return NextResponse.next();
      }

      // Doctor access
      if (userRole === 'doctor') {
        if (doctorRoutes.some(route => path.startsWith(route))) {
          return NextResponse.next();
        }
        return NextResponse.redirect(new URL('/', request.url));
      }

      // Receptionist access
      if (userRole === 'receptionist') {
        // Block access to admin routes
        if (adminRoutes.some(route => path.startsWith(route))) {
          return NextResponse.redirect(new URL('/', request.url));
        }
        // Allow access to receptionist routes
        if (receptionistRoutes.some(route => path.startsWith(route))) {
          return NextResponse.next();
        }
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};