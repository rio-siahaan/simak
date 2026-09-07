// src/middleware.ts
// Middleware Next.js untuk proteksi route berdasarkan autentikasi NIP + Role
// Dipanggil sebelum request masuk ke route

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateSession } from '@/lib/auth';

// ============================================
// KONFIGURASI ROUTE YANG DILINDUNGI
// ============================================

// Route yang HANYA bisa diakses Admin
const ADMIN_ONLY_ROUTES = [
  '/admin/kalender/tambah',
  '/admin/kegiatan/tambah',
  '/admin/pengguna',
  // '/api/activities', // POST, PATCH, DELETE
  // '/api/users',      // POST, PATCH, DELETE
];

// Route yang bisa diakses Admin DAN Aktor (login required)
const AUTH_ROUTES = [
  '/admin/kalender',
  '/admin/kegiatan',
  '/admin/dashboard',
  '/admin/laporan',
  '/admin/profil',
  '/api/activities', // GET
  '/api/notifications',
  '/bukti',          // Halaman upload bukti dukung
];

// Route public (tidak perlu login)
const PUBLIC_ROUTES = [
  '/',               // Landing page
  '/login',          // Halaman login
  '/api/auth/login', // API login
  '/api/auth/logout', // API logout
  '/api/whatsapp/test', // Test WhatsApp (untuk debugging)
  '/api/whatsapp/stats', // Stats WhatsApp
  '/api/cron/update-status', // Cron job (dipanggil sistem)
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Cek apakah path cocok dengan pola route
 */
function matchRoute(pathname: string, routes: string[]): boolean {
  return routes.some(route => {
    // Exact match
    if (pathname === route) return true;
    // Prefix match (e.g., /admin/kalender matches /admin/kalender/tambah)
    if (pathname.startsWith(route + '/')) return true;
    // Prefix match tanpa trailing slash
    if (pathname === route.replace(/\/$/, '')) return true;
    return false;
  });
}

/**
 * Cek apakah route public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (pathname === route) return true;
    if (pathname.startsWith(route + '/')) return true;
    return false;
  });
}

/**
 * Cek apakah route butuh auth (Admin atau Aktor)
 */
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => {
    if (pathname === route) return true;
    if (pathname.startsWith(route + '/')) return true;
    return false;
  });
}

/**
 * Cek apakah route Admin only
 */
function isAdminOnlyRoute(pathname: string): boolean {
  return ADMIN_ONLY_ROUTES.some(route => {
    if (pathname === route) return true;
    if (pathname.startsWith(route + '/')) return true;
    return false;
  });
}

/**
 * Cek method apakah mutating (POST, PATCH, PUT, DELETE)
 */
function isMutatingMethod(method: string): boolean {
  return ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method);
}

// ============================================
// MIDDLEWARE UTAMA
// ============================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // 1. Skip public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // 2. Ambil session token dari cookie atau header
  let token: string | null = null;

  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/simak_session=([^;]+)/);
    if (match) token = match[1];
  }

  // Fallback ke Authorization header
  if (!token) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // console.log('[Middleware] Raw cookie header:', cookieHeader);
  // console.log('[Middleware] Extracted token:', token);

  // 3. Validasi session
  const user = token ? await validateSession(token) : null;

  // 4. Route butuh auth tapi user tidak login
  if (isAuthRoute(pathname) && !user) {
    // Redirect ke login dengan redirect_url
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Route Admin only tapi user bukan Admin
  if (isAdminOnlyRoute(pathname) && user && user.role !== 'Admin') {
    // Untuk API: return 403
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Admin yang dapat mengakses halaman ini' },
        { status: 403 }
      );
    }
    // Untuk page: redirect ke dashboard dengan error
    const dashboardUrl = new URL('/admin/dashboard', request.url);
    dashboardUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(dashboardUrl);
  }

  // 6. API routes mutating tapi bukan Admin (kecuali endpoint khusus)
  if (pathname.startsWith('/api/') && isMutatingMethod(method)) {
    // Kecuali endpoint auth
    if (pathname.startsWith('/api/auth/')) {
      return NextResponse.next();
    }
    // Hanya Admin yang bisa mutating data
    if (!user || user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Akses ditolak: Operasi ini memerlukan hak Admin' },
        { status: 403 }
      );
    }
  }

  // 7. Tambahkan user info ke request headers untuk dipakai di API/Server Components
  const requestHeaders = new Headers(request.headers);
  if (user) {
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-name', user.name);
    requestHeaders.set('x-user-role', user.role);
    requestHeaders.set('x-user-team', user.team);
    requestHeaders.set('x-user-nip', user.nip);
  }

  // 8. Lanjutkan request dengan headers yang sudah ditambah
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// ============================================
// KONFIGURASI MATCHER
// ============================================

export const config = {
  // Match semua route KECUALI:
  // - _next/static, _next/image, favicon.ico, dll (asset statis)
  // - api routes yang public sudah di-handle di dalam middleware
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (login, logout - public)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - *.png, *.jpg, *.svg, *.ico (common static assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)',
  ],
};