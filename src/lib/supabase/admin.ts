import { createClient } from '@supabase/supabase-js';

// PENTING: file ini HANYA boleh diimport di server-side code (API routes / Server Actions).
// JANGAN pernah import ini di client component ('use client') — service role key
// bisa bypass SEMUA RLS policy, kalau bocor ke browser siapa saja bisa akses/ubah semua data.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Supabase URL dan Service Role Key harus diset. ' +
    'Pastikan SUPABASE_SERVICE_ROLE_KEY ada di .env.local dan Vercel Environment Variables ' +
    '(TANPA prefix NEXT_PUBLIC_, karena ini rahasia dan tidak boleh sampai ke browser).'
  );
}

/**
 * Client Supabase dengan hak akses penuh (bypass RLS).
 *
 * Kenapa ini dibutuhkan: sistem auth admin SIMAK/buku-tamu ini pakai middleware
 * custom (bukan Supabase Auth session), sehingga supabase.auth.getUser() di server
 * tidak akan pernah mengenali user yang login lewat middleware — RLS berbasis
 * `to authenticated` jadi tidak relevan untuk route ini.
 *
 * Otorisasi untuk route yang memakai client ini SEPENUHNYA bergantung pada
 * middleware yang mengisi header x-user-id, x-user-role, dst. Pastikan middleware
 * benar-benar memvalidasi token/session sebelum mengisi header tersebut — jangan
 * sampai ada endpoint yang bisa dipanggil langsung tanpa lewat middleware ini,
 * karena begitu request sampai ke sini, tidak ada lagi pengecekan RLS yang menahan.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});