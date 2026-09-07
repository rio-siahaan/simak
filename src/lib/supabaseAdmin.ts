import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Admin Client (Service Role)
 *
 * HANYA untuk penggunaan di SERVER-SIDE (API routes, Server Actions, lib/server-only).
 * JANGAN import di Client Components atau file yang bisa ter-bundle ke browser.
 *
 * Service Role Key bypasses RLS — gunakan hanya untuk operasi admin/internal
 * seperti create_session, delete_session, validate_session yang butuh insert/update
 * ke tabel user_sessions yang dilindungi RLS policy service_role only.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Supabase Admin Client: NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY ' +
    'harus diset di .env.local. SUPABASE_SERVICE_ROLE_KEY TIDAK boleh pakai prefix NEXT_PUBLIC_ ' +
    '(karena akan ter-expose ke browser — ini kesalahan fatal keamanan).'
  );
}

// Create Supabase client dengan Service Role Key (bypass RLS)
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});