import type { NextConfig } from "next";

// Baca hostname Supabase dari env (mis. "sfgxbsdobzrjgdjfhzxi.supabase.co")
// supaya next/image bisa memuat foto pegawai dari Supabase Storage.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
let supabaseHost = "";
try {
  supabaseHost = new URL(supabaseUrl).hostname;
} catch {
  supabaseHost = "";
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
          },
        ]
      : [],
  },
};

export default nextConfig;
