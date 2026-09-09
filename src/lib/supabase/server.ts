import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Validasi environment variables — sama seperti lib/supabase.ts,
// tapi client ini KHUSUS dipakai di server (API routes / Server Components)
// karena dia perlu baca cookie sesi user yang login lewat browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL dan Anon Key harus diset di .env.local. ' +
    'Silakan tambahkan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

/**
 * Buat Supabase client untuk dipakai di server (API route handler, Server Component,
 * atau Server Action). Beda dengan `lib/supabase.ts` (client polos untuk browser),
 * client ini membaca cookie sesi user lewat next/headers, sehingga
 * `supabase.auth.getUser()` dan RLS policy berbasis `auth.role() = 'authenticated'`
 * bisa berfungsi dengan benar di sisi server.
 *
 * WAJIB dipanggil dengan `await` karena `cookies()` dari next/headers bersifat async
 * di App Router versi terbaru.
 *
 * Contoh pemakaian di API route:
 *   const supabase = await createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll dipanggil dari Server Component (bukan Route Handler/Server Action).
          // Ini bisa diabaikan SELAMA ada middleware yang refresh session —
          // kalau belum ada middleware session-refresh, sesi bisa "basi" di edge case tertentu.
        }
      },
    },
  });
}