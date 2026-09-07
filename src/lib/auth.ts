// src/lib/auth.ts
// Autentikasi SIMAK berbasis NIP + Role dengan session manual
// Digunakan untuk: login, validasi session, middleware proteksi route

import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { cookies } from 'next/headers';

// Konfigurasi session
const SESSION_COOKIE_NAME = 'simak_session';
const SESSION_DURATION_DAYS = 7; // 7 hari
const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Hash token menggunakan SHA-256 (Web Crypto API - kompatibel Edge Runtime)
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate random session token (Web Crypto API)
 */
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Interface user yang dikembalikan setelah login/validasi
 */
export interface AuthUser {
  id: string;
  name: string;
  team: string;
  whatsapp: string;
  role: 'Admin' | 'Aktor';
  nip: string;
}

/**
 * Login dengan NIP + Role
 * @param nip Nomor Induk Pegawai
 * @param role Role user ('Admin' | 'Aktor')
 * @returns { user, token } atau { error }
 */
export async function login(nip: string, role: 'Admin' | 'Aktor'): Promise<{
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}> {
  try {
    // Cari user berdasarkan NIP dan role
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, team, whatsapp, role, nip')
      .eq('nip', nip)
      .eq('role', role)
      .limit(1);

    if (error) {
      console.error('[Auth] Login error:', error);
      return { success: false, error: 'Gagal memverifikasi login' };
    }

    if (!users || users.length === 0) {
      return { success: false, error: 'NIP atau role tidak ditemukan' };
    }

    const user = users[0] as AuthUser;

    // Generate token & simpan session ke database via RPC (bypass RLS)
    const token = generateToken();
    const tokenHash = await hashToken(token);
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

    const { error: sessionError } = await supabaseAdmin
      .rpc('create_session', {
        p_user_id: user.id,
        p_token_hash: tokenHash,
        p_expires_at: expiresAt,
      });

    if (sessionError) {
      console.error('[Auth] Gagal buat session:', sessionError);
      return { success: false, error: 'Gagal membuat session' };
    }

    console.log(`[Auth] Login berhasil: ${user.name} (${user.role})`);
    return { success: true, user, token };
  } catch (err) {
    console.error('[Auth] Exception:', err);
    return { success: false, error: 'Terjadi kesalahan server' };
  }
}

/**
 * Logout - hapus session dari database & hapus cookie
 * @param token Session token
 */
export async function logout(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const tokenHash = await hashToken(token);
    const { error } = await supabaseAdmin
      .rpc('delete_session', { p_token_hash: tokenHash });

    if (error) {
      console.error('[Auth] Logout error:', error);
      return { success: false, error: 'Gagal logout' };
    }

    return { success: true };
  } catch (err) {
    console.error('[Auth] Logout exception:', err);
    return { success: false, error: 'Terjadi kesalahan server' };
  }
}

/**
 * Validasi session dari token
 * @param token Session token
 * @returns AuthUser jika valid, null jika tidak
 */
export async function validateSession(token: string): Promise<AuthUser | null> {
  try {
    const tokenHash = await hashToken(token);

    const { data: sessions, error } = await supabaseAdmin
      .rpc('validate_session', { p_token_hash: tokenHash });

    if (error) {
      console.error('[Auth] validate_session RPC error:', error);
      return null;
    }

    if (!sessions || sessions.length === 0) {
      console.warn('[Auth] Session tidak ditemukan untuk hash:', tokenHash);
      return null;
    }

    const session = sessions[0] as any;

    return {
      id: session.user_id,
      name: session.name,
      team: session.team,
      whatsapp: session.whatsapp,
      role: session.role,
      nip: session.nip,
    };
  } catch (err) {
    console.error('[Auth] Validate session error:', err);
    return null;
  }
}

/**
 * Ambil session dari cookie (server-side)
 * Digunakan di Server Components / API Routes
 */
export async function getSession(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return null;

    return await validateSession(token);
  } catch (err) {
    console.error('[Auth] Get session error:', err);
    return null;
  }
}


/**
 * Middleware helper: cek apakah user adalah Admin
 */
export function requireAdmin(user: AuthUser | null): user is AuthUser {
  return user !== null && user.role === 'Admin';
}

/**
 * Middleware helper: cek apakah user adalah Aktor
 */
export function requireActor(user: AuthUser | null): user is AuthUser {
  return user !== null && user.role === 'Aktor';
}

/**
 * Middleware helper: cek apakah user sudah login (bisa Admin atau Aktor)
 */
export function requireAuth(user: AuthUser | null): user is AuthUser {
  return user !== null;
}

/**
 * Get user dari request header (untuk API routes)
 * Header: Authorization: Bearer <token>
 */
export async function getUserFromRequest(request: Request): Promise<AuthUser | null> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Coba ambil dari cookie
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
      if (match) {
        return await validateSession(match[1]);
      }
    }
    return null;
  }

  const token = authHeader.substring(7); // hapus "Bearer "
  return await validateSession(token);
}